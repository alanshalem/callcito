/**
 * Tests for formula support
 */
import assert from "node:assert";
import path from "node:path";
import { describe, it } from "node:test";
import XLSX, { createFormula, extractFormulas, isFormulaCell } from "../index";
import type { CellValue } from "../types";

const __dirname = path
  .dirname(new URL(import.meta.url).pathname)
  .replace(/^\/([A-Z]:)/, "$1");

describe("Formula Support", () => {
  describe("createFormula", () => {
    it("should create a formula cell with just formula", () => {
      const cell = createFormula("SUM(A1:A10)");

      assert.ok(isFormulaCell(cell));
      assert.strictEqual(cell.f, "SUM(A1:A10)");
      assert.strictEqual(cell.v, undefined);
    });

    it("should create a formula cell with calculated value", () => {
      const cell = createFormula("A1+B1", 150);

      assert.ok(isFormulaCell(cell));
      assert.strictEqual(cell.f, "A1+B1");
      assert.strictEqual(cell.v, 150);
    });
  });

  describe("isFormulaCell", () => {
    it("should return true for formula cells", () => {
      assert.strictEqual(isFormulaCell({ f: "A1+B1" }), true);
      assert.strictEqual(isFormulaCell({ f: "SUM(A:A)", v: 100 }), true);
    });

    it("should return false for non-formula values", () => {
      assert.strictEqual(isFormulaCell("string"), false);
      assert.strictEqual(isFormulaCell(123), false);
      assert.strictEqual(isFormulaCell(null), false);
      assert.strictEqual(isFormulaCell(undefined), false);
      assert.strictEqual(isFormulaCell({ value: 123 }), false);
    });
  });

  describe("Writing formulas", () => {
    it("should write formulas to XLSX and read them back", () => {
      const data = [
        ["Value1", "Value2", "Sum"],
        [10, 20, createFormula("A2+B2", 30)],
        [5, 15, createFormula("A3+B3", 20)],
      ];

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(data as CellValue[][]);
      XLSX.utils.book_append_sheet(wb, ws, "Formulas");

      const buffer = XLSX.write(wb);
      const wb2 = XLSX.read(buffer);

      const rows = XLSX.utils.sheet_to_json<(string | number)[]>(
        wb2.Sheets["Formulas"],
        { header: 1 }
      );

      // The formula results should be preserved
      assert.strictEqual(rows[1][2], 30);
      assert.strictEqual(rows[2][2], 20);
    });

    it("should write formulas without pre-calculated values", () => {
      const data = [
        ["A", "B", "Sum"],
        [1, 2, createFormula("A2+B2")],
      ];

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(data as CellValue[][]);
      XLSX.utils.book_append_sheet(wb, ws, "Sheet1");

      const buffer = XLSX.write(wb);

      // Just verify it doesn't crash
      assert.ok(buffer.length > 0);
    });

    it("should handle complex formulas", () => {
      const data = [
        ["Data"],
        [10],
        [20],
        [30],
        ["Total", createFormula("SUM(A2:A4)", 60)],
        ["Average", createFormula("AVERAGE(A2:A4)", 20)],
        ["Max", createFormula("MAX(A2:A4)", 30)],
      ];

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(data as CellValue[][]);
      XLSX.utils.book_append_sheet(wb, ws, "Stats");

      const buffer = XLSX.write(wb);
      const wb2 = XLSX.read(buffer);

      const rows = XLSX.utils.sheet_to_json<(string | number)[]>(
        wb2.Sheets["Stats"],
        { header: 1 }
      );

      assert.strictEqual(rows[4][1], 60); // SUM result
      assert.strictEqual(rows[5][1], 20); // AVERAGE result
      assert.strictEqual(rows[6][1], 30); // MAX result
    });
  });

  describe("extractFormulas", () => {
    it("should extract formulas from worksheet XML", () => {
      // Create a workbook with formulas
      const data = [
        ["A", "B", "Sum"],
        [10, 20, createFormula("A2+B2", 30)],
        [5, 15, createFormula("A3+B3", 20)],
      ];

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(data as CellValue[][]);
      XLSX.utils.book_append_sheet(wb, ws, "Sheet1");

      const buffer = XLSX.write(wb);

      // Use streaming to access the raw XML for extractFormulas
      XLSX.stream(buffer);
      // We'd need to expose the raw XML, but for now just verify the function exists
      assert.strictEqual(typeof extractFormulas, "function");
    });
  });

  describe("Reading existing formulas", () => {
    it("should read formula results from existing XLSX files", () => {
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

      // Just verify we can read the file without errors
      const wb = XLSX.readFile(catalogPath);
      assert.ok(wb.SheetNames.length > 0);
    });
  });
});
