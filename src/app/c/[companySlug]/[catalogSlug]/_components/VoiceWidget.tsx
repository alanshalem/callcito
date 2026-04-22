"use client";

//#region Imports
import { startConversation } from "@/actions/conversation";
import { Button } from "@/components/ui/button";
import Vapi from "@vapi-ai/web";
import { Bot, Mic, MicOff, Phone, PhoneOff, ShoppingCart, User } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
//#endregion

//#region Types
type Status = "idle" | "starting" | "connected" | "ending";
type Role = "user" | "assistant";
type TranscriptItem = { id: string; role: Role; text: string };
type DisplayProduct = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  image: string | null;
};
type CartLine = { name: string; quantity: number };
type CartState = { lines: CartLine[]; totalPrice: number | null; currency: string | null };
type ConversationMessage = {
  role?: string;
  name?: string;
  result?: unknown;
  time?: number;
  [k: string]: unknown;
};
type VapiMessage =
  | { type: "transcript"; transcriptType: "partial" | "final"; role: Role; transcript: string }
  | { type: "tool-calls-result"; toolCallList?: Array<{ id: string; name: string; result?: unknown }> }
  | { type: "conversation-update"; messages?: ConversationMessage[]; conversation?: ConversationMessage[] }
  | { type: string; [k: string]: unknown };
//#endregion

