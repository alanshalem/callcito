"use client";

//#region Imports
import { deleteAssistant } from "@/actions/assistant";
import { Button } from "@/components/ui/button";
import { useT } from "@/i18n/client";
import { Bot, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
//#endregion

//#region Types
type Assistant = {
  id: string;
  name: string;
  language: string;
  firstMessage: string;
  vapiAssistantId: string | null;
  catalogsCount: number;
  conversationsCount: number;
};
//#endregion

//#region AssistantListCard
// Card clicable → detail. Hover-reveal botón borrar con confirm.
const AssistantListCard = ({ assistant }: { assistant: Assistant }) => {
  const router = useRouter();
  const t = useT();
  const [pending, startTransition] = useTransition();

  const onDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const ok = confirm(`${t.assistants.deleteConfirm}\n\n"${assistant.name}"`);
    if (!ok) return;
    startTransition(async () => {
      const res = await deleteAssistant(assistant.id);
      if (res.status !== 200) {
        toast.error(t.assistants.deleteError);
        return;
      }
      toast.success(t.assistants.deleted);
      router.refresh();
    });
  };

  return (
    <div className="group relative p-6 rounded-xl border border-border hover:bg-secondary transition-colors">
      <Link href={`/assistants/${assistant.id}`} className="block">
        <div className="flex items-center gap-2 mb-2 pr-10">
          <Bot className="w-5 h-5" />
          <h3 className="font-semibold text-lg truncate">{assistant.name}</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{assistant.firstMessage}</p>
        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
          <span>{assistant.language}</span>
          <span>•</span>
          <span>
            {assistant.catalogsCount} {t.assistants.catalogsCount}
          </span>
          <span>•</span>
          <span>
            {assistant.conversationsCount} {t.assistants.conversationsCount}
          </span>
          {!assistant.vapiAssistantId && (
            <>
              <span>•</span>
              <span className="text-amber-500">{t.assistants.notSynced}</span>
            </>
          )}
        </div>
      </Link>

      <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          onClick={onDelete}
          disabled={pending}
          aria-label={t.assistants.deleteBtn}
          className="h-8 w-8 bg-background/80 backdrop-blur hover:bg-destructive hover:text-destructive-foreground"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
//#endregion

export default AssistantListCard;
