//#region Imports
import { adminGetConversations } from "@/actions/admin";
//#endregion

export const dynamic = "force-dynamic";

//#region Admin Conversations
export default async function AdminConversationsPage() {
  const convs = await adminGetConversations();

  return (
    <div className="p-8">
      <h1 className="text-3xl font-semibold mb-6">Conversations</h1>
      <div className="border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary">
            <tr>
              <th className="text-left p-3">Fecha</th>
              <th className="text-left p-3">Company</th>
              <th className="text-left p-3">Assistant</th>
              <th className="text-center p-3">Status</th>
              <th className="text-right p-3">Duración</th>
              <th className="text-center p-3">Orden</th>
            </tr>
          </thead>
          <tbody>
            {convs.map((c) => (
              <tr key={c.id} className="border-t border-border">
                <td className="p-3 whitespace-nowrap text-xs">
                  {new Date(c.startedAt).toLocaleString()}
                </td>
                <td className="p-3">{c.assistant.company.name}</td>
                <td className="p-3">{c.assistant.name}</td>
                <td className="p-3 text-center">
                  <span className="text-xs">{c.status}</span>
                </td>
                <td className="p-3 text-right tabular-nums">
                  {c.durationSec
                    ? `${Math.floor(c.durationSec / 60)}:${String(c.durationSec % 60).padStart(2, "0")}`
                    : "—"}
                </td>
                <td className="p-3 text-center text-xs">
                  {c.cart?.order?.status ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
//#endregion
