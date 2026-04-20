"use server";

//#region Imports
import { prismaClient } from "@/lib/prismaClient";
import { createPreapproval } from "@/lib/mercadopago";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getCurrentCompany } from "./company";
import type { PlanTier } from "@prisma/client";
//#endregion

//#region getPlans
export async function getPlans() {
  return prismaClient.plan.findMany({ orderBy: { priceArs: "asc" } });
}
//#endregion

//#region getCurrentPlan
export async function getCurrentPlan() {
  const company = await getCurrentCompany();
  if (!company) return null;
  const sub = await prismaClient.subscription.findUnique({
    where: { companyId: company.id },
    include: { plan: true },
  });
  if (sub) return sub;
  // default free plan si no hay subscription
  const free = await prismaClient.plan.findUnique({ where: { tier: "FREE" } });
  return free ? { plan: free, status: "ACTIVE" as const, currentPeriodEnd: null } : null;
}
//#endregion

//#region upgradeToPlan
// Crea Preapproval en MP y devuelve init_point para redirect.
// Webhook MP confirma y marca Subscription.status = ACTIVE.
export async function upgradeToPlan(tier: PlanTier) {
  const { userId } = await auth();
  if (!userId) return { status: 403 as const };

  const user = await currentUser();
  const email = user?.emailAddresses[0]?.emailAddress;
  if (!email) return { status: 400 as const, message: "Email no disponible" };

  const company = await getCurrentCompany();
  if (!company) return { status: 403 as const };

  const plan = await prismaClient.plan.findUnique({ where: { tier } });
  if (!plan) return { status: 404 as const, message: "Plan no existe" };
  if (plan.tier === "FREE") {
    // Transición a FREE = cancelar sub activa
    await prismaClient.subscription.upsert({
      where: { companyId: company.id },
      create: { companyId: company.id, planId: plan.id, status: "ACTIVE" },
      update: { planId: plan.id, status: "ACTIVE", mpPreapprovalId: null },
    });
    return { status: 200 as const, checkoutUrl: null };
  }

  if (!plan.mpPlanId) {
    return { status: 500 as const, message: "Plan sin mpPlanId configurado" };
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  try {
    const preapproval = await createPreapproval({
      preapprovalPlanId: plan.mpPlanId,
      payerEmail: email,
      externalReference: company.id,
      backUrl: `${baseUrl}/settings/billing`,
    });

    await prismaClient.subscription.upsert({
      where: { companyId: company.id },
      create: {
        companyId: company.id,
        planId: plan.id,
        mpPreapprovalId: preapproval.id,
        status: "PENDING",
      },
      update: {
        planId: plan.id,
        mpPreapprovalId: preapproval.id,
        status: "PENDING",
      },
    });

    return { status: 200 as const, checkoutUrl: preapproval.init_point };
  } catch (error) {
    console.error("[upgradeToPlan]", error);
    return { status: 500 as const, message: "No se pudo iniciar el upgrade" };
  }
}
//#endregion
