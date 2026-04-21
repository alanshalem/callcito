//#region Imports
import { getCurrentCompany } from "@/actions/company";
import { getDictionary } from "@/i18n";
import { redirect } from "next/navigation";
import CompanySettingsForm from "./_components/CompanySettingsForm";
//#endregion

export const dynamic = "force-dynamic";

//#region Company Settings Page
export default async function CompanySettingsPage() {
  const company = await getCurrentCompany();
  if (!company) redirect("/onboarding/company");

  const t = await getDictionary();

  return (
    <div className="w-full h-full mt-8 px-6 md:px-8 lg:px-10 xl:px-12">
      <h1 className="text-primary font-semibold text-4xl mb-2">{t.settings.company.title}</h1>
      <p className="text-muted-foreground mb-8">{t.settings.company.desc}</p>
      <div className="max-w-2xl">
        <CompanySettingsForm
          company={{
            name: company.name,
            logoUrl: company.logoUrl,
            defaultLanguage: company.defaultLanguage,
            customDomain: company.customDomain,
            slug: company.slug,
          }}
        />
      </div>
    </div>
  );
}
//#endregion
