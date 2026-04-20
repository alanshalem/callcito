"use server";

//#region Imports
import { LOCALE_COOKIE, THEME_COOKIE, type Locale, type Theme } from "@/lib/preferences";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
//#endregion

//#region setTheme
// Cookie `httpOnly: false` → accesible desde el DOM para que el toggle
// client-side pueda leerla y switchear sin round-trip antes de llamar a la action.
// maxAge 1 año.
export async function setTheme(theme: Theme) {
  (await cookies()).set(THEME_COOKIE, theme, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  revalidatePath("/");
}
//#endregion

//#region setLocale
export async function setLocale(locale: Locale) {
  (await cookies()).set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  revalidatePath("/");
}
//#endregion
