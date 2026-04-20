//#region Imports
import { getCatalogById } from "@/actions/catalog";
import { getCurrentCompany } from "@/actions/company";
import { getProductsByCatalog } from "@/actions/product";
import { Button } from "@/components/ui/button";
import { getDictionary } from "@/i18n";
import { Plus, Upload } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import CatalogPublishToggle from "./_components/CatalogPublishToggle";
import ProductsTable from "./_components/ProductsTable";
import PublicUrlQr from "./_components/PublicUrlQr";
import { Edit } from "lucide-react";
//#endregion

//#region Catalog Detail Page
export default async function CatalogDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const company = await getCurrentCompany();
  if (!company) redirect("/onboarding/company");

  const [t, catalog, products] = await Promise.all([
    getDictionary(),
    getCatalogById(id),
    getProductsByCatalog(id, { limit: 500 }),
  ]);
  if (!catalog) notFound();

  const publicUrl = `/c/${company.slug}/${catalog.slug}`;

  return (
    <div className="w-full h-full mt-8 px-6 md:px-8 lg:px-10 xl:px-12">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-primary font-semibold text-4xl">{catalog.name}</h1>
        <div className="flex items-center gap-3">
          <CatalogPublishToggle catalogId={catalog.id} isPublished={catalog.isPublished} />
          <Button variant="outline" size="icon" asChild>
            <Link href={`/catalogs/${catalog.id}/edit`}>
              <Edit className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </div>
      <p className="text-muted-foreground mb-2">
        {catalog._count.products} {t.catalogs.productsCount}
      </p>
      {catalog.isPublished && (
        <div className="mb-8 max-w-xl">
          <PublicUrlQr url={`${process.env.NEXT_PUBLIC_BASE_URL ?? ""}${publicUrl}`} />
        </div>
      )}

      <div className="flex gap-2 mb-6">
        <Button asChild>
          <Link href={`/catalogs/${id}/products/new`}>
            <Plus className="w-4 h-4 mr-2" /> {t.catalogs.detail.newProduct}
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href={`/catalogs/${id}/import`}>
            <Upload className="w-4 h-4 mr-2" /> {t.catalogs.detail.importXlsx}
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <a href={`/api/catalogs/${id}/products/export`} download>
            <Upload className="w-4 h-4 mr-2 rotate-180" /> {t.catalogs.detail.exportXlsx}
          </a>
        </Button>
      </div>

      <ProductsTable
        products={products.map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          sku: p.sku,
          price: Number(p.price),
          currency: p.currency,
          stock: p.stock,
          isActive: p.isActive,
        }))}
        catalogId={id}
      />
    </div>
  );
}
//#endregion
