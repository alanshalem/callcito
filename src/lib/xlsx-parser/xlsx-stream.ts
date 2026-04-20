/**
 * XLSX Streaming Parser
 * Memory-efficient parsing for large Excel files
 *
 * Uses generators to yield rows one at a time instead of loading
 * the entire sheet into memory.
 */

import { parseSharedStrings, parseWorkbook } from "./sheets";
import type { CellValue } from "./types";
import { XlsxSheetNotFoundError } from "./utils/errors";
import { findElements, getAttribute, parseXml } from "./xml";
import { ZipReader } from "./zip";

/**
 * Cell data from streaming parser
 */
export interface StreamCell {
  row: number;
  col: number;
  value: CellValue;
  ref: string;
}

/**
 * Row data from streaming parser
 */
export interface StreamRow {
  rowIndex: number;
  cells: StreamCell[];
}

/**
 * Options for streaming parser
 */
export interface StreamOptions {
  /** Start row (0-indexed, default 0) */
  startRow?: number;
  /** End row (0-indexed, default all) */
  endRow?: number;
  /** Chunk size for processing (rows per chunk) */
  chunkSize?: number;
}

/**
 * Column letter to index converter (A=0, B=1, AA=26, etc.)
 */
function colLetterToIndex(letters: string): number {
  let result = 0;
  for (let i = 0; i < letters.length; i++) {
    result = result * 26 + ((letters.codePointAt(i) ?? 0) - 64);
  }
  return result - 1;
}

/**
 * Parse cell reference to row and column indices
 */
function parseCellRef(ref: string): { row: number; col: number } {
  const match = /^([A-Z]+)(\d+)$/.exec(ref);
  if (!match) return { row: 0, col: 0 };

  return {
    col: colLetterToIndex(match[1]),
    row: Number.parseInt(match[2], 10) - 1,
  };
}

/**
 * Parse cell value from XML element
 */
function parseCellValue(
  cellXml: string,
  sharedStrings: string[]
): CellValue {
  // Extract type attribute
  const typeMatch = /\bt="([^"]+)"/.exec(cellXml);
  const type = typeMatch ? typeMatch[1] : "n";

  // Extract value
  const valueMatch = /<v>([^<]*)<\/v>/.exec(cellXml);
  if (!valueMatch) {
    // Check for inline string
    const inlineMatch = /<is><t>([^<]*)<\/t><\/is>/.exec(cellXml);
    if (inlineMatch) {
      return decodeXmlEntities(inlineMatch[1]);
    }
    return null;
  }

  const rawValue = valueMatch[1];

  switch (type) {
    case "s": { // Shared string
      const idx = Number.parseInt(rawValue, 10);
      return sharedStrings[idx] ?? null;
    }

    case "b": // Boolean
      return rawValue === "1";

    case "e": // Error
      return rawValue;

    case "str": // Formula result as string
    case "inlineStr":
      return decodeXmlEntities(rawValue);

    default: { // Number (including dates)
      const num = Number.parseFloat(rawValue);
      return Number.isNaN(num) ? rawValue : num;
    }
  }
}

/**
 * Decode XML entities
 */
function decodeXmlEntities(str: string): string {
  return str
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'")
    .replaceAll(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number.parseInt(code, 10)))
    .replaceAll(/&#x([0-9A-Fa-f]+);/g, (_, code) =>
      String.fromCodePoint(Number.parseInt(code, 16))
    );
}

/**
 * Streaming XLSX reader
 * Processes worksheets row by row to minimize memory usage
 */
export class XlsxStream {
  private readonly zip: ZipReader;
  private readonly sheetNames: string[] = [];
  private readonly sheetPaths: Map<string, string> = new Map();
  private sharedStrings: string[] = [];
  private sharedStringsLoaded = false;

  constructor(buffer: Uint8Array) {
    this.zip = new ZipReader(buffer);
    this.parseWorkbookInfo();
  }

  /**
   * Parse workbook.xml to get sheet info
   */
  private parseWorkbookInfo(): void {
    const workbookXml = this.zip.getFileAsString("xl/workbook.xml");
    const sheets = parseWorkbook(workbookXml);

    // Get relationships
    const relsXml = this.zip.getFileAsString("xl/_rels/workbook.xml.rels");
    const relsRoot = parseXml(relsXml);
    const relationships = findElements(relsRoot, "Relationship");

    const rIdToPath = new Map<string, string>();
    for (const rel of relationships) {
      const id = getAttribute(rel, "Id");
      const target = getAttribute(rel, "Target");
      if (id && target) {
        rIdToPath.set(id, target.startsWith("/") ? target.slice(1) : `xl/${target}`);
      }
    }

    for (const sheet of sheets) {
      this.sheetNames.push(sheet.name);
      const path = rIdToPath.get(sheet.rId);
      if (path) {
        this.sheetPaths.set(sheet.name, path);
      }
    }
  }

