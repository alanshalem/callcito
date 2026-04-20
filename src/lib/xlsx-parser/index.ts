/**
 * XLSX Parser - Zero-dependency Excel file parser and writer
 * Drop-in replacement for xlsx package
 *
 * @example
 * import XLSX from "@/lib/xlsx-parser";
 *
 * // Read from ArrayBuffer/Uint8Array
 * const workbook = XLSX.read(data, { type: "array" });
 * const sheetName = workbook.SheetNames[0];
 * const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });
 *
 * // Read from file (Node.js only)
 * const workbook = XLSX.readFile("path/to/file.xlsx");
 *
 * // Create and write workbook
 * const wb = XLSX.utils.book_new();
 * const ws = XLSX.utils.aoa_to_sheet([["A1", "B1"], ["A2", "B2"]]);
 * XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
 * const buffer = XLSX.write(wb, { type: "array" });
 * XLSX.writeFile(wb, "output.xlsx");
 */

import type {
    CellValue, ReadOptions, SheetToJsonOptions, WriteOptions, XlsxWorkbook,
    XlsxWorksheet
} from "./types";
import { excelDateToJSDate, jsDateToExcelDate, readFileSync, toUint8Array, writeFileSync } from "./utils";
import { createWorkbook, sheetToJson } from "./xlsx-parser";
import {
    createStreamReader, XlsxStream
} from "./xlsx-stream";
import {
    appendSheet, arrayToSheet, createEmptyWorkbook, writeWorkbook
} from "./xlsx-writer";
import {
    parseCsvToRows, parseCsvToWorkbook, stringifyCsv, streamCsvRows,
    type CsvParseOptions, type CsvStringifyOptions,
} from "./csv";

// Re-export types
export { extractFormulas, extractImage, extractImageAsDataUrl, findDrawingForSheet, getCellStyle, getComment, getCommentsMap, getNamedRange, getValidationForCell, parseComments, parseDataValidations, parseDrawing, parseNamedRanges, parseStyles } from './sheets';
export type { BorderStyle, CellComment, CellStyle, CommentsData, DataValidation, DrawingData, EmbeddedImage, FillStyle, FontStyle, NamedRange, StylesData } from './sheets';
export type { CellValue, ReadOptions, SheetToJsonOptions, WriteOptions, XlsxWorkbook, XlsxWorksheet } from './types';
// Re-export functions
export { XlsxStream } from './xlsx-stream';
export type { StreamCell, StreamOptions, StreamRow } from './xlsx-stream';
export { createFormula, isFormulaCell } from './xlsx-writer';
export type { FormulaCell } from './xlsx-writer';
export { parseCsvToRows, parseCsvToWorkbook, stringifyCsv, streamCsvRows } from './csv';
export type { CsvParseOptions, CsvStringifyOptions } from './csv';


/**
 * Main XLSX API object
 * Compatible with xlsx package API
 */
