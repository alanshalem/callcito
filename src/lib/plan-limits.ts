//#region Plan Limits Enforcement
// Helpers que chequean antes de crear entidades (catalog, product, assistant)
// si la Company todavía tiene cupo en su plan.
// Admins (User.isAdmin) bypasean TODOS los límites — útil para demos + debug.

import { auth } from "@clerk/nextjs/server";
import { prismaClient } from "./prismaClient";

type LimitResult =
  | { allowed: true }
  | { allowed: false; reason: string; planTier: string };

// Default FREE hardcoded — si seed no corrió, estos límites rigen.
const FALLBACK_FREE = {
  tier: "FREE" as const,
  name: "Free",
  maxCatalogs: 1,
  maxProducts: 50,
  maxAssistants: 1,
  maxConversations: 50,
};

//#region isCurrentUserAdmin — bypass check
// Lee user actual de Clerk + DB. Caché por request vía memo en closure no es
// trivial en server actions, pero el overhead (1 query) es aceptable.
async function isCurrentUserAdmin(): Promise<boolean> {
  try {
    const { userId } = await auth();
    if (!userId) return false;
    const user = await prismaClient.user.findUnique({
      where: { clerkId: userId },
      select: { isAdmin: true },
    });
    return !!user?.isAdmin;
  } catch {
    return false;
  }
}
//#endregion

async function getActivePlan(companyId: string) {
  const sub = await prismaClient.subscription.findUnique({
    where: { companyId },
    include: { plan: true },
  });
  if (sub?.status === "ACTIVE") return sub.plan;
  const free = await prismaClient.plan.findUnique({ where: { tier: "FREE" } });
  return free ?? FALLBACK_FREE;
}

export async function canCreateCatalog(companyId: string): Promise<LimitResult> {
  if (await isCurrentUserAdmin()) return { allowed: true };
  const plan = await getActivePlan(companyId);
  const count = await prismaClient.catalog.count({ where: { companyId } });
  if (count >= plan.maxCatalogs) {
    return {
      allowed: false,
      reason: `Alcanzaste el límite de ${plan.maxCatalogs} catálogos del plan ${plan.name}.`,
      planTier: plan.tier,
    };
  }
  return { allowed: true };
}

export async function canCreateProduct(companyId: string, quantity = 1): Promise<LimitResult> {
  if (await isCurrentUserAdmin()) return { allowed: true };
  const plan = await getActivePlan(companyId);
  const count = await prismaClient.product.count({
    where: { catalog: { companyId } },
  });
  if (count + quantity > plan.maxProducts) {
    return {
      allowed: false,
      reason: `Alcanzaste el límite de ${plan.maxProducts} productos del plan ${plan.name}.`,
      planTier: plan.tier,
    };
  }
  return { allowed: true };
}

export async function canCreateAssistant(companyId: string): Promise<LimitResult> {
  if (await isCurrentUserAdmin()) return { allowed: true };
  const plan = await getActivePlan(companyId);
  const count = await prismaClient.assistant.count({ where: { companyId } });
  if (count >= plan.maxAssistants) {
    return {
      allowed: false,
      reason: `Alcanzaste el límite de ${plan.maxAssistants} asistentes del plan ${plan.name}.`,
      planTier: plan.tier,
    };
  }
  return { allowed: true };
}

export async function canStartConversation(companyId: string): Promise<LimitResult> {
  if (await isCurrentUserAdmin()) return { allowed: true };
  const plan = await getActivePlan(companyId);

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const count = await prismaClient.conversation.count({
    where: {
      assistant: { companyId },
      startedAt: { gte: monthStart },
    },
  });
  if (count >= plan.maxConversations) {
    return {
      allowed: false,
      reason: `Alcanzaste el límite de ${plan.maxConversations} conversaciones/mes del plan ${plan.name}.`,
      planTier: plan.tier,
    };
  }
  return { allowed: true };
}
//#endregion
