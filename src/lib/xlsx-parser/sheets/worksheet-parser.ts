/**
 * Parser for xl/worksheets/sheetN.xml
 * Extracts cell data from worksheet
 */

import type {
    CellValue, CellWithFormula,
    RowWithFormulas, SheetData, SheetDataWithFormulas, XmlElement
} from "../types";
import {
    findElement, findElements, getAttribute,
    getTextContent, parseXml
} from "../xml";

/**
 * Convert Excel column letters to zero-based index
 * A=0, B=1, ..., Z=25, AA=26, AB=27, ...
 */
function columnToIndex(col: string): number {
  let index = 0;
  for (let i = 0; i < col.length; i++) {
    index = index * 26 + ((col.codePointAt(i) ?? 0) - 64);
  }
  return index - 1;
}

/**
 * Parse cell reference (e.g., "A1", "AA100") to column and row indices
 */
function parseCellRef(ref: string): { col: number; row: number } {
  let colPart = "";
  let rowPart = "";

  for (const char of ref) {
    if (char >= "A" && char <= "Z") {
      colPart += char;
    } else {
      rowPart += char;
    }
  }

  return {
    col: columnToIndex(colPart),
    row: Number.parseInt(rowPart, 10) - 1,
  };
}

/** Resolve cell value from cell type and raw string (handles switch logic) */
function resolveCellValue(cellType: string | undefined, rawValue: string, sharedStrings: string[]): CellValue {
  switch (cellType) {
    case "s": {
      const index = Number.parseInt(rawValue, 10);
      return sharedStrings[index] ?? null;
    }
    case "b":
      return rawValue === "1";
    case "e":
    case "str":
      return rawValue;
    default: {
      const num = Number.parseFloat(rawValue);
      return Number.isNaN(num) ? rawValue : num;
    }
  }
}

/**
 * Get cell value based on type
 */
function getCellValue(
  cellElement: ReturnType<typeof findElement>,
  sharedStrings: string[]
): CellValue {
  if (!cellElement) return null;

  const cellType = getAttribute(cellElement, "t");
  const valueElement = findElement(cellElement, "v");
  const inlineStrElement = findElement(cellElement, "is");

  if (cellType === "inlineStr" && inlineStrElement) {
    return getTextContent(inlineStrElement);
  }
  if (!valueElement) return null;

  return resolveCellValue(cellType, valueElement.text, sharedStrings);
}

/** Resolve cell with formula info from type and raw string */
function resolveCellWithFormula(
  cellType: string | undefined,
  rawValue: string,
  formula: string | undefined,
  sharedStrings: string[]
): CellWithFormula {
  switch (cellType) {
    case "s": {
      const index = Number.parseInt(rawValue, 10);
      return { value: sharedStrings[index] ?? null, formula, type: formula ? "formula" : "string" };
    }
    case "b":
      return { value: rawValue === "1", formula, type: formula ? "formula" : "boolean" };
    case "e":
      return { value: rawValue, formula, type: "error" };
    case "str":
      return { value: rawValue, formula, type: "formula" };
    default: {
      const num = Number.parseFloat(rawValue);
      return { value: Number.isNaN(num) ? rawValue : num, formula, type: formula ? "formula" : "number" };
    }
  }
}

/**
 * Get cell value and formula information
 */
function getCellWithFormula(
  cellElement: ReturnType<typeof findElement>,
  sharedStrings: string[]
): CellWithFormula {
  const defaultCell: CellWithFormula = { value: null, type: "string" };
  if (!cellElement) return defaultCell;

  const cellType = getAttribute(cellElement, "t");
  const valueElement = findElement(cellElement, "v");
  const formulaElement = findElement(cellElement, "f");
  const inlineStrElement = findElement(cellElement, "is");

  const formula = formulaElement ? getTextContent(formulaElement) : undefined;

  if (cellType === "inlineStr" && inlineStrElement) {
    return { value: getTextContent(inlineStrElement), formula, type: formula ? "formula" : "string" };
  }
  if (!valueElement) {
    return { value: null, formula, type: formula ? "formula" : "string" };
  }

  return resolveCellWithFormula(cellType, valueElement.text, formula, sharedStrings);
}

