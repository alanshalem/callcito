/**
 * Parser for xl/sharedStrings.xml
 * Shared strings are used to avoid duplicating text in cells
 */

import { findElements, getTextContent, parseXml } from "../xml";

/**
 * Parse sharedStrings.xml to extract string table
 * @param xml - Contents of xl/sharedStrings.xml
 * @returns Array of strings indexed by their position
 */
export function parseSharedStrings(xml: string): string[] {
  const strings: string[] = [];
  const root = parseXml(xml);

  // Find all <si> (string item) elements
  const siElements = findElements(root, "si");

  for (const si of siElements) {
    // Simple case: <si><t>text</t></si>
    // Rich text case: <si><r><t>text</t></r><r><t>more</t></r></si>
    const text = getTextContent(si);
    strings.push(text);
  }

  return strings;
}