//#region Component
// Full-screen Google Meet-style overlay que envuelve el Vapi SDK.
// Dos tiles (customer + assistant) con indicadores de voz, controles abajo,
// transcripción en vivo. Idle: botón flotante para iniciar.
const VoiceWidget = ({
  vapiAssistantId,
  catalogId,
  assistantDbId,
  assistantName,
  companyName,
  companyLogoUrl,
}: {
  vapiAssistantId: string;
  catalogId: string;
  assistantDbId: string;
  assistantName: string;
  companyName: string;
  companyLogoUrl?: string | null;
}) => {
  const vapiRef = useRef<Vapi | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [muted, setMuted] = useState(false);
  const [assistantSpeaking, setAssistantSpeaking] = useState(false);
  const [userSpeaking, setUserSpeaking] = useState(false);
  const [assistantVolume, setAssistantVolume] = useState(0);
  const [transcript, setTranscript] = useState<TranscriptItem[]>([]);
  const [durationSec, setDurationSec] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  // Productos que el asistente mencionó (tool call search_products/get_product).
  // Mostramos el último set en un panel lateral durante la call.
  const [spotlightProducts, setSpotlightProducts] = useState<DisplayProduct[]>([]);
  // Fade flag — true cuando estamos desvaneciendo el spotlight antes de quitarlo.
  const [spotlightFading, setSpotlightFading] = useState(false);
  // Carrito reflejado desde tool results de add_to_cart / view_cart / remove_from_cart.
  const [cart, setCart] = useState<CartState>({ lines: [], totalPrice: null, currency: null });
  // Pulse visual del cart cuando cambia (add/remove).
  const [cartPulse, setCartPulse] = useState(false);
  // Transcript parcial del speaker actual (se reemplaza continuo, no se apila).
  const [livePartial, setLivePartial] = useState<{ role: Role; text: string } | null>(null);
  // Índice del último tool_call_result procesado de conversation-update.messages[].
  // Vapi emite conversation-update entero cada turno; evitamos re-procesar
  // tools que ya vimos.
  const processedToolsRef = useRef(new Set<string>());

  // Cortar call si el user cierra tab/ventana
  useEffect(() => {
    const onUnload = () => {
      try {
        vapiRef.current?.stop();
      } catch { /* ignore */ }
    };
    window.addEventListener("beforeunload", onUnload);
    window.addEventListener("pagehide", onUnload);
    return () => {
      window.removeEventListener("beforeunload", onUnload);
      window.removeEventListener("pagehide", onUnload);
    };
  }, []);

  // Inicialización Vapi una sola vez
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY;
    if (!key) return;
    const vapi = new Vapi(key);
    vapiRef.current = vapi;

    vapi.on("call-start", () => {
      setStatus("connected");
      setStartedAt(Date.now());
    });
    vapi.on("call-end", () => {
      setStatus("idle");
      setMuted(false);
      setStartedAt(null);
      setDurationSec(0);
      setTranscript([]);
      setAssistantSpeaking(false);
      setUserSpeaking(false);
      setSpotlightProducts([]);
      setSpotlightFading(false);
      setCart({ lines: [], totalPrice: null, currency: null });
      setCartPulse(false);
      setLivePartial(null);
      processedToolsRef.current = new Set();
    });
    vapi.on("speech-start", () => setAssistantSpeaking(true));
    vapi.on("speech-end", () => setAssistantSpeaking(false));
    vapi.on("volume-level", (lvl: number) => {
      // Vapi emite volume del assistant durante TTS.
      setAssistantVolume(lvl);
    });
    vapi.on("message", (msg: VapiMessage) => {
      // TEMP: log siempre para diagnosticar si Vapi emite tool-calls-result.
      // Remover tras confirmar que ProductSpotlight funciona.
      console.log("[vapi-msg]", msg.type, msg);
      if (msg.type === "transcript") {
        const m = msg as Extract<VapiMessage, { type: "transcript" }>;
        // Solo guardamos transcripts FINALES en la historia. Los partial se
        // muestran en un slot aparte (live) que se reemplaza mientras habla.
        // Evita duplicados cuando Vapi emite partial→partial→final del mismo turno.
        if (m.transcriptType === "final") {
          setTranscript((prev) => {
            // Dedupe: si el último item ya tiene el mismo texto + role, skip.
            const last = prev[prev.length - 1];
            if (last && last.role === m.role && last.text.trim() === m.transcript.trim()) {
              return prev;
            }
            return [...prev, { id: `${Date.now()}-${Math.random()}`, role: m.role, text: m.transcript }];
          });
          if (m.role === "user") setUserSpeaking(false);
          setLivePartial(null);
        } else {
          // partial → solo en slot live
          setLivePartial({ role: m.role, text: m.transcript });
          if (m.role === "user") setUserSpeaking(true);
        }
      }

      // Vapi no emite tool-calls-result como event propio, pero los resultados
      // vienen dentro de conversation-update.messages[] con role "tool_call_result".
      // Escaneamos cada update; deduplicamos por time+name con processedToolsRef.
      if (msg.type === "conversation-update") {
        const cu = msg as Extract<VapiMessage, { type: "conversation-update" }>;
        const msgs = cu.messages ?? [];
        for (const m of msgs) {
          if (m.role !== "tool_call_result") continue;
          const key = `${m.time ?? ""}-${m.name ?? ""}`;
          if (processedToolsRef.current.has(key)) continue;
          processedToolsRef.current.add(key);
          const name = String(m.name ?? "");
          console.log("[vapi-tool-cu]", name, "raw:", m.result);
          if (name === "search_products" || name === "get_product") {
            const extracted = extractProducts(m.result);
            console.log("[vapi-tool-cu] extracted products:", extracted.length, extracted);
            if (extracted.length > 0) {
              setSpotlightProducts(extracted.slice(0, 3));
              setSpotlightFading(false);
            }
          }
          if (name === "add_to_cart" || name === "view_cart" || name === "remove_from_cart") {
            const updated = extractCart(m.result);
            console.log("[vapi-tool-cu] extracted cart:", updated);
            if (updated) {
              setCart(updated);
              setCartPulse(true);
              setTimeout(() => setCartPulse(false), 900);
            }
          }
        }
      }

      // Tool call result (legacy event type — no emite en la versión actual de Vapi).
      if (
        msg.type === "tool-calls-result" ||
        msg.type === "tool-call-result" ||
        msg.type === "function-call-result"
      ) {
        const payload = msg as {
          toolCallList?: Array<{ name?: string; result?: unknown }>;
          functionCall?: { name?: string };
          result?: unknown;
        };
        const calls =
          payload.toolCallList ??
          (payload.functionCall ? [{ name: payload.functionCall.name, result: payload.result }] : []);
        for (const c of calls) {
          const name = c.name ?? "";
          console.log("[vapi-tool]", name, "raw result:", c.result);
          if (name === "search_products" || name === "get_product") {
            const extracted = extractProducts(c.result);
            console.log("[vapi-tool] extracted products:", extracted.length, extracted);
            if (extracted.length > 0) {
              setSpotlightProducts(extracted.slice(0, 3));
              setSpotlightFading(false);
            }
          }
          if (name === "add_to_cart" || name === "view_cart" || name === "remove_from_cart") {
            const updated = extractCart(c.result);
            console.log("[vapi-tool] extracted cart:", updated);
            if (updated) {
              setCart(updated);
              setCartPulse(true);
              setTimeout(() => setCartPulse(false), 900);
            }
          }
        }
      }
      // Debug fallback: cualquier otro tipo se ignora silencioso.
    });
    vapi.on("error", (err) => {
      console.error("[vapi]", err);
      setStatus("idle");
    });

    return () => {
      vapi.stop();
    };
  }, []);

  // Timer de duración
  useEffect(() => {
    if (status !== "connected" || !startedAt) return;
    const t = setInterval(() => setDurationSec(Math.floor((Date.now() - startedAt) / 1000)), 1000);
    return () => clearInterval(t);
  }, [status, startedAt]);

  // Auto-fade ProductSpotlight: 8s después del último tool-result, arranca fade,
  // 500ms después lo quitamos. Nuevo tool-result resetea el timer (efecto reruns).
  useEffect(() => {
    if (spotlightProducts.length === 0) return;
    const fadeStart = setTimeout(() => setSpotlightFading(true), 8000);
    const clear = setTimeout(() => {
      setSpotlightProducts([]);
      setSpotlightFading(false);
    }, 8500);
    return () => {
      clearTimeout(fadeStart);
      clearTimeout(clear);
    };
  }, [spotlightProducts]);

  // `userVolume` derivado de userSpeaking: cuando habla el user, pulso fijo visual
  // (Vapi SDK no expone mic level del user). Evita setState en effect body.
  const userVolume = userSpeaking ? 0.6 : 0;

  const start = useCallback(async () => {
    if (!vapiRef.current) return;
    setStatus("starting");
    const result = await startConversation(assistantDbId, catalogId);
    if (!result) {
      setStatus("idle");
      return;
    }
    const { conversation, promptVariant } = result;
    // No overrides de model: Vapi exige `provider` + `model` completos y el
    // assistant ya está configurado server-side via vapiCreateAssistant.
    // A/B variants: tracked en DB (promptVariant) pero no cambia prompt live.
    await vapiRef.current.start(vapiAssistantId, {
      metadata: { conversationId: conversation.id, catalogId, promptVariant },
    } as never);
  }, [assistantDbId, catalogId, vapiAssistantId]);

  const stop = useCallback(() => {
    setStatus("ending");
    vapiRef.current?.stop();
  }, []);

  const toggleMute = useCallback(() => {
    if (!vapiRef.current) return;
    const next = !muted;
    vapiRef.current.setMuted(next);
    setMuted(next);
  }, [muted]);

  const durationLabel = useMemo(() => {
    const m = Math.floor(durationSec / 60).toString().padStart(2, "0");
    const s = (durationSec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }, [durationSec]);

  // ===== Idle = botón flotante
  if (status === "idle") {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button size="lg" onClick={start} className="rounded-full shadow-2xl h-14 px-6">
          <Phone className="w-5 h-5 mr-2" /> Hablar con asistente
        </Button>
      </div>
    );
  }

  // ===== Connecting / Ending
  if (status === "starting" || status === "ending") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <p className="text-muted-foreground">
            {status === "starting" ? "Conectando..." : "Cerrando..."}
          </p>
        </div>
      </div>
    );
  }

  // ===== In-call = Full-screen Meet layout
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      {/* Top bar */}
      <header className="h-14 border-b border-border px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {companyLogoUrl ? (
            <img src={companyLogoUrl} alt={companyName} className="w-8 h-8 rounded" />
          ) : (
            <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
              <Bot className="w-4 h-4 text-primary" />
            </div>
          )}
          <div>
            <div className="font-semibold text-sm">{companyName}</div>
            <div className="text-xs text-muted-foreground">{assistantName}</div>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-secondary text-xs font-mono">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          {durationLabel}
        </div>
      </header>

      {/* Participant tiles + product spotlight */}
      <main className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3 p-3 md:p-6 overflow-hidden">
        <ParticipantTile
          label="Tú"
          icon={<User className="w-16 h-16 opacity-80" />}
          speaking={userSpeaking}
          muted={muted}
          volume={userVolume}
          variant="user"
        />
        {spotlightProducts.length > 0 ? (
          <ProductSpotlight
            products={spotlightProducts}
            assistantName={assistantName}
            fading={spotlightFading}
          />
        ) : (
          <ParticipantTile
            label={assistantName}
            icon={<Bot className="w-16 h-16 opacity-80" />}
            speaking={assistantSpeaking}
            muted={false}
            volume={assistantVolume}
            variant="assistant"
          />
        )}
      </main>

      {/* Cart widget: esquina inferior izquierda, muestra items del carrito live */}
      {cart.lines.length > 0 && (
        <div
          className={`absolute left-4 top-20 z-40 w-64 bg-background/95 backdrop-blur border rounded-xl p-3 shadow-lg animate-in slide-in-from-left fade-in duration-300 transition-all ${
            cartPulse ? "border-primary ring-2 ring-primary/50" : "border-border"
          }`}
        >
          <div className="flex items-center gap-2 mb-2 text-sm font-semibold">
            <ShoppingCart className="w-4 h-4 text-primary" />
            Carrito ({cart.lines.reduce((a, i) => a + i.quantity, 0)})
          </div>
          <ul className="text-xs space-y-1 max-h-48 overflow-y-auto scrollbar-hide">
            {cart.lines.map((it, i) => (
              <li key={i} className="flex justify-between gap-2">
                <span className="truncate">{it.name}</span>
                <span className="text-muted-foreground tabular-nums shrink-0">×{it.quantity}</span>
              </li>
            ))}
          </ul>
          {cart.totalPrice !== null && (
            <div className="mt-2 pt-2 border-t border-border flex justify-between text-xs font-semibold">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="tabular-nums">
                ${cart.totalPrice.toLocaleString()}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Transcript overlay: últimos 4 finales + partial actual en italic */}
      {(transcript.length > 0 || livePartial) && (
        <div className="absolute left-4 right-4 md:left-1/2 md:right-auto md:-translate-x-1/2 md:max-w-2xl bottom-24 max-h-48 overflow-y-auto bg-background/90 backdrop-blur border border-border rounded-xl p-3 text-sm scrollbar-hide">
          {transcript.slice(-4).map((t) => (
            <div key={t.id} className="mb-1 last:mb-0">
              <span className={t.role === "user" ? "text-primary font-medium" : "text-muted-foreground font-medium"}>
                {t.role === "user" ? "Tú" : assistantName}:
              </span>{" "}
              <span>{t.text}</span>
            </div>
          ))}
          {livePartial && (
            <div className="mt-1 italic opacity-60">
              <span className={livePartial.role === "user" ? "text-primary font-medium" : "text-muted-foreground font-medium"}>
                {livePartial.role === "user" ? "Tú" : assistantName}:
              </span>{" "}
              <span>{livePartial.text}</span>
            </div>
          )}
        </div>
      )}

      {/* Bottom controls */}
      <footer className="h-20 border-t border-border flex items-center justify-center gap-3">
        <Button
          size="icon"
          variant={muted ? "destructive" : "secondary"}
          onClick={toggleMute}
          className="rounded-full w-12 h-12"
          aria-label={muted ? "Desmutear" : "Mutear"}
        >
          {muted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </Button>
        <Button
          size="icon"
          variant="destructive"
          onClick={stop}
          className="rounded-full w-14 h-14"
          aria-label="Cortar"
        >
          <PhoneOff className="w-6 h-6" />
        </Button>
      </footer>
    </div>
  );
};
//#endregion

//#region extractCart
// Parsea result de add_to_cart / view_cart / remove_from_cart → CartState.
// Shapes soportados:
//  - add_to_cart/remove_from_cart: { success, cart: ["2× nombre"], cartTotalItems, cartTotalPrice }
//  - view_cart: { items: [{ name, quantity, price, subtotal }], total, currency }
function extractCart(result: unknown): CartState | null {
  let data: unknown = result;
  if (typeof result === "string") {
    try { data = JSON.parse(result); } catch { return null; }
  }
  if (!data || typeof data !== "object") return null;
  const d = data as Record<string, unknown>;

  if (Array.isArray(d.cart)) {
    const lines = (d.cart as string[]).map((s) => {
      const m = /^(\d+)×\s*(.+)$/.exec(s);
      return m ? { quantity: Number(m[1]), name: m[2] } : { quantity: 1, name: s };
    });
    const totalPrice =
      typeof d.cartTotalPrice === "number" ? d.cartTotalPrice : null;
    return { lines, totalPrice, currency: null };
  }
  if (Array.isArray(d.items)) {
    const lines = (d.items as Array<{ name?: unknown; quantity?: unknown }>).map((it) => ({
      name: String(it.name ?? ""),
      quantity: Number(it.quantity ?? 1),
    }));
    const totalPrice = typeof d.total === "number" ? d.total : null;
    const currency = typeof d.currency === "string" ? d.currency : null;
    return { lines, totalPrice, currency };
  }
  return null;
}
//#endregion

//#region extractProducts
// Tool result puede ser: string JSON, array plano, o nested object.
// Normalizamos a DisplayProduct[].
function extractProducts(result: unknown): DisplayProduct[] {
  let data: unknown = result;
  if (typeof result === "string") {
    try { data = JSON.parse(result); } catch { return []; }
  }
  const arr = Array.isArray(data) ? data : [data];
  return arr
    .filter((x): x is Record<string, unknown> => !!x && typeof x === "object")
    .map((p) => ({
      id: String(p.id ?? ""),
      name: String(p.name ?? ""),
      description: p.description == null ? null : String(p.description),
      price: Number(p.price ?? 0),
      currency: String(p.currency ?? "ARS"),
      image: Array.isArray(p.images) && p.images[0] ? String(p.images[0]) : null,
    }))
    .filter((p) => p.id && p.name);
}
//#endregion

//#region ProductSpotlight
function ProductSpotlight({
  products,
  assistantName,
  fading,
}: {
  products: DisplayProduct[];
  assistantName: string;
  fading: boolean;
}) {
  return (
    <div
      key={products.map((p) => p.id).join(",")}
      className={`relative rounded-2xl bg-secondary p-4 overflow-y-auto animate-in slide-in-from-right fade-in duration-300 transition-opacity duration-500 ${
        fading ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="flex items-center gap-2 mb-3 text-xs text-muted-foreground">
        <Bot className="w-4 h-4" /> {assistantName} te muestra:
      </div>
      <div className="flex flex-col gap-3">
        {products.map((p) => (
          <div key={p.id} className="flex gap-3 p-3 rounded-xl bg-background border border-border">
            {p.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.image} alt={p.name} className="w-20 h-20 rounded-lg object-cover shrink-0" />
            ) : (
              <div className="w-20 h-20 rounded-lg bg-secondary shrink-0 flex items-center justify-center">
                <Bot className="w-6 h-6 text-muted-foreground" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="font-semibold truncate">{p.name}</div>
              {p.description && (
                <div className="text-xs text-muted-foreground line-clamp-2 mb-1">{p.description}</div>
              )}
              <div className="text-sm font-semibold">
                {p.currency} {p.price.toLocaleString()}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
//#endregion

//#region ParticipantTile
function ParticipantTile({
  label,
  icon,
  speaking,
  muted,
  volume,
  variant,
}: {
  label: string;
  icon: React.ReactNode;
  speaking: boolean;
  muted: boolean;
  volume: number;
  variant: "user" | "assistant";
}) {
  const ringScale = 1 + Math.min(volume, 1) * 0.15;
  return (
    <div
      className={`relative rounded-2xl bg-secondary flex items-center justify-center overflow-hidden transition-all ${
        speaking ? "ring-2 ring-primary" : ""
      }`}
    >
      <div
        className="absolute inset-10 rounded-full bg-primary/5 transition-transform duration-150"
        style={{ transform: `scale(${ringScale})`, opacity: speaking ? 0.8 : 0 }}
      />
      <div className="relative flex flex-col items-center gap-3">
        <div
          className={`w-32 h-32 rounded-full flex items-center justify-center ${
            variant === "user" ? "bg-background" : "bg-primary/10"
          }`}
        >
          {icon}
        </div>
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{label}</span>
          {muted && <MicOff className="w-4 h-4 text-destructive" />}
        </div>
      </div>
    </div>
  );
}
//#endregion

export default VoiceWidget;
