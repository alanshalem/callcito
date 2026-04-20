"use client";

//#region Imports
import { createCatalog, updateCatalog } from "@/actions/catalog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useT } from "@/i18n/client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
//#endregion

//#region Helpers
function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}
//#endregion

//#region Types
type EditingCatalog = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
};
//#endregion

//#region Component
// Create vs Edit: si `editing` está definido → modo edit (updateCatalog).
// Si no → modo create (createCatalog).
const CatalogForm = ({ editing }: { editing?: EditingCatalog }) => {
  const router = useRouter();
  const t = useT();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(editing?.name ?? "");
  const [slug, setSlug] = useState(editing?.slug ?? "");
  const [description, setDescription] = useState(editing?.description ?? "");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      if (editing) {
        const res = await updateCatalog(editing.id, {
          name,
          slug: slug || slugify(name),
          description: description || undefined,
        });
        if (res.status !== 200) {
          toast.error(t.catalogs.deleteError);
          return;
        }
        toast.success(t.catalogs.saved);
        router.push(`/catalogs/${editing.id}`);
        router.refresh();
        return;
      }

      const res = await createCatalog({
        name,
        slug: slug || slugify(name),
        description: description || undefined,
        isPublished: false,
      });
      if (res.status !== 201 || !res.catalog) {
        const msg = "message" in res ? res.message : t.common.error;
        toast.error(msg ?? t.common.error);
        return;
      }
      toast.success(t.common.success);
      router.push("/catalogs");
      router.refresh();
    });
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div>
        <Label htmlFor="name">{t.catalogs.form.name}</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (!slug) setSlug(slugify(e.target.value));
          }}
          placeholder={t.catalogs.form.namePlaceholder}
          required
        />
      </div>
      <div>
        <Label htmlFor="slug">{t.catalogs.form.slug}</Label>
        <Input
          id="slug"
          value={slug}
          onChange={(e) => setSlug(slugify(e.target.value))}
          placeholder={t.catalogs.form.slugPlaceholder}
          required
        />
      </div>
      <div>
        <Label htmlFor="description">{t.catalogs.form.description}</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
      </div>
      <Button type="submit" disabled={isPending || !name}>
        {isPending
          ? editing
            ? t.common.saving
            : t.common.creating
          : editing
            ? t.common.save
            : t.catalogs.form.submit}
      </Button>
    </form>
  );
};
//#endregion

export default CatalogForm;
