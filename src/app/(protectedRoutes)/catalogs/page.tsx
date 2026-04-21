//#region Imports
import { getCatalogsByCompany } from "@/actions/catalog";
import { getCurrentCompany } from "@/actions/company";
import { Button } from "@/components/ui/button";
import { getDictionary } from "@/i18n";
import { Package, Plus } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import CatalogListCard from "./_components/CatalogListCard";
//#endregion

export const dynamic = "force-dynamic";

//#region Catalogs List
export default async function CatalogsPage() {
  const company = await getCurrentCompany();
  if (!company) redirect("/onboarding/company");

  const [t, catalogs] = await Promise.all([getDictionary(), getCatalogsByCompany()]);

  return (
    <div className="w-full h-full mt-8 px-6 md:px-8 lg:px-10 xl:px-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-primary font-semibold text-4xl">{t.catalogs.title}</h1>
          <p className="text-muted-foreground">{t.catalogs.desc}</p>
        </div>
        <Button asChild>
          <Link href="/catalogs/new">
            <Plus className="w-4 h-4 mr-2" /> {t.catalogs.newBtn}
          </Link>
        </Button>
      </div>

      {catalogs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border border-dashed border-border rounded-xl">
          <Package className="w-12 h-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">{t.catalogs.empty}</p>
          <Button asChild>
            <Link href="/catalogs/new">{t.catalogs.firstCta}</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {catalogs.map((c) => (
            <CatalogListCard
              key={c.id}
              catalog={{
                id: c.id,
                name: c.name,
                description: c.description,
                isPublished: c.isPublished,
                productsCount: c._count.products,
                assistantName: c.assistant?.name ?? null,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
//#endregion
