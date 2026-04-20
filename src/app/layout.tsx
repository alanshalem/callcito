//#region Imports
import { TooltipProvider } from "@/components/ui/tooltip";
import { I18nProvider } from "@/i18n/client";
import { getDictionary } from "@/i18n";
import { getLocale, getTheme } from "@/lib/preferences";
import { cn } from "@/lib/utils";
import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
//#endregion

//#region Fonts
// Manrope cargada vía next/font/google. Expone CSS var `--font-manrope`.
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });
//#endregion

//#region Metadata
export const metadata: Metadata = {
  title: "callcito",
  description: "AI Powered Sales Voice Assistant for Catalogs",
  icons: {
    icon: [{ url: "/favicon.png", type: "image/png" }],
  },
};
//#endregion

//#region RootLayout
// Server component raíz:
//   - Lee `theme` y `locale` de cookies (ver `@/lib/preferences`).
//   - Aplica class dark/light directo al <html> → zero-flash (SSR friendly).
//   - Pasa diccionario al I18nProvider para client components.
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [theme, locale, dict] = await Promise.all([
    getTheme(),
    getLocale(),
    getDictionary(),
  ]);

  return (
    <ClerkProvider>
      <html
        lang={locale}
        className={cn("h-full", "antialiased", manrope.variable, theme)}
        suppressHydrationWarning
      >
        <body className="min-h-full flex flex-col" suppressHydrationWarning>
          <I18nProvider dict={dict}>
            <TooltipProvider delayDuration={200}>{children}</TooltipProvider>
          </I18nProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
//#endregion
