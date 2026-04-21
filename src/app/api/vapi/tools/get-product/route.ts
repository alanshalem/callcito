//#region Imports
import { currencyWord } from "@/lib/currency-words";
import { prismaClient } from "@/lib/prismaClient";
import { parseToolRequest, toolError, toolResult, verifyVapiSecret } from "@/lib/vapi-tool-helpers";
//#endregion

//#region POST — get_product
export async function POST(req: Request) {
  if (!verifyVapiSecret(req)) return toolError("Unauthorized", 401);
  const { toolCall, args } = await parseToolRequest(req);

  const productId = String(args.productId ?? "");
  if (!productId) return toolResult(toolCall?.id, "Falta productId");

  const product = await prismaClient.product.findUnique({ where: { id: productId } });
  if (!product) return toolResult(toolCall?.id, "Producto no encontrado");

  return toolResult(toolCall?.id, {
    id: product.id,
    name: product.name,
    description: product.description,
    price: Number(product.price),
    currency: currencyWord(product.currency),
    stock: product.stock,
    tags: product.tags,
  });
}
//#endregion
