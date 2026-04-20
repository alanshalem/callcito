/**
 * Parser for embedded images in XLSX files
 * Images are stored in xl/media/ and referenced via drawings
 */

import {
    findElement, findElements, getAttribute, parseXml
} from "../xml";
import type { ZipReader } from "../zip/zip-reader";

/**
 * Image position anchor type
 */
export type AnchorType = "twoCellAnchor" | "oneCellAnchor" | "absoluteAnchor";

/**
 * Cell position for image anchor
 */
export interface CellAnchor {
  col: number;
  colOff: number; // EMU (English Metric Units)
  row: number;
  rowOff: number; // EMU
}

/**
 * Image dimensions
 */
export interface ImageDimensions {
  width: number;  // in EMU
  height: number; // in EMU
}

/**
 * Embedded image information
 */
export interface EmbeddedImage {
  /** Relationship ID */
  rId: string;
  /** File name within archive (e.g., "xl/media/image1.png") */
  filePath: string;
  /** Image MIME type */
  mimeType: string;
  /** Anchor type */
  anchorType: AnchorType;
  /** Start cell anchor */
  from?: CellAnchor;
  /** End cell anchor (for twoCellAnchor) */
  to?: CellAnchor;
  /** Dimensions (for oneCellAnchor) */
  extent?: ImageDimensions;
  /** Image name/description */
  name?: string;
  /** Alt text */
  description?: string;
}

/**
 * Drawing data for a worksheet
 */
export interface DrawingData {
  images: EmbeddedImage[];
}

// EMU to pixels conversion (1 inch = 914400 EMU, 96 DPI)
const EMU_PER_PIXEL = 914400 / 96;

/**
 * Convert EMU to pixels
 */
export function emuToPixels(emu: number): number {
  return Math.round(emu / EMU_PER_PIXEL);
}

/**
 * Parse cell anchor element
 */
function parseCellAnchor(anchorEl: ReturnType<typeof findElement>): CellAnchor | undefined {
  if (!anchorEl) return undefined;

  const colEl = findElement(anchorEl, "col");
  const colOffEl = findElement(anchorEl, "colOff");
  const rowEl = findElement(anchorEl, "row");
  const rowOffEl = findElement(anchorEl, "rowOff");

  return {
    col: colEl ? Number.parseInt(colEl.text || "0", 10) : 0,
    colOff: colOffEl ? Number.parseInt(colOffEl.text || "0", 10) : 0,
    row: rowEl ? Number.parseInt(rowEl.text || "0", 10) : 0,
    rowOff: rowOffEl ? Number.parseInt(rowOffEl.text || "0", 10) : 0,
  };
}

/**
 * Parse extent element for dimensions
 */
function parseExtent(extentEl: ReturnType<typeof findElement>): ImageDimensions | undefined {
  if (!extentEl) return undefined;

  const cx = getAttribute(extentEl, "cx");
  const cy = getAttribute(extentEl, "cy");

  return {
    width: cx ? Number.parseInt(cx, 10) : 0,
    height: cy ? Number.parseInt(cy, 10) : 0,
  };
}

/**
 * Parse relationships file to get image paths
 */
function parseDrawingRels(relsXml: string): Map<string, { target: string; type: string }> {
  const rels = new Map<string, { target: string; type: string }>();
  const root = parseXml(relsXml);

  const relElements = findElements(root, "Relationship");
  for (const relEl of relElements) {
    const id = getAttribute(relEl, "Id");
    const target = getAttribute(relEl, "Target");
    const type = getAttribute(relEl, "Type") || "";

    if (id && target) {
      rels.set(id, { target, type });
    }
  }

  return rels;
}

/**
 * Get MIME type from file extension
 */
function getMimeType(filePath: string): string {
  const ext = filePath.split(".").pop()?.toLowerCase();
  const mimeTypes: Record<string, string> = {
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    bmp: "image/bmp",
    tiff: "image/tiff",
    tif: "image/tiff",
    wmf: "image/x-wmf",
    emf: "image/x-emf",
    svg: "image/svg+xml",
  };
  return mimeTypes[ext || ""] || "application/octet-stream";
}

/**
 * Parse drawing XML to extract image information
 * @param drawingXml - Contents of xl/drawings/drawingN.xml
 * @param relsXml - Contents of xl/drawings/_rels/drawingN.xml.rels
 * @returns Drawing data with image information
 */
export function parseDrawing(drawingXml: string, relsXml: string): DrawingData {
  const rels = parseDrawingRels(relsXml);
  const root = parseXml(drawingXml);
  const images: EmbeddedImage[] = [];

  // Process twoCellAnchor elements
  const twoCellAnchors = findElements(root, "twoCellAnchor");
  for (const anchor of twoCellAnchors) {
    const image = parseAnchorImage(anchor, "twoCellAnchor", rels);
    if (image) images.push(image);
  }

  // Process oneCellAnchor elements
  const oneCellAnchors = findElements(root, "oneCellAnchor");
  for (const anchor of oneCellAnchors) {
    const image = parseAnchorImage(anchor, "oneCellAnchor", rels);
    if (image) images.push(image);
  }

  // Process absoluteAnchor elements
  const absoluteAnchors = findElements(root, "absoluteAnchor");
  for (const anchor of absoluteAnchors) {
    const image = parseAnchorImage(anchor, "absoluteAnchor", rels);
    if (image) images.push(image);
  }

  return { images };
}

