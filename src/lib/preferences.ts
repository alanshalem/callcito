//#region Cookie-based preferences
// Cookies server-set → SSR no flashes. Client lee vía `document.cookie` cuando
// hace toggle y llama a la server action correspondiente para persistir.

import { cookies } from "next/headers";

export type Theme = "dark" | "light";
export type Locale = "es" | "en";

export const THEME_COOKIE = "callcito.theme";
export const LOCALE_COOKIE = "callcito.locale";

const DEFAULT_THEME: Theme = "dark";
const DEFAULT_LOCALE: Locale = "es";

export async function getTheme(): Promise<Theme> {
  const v = (await cookies()).get(THEME_COOKIE)?.value;
  return v === "light" || v === "dark" ? v : DEFAULT_THEME;
}

export async function getLocale(): Promise<Locale> {
  const v = (await cookies()).get(LOCALE_COOKIE)?.value;
  return v === "es" || v === "en" ? v : DEFAULT_LOCALE;
}
//#endregion
