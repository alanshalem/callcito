"use client";

//#region Imports
import { syncAssistantWithVapi } from "@/actions/assistant";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
//#endregion

//#region SyncVapiButton
// Reintenta sync con Vapi API. Muestra error real si falla.
const SyncVapiButton = ({ id }: { id: string }) => {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const onSync = () => {
    startTransition(async () => {
      const res = await syncAssistantWithVapi(id);
      if (res.status !== 200) {
        const msg = "message" in res ? res.message : "Error";
        toast.error(msg ?? "Sync falló");
        return;
      }
      toast.success("Sincronizado con Vapi");
      router.refresh();
    });
  };

  return (
    <Button variant="outline" onClick={onSync} disabled={pending}>
      <RefreshCw className={`w-4 h-4 mr-2 ${pending ? "animate-spin" : ""}`} />
      {pending ? "Sincronizando..." : "Sincronizar con Vapi"}
    </Button>
  );
};
//#endregion

export default SyncVapiButton;
