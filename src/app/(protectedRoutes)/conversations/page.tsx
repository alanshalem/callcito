//#region Imports
import { getCurrentCompany } from "@/actions/company";
import { getConversationsForCompany } from "@/actions/conversationList";
import { redirect } from "next/navigation";
import Link from "next/link";
import { MessagesSquare } from "lucide-react";
//#endregion

export const dynamic = "force-dynamic";

//#region Conversations List
export default async function ConversationsPage() {
  const company = await getCurrentCompany();
  if (!company) redirect("/onboarding/company");
  const conversations = await getConversationsForCompany({ limit: 200 });

  return (
    <div className="w-full h-full mt-8 px-6 md:px-8 lg:px-10 xl:px-12">
      <h1 className="text-primary font-semibold text-4xl mb-2">Conversaciones</h1>
      <p className="text-muted-foreground mb-8">
        Historial de calls con el asistente. Click para ver transcripción.
      </p>

      {conversations.length === 0 ? (
        <div className="p-12 border border-dashed rounded-xl text-center text-muted-foreground">
          <MessagesSquare className="w-10 h-10 mx-auto mb-3" />
          Todavía no hay conversaciones.
        </div>
      ) : (
        <div className="border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-secondary">
              <tr>
                <th className="text-left p-3">Fecha</th>
                <th className="text-left p-3">Asistente</th>
                <th className="text-center p-3">Estado</th>
                <th className="text-right p-3">Duración</th>
                <th className="text-center p-3">Variant</th>
                <th className="text-left p-3">Items carrito</th>
                <th className="text-center p-3">Orden</th>
              </tr>
            </thead>
            <tbody>
              {conversations.map((c) => (
                <tr key={c.id} className="border-t border-border hover:bg-secondary/30">
                  <td className="p-3 whitespace-nowrap">
                    <Link href={`/conversations/${c.id}`} className="text-primary hover:underline">
                      {new Date(c.startedAt).toLocaleString()}
                    </Link>
                  </td>
                  <td className="p-3">{c.assistant.name}</td>
                  <td className="p-3 text-center">
                    <span
                      className={`text-xs px-2 py-1 rounded-md ${
                        c.status === "ENDED"
                          ? "bg-green-500/10 text-green-500"
                          : c.status === "ACTIVE"
                            ? "bg-amber-500/10 text-amber-500"
                            : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td className="p-3 text-right tabular-nums">
                    {c.durationSec ? `${Math.floor(c.durationSec / 60)}:${String(c.durationSec % 60).padStart(2, "0")}` : "—"}
                  </td>
                  <td className="p-3 text-center text-xs text-muted-foreground">
                    {c.promptVariant ?? "—"}
                  </td>
                  <td className="p-3 text-xs">
                    {c.cart?.items.length
                      ? c.cart.items.map((i) => `${i.quantity}× ${i.product.name}`).join(", ")
                      : "—"}
                  </td>
                  <td className="p-3 text-center">
                    {c.cart?.order ? (
                      <span className="text-xs">{c.cart.order.status}</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
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
