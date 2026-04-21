"use client";

//#region Imports
import { setCompanyFee } from "@/actions/admin";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
//#endregion

//#region FeeEditor
// Inline editor de platformFeeBps. Guarda onBlur (no requiere submit).
const FeeEditor = ({ companyId, initial }: { companyId: string; initial: number }) => {
  const router = useRouter();
  const [value, setValue] = useState(String(initial));
  const [pending, startTransition] = useTransition();

  const save = () => {
    const n = Number(value);
    if (Number.isNaN(n) || n === initial) return;
    startTransition(async () => {
      const res = await setCompanyFee(companyId, n);
      if (res.status !== 200) {
        toast.error("Error");
        setValue(String(initial));
        return;
      }
      toast.success(`Comisión: ${res.feeBps} bps`);
      router.refresh();
    });
  };

  return (
    <Input
      type="number"
      min="0"
      max="10000"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={save}
      disabled={pending}
      className="h-8 w-20 text-right tabular-nums"
    />
  );
};
//#endregion

export default FeeEditor;
