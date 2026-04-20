/**
 * Tests for advanced features: styles, comments, named ranges, validation, images
 */
import assert from "node:assert";
import { describe, it } from "node:test";
import {
    getCellStyle, getComment,
    getCommentsMap, getNamedRange, getValidationForCell, parseComments, parseDataValidations, parseListFormula, parseNamedRanges, parseRangeRef, parseStyles
} from "../sheets";

describe("Styles Parser", () => {
  it("should parse fonts", () => {
    const xml = `<?xml version="1.0"?>
      <styleSheet>
        <fonts count="2">
          <font>
            <sz val="11"/>
            <name val="Calibri"/>
          </font>
          <font>
            <b/>
            <i/>
            <sz val="14"/>
            <name val="Arial"/>
            <color rgb="FFFF0000"/>
          </font>
        </fonts>
        <fills count="1"><fill><patternFill patternType="none"/></fill></fills>
        <borders count="1"><border/></borders>
        <cellXfs count="1"><xf fontId="0"/></cellXfs>
      </styleSheet>`;

    const styles = parseStyles(xml);

    assert.strictEqual(styles.fonts.length, 2);
    assert.strictEqual(styles.fonts[0].name, "Calibri");
    assert.strictEqual(styles.fonts[0].size, 11);
    assert.strictEqual(styles.fonts[1].bold, true);
    assert.strictEqual(styles.fonts[1].italic, true);
    assert.strictEqual(styles.fonts[1].name, "Arial");
    assert.strictEqual(styles.fonts[1].color, "#FF0000");
  });

  it("should parse fills", () => {
    const xml = `<?xml version="1.0"?>
      <styleSheet>
        <fonts count="1"><font/></fonts>
        <fills count="2">
          <fill><patternFill patternType="none"/></fill>
          <fill>
            <patternFill patternType="solid">
              <fgColor rgb="FFFFFF00"/>
              <bgColor rgb="FF000000"/>
            </patternFill>
          </fill>
        </fills>
        <borders count="1"><border/></borders>
        <cellXfs count="1"><xf fillId="0"/></cellXfs>
      </styleSheet>`;

    const styles = parseStyles(xml);

    assert.strictEqual(styles.fills.length, 2);
    assert.strictEqual(styles.fills[1].patternType, "solid");
    assert.strictEqual(styles.fills[1].fgColor, "#FFFF00");
  });

  it("should parse borders", () => {
    const xml = `<?xml version="1.0"?>
      <styleSheet>
        <fonts count="1"><font/></fonts>
        <fills count="1"><fill/></fills>
        <borders count="2">
          <border/>
          <border>
            <left style="thin"><color rgb="FF000000"/></left>
            <right style="thin"/>
            <top style="medium"/>
            <bottom style="thick"/>
          </border>
        </borders>
        <cellXfs count="1"><xf borderId="0"/></cellXfs>
      </styleSheet>`;

    const styles = parseStyles(xml);

    assert.strictEqual(styles.borders.length, 2);
    assert.strictEqual(styles.borders[1].left?.style, "thin");
    assert.strictEqual(styles.borders[1].left?.color, "#000000");
    assert.strictEqual(styles.borders[1].top?.style, "medium");
  });

  it("should get cell style by index", () => {
    const xml = `<?xml version="1.0"?>
      <styleSheet>
        <fonts count="2">
          <font><name val="Calibri"/></font>
          <font><b/><name val="Arial"/></font>
        </fonts>
        <fills count="1"><fill/></fills>
        <borders count="1"><border/></borders>
        <cellXfs count="2">
          <xf fontId="0"/>
          <xf fontId="1"/>
        </cellXfs>
      </styleSheet>`;

    const styles = parseStyles(xml);
    const style = getCellStyle(styles, 1);

    assert.ok(style);
    assert.strictEqual(style.font?.bold, true);
    assert.strictEqual(style.font?.name, "Arial");
  });
});

describe("Comments Parser", () => {
  it("should parse comments with authors", () => {
    const xml = `<?xml version="1.0"?>
      <comments>
        <authors>
          <author>John Doe</author>
          <author>Jane Smith</author>
        </authors>
        <commentList>
          <comment ref="A1" authorId="0">
            <text><t>This is a comment</t></text>
          </comment>
          <comment ref="B2" authorId="1">
            <text><t>Another comment</t></text>
          </comment>
        </commentList>
      </comments>`;

    const comments = parseComments(xml);

    assert.strictEqual(comments.authors.length, 2);
    assert.strictEqual(comments.comments.length, 2);
    assert.strictEqual(comments.comments[0].ref, "A1");
    assert.strictEqual(comments.comments[0].author, "John Doe");
    assert.strictEqual(comments.comments[0].text, "This is a comment");
  });

  it("should get comment by cell reference", () => {
    const xml = `<?xml version="1.0"?>
      <comments>
        <authors><author>User</author></authors>
        <commentList>
          <comment ref="C3" authorId="0">
            <text><t>Found me!</t></text>
          </comment>
        </commentList>
      </comments>`;

    const comments = parseComments(xml);
    const comment = getComment(comments, "C3");

    assert.ok(comment);
    assert.strictEqual(comment.text, "Found me!");
  });

  it("should create comments map", () => {
    const xml = `<?xml version="1.0"?>
      <comments>
        <authors><author>User</author></authors>
        <commentList>
          <comment ref="A1" authorId="0"><text><t>One</t></text></comment>
          <comment ref="B2" authorId="0"><text><t>Two</t></text></comment>
        </commentList>
      </comments>`;

    const comments = parseComments(xml);
    const map = getCommentsMap(comments);

    assert.strictEqual(map.size, 2);
    assert.strictEqual(map.get("A1")?.text, "One");
    assert.strictEqual(map.get("B2")?.text, "Two");
  });
});

