"use server";

//#region Imports
import { canCreateAssistant } from "@/lib/plan-limits";
import { prismaClient } from "@/lib/prismaClient";
import { assistantSchema, type AssistantInput } from "@/lib/type";
import {
  vapiCreateAssistant,
  vapiDeleteAssistant,
  vapiUpdateAssistant,
} from "@/lib/vapi";
import { revalidatePath } from "next/cache";
import { getCurrentCompany } from "./company";
//#endregion

//#region createAssistant
// 1. Crea row en DB (sin vapiAssistantId).
// 2. Llama Vapi API para crear assistant real.
// 3. Guarda vapiAssistantId.
// Si Vapi falla: la row queda en DB y se puede reintentar con `syncAssistantWithVapi`.
export async function createAssistant(input: AssistantInput) {
  const parsed = assistantSchema.safeParse(input);
  if (!parsed.success) {
    return { status: 400 as const, errors: parsed.error.flatten() };
  }
  const company = await getCurrentCompany();
  if (!company) return { status: 403 as const };

  const limit = await canCreateAssistant(company.id);
  if (!limit.allowed) return { status: 402 as const, message: limit.reason };

  let assistant;
  try {
    assistant = await prismaClient.assistant.create({
      data: {
        ...parsed.data,
        systemPromptB: parsed.data.systemPromptB ?? null,
        companyId: company.id,
      },
    });
  } catch (error) {
    console.error("[createAssistant] DB create failed", error);
    const msg = error instanceof Error ? error.message : "DB error";
    return { status: 500 as const, message: msg };
  }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
    const vapi = await vapiCreateAssistant({
      ...parsed.data,
      catalogId: "",
      baseUrl,
    });
    await prismaClient.assistant.update({
      where: { id: assistant.id },
      data: { vapiAssistantId: vapi.id },
    });
    revalidatePath("/assistants");
    return { status: 201 as const, assistantId: assistant.id };
  } catch (error) {
    console.error("[createAssistant] Vapi sync failed", error);
    const msg = error instanceof Error ? error.message : "Vapi sync failed";
    revalidatePath("/assistants");
    return { status: 207 as const, assistantId: assistant.id, message: msg };
  }
}
//#endregion

//#region updateAssistant
export async function updateAssistant(id: string, input: Partial<AssistantInput>) {
  const company = await getCurrentCompany();
  if (!company) return { status: 403 as const };

  const existing = await prismaClient.assistant.findFirst({
    where: { id, companyId: company.id },
  });
  if (!existing) return { status: 404 as const };

  const updated = await prismaClient.assistant.update({
    where: { id },
    data: input,
  });

  if (updated.vapiAssistantId) {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
      await vapiUpdateAssistant(updated.vapiAssistantId, {
        name: updated.name,
        firstMessage: updated.firstMessage,
        language: updated.language,
        voiceId: updated.voiceId,
        systemPrompt: updated.systemPrompt,
        catalogId: "",
        baseUrl,
      });
    } catch (error) {
      console.error("[updateAssistant] Vapi sync failed", error);
    }
  }

  revalidatePath("/assistants");
  revalidatePath(`/assistants/${id}`);
  return { status: 200 as const };
}
//#endregion

//#region deleteAssistant
export async function deleteAssistant(id: string) {
  const company = await getCurrentCompany();
  if (!company) return { status: 403 as const };

  const existing = await prismaClient.assistant.findFirst({
    where: { id, companyId: company.id },
  });
  if (!existing) return { status: 404 as const };

  if (existing.vapiAssistantId) {
    try {
      await vapiDeleteAssistant(existing.vapiAssistantId);
    } catch (error) {
      console.error("[deleteAssistant] Vapi delete failed (continuing)", error);
    }
  }

  await prismaClient.assistant.delete({ where: { id } });
  revalidatePath("/assistants");
  return { status: 200 as const };
}
//#endregion

//#region getAssistants
export async function getAssistants() {
  const company = await getCurrentCompany();
  if (!company) return [];
  return prismaClient.assistant.findMany({
    where: { companyId: company.id },
    include: { _count: { select: { catalogs: true, conversations: true } } },
    orderBy: { createdAt: "desc" },
  });
}
//#endregion

//#region getAssistantById
export async function getAssistantById(id: string) {
  const company = await getCurrentCompany();
  if (!company) return null;
  return prismaClient.assistant.findFirst({
    where: { id, companyId: company.id },
    include: { catalogs: true },
  });
}
//#endregion

//#region syncAssistantWithVapi
// Retry manual: crea/updatea el assistant en Vapi usando la row DB existente.
// Usa para reintentar si el create inicial falló (vapiAssistantId null).
export async function syncAssistantWithVapi(id: string) {
  const company = await getCurrentCompany();
  if (!company) return { status: 403 as const };

  const existing = await prismaClient.assistant.findFirst({
    where: { id, companyId: company.id },
  });
  if (!existing) return { status: 404 as const };

  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
    const config = {
      name: existing.name,
      language: existing.language,
      voiceId: existing.voiceId,
      firstMessage: existing.firstMessage,
      systemPrompt: existing.systemPrompt,
      catalogId: "",
      baseUrl,
    };

    if (existing.vapiAssistantId) {
      // Update existing
      await vapiUpdateAssistant(existing.vapiAssistantId, config);
    } else {
      // Create new
      const vapi = await vapiCreateAssistant(config);
      await prismaClient.assistant.update({
        where: { id },
        data: { vapiAssistantId: vapi.id },
      });
    }
    revalidatePath("/assistants");
    revalidatePath(`/assistants/${id}`);
    return { status: 200 as const };
  } catch (error) {
    console.error("[syncAssistantWithVapi]", error);
    const msg = error instanceof Error ? error.message : "Sync falló";
    return { status: 500 as const, message: msg };
  }
}
//#endregion

//#region assignAssistantToCatalog
export async function assignAssistantToCatalog(catalogId: string, assistantId: string | null) {
  const company = await getCurrentCompany();
  if (!company) return { status: 403 as const };

  await prismaClient.catalog.update({
    where: { id: catalogId, companyId: company.id },
    data: { assistantId },
  });
  revalidatePath(`/catalogs/${catalogId}`);
  return { status: 200 as const };
}
//#endregion
