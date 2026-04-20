/**
 * Parser for xl/styles.xml
 * Extracts cell styles, fonts, fills, borders, and number formats
 */

import {
    findElement, findElements, getAttribute, parseXml
} from "../xml";

/**
 * Font style information
 */
export interface FontStyle {
  name?: string;
  size?: number;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strike?: boolean;
  color?: string;
}

/**
 * Fill style information
 */
export interface FillStyle {
  patternType?: string;
  fgColor?: string;
  bgColor?: string;
}

/**
 * Border style for one side
 */
export interface BorderSide {
  style?: string;
  color?: string;
}

/**
 * Border style information
 */
export interface BorderStyle {
  left?: BorderSide;
  right?: BorderSide;
  top?: BorderSide;
  bottom?: BorderSide;
  diagonal?: BorderSide;
}

/**
 * Complete cell style
 */
export interface CellStyle {
  fontId?: number;
  fillId?: number;
  borderId?: number;
  numFmtId?: number;
  font?: FontStyle;
  fill?: FillStyle;
  border?: BorderStyle;
  numberFormat?: string;
}

/**
 * Styles data extracted from styles.xml
 */
export interface StylesData {
  fonts: FontStyle[];
  fills: FillStyle[];
  borders: BorderStyle[];
  numberFormats: Map<number, string>;
  cellStyles: CellStyle[];
}

/**
 * Parse color from XML element
 */
function parseColor(element: ReturnType<typeof findElement>): string | undefined {
  if (!element) return undefined;

  // RGB color
  const rgb = getAttribute(element, "rgb");
  if (rgb) {
    // ARGB format - take last 6 chars for RGB
    return rgb.length === 8 ? `#${rgb.slice(2)}` : `#${rgb}`;
  }

  // Theme color (simplified - just return index)
  const theme = getAttribute(element, "theme");
  if (theme) {
    return `theme:${theme}`;
  }

  // Indexed color
  const indexed = getAttribute(element, "indexed");
  if (indexed) {
    return `indexed:${indexed}`;
  }

  return undefined;
}

/**
 * Parse font element
 */
function parseFont(fontEl: ReturnType<typeof findElement>): FontStyle {
  if (!fontEl) return {};

  const font: FontStyle = {};

  const nameEl = findElement(fontEl, "name");
  if (nameEl) {
    font.name = getAttribute(nameEl, "val") || undefined;
  }

  const sizeEl = findElement(fontEl, "sz");
  if (sizeEl) {
    const val = getAttribute(sizeEl, "val");
    if (val) font.size = Number.parseFloat(val);
  }

  if (findElement(fontEl, "b")) font.bold = true;
  if (findElement(fontEl, "i")) font.italic = true;
  if (findElement(fontEl, "u")) font.underline = true;
  if (findElement(fontEl, "strike")) font.strike = true;

  const colorEl = findElement(fontEl, "color");
  font.color = parseColor(colorEl);

  return font;
}

/**
 * Parse fill element
 */
function parseFill(fillEl: ReturnType<typeof findElement>): FillStyle {
  if (!fillEl) return {};

  const fill: FillStyle = {};
  const patternFill = findElement(fillEl, "patternFill");

  if (patternFill) {
    fill.patternType = getAttribute(patternFill, "patternType") || undefined;

    const fgColor = findElement(patternFill, "fgColor");
    fill.fgColor = parseColor(fgColor);

    const bgColor = findElement(patternFill, "bgColor");
    fill.bgColor = parseColor(bgColor);
  }

  return fill;
}

/**
 * Parse border side element
 */
function parseBorderSide(sideEl: ReturnType<typeof findElement>): BorderSide | undefined {
  if (!sideEl) return undefined;

  const style = getAttribute(sideEl, "style");
  if (!style) return undefined;

  const side: BorderSide = { style };
  const colorEl = findElement(sideEl, "color");
  side.color = parseColor(colorEl);

  return side;
}

/**
 * Parse border element
 */
