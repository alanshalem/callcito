"use client";

//#region Imports
import { createProduct, updateProduct } from "@/actions/product";
import ImageUpload from "@/components/ReusableComponent/ImageUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useT } from "@/i18n/client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
//#endregion

//#region Types
// Plain shape — Decimal de Prisma no cruza el boundary server→client.
export type EditingProduct = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  sku: string | null;
  stock: number | null;
  tags: string[];
  images: string[];
  isActive: boolean;
};
//#endregion

//#region Component
const ProductForm = ({
  catalogId,
  editing,
}: {
  catalogId: string;
  editing?: EditingProduct;
}) => {
  const router = useRouter();
  const t = useT();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(editing?.name ?? "");
  const [description, setDescription] = useState(editing?.description ?? "");
  const [price, setPrice] = useState(editing ? String(editing.price) : "");
  const [sku, setSku] = useState(editing?.sku ?? "");
  const [stock, setStock] = useState(editing?.stock != null ? String(editing.stock) : "");
  const [tags, setTags] = useState(editing?.tags.join(", ") ?? "");
  const [imageUrl, setImageUrl] = useState(editing?.images[0] ?? "");
  const [isActive, setIsActive] = useState(editing?.isActive ?? true);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const data = {
        name,
        description: description || undefined,
        price: Number(price),
        currency: "ARS" as const,
        sku: sku || undefined,
        stock: stock ? Number(stock) : undefined,
        tags: tags ? tags.split(",").map((s) => s.trim()).filter(Boolean) : [],
        images: imageUrl ? [imageUrl] : [],
        isActive,
      };

      if (editing) {
        const res = await updateProduct(editing.id, data);
        if (res.status !== 200) {
          toast.error(t.products.form.error);
          return;
        }
        toast.success(t.catalogs.saved);
        router.push(`/catalogs/${catalogId}`);
        router.refresh();
        return;
      }

      const res = await createProduct(catalogId, data);
      if (res.status !== 201) {
        toast.error(t.products.form.error);
        return;
      }
      toast.success(t.products.form.success);
      router.push(`/catalogs/${catalogId}`);
      router.refresh();
    });
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div>
        <Label htmlFor="name">{t.products.form.name}</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>

      <div>
        <Label htmlFor="description">{t.products.form.description}</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="price">{t.products.form.price}</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            min="0"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="stock">{t.products.form.stock}</Label>
          <Input
            id="stock"
            type="number"
            min="0"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            placeholder={t.products.form.stockPlaceholder}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="sku">{t.products.form.sku}</Label>
        <Input id="sku" value={sku} onChange={(e) => setSku(e.target.value)} />
      </div>

      <div>
        <Label htmlFor="tags">{t.products.form.tags}</Label>
        <Input
          id="tags"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder={t.products.form.tagsPlaceholder}
        />
      </div>

      <div>
        <Label>{t.products.form.imageUrl}</Label>
        <ImageUpload value={imageUrl || null} onChange={(url) => setImageUrl(url ?? "")} />
      </div>

      <div className="flex items-center gap-2">
        <Switch id="isActive" checked={isActive} onCheckedChange={setIsActive} />
        <Label htmlFor="isActive" className="mb-0">
          {t.products.form.active}
        </Label>
      </div>

      <Button type="submit" disabled={isPending || !name || !price}>
        {isPending
          ? editing
            ? t.common.saving
            : t.common.creating
          : editing
            ? t.common.save
            : t.products.form.submit}
      </Button>
    </form>
  );
};
//#endregion

export default ProductForm;
