"use client";

//#region Imports
import { createCompany } from "@/actions/company";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useT } from "@/i18n/client";
import { useOrganizationList } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
//#endregion

//#region Constants
const COUNTRIES = [
  { code: "AR", name: "Argentina", currency: "ARS" },
  { code: "BR", name: "Brasil", currency: "BRL" },
  { code: "CL", name: "Chile", currency: "CLP" },
  { code: "CO", name: "Colombia", currency: "COP" },
  { code: "MX", name: "México", currency: "MXN" },
  { code: "PE", name: "Perú", currency: "PEN" },
  { code: "UY", name: "Uruguay", currency: "UYU" },
];

const LANGUAGES = [
  { value: "es", label: "Español" },
  { value: "es-AR", label: "Español (Argentina)" },
  { value: "es-MX", label: "Español (México)" },
  { value: "pt", label: "Portugués" },
  { value: "pt-BR", label: "Portugués (Brasil)" },
  { value: "en", label: "English" },
];

type CompanyCurrency = "ARS" | "BRL" | "CLP" | "COP" | "MXN" | "PEN" | "UYU" | "USD";
type CompanyLanguage = "es" | "es-AR" | "es-MX" | "pt" | "pt-BR" | "en";
//#endregion

//#region slugify
function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}
//#endregion

//#region Component
const OnboardingCompanyForm = () => {
  const router = useRouter();
  const t = useT();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugDirty, setSlugDirty] = useState(false);
  const [country, setCountry] = useState("AR");
  const [currency, setCurrency] = useState("ARS");
  const [language, setLanguage] = useState("es");
  const { setActive } = useOrganizationList();

  const handleCountryChange = (code: string) => {
    setCountry(code);
    const match = COUNTRIES.find((c) => c.code === code);
    if (match) setCurrency(match.currency);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await createCompany({
        name,
        slug: slug || slugify(name),
        country,
        currency: currency as CompanyCurrency,
        defaultLanguage: language as CompanyLanguage,
      });

      if (res.status !== 201) {
        toast.error(res.message ?? t.onboarding.createError);
        return;
      }

      if (setActive && res.clerkOrgId) {
        await setActive({ organization: res.clerkOrgId });
      }
      toast.success(t.onboarding.createSuccess);
      router.push("/home");
      router.refresh();
    });
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div>
        <Label htmlFor="name">{t.onboarding.companyName}</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (!slugDirty) setSlug(slugify(e.target.value));
          }}
          placeholder={t.onboarding.companyNamePlaceholder}
          required
        />
      </div>

      <div>
        <Label htmlFor="slug">{t.onboarding.slug}</Label>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-sm">{t.onboarding.slugPrefix}</span>
          <Input
            id="slug"
            value={slug}
            onChange={(e) => {
              setSlug(slugify(e.target.value));
              setSlugDirty(true);
            }}
            placeholder={t.onboarding.slugPlaceholder}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>{t.onboarding.country}</Label>
          <Select value={country} onValueChange={handleCountryChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COUNTRIES.map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>{t.onboarding.currency}</Label>
          <Input value={currency} readOnly className="opacity-70" />
        </div>
      </div>

      <div>
        <Label>{t.onboarding.language}</Label>
        <Select value={language} onValueChange={setLanguage}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LANGUAGES.map((l) => (
              <SelectItem key={l.value} value={l.value}>
                {l.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" disabled={isPending || !name}>
        {isPending ? t.common.creating : t.onboarding.createButton}
      </Button>
    </form>
  );
};
//#endregion

export default OnboardingCompanyForm;
