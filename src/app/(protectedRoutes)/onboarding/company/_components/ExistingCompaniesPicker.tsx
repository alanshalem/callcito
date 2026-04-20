"use client";

//#region Imports
import { Button } from "@/components/ui/button";
import { useT } from "@/i18n/client";
import { useOrganizationList } from "@clerk/nextjs";
import { Building2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
//#endregion

//#region Types
type CompanyRow = {
  id: string;
  clerkOrgId: string;
  name: string;
  role: string;
};
//#endregion

//#region Component
const ExistingCompaniesPicker = ({ companies }: { companies: CompanyRow[] }) => {
  const router = useRouter();
  const t = useT();
  const { setActive, isLoaded } = useOrganizationList();
  const [activating, setActivating] = useState<string | null>(null);

  const activate = async (clerkOrgId: string) => {
    if (!setActive || !isLoaded) return;
    setActivating(clerkOrgId);
    try {
      await setActive({ organization: clerkOrgId });
      router.push("/home");
      router.refresh();
    } catch (e) {
      console.error(e);
      toast.error(t.onboarding.activateError);
      setActivating(null);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {companies.map((c) => (
        <button
          key={c.id}
          onClick={() => activate(c.clerkOrgId)}
          disabled={!isLoaded || activating !== null}
          className="flex items-center justify-between p-4 rounded-xl border border-border hover:bg-secondary transition-colors text-left disabled:opacity-50"
        >
          <div className="flex items-center gap-3">
            <Building2 className="w-5 h-5" />
            <div>
              <div className="font-medium">{c.name}</div>
              <div className="text-xs text-muted-foreground">{c.role}</div>
            </div>
          </div>
          {activating === c.clerkOrgId ? (
            <span className="text-xs text-muted-foreground">{t.common.activating}</span>
          ) : (
            <span className="text-xs text-muted-foreground">{t.onboarding.enter}</span>
          )}
        </button>
      ))}

      <div className="mt-4 pt-4 border-t border-border">
        <Button variant="outline" asChild className="w-full">
          <Link href="/onboarding/company?new=1">{t.onboarding.createAnother}</Link>
        </Button>
      </div>
    </div>
  );
};
//#endregion

export default ExistingCompaniesPicker;
