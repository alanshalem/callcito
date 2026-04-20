//#region Imports
import { getCurrentCompany } from "@/actions/company";
import { getDictionary } from "@/i18n";
import { CreditCard, Settings as SettingsIcon, Users } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
//#endregion

//#region Settings Index
export default async function SettingsPage() {
  const company = await getCurrentCompany();
  if (!company) redirect("/onboarding/company");

  const t = await getDictionary();

  const sections = [
    { href: "/settings/billing", title: t.settings.sections.billing.title, desc: t.settings.sections.billing.desc, icon: CreditCard },
    { href: "/settings/team", title: t.settings.sections.team.title, desc: t.settings.sections.team.desc, icon: Users },
    { href: "/settings/company", title: t.settings.sections.company.title, desc: t.settings.sections.company.desc, icon: SettingsIcon },
  ];

  return (
    <div className="w-full h-full mt-8 px-6 md:px-8 lg:px-10 xl:px-12">
      <h1 className="text-primary font-semibold text-4xl mb-8">{t.settings.title}</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl">
        {sections.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="p-6 rounded-xl border border-border hover:bg-secondary transition-colors flex items-start gap-4"
          >
            <s.icon className="w-5 h-5 mt-1 text-primary" />
            <div>
              <h3 className="font-semibold">{s.title}</h3>
              <p className="text-sm text-muted-foreground">{s.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
//#endregion
