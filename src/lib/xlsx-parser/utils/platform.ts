/**
 * Platform detection and compatibility utilities
 * Handles differences between Browser and Node.js environments
 */

import { XlsxDataTypeError, XlsxPlatformError } from "./errors";

/** Runtime environment detection */
export const runtime = {
  isNode:
    globalThis.process?.versions?.node !== undefined,

  isBrowser:
    globalThis.window?.document !== undefined,

  isWorker:
    globalThis.self !== undefined &&
    (globalThis.self as unknown as { importScripts?: unknown }).importScripts !== undefined,
};

// Cached fs module for Node.js
let fsModule: typeof import("node:fs") | null = null;

/**
 * Get fs module (Node.js only)
 * Uses multiple strategies to load fs while avoiding bundler issues
 */
function getFs(): typeof import("node:fs") {
  if (fsModule) return fsModule;

  // Strategy 1: Check if require exists in global scope (CommonJS)
  if (typeof globalThis.require === "function") {
    fsModule = globalThis.require("node:fs") as typeof import("node:fs");
    return fsModule;
  }

  // Strategy 2: Use module.createRequire for ESM context
  // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
  if (typeof module !== "undefined" && typeof require === "function") {
    fsModule = require("node:fs") as typeof import("node:fs");
    return fsModule;
  }

  throw new XlsxPlatformError("fs module", "Node.js with CommonJS or ESM context");
}

/**
 * Read file from filesystem (Node.js only)
 * @param filePath - File path to read
 * @returns Uint8Array containing file contents
 * @throws Error if called from browser environment
 */
export function readFileSync(filePath: string): Uint8Array {
  if (!runtime.isNode) {
    throw new XlsxPlatformError("readFileSync()", "Node.js");
  }

  const fs = getFs();
  const buffer = fs.readFileSync(filePath);
  return new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.length);
}

/**
 * Write file to filesystem (Node.js only)
 * @param filePath - File path to write
 * @param data - Data to write
 * @throws Error if called from browser environment
 */
export function writeFileSync(filePath: string, data: Uint8Array): void {
  if (!runtime.isNode) {
    throw new XlsxPlatformError("writeFileSync()", "Node.js");
  }

  const fs = getFs();
  fs.writeFileSync(filePath, data);
}

/**
 * Convert various input types to Uint8Array
 * @param data - Input data (ArrayBuffer, Uint8Array, or Buffer)
 * @returns Normalized Uint8Array
 */
export function toUint8Array(
  data: ArrayBuffer | Uint8Array | NodeJS.ArrayBufferView
): Uint8Array {
  if (data instanceof Uint8Array) {
    return data;
  }
  if (data instanceof ArrayBuffer) {
    return new Uint8Array(data);
  }
  // Node.js Buffer (extends Uint8Array but check explicitly for safety)
  if (typeof Buffer !== "undefined" && Buffer.isBuffer(data)) {
    return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  }
  // Generic ArrayBufferView
  if ("buffer" in data && data.buffer instanceof ArrayBuffer) {
    return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  }
  throw new XlsxDataTypeError("ArrayBuffer, Uint8Array, or Buffer", typeof data);
}
