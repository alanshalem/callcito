/**
 * Genera `public/sample/motos-100.xlsx` con 100 productos para motos.
 * Formato compatible con el endpoint /api/products/import.
 *
 * Uso: npx tsx scripts/gen-moto-catalog.ts
 */
import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import XLSX from "../src/lib/xlsx-parser";

const BRANDS = ["Honda", "Yamaha", "Suzuki", "Kawasaki", "Bajaj", "Zanella", "Motomel", "KTM", "Beta", "Gilera"];
const CATEGORIES = [
  { name: "Casco", tag: "seguridad", priceRange: [25000, 180000] },
  { name: "Guantes", tag: "seguridad", priceRange: [8000, 45000] },
  { name: "Campera", tag: "indumentaria", priceRange: [60000, 350000] },
  { name: "Botas", tag: "indumentaria", priceRange: [40000, 200000] },
  { name: "Aceite sintético", tag: "lubricantes", priceRange: [8000, 22000] },
  { name: "Cadena", tag: "repuesto", priceRange: [15000, 65000] },
  { name: "Filtro de aire", tag: "repuesto", priceRange: [5000, 18000] },
  { name: "Pastillas de freno", tag: "repuesto", priceRange: [6000, 25000] },
  { name: "Batería", tag: "eléctrico", priceRange: [35000, 120000] },
  { name: "Bujía", tag: "repuesto", priceRange: [2500, 9000] },
  { name: "Cubierta delantera", tag: "neumático", priceRange: [45000, 180000] },
  { name: "Cubierta trasera", tag: "neumático", priceRange: [60000, 220000] },
  { name: "Escape deportivo", tag: "tuning", priceRange: [85000, 450000] },
  { name: "Espejo retrovisor", tag: "accesorio", priceRange: [4000, 18000] },
  { name: "Manubrio", tag: "repuesto", priceRange: [12000, 55000] },
  { name: "Amortiguador", tag: "repuesto", priceRange: [50000, 280000] },
  { name: "Disco de freno", tag: "repuesto", priceRange: [25000, 110000] },
  { name: "Farol LED", tag: "eléctrico", priceRange: [18000, 75000] },
  { name: "Alarma", tag: "seguridad", priceRange: [22000, 85000] },
  { name: "Baúl 45L", tag: "accesorio", priceRange: [35000, 95000] },
];

const ADJECTIVES = ["Premium", "Sport", "Racing", "Touring", "Urbano", "Off-Road", "Enduro", "Deportivo"];
const IMAGES = [
  "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=600",
  "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=600",
  "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600",
  "https://images.unsplash.com/photo-1599819811279-d5ad9cccf838?w=600",
  "https://images.unsplash.com/photo-1609630875171-b1321377ee65?w=600",
  "https://images.unsplash.com/photo-1558981285-6f0c94958bb6?w=600",
  "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=600",
  "https://images.unsplash.com/photo-1571188654248-7a89213915f7?w=600",
];

function randBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function genSku(brand: string, idx: number): string {
  return `${brand.slice(0, 3).toUpperCase()}-${String(idx).padStart(4, "0")}`;
}

function genProduct(idx: number) {
  const category = pick(CATEGORIES);
  const brand = pick(BRANDS);
  const adj = pick(ADJECTIVES);
  const [minP, maxP] = category.priceRange;
  const price = Math.round(randBetween(minP, maxP) / 100) * 100;
  const stock = Math.random() < 0.08 ? 0 : randBetween(1, 200);
  const name = `${category.name} ${brand} ${adj}`;
  const description =
    `${category.name} ${adj} marca ${brand}. ` +
    `Material de primera calidad, diseño ergonómico y acabado ${pick(["mate", "brillante", "texturado"])}. ` +
    `Compatible con la mayoría de modelos ${brand}. Garantía de 12 meses.`;
  const tags = [category.tag, brand.toLowerCase(), adj.toLowerCase()];
  const image1 = pick(IMAGES);
  const image2 = Math.random() < 0.4 ? pick(IMAGES) : "";
  return {
    name,
    description,
    price,
    currency: "ARS",
    sku: genSku(brand, idx + 1),
    stock,
    tags: tags.join(","),
    image_url1: image1,
    image_url2: image2,
    image_url3: "",
  };
}

function main() {
  const header = [
    "name",
    "description",
    "price",
    "currency",
    "sku",
    "stock",
    "tags",
    "image_url1",
    "image_url2",
    "image_url3",
  ];

  const products = Array.from({ length: 100 }, (_, i) => genProduct(i));
  const rows = products.map((p) => [
    p.name,
    p.description,
    p.price,
    p.currency,
    p.sku,
    p.stock,
    p.tags,
    p.image_url1,
    p.image_url2,
    p.image_url3,
  ]);

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
  XLSX.utils.book_append_sheet(wb, ws, "Productos");
  const buffer = XLSX.write(wb, { type: "array", bookType: "xlsx" });

  const outDir = path.join(process.cwd(), "public", "sample");
  mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, "motos-100.xlsx");
  writeFileSync(outPath, Buffer.from(buffer));

  console.log(`✓ Generado: ${outPath}`);
  console.log(`  100 productos · categorías: ${CATEGORIES.length} · marcas: ${BRANDS.length}`);
}

main();