function parseBorder(borderEl: ReturnType<typeof findElement>): BorderStyle {
  if (!borderEl) return {};

  return {
    left: parseBorderSide(findElement(borderEl, "left")),
    right: parseBorderSide(findElement(borderEl, "right")),
    top: parseBorderSide(findElement(borderEl, "top")),
    bottom: parseBorderSide(findElement(borderEl, "bottom")),
    diagonal: parseBorderSide(findElement(borderEl, "diagonal")),
  };
}

/** Parse fonts section from <fonts> element */
function parseFontsSection(fontsEl: ReturnType<typeof findElement>): FontStyle[] {
  if (!fontsEl) return [];
  return findElements(fontsEl, "font").map(parseFont);
}

/** Parse fills section from <fills> element */
function parseFillsSection(fillsEl: ReturnType<typeof findElement>): FillStyle[] {
  if (!fillsEl) return [];
  return findElements(fillsEl, "fill").map(parseFill);
}

/** Parse borders section from <borders> element */
function parseBordersSection(bordersEl: ReturnType<typeof findElement>): BorderStyle[] {
  if (!bordersEl) return [];
  return findElements(bordersEl, "border").map(parseBorder);
}

/** Parse number formats section from <numFmts> element */
function parseNumberFormatsSection(numFmtsEl: ReturnType<typeof findElement>): Map<number, string> {
  const numberFormats = new Map<number, string>();
  if (!numFmtsEl) return numberFormats;
  for (const numFmtEl of findElements(numFmtsEl, "numFmt")) {
    const id = getAttribute(numFmtEl, "numFmtId");
    const code = getAttribute(numFmtEl, "formatCode");
    if (id && code) {
      numberFormats.set(Number.parseInt(id, 10), code);
    }
  }
  return numberFormats;
}

/** Parse a single cell style <xf> element */
function parseCellXfElement(
  xfEl: ReturnType<typeof findElement>,
  fonts: FontStyle[],
  fills: FillStyle[],
  borders: BorderStyle[],
  numberFormats: Map<number, string>
): CellStyle {
  const style: CellStyle = {};
  if (!xfEl) return style;

  const fontId = getAttribute(xfEl, "fontId");
  if (fontId) {
    style.fontId = Number.parseInt(fontId, 10);
    style.font = fonts[style.fontId];
  }

  const fillId = getAttribute(xfEl, "fillId");
  if (fillId) {
    style.fillId = Number.parseInt(fillId, 10);
    style.fill = fills[style.fillId];
  }

  const borderId = getAttribute(xfEl, "borderId");
  if (borderId) {
    style.borderId = Number.parseInt(borderId, 10);
    style.border = borders[style.borderId];
  }

  const numFmtId = getAttribute(xfEl, "numFmtId");
  if (numFmtId) {
    style.numFmtId = Number.parseInt(numFmtId, 10);
    style.numberFormat = numberFormats.get(style.numFmtId);
  }

  return style;
}

/** Parse cell styles section from <cellXfs> element */
function parseCellStylesSection(
  cellXfsEl: ReturnType<typeof findElement>,
  fonts: FontStyle[],
  fills: FillStyle[],
  borders: BorderStyle[],
  numberFormats: Map<number, string>
): CellStyle[] {
  if (!cellXfsEl) return [];
  return findElements(cellXfsEl, "xf").map((xfEl) =>
    parseCellXfElement(xfEl, fonts, fills, borders, numberFormats)
  );
}

/**
 * Parse styles.xml to extract all styling information
 * @param xml - Contents of xl/styles.xml
 * @returns Parsed styles data
 */
export function parseStyles(xml: string): StylesData {
  const root = parseXml(xml);
  const fonts = parseFontsSection(findElement(root, "fonts"));
  const fills = parseFillsSection(findElement(root, "fills"));
  const borders = parseBordersSection(findElement(root, "borders"));
  const numberFormats = parseNumberFormatsSection(findElement(root, "numFmts"));
  const cellStyles = parseCellStylesSection(findElement(root, "cellXfs"), fonts, fills, borders, numberFormats);
  return { fonts, fills, borders, numberFormats, cellStyles };
}

/**
 * Get cell style by style index (s attribute in cell)
 */
export function getCellStyle(styles: StylesData, styleIndex: number): CellStyle | undefined {
  return styles.cellStyles[styleIndex];
}
