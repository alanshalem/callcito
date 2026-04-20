//#region Imports
import { getProductById } from "@/actions/product";
import { getDictionary } from "@/i18n";
import { notFound } from "next/navigation";
import ProductForm from "../../../_components/ProductForm";
//#endregion

//#region Edit Product Page
export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string; productId: string }>;
}) {
  const { id, productId } = await params;
  const [t, product] = await Promise.all([getDictionary(), getProductById(productId)]);
  if (!product || product.catalogId !== id) notFound();

  return (
    <div className="w-full h-full mt-8 px-6 md:px-8 lg:px-10 xl:px-12">
      <h1 className="text-primary font-semibold text-4xl mb-2">
        {t.common.edit}: {product.name}
      </h1>
      <p className="text-muted-foreground mb-8">{t.products.form.inCatalog}</p>
      <div className="max-w-xl">
        <ProductForm
          catalogId={id}
          editing={{
            id: product.id,
            name: product.name,
            description: product.description,
            price: Number(product.price),
            sku: product.sku,
            stock: product.stock,
            tags: product.tags,
            images: product.images,
            isActive: product.isActive,
          }}
        />
      </div>
    </div>
  );
}
//#endregion
