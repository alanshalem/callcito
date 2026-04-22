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

  console.log("[tool:search_products] args:", JSON.stringify(args), "callId:", callId);

  const conversation = callId
    ? await prismaClient.conversation.findUnique({ where: { vapiCallId: callId } })
    : null;
  if (!conversation) return toolResult(toolCall?.id, "No hay catálogo activo para esta conversación.");

  const query = String(args.query ?? "").trim();

  // Fallback cuando LLM llama con query vacío: devolver muestra real (2 por
  // categoría) en vez de solo nombres. gpt-4o-mini a veces ignora "volvé a
  // llamar con término"; con productos reales tiene data concreta para
  // narrar sin re-invocar.
  if (!query) {
    const all = await prismaClient.product.findMany({
      where: { catalogId: conversation.catalogId, isActive: true },
      orderBy: { name: "asc" },
      take: 500,
    });
    const byCategory = new Map<string, typeof all>();
    for (const p of all) {
      const cat = p.name.split(/\s+/)[0] ?? "Otros";
      const list = byCategory.get(cat) ?? [];
      if (list.length < 2) list.push(p);
      byCategory.set(cat, list);
    }
    const sample = Array.from(byCategory.values()).flat().slice(0, 30);
    console.log("[tool:search_products] empty-query fallback → sample:", sample.length, "products across", byCategory.size, "categories");
    // isFallback=true → client widget no spotlighta (evita mostrar productos random
    // que el usuario no pidió).
    return toolResult(toolCall?.id, {
      isFallback: true,
      hint: "Sample multi-categoría. Volvé a llamar con query específico al término que mencionó el cliente para obtener resultados relevantes.",
      products: sample.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        price: Number(p.price),
        currency: currencyWord(p.currency),
        stock: p.stock,
        images: p.images,
      })),
    });
  }

  const products = await searchProducts(
    conversation.catalogId,
    query,
    { maxPrice: typeof args.maxPrice === "number" ? args.maxPrice : undefined }
  );

  console.log("[tool:search_products]", query, "→", products.length, "results:", products.map((p) => p.name).slice(0, 5));

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
