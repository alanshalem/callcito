//#region Imports
import { getCurrentCompany } from "@/actions/company";
import { getDictionary } from "@/i18n";
import { redirect } from "next/navigation";
import CatalogForm from "../_components/CatalogForm";
//#endregion

//#region New Catalog Page
export default async function NewCatalogPage() {
  const company = await getCurrentCompany();
  if (!company) redirect("/onboarding/company");
  const t = await getDictionary();

  return (
    <div className="w-full h-full mt-8 px-6 md:px-8 lg:px-10 xl:px-12">
      <h1 className="text-primary font-semibold text-4xl mb-2">{t.catalogs.newTitle}</h1>
      <p className="text-muted-foreground mb-8">{t.catalogs.newDesc}</p>
      <div className="max-w-xl">
        <CatalogForm />
      </div>
    </div>
  );
}
//#endregion
