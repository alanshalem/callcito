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
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.png", type: "image/png" },
    ],
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

  // Si faltan keys críticas en prod, mostramos pantalla de "config missing"
  // en lugar de crashear con 500 (Clerk throwea si no hay publishableKey).
  const hasClerkKey = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  const shell = (
    <html
      lang={locale}
      className={cn("h-full", "antialiased", manrope.variable, theme)}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <I18nProvider dict={dict}>
          <TooltipProvider delayDuration={200}>
            {hasClerkKey ? children : <MissingConfigScreen />}
          </TooltipProvider>
        </I18nProvider>
      </body>
    </html>
  );

  if (!hasClerkKey) return shell;
  return <ClerkProvider>{shell}</ClerkProvider>;
}

function MissingConfigScreen() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-semibold mb-3">Configuración incompleta</h1>
        <p className="text-muted-foreground mb-4">
          Faltan variables de entorno críticas (Clerk). La app no puede inicializar.
        </p>
        <p className="text-sm text-muted-foreground">
          Configurá <code className="font-mono">NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</code>{" "}
          en Vercel → Settings → Environment Variables y hacé redeploy.
        </p>
      </div>
    </main>
  );
}
//#endregion
