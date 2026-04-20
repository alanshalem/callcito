"use client";

//#region Imports
import { useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
//#endregion

//#region Sign-Out Page
// Page-as-side-effect: al montar, cierra sesión y redirige al home.
// No renderiza UI (`return null`). Client Component requerido por los hooks.
const SignOutPage = () => {
  const { signOut } = useClerk();
  const router = useRouter();

  useEffect(() => {
    signOut().then(() => router.replace("/"));
  }, [signOut, router]);

  return null;
};
//#endregion

export default SignOutPage;
