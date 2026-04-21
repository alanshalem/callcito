//#region Vapi REST helper
// Mini client para la API REST de Vapi (crear/actualizar/borrar assistants).
// Usa solo `fetch` — evita dependencia extra y soporta Node/Edge runtime.
//
// Docs: https://docs.vapi.ai/api-reference/assistants
// Env: VAPI_PRIVATE_KEY (server-side), NEXT_PUBLIC_VAPI_PUBLIC_KEY (client widget).
const VAPI_BASE = "https://api.vapi.ai";

function headers() {
  const key = process.env.VAPI_PRIVATE_KEY;
  if (!key) throw new Error("VAPI_PRIVATE_KEY no configurada");
  return {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  };
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${VAPI_BASE}${path}`, { ...init, headers: headers() });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Vapi ${res.status}: ${text}`);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
//#endregion

//#region Types
export type VapiAssistantConfig = {
  name: string;
  firstMessage: string;
  language: string;
  voiceId: string;
  systemPrompt: string;
  catalogId: string;
  baseUrl: string;
};

export type VapiAssistant = { id: string };
//#endregion

//#region Assistant CRUD
// `model` y `voice` son objetos estructurados en Vapi. El assistant recibe los
// tools a través de `serverUrl` (callcito expone /api/vapi/tools/*).
// Metadata viaja con cada call → así los tool endpoints saben qué catálogo /
// conversación corresponde.
export async function vapiCreateAssistant(config: VapiAssistantConfig): Promise<VapiAssistant> {
  return request<VapiAssistant>("/assistant", {
    method: "POST",
    body: JSON.stringify(assistantBody(config)),
  });
}

export async function vapiUpdateAssistant(
  assistantId: string,
  config: VapiAssistantConfig
): Promise<VapiAssistant> {
  return request<VapiAssistant>(`/assistant/${assistantId}`, {
    method: "PATCH",
    body: JSON.stringify(assistantBody(config)),
  });
}

export async function vapiDeleteAssistant(assistantId: string): Promise<void> {
  await request<void>(`/assistant/${assistantId}`, { method: "DELETE" });
}

function assistantBody(c: VapiAssistantConfig) {
  return {
    name: c.name,
    firstMessage: c.firstMessage,
    model: {
      provider: "openai",
      model: "gpt-4o-mini",
      messages: [{ role: "system", content: c.systemPrompt }],
      tools: [
        toolDef("search_products", "Busca productos en el catálogo por nombre, descripción o tags.", {
          type: "object",
          properties: {
            query: { type: "string", description: "Texto a buscar" },
            maxPrice: { type: "number", description: "Precio máximo (opcional)" },
          },
          required: ["query"],
        }, c.baseUrl),
        toolDef("get_product", "Devuelve detalle de un producto por ID.", {
          type: "object",
          properties: { productId: { type: "string" } },
          required: ["productId"],
        }, c.baseUrl),
        toolDef("add_to_cart", "Agrega un producto al carrito del cliente actual.", {
          type: "object",
          properties: {
            productId: { type: "string" },
            quantity: { type: "number", default: 1 },
          },
          required: ["productId"],
        }, c.baseUrl),
        toolDef("view_cart", "Muestra el contenido actual del carrito.", {
          type: "object",
          properties: {},
        }, c.baseUrl),
        toolDef("remove_from_cart", "Saca un producto del carrito.", {
          type: "object",
          properties: { productId: { type: "string" } },
          required: ["productId"],
        }, c.baseUrl),
        toolDef("checkout", "Crea link de pago MercadoPago con los items del carrito y lo devuelve al cliente.", {
          type: "object",
          properties: {
            customerEmail: { type: "string" },
          },
          required: ["customerEmail"],
        }, c.baseUrl),
        // Built-in Vapi tool: termina el call. Assistant lo usa cuando cliente
        // se despide, después de checkout exitoso, o conversación abandonada.
        { type: "endCall" },
      ],
    },
    voice: {
      provider: "11labs",
      voiceId: c.voiceId,
      // Model multilingual para que respete acento de voz ES.
      model: "eleven_multilingual_v2",
    },
    transcriber: {
      provider: "deepgram",
      // Locale LATAM para voces argentinas/mexicanas.
      language: c.language.startsWith("es") ? "es-419" : c.language.slice(0, 2),
      // nova-2 = mejor accuracy ES; smart_format agrega mayúsculas + puntuación.
      model: "nova-2",
      smartFormat: true,
      // Endpointing ms: menor = respuesta rápida, mayor = deja terminar oraciones.
      endpointing: 200,
      keywords: ["MercadoPago", "catálogo", "carrito", "oferta"],
    },
    startSpeakingPlan: {
      waitSeconds: 0.4,
      smartEndpointingEnabled: true,
    },
    // Cortes automáticos para ahorrar tokens:
    // - silenceTimeoutSeconds: si no hay audio por X seg → Vapi corta.
    // - maxDurationSeconds: techo duro por llamada (6 min).
    silenceTimeoutSeconds: 30,
    maxDurationSeconds: 360,
    // Idle messages: reengagement antes de cortar por silencio.
    messagePlan: {
      idleMessages: [
        "¿Sigues ahí?",
        "¿Hay algo más en lo que pueda ayudarte?",
      ],
      idleTimeoutSeconds: 12,
      idleMessageMaxSpokenCount: 2,
    },
    serverUrl: `${c.baseUrl}/api/webhooks/vapi`,
    serverUrlSecret: process.env.VAPI_WEBHOOK_SECRET ?? "",
  };
}

function toolDef(
  name: string,
  description: string,
  parameters: Record<string, unknown>,
  baseUrl: string
) {
  return {
    type: "function",
    function: { name, description, parameters },
    server: {
      url: `${baseUrl}/api/vapi/tools/${name.replaceAll("_", "-")}`,
      // Secret enviado por Vapi como header `x-vapi-secret` — validado en verifyVapiSecret.
      secret: process.env.VAPI_WEBHOOK_SECRET ?? "",
    },
  };
}
//#endregion
