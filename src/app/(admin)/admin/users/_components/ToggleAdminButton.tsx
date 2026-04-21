"use client";

//#region Imports
import { toggleUserAdmin } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
//#endregion

//#region ToggleAdminButton
const ToggleAdminButton = ({ userId, isAdmin }: { userId: string; isAdmin: boolean }) => {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const onToggle = () => {
    startTransition(async () => {
      const res = await toggleUserAdmin(userId);
      if (res.status !== 200) {
        toast.error(("message" in res ? res.message : null) ?? "Error");
        return;
      }
      toast.success("Rol actualizado");
      router.refresh();
    });
  };

  return (
    <Button variant="outline" size="sm" onClick={onToggle} disabled={pending}>
      {isAdmin ? "Quitar admin" : "Hacer admin"}
    </Button>
  );
};
//#endregion

export default ToggleAdminButton;
