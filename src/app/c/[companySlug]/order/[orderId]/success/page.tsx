//#region Imports
import { getOrderById } from "@/actions/order";
import { CheckCircle } from "lucide-react";
import { notFound } from "next/navigation";
//#endregion

export default async function OrderSuccessPage({
  params,
}: {
  params: Promise<{ companySlug: string; orderId: string }>;
}) {
  const { orderId } = await params;
  const order = await getOrderById(orderId);
  if (!order) notFound();

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h1 className="text-3xl font-semibold mb-2">¡Pago recibido!</h1>
        <p className="text-muted-foreground mb-6">
          Total: {order.currency} {Number(order.totalAmount).toLocaleString()}
        </p>
        <p className="text-sm text-muted-foreground">
          Te contactaremos al email {order.customerEmail} para confirmar la entrega.
        </p>
      </div>
    </div>
  );
}
