"use client";

//#region Imports
import { deleteCompany } from "@/actions/company";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
//#endregion

//#region DeleteCompanyButton
// Requiere tipear el nombre de la empresa para confirmar.
// Backend valida OWNER + subscription no activa.
const DeleteCompanyButton = ({ name }: { name: string }) => {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirmText, setConfirmText] = useState("");
  const canDelete = confirmText === name;

  const onDelete = () => {
    if (!canDelete) return;
    startTransition(async () => {
      const res = await deleteCompany();
      if (res.status !== 200) {
        toast.error(("message" in res ? res.message : null) ?? "No se pudo borrar");
        return;
      }
      toast.success("Empresa borrada");
      router.push("/onboarding/company");
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        Borra la empresa + todos sus catálogos, productos, asistentes, conversaciones y órdenes.
        Esta acción es <strong>irreversible</strong>. Requiere OWNER y sin suscripción activa.
      </p>
      <p className="text-sm">
        Para confirmar, tipeá el nombre de la empresa: <code className="font-mono">{name}</code>
      </p>
      <Input
        value={confirmText}
        onChange={(e) => setConfirmText(e.target.value)}
        placeholder={name}
      />
      <Button variant="destructive" disabled={!canDelete || pending} onClick={onDelete}>
        {pending ? "Borrando..." : "Borrar empresa"}
      </Button>
    </div>
  );
};
//#endregion

export default DeleteCompanyButton;
