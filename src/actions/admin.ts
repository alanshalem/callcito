"use server";

//#region Imports
import { prismaClient } from "@/lib/prismaClient";
import { auth } from "@clerk/nextjs/server";
//#endregion

//#region requireAdmin
// Server-only guard. Devuelve el User admin o null.
// Úsalo en todas las server actions/pages del área /admin.
export async function requireAdmin() {
  const { userId } = await auth();
  if (!userId) return null;
  const user = await prismaClient.user.findUnique({ where: { clerkId: userId } });
  if (!user?.isAdmin) return null;
  return user;
}
//#endregion

//#region getAllUsers (admin)
export async function adminGetUsers() {
  const admin = await requireAdmin();
  if (!admin) return [];
  return prismaClient.user.findMany({
    include: {
      memberships: { include: { company: { select: { id: true, name: true, slug: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });
}
//#endregion

//#region getAllCompanies (admin)
export async function adminGetCompanies() {
  const admin = await requireAdmin();
  if (!admin) return [];
  return prismaClient.company.findMany({
    include: {
      subscription: { include: { plan: true } },
      _count: {
        select: {
          catalogs: true,
          assistants: true,
          memberships: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}
//#endregion

//#region getAllAssistants (admin)
export async function adminGetAssistants() {
  const admin = await requireAdmin();
  if (!admin) return [];
  return prismaClient.assistant.findMany({
    include: {
      company: { select: { id: true, name: true, slug: true } },
      _count: { select: { conversations: true, catalogs: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}
//#endregion

//#region getAllConversations (admin)
export async function adminGetConversations() {
  const admin = await requireAdmin();
  if (!admin) return [];
  return prismaClient.conversation.findMany({
    where: { vapiCallId: { not: null } },
    include: {
      assistant: { include: { company: { select: { name: true, slug: true } } } },
      cart: { include: { order: true } },
    },
    orderBy: { startedAt: "desc" },
    take: 200,
  });
}
//#endregion

//#region getPlatformMetrics
export async function adminGetMetrics() {
  const admin = await requireAdmin();
  if (!admin) return null;

  const [userCount, companyCount, assistantCount, catalogCount, productCount, conversationCount, orderCount, revenueRow] =
    await Promise.all([
      prismaClient.user.count(),
      prismaClient.company.count(),
      prismaClient.assistant.count(),
      prismaClient.catalog.count(),
      prismaClient.product.count(),
      prismaClient.conversation.count({ where: { vapiCallId: { not: null } } }),
      prismaClient.order.count({ where: { status: "APPROVED" } }),
      prismaClient.order.aggregate({
        _sum: { totalAmount: true },
        where: { status: "APPROVED" },
      }),
    ]);

  return {
    users: userCount,
    companies: companyCount,
    assistants: assistantCount,
    catalogs: catalogCount,
    products: productCount,
    conversations: conversationCount,
    ordersApproved: orderCount,
    revenue: Number(revenueRow._sum.totalAmount ?? 0),
  };
}
//#endregion

//#region setCompanyFee (admin)
// Solo platform admin puede setear comisión de cada Company.
export async function setCompanyFee(companyId: string, feeBps: number) {
  const admin = await requireAdmin();
  if (!admin) return { status: 403 as const };
  const clamped = Math.max(0, Math.min(10000, Math.floor(feeBps)));
  await prismaClient.company.update({
    where: { id: companyId },
    data: { platformFeeBps: clamped },
  });
  return { status: 200 as const, feeBps: clamped };
}
//#endregion

//#region toggleUserAdmin (admin)
export async function toggleUserAdmin(userId: string) {
  const admin = await requireAdmin();
  if (!admin) return { status: 403 as const };
  if (admin.id === userId) {
    return { status: 400 as const, message: "No podés cambiar tu propio rol" };
  }
  const target = await prismaClient.user.findUnique({ where: { id: userId } });
  if (!target) return { status: 404 as const };
  await prismaClient.user.update({
    where: { id: userId },
    data: { isAdmin: !target.isAdmin },
  });
  return { status: 200 as const };
}
//#endregion
