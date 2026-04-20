/**
 * ZIP archive reader
 * Parses ZIP file structure and extracts files
 */

import type { ZipEntry } from "../types";
import { BufferReader } from "../utils/buffer-reader";
import { XlsxFileNotFoundError, XlsxZipError } from "../utils/errors";
import { inflate } from "./deflate";

// ZIP signatures
const LOCAL_FILE_HEADER = 0x04034b50;
const CENTRAL_DIRECTORY = 0x02014b50;
const END_OF_CENTRAL_DIR = 0x06054b50;

// Compression methods
const COMPRESSION_STORED = 0;
const COMPRESSION_DEFLATE = 8;

/**
 * ZIP archive reader
 * Reads and extracts files from ZIP archives (used for XLSX)
 */
export class ZipReader {
  private readonly data: Uint8Array;
  private readonly reader: BufferReader;
  private readonly entries: Map<string, ZipEntry> = new Map();

  constructor(buffer: ArrayBuffer | Uint8Array) {
    this.data = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    this.reader = new BufferReader(this.data);
    this.parseCentralDirectory();
  }

  /**
   * Find and parse the central directory
   * More reliable than parsing local headers
   */
  private parseCentralDirectory(): void {
    // Find End of Central Directory record (search backwards from end)
    let eocdOffset = -1;
    const minOffset = Math.max(0, this.data.length - 65535 - 22);

    for (let i = this.data.length - 22; i >= minOffset; i--) {
      if (this.reader.peekUint32LE(i - this.reader.position) === END_OF_CENTRAL_DIR) {
        // Verify by reading with proper offset
        this.reader.seek(i);
        if (this.reader.readUint32LE() === END_OF_CENTRAL_DIR) {
          eocdOffset = i;
          break;
        }
      }
    }

    // Fallback: direct seek if not found via search
    if (eocdOffset === -1) {
      this.reader.seek(this.data.length - 22);
      if (this.reader.peekUint32LE(0) === END_OF_CENTRAL_DIR) {
        eocdOffset = this.data.length - 22;
      }
    }

    if (eocdOffset === -1) {
      throw new XlsxZipError("Invalid ZIP: End of Central Directory not found. File may be corrupted or not a valid ZIP/XLSX file.");
    }

    // Parse EOCD
    this.reader.seek(eocdOffset);
    this.reader.skip(4); // signature
    this.reader.skip(2); // disk number
    this.reader.skip(2); // disk with central directory
    this.reader.skip(2); // entries on this disk
    const totalEntries = this.reader.readUint16LE();
    this.reader.skip(4); // central directory size
    const cdOffset = this.reader.readUint32LE();

    // Parse Central Directory entries
    this.reader.seek(cdOffset);

    for (let i = 0; i < totalEntries; i++) {
      const sig = this.reader.readUint32LE();
      if (sig !== CENTRAL_DIRECTORY) {
        throw new XlsxZipError("Invalid ZIP: Expected Central Directory header. File structure is corrupted.");
      }

      this.reader.skip(2); // version made by
      this.reader.skip(2); // version needed
      this.reader.skip(2); // flags
      const compressionMethod = this.reader.readUint16LE();
      this.reader.skip(2); // mod time
      this.reader.skip(2); // mod date
      const crc32 = this.reader.readUint32LE();
      const compressedSize = this.reader.readUint32LE();
      const uncompressedSize = this.reader.readUint32LE();
      const fileNameLength = this.reader.readUint16LE();
      const extraLength = this.reader.readUint16LE();
      const commentLength = this.reader.readUint16LE();
      this.reader.skip(2); // disk number start
      this.reader.skip(2); // internal attributes
      this.reader.skip(4); // external attributes
      const localHeaderOffset = this.reader.readUint32LE();

      const fileName = this.reader.readString(fileNameLength);
      this.reader.skip(extraLength);
      this.reader.skip(commentLength);

      // Calculate data offset by reading local header
      const savedPos = this.reader.position;
      this.reader.seek(localHeaderOffset);
      const localSig = this.reader.readUint32LE();
      if (localSig !== LOCAL_FILE_HEADER) {
        throw new XlsxZipError("Invalid ZIP: Expected Local File Header. File structure is corrupted.");
      }
      this.reader.skip(22); // skip to filename length
      const localNameLength = this.reader.readUint16LE();
      const localExtraLength = this.reader.readUint16LE();
      const dataOffset = localHeaderOffset + 30 + localNameLength + localExtraLength;
      this.reader.seek(savedPos);

      this.entries.set(fileName, {
        fileName,
        compressedSize,
        uncompressedSize,
        compressionMethod,
        dataOffset,
        crc32,
      });
    }
  }

  /**
   * Get list of all file names in archive
   */
  getFileNames(): string[] {
    return Array.from(this.entries.keys());
  }

  /**
   * Check if archive contains a file
   */
  hasFile(name: string): boolean {
    return this.entries.has(name);
  }

  /**
   * Extract and decompress a file from the archive
   * @param name - File path within the archive
   * @returns Decompressed file contents
   */
  getFile(name: string): Uint8Array {
    const entry = this.entries.get(name);
    if (!entry) {
      throw new XlsxFileNotFoundError(name);
    }

    const compressedData = this.data.slice(
      entry.dataOffset,
      entry.dataOffset + entry.compressedSize
    );

    if (entry.compressionMethod === COMPRESSION_STORED) {
      return compressedData;
    } else if (entry.compressionMethod === COMPRESSION_DEFLATE) {
      return inflate(compressedData);
    } else {
      throw new XlsxZipError(
        `Unsupported compression method: ${entry.compressionMethod}. Only STORED (0) and DEFLATE (8) are supported.`,
        { entryName: name }
      );
    }
  }

  /**
   * Extract file as UTF-8 string
   * @param name - File path within the archive
   * @returns File contents as string
   */
  getFileAsString(name: string): string {
    const data = this.getFile(name);
    return new TextDecoder("utf-8").decode(data);
  }
}
