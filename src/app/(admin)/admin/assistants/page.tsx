//#region Imports
import { adminGetAssistants } from "@/actions/admin";
//#endregion

export const dynamic = "force-dynamic";

//#region Admin Assistants
export default async function AdminAssistantsPage() {
  const assistants = await adminGetAssistants();

  return (
    <div className="p-8">
      <h1 className="text-3xl font-semibold mb-6">Assistants</h1>
      <div className="border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary">
            <tr>
              <th className="text-left p-3">Nombre</th>
              <th className="text-left p-3">Company</th>
              <th className="text-left p-3">Idioma</th>
              <th className="text-center p-3">Vapi sync</th>
              <th className="text-right p-3">Catálogos</th>
              <th className="text-right p-3">Conversaciones</th>
            </tr>
          </thead>
          <tbody>
            {assistants.map((a) => (
              <tr key={a.id} className="border-t border-border">
                <td className="p-3 font-medium">{a.name}</td>
                <td className="p-3">{a.company.name}</td>
                <td className="p-3">{a.language}</td>
                <td className="p-3 text-center">
                  {a.vapiAssistantId ? (
                    <span className="text-xs text-green-500">✓</span>
                  ) : (
                    <span className="text-xs text-amber-500">no sync</span>
                  )}
                </td>
                <td className="p-3 text-right tabular-nums">{a._count.catalogs}</td>
                <td className="p-3 text-right tabular-nums">{a._count.conversations}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
//#endregion
