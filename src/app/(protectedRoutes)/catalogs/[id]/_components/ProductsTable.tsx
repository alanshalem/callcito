"use client";

//#region Imports
import { deleteProduct } from "@/actions/product";
import { Button } from "@/components/ui/button";
import { useT } from "@/i18n/client";
import { Edit, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";
//#endregion

//#region Types
// Shape plano serializable — Prisma.Decimal no cruza el Server→Client boundary.
// Las pages server-side convierten `price: Decimal` → `number` antes de pasar.
export type ProductTableRow = {
  id: string;
  name: string;
  description: string | null;
  sku: string | null;
  price: number;
  currency: string;
  stock: number | null;
  isActive: boolean;
};
//#endregion

//#region Component
const ProductsTable = ({
  products: initial,
  catalogId,
}: {
  products: ProductTableRow[];
  catalogId: string;
}) => {
  const t = useT();
  const [products, setProducts] = useState(initial);
  const [isPending, startTransition] = useTransition();

  const onDelete = (id: string) => {
    if (!confirm(t.products.table.deleteConfirm)) return;
    startTransition(async () => {
      const res = await deleteProduct(id);
      if (res.status === 200) {
        setProducts((prev) => prev.filter((p) => p.id !== id));
        toast.success(t.products.table.deleted);
      } else {
        toast.error(t.products.table.deleteError);
      }
    });
  };

  if (products.length === 0) {
    return (
      <div className="p-8 border border-dashed rounded-xl text-center text-muted-foreground">
        {t.products.table.empty}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border border-border rounded-xl">
      <table className="w-full text-sm">
        <thead className="bg-secondary">
          <tr>
            <th className="text-left p-3">{t.products.table.name}</th>
            <th className="text-left p-3">{t.products.table.sku}</th>
            <th className="text-right p-3">{t.products.table.price}</th>
            <th className="text-right p-3">{t.products.table.stock}</th>
            <th className="text-center p-3">{t.products.table.active}</th>
            <th className="text-right p-3">{t.common.actions}</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id} className="border-t border-border">
              <td className="p-3">
                <div className="font-medium">{p.name}</div>
                {p.description && (
                  <div className="text-xs text-muted-foreground line-clamp-1">{p.description}</div>
                )}
              </td>
              <td className="p-3 text-muted-foreground">{p.sku || "—"}</td>
              <td className="p-3 text-right tabular-nums">
                {p.currency} {p.price.toLocaleString()}
              </td>
              <td className="p-3 text-right tabular-nums">{p.stock ?? "∞"}</td>
              <td className="p-3 text-center">{p.isActive ? "✓" : "—"}</td>
              <td className="p-3 text-right">
                <div className="flex justify-end gap-1">
                  <Button variant="ghost" size="icon" asChild>
                    <Link href={`/catalogs/${catalogId}/products/${p.id}/edit`}>
                      <Edit className="w-4 h-4" />
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(p.id)}
                    disabled={isPending}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
//#endregion

export default ProductsTable;
