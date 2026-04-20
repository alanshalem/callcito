//#region Imports
import { createPreference } from "@/lib/mercadopago";
import { prismaClient } from "@/lib/prismaClient";
import { parseToolRequest, toolError, toolResult, verifyVapiSecret } from "@/lib/vapi-tool-helpers";
//#endregion

//#region POST — checkout
// Genera Order + MP Preference a partir del Cart actual.
// Devuelve URL init_point para que el asistente la lea/comparta.
export async function POST(req: Request) {
  if (!verifyVapiSecret(req)) return toolError("Unauthorized", 401);
  const { toolCall, args, callId } = await parseToolRequest(req);

  if (!callId) return toolResult(toolCall?.id, "Conversación inválida");
  const customerEmail = String(args.customerEmail ?? "").trim();
  if (!customerEmail) return toolResult(toolCall?.id, "Falta email del cliente.");

  const conversation = await prismaClient.conversation.findUnique({
    where: { vapiCallId: callId },
    include: {
      cart: { include: { items: { include: { product: true } }, order: true } },
      assistant: { include: { company: true } },
    },
  });
  if (!conversation?.cart || conversation.cart.items.length === 0) {
    return toolResult(toolCall?.id, "El carrito está vacío.");
  }
  if (conversation.cart.order) {
    return toolResult(toolCall?.id, `Ya existe un pago generado: ${conversation.cart.order.mpCheckoutUrl}`);
  }

  const items = conversation.cart.items.map((i) => ({
    title: i.product.name,
    quantity: i.quantity,
    unit_price: Number(i.priceSnap),
  }));
  const total = items.reduce((a, i) => a + i.unit_price * i.quantity, 0);
  const currency = conversation.assistant.company.currency;

  // Crear Order primero (PENDING) para tener orderId como external_reference
  const order = await prismaClient.order.create({
    data: {
      cartId: conversation.cart.id,
      totalAmount: total,
      currency,
      status: "PENDING",
      customerEmail,
    },
  });

  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
    const companySlug = conversation.assistant.company.slug;
    const feeBps = conversation.assistant.company.platformFeeBps ?? 0;
    const marketplaceFee = feeBps > 0 ? +(total * feeBps / 10000).toFixed(2) : undefined;
    const pref = await createPreference({
      orderId: order.id,
      items,
      currency,
      buyerEmail: customerEmail,
      marketplaceFee,
      successUrl: `${baseUrl}/c/${companySlug}/order/${order.id}/success`,
      failureUrl: `${baseUrl}/c/${companySlug}/order/${order.id}/failure`,
      pendingUrl: `${baseUrl}/c/${companySlug}/order/${order.id}/pending`,
      notificationUrl: `${baseUrl}/api/webhooks/mercadopago`,
    });

    await prismaClient.order.update({
      where: { id: order.id },
      data: { mpPreferenceId: pref.id, mpCheckoutUrl: pref.init_point ?? null },
    });

    return toolResult(
      toolCall?.id,
      `Listo. Total ${currency} ${total}. Link de pago: ${pref.init_point}`
    );
  } catch (error) {
    console.error("[checkout tool]", error);
    return toolResult(toolCall?.id, "No pude generar el link. Intentá en unos minutos.");
  }
}
//#endregion
