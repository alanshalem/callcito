"use client";

//#region I18n client provider + hook
// Server layout lee cookie → resuelve dict → pasa dict completo al Provider.
// Client components consumen via `useT()`.

import { createContext, useContext, type ReactNode } from "react";
import type { Dictionary } from "./dictionaries/es";

const I18nContext = createContext<Dictionary | null>(null);

export function I18nProvider({
  dict,
  children,
}: {
  dict: Dictionary;
  children: ReactNode;
}) {
  return <I18nContext.Provider value={dict}>{children}</I18nContext.Provider>;
}

export function useT(): Dictionary {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useT() fuera de <I18nProvider>");
  return ctx;
}
//#endregion
