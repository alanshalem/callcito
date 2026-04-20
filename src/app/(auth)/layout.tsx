//#region Imports
import React from "react";
//#endregion

//#region Types
type Props = {
  children: React.ReactNode;
};
//#endregion

//#region Auth Layout
// Layout compartido por el route group `(auth)` (sign-in, sign-up, sign-out, callback).
// Paréntesis en nombre = route group: no afecta a la URL pero aísla layout.
const Layout = ({ children }: Props) => {
  return (
    <div className="w-full min-h-screen flex justify-center items-center">
      {children}
    </div>
  );
};
//#endregion

export default Layout;
