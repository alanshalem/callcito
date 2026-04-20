//#region Imports
import { getCompanyMetrics } from "@/actions/analytics";
import { getCurrentCompany } from "@/actions/company";
import { getDictionary } from "@/i18n";
import { redirect } from "next/navigation";
import RevenueChart from "./_components/RevenueChart";
//#endregion

export const dynamic = "force-dynamic";

//#region Analytics Page
export default async function AnalyticsPage() {
  const company = await getCurrentCompany();
  if (!company) redirect("/onboarding/company");

  const [t, metrics] = await Promise.all([getDictionary(), getCompanyMetrics()]);
  if (!metrics) redirect("/home");

  return (
    <div className="w-full h-full mt-8 px-6 md:px-8 lg:px-10 xl:px-12">
      <h1 className="text-primary font-semibold text-4xl mb-2">{t.analytics.title}</h1>
      <p className="text-muted-foreground mb-8">{t.analytics.desc}</p>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Kpi label={t.analytics.kpi.conversations} value={metrics.conversationsTotal} />
        <Kpi label={t.analytics.kpi.ended} value={metrics.conversationsEnded} />
        <Kpi label={t.analytics.kpi.ordersApproved} value={metrics.ordersApproved} />
        <Kpi
          label={`${t.analytics.kpi.revenue} (${company.currency})`}
          value={metrics.revenue.toLocaleString()}
        />
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="p-4 rounded-xl border border-border md:col-span-2">
          <h2 className="font-semibold mb-4">{t.analytics.revenueByDay}</h2>
          <RevenueChart data={metrics.dailyRevenue} emptyLabel={t.analytics.noRevenue} />
        </div>
        <div className="p-4 rounded-xl border border-border">
          <h2 className="font-semibold mb-4">{t.analytics.conversionRate}</h2>
          <p className="text-4xl font-bold">{(metrics.conversionRate * 100).toFixed(1)}%</p>
          <p className="text-xs text-muted-foreground mt-1">{t.analytics.conversionRateHelp}</p>
          {(metrics.ab.A > 0 || metrics.ab.B > 0) && (
            <div className="mt-6 text-sm">
              <p className="font-semibold mb-2">{t.analytics.abTitle}</p>
              <div className="flex justify-between">
                <span>{t.analytics.abVariantA}</span>
                <span className="tabular-nums">{metrics.ab.A}</span>
              </div>
              <div className="flex justify-between">
                <span>{t.analytics.abVariantB}</span>
                <span className="tabular-nums">{metrics.ab.B}</span>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="p-4 rounded-xl border border-border">
        <h2 className="font-semibold mb-4">{t.analytics.topProducts}</h2>
        {metrics.topProducts.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t.analytics.topProductsEmpty}</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-muted-foreground">
              <tr>
                <th className="pb-2">{t.analytics.tableProduct}</th>
                <th className="pb-2 text-right">{t.analytics.tableUnits}</th>
                <th className="pb-2 text-right">{t.analytics.tablePrice}</th>
              </tr>
            </thead>
            <tbody>
              {metrics.topProducts.map((p) => (
                <tr key={p.id} className="border-t border-border">
                  <td className="py-2">{p.name}</td>
                  <td className="py-2 text-right tabular-nums">{p.unitsSold}</td>
                  <td className="py-2 text-right tabular-nums">
                    {p.currency} {p.price.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
//#endregion

//#region Kpi
function Kpi({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="p-4 rounded-xl border border-border">
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div className="text-3xl font-semibold tabular-nums">{value}</div>
    </div>
  );
}
//#endregion
