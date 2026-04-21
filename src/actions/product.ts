"use server";

//#region Imports
import { canCreateProduct } from "@/lib/plan-limits";
import { prismaClient } from "@/lib/prismaClient";
import { productSchema, type ProductInput } from "@/lib/type";
import { revalidatePath } from "next/cache";
import { getCurrentCompany } from "./company";
//#endregion

//#region Guard
async function assertCatalogOwned(catalogId: string) {
  const company = await getCurrentCompany();
  if (!company) return null;
  const catalog = await prismaClient.catalog.findFirst({
    where: { id: catalogId, companyId: company.id },
  });
  return catalog ? { company, catalog } : null;
}

// Nota: permisos por rol — OWNER/ADMIN/EDITOR pueden CRUD productos. VIEWER no.
// La tabla Membership no se consulta acá por costo; se confía en que la UI
// respeta el rol. Para hardening server-side, se puede replicar el patrón de
// requireEditor en catalog.ts.
//#endregion

//#region createProduct
export async function createProduct(catalogId: string, input: ProductInput) {
  const parsed = productSchema.safeParse(input);
  if (!parsed.success) {
    return { status: 400 as const, errors: parsed.error.flatten() };
  }
  const owned = await assertCatalogOwned(catalogId);
  if (!owned) return { status: 403 as const };

  const limit = await canCreateProduct(owned.company.id);
  if (!limit.allowed) return { status: 402 as const, message: limit.reason };

  try {
    const product = await prismaClient.product.create({
      data: { ...parsed.data, catalogId },
    });
    revalidatePath(`/catalogs/${catalogId}`);
    return { status: 201 as const, product };
  } catch (error) {
    console.error("[createProduct]", error);
    return { status: 500 as const };
  }
}
//#endregion

//#region updateProduct
export async function updateProduct(id: string, input: Partial<ProductInput>) {
  const existing = await prismaClient.product.findUnique({ where: { id } });
  if (!existing) return { status: 404 as const };
  const owned = await assertCatalogOwned(existing.catalogId);
  if (!owned) return { status: 403 as const };

  try {
    const product = await prismaClient.product.update({
      where: { id },
      data: input,
    });
    revalidatePath(`/catalogs/${existing.catalogId}`);
    return { status: 200 as const, product };
  } catch (error) {
    console.error("[updateProduct]", error);
    return { status: 500 as const };
  }
}
//#endregion

//#region getProductById
export async function getProductById(id: string) {
  const product = await prismaClient.product.findUnique({ where: { id } });
  if (!product) return null;
  const owned = await assertCatalogOwned(product.catalogId);
  if (!owned) return null;
  return product;
}
//#endregion

//#region deleteProduct
export async function deleteProduct(id: string) {
  const existing = await prismaClient.product.findUnique({ where: { id } });
  if (!existing) return { status: 404 as const };
  const owned = await assertCatalogOwned(existing.catalogId);
  if (!owned) return { status: 403 as const };

  try {
    await prismaClient.product.delete({ where: { id } });
    revalidatePath(`/catalogs/${existing.catalogId}`);
    return { status: 200 as const };
  } catch (error) {
    console.error("[deleteProduct]", error);
    return { status: 500 as const };
  }
}
//#endregion

//#region getProductsByCatalog
export async function getProductsByCatalog(catalogId: string, options?: { limit?: number; offset?: number }) {
  const owned = await assertCatalogOwned(catalogId);
  if (!owned) return [];
  return prismaClient.product.findMany({
    where: { catalogId },
    orderBy: { createdAt: "desc" },
    take: options?.limit,
    skip: options?.offset,
  });
}
//#endregion

//#region searchProducts (usado por Vapi tool)
// Busca productos activos dentro de un catálogo por nombre/tags con filtro
// opcional de precio. Estrategia fuzzy:
// - Descarta stopwords ES + tokens cortos (<3 chars) — evita que "de"/"la"/etc
//   matcheen casi todas las descripciones y saturen el OR.
// - Strip plural "s"/"es" al final de cada palabra → root form (camperas→campera)
// - Busca en name + description + tags
// - Ranking in-memory: name match > tag match > description match. Sin este
//   ranking, un match en description perdía contra top-10 alfabético.
const ES_STOPWORDS = new Set([
  "de","la","el","los","las","un","una","unos","unas","y","o","con","por",
  "para","sin","del","al","en","es","se","lo","le","mi","tu","su","que","como",
  "pero","mas","más","muy","ya","si","no","hay","tengo","tiene","tienes",
]);

