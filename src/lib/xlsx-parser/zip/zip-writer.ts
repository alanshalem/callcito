/**
 * ZIP archive writer
 * Creates ZIP files compatible with XLSX format
 */

import { crc32, deflateStored } from "./deflate-compress";

interface ZipFileEntry {
  name: string;
  data: Uint8Array;
  crc: number;
  compressedData: Uint8Array;
  offset: number;
}

/**
 * ZIP archive writer
 * Creates ZIP archives for XLSX file generation
 */
export class ZipWriter {
  private readonly entries: ZipFileEntry[] = [];
  private readonly offset = 0;

  /**
   * Add a file to the archive
   * @param name - File path within archive (e.g., "xl/workbook.xml")
   * @param data - File contents as string or Uint8Array
   */
  addFile(name: string, data: string | Uint8Array): void {
    const bytes =
      typeof data === "string" ? new TextEncoder().encode(data) : data;

    const crcValue = crc32(bytes);
    const compressedData = deflateStored(bytes);

    this.entries.push({
      name,
      data: bytes,
      crc: crcValue,
      compressedData,
      offset: 0, // Will be set when generating
    });
  }

  /**
   * Generate the ZIP file
   * @returns Complete ZIP archive as Uint8Array
   */
  generate(): Uint8Array {
    const chunks: Uint8Array[] = [];
    let offset = 0;

    // Write local file headers and data
    for (const entry of this.entries) {
      entry.offset = offset;

      const localHeader = this.createLocalHeader(entry);
      chunks.push(localHeader);
      offset += localHeader.length;

      chunks.push(entry.compressedData);
      offset += entry.compressedData.length;
    }

    // Write central directory
    const cdStart = offset;
    for (const entry of this.entries) {
      const cdHeader = this.createCentralDirectoryHeader(entry);
      chunks.push(cdHeader);
      offset += cdHeader.length;
    }
    const cdSize = offset - cdStart;

    // Write end of central directory
    const eocd = this.createEndOfCentralDirectory(cdStart, cdSize);
    chunks.push(eocd);

    // Combine all chunks
    const totalSize = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const result = new Uint8Array(totalSize);
    let pos = 0;
    for (const chunk of chunks) {
      result.set(chunk, pos);
      pos += chunk.length;
    }

    return result;
  }

  /**
   * Create local file header
   */
  private createLocalHeader(entry: ZipFileEntry): Uint8Array {
    const nameBytes = new TextEncoder().encode(entry.name);
    const header = new Uint8Array(30 + nameBytes.length);
    const view = new DataView(header.buffer);

    // Local file header signature
    view.setUint32(0, 0x04034b50, true);
    // Version needed to extract
    view.setUint16(4, 20, true);
    // General purpose bit flag
    view.setUint16(6, 0, true);
    // Compression method (8 = deflate)
    view.setUint16(8, 8, true);
    // File modification time
    view.setUint16(10, 0, true);
    // File modification date
    view.setUint16(12, 0, true);
    // CRC-32
    view.setUint32(14, entry.crc, true);
    // Compressed size
    view.setUint32(18, entry.compressedData.length, true);
    // Uncompressed size
    view.setUint32(22, entry.data.length, true);
    // File name length
    view.setUint16(26, nameBytes.length, true);
    // Extra field length
    view.setUint16(28, 0, true);
    // File name
    header.set(nameBytes, 30);

    return header;
  }

  /**
   * Create central directory header
   */
  private createCentralDirectoryHeader(entry: ZipFileEntry): Uint8Array {
    const nameBytes = new TextEncoder().encode(entry.name);
    const header = new Uint8Array(46 + nameBytes.length);
    const view = new DataView(header.buffer);

    // Central directory file header signature
    view.setUint32(0, 0x02014b50, true);
    // Version made by
    view.setUint16(4, 20, true);
    // Version needed to extract
    view.setUint16(6, 20, true);
    // General purpose bit flag
    view.setUint16(8, 0, true);
    // Compression method (8 = deflate)
    view.setUint16(10, 8, true);
    // File modification time
    view.setUint16(12, 0, true);
    // File modification date
    view.setUint16(14, 0, true);
    // CRC-32
    view.setUint32(16, entry.crc, true);
    // Compressed size
    view.setUint32(20, entry.compressedData.length, true);
    // Uncompressed size
    view.setUint32(24, entry.data.length, true);
    // File name length
    view.setUint16(28, nameBytes.length, true);
    // Extra field length
    view.setUint16(30, 0, true);
    // File comment length
    view.setUint16(32, 0, true);
    // Disk number start
    view.setUint16(34, 0, true);
    // Internal file attributes
    view.setUint16(36, 0, true);
    // External file attributes
    view.setUint32(38, 0, true);
    // Relative offset of local header
    view.setUint32(42, entry.offset, true);
    // File name
    header.set(nameBytes, 46);

    return header;
  }

  /**
   * Create end of central directory record
   */
  private createEndOfCentralDirectory(
    cdStart: number,
    cdSize: number
  ): Uint8Array {
    const eocd = new Uint8Array(22);
    const view = new DataView(eocd.buffer);

    // End of central directory signature
    view.setUint32(0, 0x06054b50, true);
    // Number of this disk
    view.setUint16(4, 0, true);
    // Disk where central directory starts
    view.setUint16(6, 0, true);
    // Number of central directory records on this disk
    view.setUint16(8, this.entries.length, true);
    // Total number of central directory records
    view.setUint16(10, this.entries.length, true);
    // Size of central directory
    view.setUint32(12, cdSize, true);
    // Offset of start of central directory
    view.setUint32(16, cdStart, true);
    // Comment length
    view.setUint16(20, 0, true);

    return eocd;
  }
}
