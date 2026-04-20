# XLSX Parser - Documentación Interna

Librería interna para parsear archivos Excel (.xlsx) sin dependencias externas.
Creada para reemplazar el paquete `xlsx` que tenía vulnerabilidades de seguridad.

## Estructura de archivos

```
src/lib/xlsx-parser/
├── index.ts                    # API pública - punto de entrada
├── types.ts                    # Tipos TypeScript
├── xlsx-parser.ts              # Parser principal XLSX
├── xlsx-writer.ts              # Escritor de archivos XLSX
├── xlsx-stream.ts              # Parser streaming para archivos grandes
├── csv/
│   ├── index.ts                # Exports del módulo CSV
│   └── csv-parser.ts           # Parser/writer CSV RFC 4180
├── zip/
│   ├── index.ts                # Exports del módulo ZIP
│   ├── zip-reader.ts           # Lector de archivos ZIP
│   ├── zip-writer.ts           # Escritor de archivos ZIP
│   └── deflate.ts              # Descompresor/compresor DEFLATE (RFC 1951)
├── xml/
│   ├── index.ts                # Exports del módulo XML
│   └── xml-parser.ts           # Parser XML minimalista
├── sheets/
│   ├── index.ts                # Exports del módulo sheets
│   ├── workbook-parser.ts      # Parsea xl/workbook.xml
│   ├── shared-strings.ts       # Parsea xl/sharedStrings.xml
│   ├── worksheet-parser.ts     # Parsea xl/worksheets/sheetN.xml
│   ├── styles-parser.ts        # Parsea xl/styles.xml (fuentes, colores, bordes)
│   ├── comments-parser.ts      # Parsea xl/commentsN.xml
│   ├── named-ranges-parser.ts  # Parsea definedNames
│   ├── data-validation-parser.ts # Parsea reglas de validación
│   └── images-parser.ts        # Parsea imágenes incrustadas
└── utils/
    ├── index.ts                # Exports del módulo utils
    ├── buffer-reader.ts        # Lectura de buffers binarios
    ├── date-utils.ts           # Conversión de fechas Excel
    ├── errors.ts               # Clases de error personalizadas
    └── platform.ts             # Compatibilidad Browser/Node.js
```

## Formato XLSX

Un archivo .xlsx es un ZIP que contiene:

```
archivo.xlsx (ZIP)
├── [Content_Types].xml         # Tipos de contenido
├── _rels/
│   └── .rels                   # Relaciones principales
├── docProps/
│   ├── app.xml                 # Propiedades de la app
│   └── core.xml                # Propiedades del documento
└── xl/
    ├── workbook.xml            # Definición del workbook (nombres de hojas)
    ├── styles.xml              # Estilos (formatos de número, fuentes, etc.)
    ├── sharedStrings.xml       # Tabla de strings compartidos
    ├── _rels/
    │   └── workbook.xml.rels   # Relaciones del workbook
    └── worksheets/
        ├── sheet1.xml          # Datos de la hoja 1
        ├── sheet2.xml          # Datos de la hoja 2
        └── ...
```

## API Pública

### Lectura

```typescript
import XLSX from "@/lib/xlsx-parser";

// Leer desde ArrayBuffer/Uint8Array (Browser/Node.js)
const workbook = XLSX.read(data, { type: "array" });

// Leer desde archivo (Node.js only)
const workbook = XLSX.readFile("path/to/file.xlsx");

// Obtener nombres de hojas
const sheetNames = workbook.SheetNames; // ["Sheet1", "Sheet2"]

// Obtener worksheet
const sheet = workbook.Sheets["Sheet1"];

// Convertir a array de arrays
const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
// Resultado: [["A1", "B1"], ["A2", "B2"], ...]

// Convertir fechas
const date = XLSX.utils.excelDateToJSDate(45678); // Date object
```

### Escritura

```typescript
import XLSX from "@/lib/xlsx-parser";

// Crear workbook vacío
const workbook = XLSX.utils.book_new();

// Crear worksheet desde array de arrays
const data = [
  ["Nombre", "Edad", "Fecha"],
  ["Juan", 25, new Date()],
  ["María", 30, new Date()],
];
const sheet = XLSX.utils.aoa_to_sheet(data);

// Agregar worksheet al workbook
XLSX.utils.book_append_sheet(workbook, sheet, "Datos");

// Escribir a buffer
const buffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" });

// Escribir a archivo (Node.js only)
XLSX.writeFile(workbook, "output.xlsx");
```

