//#region Imports
import { prismaClient } from "@/lib/prismaClient";
import { parseToolRequest, toolError, toolResult, verifyVapiSecret } from "@/lib/vapi-tool-helpers";
//#endregion

//#region POST — remove_from_cart
export async function POST(req: Request) {
  if (!verifyVapiSecret(req)) return toolError("Unauthorized", 401);
  const { toolCall, args, callId } = await parseToolRequest(req);

  const productId = String(args.productId ?? "");
  if (!productId) return toolResult(toolCall?.id, "Falta productId");
  if (!callId) return toolResult(toolCall?.id, "Conversación inválida");

  const conversation = await prismaClient.conversation.findUnique({
    where: { vapiCallId: callId },
    include: { cart: true },
  });
  if (!conversation?.cart) return toolResult(toolCall?.id, "Carrito vacío");

  await prismaClient.cartItem.deleteMany({
    where: { cartId: conversation.cart.id, productId },
  });

  const items = await prismaClient.cartItem.findMany({
    where: { cartId: conversation.cart.id },
    include: { product: { select: { name: true, price: true } } },
  });
  const cartSummary = items.map((i) => `${i.quantity}× ${i.product.name}`);
  const cartTotalQty = items.reduce((a, i) => a + i.quantity, 0);
  const cartTotalPrice = items.reduce(
    (a, i) => a + Number(i.product.price) * i.quantity,
    0
  );

  return toolResult(toolCall?.id, {
    success: true,
    message: "Producto removido del carrito.",
    cart: cartSummary,
    cartTotalItems: cartTotalQty,
    cartTotalPrice,
  });
}
//#endregion
