//#region Imports
import { getCurrentCompany } from "@/actions/company";
import { getOrdersForCompany } from "@/actions/order";
import { Button } from "@/components/ui/button";
import { getDictionary } from "@/i18n";
import { Download } from "lucide-react";
import { redirect } from "next/navigation";
//#endregion

export const dynamic = "force-dynamic";

//#region Orders List
export default async function OrdersPage() {
  const company = await getCurrentCompany();
  if (!company) redirect("/onboarding/company");

  const [t, orders] = await Promise.all([getDictionary(), getOrdersForCompany({ limit: 100 })]);

  return (
    <div className="w-full h-full mt-8 px-6 md:px-8 lg:px-10 xl:px-12">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-primary font-semibold text-4xl mb-2">{t.orders.title}</h1>
          <p className="text-muted-foreground">{t.orders.desc}</p>
        </div>
        <Button variant="outline" asChild>
          <a href="/api/orders/export" download>
            <Download className="w-4 h-4 mr-2" /> {t.orders.exportCsv}
          </a>
        </Button>
      </div>

      {orders.length === 0 ? (
        <div className="p-12 border border-dashed rounded-xl text-center text-muted-foreground">
          {t.orders.empty}
        </div>
      ) : (
        <div className="overflow-x-auto border border-border rounded-xl">
          <table className="w-full text-sm">
            <thead className="bg-secondary">
              <tr>
                <th className="text-left p-3">{t.orders.cols.date}</th>
                <th className="text-left p-3">{t.orders.cols.customer}</th>
                <th className="text-right p-3">{t.orders.cols.total}</th>
                <th className="text-center p-3">{t.orders.cols.status}</th>
                <th className="text-left p-3">{t.orders.cols.items}</th>
                <th className="text-left p-3">{t.orders.cols.mpPayment}</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-t border-border">
                  <td className="p-3 whitespace-nowrap">{new Date(o.createdAt).toLocaleString()}</td>
                  <td className="p-3">{o.customerEmail ?? "—"}</td>
                  <td className="p-3 text-right tabular-nums">
                    {o.currency} {Number(o.totalAmount).toLocaleString()}
                  </td>
                  <td className="p-3 text-center">
                    <StatusBadge status={o.status} />
                  </td>
                  <td className="p-3">
                    {o.cart.items.map((i) => `${i.quantity}× ${i.product.name}`).join(", ")}
                  </td>
                  <td className="p-3 text-xs text-muted-foreground">{o.mpPaymentId ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
//#endregion

//#region StatusBadge
function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    APPROVED: "bg-green-500/10 text-green-500",
    REJECTED: "bg-red-500/10 text-red-500",
    PENDING: "bg-amber-500/10 text-amber-500",
    REFUNDED: "bg-blue-500/10 text-blue-500",
    CANCELLED: "bg-muted text-muted-foreground",
  };
  return (
    <span className={`text-xs px-2 py-1 rounded-md ${colors[status] ?? "bg-muted"}`}>{status}</span>
  );
}
//#endregion
