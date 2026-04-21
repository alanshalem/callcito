"use client";

//#region Imports
import { deleteAssistant } from "@/actions/assistant";
import { Button } from "@/components/ui/button";
import { useT } from "@/i18n/client";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
//#endregion

//#region DeleteAssistantButton
const DeleteAssistantButton = ({ id, name }: { id: string; name: string }) => {
  const router = useRouter();
  const t = useT();
  const [pending, startTransition] = useTransition();

  const onDelete = () => {
    const ok = confirm(`${t.assistants.deleteConfirm}\n\n"${name}"`);
    if (!ok) return;
    startTransition(async () => {
      const res = await deleteAssistant(id);
      if (res.status !== 200) {
        toast.error(t.assistants.deleteError);
        return;
      }
      toast.success(t.assistants.deleted);
      router.push("/assistants");
      router.refresh();
    });
  };

  return (
    <Button variant="destructive" onClick={onDelete} disabled={pending}>
      <Trash2 className="w-4 h-4 mr-2" />
      {pending ? "..." : t.assistants.deleteBtn}
    </Button>
  );
};
//#endregion

export default DeleteAssistantButton;
