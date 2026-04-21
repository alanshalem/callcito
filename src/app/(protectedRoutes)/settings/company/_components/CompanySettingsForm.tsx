"use client";

//#region Imports
import { updateCompany } from "@/actions/company";
import ImageUpload from "@/components/ReusableComponent/ImageUpload";
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
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
//#endregion

//#region Constants
const LANGUAGES = [
  { value: "es", label: "Español" },
  { value: "es-AR", label: "Español (Argentina)" },
  { value: "es-MX", label: "Español (México)" },
  { value: "pt", label: "Portugués" },
  { value: "pt-BR", label: "Portugués (Brasil)" },
  { value: "en", label: "English" },
];
//#endregion

//#region Types
type Props = {
  company: {
    name: string;
    logoUrl: string | null;
    defaultLanguage: string;
    customDomain: string | null;
    slug: string;
  };
};
//#endregion

//#region Component
const CompanySettingsForm = ({ company }: Props) => {
  const router = useRouter();
  const t = useT();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState(company.name);
  const [logoUrl, setLogoUrl] = useState(company.logoUrl ?? "");
  const [language, setLanguage] = useState(company.defaultLanguage);
  const [customDomain, setCustomDomain] = useState(company.customDomain ?? "");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await updateCompany({
        name,
        logoUrl: logoUrl || null,
        defaultLanguage: language,
        // platformFeeBps NO se toca acá — solo platform admin lo setea desde /admin.
        customDomain: customDomain.trim() || null,
      });
      if (res.status !== 200) {
        toast.error(("message" in res ? res.message : null) ?? t.settings.company.saveError);
        return;
      }
      toast.success(t.settings.company.saved);
      router.refresh();
    });
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div>
        <Label>{t.settings.company.slugLabel}</Label>
        <Input value={company.slug} readOnly className="opacity-60" />
      </div>
      <div>
        <Label htmlFor="name">{t.settings.company.name}</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div>
        <Label>{t.settings.company.logoUrl}</Label>
        <ImageUpload value={logoUrl || null} onChange={(url) => setLogoUrl(url ?? "")} />
      </div>
      <div>
        <Label>{t.settings.company.language}</Label>
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
      <div>
        <Label htmlFor="domain">{t.settings.company.customDomain}</Label>
        <Input
          id="domain"
          value={customDomain}
          onChange={(e) => setCustomDomain(e.target.value.trim())}
          placeholder={t.settings.company.customDomainPlaceholder}
        />
        <p className="text-xs text-muted-foreground mt-1">{t.settings.company.customDomainHelp}</p>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? t.common.saving : t.common.save}
      </Button>
    </form>
  );
};
//#endregion

export default CompanySettingsForm;
