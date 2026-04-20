"use client";

//#region Imports
import { updateCatalog } from "@/actions/catalog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useTransition, useState } from "react";
import { toast } from "sonner";
//#endregion

//#region Component
const CatalogPublishToggle = ({
  catalogId,
  isPublished,
}: {
  catalogId: string;
  isPublished: boolean;
}) => {
  const [published, setPublished] = useState(isPublished);
  const [isPending, startTransition] = useTransition();

  const toggle = (value: boolean) => {
    setPublished(value);
    startTransition(async () => {
      const res = await updateCatalog(catalogId, { isPublished: value });
      if (res.status !== 200) {
        toast.error("Error al actualizar");
        setPublished(!value);
      } else {
        toast.success(value ? "Catálogo publicado" : "Despublicado");
      }
    });
  };

  return (
    <div className="flex items-center gap-2">
      <Label htmlFor="publish">Publicado</Label>
      <Switch id="publish" checked={published} onCheckedChange={toggle} disabled={isPending} />
    </div>
  );
};
//#endregion

export default CatalogPublishToggle;
