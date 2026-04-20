//#region i18n (server side)
// `getDictionary(locale)` devuelve el diccionario completo para Server Components.
// Client components reciben el dict como prop o via Context (ver `I18nProvider`).

import { en } from "./dictionaries/en";
import { es, type Dictionary } from "./dictionaries/es";
import { getLocale } from "@/lib/preferences";

const DICTS = { es, en } as const;

export async function getDictionary(): Promise<Dictionary> {
  const locale = await getLocale();
  return DICTS[locale];
}

export function getDictionarySync(locale: "es" | "en"): Dictionary {
  return DICTS[locale];
}

export type { Dictionary } from "./dictionaries/es";
//#endregion
