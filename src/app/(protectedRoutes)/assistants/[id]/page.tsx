//#region Imports
import { getAssistantById } from "@/actions/assistant";
import { getDictionary } from "@/i18n";
import { notFound } from "next/navigation";
//#endregion

//#region Assistant Detail
export default async function AssistantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [t, assistant] = await Promise.all([getDictionary(), getAssistantById(id)]);
  if (!assistant) notFound();

  return (
    <div className="w-full h-full mt-8 px-6 md:px-8 lg:px-10 xl:px-12">
      <h1 className="text-primary font-semibold text-4xl mb-2">{assistant.name}</h1>
      <div className="flex items-center gap-3 text-sm text-muted-foreground mb-8">
        <span>{assistant.language}</span>
        <span>•</span>
        <span>
          {t.assistants.detail.voiceLabel}: {assistant.voiceId}
        </span>
        <span>•</span>
        <span>
          {t.assistants.detail.vapiLabel}:{" "}
          {assistant.vapiAssistantId ? (
            <span className="text-green-500">{assistant.vapiAssistantId.slice(0, 8)}…</span>
          ) : (
            <span className="text-amber-500">{t.assistants.detail.vapiNotSynced}</span>
          )}
        </span>
      </div>

      <section className="mb-8">
        <h2 className="font-semibold mb-2">{t.assistants.detail.firstMessage}</h2>
        <p className="p-4 rounded-xl border border-border bg-secondary/30">{assistant.firstMessage}</p>
      </section>

      <section className="mb-8">
        <h2 className="font-semibold mb-2">{t.assistants.detail.systemPrompt}</h2>
        <pre className="p-4 rounded-xl border border-border bg-secondary/30 text-xs overflow-x-auto whitespace-pre-wrap">
          {assistant.systemPrompt}
        </pre>
      </section>

      <section>
        <h2 className="font-semibold mb-2">{t.assistants.detail.catalogsAssigned}</h2>
        {assistant.catalogs.length === 0 ? (
          <p className="text-muted-foreground">{t.assistants.detail.noCatalogs}</p>
        ) : (
          <ul className="list-disc list-inside">
            {assistant.catalogs.map((c) => (
              <li key={c.id}>{c.name}</li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
//#endregion
