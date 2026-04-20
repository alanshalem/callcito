"use client";

//#region Imports
import { deleteCatalog } from "@/actions/catalog";
import { Button } from "@/components/ui/button";
import { useT } from "@/i18n/client";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
//#endregion

//#region DeleteCatalogButton
const DeleteCatalogButton = ({ id, name }: { id: string; name: string }) => {
  const router = useRouter();
  const t = useT();
  const [pending, startTransition] = useTransition();

  const onDelete = () => {
    const confirmed = confirm(`${t.catalogs.deleteConfirm}\n\n"${name}"`);
    if (!confirmed) return;
    startTransition(async () => {
      const res = await deleteCatalog(id);
      if (res.status !== 200) {
        toast.error(("message" in res ? res.message : null) ?? t.catalogs.deleteError);
        return;
      }
      toast.success(t.catalogs.deleted);
      router.push("/catalogs");
      router.refresh();
    });
  };

  return (
    <Button variant="destructive" onClick={onDelete} disabled={pending}>
      <Trash2 className="w-4 h-4 mr-2" />
      {pending ? t.common.loading : t.catalogs.deleteBtn}
    </Button>
  );
};
//#endregion

export default DeleteCatalogButton;