### CSV (RFC 4180)

El módulo `csv/` parsea y serializa CSV sin dependencias externas. Soporta:
- Delimitador configurable (default `,`; setear `;` para LATAM, `\t` para TSV)
- Campos entre comillas con escape `""`
- Saltos de línea dentro de comillas
- BOM UTF-8 (strip en lectura, opcional al escribir)
- Auto-tipado opcional (`typed: true` → números, booleanos, `""` → null)
- Preserva SKUs con ceros a la izquierda (`"007"` queda string)

```typescript
import XLSX from "@/lib/xlsx-parser";

// Parsear texto CSV a 2D array
const rows = XLSX.csv.parse('name,price\nfoo,123\nbar,45.5', { typed: true });
// → [["name","price"], ["foo",123], ["bar",45.5]]

// Parsear a XlsxWorkbook (compatible con el resto de la API)
const wb = XLSX.csv.read('name,price\nfoo,123');
const sheet = wb.Sheets[wb.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

// Delimitador custom (CSV español)
const rows = XLSX.csv.parse('a;b;c\n1;2;3', { delimiter: ';' });

// Streaming row-by-row (útil para archivos grandes)
for (const row of XLSX.csv.stream(csvText)) {
  // procesar row...
}

// Serializar worksheet/array a CSV
const csvOut = XLSX.csv.stringify([
  ["name", "note"],
  ["foo", 'hi, "world"'],
]);
// → 'name,note\r\n"foo","hi, ""world"""'

// Con BOM para compatibilidad con Excel en Windows
const csvBom = XLSX.csv.stringify(rows, { bom: true, eol: '\n' });
```

**API**:
- `XLSX.csv.parse(text, opts?)` → `CellValue[][]`
- `XLSX.csv.read(text, opts?)` → `XlsxWorkbook`
- `XLSX.csv.stringify(sheetOrRows, opts?)` → `string`
- `XLSX.csv.stream(text, opts?)` → `Generator<CellValue[]>`

**Options de parsing**: `delimiter`, `quote`, `skipEmptyRows`, `stripBom`, `typed`, `sheetName`.
**Options de stringify**: `delimiter`, `quote`, `eol`, `bom`.

### Streaming (para archivos grandes)

```typescript
import XLSX from "@/lib/xlsx-parser";

// Crear stream reader desde buffer
const stream = XLSX.stream(buffer);

// O desde archivo (Node.js only)
const stream = XLSX.streamFile("path/to/large-file.xlsx");

// Obtener nombres de hojas
console.log(stream.SheetNames);

// Iterar fila por fila (memoria eficiente)
for (const row of stream.streamRows("Sheet1")) {
  console.log(`Row ${row.rowIndex}:`, row.cells);
}

// O como arrays
for (const row of stream.streamRowsAsArrays("Sheet1")) {
  console.log(row); // ["A1", "B1", "C1", ...]
}

// Procesar en chunks
await stream.processInChunks("Sheet1", 1000, async (rows, startIndex) => {
  console.log(`Processing ${rows.length} rows starting at ${startIndex}`);
  // Procesar chunk...
});

// Contar filas sin cargar datos
const count = stream.countRows("Sheet1");
```

### Fórmulas

```typescript
import XLSX, { createFormula } from "@/lib/xlsx-parser";

// Crear celda con fórmula
const data = [
  ["A", "B", "Sum"],
  [10, 20, createFormula("A2+B2", 30)],  // fórmula con valor pre-calculado
  [5, 15, createFormula("A3+B3")],        // fórmula sin valor
];

const wb = XLSX.utils.book_new();
const ws = XLSX.utils.aoa_to_sheet(data);
XLSX.utils.book_append_sheet(wb, ws, "Formulas");

// Escribir - las fórmulas se preservan
XLSX.writeFile(wb, "with-formulas.xlsx");
```

### Estilos de celdas

