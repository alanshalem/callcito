//#region Imports
import { getOrdersForCompany } from "@/actions/order";
import { getCurrentCompany } from "@/actions/company";
import XLSX from "@/lib/xlsx-parser";
//#endregion

//#region GET /api/orders/export → CSV
// Descarga todas las órdenes de la Company activa.
export async function GET() {
  const company = await getCurrentCompany();
  if (!company) return new Response("Unauthorized", { status: 401 });

  const orders = await getOrdersForCompany({ limit: 10000 });

  const header = [
    "orderId", "createdAt", "status", "customerEmail", "currency", "totalAmount",
    "mpPaymentId", "mpPreferenceId", "items",
  ];
  const rows = orders.map((o) => [
    o.id,
    o.createdAt.toISOString(),
    o.status,
    o.customerEmail ?? "",
    o.currency,
    Number(o.totalAmount),
    o.mpPaymentId ?? "",
    o.mpPreferenceId ?? "",
    o.cart.items.map((i) => `${i.quantity}x ${i.product.name}`).join(" | "),
  ]);

  const csv = XLSX.csv.stringify([header, ...rows], { bom: true });
  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="orders-${Date.now()}.csv"`,
    },
  });
}
//#endregion
