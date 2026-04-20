//#region Imports
import { getCatalogBySlug } from "@/actions/catalog";
import { getProductsByCatalog } from "@/actions/product";
import { prismaClient } from "@/lib/prismaClient";
import Image from "next/image";
import { notFound } from "next/navigation";
import VoiceWidget from "./_components/VoiceWidget";
//#endregion

//#region Public Catalog Page
// Ruta pública (SIN auth, ver proxy.ts). Renderiza los productos del catálogo
// publicado y muestra botón para iniciar call con el asistente Vapi.
export default async function PublicCatalogPage({
  params,
}: {
  params: Promise<{ companySlug: string; catalogSlug: string }>;
}) {
  const { companySlug, catalogSlug } = await params;
  const result = await getCatalogBySlug(companySlug, catalogSlug);
  if (!result) notFound();
  const { company, catalog } = result;

  // Fetch products sin validar ownership (catálogo publicado = público).
  const products = await prismaClient.product.findMany({
    where: { catalogId: catalog.id, isActive: true },
    orderBy: { name: "asc" },
    take: 200,
  });

  return (
    <div className="min-h-screen w-full">
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {company.logoUrl && (
            <Image src={company.logoUrl} alt={company.name} width={32} height={32} />
          )}
          <div>
            <h1 className="font-semibold">{company.name}</h1>
            <p className="text-xs text-muted-foreground">{catalog.name}</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-10">
        {catalog.description && (
          <p className="text-muted-foreground mb-8 max-w-2xl">{catalog.description}</p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map((p) => (
            <div key={p.id} className="p-4 rounded-xl border border-border">
              {p.images[0] && (
                <div className="aspect-square relative rounded-lg overflow-hidden mb-3 bg-secondary">
                  <Image src={p.images[0]} alt={p.name} fill className="object-cover" />
                </div>
              )}
              <h3 className="font-semibold">{p.name}</h3>
              {p.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{p.description}</p>
              )}
              <p className="mt-2 font-semibold">
                {p.currency} {p.price.toString()}
              </p>
            </div>
          ))}
        </div>

        {products.length === 0 && (
          <p className="text-center text-muted-foreground py-20">
            Este catálogo todavía no tiene productos.
          </p>
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
