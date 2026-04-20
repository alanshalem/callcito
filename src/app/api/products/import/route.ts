//#region Imports
import { bulkCreateProducts } from "@/actions/product";
import { productSchema } from "@/lib/type";
import XLSX from "@/lib/xlsx-parser";
import type { CellValue } from "@/lib/xlsx-parser/types";
import { auth } from "@clerk/nextjs/server";
//#endregion

//#region Bulk import endpoint
// POST /api/products/import
// Body: multipart/form-data
//   - file: .xlsx | .csv
//   - catalogId: string (UUID)
// Valida ownership via `bulkCreateProducts` (chequea company activa).
//
// Columnas esperadas (headers primera fila, case-insensitive):
//   name*, description, price*, currency, sku, stock,
//   tags (coma-separado), image_url1, image_url2, image_url3
// Límite: 6000 filas de datos. Batch insert interno de 500.
const MAX_ROWS = 6000;

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return jsonError(401, "Unauthorized");

  const form = await req.formData().catch(() => null);
  if (!form) return jsonError(400, "Body inválido");

  const file = form.get("file");
  const catalogId = form.get("catalogId");
  if (!(file instanceof File) || typeof catalogId !== "string") {
    return jsonError(400, "Falta `file` o `catalogId`");
  }

  const buffer = new Uint8Array(await file.arrayBuffer());
  const filename = file.name.toLowerCase();

  let rows: CellValue[][];
  try {
    rows = parseFile(buffer, filename);
  } catch (error) {
    console.error("[import] parse error", error);
    return jsonError(400, "No se pudo parsear el archivo");
  }

  if (rows.length < 2) return jsonError(400, "Archivo vacío o sin filas de datos");
  if (rows.length - 1 > MAX_ROWS) {
    return jsonError(400, `Máximo ${MAX_ROWS} filas por upload`);
  }

  const header = rows[0].map((h) => String(h ?? "").trim().toLowerCase());
  const dataRows = rows.slice(1);
  const products = dataRows.map((r) => rowToProduct(r, header));

  const res = await bulkCreateProducts(catalogId, products);
  return Response.json(res, { status: res.status });
}
//#endregion

//#region Helpers
function parseFile(buffer: Uint8Array, filename: string): CellValue[][] {
  if (filename.endsWith(".csv")) {
    const text = new TextDecoder("utf-8").decode(buffer);
    return XLSX.csv.parse(text, { typed: true });
  }
  const wb = XLSX.read(buffer, { type: "array" });
  const firstSheet = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json<CellValue[]>(firstSheet, { header: 1 });
}

function rowToProduct(row: CellValue[], header: string[]) {
  const idx = (name: string) => header.indexOf(name);
  const get = (name: string) => {
    const i = idx(name);
    return i === -1 ? undefined : row[i];
  };

  const images = [get("image_url1"), get("image_url2"), get("image_url3")]
    .filter((v) => typeof v === "string" && v.trim().length > 0) as string[];

  const tagsRaw = get("tags");
  const tags =
    typeof tagsRaw === "string"
      ? tagsRaw.split(",").map((s) => s.trim()).filter(Boolean)
      : [];

  return {
    name: String(get("name") ?? "").trim(),
    description: get("description") ? String(get("description")) : undefined,
    price: Number(get("price") ?? 0),
    currency: (get("currency") ? String(get("currency")).toUpperCase() : "ARS") as
      | "ARS" | "BRL" | "CLP" | "COP" | "MXN" | "PEN" | "UYU" | "USD",
    sku: get("sku") ? String(get("sku")) : undefined,
    stock: typeof get("stock") === "number" ? (get("stock") as number) : undefined,
    images,
    tags,
    isActive: true,
  };
}

function jsonError(status: number, message: string) {
  return Response.json({ error: message }, { status });
}
//#endregion