```typescript
import { parseStyles, getCellStyle } from "@/lib/xlsx-parser";

// Parsear estilos desde XML (acceso de bajo nivel)
const stylesXml = zip.getFileAsString("xl/styles.xml");
const styles = parseStyles(stylesXml);

// Obtener estilo por índice (s attribute de la celda)
const cellStyle = getCellStyle(styles, 1);

console.log(cellStyle.font?.name);      // "Calibri"
console.log(cellStyle.font?.bold);      // true
console.log(cellStyle.fill?.fgColor);   // "#FFFF00"
console.log(cellStyle.border?.left);    // { style: "thin", color: "#000000" }
```

### Comentarios

```typescript
import { parseComments, getComment } from "@/lib/xlsx-parser";

// Parsear comentarios desde XML
const commentsXml = zip.getFileAsString("xl/comments1.xml");
const comments = parseComments(commentsXml);

// Obtener comentario de una celda
const comment = getComment(comments, "A1");
console.log(comment?.author);  // "John Doe"
console.log(comment?.text);    // "Este es un comentario"
```

### Rangos nombrados

```typescript
import { parseNamedRanges, getNamedRange, parseRangeRef } from "@/lib/xlsx-parser";

// Parsear desde workbook.xml
const workbookXml = zip.getFileAsString("xl/workbook.xml");
const ranges = parseNamedRanges(workbookXml);

// Obtener rango por nombre
const range = getNamedRange(ranges, "MiRango");
console.log(range?.ref);  // "Sheet1!$A$1:$B$10"

// Parsear referencia
const parsed = parseRangeRef("Sheet1!$A$1:$B$10");
console.log(parsed.sheetName);  // "Sheet1"
console.log(parsed.startCol);   // 0 (columna A)
console.log(parsed.endRow);     // 9 (fila 10)
```

### Validación de datos

```typescript
import { parseDataValidations, getValidationForCell, parseListFormula } from "@/lib/xlsx-parser";

// Parsear validaciones desde worksheet XML
const validations = parseDataValidations(worksheetXml);

// Obtener validación para una celda
const validation = getValidationForCell(validations, "A1");
console.log(validation?.type);       // "list"
console.log(validation?.formula1);   // '"Opción1,Opción2,Opción3"'

// Parsear valores de lista
const values = parseListFormula(validation.formula1);
// ["Opción1", "Opción2", "Opción3"]
```

### Imágenes incrustadas

```typescript
import { findDrawingForSheet, parseDrawing, extractImageAsDataUrl } from "@/lib/xlsx-parser";

// Encontrar drawing asociado a la hoja
const drawingPath = findDrawingForSheet(zip, "xl/worksheets/sheet1.xml");
if (drawingPath) {
  const drawingXml = zip.getFileAsString(drawingPath);
  const relsPath = drawingPath.replace(".xml", ".xml.rels").replace("drawings/", "drawings/_rels/");
  const relsXml = zip.getFileAsString(relsPath);

  const drawing = parseDrawing(drawingXml, relsXml);

  for (const image of drawing.images) {
    console.log(image.name);        // "Imagen1"
    console.log(image.from?.col);   // Columna donde inicia
    console.log(image.from?.row);   // Fila donde inicia

    // Extraer como data URL para usar en <img src="">
    const dataUrl = extractImageAsDataUrl(zip, image);
  }
}
```

## Componentes internos

### ZIP (zip/)

#### zip-reader.ts
- `ZipReader`: Clase para leer archivos ZIP
  - `constructor(buffer)`: Inicializa con Uint8Array
  - `getFileNames()`: Lista archivos en el ZIP
  - `hasFile(name)`: Verifica si existe un archivo
  - `getFile(name)`: Extrae y descomprime un archivo
  - `getFileAsString(name)`: Extrae como string UTF-8

#### zip-writer.ts
- `ZipWriter`: Clase para crear archivos ZIP
  - `addFile(name, data)`: Agrega archivo al ZIP
  - `addFileFromString(name, content)`: Agrega string como archivo
  - `toBuffer()`: Genera el ZIP como Uint8Array

#### deflate.ts
- `inflate(data)`: Descomprime datos DEFLATE
- `deflate(data)`: Comprime datos con DEFLATE

### XML (xml/)

#### xml-parser.ts
- `parseXml(xml)`: Parsea string XML a árbol de elementos
- `findElements(root, tagName)`: Busca elementos por tag
- `findElement(root, tagName)`: Busca primer elemento
- `getAttribute(element, name)`: Obtiene atributo
- `getTextContent(element)`: Obtiene texto del elemento

