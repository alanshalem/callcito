/**
 * Parser for named ranges (definedNames in workbook.xml)
 */

import {
    findElement, findElements, getAttribute, parseXml
} from "../xml";

/**
 * Named range definition
 */
export interface NamedRange {
  /** Name of the range */
  name: string;
  /** Range reference (e.g., "Sheet1!$A$1:$B$10") */
  ref: string;
  /** Sheet index if local to a sheet (-1 for global) */
  localSheetId?: number;
  /** Whether this is a hidden name */
  hidden?: boolean;
  /** Comment/description */
  comment?: string;
}

/**
 * Parsed reference information
 */
export interface ParsedRef {
  /** Sheet name (if present) */
  sheetName?: string;
  /** Start cell reference */
  startCell: string;
  /** End cell reference (same as start for single cell) */
  endCell: string;
  /** Start column (0-indexed) */
  startCol: number;
  /** Start row (0-indexed) */
  startRow: number;
  /** End column (0-indexed) */
  endCol: number;
  /** End row (0-indexed) */
  endRow: number;
}

/**
 * Convert column letter to index (A=0, B=1, AA=26)
 */
function colToIndex(col: string): number {
  let result = 0;
  for (let i = 0; i < col.length; i++) {
    result = result * 26 + ((col.codePointAt(i) ?? 0) - 64);
  }
  return result - 1;
}

/**
 * Parse a cell reference like "$A$1" or "A1"
 */
function parseCellRef(ref: string): { col: number; row: number } {
  // Remove $ signs
  const cleaned = ref.replaceAll('$', '');
  const match = /^([A-Z]+)(\d+)$/.exec(cleaned);
  if (!match) return { col: 0, row: 0 };

  return {
    col: colToIndex(match[1]),
    row: Number.parseInt(match[2], 10) - 1,
  };
}

/**
 * Parse a range reference like "Sheet1!$A$1:$B$10"
 */
export function parseRangeRef(ref: string): ParsedRef {
  let sheetName: string | undefined;
  let rangeRef = ref;

  // Check for sheet name
  const sheetMatch = /^(?:'([^']+)'|([^!]+))!(.+)$/.exec(ref);
  if (sheetMatch) {
    sheetName = sheetMatch[1] || sheetMatch[2];
    rangeRef = sheetMatch[3];
  }

  // Parse range (A1:B10 or just A1)
  const parts = rangeRef.split(":");
  const startRef = parts[0];
  const endRef = parts[1] || parts[0];

  const start = parseCellRef(startRef);
  const end = parseCellRef(endRef);

  return {
    sheetName,
    startCell: startRef.replaceAll('$', ''),
    endCell: endRef.replaceAll('$', ''),
    startCol: start.col,
    startRow: start.row,
    endCol: end.col,
    endRow: end.row,
  };
}

/**
 * Parse named ranges from workbook.xml
 * @param xml - Contents of xl/workbook.xml
 * @returns Array of named ranges
 */
export function parseNamedRanges(xml: string): NamedRange[] {
  const root = parseXml(xml);
  const ranges: NamedRange[] = [];

  const definedNamesEl = findElement(root, "definedNames");
  if (!definedNamesEl) return ranges;

  const nameElements = findElements(definedNamesEl, "definedName");
  for (const nameEl of nameElements) {
    const name = getAttribute(nameEl, "name");
    if (!name) continue;

    const ref = nameEl.text || "";
    if (!ref) continue;

    const range: NamedRange = { name, ref };

    const localSheetId = getAttribute(nameEl, "localSheetId");
    if (localSheetId) {
      range.localSheetId = Number.parseInt(localSheetId, 10);
    }

    const hidden = getAttribute(nameEl, "hidden");
    if (hidden === "1") {
      range.hidden = true;
    }

    const comment = getAttribute(nameEl, "comment");
    if (comment) {
      range.comment = comment;
    }

    ranges.push(range);
  }

  return ranges;
}

/**
 * Get named range by name
 * @param ranges - Array of named ranges
 * @param name - Name to search for
 * @param sheetIndex - Optional sheet index for local names
 * @returns Named range if found
 */
export function getNamedRange(
  ranges: NamedRange[],
  name: string,
  sheetIndex?: number
): NamedRange | undefined {
  // First try to find local name
  if (sheetIndex !== undefined) {
    const local = ranges.find(
      (r) => r.name === name && r.localSheetId === sheetIndex
    );
    if (local) return local;
  }

  // Then try global name
  return ranges.find(
    (r) => r.name === name && r.localSheetId === undefined
  );
}

/**
 * Get all named ranges as a map
 * @param ranges - Array of named ranges
 * @returns Map of name to range
 */
export function getNamedRangesMap(
  ranges: NamedRange[]
): Map<string, NamedRange> {
  const map = new Map<string, NamedRange>();
  for (const range of ranges) {
    // Use name with sheet prefix for local names
    const key = range.localSheetId === undefined
      ? range.name
      : `${range.localSheetId}:${range.name}`;
    map.set(key, range);
  }
  return map;
}
