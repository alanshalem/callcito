/**
 * Excel date utilities
 * Excel stores dates as serial numbers (days since 1900-01-01)
 */

// Excel epoch: December 31, 1899 (so serial 1 = January 1, 1900)
// Note: Excel incorrectly treats 1900 as a leap year (bug compatibility with Lotus 1-2-3)
const EXCEL_EPOCH = new Date(Date.UTC(1899, 11, 31)); // Dec 31, 1899
const MS_PER_DAY = 24 * 60 * 60 * 1000;

// Common Excel date format codes
const DATE_FORMAT_PATTERNS = [
  /\bd{1,4}\b/i, // d, dd, ddd, dddd
  /\bm{1,5}\b/i, // m, mm, mmm, mmmm, mmmmm (month)
  /\by{2,4}\b/i, // yy, yyyy
  /\bh{1,2}\b/i, // h, hh (hour)
  /\bs{1,2}\b/i, // s, ss (second)
  /\bAM\/PM\b/i, // AM/PM
];

// Built-in Excel number formats that represent dates
const BUILTIN_DATE_FORMATS: Record<number, boolean> = {
  14: true, // m/d/yyyy
  15: true, // d-mmm-yy
  16: true, // d-mmm
  17: true, // mmm-yy
  18: true, // h:mm AM/PM
  19: true, // h:mm:ss AM/PM
  20: true, // h:mm
  21: true, // h:mm:ss
  22: true, // m/d/yyyy h:mm
  45: true, // mm:ss
  46: true, // [h]:mm:ss
  47: true, // mm:ss.0
};

/**
 * Convert Excel serial date to JavaScript Date
 * @param serial - Excel serial number (days since 1900-01-01)
 * @param date1904 - Use 1904 date system (Mac Excel)
 * @returns JavaScript Date object
 */
export function excelDateToJSDate(serial: number, date1904 = false): Date {
  if (typeof serial !== "number" || Number.isNaN(serial)) {
    throw new TypeError("Invalid Excel date serial");
  }

  // Handle 1904 date system (used by Mac Excel)
  if (date1904) {
    serial += 1462; // Days between 1900 and 1904 systems
  }

  // Excel bug: treats 1900 as leap year, so dates after Feb 28, 1900 are off by 1
  if (serial > 60) {
    serial -= 1;
  }

  const days = Math.floor(serial);
  const fraction = serial - days;

  // Calculate date
  const ms = EXCEL_EPOCH.getTime() + days * MS_PER_DAY;

  // Add time component
  const timeMs = Math.round(fraction * MS_PER_DAY);

  return new Date(ms + timeMs);
}

/**
 * Convert JavaScript Date to Excel serial date
 * @param date - JavaScript Date object
 * @param date1904 - Use 1904 date system (Mac Excel)
 * @returns Excel serial number
 */
export function jsDateToExcelDate(date: Date, date1904 = false): number {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    throw new TypeError("Invalid Date object");
  }

  const ms = date.getTime() - EXCEL_EPOCH.getTime();
  let serial = ms / MS_PER_DAY;

  // Excel bug compensation
  if (serial > 60) {
    serial += 1;
  }

  // Handle 1904 date system
  if (date1904) {
    serial -= 1462;
  }

  return serial;
}

/**
 * Check if a number format code represents a date
 * @param formatCode - Excel format code string
 * @returns true if format represents a date/time
 */
export function isDateFormat(formatCode: string | undefined): boolean {
  if (!formatCode) return false;

  // Remove escaped characters and quoted strings
  const cleaned = formatCode
    .replaceAll(/\\./g, "") // Remove escaped chars
    .replaceAll(/"[^"]*"/g, "") // Remove quoted strings
    .replaceAll(/\[[^\]]*\]/g, ""); // Remove bracketed content

  // Check for date/time patterns
  return DATE_FORMAT_PATTERNS.some((pattern) => pattern.test(cleaned));
}

/**
 * Check if a built-in format ID represents a date
 * @param numFmtId - Built-in format ID
 * @returns true if format represents a date/time
 */
export function isBuiltinDateFormat(numFmtId: number): boolean {
  return BUILTIN_DATE_FORMATS[numFmtId] === true;
}

/**
 * Determine if a numeric cell value should be interpreted as a date
 * @param value - Numeric cell value
 * @param numFmtId - Format ID from styles.xml
 * @param customFormats - Map of custom format codes
 * @returns true if value should be treated as a date
 */
export function shouldParseAsDate(
  value: number,
  numFmtId: number | undefined,
  customFormats?: Map<number, string>
): boolean {
  if (numFmtId === undefined) return false;

  // Check built-in formats
  if (isBuiltinDateFormat(numFmtId)) return true;

  // Check custom formats
  if (customFormats?.has(numFmtId)) {
    return isDateFormat(customFormats.get(numFmtId));
  }

  return false;
}

/**
 * Format a Date as ISO string (YYYY-MM-DD)
 * @param date - Date to format
 * @returns ISO date string
 */
export function formatDateISO(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Format a Date as ISO datetime string
 * @param date - Date to format
 * @returns ISO datetime string
 */
export function formatDateTimeISO(date: Date): string {
  return date.toISOString();
}
