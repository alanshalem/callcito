//#region Imports
import { getCatalogById } from "@/actions/catalog";
import { getDictionary } from "@/i18n";
import { notFound } from "next/navigation";
import ProductForm from "../../_components/ProductForm";
//#endregion

export default async function NewProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [t, catalog] = await Promise.all([getDictionary(), getCatalogById(id)]);
  if (!catalog) notFound();

  return (
    <div className="w-full h-full mt-8 px-6 md:px-8 lg:px-10 xl:px-12">
      <h1 className="text-primary font-semibold text-4xl mb-2">{t.products.form.title}</h1>
      <p className="text-muted-foreground mb-8">
        {t.products.form.inCatalog} {catalog.name}
      </p>
      <div className="max-w-xl">
        <ProductForm catalogId={id} />
      </div>
    </div>
  );
}
