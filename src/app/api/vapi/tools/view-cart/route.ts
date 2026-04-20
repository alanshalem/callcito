//#region Imports
import { prismaClient } from "@/lib/prismaClient";
import { parseToolRequest, toolError, toolResult, verifyVapiSecret } from "@/lib/vapi-tool-helpers";
//#endregion

//#region POST — view_cart
export async function POST(req: Request) {
  if (!verifyVapiSecret(req)) return toolError("Unauthorized", 401);
  const { toolCall, callId } = await parseToolRequest(req);
  if (!callId) return toolResult(toolCall?.id, "Conversación inválida");

  const conversation = await prismaClient.conversation.findUnique({
    where: { vapiCallId: callId },
    include: { cart: { include: { items: { include: { product: true } } } } },
  });
  if (!conversation?.cart || conversation.cart.items.length === 0) {
    return toolResult(toolCall?.id, "Carrito vacío");
  }

  const items = conversation.cart.items.map((i) => ({
    name: i.product.name,
    quantity: i.quantity,
    price: Number(i.priceSnap),
    subtotal: Number(i.priceSnap) * i.quantity,
  }));
  const total = items.reduce((acc, i) => acc + i.subtotal, 0);

  return toolResult(toolCall?.id, { items, total });
}
//#endregion
