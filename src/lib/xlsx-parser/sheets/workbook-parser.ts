/**
 * Parser for xl/workbook.xml
 * Extracts sheet names and metadata
 */

import type { SheetInfo } from "../types";
import { findElements, getAttribute, parseXml } from "../xml";

/**
 * Parse workbook.xml to extract sheet information
 * @param xml - Contents of xl/workbook.xml
 * @returns Array of sheet info objects
 */
export function parseWorkbook(xml: string): SheetInfo[] {
  const root = parseXml(xml);
  const sheets: SheetInfo[] = [];

  // Find all <sheet> elements
  const sheetElements = findElements(root, "sheet");

  for (const sheet of sheetElements) {
    const name = getAttribute(sheet, "name");
    const sheetId = getAttribute(sheet, "sheetId");
    const rId = getAttribute(sheet, "r:id") || getAttribute(sheet, "id") || "";

    if (name && sheetId) {
      sheets.push({
        name,
        sheetId,
        rId,
      });
    }
  }

  return sheets;
}