/**
 * Extract relationship ID from blip element (handles namespace prefix variants)
 */
function extractRId(blipEl: ReturnType<typeof findElement>): string | undefined {
  if (!blipEl) return undefined;
  const rId = getAttribute(blipEl, "embed");
  if (rId) return rId;
  for (const key of Object.keys(blipEl.attributes)) {
    if (key.endsWith(":embed") || key === "r:embed") {
      return blipEl.attributes[key];
    }
  }
  return undefined;
}

/**
 * Extract name and description metadata from picture element
 */
function extractImageMetadata(
  picEl: ReturnType<typeof findElement>,
  image: EmbeddedImage
): void {
  if (!picEl) return;
  const nvPicPrEl = findElement(picEl, "nvPicPr");
  if (!nvPicPrEl) return;
  const cNvPrEl = findElement(nvPicPrEl, "cNvPr");
  if (cNvPrEl) {
    image.name = getAttribute(cNvPrEl, "name") || undefined;
    image.description = getAttribute(cNvPrEl, "descr") || undefined;
  }
}

/**
 * Parse image from anchor element
 */
function parseAnchorImage(
  anchor: ReturnType<typeof findElement>,
  anchorType: AnchorType,
  rels: Map<string, { target: string; type: string }>
): EmbeddedImage | undefined {
  if (!anchor) return undefined;

  // Find the picture element
  const picEl = findElement(anchor, "pic");
  if (!picEl) return undefined;

  // Get blip (image reference)
  const blipFillEl = findElement(picEl, "blipFill");
  const blipEl = blipFillEl ? findElement(blipFillEl, "blip") : undefined;
  if (!blipEl) return undefined;

  const rId = extractRId(blipEl);
  if (!rId) return undefined;

  // Get image path from relationships
  const rel = rels.get(rId);
  if (!rel) return undefined;

  // Normalize path
  let filePath = rel.target;
  if (filePath.startsWith("../")) {
    filePath = `xl/${filePath.slice(3)}`;
  } else if (!filePath.startsWith("xl/")) {
    filePath = `xl/drawings/${filePath}`;
  }

  const image: EmbeddedImage = {
    rId,
    filePath,
    mimeType: getMimeType(filePath),
    anchorType,
  };

  // Parse anchors
  if (anchorType === "twoCellAnchor" || anchorType === "oneCellAnchor") {
    image.from = parseCellAnchor(findElement(anchor, "from"));
  }

  if (anchorType === "twoCellAnchor") {
    image.to = parseCellAnchor(findElement(anchor, "to"));
  }

  if (anchorType === "oneCellAnchor" || anchorType === "absoluteAnchor") {
    image.extent = parseExtent(findElement(anchor, "ext"));
  }

  extractImageMetadata(picEl, image);

  return image;
}

/**
 * Extract image data from the archive
 * @param zip - ZIP reader
 * @param imagePath - Path to image in archive
 * @returns Image data as Uint8Array
 */
export function extractImage(zip: ZipReader, imagePath: string): Uint8Array {
  return zip.getFile(imagePath);
}

/**
 * Extract image as base64 data URL
 * @param zip - ZIP reader
 * @param image - Image information
 * @returns Base64 data URL
 */
export function extractImageAsDataUrl(
  zip: ZipReader,
  image: EmbeddedImage
): string {
  const data = zip.getFile(image.filePath);
  const base64 = btoa(
    Array.from(data)
      .map((b) => String.fromCodePoint(b))
      .join("")
  );
  return `data:${image.mimeType};base64,${base64}`;
}

/**
 * Find drawing relationship for a worksheet
 * @param zip - ZIP reader
 * @param sheetPath - Path to worksheet (e.g., "xl/worksheets/sheet1.xml")
 * @returns Drawing path if found
 */
export function findDrawingForSheet(
  zip: ZipReader,
  sheetPath: string
): string | undefined {
  // Get the relationships file for this sheet
  const parts = sheetPath.split("/");
  const fileName = parts.pop();
  const relsPath = `${parts.join("/")}/_rels/${fileName}.rels`;

  if (!zip.hasFile(relsPath)) return undefined;

  const relsXml = zip.getFileAsString(relsPath);
  const root = parseXml(relsXml);

  const relElements = findElements(root, "Relationship");
  for (const relEl of relElements) {
    const type = getAttribute(relEl, "Type") || "";
    if (type.includes("drawing")) {
      const target = getAttribute(relEl, "Target");
      if (target) {
        if (target.startsWith("../")) {
          return `xl/${target.slice(3)}`;
        }
        return `xl/worksheets/${target}`;
      }
    }
  }

  return undefined;
}
