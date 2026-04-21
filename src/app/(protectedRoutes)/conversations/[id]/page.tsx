//#region Imports
import { getConversationById } from "@/actions/conversationList";
import { notFound } from "next/navigation";
//#endregion

export const dynamic = "force-dynamic";

//#region Types
type TranscriptMsg = { role: string; message?: string; content?: string; time?: number };
//#endregion

//#region Conversation Detail
export default async function ConversationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const conv = await getConversationById(id);
  if (!conv) notFound();

  const transcript = Array.isArray(conv.transcript) ? (conv.transcript as TranscriptMsg[]) : [];

  return (
    <div className="w-full h-full mt-8 px-6 md:px-8 lg:px-10 xl:px-12 max-w-4xl">
      <h1 className="text-primary font-semibold text-3xl mb-2">Conversación</h1>
      <div className="flex items-center gap-3 text-sm text-muted-foreground mb-6">
        <span>{conv.assistant.name}</span>
        <span>•</span>
        <span>{new Date(conv.startedAt).toLocaleString()}</span>
        <span>•</span>
        <span>{conv.status}</span>
        {conv.durationSec && (
          <>
            <span>•</span>
            <span>
              {Math.floor(conv.durationSec / 60)}:
              {String(conv.durationSec % 60).padStart(2, "0")}
            </span>
          </>
        )}
        {conv.promptVariant && (
          <>
            <span>•</span>
            <span>Variant {conv.promptVariant}</span>
          </>
        )}
      </div>

      <section className="mb-8">
        <h2 className="font-semibold mb-3">Transcripción</h2>
        {transcript.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Sin transcripción guardada. El webhook de Vapi guarda esto al cerrar el call.
          </p>
        ) : (
          <div className="space-y-3">
            {transcript.map((m, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-xl border border-border ${
                  m.role === "user" ? "bg-primary/5" : "bg-secondary/30"
                }`}
              >
                <div className="text-xs text-muted-foreground mb-1">{m.role}</div>
                <div className="text-sm whitespace-pre-wrap">{m.message ?? m.content ?? ""}</div>
              </div>
            ))}
          </div>
        )}
      </section>

      {conv.cart && conv.cart.items.length > 0 && (
        <section className="mb-8">
          <h2 className="font-semibold mb-3">Carrito</h2>
          <div className="border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-secondary">
                <tr>
                  <th className="text-left p-3">Producto</th>
                  <th className="text-right p-3">Cant.</th>
                  <th className="text-right p-3">Precio</th>
                  <th className="text-right p-3">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {conv.cart.items.map((i) => (
                  <tr key={i.id} className="border-t border-border">
                    <td className="p-3">{i.product.name}</td>
                    <td className="p-3 text-right tabular-nums">{i.quantity}</td>
                    <td className="p-3 text-right tabular-nums">{Number(i.priceSnap)}</td>
                    <td className="p-3 text-right tabular-nums">
                      {Number(i.priceSnap) * i.quantity}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {conv.cart.order && (
            <p className="mt-2 text-sm">
              Orden: <span className="text-primary">{conv.cart.order.status}</span>
              {conv.cart.order.mpCheckoutUrl && (
                <>
                  {" · "}
                  <a
                    href={conv.cart.order.mpCheckoutUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary underline"
                  >
                    Link MP
                  </a>
                </>
              )}
            </p>
          )}
        </section>
      )}
    </div>
  );
}
//#endregion
