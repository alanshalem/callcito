"use client";

//#region Imports
import { updateAssistant } from "@/actions/assistant";
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
import { LANGUAGES, VOICES, type Lang } from "../../_components/constants";
//#endregion

//#region Types
type Initial = {
  id: string;
  name: string;
  language: string;
  voiceId: string;
  firstMessage: string;
  systemPrompt: string;
  systemPromptB: string | null;
};
//#endregion

//#region AssistantEditor
// Inline edit del asistente. Submit → updateAssistant (auto-sync con Vapi).
const AssistantEditor = ({ initial }: { initial: Initial }) => {
  const router = useRouter();
  const t = useT();
  const [pending, startTransition] = useTransition();

  const [name, setName] = useState(initial.name);
  const [language, setLanguage] = useState(initial.language);
  const [voiceId, setVoiceId] = useState(initial.voiceId);
  const [firstMessage, setFirstMessage] = useState(initial.firstMessage);
  const [systemPrompt, setSystemPrompt] = useState(initial.systemPrompt);
  const [enableAB, setEnableAB] = useState(!!initial.systemPromptB);
  const [systemPromptB, setSystemPromptB] = useState(initial.systemPromptB ?? "");

  const dirty =
    name !== initial.name ||
    language !== initial.language ||
    voiceId !== initial.voiceId ||
    firstMessage !== initial.firstMessage ||
    systemPrompt !== initial.systemPrompt ||
    (enableAB ? systemPromptB : "") !== (initial.systemPromptB ?? "");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dirty) return;
    startTransition(async () => {
      const res = await updateAssistant(initial.id, {
        name,
        language: language as Lang,
        voiceId,
        firstMessage,
        systemPrompt,
        systemPromptB: enableAB && systemPromptB ? systemPromptB : undefined,
      });
      if (res.status !== 200) {
        toast.error(t.assistants.saveError);
        return;
      }
      toast.success(t.assistants.saved);
      router.refresh();
    });
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
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
          rows={14}
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
            rows={14}
            className="font-mono text-xs"
            placeholder={t.assistants.form.systemPromptBPlaceholder}
          />
        </div>
      )}

      <div className="sticky bottom-0 bg-background/95 backdrop-blur py-3 border-t border-border flex items-center justify-end gap-2">
        {dirty && <span className="text-xs text-amber-500">Cambios sin guardar</span>}
        <Button type="submit" disabled={pending || !dirty}>
          {pending ? t.common.saving : t.common.save}
        </Button>
      </div>
    </form>
  );
};
//#endregion

export default AssistantEditor;
