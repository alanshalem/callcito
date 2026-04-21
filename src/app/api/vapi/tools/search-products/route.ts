//#region Imports
import { searchProducts } from "@/actions/product";
import { currencyWord } from "@/lib/currency-words";
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

  const query = String(args.query ?? "").trim();

  // Fallback: si el LLM llama sin query, devolvemos categorías distinct
  // (primera palabra del name) para que sepa qué tipos existen y vuelva a
  // llamar con término real.
  if (!query) {
    const all = await prismaClient.product.findMany({
      where: { catalogId: conversation.catalogId, isActive: true },
      select: { name: true },
      take: 500,
    });
    const categories = Array.from(
      new Set(all.map((p) => p.name.split(/\s+/)[0]).filter(Boolean))
    ).sort();
    return toolResult(toolCall?.id, {
      hint: "Llamá search_products otra vez con query igual al tipo de producto que pidió el cliente.",
      availableCategories: categories,
      totalProducts: all.length,
    });
  }

  const products = await searchProducts(
    conversation.catalogId,
    query,
    { maxPrice: typeof args.maxPrice === "number" ? args.maxPrice : undefined }
  );

  if (products.length === 0) {
    return toolResult(toolCall?.id, `Sin resultados para "${query}". Probá con otras palabras o sinónimos.`);
  }

  return toolResult(
    toolCall?.id,
    products.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      price: Number(p.price),
      currency: currencyWord(p.currency),
      stock: p.stock,
      images: p.images,
    }))
  );
}
//#endregion
