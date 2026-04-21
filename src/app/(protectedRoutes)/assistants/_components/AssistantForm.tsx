"use client";

//#region Imports
import { createAssistant } from "@/actions/assistant";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useT } from "@/i18n/client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
//#endregion

//#region Constants
// Voces 11labs de la public library (funcionan sin credencial propia
// conectada en Vapi). Modelo eleven_multilingual_v2 respeta acento ES/PT.
const VOICES = [
  { id: "21m00Tcm4TlvDq8ikWAM", name: "Rachel (EN/multi)" },
  { id: "AZnzlk1XvdvUeBnXmlld", name: "Domi (PT-BR/multi)" },
];

type Lang = "es" | "es-AR" | "es-MX" | "pt" | "pt-BR" | "en";

const LANGUAGES: { value: Lang; label: string }[] = [
  { value: "es", label: "Español" },
  { value: "es-AR", label: "Español (AR)" },
  { value: "es-MX", label: "Español (MX)" },
  { value: "pt", label: "Portugués" },
  { value: "pt-BR", label: "Portugués (BR)" },
  { value: "en", label: "English" },
];
//#endregion

//#region Component
const AssistantForm = ({
  defaults,
}: {
  defaults?: { language?: string; systemPrompt?: string };
}) => {
  const router = useRouter();
  const t = useT();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [language, setLanguage] = useState(defaults?.language ?? "es");
  const [voiceId, setVoiceId] = useState(VOICES[0].id);
  const [firstMessage, setFirstMessage] = useState(t.assistants.form.firstMessagePlaceholder);
  const [systemPrompt, setSystemPrompt] = useState(defaults?.systemPrompt ?? "");
  const [enableAB, setEnableAB] = useState(false);
  const [systemPromptB, setSystemPromptB] = useState("");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await createAssistant({
        name,
        language: language as Lang,
        voiceId,
        firstMessage,
        systemPrompt,
        systemPromptB: enableAB && systemPromptB ? systemPromptB : undefined,
      });
      if (res.status !== 201 && res.status !== 207) {
        const msg = "message" in res ? res.message : t.assistants.form.errorCreate;
        toast.error(msg ?? t.assistants.form.errorCreate);
        return;
      }
      if (res.status === 207) {
        const warnMsg = "message" in res ? res.message : t.assistants.form.warningNoVapi;
        toast.warning(warnMsg ?? t.assistants.form.warningNoVapi, { duration: 8000 });
      } else {
        toast.success(t.assistants.form.successCreated);
      }
      router.push("/assistants");
      router.refresh();
    });
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div>
        <Label htmlFor="name">{t.assistants.form.name}</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>{t.assistants.form.language}</Label>
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((l) => (
                <SelectItem key={l.value} value={l.value}>
                  {l.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>{t.assistants.form.voice}</Label>
          <Select value={voiceId} onValueChange={setVoiceId}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {VOICES.map((v) => (
                <SelectItem key={v.id} value={v.id}>
                  {v.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="firstMessage">{t.assistants.form.firstMessage}</Label>
        <Textarea
          id="firstMessage"
          value={firstMessage}
          onChange={(e) => setFirstMessage(e.target.value)}
          rows={2}
          required
        />
      </div>

      <div>
        <Label htmlFor="systemPrompt">
          {t.assistants.form.systemPrompt} {enableAB && "(Variant A)"}
        </Label>
        <Textarea
          id="systemPrompt"
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          rows={10}
          className="font-mono text-xs"
          required
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          id="enableAB"
          type="checkbox"
          checked={enableAB}
          onChange={(e) => setEnableAB(e.target.checked)}
          className="h-4 w-4"
        />
        <Label htmlFor="enableAB" className="mb-0">
          {t.assistants.form.enableAB}
        </Label>
      </div>

      {enableAB && (
        <div>
          <Label htmlFor="systemPromptB">{t.assistants.form.systemPromptB}</Label>
          <Textarea
            id="systemPromptB"
            value={systemPromptB}
            onChange={(e) => setSystemPromptB(e.target.value)}
            rows={10}
            className="font-mono text-xs"
            placeholder={t.assistants.form.systemPromptBPlaceholder}
          />
        </div>
      )}

      <Button type="submit" disabled={isPending || !name}>
        {isPending ? t.common.creating : t.assistants.form.submit}
      </Button>
    </form>
  );
};
//#endregion

export default AssistantForm;
