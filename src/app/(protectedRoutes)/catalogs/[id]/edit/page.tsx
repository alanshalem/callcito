//#region Imports
import { getCatalogById } from "@/actions/catalog";
import { getDictionary } from "@/i18n";
import { notFound } from "next/navigation";
import CatalogForm from "../../_components/CatalogForm";
import DeleteCatalogButton from "../_components/DeleteCatalogButton";
//#endregion

//#region Edit Catalog Page
export default async function EditCatalogPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [t, catalog] = await Promise.all([getDictionary(), getCatalogById(id)]);
  if (!catalog) notFound();

  return (
    <div className="w-full h-full mt-8 px-6 md:px-8 lg:px-10 xl:px-12">
      <h1 className="text-primary font-semibold text-4xl mb-8">{t.catalogs.editTitle}</h1>
      <div className="max-w-xl flex flex-col gap-10">
        <CatalogForm
          editing={{
            id: catalog.id,
            name: catalog.name,
            slug: catalog.slug,
            description: catalog.description,
          }}
        />
        <div className="pt-8 border-t border-border">
          <DeleteCatalogButton id={catalog.id} name={catalog.name} />
        </div>
      </div>
    </div>
  );
}
//#endregion
