//#region Imports
import { getUserCompanies } from "@/actions/company";
import { getDictionary } from "@/i18n";
import { prismaClient } from "@/lib/prismaClient";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import ExistingCompaniesPicker from "./_components/ExistingCompaniesPicker";
import OnboardingCompanyForm from "./_components/OnboardingCompanyForm";
//#endregion

//#region Onboarding Page
export default async function OnboardingCompanyPage() {
  const { userId, orgId } = await auth();
  if (!userId) redirect("/sign-in");

  if (orgId) {
    const existing = await prismaClient.company.findUnique({
      where: { clerkOrgId: orgId },
      select: { id: true },
    });
    if (existing) redirect("/home");
  }

  const [t, memberships] = await Promise.all([getDictionary(), getUserCompanies()]);

  return (
    <div className="w-full h-full flex items-center justify-center py-16">
      <div className="w-full max-w-xl px-6">
        {memberships.length > 0 ? (
          <>
            <h1 className="text-3xl font-semibold text-primary mb-2">{t.onboarding.activateTitle}</h1>
            <p className="text-muted-foreground mb-8">
              {memberships.length === 1
                ? t.onboarding.activateDescSingular
                : t.onboarding.activateDescPlural}
            </p>
            <ExistingCompaniesPicker
              companies={memberships.map((m) => ({
                id: m.company.id,
                clerkOrgId: m.company.clerkOrgId,
                name: m.company.name,
                role: m.role,
              }))}
            />
          </>
        ) : (
          <>
            <h1 className="text-3xl font-semibold text-primary mb-2">{t.onboarding.createTitle}</h1>
            <p className="text-muted-foreground mb-8">{t.onboarding.createDesc}</p>
            <OnboardingCompanyForm />
          </>
        )}
      </div>
    </div>
  );
}
//#endregion
