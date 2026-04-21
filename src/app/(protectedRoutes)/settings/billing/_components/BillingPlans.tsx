"use client";

//#region Imports
import { upgradeToPlan } from "@/actions/subscription";
import { Button } from "@/components/ui/button";
import { useT } from "@/i18n/client";
import type { PlanTier } from "@prisma/client";
import { Check } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";
//#endregion

//#region Types
// Shape plano — Decimal no serializa server→client.
export type PlanRow = {
  id: string;
  tier: PlanTier;
  name: string;
  priceArs: number;
  maxCatalogs: number;
  maxProducts: number;
  maxAssistants: number;
  maxConversations: number;
};
//#endregion

//#region Component
const BillingPlans = ({
  plans,
  currentTier,
}: {
  plans: PlanRow[];
  currentTier: PlanTier | null;
}) => {
  const t = useT();
  const [isPending, startTransition] = useTransition();

  const onUpgrade = (tier: PlanTier) => {
    startTransition(async () => {
      const res = await upgradeToPlan(tier);
      if (res.status !== 200) {
        toast.error(("message" in res ? res.message : null) ?? t.settings.billing.upgradeError);
        return;
      }
      if (res.checkoutUrl) {
        window.location.href = res.checkoutUrl;
      } else {
        toast.success(t.settings.billing.upgraded);
      }
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {plans.map((p) => {
        const isCurrent = p.tier === currentTier;
        return (
          <div
            key={p.id}
            className={`p-6 rounded-xl border ${
              isCurrent ? "border-primary" : "border-border"
            }`}
          >
            <h3 className="font-semibold text-lg mb-1">{p.name}</h3>
            <p className="text-2xl font-bold mb-4">
              {p.priceArs === 0
                ? t.settings.billing.planFree
                : `ARS ${p.priceArs.toLocaleString()}`}
              <span className="text-sm font-normal text-muted-foreground">
                {t.settings.billing.perMonth}
              </span>
            </p>
            <ul className="text-sm space-y-2 mb-6 text-muted-foreground">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4" /> {p.maxCatalogs} {t.sidebar.catalogs.toLowerCase()}
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4" /> {p.maxProducts.toLocaleString()} {t.home.metrics.products.toLowerCase()}
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4" /> {p.maxAssistants} {t.sidebar.assistants.toLowerCase()}
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4" /> {p.maxConversations.toLocaleString()} {t.home.metrics.conversationsMonth.toLowerCase()}
              </li>
            </ul>
            <Button
              className="w-full"
              disabled={isPending || isCurrent}
              onClick={() => onUpgrade(p.tier)}
              variant={isCurrent ? "secondary" : "default"}
            >
              {isCurrent ? t.settings.billing.currentBtn : t.settings.billing.upgradeBtn}
            </Button>
          </div>
        );
      })}
    </div>
  );
};
//#endregion

export default BillingPlans;
