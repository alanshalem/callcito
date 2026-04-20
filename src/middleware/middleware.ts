//#region Imports
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
//#endregion

//#region Public Routes
// Rutas que NO requieren auth. Resto de la app queda protegida.
// Patrón `(.*)` = match de sub-rutas (p.ej. `/sign-in/factor-two`).
const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api(.*)',
  '/live-webinar(.*)',
]);
//#endregion

//#region Middleware
// Clerk middleware: inyecta sesión en req. Si la ruta no es pública,
// `auth.protect()` redirige a sign-in / responde 404 (API).
export default clerkMiddleware(async (auth, req) => {
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
