/**
 * Seed de la tabla Plan.
 * Ejecutar: `npx tsx scripts/seed-plans.ts`
 *
 * Crea los 4 planes (FREE / STARTER / PRO / ENTERPRISE) con límites y precios.
 * `mpPlanId` queda null — llenar manualmente después de crear los Preapproval Plans
 * en el dashboard de MercadoPago.
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL }),
});

const PLANS = [
  {
    tier: "FREE" as const,
    name: "Free",
    priceArs: 0,
    maxCatalogs: 1,
    maxProducts: 50,
    maxAssistants: 1,
    maxConversations: 50,
    features: { voiceClone: false, customDomain: false, csvExport: false, analytics: false },
  },
  {
    tier: "STARTER" as const,
    name: "Starter",
    priceArs: 19900,
    maxCatalogs: 3,
    maxProducts: 500,
    maxAssistants: 2,
    maxConversations: 300,
    features: { voiceClone: false, customDomain: false, csvExport: true, analytics: true },
  },
  {
    tier: "PRO" as const,
    name: "Pro",
    priceArs: 59900,
    maxCatalogs: 10,
    maxProducts: 5000,
    maxAssistants: 5,
    maxConversations: 1500,
    features: { voiceClone: true, customDomain: true, csvExport: true, analytics: true },
  },
  {
    tier: "ENTERPRISE" as const,
    name: "Enterprise",
    priceArs: 0,
    maxCatalogs: 999999,
    maxProducts: 999999,
    maxAssistants: 999999,
    maxConversations: 999999,
    features: { voiceClone: true, customDomain: true, csvExport: true, analytics: true, sla: true },
  },
];

async function main() {
  for (const p of PLANS) {
    const res = await prisma.plan.upsert({
      where: { tier: p.tier },
      create: p,
      update: {
        name: p.name,
        priceArs: p.priceArs,
        maxCatalogs: p.maxCatalogs,
        maxProducts: p.maxProducts,
        maxAssistants: p.maxAssistants,
        maxConversations: p.maxConversations,
        features: p.features,
      },
    });
    console.log(`✓ ${res.tier} · ARS ${res.priceArs}`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
