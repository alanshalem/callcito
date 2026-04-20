"use server";

//#region Imports
import { canCreateCatalog } from "@/lib/plan-limits";
import { prismaClient } from "@/lib/prismaClient";
import { catalogSchema, type CatalogInput } from "@/lib/type";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { getCurrentCompany } from "./company";

//#region requireEditor — security helper
// Chequea que el user tenga membership OWNER/ADMIN/EDITOR en la Company.
// Retorna el membership role si OK, null si no.
async function requireEditor() {
  const company = await getCurrentCompany();
  if (!company) return null;
  const { userId } = await auth();
  const dbUser = userId
    ? await prismaClient.user.findUnique({ where: { clerkId: userId } })
    : null;
  if (!dbUser) return null;
  const membership = await prismaClient.membership.findUnique({
    where: { userId_companyId: { userId: dbUser.id, companyId: company.id } },
  });
  if (!membership) return null;
  if (membership.role === "VIEWER") return null;
  return { company, membership };
}
//#endregion
//#endregion

//#region createCatalog
export async function createCatalog(input: CatalogInput) {
  const parsed = catalogSchema.safeParse(input);
  if (!parsed.success) {
    return { status: 400 as const, errors: parsed.error.flatten() };
  }
  const ctx = await requireEditor();
  if (!ctx) return { status: 403 as const, message: "Sin permisos" };

  const limit = await canCreateCatalog(ctx.company.id);
  if (!limit.allowed) {
    return { status: 402 as const, message: limit.reason };
  }

  try {
    const catalog = await prismaClient.catalog.create({
      data: { ...parsed.data, companyId: ctx.company.id },
    });
    revalidatePath("/catalogs");
    return { status: 201 as const, catalog };
  } catch (error) {
    console.error("[createCatalog]", error);
    return { status: 500 as const, message: "No se pudo crear el catálogo" };
  }
}
//#endregion

//#region updateCatalog
export async function updateCatalog(id: string, input: Partial<CatalogInput>) {
  const ctx = await requireEditor();
  if (!ctx) return { status: 403 as const };

  try {
    const catalog = await prismaClient.catalog.update({
      where: { id, companyId: ctx.company.id },
      data: input,
    });
    revalidatePath("/catalogs");
    revalidatePath(`/catalogs/${id}`);
    return { status: 200 as const, catalog };
  } catch (error) {
    console.error("[updateCatalog]", error);
    return { status: 500 as const };
  }
}
//#endregion

//#region deleteCatalog
// onDelete: Cascade en schema → borra Products + CartItems en cadena (via Cart).
// Requiere OWNER/ADMIN (no EDITOR) por seguridad.
export async function deleteCatalog(id: string) {
  const ctx = await requireEditor();
  if (!ctx) return { status: 403 as const };
  if (ctx.membership.role === "EDITOR") {
    return { status: 403 as const, message: "Solo OWNER/ADMIN pueden borrar catálogos" };
  }

  try {
    await prismaClient.catalog.delete({ where: { id, companyId: ctx.company.id } });
    revalidatePath("/catalogs");
    return { status: 200 as const };
  } catch (error) {
    console.error("[deleteCatalog]", error);
    return { status: 500 as const };
  }
}
//#endregion

//#region getCatalogsByCompany
export async function getCatalogsByCompany() {
  const company = await getCurrentCompany();
  if (!company) return [];
  return prismaClient.catalog.findMany({
    where: { companyId: company.id },
    include: { _count: { select: { products: true } }, assistant: true },
    orderBy: { createdAt: "desc" },
  });
}
//#endregion

//#region getCatalogById
export async function getCatalogById(id: string) {
  const company = await getCurrentCompany();
  if (!company) return null;
  return prismaClient.catalog.findFirst({
    where: { id, companyId: company.id },
    include: { assistant: true, _count: { select: { products: true } } },
  });
}
//#endregion

//#region getCatalogBySlug (public)
// Usado por la ruta pública /c/[companySlug]/[catalogSlug]. No requiere auth.
export async function getCatalogBySlug(companySlug: string, catalogSlug: string) {
  const company = await prismaClient.company.findUnique({
    where: { slug: companySlug },
    select: { id: true, name: true, logoUrl: true, currency: true },
  });
  if (!company) return null;
  const catalog = await prismaClient.catalog.findFirst({
    where: { companyId: company.id, slug: catalogSlug, isPublished: true },
    include: { assistant: true },
  });
  if (!catalog) return null;
  return { company, catalog };
}
//#endregion
