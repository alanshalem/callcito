//#region Imports
import { getPayment, getPreapproval, verifyMpSignature } from "@/lib/mercadopago";
import { prismaClient } from "@/lib/prismaClient";
//#endregion

//#region MP Webhook
// MP manda notificaciones tipo:
//   - payment: checkout pagado (buyer flow)
//   - preapproval: suscripción autorizada/pausada/cancelada (seller SaaS)
//   - subscription_authorized_payment: cobro recurrente
// Firma: header `x-signature` (HMAC-SHA256). `MP_WEBHOOK_SECRET` configurado en MP panel.
export async function POST(req: Request) {
  const url = new URL(req.url);
  const topic = url.searchParams.get("type") ?? url.searchParams.get("topic");
  const dataId = url.searchParams.get("data.id") ?? url.searchParams.get("id");

  const xSignature = req.headers.get("x-signature");
  const xRequestId = req.headers.get("x-request-id");

  if (!verifyMpSignature({ xSignature, xRequestId, dataId })) {
    return new Response("Invalid signature", { status: 400 });
  }

  try {
    if (topic === "payment" && dataId) {
      await handlePayment(dataId);
    } else if (topic === "preapproval" && dataId) {
      await handlePreapproval(dataId);
    }
    return new Response("ok");
  } catch (error) {
    console.error("[mp-webhook]", topic, dataId, error);
    return new Response("handler error", { status: 500 });
  }
}
//#endregion

//#region handlePayment
async function handlePayment(paymentId: string) {
  const payment = await getPayment(paymentId);
  const orderId = payment.external_reference;
  if (!orderId) return;

  const status = mapPaymentStatus(payment.status);
  await prismaClient.order.update({
    where: { id: orderId },
    data: {
      mpPaymentId: String(payment.id),
      status,
      payerInfo: payment.payer as never,
    },
  });

  // Descontar stock si APPROVED
  if (status === "APPROVED") {
    const items = await prismaClient.cartItem.findMany({
      where: { cart: { order: { id: orderId } } },
      include: { product: true },
    });
    for (const i of items) {
      if (i.product.stock !== null) {
        await prismaClient.product.update({
          where: { id: i.product.id },
          data: { stock: Math.max(0, i.product.stock - i.quantity) },
        });
      }
    }
  }
}

function mapPaymentStatus(s: string | undefined): "APPROVED" | "REJECTED" | "PENDING" | "REFUNDED" | "CANCELLED" {
  switch (s) {
    case "approved": return "APPROVED";
    case "rejected": return "REJECTED";
    case "refunded": return "REFUNDED";
    case "cancelled": return "CANCELLED";
    default: return "PENDING";
  }
}
//#endregion

//#region handlePreapproval
async function handlePreapproval(preapprovalId: string) {
  const pa = await getPreapproval(preapprovalId);
  const companyId = pa.external_reference;
  if (!companyId) return;

  const status = mapPreapprovalStatus(pa.status);
  const periodEnd = pa.next_payment_date ? new Date(pa.next_payment_date) : null;

  await prismaClient.subscription.updateMany({
    where: { companyId },
    data: { status, currentPeriodEnd: periodEnd },
  });
}

function mapPreapprovalStatus(s: string | undefined): "ACTIVE" | "PAUSED" | "CANCELLED" | "PENDING" {
  switch (s) {
    case "authorized": return "ACTIVE";
    case "paused": return "PAUSED";
    case "cancelled": return "CANCELLED";
    default: return "PENDING";
  }
}
//#endregion
