/**
 * Main XLSX parser
 * Coordinates ZIP reading, XML parsing, and sheet extraction
 */

import { parseSharedStrings, parseWorkbook, parseWorksheet } from "./sheets";
import type { XlsxWorkbook, XlsxWorksheet } from "./types";
import { XlsxSheetNotFoundError } from "./utils/errors";
import { ZipReader } from "./zip";

/**
 * XLSX Parser class
 * Parses Excel files and provides access to sheet data
 */
export class XlsxParser {
  private readonly zip: ZipReader;
  private readonly sheetNames: string[] = [];
  private readonly sheets: Map<string, XlsxWorksheet> = new Map();
  private sharedStrings: string[] = [];
  private readonly sheetPaths: Map<string, string> = new Map();

  constructor(buffer: Uint8Array) {
    this.zip = new ZipReader(buffer);
    this.parse();
  }

  /**
   * Parse the XLSX structure
   */
  private parse(): void {
    // Parse workbook.xml to get sheet info
    const workbookXml = this.zip.getFileAsString("xl/workbook.xml");
    const sheetInfos = parseWorkbook(workbookXml);

    // Parse relationships to map rId to sheet paths
    let rels: Record<string, string> = {};
    if (this.zip.hasFile("xl/_rels/workbook.xml.rels")) {
      const relsXml = this.zip.getFileAsString("xl/_rels/workbook.xml.rels");
      rels = this.parseRelationships(relsXml);
    }

    // Build sheet name list and path mapping
    for (const info of sheetInfos) {
      this.sheetNames.push(info.name);

      // Determine sheet path
      let sheetPath: string;
      if (info.rId && rels[info.rId]) {
        sheetPath = `xl/${rels[info.rId]}`;
      } else {
        // Fallback: use sheet index
        const index = this.sheetNames.length;
        sheetPath = `xl/worksheets/sheet${index}.xml`;
      }

      this.sheetPaths.set(info.name, sheetPath);
    }

    // Parse shared strings if present
    if (this.zip.hasFile("xl/sharedStrings.xml")) {
      const sharedStringsXml = this.zip.getFileAsString("xl/sharedStrings.xml");
      this.sharedStrings = parseSharedStrings(sharedStringsXml);
    }
  }

  /**
   * Parse relationships XML to get rId -> path mapping
   */
  private parseRelationships(xml: string): Record<string, string> {
    const rels: Record<string, string> = {};
    // Simple regex extraction for relationships
    const relRegex =
      /<Relationship[^>]*Id="([^"]*)"[^>]*Target="([^"]*)"/g;
    let match;

    while ((match = relRegex.exec(xml)) !== null) {
      rels[match[1]] = match[2];
    }

    return rels;
  }

  /**
   * Get sheet by name (lazy loading)
   */
  getSheet(name: string): XlsxWorksheet {
    // Return cached sheet if available
    const cached = this.sheets.get(name);
    if (cached) return cached;

    const path = this.sheetPaths.get(name);
    if (!path) {
      throw new XlsxSheetNotFoundError(name, this.sheetNames);
    }

    // Parse worksheet
    const worksheetXml = this.zip.getFileAsString(path);
    const data = parseWorksheet(worksheetXml, this.sharedStrings);

    const worksheet: XlsxWorksheet = {
      _data: data,
      _name: name,
    };

    this.sheets.set(name, worksheet);
    return worksheet;
  }

  /**
   * Get all sheet names
   */
  get SheetNames(): string[] {
    return this.sheetNames;
  }

  /**
   * Get sheets as object
   */
  get Sheets(): Record<string, XlsxWorksheet> {
    // Return proxy that lazy-loads sheets
    return new Proxy(
      {},
      {
        get: (_target, prop: string) => {
          if (this.sheetNames.includes(prop)) {
            return this.getSheet(prop);
          }
          return undefined;
        },
        has: (_target, prop: string) => {
          return this.sheetNames.includes(prop);
        },
        ownKeys: () => {
          return this.sheetNames;
        },
        getOwnPropertyDescriptor: (_target, prop: string) => {
          if (this.sheetNames.includes(prop)) {
            return {
              enumerable: true,
              configurable: true,
              value: this.getSheet(prop),
            };
          }
          return undefined;
        },
      }
    );
  }
}

/**
 * Convert worksheet to array of arrays
 */
export function sheetToJson<T = unknown[]>(
  sheet: XlsxWorksheet,
  options?: { header?: 1 | "A" }
): T[] {
  if (options?.header === 1) {
    // Return as array of arrays
    return sheet._data as T[];
  }

  // Default: also return as array of arrays for compatibility
  return sheet._data as T[];
}

/**
 * Create workbook from buffer
 */
export function createWorkbook(buffer: Uint8Array): XlsxWorkbook {
  const parser = new XlsxParser(buffer);
  return {
    SheetNames: parser.SheetNames,
    Sheets: parser.Sheets,
  };
}
