//#region Imports
import { getAssistants } from "@/actions/assistant";
import { getCurrentCompany } from "@/actions/company";
import { Button } from "@/components/ui/button";
import { getDictionary } from "@/i18n";
import { Bot, Plus } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
//#endregion

// Force fresh fetch cada request. Tras create/update/delete queremos ver los
// cambios inmediatamente, sin depender de revalidatePath + caché de Turbopack.
export const dynamic = "force-dynamic";

//#region Assistants List
export default async function AssistantsPage() {
  const company = await getCurrentCompany();
  if (!company) redirect("/onboarding/company");

  const [t, assistants] = await Promise.all([getDictionary(), getAssistants()]);

  return (
    <div className="w-full h-full mt-8 px-6 md:px-8 lg:px-10 xl:px-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-primary font-semibold text-4xl">{t.assistants.title}</h1>
          <p className="text-muted-foreground">{t.assistants.desc}</p>
        </div>
        <Button asChild>
          <Link href="/assistants/new">
            <Plus className="w-4 h-4 mr-2" /> {t.assistants.newBtn}
          </Link>
        </Button>
      </div>

      {assistants.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border border-dashed border-border rounded-xl">
          <Bot className="w-12 h-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">{t.assistants.empty}</p>
          <Button asChild>
            <Link href="/assistants/new">{t.assistants.firstCta}</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {assistants.map((a) => (
            <Link
              key={a.id}
              href={`/assistants/${a.id}`}
              className="p-6 rounded-xl border border-border hover:bg-secondary transition-colors"
            >
              <div className="flex items-center gap-2 mb-2">
                <Bot className="w-5 h-5" />
                <h3 className="font-semibold text-lg">{a.name}</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{a.firstMessage}</p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>{a.language}</span>
                <span>•</span>
                <span>
                  {a._count.catalogs} {t.assistants.catalogsCount}
                </span>
                <span>•</span>
                <span>
                  {a._count.conversations} {t.assistants.conversationsCount}
                </span>
                {!a.vapiAssistantId && (
                  <>
                    <span>•</span>
                    <span className="text-amber-500">{t.assistants.notSynced}</span>
                  </>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
//#endregion