/** Process cells in a row, returns max column index encountered */
function processRowCells(rowEl: XmlElement, row: CellValue[], sharedStrings: string[]): number {
  let maxCol = 0;
  for (const cellEl of findElements(rowEl, "c")) {
    const ref = getAttribute(cellEl, "r");
    if (!ref) continue;
    const { col } = parseCellRef(ref);
    while (row.length <= col) row.push(null);
    row[col] = getCellValue(cellEl, sharedStrings);
    if (col > maxCol) maxCol = col;
  }
  return maxCol;
}

/** Process cells in a row with formula data, returns max column index */
function processRowCellsWithFormulas(rowEl: XmlElement, row: RowWithFormulas, sharedStrings: string[]): number {
  let maxCol = 0;
  for (const cellEl of findElements(rowEl, "c")) {
    const ref = getAttribute(cellEl, "r");
    if (!ref) continue;
    const { col } = parseCellRef(ref);
    while (row.length <= col) row.push({ value: null, type: "string" });
    row[col] = getCellWithFormula(cellEl, sharedStrings);
    if (col > maxCol) maxCol = col;
  }
  return maxCol;
}

/**
 * Parse worksheet XML to extract cell data as 2D array
 * @param xml - Contents of xl/worksheets/sheetN.xml
 * @param sharedStrings - Shared strings table
 * @returns 2D array of cell values
 */
export function parseWorksheet(
  xml: string,
  sharedStrings: string[]
): SheetData {
  const root = parseXml(xml);
  const data: SheetData = [];
  const rowElements = findElements(root, "row");
  let maxCol = 0;

  for (const rowEl of rowElements) {
    const rowNum = Number.parseInt(getAttribute(rowEl, "r") || "0", 10);
    if (rowNum === 0) continue;
    const rowIndex = rowNum - 1;
    while (data.length <= rowIndex) data.push([]);
    const rowMaxCol = processRowCells(rowEl, data[rowIndex], sharedStrings);
    if (rowMaxCol > maxCol) maxCol = rowMaxCol;
  }

  for (const row of data) {
    while (row.length <= maxCol) row.push(null);
  }

  return data;
}

/**
 * Parse worksheet XML to extract cell data with formula information
 * @param xml - Contents of xl/worksheets/sheetN.xml
 * @param sharedStrings - Shared strings table
 * @returns 2D array of cells with formula information
 */
export function parseWorksheetWithFormulas(
  xml: string,
  sharedStrings: string[]
): SheetDataWithFormulas {
  const root = parseXml(xml);
  const data: SheetDataWithFormulas = [];
  const rowElements = findElements(root, "row");
  let maxCol = 0;

  for (const rowEl of rowElements) {
    const rowNum = Number.parseInt(getAttribute(rowEl, "r") || "0", 10);
    if (rowNum === 0) continue;
    const rowIndex = rowNum - 1;
    while (data.length <= rowIndex) data.push([]);
    const rowMaxCol = processRowCellsWithFormulas(rowEl, data[rowIndex], sharedStrings);
    if (rowMaxCol > maxCol) maxCol = rowMaxCol;
  }

  for (const row of data) {
    while (row.length <= maxCol) row.push({ value: null, type: "string" });
  }

  return data;
}

/**
 * Extract all formulas from a worksheet
 * @param xml - Contents of xl/worksheets/sheetN.xml
 * @returns Map of cell references to formulas
 */
export function extractFormulas(xml: string): Map<string, string> {
  const root = parseXml(xml);
  const formulas = new Map<string, string>();
  const rowElements = findElements(root, "row");

  for (const rowEl of rowElements) {
    for (const cellEl of findElements(rowEl, "c")) {
      const ref = getAttribute(cellEl, "r");
      const formulaElement = findElement(cellEl, "f");
      if (ref && formulaElement) {
        const formula = getTextContent(formulaElement);
        if (formula) formulas.set(ref, formula);
      }
    }
  }

  return formulas;
}
