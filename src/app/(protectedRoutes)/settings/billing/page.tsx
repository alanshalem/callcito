//#region Imports
import { getCurrentCompany } from "@/actions/company";
import { getCurrentPlan, getPlans } from "@/actions/subscription";
import { getDictionary } from "@/i18n";
import { redirect } from "next/navigation";
import BillingPlans from "./_components/BillingPlans";
//#endregion

//#region Billing Page
export default async function BillingPage() {
  const company = await getCurrentCompany();
  if (!company) redirect("/onboarding/company");

  const [t, plans, current] = await Promise.all([
    getDictionary(),
    getPlans(),
    getCurrentPlan(),
  ]);

  return (
    <div className="w-full h-full mt-8 px-6 md:px-8 lg:px-10 xl:px-12">
      <h1 className="text-primary font-semibold text-4xl mb-2">{t.settings.billing.title}</h1>
      <p className="text-muted-foreground mb-8">
        {t.settings.billing.currentPlan}{" "}
        <span className="text-primary font-medium">
          {current?.plan.name ?? t.settings.billing.noPlan}
        </span>
        {current?.currentPeriodEnd && (
          <>
            {" · "}
            {t.settings.billing.expires} {new Date(current.currentPeriodEnd).toLocaleDateString()}
          </>
        )}
      </p>

      <BillingPlans plans={plans} currentTier={current?.plan.tier ?? null} />
    </div>
  );
}
//#endregion
