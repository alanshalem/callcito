"use client";

//#region Imports
import { Button } from "@/components/ui/button";
import { useT } from "@/i18n/client";
import { FileSpreadsheet, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
//#endregion

//#region Types
type ImportResult = {
  status: number;
  created?: number;
  errors?: { row: number; error: string }[];
};
//#endregion

//#region Component
const ImportForm = ({ catalogId }: { catalogId: string }) => {
  const router = useRouter();
  const t = useT();
  const [isPending, startTransition] = useTransition();
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "text/csv": [".csv"],
    },
    maxFiles: 1,
    onDrop: (accepted) => {
      if (accepted[0]) {
        setFile(accepted[0]);
        setResult(null);
      }
    },
  });

  const onSubmit = () => {
    if (!file) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("catalogId", catalogId);

      const res = await fetch("/api/products/import", { method: "POST", body: fd });
      const data: ImportResult & { error?: string } = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? t.products.import.parseError);
        return;
      }

      setResult(data);
      toast.success(`${data.created ?? 0} ${t.products.import.imported}`);
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col gap-4">
      {!file ? (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
            isDragActive ? "border-primary bg-primary/5" : "border-border"
          }`}
        >
          <input {...getInputProps()} />
          <FileSpreadsheet className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="mb-2">
            {isDragActive ? t.products.import.dropzoneActive : t.products.import.dropzoneIdle}
          </p>
          <p className="text-xs text-muted-foreground">{t.products.import.fileTypes}</p>
        </div>
      ) : (
        <div className="flex items-center justify-between p-4 border border-border rounded-xl">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="w-5 h-5" />
            <div>
              <div className="font-medium">{file.name}</div>
              <div className="text-xs text-muted-foreground">
                {(file.size / 1024).toFixed(1)} KB
              </div>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setFile(null)}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      {result && (
        <div className="p-4 border border-border rounded-xl bg-secondary/30 text-sm">
          <p className="font-semibold mb-1">
            {result.created ?? 0} {t.products.import.imported}
          </p>
          {result.errors?.length ? (
            <details className="text-xs text-muted-foreground">
              <summary className="cursor-pointer">
                {result.errors.length} {t.products.import.errorsSummary}
              </summary>
              <ul className="mt-2 max-h-40 overflow-y-auto">
                {result.errors.slice(0, 100).map((e) => (
                  <li key={e.row}>
                    {e.row}: {e.error}
                  </li>
                ))}
              </ul>
            </details>
          ) : null}
        </div>
      )}

      <Button disabled={!file || isPending} onClick={onSubmit}>
        {isPending ? t.products.import.importing : t.products.import.importBtn}
      </Button>
    </div>
  );
};
//#endregion

export default ImportForm;
