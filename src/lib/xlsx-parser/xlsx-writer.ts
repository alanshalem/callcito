/**
 * XLSX Writer
 * Creates Excel files from data
 */

import type { CellValue, SheetData, XlsxWorkbook, XlsxWorksheet } from "./types";
import { ZipWriter } from "./zip/zip-writer";

/**
 * Escape XML special characters
 */
function escapeXml(str: string): string {
  return str
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

/**
 * Convert column number to Excel column letter (0 -> A, 25 -> Z, 26 -> AA)
 */
function columnToLetter(col: number): string {
  let result = "";
  let n = col;
  while (n >= 0) {
    result = String.fromCodePoint((n % 26) + 65) + result;
    n = Math.floor(n / 26) - 1;
  }
  return result;
}

/**
 * Convert cell reference to column and row (A1 -> [0, 0])
 */
function cellRefToCoords(ref: string): [number, number] {
  const match = /^([A-Z]+)(\d+)$/.exec(ref);
  if (!match) return [0, 0];

  const col = match[1]
    .split("")
    .reduce((acc, char) => acc * 26 + (char.codePointAt(0) ?? 0) - 64, 0) - 1;
  const row = Number.parseInt(match[2], 10) - 1;
  return [col, row];
}

/**
 * Generate [Content_Types].xml
 */
function generateContentTypes(sheetCount: number): string {
  let sheets = "";
  for (let i = 1; i <= sheetCount; i++) {
    sheets += `  <Override PartName="/xl/worksheets/sheet${i}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>\n`;
  }

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
${sheets}</Types>`;
}

/**
 * Generate _rels/.rels
 */
function generateRootRels(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;
}

/**
 * Generate xl/_rels/workbook.xml.rels
 */
function generateWorkbookRels(sheetCount: number): string {
  let sheets = "";
  for (let i = 1; i <= sheetCount; i++) {
    sheets += `  <Relationship Id="rId${i}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i}.xml"/>\n`;
  }

  const sharedStringsId = sheetCount + 1;
  const stylesId = sheetCount + 2;

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
${sheets}  <Relationship Id="rId${sharedStringsId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/>
  <Relationship Id="rId${stylesId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;
}

/**
 * Generate xl/workbook.xml
 */
function generateWorkbook(sheetNames: string[]): string {
  let sheets = "";
  for (let i = 0; i < sheetNames.length; i++) {
    sheets += `    <sheet name="${escapeXml(sheetNames[i])}" sheetId="${i + 1}" r:id="rId${i + 1}"/>\n`;
  }

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
${sheets}  </sheets>
</workbook>`;
}

/**
 * Generate xl/styles.xml (minimal)
 */
function generateStyles(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="1">
    <font>
      <sz val="11"/>
      <name val="Calibri"/>
    </font>
  </fonts>
  <fills count="2">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
  </fills>
  <borders count="1">
    <border><left/><right/><top/><bottom/><diagonal/></border>
  </borders>
  <cellStyleXfs count="1">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
  </cellStyleXfs>
  <cellXfs count="1">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
  </cellXfs>
</styleSheet>`;
}

/**
 * Generate xl/sharedStrings.xml
 */
function generateSharedStrings(strings: string[]): string {
  if (strings.length === 0) {
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="0" uniqueCount="0"/>`;
  }

  let items = "";
  for (const str of strings) {
    items += `  <si><t>${escapeXml(str)}</t></si>\n`;
  }

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="${strings.length}" uniqueCount="${strings.length}">
${items}</sst>`;
}

/**
 * Cell value that can include a formula
 */
export interface FormulaCell {
  /** The formula (without leading =) */
  f: string;
  /** The calculated value (optional) */
  v?: CellValue;
}

/**
 * Check if a value is a formula cell
 */
export function isFormulaCell(value: unknown): value is FormulaCell {
  return (
    typeof value === "object" &&
    value !== null &&
    "f" in value &&
    typeof (value as FormulaCell).f === "string"
  );
}

/**
 * Generate XML for a formula cell
 */
function generateFormulaCellXml(ref: string, cell: FormulaCell): string {
  const formula = escapeXml(cell.f);
  if (cell.v === undefined || cell.v === null) {
    return `<c r="${ref}"><f>${formula}</f></c>\n`;
  }
  if (typeof cell.v === "string") {
    return `<c r="${ref}" t="str"><f>${formula}</f><v>${escapeXml(cell.v)}</v></c>\n`;
  }
  if (typeof cell.v === "number") {
    return `<c r="${ref}"><f>${formula}</f><v>${cell.v}</v></c>\n`;
  }
  if (typeof cell.v === "boolean") {
    return `<c r="${ref}" t="b"><f>${formula}</f><v>${cell.v ? 1 : 0}</v></c>\n`;
  }
  return `<c r="${ref}"><f>${formula}</f></c>\n`;
}

/**
 * Generate XML for a regular (non-formula) cell
 */
function generateValueCellXml(ref: string, value: CellValue, stringMap: Map<string, number>): string {
  if (typeof value === "string") {
    const idx = stringMap.get(value);
    if (idx === undefined) return "";
    return `<c r="${ref}" t="s"><v>${idx}</v></c>\n`;
  }
  if (typeof value === "number") return `<c r="${ref}"><v>${value}</v></c>\n`;
  if (typeof value === "boolean") return `<c r="${ref}" t="b"><v>${value ? 1 : 0}</v></c>\n`;
  return "";
}

/**
 * Generate XML for a single cell (formula or value)
 */
function generateCellXml(ref: string, value: CellValue | FormulaCell, stringMap: Map<string, number>): string {
  if (isFormulaCell(value)) return generateFormulaCellXml(ref, value);
  return generateValueCellXml(ref, value, stringMap);
}

/**
 * Generate xl/worksheets/sheetN.xml
 * Supports both regular values and formula cells
 */
function generateWorksheet(
  data: (CellValue | FormulaCell)[][],
  stringMap: Map<string, number>
): string {
  if (data.length === 0) {
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData/>
</worksheet>`;
  }

  let rows = "";
  for (let r = 0; r < data.length; r++) {
    const row = data[r];
    if (!row || row.length === 0) continue;

    let cells = "";
    for (let c = 0; c < row.length; c++) {
      const value = row[c];
      if (value === null || value === undefined) continue;
      const ref = `${columnToLetter(c)}${r + 1}`;
      cells += `      ${generateCellXml(ref, value, stringMap)}`;
    }

    if (cells) {
      rows += `    <row r="${r + 1}">\n${cells}    </row>\n`;
    }
  }

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>
${rows}  </sheetData>
</worksheet>`;
}

/**
 * Convert legacy cell-object format to 2D array
 */
function legacyFormatToArray(data: SheetData): CellValue[][] {
  type LegacyCell = { row: number; col: number; value: CellValue };
  let maxRow = 0;
  let maxCol = 0;

  for (const row of data) {
    for (const cell of row as unknown as LegacyCell[]) {
      if (cell.row > maxRow) maxRow = cell.row;
      if (cell.col > maxCol) maxCol = cell.col;
    }
  }

  const result: CellValue[][] = Array.from({ length: maxRow + 1 }, () =>
    new Array(maxCol + 1).fill(null)
  );

  for (const row of data) {
    for (const cell of row as unknown as LegacyCell[]) {
      result[cell.row][cell.col] = cell.value;
    }
  }
  return result;
}

/**
 * Extract data from worksheet as 2D array
 * Handles both formats: 2D array of values (from parser) and array of cell objects (from arrayToSheet)
 */
function worksheetToArray(sheet: XlsxWorksheet): CellValue[][] {
  const data = sheet._data;
  if (!data || data.length === 0) return [];

  const firstCell = data[0]?.[0];
  if (firstCell === null || typeof firstCell !== "object" || !("row" in firstCell)) {
    return data.map((row) => [...row]);
  }
  return legacyFormatToArray(data);
}

/**
 * Collect all unique strings from workbook sheets for the shared strings table
 */
function collectSharedStrings(workbook: XlsxWorkbook): {
  allStrings: string[];
  stringMap: Map<string, number>;
} {
  const allStrings: string[] = [];
  const stringMap = new Map<string, number>();

  for (const name of workbook.SheetNames) {
    const sheet = workbook.Sheets[name];
    if (!sheet) continue;
    const data = worksheetToArray(sheet);
    for (const row of data) {
      for (const cell of row) {
        if (typeof cell === "string" && !stringMap.has(cell)) {
          stringMap.set(cell, allStrings.length);
          allStrings.push(cell);
        }
      }
    }
  }
  return { allStrings, stringMap };
}

/**
 * Create a new empty workbook
 */
export function createEmptyWorkbook(): XlsxWorkbook {
  return {
    SheetNames: [],
    Sheets: {},
  };
}

/**
 * Convert array of arrays to worksheet
 */
export function arrayToSheet(data: CellValue[][]): XlsxWorksheet {
  // Store as 2D array of values (same format as parseWorksheet)
  const sheetData: SheetData = data.map((row) => (row ? [...row] : []));

  return {
    _data: sheetData,
    _name: "",
  };
}

/**
 * Create a formula cell
 * @param formula - The formula expression (without leading =)
 * @param value - Optional calculated value
 */
export function createFormula(formula: string, value?: CellValue): FormulaCell {
  return { f: formula, v: value };
}

/**
 * Add a sheet to workbook
 */
export function appendSheet(
  workbook: XlsxWorkbook,
  sheet: XlsxWorksheet,
  name: string
): void {
  workbook.SheetNames.push(name);
  sheet._name = name;
  workbook.Sheets[name] = sheet;
}

/**
 * Write workbook to buffer
 */
export function writeWorkbook(workbook: XlsxWorkbook): Uint8Array {
  const zip = new ZipWriter();
  const sheetNames = workbook.SheetNames;
  const sheetCount = sheetNames.length;
  const { allStrings, stringMap } = collectSharedStrings(workbook);

  zip.addFile("[Content_Types].xml", generateContentTypes(sheetCount));
  zip.addFile("_rels/.rels", generateRootRels());
  zip.addFile("xl/_rels/workbook.xml.rels", generateWorkbookRels(sheetCount));
  zip.addFile("xl/workbook.xml", generateWorkbook(sheetNames));
  zip.addFile("xl/styles.xml", generateStyles());
  zip.addFile("xl/sharedStrings.xml", generateSharedStrings(allStrings));

  for (let i = 0; i < sheetNames.length; i++) {
    const sheet = workbook.Sheets[sheetNames[i]];
    if (!sheet) continue;
    zip.addFile(
      `xl/worksheets/sheet${i + 1}.xml`,
      generateWorksheet(worksheetToArray(sheet), stringMap)
    );
  }

  return zip.generate();
}
