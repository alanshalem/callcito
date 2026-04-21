//#region Shared Assistant constants
// Reutilizado por AssistantForm (create) + AssistantEditor (edit inline).

export const VOICES: { id: string; name: string }[] = [
  { id: "21m00Tcm4TlvDq8ikWAM", name: "Rachel (F, multi)" },
  { id: "EXAVITQu4vr4xnSDxMaL", name: "Sarah (F, multi, cálida)" },
  { id: "piTKgcLEGmPE4e6mEKli", name: "Nicole (F, multi, suave)" },
  { id: "AZnzlk1XvdvUeBnXmlld", name: "Domi (F, multi, enérgica)" },
  { id: "ErXwobaYiN019PkySvjV", name: "Antoni (M, multi, joven)" },
  { id: "pNInz6obpgDQGcFmaJgB", name: "Adam (M, multi, grave)" },
];

export type Lang = "es" | "es-AR" | "es-MX" | "pt" | "pt-BR" | "en";

export const LANGUAGES: { value: Lang; label: string }[] = [
  { value: "es", label: "Español" },
  { value: "es-AR", label: "Español (AR)" },
  { value: "es-MX", label: "Español (MX)" },
  { value: "pt", label: "Portugués" },
  { value: "pt-BR", label: "Portugués (BR)" },
  { value: "en", label: "English" },
];
//#endregion
