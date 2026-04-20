//#region MercadoPago helpers
// Envuelve MP SDK v2 (`mercadopago`) con helpers tipados.
// Documentación:
//   Preference: https://www.mercadopago.com.ar/developers/es/reference/preferences
//   Preapproval: https://www.mercadopago.com.ar/developers/es/reference/subscriptions
//   Webhooks: https://www.mercadopago.com.ar/developers/es/docs/your-integrations/notifications/webhooks
//
// Nota: `mpClient()` usa MP_ACCESS_TOKEN (plataforma). Para marketplace se podría
// usar el mpAccessToken por Company — no implementado en MVP.

import { MercadoPagoConfig, PreApproval, Preference, Payment } from "mercadopago";
import crypto from "node:crypto";

export function mpClient(): MercadoPagoConfig {
  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) throw new Error("MP_ACCESS_TOKEN no configurada");
  return new MercadoPagoConfig({ accessToken: token });
}
//#endregion

//#region createPreference — checkout del comprador
export type PreferenceItem = {
  title: string;
  quantity: number;
  unit_price: number;
  currency_id?: string;
};

export async function createPreference(opts: {
  orderId: string;
  items: PreferenceItem[];
  currency: string;
  buyerEmail?: string;
  /** Comisión plataforma en unidades de moneda (no bps). Requiere MP Marketplace aprobado. */
  marketplaceFee?: number;
  successUrl: string;
  failureUrl: string;
  pendingUrl: string;
  notificationUrl: string;
}) {
  const client = mpClient();
  const pref = new Preference(client);

  return pref.create({
    body: {
      items: opts.items.map((i, idx) => ({
        id: `${opts.orderId}-${idx}`,
        title: i.title,
        quantity: i.quantity,
        unit_price: i.unit_price,
        currency_id: i.currency_id ?? opts.currency,
      })),
      payer: opts.buyerEmail ? { email: opts.buyerEmail } : undefined,
      external_reference: opts.orderId,
      back_urls: {
        success: opts.successUrl,
        failure: opts.failureUrl,
        pending: opts.pendingUrl,
      },
      notification_url: opts.notificationUrl,
      auto_return: "approved",
      ...(opts.marketplaceFee ? { marketplace_fee: opts.marketplaceFee } : {}),
    },
  });
}
//#endregion

//#region createPreapproval — suscripción SaaS
export async function createPreapproval(opts: {
  preapprovalPlanId: string;
  payerEmail: string;
  externalReference: string;
  backUrl: string;
}) {
  const client = mpClient();
  const pa = new PreApproval(client);

  return pa.create({
    body: {
      preapproval_plan_id: opts.preapprovalPlanId,
      payer_email: opts.payerEmail,
      external_reference: opts.externalReference,
      back_url: opts.backUrl,
      status: "authorized",
    },
  });
}

export async function getPreapproval(id: string) {
  return new PreApproval(mpClient()).get({ id });
}
//#endregion

//#region Payment lookup (webhook flow)
export async function getPayment(paymentId: string) {
  return new Payment(mpClient()).get({ id: paymentId });
}
//#endregion

//#region Webhook signature verification
// MP firma con HMAC-SHA256 sobre `id:<data.id>;request-id:<x-request-id>;ts:<ts>`.
// Secret: MP_WEBHOOK_SECRET (configurado en el panel de webhook de MP).
export function verifyMpSignature(opts: {
  xSignature: string | null;
  xRequestId: string | null;
  dataId: string | null;
}): boolean {
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret) return true; // dev-friendly
  if (!opts.xSignature || !opts.dataId) return false;

  // header: "ts=1234,v1=abc"
  const parts = Object.fromEntries(
    opts.xSignature.split(",").map((p) => {
      const [k, v] = p.split("=");
      return [k.trim(), v?.trim() ?? ""];
    })
  );
  const ts = parts.ts;
  const v1 = parts.v1;
  if (!ts || !v1) return false;

  const manifest = `id:${opts.dataId};request-id:${opts.xRequestId ?? ""};ts:${ts};`;
  const expected = crypto.createHmac("sha256", secret).update(manifest).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(v1));
}
//#endregion
