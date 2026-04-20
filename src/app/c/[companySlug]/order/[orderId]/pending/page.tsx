import { Clock } from "lucide-react";

export default function OrderPendingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        <Clock className="w-16 h-16 text-amber-500 mx-auto mb-4" />
        <h1 className="text-3xl font-semibold mb-2">Pago pendiente</h1>
        <p className="text-muted-foreground">
          Estamos esperando la confirmación. Te vamos a avisar apenas se acredite.
        </p>
      </div>
    </div>
  );
}
