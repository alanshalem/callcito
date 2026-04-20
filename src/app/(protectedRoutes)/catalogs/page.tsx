//#region Imports
import { getCatalogsByCompany } from "@/actions/catalog";
import { getCurrentCompany } from "@/actions/company";
import { Button } from "@/components/ui/button";
import { getDictionary } from "@/i18n";
import { Package, Plus } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
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
            <Link
              key={c.id}
              href={`/catalogs/${c.id}`}
              className="p-6 rounded-xl border border-border hover:bg-secondary transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-lg text-primary">{c.name}</h3>
                <span
                  className={`text-xs px-2 py-1 rounded-md ${
                    c.isPublished
                      ? "bg-green-500/10 text-green-500"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {c.isPublished ? t.common.published : t.common.draft}
                </span>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                {c.description || "—"}
              </p>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>
                  {c._count.products} {t.catalogs.productsCount}
                </span>
                {c.assistant && <span>• {c.assistant.name}</span>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
//#endregion
