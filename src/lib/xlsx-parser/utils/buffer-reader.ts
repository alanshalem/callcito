/**
 * Binary buffer reader with little-endian support
 * Used for parsing ZIP file structures
 */
export class BufferReader {
  private readonly data: Uint8Array;
  private readonly view: DataView;
  private pos: number = 0;

  constructor(buffer: ArrayBuffer | Uint8Array) {
    if (buffer instanceof Uint8Array) {
      this.data = buffer;
      this.view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
    } else {
      this.data = new Uint8Array(buffer);
      this.view = new DataView(buffer);
    }
  }

  /** Read unsigned 8-bit integer */
  readUint8(): number {
    const value = this.data[this.pos];
    this.pos += 1;
    return value;
  }

  /** Read unsigned 16-bit integer (little-endian) */
  readUint16LE(): number {
    const value = this.view.getUint16(this.pos, true);
    this.pos += 2;
    return value;
  }

  /** Read unsigned 32-bit integer (little-endian) */
  readUint32LE(): number {
    const value = this.view.getUint32(this.pos, true);
    this.pos += 4;
    return value;
  }

  /** Read specified number of bytes */
  readBytes(length: number): Uint8Array {
    const bytes = this.data.slice(this.pos, this.pos + length);
    this.pos += length;
    return bytes;
  }

  /** Read string with specified length (ASCII/UTF-8) */
  readString(length: number): string {
    const bytes = this.readBytes(length);
    return new TextDecoder("utf-8").decode(bytes);
  }

  /** Seek to absolute position */
  seek(offset: number): void {
    this.pos = offset;
  }

  /** Skip specified number of bytes */
  skip(bytes: number): void {
    this.pos += bytes;
  }

  /** Get current position */
  get position(): number {
    return this.pos;
  }

  /** Get remaining bytes count */
  get remaining(): number {
    return this.data.length - this.pos;
  }

  /** Get total buffer length */
  get length(): number {
    return this.data.length;
  }

  /** Get slice of buffer without advancing position */
  slice(start: number, end: number): Uint8Array {
    return this.data.slice(start, end);
  }

  /** Peek byte at offset without advancing position */
  peekUint8(offset: number = 0): number {
    return this.data[this.pos + offset];
  }

  /** Peek 32-bit value at offset without advancing position */
  peekUint32LE(offset: number = 0): number {
    return this.view.getUint32(this.pos + offset, true);
  }
}

/**
 * Bit reader for DEFLATE decompression
 * Reads bits LSB-first from byte stream
 */
export class BitReader {
  private readonly data: Uint8Array;
  private bytePos: number = 0;
  private readonly bitPos: number = 0;
  private buffer: number = 0;
  private bitsInBuffer: number = 0;

  constructor(data: Uint8Array) {
    this.data = data;
  }

  /** Read specified number of bits */
  readBits(count: number): number {
    while (this.bitsInBuffer < count) {
      if (this.bytePos >= this.data.length) {
        throw new Error("Unexpected end of data");
      }
      this.buffer |= this.data[this.bytePos++] << this.bitsInBuffer;
      this.bitsInBuffer += 8;
    }

    const value = this.buffer & ((1 << count) - 1);
    this.buffer >>>= count;
    this.bitsInBuffer -= count;
    return value;
  }

  /** Read a single bit */
  readBit(): number {
    return this.readBits(1);
  }

  /** Align to byte boundary (discard remaining bits in current byte) */
  alignToByte(): void {
    this.buffer = 0;
    this.bitsInBuffer = 0;
  }

  /** Read aligned bytes directly */
  readAlignedBytes(count: number): Uint8Array {
    this.alignToByte();
    const bytes = this.data.slice(this.bytePos, this.bytePos + count);
    this.bytePos += count;
    return bytes;
  }

  /** Check if at end of data */
  get eof(): boolean {
    return this.bytePos >= this.data.length && this.bitsInBuffer === 0;
  }
}