### Sheets (sheets/)

#### workbook-parser.ts
- `parseWorkbook(xml)`: Extrae info de hojas desde workbook.xml

#### shared-strings.ts
- `parseSharedStrings(xml)`: Extrae tabla de strings compartidos

#### worksheet-parser.ts
- `parseWorksheet(xml, sharedStrings, options)`: Extrae datos de celdas
  - Soporta tipos: string, number, boolean, date, formula, error

### Utils (utils/)

#### buffer-reader.ts
- `BufferReader`: Lectura de datos binarios little-endian
- `BitReader`: Lectura de bits para DEFLATE

#### date-utils.ts
- `excelDateToJSDate(serial)`: Convierte serial Excel a Date
- `jsDateToExcelDate(date)`: Convierte Date a serial Excel
- `isDateFormat(formatCode)`: Detecta si es formato de fecha

#### errors.ts
- `XlsxError`: Error base de la librería
- `XlsxParseError`: Error de parseo
- `XlsxZipError`: Error de ZIP
- `XlsxXmlError`: Error de XML

#### platform.ts
- `runtime`: Detección de entorno (Node.js/Browser/Worker)
- `readFileSync(path)`: Lee archivo del filesystem
- `toUint8Array(data)`: Normaliza input a Uint8Array

## Tipos de celda en Excel

| Tipo | Atributo `t` | Descripción |
|------|--------------|-------------|
| Shared String | `s` | Índice a sharedStrings.xml |
| Number | `n` o ausente | Número (incluye fechas como serial) |
| Inline String | `inlineStr` | String directo en la celda |
| Boolean | `b` | 0 = false, 1 = true |
| Error | `e` | Código de error (#REF!, #VALUE!, etc.) |
| Formula String | `str` | Resultado de fórmula como string |

## Formato de fechas Excel

Excel almacena fechas como números seriales:
- Día 1 = 1 de enero de 1900 (serial = 1)
- Día 2 = 2 de enero de 1900 (serial = 2)
- Hoy podría ser serial ~45678

Para detectar si un número es fecha, se usa el formato de la celda (styles.xml).

## Fórmulas

Las fórmulas se almacenan en el elemento `<f>` de la celda:
```xml
<c r="A1">
  <f>SUM(B1:B10)</f>
  <v>150</v>
</c>
```
- `<f>`: La fórmula
- `<v>`: El valor calculado (resultado)

## Tests

Los tests están en `src/lib/xlsx-parser/__tests__/`:
- `date-utils.test.ts`: Tests de conversión de fechas Excel
- `deflate.test.ts`: Tests de descompresión DEFLATE
- `xml-parser.test.ts`: Tests del parser XML
- `xlsx.test.ts`: Tests de lectura XLSX
- `xlsx-writer.test.ts`: Tests de escritura XLSX
- `xlsx-stream.test.ts`: Tests de streaming
- `formulas.test.ts`: Tests de soporte de fórmulas
- `advanced-features.test.ts`: Tests de estilos, comentarios, rangos nombrados, validación
- `csv.test.ts`: Tests de CSV parse/stringify/stream (RFC 4180)

Ejecutar tests (89 tests):
```bash
npm run test:xlsx
```

## Limitaciones conocidas

1. **No soporta .xls** - Solo formato .xlsx (Office 2007+)
2. **Sin gráficos** - No procesa charts
3. **Sin macros** - No ejecuta ni preserva VBA
4. **Sin protección** - No maneja worksheets protegidos con password
5. **Estilos solo lectura** - Los estilos se pueden leer pero no escribir

## Compatibilidad

- **Browser**: Chrome 60+, Firefox 55+, Safari 11+, Edge 79+
- **Node.js**: 14+
- **Bundlers**: Webpack, Vite, Turbopack (Next.js)

## Rendimiento

- Lazy loading de worksheets (solo se parsean cuando se acceden)
- Buffers pre-alocados en DEFLATE
- Cache de árboles Huffman fijos
- Sin regex en hot paths del parser XML

## Migración desde xlsx

```typescript
// Antes (xlsx)
import XLSX from "xlsx";
const workbook = XLSX.read(data, { type: "array" });
const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

// Después (xlsx-parser) - misma API
import XLSX from "@/lib/xlsx-parser";
const workbook = XLSX.read(data, { type: "array" });
const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
```
