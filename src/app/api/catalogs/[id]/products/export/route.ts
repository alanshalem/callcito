//#region Imports
import { getCurrentCompany } from "@/actions/company";
import { prismaClient } from "@/lib/prismaClient";
import XLSX from "@/lib/xlsx-parser";
//#endregion

//#region GET /api/catalogs/[id]/products/export → XLSX
// Export productos del catálogo (respeta el formato aceptado por el endpoint de import
// → round-trip posible).
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const company = await getCurrentCompany();
  if (!company) return new Response("Unauthorized", { status: 401 });

  const catalog = await prismaClient.catalog.findFirst({
    where: { id, companyId: company.id },
    select: { id: true, slug: true },
  });
  if (!catalog) return new Response("Not found", { status: 404 });

  const products = await prismaClient.product.findMany({
    where: { catalogId: id },
    orderBy: { createdAt: "asc" },
  });

  const header = [
    "name", "description", "price", "currency", "sku", "stock",
    "tags", "image_url1", "image_url2", "image_url3", "isActive",
  ];
  const rows: (string | number | boolean | null)[][] = products.map((p) => [
    p.name,
    p.description ?? "",
    Number(p.price),
    p.currency,
    p.sku ?? "",
    p.stock ?? "",
    p.tags.join(","),
    p.images[0] ?? "",
    p.images[1] ?? "",
    p.images[2] ?? "",
    p.isActive,
  ]);

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
  XLSX.utils.book_append_sheet(wb, ws, "Products");
  const buffer = XLSX.write(wb, { type: "array", bookType: "xlsx" });

  return new Response(buffer as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="products-${catalog.slug}-${Date.now()}.xlsx"`,
    },
  });
}
//#endregion