describe("Named Ranges Parser", () => {
  it("should parse named ranges", () => {
    const xml = `<?xml version="1.0"?>
      <workbook>
        <definedNames>
          <definedName name="MyRange">Sheet1!$A$1:$B$10</definedName>
          <definedName name="LocalName" localSheetId="0">Sheet1!$C$1</definedName>
          <definedName name="_Hidden" hidden="1">Sheet1!$Z$1</definedName>
        </definedNames>
      </workbook>`;

    const ranges = parseNamedRanges(xml);

    assert.strictEqual(ranges.length, 3);
    assert.strictEqual(ranges[0].name, "MyRange");
    assert.strictEqual(ranges[0].ref, "Sheet1!$A$1:$B$10");
    assert.strictEqual(ranges[1].localSheetId, 0);
    assert.strictEqual(ranges[2].hidden, true);
  });

  it("should get named range by name", () => {
    const xml = `<?xml version="1.0"?>
      <workbook>
        <definedNames>
          <definedName name="Data">Sheet1!$A$1:$A$100</definedName>
        </definedNames>
      </workbook>`;

    const ranges = parseNamedRanges(xml);
    const range = getNamedRange(ranges, "Data");

    assert.ok(range);
    assert.strictEqual(range.name, "Data");
  });

  it("should parse range reference", () => {
    const ref = parseRangeRef("Sheet1!$A$1:$B$10");

    assert.strictEqual(ref.sheetName, "Sheet1");
    assert.strictEqual(ref.startCell, "A1");
    assert.strictEqual(ref.endCell, "B10");
    assert.strictEqual(ref.startCol, 0);
    assert.strictEqual(ref.startRow, 0);
    assert.strictEqual(ref.endCol, 1);
    assert.strictEqual(ref.endRow, 9);
  });

  it("should parse single cell reference", () => {
    const ref = parseRangeRef("$C$5");

    assert.strictEqual(ref.startCell, "C5");
    assert.strictEqual(ref.endCell, "C5");
    assert.strictEqual(ref.startCol, 2);
    assert.strictEqual(ref.startRow, 4);
  });
});

describe("Data Validation Parser", () => {
  it("should parse list validation", () => {
    const xml = `<?xml version="1.0"?>
      <worksheet>
        <dataValidations count="1">
          <dataValidation type="list" sqref="A1:A100" allowBlank="1" showDropDown="0">
            <formula1>"Option1,Option2,Option3"</formula1>
          </dataValidation>
        </dataValidations>
      </worksheet>`;

    const validations = parseDataValidations(xml);

    assert.strictEqual(validations.length, 1);
    assert.strictEqual(validations[0].type, "list");
    assert.strictEqual(validations[0].sqref, "A1:A100");
    assert.strictEqual(validations[0].allowBlank, true);
    assert.strictEqual(validations[0].showDropDown, true); // Note: inverted in Excel
    assert.strictEqual(validations[0].formula1, '"Option1,Option2,Option3"');
  });

  it("should parse whole number validation", () => {
    const xml = `<?xml version="1.0"?>
      <worksheet>
        <dataValidations>
          <dataValidation type="whole" operator="between" sqref="B1:B50"
            showErrorMessage="1" errorTitle="Invalid" error="Enter 1-100">
            <formula1>1</formula1>
            <formula2>100</formula2>
          </dataValidation>
        </dataValidations>
      </worksheet>`;

    const validations = parseDataValidations(xml);

    assert.strictEqual(validations[0].type, "whole");
    assert.strictEqual(validations[0].operator, "between");
    assert.strictEqual(validations[0].formula1, "1");
    assert.strictEqual(validations[0].formula2, "100");
    assert.strictEqual(validations[0].showErrorMessage, true);
    assert.strictEqual(validations[0].errorTitle, "Invalid");
  });

  it("should get validation for cell", () => {
    const xml = `<?xml version="1.0"?>
      <worksheet>
        <dataValidations>
          <dataValidation type="list" sqref="A1:C10">
            <formula1>"Yes,No"</formula1>
          </dataValidation>
        </dataValidations>
      </worksheet>`;

    const validations = parseDataValidations(xml);

    assert.ok(getValidationForCell(validations, "B5"));
    assert.strictEqual(getValidationForCell(validations, "D5"), undefined);
  });

  it("should parse list formula values", () => {
    const values = parseListFormula('"Option1,Option2,Option3"');

    assert.ok(Array.isArray(values));
    assert.deepStrictEqual(values, ["Option1", "Option2", "Option3"]);
  });

  it("should return range reference for non-literal list", () => {
    const ref = parseListFormula("Sheet1!$A$1:$A$10");

    assert.strictEqual(ref, "Sheet1!$A$1:$A$10");
  });
});

describe("Images Parser Types", () => {
  it("should export image types", async () => {
    const { emuToPixels } = await import("../sheets/images-parser");

    // EMU to pixels conversion
    const pixels = emuToPixels(914400); // 1 inch
    assert.strictEqual(pixels, 96); // 96 DPI
  });
});
