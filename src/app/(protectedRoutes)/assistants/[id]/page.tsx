//#region Imports
import { getAssistantById } from "@/actions/assistant";
import { getDictionary } from "@/i18n";
import { notFound } from "next/navigation";
import AssistantEditor from "./_components/AssistantEditor";
import AutoVapiSync from "./_components/AutoVapiSync";
import DeleteAssistantButton from "./_components/DeleteAssistantButton";
//#endregion

//#region Assistant Detail (inline-editable)
export default async function AssistantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [t, assistant] = await Promise.all([getDictionary(), getAssistantById(id)]);
  if (!assistant) notFound();

  return (
    <div className="w-full h-full mt-8 px-6 md:px-8 lg:px-10 xl:px-12 max-w-4xl mx-auto pb-24">
      <AutoVapiSync id={assistant.id} />

      <div className="flex items-center justify-between mb-2">
        <h1 className="text-primary font-semibold text-4xl">{assistant.name}</h1>
        <DeleteAssistantButton id={assistant.id} name={assistant.name} />
      </div>

      <div className="flex items-center gap-3 text-sm text-muted-foreground mb-8">
        <span>
          {t.assistants.detail.vapiLabel}:{" "}
          {assistant.vapiAssistantId ? (
            <span className="text-green-500">{assistant.vapiAssistantId.slice(0, 8)}…</span>
          ) : (
            <span className="text-amber-500">{t.assistants.detail.vapiNotSynced}</span>
          )}
        </span>
        <span>•</span>
        <span>
          {assistant.catalogs.length} {t.assistants.catalogsCount}
        </span>
      </div>

      <AssistantEditor
        initial={{
          id: assistant.id,
          name: assistant.name,
          language: assistant.language,
          voiceId: assistant.voiceId,
          firstMessage: assistant.firstMessage,
          systemPrompt: assistant.systemPrompt,
          systemPromptB: assistant.systemPromptB,
        }}
      />

      {assistant.catalogs.length > 0 && (
        <section className="mt-10">
          <h2 className="font-semibold mb-2">{t.assistants.detail.catalogsAssigned}</h2>
          <ul className="list-disc list-inside text-sm text-muted-foreground">
            {assistant.catalogs.map((c) => (
              <li key={c.id}>{c.name}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
//#endregion
