//#region Route Config
// `force-dynamic` → desactiva cache/SSG. El callback post-login necesita
// ejecutarse en cada request (lee sesión fresca de Clerk).
export const dynamic = "force-dynamic";
//#endregion

//#region Callback Page
// Destino post sign-in/sign-up (ver NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL).
// Placeholder — luego sincroniza user de Clerk con DB vía Prisma.
const AuthCallbackPage = async () => {
  return <>AuthCallbackPage</>;
};
//#endregion

export default AuthCallbackPage;
