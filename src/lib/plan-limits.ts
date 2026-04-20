//#region Plan Limits Enforcement
// Helpers que chequean antes de crear entidades (catalog, product, assistant)
// si la Company todavía tiene cupo en su plan.
// Uso: llamar antes de `prisma.<entity>.create` en los server actions.

import { prismaClient } from "./prismaClient";

type LimitResult =
  | { allowed: true }
  | { allowed: false; reason: string; planTier: string };

// Default "FREE" hardcoded — si el row no existe en DB (seed no corrió)
// devolvemos estos límites en lugar de bloquear con 402. Evita cortar el flujo
// de onboarding cuando el admin olvidó `npx tsx scripts/seed-plans.ts`.
const FALLBACK_FREE = {
  tier: "FREE" as const,
  name: "Free",
  maxCatalogs: 1,
  maxProducts: 50,
  maxAssistants: 1,
  maxConversations: 50,
};

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
  const plan = await getActivePlan(companyId);

  // Conversaciones del mes actual
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
