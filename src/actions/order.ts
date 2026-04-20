"use server";

//#region Imports
import { prismaClient } from "@/lib/prismaClient";
import { getCurrentCompany } from "./company";
//#endregion

//#region getOrdersForCompany — listado vendedor
export async function getOrdersForCompany(opts?: { limit?: number; offset?: number }) {
  const company = await getCurrentCompany();
  if (!company) return [];

  // Orders de Carts de Conversations de Assistants de la company.
  return prismaClient.order.findMany({
    where: {
      cart: {
        conversation: {
          assistant: { companyId: company.id },
        },
      },
    },
    include: {
      cart: {
        include: {
          items: { include: { product: true } },
          conversation: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: opts?.limit ?? 50,
    skip: opts?.offset,
  });
}
//#endregion

//#region getOrderById (público — compradores al volver de MP)
export async function getOrderById(id: string) {
  return prismaClient.order.findUnique({
    where: { id },
    include: { cart: { include: { items: { include: { product: true } } } } },
  });
}
//#endregion
