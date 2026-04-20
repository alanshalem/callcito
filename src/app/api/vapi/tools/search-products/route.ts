//#region Imports
import { searchProducts } from "@/actions/product";
import { prismaClient } from "@/lib/prismaClient";
import { parseToolRequest, toolError, toolResult, verifyVapiSecret } from "@/lib/vapi-tool-helpers";
//#endregion

//#region POST — search_products
export async function POST(req: Request) {
  if (!verifyVapiSecret(req)) return toolError("Unauthorized", 401);

  const { toolCall, args, callId } = await parseToolRequest(req);

  const conversation = callId
    ? await prismaClient.conversation.findUnique({ where: { vapiCallId: callId } })
    : null;
  if (!conversation) return toolResult(toolCall?.id, "No hay catálogo activo para esta conversación.");

  const products = await searchProducts(
    conversation.catalogId,
    String(args.query ?? ""),
    { maxPrice: typeof args.maxPrice === "number" ? args.maxPrice : undefined }
  );

  if (products.length === 0) {
    return toolResult(toolCall?.id, "Sin resultados. Probá con otras palabras.");
  }

  return toolResult(
    toolCall?.id,
    products.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      price: Number(p.price),
      currency: p.currency,
      stock: p.stock,
    }))
  );
}
//#endregion
