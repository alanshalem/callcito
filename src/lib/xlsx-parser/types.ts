/**
 * XLSX Parser Types
 * Zero-dependency XLSX parser library
 */

// Cell value types
export type CellValue = string | number | boolean | null;
export type Row = CellValue[];
export type SheetData = Row[];

/**
 * Cell with formula information
 * Used when you need to access both the formula and its calculated value
 */
export interface CellWithFormula {
  /** The calculated value */
  value: CellValue;
  /** The formula expression (without leading =) */
  formula?: string;
  /** Cell type */
  type: "string" | "number" | "boolean" | "error" | "formula";
}

/**
 * Extended row with formula information
 */
export type RowWithFormulas = CellWithFormula[];

/**
 * Extended sheet data with formula information
 */
export type SheetDataWithFormulas = RowWithFormulas[];

// Workbook structure
export interface XlsxWorkbook {
  SheetNames: string[];
  Sheets: Record<string, XlsxWorksheet>;
}

export interface XlsxWorksheet {
  /** Internal data storage */
  _data: SheetData;
  /** Sheet name */
  _name: string;
}

// Sheet metadata from workbook.xml
export interface SheetInfo {
  name: string;
  sheetId: string;
  rId: string;
}

// Read options
export interface ReadOptions {
  type?: "array" | "buffer" | "file";
}

// Write options
export interface WriteOptions {
  type?: "array" | "buffer" | "file";
  bookType?: "xlsx";
}

// sheet_to_json options
export interface SheetToJsonOptions {
  /** Use 1 for array of arrays */
  header?: 1 | "A";
  /** Default value for empty cells */
  defval?: CellValue;
  /** Include blank rows */
  blankrows?: boolean;
}

// ZIP entry structure
export interface ZipEntry {
  fileName: string;
  compressedSize: number;
  uncompressedSize: number;
  compressionMethod: number;
  dataOffset: number;
  crc32: number;
}

// XML element structure
export interface XmlElement {
  tag: string;
  attributes: Record<string, string>;
  children: XmlElement[];
  text: string;
}
