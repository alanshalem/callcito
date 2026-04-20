//#region Imports
import { getCurrentCompany } from "@/actions/company";
import { getDictionary } from "@/i18n";
import { defaultAssistantSystemPrompt } from "@/lib/data";
import { redirect } from "next/navigation";
import AssistantForm from "../_components/AssistantForm";
//#endregion

//#region New Assistant Page
export default async function NewAssistantPage() {
  const company = await getCurrentCompany();
  if (!company) redirect("/onboarding/company");
  const t = await getDictionary();

  return (
    <div className="w-full h-full mt-8 px-6 md:px-8 lg:px-10 xl:px-12">
      <h1 className="text-primary font-semibold text-4xl mb-2">{t.assistants.newTitle}</h1>
      <p className="text-muted-foreground mb-8">{t.assistants.newDesc}</p>
      <div className="max-w-3xl">
        <AssistantForm
          defaults={{
            language: company.defaultLanguage,
            systemPrompt: defaultAssistantSystemPrompt
              .replaceAll("{companyName}", company.name)
              .replaceAll("{catalogName}", "{catalogName}")
              .replaceAll("{currency}", company.currency),
          }}
        />
      </div>
    </div>
  );
}
//#endregion
