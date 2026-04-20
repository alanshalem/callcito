/**
 * Tests for XLSX writing functionality
 */
import assert from "node:assert";
import { describe, it } from "node:test";
import XLSX from "../index";

describe("XLSX Writing", () => {
  describe("book_new", () => {
    it("should create an empty workbook", () => {
      const wb = XLSX.utils.book_new();

      assert.ok(wb);
      assert.deepStrictEqual(wb.SheetNames, []);
      assert.deepStrictEqual(wb.Sheets, {});
    });
  });

  describe("aoa_to_sheet", () => {
    it("should convert array of arrays to worksheet", () => {
      const data = [
        ["Name", "Age", "City"],
        ["Alice", 30, "NYC"],
        ["Bob", 25, "LA"],
      ];

      const ws = XLSX.utils.aoa_to_sheet(data);

      assert.ok(ws);
      assert.ok(ws._data);
    });

    it("should handle empty arrays", () => {
      const ws = XLSX.utils.aoa_to_sheet([]);

      assert.ok(ws);
      assert.deepStrictEqual(ws._data, []);
    });

    it("should handle null values", () => {
      const data = [
        ["A", null, "C"],
        [null, "B", null],
      ];

      const ws = XLSX.utils.aoa_to_sheet(data);
      assert.ok(ws);
    });
  });

  describe("book_append_sheet", () => {
    it("should add sheet to workbook", () => {
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([["Hello"]]);

      XLSX.utils.book_append_sheet(wb, ws, "Sheet1");

      assert.deepStrictEqual(wb.SheetNames, ["Sheet1"]);
      assert.ok(wb.Sheets["Sheet1"]);
      assert.strictEqual(wb.Sheets["Sheet1"]._name, "Sheet1");
    });

    it("should add multiple sheets", () => {
      const wb = XLSX.utils.book_new();

      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.aoa_to_sheet([["Sheet 1 Data"]]),
        "First"
      );
      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.aoa_to_sheet([["Sheet 2 Data"]]),
        "Second"
      );

      assert.deepStrictEqual(wb.SheetNames, ["First", "Second"]);
      assert.ok(wb.Sheets["First"]);
      assert.ok(wb.Sheets["Second"]);
    });
  });

  describe("write", () => {
    it("should write workbook to buffer", () => {
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([
        ["Name", "Value"],
        ["Test", 123],
      ]);
      XLSX.utils.book_append_sheet(wb, ws, "Data");

      const buffer = XLSX.write(wb);

      assert.ok(buffer instanceof Uint8Array);
      assert.ok(buffer.length > 0);

      // Check ZIP signature (PK)
      assert.strictEqual(buffer[0], 0x50); // 'P'
      assert.strictEqual(buffer[1], 0x4b); // 'K'
    });

    it("should create valid XLSX that can be read back", () => {
      const originalData = [
        ["Header1", "Header2", "Header3"],
        ["A", 100, true],
        ["B", 200, false],
        ["C", 300, true],
      ];

      // Create and write
      const wb1 = XLSX.utils.book_new();
      const ws1 = XLSX.utils.aoa_to_sheet(originalData);
      XLSX.utils.book_append_sheet(wb1, ws1, "TestSheet");
      const buffer = XLSX.write(wb1);

      // Read back
      const wb2 = XLSX.read(buffer);

      assert.deepStrictEqual(wb2.SheetNames, ["TestSheet"]);

      const rows = XLSX.utils.sheet_to_json<(string | number | boolean)[]>(
        wb2.Sheets["TestSheet"],
        { header: 1 }
      );

      assert.strictEqual(rows[0][0], "Header1");
      assert.strictEqual(rows[0][1], "Header2");
      assert.strictEqual(rows[1][0], "A");
      assert.strictEqual(rows[1][1], 100);
      assert.strictEqual(rows[2][0], "B");
      assert.strictEqual(rows[3][2], true);
    });

    it("should handle special characters in strings", () => {
      const data = [
        ["Special", "Characters"],
        ["<tag>", "&amp;"],
        ['"quoted"', "apostrophe'"],
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(data), "Sheet1");
      const buffer = XLSX.write(wb);

      // Read back and verify
      const wb2 = XLSX.read(buffer);
      const rows = XLSX.utils.sheet_to_json<string[]>(wb2.Sheets["Sheet1"], {
        header: 1,
      });

      assert.strictEqual(rows[1][0], "<tag>");
      assert.strictEqual(rows[1][1], "&amp;");
      assert.strictEqual(rows[2][0], '"quoted"');
    });

    it("should handle empty workbook", () => {
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([]), "Empty");

      const buffer = XLSX.write(wb);
      assert.ok(buffer.length > 0);
    });

    it("should handle multiple sheets", () => {
      const wb = XLSX.utils.book_new();

      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.aoa_to_sheet([["Sheet1", "Data"]]),
        "First"
      );
      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.aoa_to_sheet([["Sheet2", "Data"]]),
        "Second"
      );
      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.aoa_to_sheet([["Sheet3", "Data"]]),
        "Third"
      );

      const buffer = XLSX.write(wb);
      const wb2 = XLSX.read(buffer);

      assert.deepStrictEqual(wb2.SheetNames, ["First", "Second", "Third"]);
    });

    it("should handle numbers correctly", () => {
      const data = [
        ["Integer", "Float", "Negative", "Zero"],
        [42, 3.14159, -100, 0],
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(data), "Numbers");
      const buffer = XLSX.write(wb);

      const wb2 = XLSX.read(buffer);
      const rows = XLSX.utils.sheet_to_json<(string | number)[]>(
        wb2.Sheets["Numbers"],
        { header: 1 }
      );

      assert.strictEqual(rows[1][0], 42);
      assert.strictEqual(rows[1][1], 3.14159);
      assert.strictEqual(rows[1][2], -100);
      assert.strictEqual(rows[1][3], 0);
    });

    it("should handle boolean values", () => {
      const data = [
        ["True", "False"],
        [true, false],
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(data), "Booleans");
      const buffer = XLSX.write(wb);

      const wb2 = XLSX.read(buffer);
      const rows = XLSX.utils.sheet_to_json<(string | boolean)[]>(
        wb2.Sheets["Booleans"],
        { header: 1 }
      );

      assert.strictEqual(rows[1][0], true);
      assert.strictEqual(rows[1][1], false);
    });
  });
});

describe("CRC32", () => {
  it("should calculate correct CRC32", async () => {
    const { crc32 } = await import("../zip/deflate-compress");

    // Known test vector: "123456789" should have CRC32 of 0xCBF43926
    const data = new TextEncoder().encode("123456789");
    const result = crc32(data);

    assert.strictEqual(result, 0xcbf43926);
  });
});
