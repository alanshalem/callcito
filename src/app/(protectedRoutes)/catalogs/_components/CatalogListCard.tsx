"use client";

//#region Imports
import { deleteCatalog } from "@/actions/catalog";
import { Button } from "@/components/ui/button";
import { useT } from "@/i18n/client";
import { Edit, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
//#endregion

//#region Types
type Catalog = {
  id: string;
  name: string;
  description: string | null;
  isPublished: boolean;
  productsCount: number;
  assistantName: string | null;
};
//#endregion

//#region CatalogListCard
// Card clicable → detail. Botones edit/delete con stopPropagation.
const CatalogListCard = ({ catalog }: { catalog: Catalog }) => {
  const router = useRouter();
  const t = useT();
  const [pending, startTransition] = useTransition();

  const onDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const ok = confirm(`${t.catalogs.deleteConfirm}\n\n"${catalog.name}"`);
    if (!ok) return;
    startTransition(async () => {
      const res = await deleteCatalog(catalog.id);
      if (res.status !== 200) {
        toast.error(("message" in res ? res.message : null) ?? t.catalogs.deleteError);
        return;
      }
      toast.success(t.catalogs.deleted);
      router.refresh();
    });
  };

  return (
    <div className="group relative p-6 rounded-xl border border-border hover:bg-secondary transition-colors">
      <Link href={`/catalogs/${catalog.id}`} className="block">
        <div className="flex items-center justify-between mb-2 pr-20">
          <h3 className="font-semibold text-lg text-primary truncate">{catalog.name}</h3>
          <span
            className={`text-xs px-2 py-1 rounded-md shrink-0 ml-2 ${
              catalog.isPublished
                ? "bg-green-500/10 text-green-500"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {catalog.isPublished ? t.common.published : t.common.draft}
          </span>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
          {catalog.description || "—"}
        </p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
          <span>
            {catalog.productsCount} {t.catalogs.productsCount}
          </span>
          {catalog.assistantName && <span>• {catalog.assistantName}</span>}
        </div>
      </Link>

      <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="ghost" size="icon" asChild className="h-8 w-8 bg-background/80 backdrop-blur">
          <Link href={`/catalogs/${catalog.id}/edit`}>
            <Edit className="w-4 h-4" />
          </Link>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onDelete}
          disabled={pending}
          className="h-8 w-8 bg-background/80 backdrop-blur hover:bg-destructive hover:text-destructive-foreground"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
//#endregion

export default CatalogListCard;
