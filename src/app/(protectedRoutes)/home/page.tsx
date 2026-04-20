//#region Imports
import { getCurrentCompany } from "@/actions/company";
import { getCurrentPlan } from "@/actions/subscription";
import { getDictionary } from "@/i18n";
import { prismaClient } from "@/lib/prismaClient";
import { Bot, CheckCircle, Circle, MessagesSquare, Package, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
//#endregion

export const dynamic = "force-dynamic";

//#region Home Dashboard
export default async function HomePage() {
  const company = await getCurrentCompany();
  if (!company) redirect("/onboarding/company");

  const t = await getDictionary();
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [catalogCount, productCount, assistantCount, conversationsThisMonth, ordersThisMonth, plan] =
    await Promise.all([
      prismaClient.catalog.count({ where: { companyId: company.id } }),
      prismaClient.product.count({ where: { catalog: { companyId: company.id } } }),
      prismaClient.assistant.count({ where: { companyId: company.id } }),
      prismaClient.conversation.count({
        where: { assistant: { companyId: company.id }, startedAt: { gte: monthStart } },
      }),
      prismaClient.order.count({
        where: {
          createdAt: { gte: monthStart },
          cart: { conversation: { assistant: { companyId: company.id } } },
        },
      }),
      getCurrentPlan(),
    ]);

  const onboardingLinks = ["/onboarding/company", "/catalogs/new", "/assistants/new", "/catalogs"];
  const progress = t.home.steps.map((step, idx) => {
    let complete = false;
    if (idx === 0) complete = true;
    if (idx === 1) complete = catalogCount > 0;
    if (idx === 2) complete = assistantCount > 0;
    return { ...step, complete, link: onboardingLinks[idx] };
  });

  return (
    <div className="w-full h-full mt-8 px-6 md:px-8 lg:px-10 xl:px-12">
      <h1 className="text-primary font-semibold text-4xl mb-2">
        {t.home.welcome} {company.name}
      </h1>
      <p className="text-muted-foreground mb-8">
        {t.home.plan} <span className="text-primary font-medium">{plan?.plan.name ?? "Free"}</span>
      </p>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <MetricCard icon={Package} label={t.home.metrics.products} value={productCount} />
        <MetricCard icon={Bot} label={t.home.metrics.assistants} value={assistantCount} />
        <MetricCard icon={MessagesSquare} label={t.home.metrics.conversationsMonth} value={conversationsThisMonth} />
        <MetricCard icon={ShoppingBag} label={t.home.metrics.ordersMonth} value={ordersThisMonth} />
      </section>

      <section>
        <h2 className="font-semibold mb-4">{t.home.onboardingProgress}</h2>
        <div className="flex flex-col gap-2 max-w-2xl">
          {progress.map((step, idx) => (
            <Link
              key={idx}
              href={step.link}
              className="flex items-center gap-3 p-4 rounded-xl border border-border hover:bg-secondary transition-colors"
            >
              {step.complete ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <Circle className="w-5 h-5 text-muted-foreground" />
              )}
              <span className={step.complete ? "text-muted-foreground line-through" : ""}>
                {step.title}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
//#endregion

//#region MetricCard
function MetricCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
}) {
  return (
    <div className="p-4 rounded-xl border border-border">
      <Icon className="w-5 h-5 text-muted-foreground mb-2" />
      <div className="text-3xl font-semibold tabular-nums">{value.toLocaleString()}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
//#endregion
