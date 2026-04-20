"use server";

//#region Imports
import { prismaClient } from "@/lib/prismaClient";
import { companySchema, type CompanyInput } from "@/lib/type";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
//#endregion

//#region createCompany
// Crea Clerk Organization + Company + Membership OWNER del user actual.
// El slug público (/c/[slug]) se guarda tanto en Clerk (Org slug) como en Company.
export async function createCompany(input: CompanyInput) {
  const parsed = companySchema.safeParse(input);
  if (!parsed.success) {
    return { status: 400 as const, message: "Datos inválidos", errors: parsed.error.flatten() };
  }
  const { userId, orgId } = await auth();
  if (!userId) return { status: 403 as const, message: "No autenticado" };

  const dbUser = await prismaClient.user.findUnique({ where: { clerkId: userId } });
  if (!dbUser) return { status: 404 as const, message: "User no sincronizado — recargá la página" };

  const data = parsed.data;

  try {
    const clerk = await clerkClient();

    // Caso: ya hay Clerk Org activa pero Company row fue borrada (drop DB, etc).
    // Linkeamos la Company a la Org existente en vez de crear una nueva
    // (evita colisión de slug + redirect loop).
    let clerkOrgId: string;
    if (orgId) {
      const existingCompany = await prismaClient.company.findUnique({ where: { clerkOrgId: orgId } });
      if (existingCompany) {
        return { status: 409 as const, message: "Ya tenés esta empresa creada" };
      }
      clerkOrgId = orgId;
    } else {
      const org = await clerk.organizations.createOrganization({
        name: data.name,
        slug: data.slug,
        createdBy: userId,
      });
      clerkOrgId = org.id;
    }

    const company = await prismaClient.company.create({
      data: {
        clerkOrgId,
        name: data.name,
        slug: data.slug,
        currency: data.currency,
        country: data.country,
        defaultLanguage: data.defaultLanguage,
        logoUrl: data.logoUrl,
        memberships: {
          create: { userId: dbUser.id, role: "OWNER" },
        },
      },
    });

    revalidatePath("/home");
    return { status: 201 as const, company, clerkOrgId };
  } catch (error) {
    console.error("[createCompany]", error);
    return { status: 500 as const, message: "No se pudo crear la empresa" };
  }
}
//#endregion

//#region getCurrentCompany
// Company activa = la Org seleccionada en Clerk (session.orgId).
// Si no hay orgId, retorna null (layout redirige a onboarding).
export async function getCurrentCompany() {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) return null;

  return prismaClient.company.findUnique({
    where: { clerkOrgId: orgId },
    include: { subscription: { include: { plan: true } } },
  });
}
//#endregion

//#region getUserCompanies
// Todas las companies a las que pertenece el user (para switcher custom si hace falta).
export async function getUserCompanies() {
  const { userId } = await auth();
  if (!userId) return [];
  const user = await prismaClient.user.findUnique({
    where: { clerkId: userId },
    include: { memberships: { include: { company: true } } },
  });
  return user?.memberships.map((m) => ({ role: m.role, company: m.company })) ?? [];
}
//#endregion

//#region deleteCompany
// Elimina Company + Clerk Org. Cascade borra catalogs, products, assistants,
// conversations, carts, orders, memberships, subscription.
// Requiere OWNER y suscripción no ACTIVE (para evitar borrados accidentales con
// billing vivo).
export async function deleteCompany() {
  const company = await getCurrentCompany();
  if (!company) return { status: 403 as const };

  const { userId } = await auth();
  const dbUser = userId
    ? await prismaClient.user.findUnique({ where: { clerkId: userId } })
    : null;
  if (!dbUser) return { status: 403 as const };

  const membership = await prismaClient.membership.findUnique({
    where: { userId_companyId: { userId: dbUser.id, companyId: company.id } },
  });
  if (!membership || membership.role !== "OWNER") {
    return { status: 403 as const, message: "Solo el OWNER puede borrar la empresa" };
  }

  const sub = await prismaClient.subscription.findUnique({
    where: { companyId: company.id },
  });
  if (sub?.status === "ACTIVE") {
    return {
      status: 409 as const,
      message: "Cancelá la suscripción activa antes de borrar la empresa",
    };
  }

  try {
    // Borrar Clerk Org primero (si falla, abortamos para no dejar DB huérfana).
    const clerk = await clerkClient();
    await clerk.organizations
      .deleteOrganization(company.clerkOrgId)
      .catch((e) => console.warn("[deleteCompany] Clerk delete failed (continuing)", e));

    await prismaClient.company.delete({ where: { id: company.id } });
    revalidatePath("/onboarding/company");
    return { status: 200 as const };
  } catch (error) {
    console.error("[deleteCompany]", error);
    return { status: 500 as const, message: "No se pudo borrar la empresa" };
  }
}
//#endregion

//#region updateCompany
// Campos editables: name, logoUrl, defaultLanguage, platformFeeBps, customDomain.
// Slug + clerkOrgId no se cambian aquí. Solo OWNER/ADMIN.
export async function updateCompany(input: {
  name?: string;
  logoUrl?: string | null;
  defaultLanguage?: string;
  platformFeeBps?: number;
  customDomain?: string | null;
}) {
  const company = await getCurrentCompany();
  if (!company) return { status: 403 as const };

  const { userId } = await auth();
  const dbUser = userId
    ? await prismaClient.user.findUnique({ where: { clerkId: userId } })
    : null;
  if (!dbUser) return { status: 403 as const };

  const membership = await prismaClient.membership.findUnique({
    where: { userId_companyId: { userId: dbUser.id, companyId: company.id } },
  });
  if (!membership || (membership.role !== "OWNER" && membership.role !== "ADMIN")) {
    return { status: 403 as const, message: "Solo OWNER/ADMIN pueden editar" };
  }

  try {
    const updated = await prismaClient.company.update({
      where: { id: company.id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.logoUrl !== undefined ? { logoUrl: input.logoUrl } : {}),
        ...(input.defaultLanguage !== undefined ? { defaultLanguage: input.defaultLanguage } : {}),
        ...(input.platformFeeBps !== undefined
          ? { platformFeeBps: Math.max(0, Math.min(10000, input.platformFeeBps)) }
          : {}),
        ...(input.customDomain !== undefined ? { customDomain: input.customDomain } : {}),
      },
    });
    revalidatePath("/settings");
    return { status: 200 as const, company: updated };
  } catch (error) {
    console.error("[updateCompany]", error);
    return { status: 500 as const, message: "No se pudo actualizar" };
  }
}
//#endregion
