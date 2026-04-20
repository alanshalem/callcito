//#region Imports
import { onAuthenticateUser } from "@/actions/auth";
import { redirect } from "next/navigation";
//#endregion

//#region Route Config
// `force-dynamic` → desactiva cache/SSG. El callback post-login necesita
// ejecutarse en cada request (lee sesión fresca de Clerk).
export const dynamic = "force-dynamic";
//#endregion

//#region Callback Page
// Destino post sign-in/sign-up (ver NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL).
// Sincroniza user Clerk → DB vía `onAuthenticateUser`, luego:
//   - 200/201 → /home (el layout decide si mandar a /onboarding/company)
//   - 403/500 → /
const AuthCallbackPage = async () => {
  const result = await onAuthenticateUser();
  if (result.status === 200 || result.status === 201) {
    redirect("/home");
  }
  redirect("/");
};
//#endregion

export default AuthCallbackPage;
