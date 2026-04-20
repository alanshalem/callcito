"use client";

//#region Imports
import { useAuth, useOrganizationList } from "@clerk/nextjs";
import { useEffect } from "react";
//#endregion

//#region ActiveOrgGuard
// Si Clerk session no tiene orgId pero el user sí pertenece a una Org,
// activa la primera automáticamente (`setActive`). Rompe el loop
// /home → /onboarding/company cuando la Company existe pero orgId es null.
//
// Client Component → montado por protected layout. No renderiza nada.
const ActiveOrgGuard = () => {
  const { orgId, isLoaded: authLoaded } = useAuth();
  const { userMemberships, setActive, isLoaded: listLoaded } = useOrganizationList({
    userMemberships: { infinite: false, pageSize: 5 },
  });

  useEffect(() => {
    if (!authLoaded || !listLoaded) return;
    if (orgId) return;
    if (!setActive) return;
    const first = userMemberships?.data?.[0];
    if (!first) return;
    setActive({ organization: first.organization.id }).catch((e) =>
      console.warn("[ActiveOrgGuard] setActive failed", e)
    );
  }, [authLoaded, listLoaded, orgId, userMemberships, setActive]);

  return null;
};
//#endregion

export default ActiveOrgGuard;
