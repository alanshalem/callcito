"use client";

//#region Imports
import { Button } from "@/components/ui/button";
import { useOrganizationList } from "@clerk/nextjs";
import { Building2, CheckCircle2, Edit, ExternalLink } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
//#endregion

//#region Types
type Company = {
  id: string;
  clerkOrgId: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  country: string;
  currency: string;
};
//#endregion

//#region CompanyCard
const CompanyCard = ({
  company,
  role,
  isActive,
}: {
  company: Company;
  role: string;
  isActive: boolean;
}) => {
  const router = useRouter();
  const { setActive, isLoaded } = useOrganizationList();
  const [activating, setActivating] = useState(false);

  const activate = async () => {
    if (!setActive || !isLoaded || isActive) return;
    setActivating(true);
    try {
      await setActive({ organization: company.clerkOrgId });
      toast.success(`Activaste "${company.name}"`);
      router.refresh();
    } catch {
      toast.error("No se pudo activar");
    } finally {
      setActivating(false);
    }
  };

  return (
    <div
      className={`p-6 rounded-xl border flex flex-col gap-4 ${
        isActive ? "border-primary bg-primary/5" : "border-border"
      }`}
    >
      <div className="flex items-start gap-3">
        {company.logoUrl ? (
          <div className="w-12 h-12 rounded-lg overflow-hidden bg-secondary shrink-0">
            <Image src={company.logoUrl} alt={company.name} width={48} height={48} className="object-cover w-full h-full" />
          </div>
        ) : (
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5 text-primary" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold truncate">{company.name}</h3>
            {isActive && <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />}
          </div>
          <p className="text-xs text-muted-foreground">{company.slug}</p>
        </div>
      </div>

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span>{company.country}</span>
        <span>•</span>
        <span>{company.currency}</span>
        <span>•</span>
        <span className="font-medium">{role}</span>
      </div>

      <div className="flex gap-2 mt-auto">
        {isActive ? (
          <>
            <Button variant="outline" size="sm" asChild className="flex-1">
              <Link href="/settings/company">
                <Edit className="w-4 h-4 mr-2" /> Editar
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/c/${company.slug}`} target="_blank">
                <ExternalLink className="w-4 h-4" />
              </Link>
            </Button>
          </>
        ) : (
          <Button
            size="sm"
            className="flex-1"
            onClick={activate}
            disabled={activating || !isLoaded}
          >
            {activating ? "Activando..." : "Activar"}
          </Button>
        )}
      </div>
    </div>
  );
};
//#endregion

export default CompanyCard;
