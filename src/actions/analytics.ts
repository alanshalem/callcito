"use server";

//#region Imports
import { prismaClient } from "@/lib/prismaClient";
import { getCurrentCompany } from "./company";
//#endregion

//#region Month window helper
function startOfMonth(d = new Date()) {
  const m = new Date(d);
  m.setDate(1);
  m.setHours(0, 0, 0, 0);
  return m;
}
//#endregion

//#region getCompanyMetrics
// Métricas mensuales + tops para el dashboard.
export async function getCompanyMetrics() {
  const company = await getCurrentCompany();
  if (!company) return null;
  const since = startOfMonth();

  const [
    conversationsTotal,
    conversationsEnded,
    ordersApproved,
    revenueRow,
    topProducts,
    dailyRevenue,
    abBreakdown,
  ] = await Promise.all([
    // Solo conversaciones con call real iniciado (vapiCallId seteado).
    // Excluye rows huérfanas creadas por `startConversation` cuando Vapi rechazó.
    prismaClient.conversation.count({
      where: {
        assistant: { companyId: company.id },
        startedAt: { gte: since },
        vapiCallId: { not: null },
      },
    }),
    prismaClient.conversation.count({
      where: {
        assistant: { companyId: company.id },
        startedAt: { gte: since },
        status: "ENDED",
        vapiCallId: { not: null },
      },
    }),
    prismaClient.order.count({
      where: {
        status: "APPROVED",
        createdAt: { gte: since },
        cart: { conversation: { assistant: { companyId: company.id } } },
      },
    }),
    prismaClient.order.aggregate({
      _sum: { totalAmount: true },
      where: {
        status: "APPROVED",
        createdAt: { gte: since },
        cart: { conversation: { assistant: { companyId: company.id } } },
      },
    }),
    prismaClient.cartItem.groupBy({
      by: ["productId"],
      _sum: { quantity: true },
      where: {
        cart: {
          conversation: {
            assistant: { companyId: company.id },
            startedAt: { gte: since },
          },
          order: { status: "APPROVED" },
        },
      },
      orderBy: { _sum: { quantity: "desc" } },
      take: 10,
    }),
    prismaClient.$queryRaw<{ day: Date; total: number }[]>`
      SELECT
        date_trunc('day', o."createdAt") AS day,
        COALESCE(SUM(o."totalAmount"), 0)::float AS total
      FROM "Order" o
      JOIN "Cart" cart ON cart.id = o."cartId"
      JOIN "Conversation" c ON c.id = cart."conversationId"
      JOIN "Assistant" a ON a.id = c."assistantId"
      WHERE a."companyId" = ${company.id}::uuid
        AND o."createdAt" >= ${since}
        AND o.status = 'APPROVED'
      GROUP BY day
      ORDER BY day ASC
    `,
    prismaClient.conversation.groupBy({
      by: ["promptVariant"],
      _count: { _all: true },
      where: {
        assistant: { companyId: company.id },
        startedAt: { gte: since },
        promptVariant: { not: null },
      },
    }),
  ]);

  // Nombres de los top products (otro query → groupBy no aliasea fácil)
  const topProductIds = topProducts.map((p) => p.productId);
  const productRows = topProductIds.length
    ? await prismaClient.product.findMany({
        where: { id: { in: topProductIds } },
        select: { id: true, name: true, price: true, currency: true },
      })
    : [];
  const productMap = new Map(productRows.map((p) => [p.id, p]));
  const topProductsResolved = topProducts
    .map((p) => {
      const prod = productMap.get(p.productId);
      return prod
        ? {
            id: prod.id,
            name: prod.name,
            price: Number(prod.price),
            currency: prod.currency,
            unitsSold: p._sum.quantity ?? 0,
          }
        : null;
    })
    .filter((x): x is NonNullable<typeof x> => !!x);

  // A/B conversion: necesitaríamos cruzar con orders; simplificado: count por variant.
  const ab = {
    A: abBreakdown.find((r) => r.promptVariant === "A")?._count._all ?? 0,
    B: abBreakdown.find((r) => r.promptVariant === "B")?._count._all ?? 0,
  };

  return {
    month: since.toISOString(),
    conversationsTotal,
    conversationsEnded,
    ordersApproved,
    revenue: Number(revenueRow._sum.totalAmount ?? 0),
    conversionRate: conversationsTotal > 0 ? ordersApproved / conversationsTotal : 0,
    topProducts: topProductsResolved,
    dailyRevenue: dailyRevenue.map((r) => ({
      day: r.day.toISOString().slice(0, 10),
      total: Number(r.total),
    })),
    ab,
  };
}
//#endregion
