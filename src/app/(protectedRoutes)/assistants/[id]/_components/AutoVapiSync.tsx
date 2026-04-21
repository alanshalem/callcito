"use client";

//#region Imports
import { syncAssistantWithVapi } from "@/actions/assistant";
import { useEffect, useRef } from "react";
//#endregion

//#region AutoVapiSync
// Fire-and-forget: llama syncAssistantWithVapi al montar la página.
// Silencioso — sin toast, sin loading. Evita que el usuario tenga que
// hacer clic en "Sincronizar con Vapi" después de deploys que cambian
// tool descriptions o system prompt defaults.
const AutoVapiSync = ({ id }: { id: string }) => {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    syncAssistantWithVapi(id).catch(() => {});
  }, [id]);

  return null;
};
//#endregion

export default AutoVapiSync;
