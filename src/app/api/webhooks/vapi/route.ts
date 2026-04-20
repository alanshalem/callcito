//#region Imports
import { prismaClient } from "@/lib/prismaClient";
import { verifyVapiSecret } from "@/lib/vapi-tool-helpers";
//#endregion

//#region Vapi Webhook — end-of-call-report + status updates
// Vapi manda varios tipos: tool-calls (manejados en /api/vapi/tools/*),
// status-update, end-of-call-report, etc. Acá cerramos la Conversation
// y guardamos transcript + duración.
export async function POST(req: Request) {
  if (!verifyVapiSecret(req)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = await req.json() as {
    message?: {
      type?: string;
      call?: { id?: string; assistantOverrides?: { metadata?: Record<string, unknown> }; metadata?: Record<string, unknown> };
      transcript?: unknown;
      durationSeconds?: number;
      endedReason?: string;
    };
  };
  const msg = body.message;
  if (!msg?.type) return new Response("ok");

  const callId = msg.call?.id;
  if (!callId) return new Response("ok");

  // status-update con type="status-update" y msg.call.status === "in-progress"
  // coincide con `call-start`. Extraemos conversationId de metadata para bindear.
  if (msg.type === "status-update" || msg.type === "call-start") {
    const meta = msg.call?.metadata ?? msg.call?.assistantOverrides?.metadata;
    const conversationId = typeof meta?.conversationId === "string" ? meta.conversationId : null;
    if (conversationId) {
      await prismaClient.conversation.updateMany({
        where: { id: conversationId, vapiCallId: null },
        data: { vapiCallId: callId },
      });
    }
  }

  if (msg.type === "end-of-call-report") {
    await prismaClient.conversation.updateMany({
      where: { vapiCallId: callId },
      data: {
        status: "ENDED",
        transcript: msg.transcript as never,
        durationSec: msg.durationSeconds ?? null,
        endedAt: new Date(),
      },
    });
  }

  return new Response("ok");
}
//#endregion
