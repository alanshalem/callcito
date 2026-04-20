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

  return toolResult(toolCall?.id, "Producto removido del carrito.");
}
//#endregion
