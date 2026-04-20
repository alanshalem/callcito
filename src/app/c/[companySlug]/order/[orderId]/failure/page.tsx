import { XCircle } from "lucide-react";

export default function OrderFailurePage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        <XCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
        <h1 className="text-3xl font-semibold mb-2">Pago rechazado</h1>
        <p className="text-muted-foreground">
          El pago no se pudo procesar. Reintentá desde el asistente o contactá al comercio.
        </p>
      </div>
    </div>
  );
}
