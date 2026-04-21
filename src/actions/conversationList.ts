"use server";

//#region Imports
import { prismaClient } from "@/lib/prismaClient";
import { getCurrentCompany } from "./company";
//#endregion

//#region getConversationsForCompany
// Lista conversations reales (vapiCallId seteado) con cart + transcript summary.
export async function getConversationsForCompany(opts?: { limit?: number }) {
  const company = await getCurrentCompany();
  if (!company) return [];
  return prismaClient.conversation.findMany({
    where: {
      assistant: { companyId: company.id },
      vapiCallId: { not: null },
    },
    include: {
      assistant: { select: { name: true } },
      cart: {
        include: {
          items: { include: { product: { select: { name: true } } } },
          order: { select: { status: true, mpCheckoutUrl: true } },
        },
      },
    },
    orderBy: { startedAt: "desc" },
    take: opts?.limit ?? 100,
  });
}
//#endregion

//#region getConversationById
export async function getConversationById(id: string) {
  const company = await getCurrentCompany();
  if (!company) return null;
  return prismaClient.conversation.findFirst({
    where: { id, assistant: { companyId: company.id } },
    include: {
      assistant: { select: { name: true } },
      cart: {
        include: {
          items: { include: { product: true } },
          order: true,
        },
      },
    },
  });
}
//#endregion