  /**
   * Load shared strings on demand
   */
  private ensureSharedStrings(): void {
    if (this.sharedStringsLoaded) return;

    if (this.zip.hasFile("xl/sharedStrings.xml")) {
      const ssXml = this.zip.getFileAsString("xl/sharedStrings.xml");
      this.sharedStrings = parseSharedStrings(ssXml);
    }
    this.sharedStringsLoaded = true;
  }

  /**
   * Get list of sheet names
   */
  get SheetNames(): string[] {
    return [...this.sheetNames];
  }

  /**
   * Stream rows from a worksheet
   * @param sheetName - Name of the sheet to stream
   * @param options - Streaming options
   * @yields StreamRow for each row in the sheet
   */
  *streamRows(
    sheetName: string,
    options: StreamOptions = {}
  ): Generator<StreamRow, void, unknown> {
    const path = this.sheetPaths.get(sheetName);
    if (!path) {
      throw new XlsxSheetNotFoundError(sheetName, this.sheetNames);
    }

    this.ensureSharedStrings();

    const xml = this.zip.getFileAsString(path);
    const { startRow = 0, endRow = Infinity } = options;

    // Use regex to find row elements for memory efficiency
    const rowPattern = /<row[^>]*r="(\d+)"[^>]*>([\s\S]*?)<\/row>/g;
    let match;

    while ((match = rowPattern.exec(xml)) !== null) {
      const rowIndex = Number.parseInt(match[1], 10) - 1;

      // Skip rows outside the range
      if (rowIndex < startRow) continue;
      if (rowIndex > endRow) break;

      const rowXml = match[2];
      const cells: StreamCell[] = [];

      // Parse cells in this row
      const cellPattern = /<c\s+r="([A-Z]+\d+)"([^>]*)(?:\/>|>([\s\S]*?)<\/c>)/g;
      let cellMatch;

      while ((cellMatch = cellPattern.exec(rowXml)) !== null) {
        const ref = cellMatch[1];
        const cellAttrs = cellMatch[2];
        const cellContent = cellMatch[3] || "";
        const fullCellXml = `<c r="${ref}"${cellAttrs}>${cellContent}</c>`;

        const { row, col } = parseCellRef(ref);
        const value = parseCellValue(fullCellXml, this.sharedStrings);

        if (value !== null) {
          cells.push({ row, col, value, ref });
        }
      }

      if (cells.length > 0) {
        yield { rowIndex, cells };
      }
    }
  }

  /**
   * Stream rows as arrays (more convenient format)
   * @param sheetName - Name of the sheet to stream
   * @param options - Streaming options
   * @yields Array of cell values for each row
   */
  *streamRowsAsArrays(
    sheetName: string,
    options: StreamOptions = {}
  ): Generator<CellValue[], void, unknown> {
    for (const row of this.streamRows(sheetName, options)) {
      // Find max column
      let maxCol = 0;
      for (const cell of row.cells) {
        if (cell.col > maxCol) maxCol = cell.col;
      }

      // Create array with correct size
      const arr: CellValue[] = new Array(maxCol + 1).fill(null);
      for (const cell of row.cells) {
        arr[cell.col] = cell.value;
      }

      yield arr;
    }
  }

  /**
   * Process rows in chunks
   * @param sheetName - Name of the sheet
   * @param chunkSize - Number of rows per chunk
   * @param processor - Function to process each chunk
   */
  async processInChunks(
    sheetName: string,
    chunkSize: number,
    processor: (rows: CellValue[][], startIndex: number) => Promise<void> | void
  ): Promise<void> {
    let chunk: CellValue[][] = [];
    let startIndex = 0;
    let currentIndex = 0;

    for (const row of this.streamRowsAsArrays(sheetName)) {
      if (chunk.length === 0) {
        startIndex = currentIndex;
      }

      chunk.push(row);
      currentIndex++;

      if (chunk.length >= chunkSize) {
        await processor(chunk, startIndex);
        chunk = [];
      }
    }

    // Process remaining rows
    if (chunk.length > 0) {
      await processor(chunk, startIndex);
    }
  }

  /**
   * Count rows in a sheet without loading all data
   * @param sheetName - Name of the sheet
   * @returns Number of rows
   */
  countRows(sheetName: string): number {
    const path = this.sheetPaths.get(sheetName);
    if (!path) {
      throw new XlsxSheetNotFoundError(sheetName, this.sheetNames);
    }

    const xml = this.zip.getFileAsString(path);

    // Count row elements
    const matches = xml.match(/<row\s/g);
    return matches ? matches.length : 0;
  }
}

/**
 * Create a streaming XLSX reader from buffer
 */
export function createStreamReader(buffer: Uint8Array): XlsxStream {
  return new XlsxStream(buffer);
}
