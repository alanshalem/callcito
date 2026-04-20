//#region Imports
import { getCatalogById } from "@/actions/catalog";
import { getDictionary } from "@/i18n";
import { notFound } from "next/navigation";
import ImportForm from "./_components/ImportForm";
//#endregion

//#region Bulk Import Page
export default async function ImportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [t, catalog] = await Promise.all([getDictionary(), getCatalogById(id)]);
  if (!catalog) notFound();

  return (
    <div className="w-full h-full mt-8 px-6 md:px-8 lg:px-10 xl:px-12">
      <h1 className="text-primary font-semibold text-4xl mb-2">{t.products.import.title}</h1>
      <p className="text-muted-foreground mb-8">
        {t.products.import.inCatalog} <span className="text-primary">{catalog.name}</span>
      </p>

      <div className="max-w-2xl">
        <div className="mb-6 p-4 rounded-xl border border-border bg-secondary/50 text-sm">
          <p className="font-semibold mb-2">{t.products.import.columnsHeader}</p>
          <code className="block text-xs font-mono leading-relaxed">
            name*, description, price*, currency, sku, stock, tags,
            <br />
            image_url1, image_url2, image_url3
          </code>
          <p className="mt-3 text-xs text-muted-foreground">{t.products.import.columnsHelp}</p>
        </div>

        <ImportForm catalogId={id} />
      </div>
    </div>
  );
}
//#endregion
