//#region Imports
import { adminGetMetrics } from "@/actions/admin";
import { BarChart3, Bot, Building2, MessagesSquare, Package, ShoppingBag, Users } from "lucide-react";
//#endregion

export const dynamic = "force-dynamic";

//#region Admin Overview
export default async function AdminOverview() {
  const m = await adminGetMetrics();
  if (!m) return null;

  const cards = [
    { label: "Users", value: m.users, icon: Users },
    { label: "Companies", value: m.companies, icon: Building2 },
    { label: "Assistants", value: m.assistants, icon: Bot },
    { label: "Catalogs", value: m.catalogs, icon: Package },
    { label: "Products", value: m.products, icon: Package },
    { label: "Conversations", value: m.conversations, icon: MessagesSquare },
    { label: "Orders APPROVED", value: m.ordersApproved, icon: ShoppingBag },
    { label: "Revenue (ARS)", value: m.revenue.toLocaleString(), icon: BarChart3 },
  ];

  return (
    <div className="p-8">
      <h1 className="text-3xl font-semibold mb-2">Platform metrics</h1>
      <p className="text-muted-foreground mb-8">Global stats. Todas las companies / users.</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="p-4 rounded-xl border border-border">
            <c.icon className="w-4 h-4 text-muted-foreground mb-2" />
            <div className="text-3xl font-semibold tabular-nums">{c.value}</div>
            <div className="text-xs text-muted-foreground">{c.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
//#endregion
