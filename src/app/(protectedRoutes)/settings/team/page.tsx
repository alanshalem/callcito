//#region Imports
import { getCurrentCompany } from "@/actions/company";
import { getDictionary } from "@/i18n";
import { getTheme } from "@/lib/preferences";
import { OrganizationProfile } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { redirect } from "next/navigation";
//#endregion

export const dynamic = "force-dynamic";

//#region Team Page
export default async function TeamPage() {
  const [company, theme, t] = await Promise.all([getCurrentCompany(), getTheme(), getDictionary()]);
  if (!company) redirect("/onboarding/company");

  return (
    <div className="w-full h-full mt-8 px-6 md:px-8 lg:px-10 xl:px-12">
      <h1 className="text-primary font-semibold text-4xl mb-2">{t.settings.team.title}</h1>
      <p className="text-muted-foreground mb-8">{t.settings.team.desc}</p>
      <div className="max-w-4xl">
        <OrganizationProfile
          routing="hash"
          appearance={{
            baseTheme: theme === "dark" ? dark : undefined,
            elements: {
              rootBox: "w-full",
              cardBox: "w-full shadow-none border border-border",
              footer: "hidden",
            },
            variables: {
              colorPrimary: "#a76ef6",
              borderRadius: "0.625rem",
              fontFamily: "var(--font-manrope)",
            },
          }}
        />
      </div>
    </div>
  );
}
//#endregion
