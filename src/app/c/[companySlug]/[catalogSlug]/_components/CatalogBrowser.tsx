"use client";

//#region Imports
import { Input } from "@/components/ui/input";
import { Package, Search } from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";
//#endregion

//#region Types
export type PublicItem = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  stock: number | null;
  sku: string | null;
  tags: string[];
  image: string | null;
};
//#endregion

//#region CatalogBrowser
// Client component: search + filtro por tag + grid responsivo.
const CatalogBrowser = ({ items }: { items: PublicItem[] }) => {
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);

  // Top 10 tags más frecuentes
  const topTags = useMemo(() => {
    const counts = new Map<string, number>();
    items.forEach((it) => it.tags.forEach((t) => counts.set(t, (counts.get(t) ?? 0) + 1)));
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag]) => tag);
  }, [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((it) => {
      if (activeTag && !it.tags.includes(activeTag)) return false;
      if (!q) return true;
      return (
        it.name.toLowerCase().includes(q) ||
        it.description?.toLowerCase().includes(q) ||
        it.sku?.toLowerCase().includes(q) ||
        it.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [items, query, activeTag]);

  return (
    <>
      {/* Search + filter bar */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur pb-4 mb-6">
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar productos, SKU, tags..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10 h-11"
          />
        </div>
        {topTags.length > 0 && (
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            <TagChip label="Todos" active={activeTag === null} onClick={() => setActiveTag(null)} />
            {topTags.map((tag) => (
              <TagChip
                key={tag}
                label={tag}
                active={activeTag === tag}
                onClick={() => setActiveTag(activeTag === tag ? null : tag)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground text-sm">
          No encontramos productos que coincidan.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filtered.map((p) => (
            <ProductCard key={p.id} p={p} />
          ))}
        </div>
      )}
    </>
  );
};
//#endregion

//#region ProductCard
function ProductCard({ p }: { p: PublicItem }) {
  const outOfStock = p.stock !== null && p.stock === 0;
  return (
    <div className="group rounded-xl border border-border bg-secondary/30 overflow-hidden hover:border-primary/50 transition-colors flex flex-col">
      <div className="aspect-square relative bg-secondary overflow-hidden">
        {p.image ? (
          <Image
            src={p.image}
            alt={p.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-10 h-10 text-muted-foreground" />
          </div>
        )}
        {outOfStock && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
            <span className="text-xs font-semibold px-2 py-1 rounded bg-destructive/20 text-destructive">
              Sin stock
            </span>
          </div>
        )}
      </div>
      <div className="p-3 flex flex-col gap-1 flex-1">
        <h3 className="font-semibold text-sm line-clamp-2 leading-snug">{p.name}</h3>
        {p.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{p.description}</p>
        )}
        <div className="mt-auto pt-2 flex items-baseline justify-between">
          <span className="font-bold">
            {p.currency} {p.price.toLocaleString()}
          </span>
          {p.stock !== null && p.stock > 0 && p.stock < 10 && (
            <span className="text-xs text-amber-500">Quedan {p.stock}</span>
          )}
        </div>
      </div>
    </div>
  );
}
//#endregion

//#region TagChip
function TagChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
        active
          ? "bg-primary text-primary-foreground"
          : "bg-secondary text-muted-foreground hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );
}
//#endregion

export default CatalogBrowser;
