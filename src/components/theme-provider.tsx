//#region Theme provider (cookie-based, no client lib)
// Lee cookie server-side → aplica `class="dark"` o `class="light"` al <html>.
// Reemplazo de next-themes para evitar localStorage flashes y FOUC en SSR.
// Toggle: ver `<ThemeToggle>` en ReusableComponent.

import type { Theme } from "@/lib/preferences";

export function themeClass(theme: Theme): string {
  return theme;
}
//#endregion
