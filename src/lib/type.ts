//#region Imports
import { z } from "zod";
//#endregion

//#region Common Validators
export const slugSchema = z
  .string()
  .min(3)
  .max(60)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug debe ser kebab-case (solo a-z, 0-9, guiones)");

export const currencySchema = z.enum(["ARS", "BRL", "CLP", "COP", "MXN", "PEN", "UYU", "USD"]);

export const languageSchema = z.enum([
  "es",
  "es-AR",
  "es-MX",
  "pt",
  "pt-BR",
  "en",
]);

export type ValidationErrors = Record<string, string>;
export type ValidationResult = { valid: boolean; errors: ValidationErrors };
//#endregion

//#region Company
export const companySchema = z.object({
  name: z.string().min(2).max(100),
  slug: slugSchema,
  currency: currencySchema.default("ARS"),
  country: z.string().length(2).default("AR"),
  defaultLanguage: languageSchema.default("es"),
  logoUrl: z.url().optional(),
});
export type CompanyInput = z.infer<typeof companySchema>;
//#endregion

//#region Catalog
export const catalogSchema = z.object({
  name: z.string().min(2).max(120),
  slug: slugSchema,
  description: z.string().max(500).optional(),
  isPublished: z.boolean().default(false),
  assistantId: z.uuid().optional(),
});
export type CatalogInput = z.infer<typeof catalogSchema>;
//#endregion

//#region Product
export const productSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  price: z.number().positive(),
  currency: currencySchema.default("ARS"),
  sku: z.string().max(60).optional(),
  stock: z.number().int().nonnegative().optional(),
  images: z.array(z.url()).default([]),
  tags: z.array(z.string().max(40)).default([]),
  isActive: z.boolean().default(true),
});
export type ProductInput = z.infer<typeof productSchema>;

export const productBulkRowSchema = productSchema.extend({
  image_url1: z.url().optional(),
  image_url2: z.url().optional(),
  image_url3: z.url().optional(),
});
//#endregion

//#region Assistant
export const assistantSchema = z.object({
  name: z.string().min(2).max(80),
  language: languageSchema,
  voiceId: z.string().min(1),
  firstMessage: z.string().min(1).max(500),
  systemPrompt: z.string().min(10).max(10000),
  systemPromptB: z.string().min(10).max(10000).optional(),
});
export type AssistantInput = z.infer<typeof assistantSchema>;
//#endregion
