//#region Imports
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { prismaClient } from '@/lib/prismaClient';
//#endregion

//#region Public Routes
// Rutas que NO requieren auth. Resto de la app queda protegida.
// Patrón `(.*)` = match de sub-rutas (p.ej. `/sign-in/factor-two`).
const isPublicRoute = createRouteMatcher([
  '/',                            // Landing
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks/(.*)',           // Webhooks externos (Clerk, MP, Vapi) — firma valida auth
  '/api/vapi/(.*)',               // Tools del asistente Vapi — auth por metadata de call
  '/c/(.*)',                      // Catálogo público
]);
//#endregion

//#region Custom Domain Rewrite
// Si el host del request matchea `Company.customDomain`, rewrite a /c/[slug]/...
// Config: /settings/company + CNAME al deployment.
// Skip: localhost, tu Vercel URL, vercel preview branches.
function isAppHost(host: string): boolean {
  if (host === "localhost:3000" || host === "127.0.0.1:3000") return true;
  if (process.env.NEXT_PUBLIC_APP_HOST === host) return true;
  // Match NEXT_PUBLIC_BASE_URL → extract host
  const base = process.env.NEXT_PUBLIC_BASE_URL;
  if (base) {
    try {
      if (new URL(base).host === host) return true;
    } catch { /* ignore */ }
  }
  // Default Vercel domains nunca son custom domains
  if (host.endsWith(".vercel.app")) return true;
  return false;
}

async function maybeRewriteCustomDomain(req: Request): Promise<Response | null> {
  const host = new Headers(req.headers).get("host");
  if (!host || isAppHost(host)) return null;

  const company = await prismaClient.company
    .findUnique({
      where: { customDomain: host },
      select: { slug: true },
    })
    .catch(() => null);
  if (!company) return null;

  const url = new URL(req.url);
  if (url.pathname.startsWith(`/c/${company.slug}/`)) return null;

  const rewritten = new URL(url);
  rewritten.pathname = `/c/${company.slug}${url.pathname === "/" ? "" : url.pathname}`;
  return NextResponse.rewrite(rewritten);
}
//#endregion

//#region Middleware
// Clerk middleware: inyecta sesión en req. Si la ruta no es pública,
// `auth.protect()` redirige a sign-in / responde 404 (API).
export default clerkMiddleware(async (auth, req) => {
  const rewrite = await maybeRewriteCustomDomain(req);
  if (rewrite) return rewrite;

  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});
//#endregion

//#region Matcher Config
// Define qué URLs invocan al middleware.
// - Skip Next.js internals + static files (salvo que aparezcan en querystring).
// - Siempre corre en rutas /api y /trpc.
export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
//#endregion
