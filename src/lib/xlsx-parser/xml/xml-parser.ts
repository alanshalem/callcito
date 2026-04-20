/**
 * Lightweight XML parser optimized for XLSX files
 * Only handles well-formed XML as produced by Excel
 */

import type { XmlElement } from "../types";

// XML entity decoding map
const XML_ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&apos;": "'",
};

/**
 * Decode XML entities in a string
 */
function decodeEntities(text: string): string {
  // Quick check if any entities exist
  if (!text.includes("&")) return text;

  // Replace named entities
  let result = text;
  for (const [entity, char] of Object.entries(XML_ENTITIES)) {
    result = result.split(entity).join(char);
  }

  // Replace numeric entities (&#NN; or &#xNN;)
  result = result.replaceAll(/&#(\d+);/g, (_, num) =>
    String.fromCodePoint(Number.parseInt(num, 10))
  );
  result = result.replaceAll(/&#x([0-9a-fA-F]+);/g, (_, hex) =>
    String.fromCodePoint(Number.parseInt(hex, 16))
  );

  return result;
}

/**
 * Parse XML attributes from a tag string
 */
function parseAttributes(tagContent: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const attrRegex = /([a-zA-Z_:][\w:.-]*)\s*=\s*["']([^"']*)["']/g;
  let match;

  while ((match = attrRegex.exec(tagContent)) !== null) {
    attrs[match[1]] = decodeEntities(match[2]);
  }

  return attrs;
}

/**
 * Extract local name from namespaced tag (e.g., "x:sheet" -> "sheet")
 */
function getLocalName(tag: string): string {
  const colonIndex = tag.indexOf(":");
  return colonIndex >= 0 ? tag.substring(colonIndex + 1) : tag;
}

/** Append text to the top element in the stack (no-op when text is empty) */
function appendToStack(stack: XmlElement[], text: string, raw = false): void {
  if (stack.length > 1 && text) {
    stack.at(-1)!.text += raw ? text : decodeEntities(text);
  }
}

/** Advance position past a comment, returns new pos */
function advancePastComment(xml: string, tagStart: number): number {
  const end = xml.indexOf("-->", tagStart);
  return end >= 0 ? end + 3 : xml.length;
}

/** Handle CDATA section — appends raw text and returns new pos */
function handleCdataSection(xml: string, tagStart: number, stack: XmlElement[]): number {
  const end = xml.indexOf("]]>", tagStart);
  if (end >= 0) {
    appendToStack(stack, xml.substring(tagStart + 9, end), true);
    return end + 3;
  }
  return xml.length;
}

/** Parse an opening/self-closing tag into an XmlElement */
function createTagElement(tagContent: string): { element: XmlElement; selfClosing: boolean } {
  const selfClosing = tagContent.endsWith("/");
  const content = selfClosing ? tagContent.slice(0, -1).trim() : tagContent;
  const spaceIdx = content.indexOf(" ");
  const rawName = spaceIdx >= 0 ? content.substring(0, spaceIdx) : content;
  const attrStr = spaceIdx >= 0 ? content.substring(spaceIdx) : "";
  return {
    element: {
      tag: getLocalName(rawName),
      attributes: parseAttributes(attrStr),
      children: [],
      text: "",
    },
    selfClosing,
  };
}

/** Process a single tag token — returns the new pos */
function processTag(xml: string, tagStart: number, tagEnd: number, stack: XmlElement[]): number {
  const tagContent = xml.substring(tagStart + 1, tagEnd);
  const nextPos = tagEnd + 1;

  if (tagContent.startsWith("!--")) return advancePastComment(xml, tagStart);
  if (tagContent.startsWith("![CDATA[")) return handleCdataSection(xml, tagStart, stack);
  if (tagContent.startsWith("/")) { stack.pop(); return nextPos; }

  const { element, selfClosing } = createTagElement(tagContent);
  stack.at(-1)!.children.push(element);
  if (!selfClosing) stack.push(element);
  return nextPos;
}

/**
 * Parse XML string into element tree
 * Optimized for XLSX XML structure
 */
export function parseXml(xml: string): XmlElement {
  const root: XmlElement = { tag: "root", attributes: {}, children: [], text: "" };
  const stack: XmlElement[] = [root];
  let pos = 0;

  // Skip XML declaration and DOCTYPE
  const declEnd = xml.indexOf("?>");
  if (declEnd >= 0 && xml.trimStart().startsWith("<?")) pos = declEnd + 2;

  while (pos < xml.length) {
    const tagStart = xml.indexOf("<", pos);
    if (tagStart === -1) { appendToStack(stack, xml.substring(pos).trim()); break; }
    if (tagStart > pos) appendToStack(stack, xml.substring(pos, tagStart).trim());

    const tagEnd = xml.indexOf(">", tagStart);
    if (tagEnd === -1) break;

    pos = processTag(xml, tagStart, tagEnd, stack);
  }

  return root.children[0] ?? root;
}

/**
 * Find all elements with a specific tag name (recursive)
 */
export function findElements(root: XmlElement, tagName: string): XmlElement[] {
  const results: XmlElement[] = [];

  function search(element: XmlElement) {
    if (element.tag === tagName) {
      results.push(element);
    }
    for (const child of element.children) {
      search(child);
    }
  }

  search(root);
  return results;
}

/**
 * Find first element with a specific tag name
 */
export function findElement(
  root: XmlElement,
  tagName: string
): XmlElement | undefined {
  if (root.tag === tagName) {
    return root;
  }
  for (const child of root.children) {
    const found = findElement(child, tagName);
    if (found) return found;
  }
  return undefined;
}

/**
 * Get attribute value from element
 */
export function getAttribute(
  element: XmlElement,
  name: string
): string | undefined {
  return element.attributes[name];
}

/**
 * Get text content from element and all children
 */
export function getTextContent(element: XmlElement): string {
  let text = element.text;
  for (const child of element.children) {
    text += getTextContent(child);
  }
  return text;
}
