/**
 * DEFLATE decompression algorithm (RFC 1951)
 * Zero-dependency implementation for XLSX parsing
 */

import { BitReader } from "../utils/buffer-reader";
import { XlsxDeflateError } from "../utils/errors";

// Length base values for codes 257-285
const LENGTH_BASE = [
  3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31, 35, 43, 51, 59, 67,
  83, 99, 115, 131, 163, 195, 227, 258,
];

// Extra bits for length codes 257-285
const LENGTH_EXTRA = [
  0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5,
  5, 5, 0,
];

// Distance base values for codes 0-29
const DISTANCE_BASE = [
  1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193, 257, 385, 513, 769,
  1025, 1537, 2049, 3073, 4097, 6145, 8193, 12289, 16385, 24577,
];

// Extra bits for distance codes 0-29
const DISTANCE_EXTRA = [
  0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11,
  11, 12, 12, 13, 13,
];

// Code length alphabet order for dynamic Huffman trees
const CODE_LENGTH_ORDER = [
  16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15,
];

/**
 * Huffman tree node for decoding
 */
interface HuffmanNode {
  symbol?: number;
  left?: HuffmanNode;
  right?: HuffmanNode;
}

/** Count how many codes have each bit-length */
function countCodeLengths(codeLengths: Uint8Array, maxLen: number): Uint16Array {
  const blCount = new Uint16Array(maxLen + 1);
  for (const len of codeLengths) {
    if (len > 0) blCount[len]++;
  }
  return blCount;
}

/** Insert a symbol into the Huffman tree at the given code value and bit-length */
function insertSymbol(root: HuffmanNode, codeVal: number, len: number, symbol: number): void {
  let node = root;
  for (let bit = len - 1; bit >= 0; bit--) {
    const b = (codeVal >> bit) & 1;
    if (b === 0) {
      node.left ??= {};
      node = node.left;
    } else {
      node.right ??= {};
      node = node.right;
    }
  }
  node.symbol = symbol;
}

/**
 * Build a Huffman tree from code lengths
 * @param codeLengths - Array of code lengths (0 = unused symbol)
 * @returns Root node of Huffman tree
 */
function buildHuffmanTree(codeLengths: Uint8Array): HuffmanNode {
  const maxLen = Math.max(...codeLengths);
  if (maxLen === 0) return {};

  const blCount = countCodeLengths(codeLengths, maxLen);

  // Calculate starting code for each length
  const nextCode = new Uint16Array(maxLen + 1);
  let code = 0;
  for (let bits = 1; bits <= maxLen; bits++) {
    code = (code + blCount[bits - 1]) << 1;
    nextCode[bits] = code;
  }

  // Build the tree
  const root: HuffmanNode = {};
  for (let symbol = 0; symbol < codeLengths.length; symbol++) {
    const len = codeLengths[symbol];
    if (len === 0) continue;
    insertSymbol(root, nextCode[len]++, len, symbol);
  }

  return root;
}

/**
 * Decode a symbol using Huffman tree
 * @param reader - Bit reader
 * @param tree - Huffman tree root
 * @returns Decoded symbol
 */
function decodeSymbol(reader: BitReader, tree: HuffmanNode): number {
  let node = tree;

  while (node.symbol === undefined) {
    const bit = reader.readBit();
    node = bit === 0 ? node.left! : node.right!;
    if (!node) {
      throw new XlsxDeflateError("Invalid Huffman code in compressed data");
    }
  }

  return node.symbol;
}

/**
 * Build fixed Huffman trees (used for block type 1)
 */
function buildFixedTrees(): {
  litLenTree: HuffmanNode;
  distTree: HuffmanNode;
} {
  // Fixed literal/length code lengths
  const litLenLengths = new Uint8Array(288);
  // 0-143: 8 bits
  for (let i = 0; i <= 143; i++) litLenLengths[i] = 8;
  // 144-255: 9 bits
  for (let i = 144; i <= 255; i++) litLenLengths[i] = 9;
  // 256-279: 7 bits
  for (let i = 256; i <= 279; i++) litLenLengths[i] = 7;
  // 280-287: 8 bits
  for (let i = 280; i <= 287; i++) litLenLengths[i] = 8;

  // Fixed distance code lengths (all 5 bits)
  const distLengths = new Uint8Array(32);
  for (let i = 0; i < 32; i++) distLengths[i] = 5;

  return {
    litLenTree: buildHuffmanTree(litLenLengths),
    distTree: buildHuffmanTree(distLengths),
  };
}