export const XLSX = {
  /**
   * Read workbook from buffer
   * @param data - ArrayBuffer, Uint8Array, or Buffer containing XLSX data
   * @param options - Read options (type: "array" | "buffer")
   * @returns Parsed workbook
   */
  read(
    data: ArrayBuffer | Uint8Array | Buffer,
    options?: ReadOptions
  ): XlsxWorkbook {
    const buffer = toUint8Array(data);
    return createWorkbook(buffer);
  },

  /**
   * Read workbook from file path (Node.js only)
   * @param path - Path to XLSX file
   * @returns Parsed workbook
   */
  readFile(path: string): XlsxWorkbook {
    const buffer = readFileSync(path);
    return createWorkbook(buffer);
  },

  /**
   * Write workbook to buffer
   * @param workbook - Workbook to write
   * @param options - Write options
   * @returns Uint8Array containing XLSX data
   */
  write(workbook: XlsxWorkbook, options?: WriteOptions): Uint8Array {
    return writeWorkbook(workbook);
  },

  /**
   * Write workbook to file (Node.js only)
   * @param workbook - Workbook to write
   * @param path - Output file path
   * @param options - Write options
   */
  writeFile(workbook: XlsxWorkbook, path: string, options?: WriteOptions): void {
    const buffer = writeWorkbook(workbook);
    writeFileSync(path, buffer);
  },

  /**
   * Create a streaming reader for large files
   * @param data - ArrayBuffer, Uint8Array, or Buffer containing XLSX data
   * @returns XlsxStream instance for memory-efficient row-by-row processing
   */
  stream(data: ArrayBuffer | Uint8Array | Buffer): XlsxStream {
    const buffer = toUint8Array(data);
    return createStreamReader(buffer);
  },

  /**
   * Create a streaming reader from file (Node.js only)
   * @param path - Path to XLSX file
   * @returns XlsxStream instance
   */
  streamFile(path: string): XlsxStream {
    const buffer = readFileSync(path);
    return createStreamReader(buffer);
  },

  /**
   * CSV read/write helpers.
   * Use these when importing/exporting catalogs in plain CSV (RFC 4180).
   *
   * @example
   *   const workbook = XLSX.csv.read(csvText)
   *   const sheet = workbook.Sheets[workbook.SheetNames[0]]
   *   const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 })
   */
  csv: {
    /** Parse CSV text → 2D array of cells */
    parse(input: string, options?: CsvParseOptions) {
      return parseCsvToRows(input, options);
    },
    /** Parse CSV text → full XlsxWorkbook (single sheet) */
    read(input: string, options?: CsvParseOptions): XlsxWorkbook {
      return parseCsvToWorkbook(input, options);
    },
    /** Serialize a worksheet or 2D array → CSV string */
    stringify(
      input: XlsxWorksheet | CellValue[][],
      options?: CsvStringifyOptions
    ): string {
      return stringifyCsv(input, options);
    },
    /** Generator over CSV rows (memory-efficient for sequential processing) */
    stream(input: string, options?: CsvParseOptions) {
      return streamCsvRows(input, options);
    },
  },

  /**
   * Utility functions
   */
  utils: {
    /**
     * Convert worksheet to array
     * @param sheet - Worksheet to convert
     * @param options - Conversion options (header: 1 for array of arrays)
     * @returns Array of rows
     */
    sheet_to_json<T = CellValue[]>(
      sheet: XlsxWorksheet,
      options?: SheetToJsonOptions
    ): T[] {
      return sheetToJson<T>(sheet, options);
    },

    /**
     * Create a new empty workbook
     * @returns Empty workbook
     */
    book_new(): XlsxWorkbook {
      return createEmptyWorkbook();
    },

    /**
     * Convert array of arrays to worksheet
     * @param data - 2D array of cell values
     * @returns Worksheet
     */
    aoa_to_sheet(data: CellValue[][]): XlsxWorksheet {
      return arrayToSheet(data);
    },

    /**
     * Append worksheet to workbook
     * @param workbook - Workbook to add sheet to
     * @param worksheet - Worksheet to add
     * @param name - Sheet name
     */
    book_append_sheet(
      workbook: XlsxWorkbook,
      worksheet: XlsxWorksheet,
      name: string
    ): void {
      appendSheet(workbook, worksheet, name);
    },

    /**
     * Convert Excel serial date to JavaScript Date
     * @param serial - Excel serial number (days since 1900-01-01)
     * @param date1904 - Use 1904 date system (Mac Excel)
     * @returns JavaScript Date object
     */
    excelDateToJSDate(serial: number, date1904 = false): Date {
      return excelDateToJSDate(serial, date1904);
    },

    /**
     * Convert JavaScript Date to Excel serial date
     * @param date - JavaScript Date object
     * @param date1904 - Use 1904 date system (Mac Excel)
     * @returns Excel serial number
     */
    jsDateToExcelDate(date: Date, date1904 = false): number {
      return jsDateToExcelDate(date, date1904);
    },
  },
};

// Default export for compatibility with `import XLSX from "xlsx"`
export default XLSX;
