/**
 * Tests for DEFLATE decompression
 */
import assert from "node:assert";
import { describe, it } from "node:test";
import { inflate } from "../zip/deflate";

describe("inflate", () => {
  it("should decompress stored blocks (no compression)", () => {
    // Stored block: bfinal=1, btype=00, len=5, nlen=~5, "hello"
    const compressed = new Uint8Array([
      0x01, // bfinal=1, btype=00 (stored)
      0x05,
      0x00, // len = 5
      0xfa,
      0xff, // nlen = ~5
      0x68,
      0x65,
      0x6c,
      0x6c,
      0x6f, // "hello"
    ]);

    const result = inflate(compressed);
    const text = new TextDecoder().decode(result);
    assert.strictEqual(text, "hello");
  });

  it("should decompress fixed Huffman blocks", () => {
    // This is "Hello" compressed with fixed Huffman
    // Created using zlib with strategy Z_FIXED
    const compressed = new Uint8Array([
      0xf3, 0x48, 0xcd, 0xc9, 0xc9, 0x07, 0x00,
    ]);

    const result = inflate(compressed);
    const text = new TextDecoder().decode(result);
    assert.strictEqual(text, "Hello");
  });

  it("should handle empty input gracefully", () => {
    // Minimal valid deflate stream - empty stored block
    const compressed = new Uint8Array([
      0x01, // bfinal=1, btype=00
      0x00,
      0x00, // len=0
      0xff,
      0xff, // nlen=~0
    ]);

    const result = inflate(compressed);
    assert.strictEqual(result.length, 0);
  });

  it("should decompress dynamic Huffman blocks", () => {
    // This is a longer text that uses dynamic Huffman encoding
    // "The quick brown fox" compressed with zlib
    const compressed = new Uint8Array([
      0x0b, 0xc9, 0x48, 0x55, 0x28, 0x2c, 0xcd, 0x4c,
      0xce, 0x56, 0x48, 0x2a, 0xca, 0x2f, 0xcf, 0x53,
      0x48, 0xcb, 0xaf, 0x00, 0x00,
    ]);

    const result = inflate(compressed);
    const text = new TextDecoder().decode(result);
    assert.strictEqual(text, "The quick brown fox");
  });
});