// Cache fixed trees
let fixedTrees: { litLenTree: HuffmanNode; distTree: HuffmanNode } | null =
  null;

function getFixedTrees() {
  fixedTrees ??= buildFixedTrees();
  return fixedTrees;
}

/** Decode a single code-length symbol and advance position in lengths array */
function decodeNextLength(sym: number, reader: BitReader, lengths: Uint8Array, i: number): number {
  if (sym < 16) {
    lengths[i++] = sym;
  } else if (sym === 16) {
    // Repeat previous length 3-6 times
    const repeat = reader.readBits(2) + 3;
    const prev = lengths[i - 1];
    for (let j = 0; j < repeat; j++) lengths[i++] = prev;
  } else if (sym === 17) {
    // Repeat 0 for 3-10 times
    const repeat = reader.readBits(3) + 3;
    for (let j = 0; j < repeat; j++) lengths[i++] = 0;
  } else {
    // sym === 18: Repeat 0 for 11-138 times
    const repeat = reader.readBits(7) + 11;
    for (let j = 0; j < repeat; j++) lengths[i++] = 0;
  }
  return i;
}

/**
 * Decode dynamic Huffman trees from compressed data
 */
function decodeDynamicTrees(reader: BitReader): {
  litLenTree: HuffmanNode;
  distTree: HuffmanNode;
} {
  const hlit = reader.readBits(5) + 257; // literal/length codes
  const hdist = reader.readBits(5) + 1; // distance codes
  const hclen = reader.readBits(4) + 4; // code length codes

  // Read code length code lengths
  const codeLenLengths = new Uint8Array(19);
  for (let i = 0; i < hclen; i++) {
    codeLenLengths[CODE_LENGTH_ORDER[i]] = reader.readBits(3);
  }

  const codeLenTree = buildHuffmanTree(codeLenLengths);

  // Decode literal/length and distance code lengths
  const allLengths = new Uint8Array(hlit + hdist);
  let i = 0;
  while (i < allLengths.length) {
    i = decodeNextLength(decodeSymbol(reader, codeLenTree), reader, allLengths, i);
  }

  return {
    litLenTree: buildHuffmanTree(allLengths.slice(0, hlit)),
    distTree: buildHuffmanTree(allLengths.slice(hlit)),
  };
}

/**
 * Decompress a DEFLATE-compressed block
 */
function inflateBlock(
  reader: BitReader,
  litLenTree: HuffmanNode,
  distTree: HuffmanNode,
  output: number[]
): void {
  while (true) {
    const sym = decodeSymbol(reader, litLenTree);

    if (sym < 256) {
      // Literal byte
      output.push(sym);
    } else if (sym === 256) {
      // End of block
      break;
    } else {
      // Length/distance pair (LZ77 back-reference)
      const lengthIdx = sym - 257;
      const length = LENGTH_BASE[lengthIdx] + reader.readBits(LENGTH_EXTRA[lengthIdx]);

      const distSym = decodeSymbol(reader, distTree);
      const distance = DISTANCE_BASE[distSym] + reader.readBits(DISTANCE_EXTRA[distSym]);

      // Copy from output buffer
      const start = output.length - distance;
      for (let i = 0; i < length; i++) {
        output.push(output[start + i]);
      }
    }
  }
}

/**
 * Decompress DEFLATE-compressed data
 * @param compressed - Compressed data
 * @returns Decompressed data
 */
export function inflate(compressed: Uint8Array): Uint8Array {
  const reader = new BitReader(compressed);
  const output: number[] = [];

  let bfinal = 0;

  while (bfinal === 0) {
    bfinal = reader.readBit();
    const btype = reader.readBits(2);

    if (btype === 0) {
      // Stored (uncompressed) block
      reader.alignToByte();
      const len = reader.readBits(16);
      reader.readBits(16); // nlen (one's complement, we skip validation)
      const bytes = reader.readAlignedBytes(len);
      for (const b of bytes) {
        output.push(b);
      }
    } else if (btype === 1) {
      // Fixed Huffman codes
      const { litLenTree, distTree } = getFixedTrees();
      inflateBlock(reader, litLenTree, distTree, output);
    } else if (btype === 2) {
      // Dynamic Huffman codes
      const { litLenTree, distTree } = decodeDynamicTrees(reader);
      inflateBlock(reader, litLenTree, distTree, output);
    } else {
      throw new XlsxDeflateError(`Invalid DEFLATE block type: ${btype}`);
    }
  }

  return new Uint8Array(output);
}
