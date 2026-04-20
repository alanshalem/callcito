/**
 * Tests for XLSX streaming functionality
 */
import assert from "node:assert";
import path from "node:path";
import { describe, it } from "node:test";
import XLSX from "../index";

const __dirname = path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Z]:)/, "$1");

describe("XLSX Streaming", () => {
  describe("stream", () => {
    it("should create stream reader from buffer", () => {
      // Create a test workbook
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([
        ["A", "B", "C"],
        [1, 2, 3],
      ]);
      XLSX.utils.book_append_sheet(wb, ws, "Test");
      const buffer = XLSX.write(wb);

      const stream = XLSX.stream(buffer);

      assert.ok(stream);
      assert.deepStrictEqual(stream.SheetNames, ["Test"]);
    });
  });

  describe("streamFile", () => {
    it("should create stream reader from file", () => {
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

      const stream = XLSX.streamFile(catalogPath);

      assert.ok(stream);
      assert.ok(stream.SheetNames.length > 0);
    });
  });

  describe("streamRows", () => {
    it("should stream rows one by one", () => {
      const data = [
        ["Name", "Age", "City"],
        ["Alice", 30, "NYC"],
        ["Bob", 25, "LA"],
        ["Charlie", 35, "Chicago"],
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(data), "People");
      const buffer = XLSX.write(wb);

      const stream = XLSX.stream(buffer);
      const rows: Array<{ rowIndex: number; cellCount: number }> = [];

      for (const row of stream.streamRows("People")) {
        rows.push({ rowIndex: row.rowIndex, cellCount: row.cells.length });
      }

      assert.strictEqual(rows.length, 4);
      assert.strictEqual(rows[0].rowIndex, 0);
      assert.strictEqual(rows[0].cellCount, 3);
    });

    it("should support startRow option", () => {
      const data = [
        ["Header1", "Header2"],
        ["Row1", 1],
        ["Row2", 2],
        ["Row3", 3],
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(data), "Data");
      const buffer = XLSX.write(wb);

      const stream = XLSX.stream(buffer);
      const rows: number[] = [];

      for (const row of stream.streamRows("Data", { startRow: 2 })) {
        rows.push(row.rowIndex);
      }

      assert.deepStrictEqual(rows, [2, 3]);
    });

    it("should support endRow option", () => {
      const data = [
        ["A"],
        ["B"],
        ["C"],
        ["D"],
        ["E"],
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(data), "Letters");
      const buffer = XLSX.write(wb);

      const stream = XLSX.stream(buffer);
      const rows: number[] = [];

      for (const row of stream.streamRows("Letters", { endRow: 2 })) {
        rows.push(row.rowIndex);
      }

      assert.deepStrictEqual(rows, [0, 1, 2]);
    });
  });

  describe("streamRowsAsArrays", () => {
    it("should stream rows as arrays", () => {
      const data = [
        ["Name", "Score"],
        ["Alice", 100],
        ["Bob", 95],
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(data), "Scores");
      const buffer = XLSX.write(wb);

      const stream = XLSX.stream(buffer);
      const rows: (string | number | boolean | null)[][] = [];

      for (const row of stream.streamRowsAsArrays("Scores")) {
        rows.push(row);
      }

      assert.strictEqual(rows.length, 3);
      assert.strictEqual(rows[0][0], "Name");
      assert.strictEqual(rows[1][0], "Alice");
      assert.strictEqual(rows[1][1], 100);
    });
  });

  describe("processInChunks", () => {
    it("should process rows in chunks", async () => {
      const data: (string | number)[][] = [];
      for (let i = 0; i < 10; i++) {
        data.push([`Row${i}`, i]);
      }

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(data), "Data");
      const buffer = XLSX.write(wb);

      const stream = XLSX.stream(buffer);
      const chunks: { size: number; startIndex: number }[] = [];

      await stream.processInChunks("Data", 3, (rows, startIndex) => {
        chunks.push({ size: rows.length, startIndex });
      });

      assert.strictEqual(chunks.length, 4); // 10 rows / 3 per chunk = 4 chunks
      assert.strictEqual(chunks[0].size, 3);
      assert.strictEqual(chunks[0].startIndex, 0);
      assert.strictEqual(chunks[3].size, 1); // Last chunk has 1 row
    });
  });

  describe("countRows", () => {
    it("should count rows without loading all data", () => {
      const data: string[][] = [];
      for (let i = 0; i < 50; i++) {
        data.push([`Row ${i}`]);
      }

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(data), "Many");
      const buffer = XLSX.write(wb);

      const stream = XLSX.stream(buffer);
      const count = stream.countRows("Many");

      assert.strictEqual(count, 50);
    });
  });

  describe("memory efficiency", () => {
    it("should handle streaming without loading entire sheet", () => {
      // Create a moderately large dataset
      const data: (string | number)[][] = [];
      for (let i = 0; i < 100; i++) {
        data.push([`Row${i}`, i, `Data${i}`, Math.random()]);
      }

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(data), "Large");
      const buffer = XLSX.write(wb);

      const stream = XLSX.stream(buffer);
      let rowCount = 0;
      let sum = 0;

      // Process row by row
      for (const row of stream.streamRowsAsArrays("Large")) {
        rowCount++;
        if (typeof row[1] === "number") {
          sum += row[1];
        }
      }

      assert.strictEqual(rowCount, 100);
      // Sum of 0 to 99
      assert.strictEqual(sum, 4950);
    });
  });
});