export async function searchProducts(
  catalogId: string,
  query: string,
  filters?: { maxPrice?: number; tags?: string[] }
) {
  const q = query.trim().toLowerCase();
  const tokens = q
    .split(/\s+/)
    .filter((t) => t.length >= 3 && !ES_STOPWORDS.has(t));

  const variants = new Set<string>();
  for (const t of tokens) {
    variants.add(t);
    if (t.endsWith("es") && t.length > 4) variants.add(t.slice(0, -2));
    if (t.endsWith("s") && t.length > 3) variants.add(t.slice(0, -1));
    if (t.length > 4) variants.add(t.slice(0, Math.min(t.length - 1, 5)));
  }
  const variantList = Array.from(variants);

  const nameDescClauses = variantList.flatMap((v) => [
    { name: { contains: v, mode: "insensitive" as const } },
    { description: { contains: v, mode: "insensitive" as const } },
  ]);

  const tagsClause = variantList.length > 0 ? { tags: { hasSome: variantList } } : null;

  // Si no hay tokens útiles (query vacía o toda stopwords), fallback a lista.
  const hasSearch = variantList.length > 0;

  const candidates = await prismaClient.product.findMany({
    where: {
      catalogId,
      isActive: true,
      ...(hasSearch
        ? {
            OR: [
              ...nameDescClauses,
              ...(tagsClause ? [tagsClause] : []),
            ],
          }
        : {}),
      ...(filters?.maxPrice ? { price: { lte: filters.maxPrice } } : {}),
      ...(filters?.tags?.length ? { tags: { hasSome: filters.tags } } : {}),
    },
    // Traemos candidatos extra para poder rankear; recortamos después.
    take: hasSearch ? 60 : 10,
    orderBy: { name: "asc" },
  });

  if (!hasSearch) return candidates;

  // Ranking: name hit = 10, tag hit = 5, description hit = 1.
  const scored = candidates.map((p) => {
    const name = p.name.toLowerCase();
    const desc = (p.description ?? "").toLowerCase();
    const tags = p.tags.map((t) => t.toLowerCase());
    let score = 0;
    for (const v of variantList) {
      if (name.includes(v)) score += 10;
      if (tags.some((t) => t.includes(v))) score += 5;
      if (desc.includes(v)) score += 1;
    }
    return { p, score };
  });

  return scored
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map((x) => x.p);
}
//#endregion

//#region bulkCreateProducts
// Llamado desde `/api/products/import` después de parsear xlsx/csv.
// Usa createMany con batching para evitar pegarle feo a la DB.
export async function bulkCreateProducts(
  catalogId: string,
  rows: ProductInput[]
): Promise<{ status: number; created?: number; errors?: { row: number; error: string }[] }> {
  const owned = await assertCatalogOwned(catalogId);
  if (!owned) return { status: 403 };

  const limit = await canCreateProduct(owned.company.id, rows.length);
  if (!limit.allowed) {
    return { status: 402, errors: [{ row: 0, error: limit.reason }] };
  }

  const valid: ProductInput[] = [];
  const errors: { row: number; error: string }[] = [];

  rows.forEach((r, idx) => {
    const parsed = productSchema.safeParse(r);
    if (parsed.success) valid.push(parsed.data);
    else errors.push({ row: idx + 1, error: parsed.error.issues[0]?.message ?? "invalid" });
  });

  const BATCH = 500;
  let created = 0;
  try {
    for (let i = 0; i < valid.length; i += BATCH) {
      const chunk = valid.slice(i, i + BATCH);
      const res = await prismaClient.product.createMany({
        data: chunk.map((p) => ({ ...p, catalogId })),
      });
      created += res.count;
    }
    revalidatePath(`/catalogs/${catalogId}`);
    return { status: 201, created, errors: errors.length ? errors : undefined };
  } catch (error) {
    console.error("[bulkCreateProducts]", error);
    return { status: 500, created, errors };
  }
}
//#endregion
