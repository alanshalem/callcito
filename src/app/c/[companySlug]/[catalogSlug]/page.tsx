//#region Imports
import { getCatalogBySlug } from "@/actions/catalog";
import { prismaClient } from "@/lib/prismaClient";
import Image from "next/image";
import { notFound } from "next/navigation";
import CatalogBrowser from "./_components/CatalogBrowser";
import VoiceWidget from "./_components/VoiceWidget";
//#endregion

//#region Public Catalog Page
export default async function PublicCatalogPage({
  params,
}: {
  params: Promise<{ companySlug: string; catalogSlug: string }>;
}) {
  const { companySlug, catalogSlug } = await params;
  const result = await getCatalogBySlug(companySlug, catalogSlug);
  if (!result) notFound();
  const { company, catalog } = result;

  const products = await prismaClient.product.findMany({
    where: { catalogId: catalog.id, isActive: true },
    orderBy: { name: "asc" },
    take: 500,
  });

  // Serializar Prisma Decimal → number para client component.
  const items = products.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    price: Number(p.price),
    currency: p.currency,
    stock: p.stock,
    sku: p.sku,
    tags: p.tags,
    image: p.images[0] ?? null,
  }));

  return (
    <div className="min-h-screen w-full flex flex-col">
      {/* Hero header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-6 py-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div className="flex items-center gap-4">
            {company.logoUrl ? (
              <div className="w-14 h-14 rounded-xl overflow-hidden bg-secondary shrink-0">
                <Image src={company.logoUrl} alt={company.name} width={56} height={56} className="object-cover w-full h-full" />
              </div>
            ) : (
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold shrink-0">
                {company.name.charAt(0)}
              </div>
            )}
            <div>
              <h1 className="font-bold text-2xl md:text-3xl">{company.name}</h1>
              <p className="text-sm text-muted-foreground">{catalog.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            {items.length} productos disponibles
          </div>
        </div>
        {catalog.description && (
          <div className="container mx-auto px-6 pb-6">
            <p className="text-muted-foreground max-w-2xl">{catalog.description}</p>
          </div>
        )}
      </header>

      <main className="flex-1 container mx-auto px-6 py-8 pb-32">
        {items.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            Este catálogo todavía no tiene productos.
          </div>
        ) : (
          <CatalogBrowser items={items} />
        )}
      </main>

      {catalog.assistant?.vapiAssistantId && (
        <VoiceWidget
          vapiAssistantId={catalog.assistant.vapiAssistantId}
          catalogId={catalog.id}
          assistantDbId={catalog.assistant.id}
          assistantName={catalog.assistant.name}
          companyName={company.name}
          companyLogoUrl={company.logoUrl}
        />
      )}
    </div>
  );
}
//#endregion
