/**
 * Tests for date utilities
 */
import assert from "node:assert";
import { describe, it } from "node:test";
import {
    excelDateToJSDate, isBuiltinDateFormat, isDateFormat, jsDateToExcelDate
} from "../utils/date-utils";

describe("excelDateToJSDate", () => {
  it("should convert Excel serial 1 to January 1, 1900", () => {
    const date = excelDateToJSDate(1);
    assert.strictEqual(date.getUTCFullYear(), 1900);
    assert.strictEqual(date.getUTCMonth(), 0); // January
    assert.strictEqual(date.getUTCDate(), 1);
  });

  it("should convert Excel serial 44197 to January 1, 2021", () => {
    // 44197 is January 1, 2021 in Excel
    const date = excelDateToJSDate(44197);
    assert.strictEqual(date.getUTCFullYear(), 2021);
    assert.strictEqual(date.getUTCMonth(), 0);
    assert.strictEqual(date.getUTCDate(), 1);
  });

  it("should handle fractional days (time component)", () => {
    // 44197.5 is January 1, 2021 at 12:00:00
    const date = excelDateToJSDate(44197.5);
    assert.strictEqual(date.getUTCHours(), 12);
    assert.strictEqual(date.getUTCMinutes(), 0);
  });

  it("should throw for invalid input", () => {
    assert.throws(() => excelDateToJSDate(Number.NaN));
    assert.throws(() => excelDateToJSDate("invalid" as unknown as number));
  });
});

describe("jsDateToExcelDate", () => {
  it("should convert January 1, 2021 to Excel serial 44197", () => {
    const date = new Date(Date.UTC(2021, 0, 1));
    const serial = jsDateToExcelDate(date);
    assert.strictEqual(Math.floor(serial), 44197);
  });

  it("should be reversible with excelDateToJSDate", () => {
    const original = new Date(Date.UTC(2023, 5, 15, 10, 30, 0));
    const serial = jsDateToExcelDate(original);
    const converted = excelDateToJSDate(serial);

    assert.strictEqual(converted.getUTCFullYear(), original.getUTCFullYear());
    assert.strictEqual(converted.getUTCMonth(), original.getUTCMonth());
    assert.strictEqual(converted.getUTCDate(), original.getUTCDate());
    assert.strictEqual(converted.getUTCHours(), original.getUTCHours());
  });

  it("should throw for invalid Date", () => {
    assert.throws(() => jsDateToExcelDate(new Date("invalid")));
    assert.throws(() => jsDateToExcelDate("string" as unknown as Date));
  });
});

describe("isDateFormat", () => {
  it("should detect date formats", () => {
    assert.strictEqual(isDateFormat("yyyy-mm-dd"), true);
    assert.strictEqual(isDateFormat("dd/mm/yyyy"), true);
    assert.strictEqual(isDateFormat("m/d/yy"), true);
    assert.strictEqual(isDateFormat("hh:mm:ss"), true);
    assert.strictEqual(isDateFormat("h:mm AM/PM"), true);
  });

  it("should not detect non-date formats", () => {
    assert.strictEqual(isDateFormat("#,##0.00"), false);
    assert.strictEqual(isDateFormat("0%"), false);
    assert.strictEqual(isDateFormat("General"), false);
    assert.strictEqual(isDateFormat(undefined), false);
  });

  it("should ignore quoted text", () => {
    assert.strictEqual(isDateFormat('"Date: "yyyy'), true);
    assert.strictEqual(isDateFormat('"No date here"'), false);
  });
});

describe("isBuiltinDateFormat", () => {
  it("should identify built-in date formats", () => {
    assert.strictEqual(isBuiltinDateFormat(14), true); // m/d/yyyy
    assert.strictEqual(isBuiltinDateFormat(22), true); // m/d/yyyy h:mm
  });

  it("should not identify non-date formats", () => {
    assert.strictEqual(isBuiltinDateFormat(0), false); // General
    assert.strictEqual(isBuiltinDateFormat(1), false); // 0
    assert.strictEqual(isBuiltinDateFormat(2), false); // 0.00
  });
});
