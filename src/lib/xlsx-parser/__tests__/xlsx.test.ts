/**
 * Integration tests for XLSX parser
 * Tests the complete parsing flow with real XLSX file
 */
import assert from "node:assert";
import path from "node:path";
import { describe, it } from "node:test";
import XLSX from "../index";

describe("XLSX.readFile", () => {
  const catalogPath = path.join(
    __dirname,
    "..",
    "..",
    "..",
    "..",
    "public",
    "catalogo",
    "excel",
    "Catalogo CKING.xlsx"
  );

  it("should read XLSX file and return workbook", () => {
    const workbook = XLSX.readFile(catalogPath);

    assert.ok(workbook);
    assert.ok(Array.isArray(workbook.SheetNames));
    assert.ok(workbook.SheetNames.length > 0);
  });

  it("should have SheetNames array", () => {
    const workbook = XLSX.readFile(catalogPath);

    assert.ok(workbook.SheetNames.length >= 1);
    assert.strictEqual(typeof workbook.SheetNames[0], "string");
  });

  it("should access sheets by name", () => {
    const workbook = XLSX.readFile(catalogPath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    assert.ok(sheet);
    assert.ok(sheet._data);
    assert.ok(Array.isArray(sheet._data));
  });
});

describe("XLSX.utils.sheet_to_json", () => {
  const catalogPath = path.join(
    __dirname,
    "..",
    "..",
    "..",
    "..",
    "public",
    "catalogo",
    "excel",
    "Catalogo CKING.xlsx"
  );

  it("should convert sheet to array of arrays with header: 1", () => {
    const workbook = XLSX.readFile(catalogPath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    assert.ok(Array.isArray(rows));
    assert.ok(rows.length > 0);
    assert.ok(Array.isArray(rows[0]));
  });

  it("should return data with correct types", () => {
    const workbook = XLSX.readFile(catalogPath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    // First row should have some values
    const firstRow = rows[0];
    assert.ok(firstRow.some((cell) => cell !== null));
  });
});

describe("XLSX.utils date functions", () => {
  it("should convert Excel date to JS Date", () => {
    const date = XLSX.utils.excelDateToJSDate(44197); // Jan 1, 2021
    assert.strictEqual(date.getUTCFullYear(), 2021);
    assert.strictEqual(date.getUTCMonth(), 0);
    assert.strictEqual(date.getUTCDate(), 1);
  });

  it("should convert JS Date to Excel date", () => {
    const date = new Date(Date.UTC(2021, 0, 1));
    const serial = XLSX.utils.jsDateToExcelDate(date);
    assert.strictEqual(Math.floor(serial), 44197);
  });
});

describe("Error handling", () => {
  it("should return undefined for non-existent sheet", () => {
    const catalogPath = path.join(
      __dirname,
      "..",
      "..",
      "..",
      "..",
      "public",
      "catalogo",
      "excel",
      "Catalogo CKING.xlsx"
    );

    const workbook = XLSX.readFile(catalogPath);
    const sheet = workbook.Sheets["NonExistentSheet"];

    assert.strictEqual(sheet, undefined);
  });

  it("should list available sheet names", () => {
    const catalogPath = path.join(
      __dirname,
      "..",
      "..",
      "..",
      "..",
      "public",
      "catalogo",
      "excel",
      "Catalogo CKING.xlsx"
    );

    const workbook = XLSX.readFile(catalogPath);

    assert.ok(workbook.SheetNames.length > 0);
    assert.strictEqual(typeof workbook.SheetNames[0], "string");
  });
});
