"use client";

//#region Imports
import { assignAssistantToCatalog } from "@/actions/assistant";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Bot } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
//#endregion

//#region Types
type AssistantRow = {
  id: string;
  name: string;
  hasVapiSync: boolean;
};
//#endregion

//#region Component
const AssistantAssigner = ({
  catalogId,
  currentAssistantId,
  assistants,
}: {
  catalogId: string;
  currentAssistantId: string | null;
  assistants: AssistantRow[];
}) => {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useState<string>(currentAssistantId ?? "__none__");

  const onSave = () => {
    startTransition(async () => {
      const assistantId = selected === "__none__" ? null : selected;
      const res = await assignAssistantToCatalog(catalogId, assistantId);
      if (res.status !== 200) {
        toast.error("No se pudo asignar");
        return;
      }
      toast.success(assistantId ? "Asistente asignado" : "Asistente removido");
      router.refresh();
    });
  };

  if (assistants.length === 0) {
    return (
      <div className="p-4 border border-dashed border-border rounded-xl text-sm">
        <p className="text-muted-foreground mb-3">
          Sin asistentes creados. Necesitás uno para que los compradores puedan hablar con AI.
        </p>
        <Button asChild size="sm">
          <Link href="/assistants/new">
            <Bot className="w-4 h-4 mr-2" /> Crear asistente
          </Link>
        </Button>
      </div>
    );
  }

  const changed = selected !== (currentAssistantId ?? "__none__");

  return (
    <div className="flex flex-col gap-2">
      <Label>Asistente asignado</Label>
      <div className="flex gap-2">
        <Select value={selected} onValueChange={setSelected}>
          <SelectTrigger className="flex-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">Sin asistente</SelectItem>
            {assistants.map((a) => (
              <SelectItem key={a.id} value={a.id} disabled={!a.hasVapiSync}>
                {a.name} {!a.hasVapiSync && "(no sync Vapi)"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={onSave} disabled={!changed || pending}>
          {pending ? "..." : "Guardar"}
        </Button>
      </div>
    </div>
  );
};
//#endregion

export default AssistantAssigner;
