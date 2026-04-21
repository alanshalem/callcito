//#region Imports
import { adminGetCompanies } from "@/actions/admin";
import FeeEditor from "./_components/FeeEditor";
//#endregion

export const dynamic = "force-dynamic";

//#region Admin Companies
export default async function AdminCompaniesPage() {
  const companies = await adminGetCompanies();

  return (
    <div className="p-8">
      <h1 className="text-3xl font-semibold mb-2">Companies</h1>
      <p className="text-muted-foreground mb-6 text-sm">
        Comisión plataforma (bps) = fee que callcito cobra por cada venta del seller. 100 bps = 1%.
      </p>
      <div className="border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary">
            <tr>
              <th className="text-left p-3">Nombre</th>
              <th className="text-left p-3">Slug</th>
              <th className="text-left p-3">País</th>
              <th className="text-center p-3">Plan</th>
              <th className="text-right p-3">Members</th>
              <th className="text-right p-3">Catálogos</th>
              <th className="text-right p-3">Asistentes</th>
              <th className="text-center p-3">Fee bps</th>
              <th className="text-left p-3">Creado</th>
            </tr>
          </thead>
          <tbody>
            {companies.map((c) => (
              <tr key={c.id} className="border-t border-border">
                <td className="p-3 font-medium">{c.name}</td>
                <td className="p-3 text-xs text-muted-foreground">{c.slug}</td>
                <td className="p-3">{c.country}</td>
                <td className="p-3 text-center text-xs">
                  {c.subscription?.plan.name ?? "Free"}
                </td>
                <td className="p-3 text-right tabular-nums">{c._count.memberships}</td>
                <td className="p-3 text-right tabular-nums">{c._count.catalogs}</td>
                <td className="p-3 text-right tabular-nums">{c._count.assistants}</td>
                <td className="p-3 text-center">
                  <FeeEditor companyId={c.id} initial={c.platformFeeBps} />
                </td>
                <td className="p-3 whitespace-nowrap text-xs text-muted-foreground">
                  {new Date(c.createdAt).toLocaleDateString()}
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
