"use server";

//#region Imports
import { canStartConversation } from "@/lib/plan-limits";
import { prismaClient } from "@/lib/prismaClient";
//#endregion

//#region startConversation (public — sin auth)
// Llamado desde el widget Vapi al iniciar call.
// - Valida ownership (assistant & catalog misma company, catalog publicado).
// - Chequea límite de conversaciones/mes del plan activo.
// - Elige variant A/B si el asistente tiene systemPromptB (coin flip).
// Returns { conversation, variantPrompt } o null.
export async function startConversation(assistantId: string, catalogId: string) {
  try {
    const assistant = await prismaClient.assistant.findUnique({
      where: { id: assistantId },
      select: { id: true, companyId: true, systemPrompt: true, systemPromptB: true },
    });
    if (!assistant) return null;

    const catalog = await prismaClient.catalog.findUnique({
      where: { id: catalogId },
      select: { id: true, companyId: true, isPublished: true },
    });
    if (!catalog || !catalog.isPublished || catalog.companyId !== assistant.companyId) {
      return null;
    }

    const limit = await canStartConversation(assistant.companyId);
    if (!limit.allowed) {
      console.warn("[startConversation] limit reached", limit.reason);
      return null;
    }

    const useB = !!assistant.systemPromptB && Math.random() < 0.5;
    const promptVariant = useB ? "B" : "A";
    const variantPrompt = useB ? assistant.systemPromptB! : assistant.systemPrompt;

    const conversation = await prismaClient.conversation.create({
      data: { assistantId, catalogId, status: "ACTIVE", promptVariant },
    });
    return { conversation, variantPrompt, promptVariant };
  } catch (error) {
    console.error("[startConversation]", error);
    return null;
  }
}
//#endregion

//#region attachVapiCallId
// Llamado desde webhook `call-start` de Vapi para bindear call.id con nuestra Conversation.
// Buscamos por metadata.conversationId.
export async function attachVapiCallId(conversationId: string, vapiCallId: string) {
  try {
    await prismaClient.conversation.update({
      where: { id: conversationId },
      data: { vapiCallId },
    });
    return true;
  } catch (error) {
    console.error("[attachVapiCallId]", error);
    return false;
  }
}
//#endregion
