//#region Imports
import { SignIn } from "@clerk/nextjs";
import React from "react";
//#endregion

//#region Sign-In Page
// Catch-all `[[...sign-in]]` → maneja flujo multi-paso de Clerk
// (factor-two, reset-password, etc.) bajo la misma ruta base.
const Signin = () => {
  return <SignIn />;
};
//#endregion

export default Signin;
