"use client";

//#region Imports
import { Button } from "@/components/ui/button";
import { upload } from "@vercel/blob/client";
import { ImageIcon, Loader2, X } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";
import { toast } from "sonner";
//#endregion

//#region Types
type Props = {
  value: string | null;
  onChange: (url: string | null) => void;
  label?: string;
  aspect?: "square" | "banner";
};
//#endregion

//#region ImageUpload
// Selecciona archivo → sube a Vercel Blob → devuelve URL pública.
// `value`: URL actual o null. `onChange` dispara al completar.
// Uso: <ImageUpload value={url} onChange={setUrl} />
const ImageUpload = ({ value, onChange, label = "Subir imagen", aspect = "square" }: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const blob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/blob/upload",
        contentType: file.type,
      });
      onChange(blob.url);
      toast.success("Imagen subida");
    } catch (error) {
      console.error("[ImageUpload]", error);
      toast.error(error instanceof Error ? error.message : "Error al subir");
    } finally {
      setUploading(false);
    }
  };

  const clear = () => {
    onChange(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const aspectClass = aspect === "banner" ? "aspect-video" : "aspect-square";

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
      {value ? (
        <div className={`relative ${aspectClass} w-full max-w-xs rounded-xl overflow-hidden border border-border`}>
          <Image src={value} alt="preview" fill className="object-cover" />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            onClick={clear}
            className="absolute top-2 right-2 w-7 h-7"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className={`${aspectClass} w-full max-w-xs rounded-xl border-2 border-dashed border-border hover:border-primary transition-colors flex flex-col items-center justify-center gap-2 text-muted-foreground disabled:opacity-50`}
        >
          {uploading ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="text-xs">Subiendo...</span>
            </>
          ) : (
            <>
              <ImageIcon className="w-8 h-8" />
              <span className="text-xs">{label}</span>
              <span className="text-[10px]">PNG/JPG/WEBP · max 5MB</span>
            </>
          )}
        </button>
      )}
    </div>
  );
};
//#endregion

export default ImageUpload;
