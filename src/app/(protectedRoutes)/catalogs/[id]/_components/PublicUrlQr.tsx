"use client";

//#region Imports
import { Button } from "@/components/ui/button";
import { Copy, QrCode } from "lucide-react";
import { useState } from "react";
import QRCode from "react-qr-code";
import { toast } from "sonner";
//#endregion

//#region PublicUrlQr
// Mostra URL pública + QR para compartir (tienda física, flyer, etc).
const PublicUrlQr = ({ url }: { url: string }) => {
  const [showQr, setShowQr] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(url);
    toast.success("URL copiada");
  };

  return (
    <div className="flex flex-col gap-3 p-4 border border-border rounded-xl bg-secondary/30">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-mono truncate">{url}</span>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={copy}>
            <Copy className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setShowQr((s) => !s)}>
            <QrCode className="w-4 h-4" />
          </Button>
        </div>
      </div>
      {showQr && (
        <div className="bg-white p-4 rounded-lg self-start">
          <QRCode value={url} size={180} />
        </div>
      )}
    </div>
  );
};
//#endregion

export default PublicUrlQr;
