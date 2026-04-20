/**
 * Tests for XML parser
 */
import assert from "node:assert";
import { describe, it } from "node:test";
import {
    findElement, findElements, getAttribute,
    getTextContent, parseXml
} from "../xml/xml-parser";

describe("parseXml", () => {
  it("should parse simple XML", () => {
    const xml = '<root><child>text</child></root>';
    const result = parseXml(xml);

    assert.strictEqual(result.tag, "root");
    assert.strictEqual(result.children.length, 1);
    assert.strictEqual(result.children[0].tag, "child");
    assert.strictEqual(result.children[0].text, "text");
  });

  it("should parse attributes", () => {
    const xml = '<element id="123" name="test"/>';
    const result = parseXml(xml);

    assert.strictEqual(result.attributes.id, "123");
    assert.strictEqual(result.attributes.name, "test");
  });

  it("should handle self-closing tags", () => {
    const xml = '<root><empty/><another attr="val"/></root>';
    const result = parseXml(xml);

    assert.strictEqual(result.children.length, 2);
    assert.strictEqual(result.children[0].tag, "empty");
    assert.strictEqual(result.children[1].attributes.attr, "val");
  });

  it("should decode XML entities", () => {
    const xml = '<root>&amp; &lt; &gt; &quot; &apos;</root>';
    const result = parseXml(xml);

    assert.strictEqual(result.text, '& < > " \'');
  });

  it("should decode numeric entities", () => {
    const xml = '<root>&#65;&#x42;</root>';
    const result = parseXml(xml);

    assert.strictEqual(result.text, "AB");
  });

  it("should handle namespaced tags", () => {
    const xml = '<x:root xmlns:x="http://example.com"><x:child/></x:root>';
    const result = parseXml(xml);

    assert.strictEqual(result.tag, "root"); // Namespace prefix stripped
    assert.strictEqual(result.children[0].tag, "child");
  });

  it("should skip XML declaration", () => {
    const xml = '<?xml version="1.0"?><root/>';
    const result = parseXml(xml);

    assert.strictEqual(result.tag, "root");
  });

  it("should handle CDATA sections", () => {
    const xml = "<root><![CDATA[<special>content</special>]]></root>";
    const result = parseXml(xml);

    assert.strictEqual(result.text, "<special>content</special>");
  });
});

describe("findElements", () => {
  it("should find all elements with matching tag", () => {
    const xml = "<root><item>1</item><item>2</item><other/></root>";
    const root = parseXml(xml);
    const items = findElements(root, "item");

    assert.strictEqual(items.length, 2);
    assert.strictEqual(items[0].text, "1");
    assert.strictEqual(items[1].text, "2");
  });

  it("should search recursively", () => {
    const xml = "<root><level1><target/></level1><target/></root>";
    const root = parseXml(xml);
    const targets = findElements(root, "target");

    assert.strictEqual(targets.length, 2);
  });
});

describe("findElement", () => {
  it("should find first matching element", () => {
    const xml = "<root><item>first</item><item>second</item></root>";
    const root = parseXml(xml);
    const item = findElement(root, "item");

    assert.ok(item);
    assert.strictEqual(item.text, "first");
  });

  it("should return undefined if not found", () => {
    const xml = "<root><other/></root>";
    const root = parseXml(xml);
    const item = findElement(root, "notfound");

    assert.strictEqual(item, undefined);
  });
});

describe("getAttribute", () => {
  it("should get attribute value", () => {
    const xml = '<element key="value"/>';
    const root = parseXml(xml);

    assert.strictEqual(getAttribute(root, "key"), "value");
    assert.strictEqual(getAttribute(root, "missing"), undefined);
  });
});

describe("getTextContent", () => {
  it("should get all text content recursively", () => {
    const xml = "<root><greeting>Hello</greeting><name>World</name></root>";
    const root = parseXml(xml);

    assert.strictEqual(getTextContent(root), "HelloWorld");
  });

  it("should get text from nested elements", () => {
    const xml = "<root><a><b>nested</b></a></root>";
    const root = parseXml(xml);

    assert.strictEqual(getTextContent(root), "nested");
  });
});
