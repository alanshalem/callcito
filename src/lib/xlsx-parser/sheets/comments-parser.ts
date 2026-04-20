/**
 * Parser for xl/commentsN.xml
 * Extracts cell comments/notes
 */

import {
    findElement, findElements, getAttribute,
    getTextContent, parseXml
} from "../xml";

/**
 * Comment/note attached to a cell
 */
export interface CellComment {
  /** Cell reference (e.g., "A1") */
  ref: string;
  /** Author of the comment */
  author?: string;
  /** Comment text content */
  text: string;
  /** Rich text runs (if formatted) */
  richText?: CommentRun[];
}

/**
 * Rich text run within a comment
 */
export interface CommentRun {
  text: string;
  bold?: boolean;
  italic?: boolean;
  fontSize?: number;
  fontName?: string;
  color?: string;
}

/**
 * Comments data for a worksheet
 */
export interface CommentsData {
  authors: string[];
  comments: CellComment[];
}

/**
 * Extract color string from a color element
 */
function parseRunColor(colorEl: ReturnType<typeof findElement>): string | undefined {
  if (!colorEl) return undefined;
  const rgb = getAttribute(colorEl, "rgb");
  if (!rgb) return undefined;
  return rgb.length === 8 ? `#${rgb.slice(2)}` : `#${rgb}`;
}

/**
 * Extract formatting properties from a run properties element
 */
function parseRunFormatting(rPrEl: ReturnType<typeof findElement>): Partial<CommentRun> {
  if (!rPrEl) return {};
  const formatting: Partial<CommentRun> = {};

  if (findElement(rPrEl, "b")) formatting.bold = true;
  if (findElement(rPrEl, "i")) formatting.italic = true;

  const szEl = findElement(rPrEl, "sz");
  const val = szEl ? getAttribute(szEl, "val") : null;
  if (val) formatting.fontSize = Number.parseFloat(val);

  const fontEl = findElement(rPrEl, "rFont");
  if (fontEl) formatting.fontName = getAttribute(fontEl, "val") || undefined;

  const colorEl = findElement(rPrEl, "color");
  if (colorEl) formatting.color = parseRunColor(colorEl);

  return formatting;
}

/**
 * Parse a single rich text run element
 */
function parseSingleRun(runEl: ReturnType<typeof findElement>): CommentRun {
  const run: CommentRun = { text: "" };
  if (!runEl) return run;
  const tEl = findElement(runEl, "t");
  if (tEl) run.text = tEl.text || "";
  return { ...run, ...parseRunFormatting(findElement(runEl, "rPr")) };
}

/**
 * Parse rich text element to extract formatted runs
 */
function parseRichText(textEl: ReturnType<typeof findElement>): {
  plainText: string;
  runs: CommentRun[];
} {
  if (!textEl) return { plainText: "", runs: [] };

  const runElements = findElements(textEl, "r");
  if (runElements.length === 0) {
    const tEl = findElement(textEl, "t");
    const plainText = tEl ? (tEl.text || "") : getTextContent(textEl);
    return { plainText, runs: [] };
  }

  const runs = runElements.map(parseSingleRun);
  const plainText = runs.map((r) => r.text).join("");
  return { plainText, runs };
}

/**
 * Parse comments XML to extract all comments
 * @param xml - Contents of xl/commentsN.xml
 * @returns Parsed comments data
 */
export function parseComments(xml: string): CommentsData {
  const root = parseXml(xml);

  // Parse authors
  const authors: string[] = [];
  const authorsEl = findElement(root, "authors");
  if (authorsEl) {
    const authorElements = findElements(authorsEl, "author");
    for (const authorEl of authorElements) {
      authors.push(authorEl.text || "");
    }
  }

  // Parse comments
  const comments: CellComment[] = [];
  const commentListEl = findElement(root, "commentList");
  if (commentListEl) {
    const commentElements = findElements(commentListEl, "comment");
    for (const commentEl of commentElements) {
      const ref = getAttribute(commentEl, "ref");
      if (!ref) continue;

      const authorId = getAttribute(commentEl, "authorId");
      const author = authorId ? authors[Number.parseInt(authorId, 10)] : undefined;

      const textEl = findElement(commentEl, "text");
      const { plainText, runs } = parseRichText(textEl);

      const comment: CellComment = {
        ref,
        author,
        text: plainText,
      };

      if (runs.length > 0) {
        comment.richText = runs;
      }

      comments.push(comment);
    }
  }

  return { authors, comments };
}

/**
 * Get comment for a specific cell
 * @param commentsData - Parsed comments data
 * @param cellRef - Cell reference (e.g., "A1")
 * @returns Comment if found
 */
export function getComment(
  commentsData: CommentsData,
  cellRef: string
): CellComment | undefined {
  return commentsData.comments.find((c) => c.ref === cellRef);
}

/**
 * Get all comments as a map
 * @param commentsData - Parsed comments data
 * @returns Map of cell reference to comment
 */
export function getCommentsMap(
  commentsData: CommentsData
): Map<string, CellComment> {
  const map = new Map<string, CellComment>();
  for (const comment of commentsData.comments) {
    map.set(comment.ref, comment);
  }
  return map;
}
