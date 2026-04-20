//#region Imports
import { prismaClient } from "@/lib/prismaClient";
import { parseToolRequest, toolError, toolResult, verifyVapiSecret } from "@/lib/vapi-tool-helpers";
//#endregion

//#region POST — add_to_cart
// Agrega producto al carrito de la Conversation actual.
// Si el producto ya estaba, incrementa qty.
export async function POST(req: Request) {
  if (!verifyVapiSecret(req)) return toolError("Unauthorized", 401);
  const { toolCall, args, callId } = await parseToolRequest(req);

  const productId = String(args.productId ?? "");
  const quantity = Number(args.quantity ?? 1);
  if (!productId) return toolResult(toolCall?.id, "Falta productId");
  if (!callId) return toolResult(toolCall?.id, "Conversación inválida");

  const conversation = await prismaClient.conversation.findUnique({ where: { vapiCallId: callId } });
  if (!conversation) return toolResult(toolCall?.id, "Conversación no encontrada");

  const product = await prismaClient.product.findUnique({ where: { id: productId } });
  if (!product) return toolResult(toolCall?.id, "Producto no encontrado");
  if (product.catalogId !== conversation.catalogId) {
    return toolResult(toolCall?.id, "Producto fuera del catálogo activo");
  }

  const cart = await prismaClient.cart.upsert({
    where: { conversationId: conversation.id },
    create: { conversationId: conversation.id },
    update: {},
  });

  const existing = await prismaClient.cartItem.findFirst({
    where: { cartId: cart.id, productId },
  });

  if (existing) {
    await prismaClient.cartItem.update({
      where: { id: existing.id },
      data: { quantity: existing.quantity + quantity },
    });
  } else {
    await prismaClient.cartItem.create({
      data: { cartId: cart.id, productId, quantity, priceSnap: product.price },
    });
  }

  return toolResult(toolCall?.id, `Agregado ${quantity}× ${product.name} al carrito.`);
}
//#endregion
