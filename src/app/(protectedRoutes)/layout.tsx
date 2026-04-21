//#region Imports
import { onAuthenticateUser } from "@/actions/auth";
import ActiveOrgGuard from "@/components/ActiveOrgGuard";
import Sidebar from "@/components/ReusableComponent/LayoutComponents/Sidebar";
import { getLocale, getTheme } from "@/lib/preferences";
import { redirect } from "next/navigation";
import React from "react";
//#endregion

//#region Types
type Props = {
  children: React.ReactNode;
};
//#endregion

//#region Protected Layout
// Auth gate: sincroniza Clerk user con DB.
// El check de `orgId` lo hace cada page con `getCurrentCompany`:
//   - pages de app → si no hay company, redirigen a /onboarding/company
//   - /onboarding/company → si YA hay company, redirige a /home
// Evita redirect-loops que ocurrirían si layout decidiera.
const Layout = async ({ children }: Props) => {
  const syncResult = await onAuthenticateUser();
  if (!syncResult.user) {
    redirect("/sign-in");
  }
  const [theme, locale] = await Promise.all([getTheme(), getLocale()]);
  const isAdmin = syncResult.user.isAdmin ?? false;

  return (
    <div className="flex w-full min-h-screen">
      <ActiveOrgGuard />
      <Sidebar theme={theme} locale={locale} isAdmin={isAdmin} />
      <div className="flex flex-col w-full h-screen overflow-auto px-4 scrollbar-hide container mx-auto">
        {children}
      </div>
    </div>
  );
};
//#endregion

export default Layout;
