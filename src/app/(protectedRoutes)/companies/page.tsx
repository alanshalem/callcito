//#region Imports
import { getUserCompanies } from "@/actions/company";
import { getCurrentCompany } from "@/actions/company";
import { Button } from "@/components/ui/button";
import { auth } from "@clerk/nextjs/server";
import { Building2, Plus } from "lucide-react";
import { redirect } from "next/navigation";
import CompanyCard from "./_components/CompanyCard";
import CreateAnotherButton from "./_components/CreateAnotherButton";
//#endregion

export const dynamic = "force-dynamic";

//#region Companies List
// Lista todas las empresas del user con switch/edit/delete por fila.
// La Company "activa" (orgId en session) está destacada.
export default async function CompaniesPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const [memberships, current] = await Promise.all([
    getUserCompanies(),
    getCurrentCompany(),
  ]);

  return (
    <div className="w-full h-full mt-8 px-6 md:px-8 lg:px-10 xl:px-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-primary font-semibold text-4xl">Empresas</h1>
          <p className="text-muted-foreground">
            Gestioná las empresas donde sos miembro. Activá una para trabajar ahí.
          </p>
        </div>
        <CreateAnotherButton />
      </div>

      {memberships.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border border-dashed border-border rounded-xl">
          <Building2 className="w-12 h-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">Aún no creaste ninguna empresa</p>
          <Button asChild>
            <a href="/onboarding/company">
              <Plus className="w-4 h-4 mr-2" /> Crear primera empresa
            </a>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {memberships.map((m) => (
            <CompanyCard
              key={m.company.id}
              company={{
                id: m.company.id,
                clerkOrgId: m.company.clerkOrgId,
                name: m.company.name,
                slug: m.company.slug,
                logoUrl: m.company.logoUrl,
                country: m.company.country,
                currency: m.company.currency,
              }}
              role={m.role}
              isActive={current?.id === m.company.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
//#endregion
