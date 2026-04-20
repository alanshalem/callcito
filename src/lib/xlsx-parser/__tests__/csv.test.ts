/**
 * CSV parser / writer tests — RFC 4180 coverage.
 */
import assert from "node:assert";
import { describe, it } from "node:test";
import XLSX, { parseCsvToRows, parseCsvToWorkbook, stringifyCsv, streamCsvRows } from "../index";

describe("parseCsvToRows — basic", () => {
  it("parses a simple comma-separated row", () => {
    const rows = parseCsvToRows("a,b,c\n1,2,3");
    assert.deepStrictEqual(rows, [
      ["a", "b", "c"],
      ["1", "2", "3"],
    ]);
  });

  it("handles CRLF line endings (Excel export)", () => {
    const rows = parseCsvToRows("a,b\r\n1,2\r\n");
    assert.deepStrictEqual(rows, [
      ["a", "b"],
      ["1", "2"],
    ]);
  });

  it("strips UTF-8 BOM by default", () => {
    const rows = parseCsvToRows("\uFEFFa,b\n1,2");
    assert.deepStrictEqual(rows[0], ["a", "b"]);
  });

  it("returns empty array on empty input", () => {
    assert.deepStrictEqual(parseCsvToRows(""), []);
  });
});

describe("parseCsvToRows — quoting", () => {
  it("parses quoted fields with commas", () => {
    const rows = parseCsvToRows('"hello, world",bar');
    assert.deepStrictEqual(rows, [["hello, world", "bar"]]);
  });

  it("parses escaped quotes (\"\")", () => {
    const rows = parseCsvToRows('"she said ""hi""",next');
    assert.deepStrictEqual(rows, [['she said "hi"', "next"]]);
  });

  it("parses embedded newlines inside quotes", () => {
    const rows = parseCsvToRows('"line1\nline2",foo');
    assert.deepStrictEqual(rows, [["line1\nline2", "foo"]]);
  });

  it("throws on unterminated quoted field", () => {
    assert.throws(
      () => parseCsvToRows('"unterminated,foo'),
      /unterminated quoted field/
    );
  });
});

describe("parseCsvToRows — delimiters", () => {
  it("supports semicolon delimiter (LATAM locale)", () => {
    const rows = parseCsvToRows("a;b;c\n1;2;3", { delimiter: ";" });
    assert.deepStrictEqual(rows[1], ["1", "2", "3"]);
  });

  it("supports tab delimiter (TSV)", () => {
    const rows = parseCsvToRows("a\tb\n1\t2", { delimiter: "\t" });
    assert.deepStrictEqual(rows[1], ["1", "2"]);
  });

  it("rejects multi-char delimiter", () => {
    assert.throws(() => parseCsvToRows("a,,b", { delimiter: ",," }));
  });

  it("rejects delimiter equal to quote", () => {
    assert.throws(() => parseCsvToRows('a"b', { quote: ",", delimiter: "," }));
  });
});

describe("parseCsvToRows — typed coercion", () => {
  it("leaves values as strings by default", () => {
    const rows = parseCsvToRows("name,price\nfoo,123", { typed: false });
    assert.strictEqual(rows[1][1], "123");
  });

  it("coerces numbers and booleans when typed: true", () => {
    const rows = parseCsvToRows("name,price,active\nfoo,123,true\nbar,45.5,false", { typed: true });
    assert.strictEqual(rows[1][1], 123);
    assert.strictEqual(rows[1][2], true);
    assert.strictEqual(rows[2][1], 45.5);
    assert.strictEqual(rows[2][2], false);
  });

  it("preserves leading-zero strings (SKUs) even when typed", () => {
    const rows = parseCsvToRows("sku\n007", { typed: true });
    assert.strictEqual(rows[1][0], "007");
  });

  it("converts empty string to null when typed", () => {
    const rows = parseCsvToRows("a,b\n1,", { typed: true });
    assert.strictEqual(rows[1][1], null);
  });
});

describe("parseCsvToWorkbook + XLSX.csv.read", () => {
  it("wraps parsed rows in an XlsxWorkbook shape", () => {
    const wb = parseCsvToWorkbook("a,b\n1,2");
    assert.deepStrictEqual(wb.SheetNames, ["Sheet1"]);
    const sheet = wb.Sheets["Sheet1"];
    assert.deepStrictEqual(sheet._data, [
      ["a", "b"],
      ["1", "2"],
    ]);
  });

  it("is callable via the XLSX.csv API", () => {
    const wb = XLSX.csv.read("a,b\n1,2");
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 });
    assert.deepStrictEqual(rows, [
      ["a", "b"],
      ["1", "2"],
    ]);
  });
});

describe("stringifyCsv", () => {
  it("serializes plain rows without quoting", () => {
    const out = stringifyCsv([
      ["a", "b"],
      ["1", "2"],
    ]);
    assert.strictEqual(out, "a,b\r\n1,2");
  });

  it("quotes fields containing delimiters / quotes / newlines", () => {
    const out = stringifyCsv([["hi, you", 'she said "hello"', "line1\nline2"]]);
    assert.strictEqual(out, '"hi, you","she said ""hello""","line1\nline2"');
  });

  it("round-trips through parse", () => {
    const input = [
      ["name", "price", "note"],
      ["foo", 10, "hi, world"],
      ["bar", 20, 'she said "hey"'],
    ];
    const csv = stringifyCsv(input);
    const parsed = parseCsvToRows(csv, { typed: true });
    assert.deepStrictEqual(parsed, input);
  });

  it("supports BOM + custom eol", () => {
    const out = stringifyCsv([["a"]], { bom: true, eol: "\n" });
    assert.strictEqual(out, "\uFEFFa");
  });
});

describe("streamCsvRows", () => {
  it("yields rows sequentially", () => {
    const rows = Array.from(streamCsvRows("a,b\n1,2\n3,4"));
    assert.strictEqual(rows.length, 3);
    assert.deepStrictEqual(rows[2], ["3", "4"]);
  });
});
