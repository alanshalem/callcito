/**
 * Custom error classes for XLSX parser
 * Provides descriptive error messages for debugging
 */

/**
 * Base error class for XLSX parser
 */
export class XlsxError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "XlsxError";
    // Maintains proper stack trace in V8 environments
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Error during XLSX parsing
 */
export class XlsxParseError extends XlsxError {
  public readonly file?: string;
  public readonly position?: number;

  constructor(message: string, options?: { file?: string; position?: number }) {
    const details = [];
    if (options?.file) details.push(`file: ${options.file}`);
    if (options?.position !== undefined)
      details.push(`position: ${options.position}`);

    const fullMessage =
      details.length > 0 ? `${message} (${details.join(", ")})` : message;

    super(fullMessage);
    this.name = "XlsxParseError";
    this.file = options?.file;
    this.position = options?.position;
  }
}

/**
 * Error during ZIP operations
 */
export class XlsxZipError extends XlsxError {
  public readonly zipFile?: string;
  public readonly entryName?: string;

  constructor(
    message: string,
    options?: { zipFile?: string; entryName?: string }
  ) {
    const details = [];
    if (options?.entryName) details.push(`entry: ${options.entryName}`);

    const fullMessage =
      details.length > 0 ? `${message} (${details.join(", ")})` : message;

    super(fullMessage);
    this.name = "XlsxZipError";
    this.zipFile = options?.zipFile;
    this.entryName = options?.entryName;
  }
}

/**
 * Error during XML parsing
 */
export class XlsxXmlError extends XlsxError {
  public readonly xmlFile?: string;
  public readonly line?: number;
  public readonly column?: number;

  constructor(
    message: string,
    options?: { xmlFile?: string; line?: number; column?: number }
  ) {
    const details = [];
    if (options?.xmlFile) details.push(`file: ${options.xmlFile}`);
    if (options?.line !== undefined) details.push(`line: ${options.line}`);
    if (options?.column !== undefined)
      details.push(`column: ${options.column}`);

    const fullMessage =
      details.length > 0 ? `${message} (${details.join(", ")})` : message;

    super(fullMessage);
    this.name = "XlsxXmlError";
    this.xmlFile = options?.xmlFile;
    this.line = options?.line;
    this.column = options?.column;
  }
}

/**
 * Error when a required file is not found in XLSX
 */
export class XlsxFileNotFoundError extends XlsxError {
  public readonly fileName: string;

  constructor(fileName: string) {
    super(`Required file not found in XLSX archive: ${fileName}`);
    this.name = "XlsxFileNotFoundError";
    this.fileName = fileName;
  }
}

/**
 * Error when sheet is not found
 */
export class XlsxSheetNotFoundError extends XlsxError {
  public readonly sheetName: string;
  public readonly availableSheets: string[];

  constructor(sheetName: string, availableSheets: string[] = []) {
    const available =
      availableSheets.length > 0
        ? ` Available sheets: ${availableSheets.join(", ")}`
        : "";
    super(`Sheet not found: "${sheetName}".${available}`);
    this.name = "XlsxSheetNotFoundError";
    this.sheetName = sheetName;
    this.availableSheets = availableSheets;
  }
}

/**
 * Error during DEFLATE decompression
 */
export class XlsxDeflateError extends XlsxError {
  public readonly position?: number;

  constructor(message: string, position?: number) {
    const fullMessage =
      position === undefined ? message : `${message} at position ${position}`;
    super(fullMessage);
    this.name = "XlsxDeflateError";
    this.position = position;
  }
}

/**
 * Error when data type is invalid
 */
export class XlsxDataTypeError extends XlsxError {
  public readonly expectedType: string;
  public readonly receivedType: string;

  constructor(expectedType: string, receivedType: string) {
    super(`Invalid data type: expected ${expectedType}, received ${receivedType}`);
    this.name = "XlsxDataTypeError";
    this.expectedType = expectedType;
    this.receivedType = receivedType;
  }
}

/**
 * Error when platform is not supported
 */
export class XlsxPlatformError extends XlsxError {
  public readonly feature: string;
  public readonly requiredPlatform: string;

  constructor(feature: string, requiredPlatform: string) {
    super(`${feature} is only available in ${requiredPlatform}`);
    this.name = "XlsxPlatformError";
    this.feature = feature;
    this.requiredPlatform = requiredPlatform;
  }
}
