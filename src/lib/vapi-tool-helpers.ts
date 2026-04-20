//#region Vapi Tool Helpers
// Compartidos entre los endpoints de /api/vapi/tools/*.
// Vapi manda todo en POST con shape:
//   { message: { type: "tool-calls", toolCallList, call: { id, assistantId } } }
// Respondemos con { results: [{ toolCallId, result }] }.

export type VapiToolCall = {
  id: string;
  function: { name: string; arguments: string };
};

export type VapiMessage = {
  type: string;
  toolCallList?: VapiToolCall[];
  call?: { id?: string; assistantId?: string };
  metadata?: Record<string, unknown>;
};

export type VapiToolRequest = {
  message?: VapiMessage;
};

export async function parseToolRequest(req: Request): Promise<{
  body: VapiToolRequest;
  toolCall: VapiToolCall | null;
  args: Record<string, unknown>;
  callId: string | null;
}> {
  const body = (await req.json()) as VapiToolRequest;
  const toolCall = body.message?.toolCallList?.[0] ?? null;
  let args: Record<string, unknown> = {};
  if (toolCall?.function.arguments) {
    try {
      args = JSON.parse(toolCall.function.arguments);
    } catch {
      args = {};
    }
  }
  return {
    body,
    toolCall,
    args,
    callId: body.message?.call?.id ?? null,
  };
}

export function verifyVapiSecret(req: Request): boolean {
  const secret = process.env.VAPI_WEBHOOK_SECRET;
  if (!secret) return true; // dev-friendly; en prod setear siempre
  return req.headers.get("x-vapi-secret") === secret;
}

export function toolResult(toolCallId: string | undefined, result: unknown) {
  return Response.json({
    results: [
      {
        toolCallId: toolCallId ?? "unknown",
        result: typeof result === "string" ? result : JSON.stringify(result),
      },
    ],
  });
}

export function toolError(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}
//#endregion
