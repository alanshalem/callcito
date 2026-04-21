"use client";

//#region Imports
import { Button } from "@/components/ui/button";
import { useOrganizationList } from "@clerk/nextjs";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
//#endregion

//#region CreateAnotherButton
// Para crear nueva empresa hay que salir de la Org actual (orgId = null en session)
// para que `/onboarding/company` no redirija a `/home`.
const CreateAnotherButton = () => {
  const router = useRouter();
  const { setActive, isLoaded } = useOrganizationList();
  const [clicking, setClicking] = useState(false);

  const go = async () => {
    setClicking(true);
    try {
      if (setActive && isLoaded) {
        await setActive({ organization: null });
      }
      router.push("/onboarding/company");
    } finally {
      setClicking(false);
    }
  };

  return (
    <Button onClick={go} disabled={clicking}>
      <Plus className="w-4 h-4 mr-2" />
      {clicking ? "..." : "Nueva empresa"}
    </Button>
  );
};
//#endregion

export default CreateAnotherButton;
