/**
 * Parser for data validation rules in worksheets
 * Extracts validation rules from dataValidations element
 */

import {
    findElement, findElements, getAttribute, parseXml
} from "../xml";

/**
 * Data validation type
 */
export type ValidationType =
  | "none"
  | "whole"      // Whole number
  | "decimal"    // Decimal number
  | "list"       // List of values
  | "date"       // Date
  | "time"       // Time
  | "textLength" // Text length
  | "custom";    // Custom formula

/**
 * Validation operator
 */
export type ValidationOperator =
  | "between"
  | "notBetween"
  | "equal"
  | "notEqual"
  | "greaterThan"
  | "lessThan"
  | "greaterThanOrEqual"
  | "lessThanOrEqual";

/**
 * Error style (what happens on invalid input)
 */
export type ErrorStyle = "stop" | "warning" | "information";

/**
 * Data validation rule
 */
export interface DataValidation {
  /** Cell range this validation applies to (e.g., "A1:A100") */
  sqref: string;
  /** Validation type */
  type: ValidationType;
  /** Operator for comparison */
  operator?: ValidationOperator;
  /** First formula/value */
  formula1?: string;
  /** Second formula/value (for between/notBetween) */
  formula2?: string;
  /** Allow blank cells */
  allowBlank?: boolean;
  /** Show dropdown for list validation */
  showDropDown?: boolean;
  /** Show input message when cell is selected */
  showInputMessage?: boolean;
  /** Show error alert on invalid input */
  showErrorMessage?: boolean;
  /** Error alert title */
  errorTitle?: string;
  /** Error alert message */
  error?: string;
  /** Input message title */
  promptTitle?: string;
  /** Input message text */
  prompt?: string;
  /** Error style */
  errorStyle?: ErrorStyle;
}

/**
 * Parse a single dataValidation element into a DataValidation object
 */
function parseValidationElement(dvEl: ReturnType<typeof findElement>): DataValidation | null {
  if (!dvEl) return null;
  const sqref = getAttribute(dvEl, "sqref");
  if (!sqref) return null;

  const validation: DataValidation = {
    sqref,
    type: (getAttribute(dvEl, "type") as ValidationType) || "none",
  };

  const operator = getAttribute(dvEl, "operator");
  if (operator) validation.operator = operator as ValidationOperator;

  const allowBlank = getAttribute(dvEl, "allowBlank");
  if (allowBlank === "1") validation.allowBlank = true;

  // Note: showDropDown="1" means HIDE the dropdown (Excel quirk)
  const showDropDown = getAttribute(dvEl, "showDropDown");
  validation.showDropDown = showDropDown !== "1";

  const showInputMessage = getAttribute(dvEl, "showInputMessage");
  if (showInputMessage === "1") validation.showInputMessage = true;

  const showErrorMessage = getAttribute(dvEl, "showErrorMessage");
  if (showErrorMessage === "1") validation.showErrorMessage = true;

  const errorStyle = getAttribute(dvEl, "errorStyle");
  if (errorStyle) validation.errorStyle = errorStyle as ErrorStyle;

  const errorTitle = getAttribute(dvEl, "errorTitle");
  if (errorTitle) validation.errorTitle = errorTitle;

  const error = getAttribute(dvEl, "error");
  if (error) validation.error = error;

  const promptTitle = getAttribute(dvEl, "promptTitle");
  if (promptTitle) validation.promptTitle = promptTitle;

  const prompt = getAttribute(dvEl, "prompt");
  if (prompt) validation.prompt = prompt;

  const formula1El = findElement(dvEl, "formula1");
  if (formula1El) validation.formula1 = formula1El.text || "";

  const formula2El = findElement(dvEl, "formula2");
  if (formula2El) validation.formula2 = formula2El.text || "";

  return validation;
}

/**
 * Parse data validations from worksheet XML
 * @param xml - Contents of worksheet XML
 * @returns Array of data validation rules
 */
export function parseDataValidations(xml: string): DataValidation[] {
  const root = parseXml(xml);

  const dataValidationsEl = findElement(root, "dataValidations");
  if (!dataValidationsEl) return [];

  const validations: DataValidation[] = [];
  for (const dvEl of findElements(dataValidationsEl, "dataValidation")) {
    const validation = parseValidationElement(dvEl);
    if (validation) validations.push(validation);
  }
  return validations;
}

/**
 * Get validation for a specific cell
 * @param validations - Array of validations
 * @param cellRef - Cell reference (e.g., "A1")
 * @returns Validation rule if found
 */
export function getValidationForCell(
  validations: DataValidation[],
  cellRef: string
): DataValidation | undefined {
  for (const validation of validations) {
    if (isCellInRange(cellRef, validation.sqref)) {
      return validation;
    }
  }
  return undefined;
}

/**
 * Check if a cell is within a range specification
 * @param cellRef - Cell reference (e.g., "A1")
 * @param sqref - Range specification (e.g., "A1:B10" or "A1 B2:C5")
 */
function isCellInRange(cellRef: string, sqref: string): boolean {
  // sqref can contain multiple ranges separated by space
  const ranges = sqref.split(" ");

  for (const range of ranges) {
    if (cellMatchesRange(cellRef, range)) {
      return true;
    }
  }
  return false;
}

/**
 * Check if cell matches a single range
 */
function cellMatchesRange(cellRef: string, range: string): boolean {
  const parts = range.split(":");
  const start = parseCellRef(parts[0]);
  const end = parts[1] ? parseCellRef(parts[1]) : start;
  const cell = parseCellRef(cellRef);

  return (
    cell.col >= start.col &&
    cell.col <= end.col &&
    cell.row >= start.row &&
    cell.row <= end.row
  );
}

/**
 * Parse cell reference to column and row
 */
function parseCellRef(ref: string): { col: number; row: number } {
  const match = /^([A-Z]+)(\d+)$/.exec(ref.replaceAll('$', ''));
  if (!match) return { col: 0, row: 0 };

  let col = 0;
  for (let i = 0; i < match[1].length; i++) {
    col = col * 26 + ((match[1].codePointAt(i) ?? 0) - 64);
  }

  return {
    col: col - 1,
    row: Number.parseInt(match[2], 10) - 1,
  };
}

/**
 * Parse list values from formula1 (for list validation)
 * @param formula - Formula string (e.g., '"Option1,Option2,Option3"' or 'Sheet1!$A$1:$A$10')
 * @returns Array of values if it's a literal list, or the range reference
 */
export function parseListFormula(formula: string): string[] | string {
  // Check if it's a quoted list of values
  const quotedMatch = /^"(.+)"$/.exec(formula);
  if (quotedMatch) {
    return quotedMatch[1].split(",");
  }

  // Otherwise it's a range reference
  return formula;
}
