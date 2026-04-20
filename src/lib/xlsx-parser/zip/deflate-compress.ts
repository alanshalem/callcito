/**
 * DEFLATE compression for ZIP writing
 * Implements RFC 1951 compression (simplified - uses stored blocks for reliability)
 */

/**
 * Compress data using DEFLATE algorithm
 * Uses stored blocks (no compression) for maximum compatibility
 * This is simpler and more reliable than implementing full Huffman encoding
 *
 * @param data - Data to compress
 * @returns Compressed data in DEFLATE format
 */
export function deflateStored(data: Uint8Array): Uint8Array {
  // For small files, stored blocks are efficient enough
  // and much simpler to implement correctly

  const maxBlockSize = 65535; // Max size for stored block
  const numBlocks = Math.ceil(data.length / maxBlockSize) || 1;

  // Calculate output size: 5 bytes header per block + data
  const outputSize = numBlocks * 5 + data.length;
  const output = new Uint8Array(outputSize);
  let outPos = 0;
  let inPos = 0;

  for (let i = 0; i < numBlocks; i++) {
    const isLast = i === numBlocks - 1;
    const blockSize = Math.min(maxBlockSize, data.length - inPos);

    // Block header
    // bfinal (1 bit) + btype (2 bits) = 0b001 for last stored, 0b000 for non-last stored
    output[outPos++] = isLast ? 0x01 : 0x00;

    // Length (16-bit little-endian)
    output[outPos++] = blockSize & 0xff;
    output[outPos++] = (blockSize >> 8) & 0xff;

    // One's complement of length
    output[outPos++] = ~blockSize & 0xff;
    output[outPos++] = (~blockSize >> 8) & 0xff;

    // Copy data
    output.set(data.subarray(inPos, inPos + blockSize), outPos);
    outPos += blockSize;
    inPos += blockSize;
  }

  return output.subarray(0, outPos);
}

/**
 * Calculate CRC32 checksum
 * Used for ZIP file integrity verification
 *
 * @param data - Data to checksum
 * @returns CRC32 value
 */
export function crc32(data: Uint8Array): number {
  // CRC32 lookup table
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c;
  }

  let crc = 0xffffffff;
  for (const byte of data) {
    crc = table[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }

  return (crc ^ 0xffffffff) >>> 0;
}
