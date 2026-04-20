"use client";

//#region Imports
import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
//#endregion

//#region ThemeProvider
// Wrapper client-side del ThemeProvider de next-themes.
// Necesario porque next-themes usa hooks (useState/useEffect) y no puede
// importarse en un Server Component como layout.tsx directamente.
export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
//#endregion
