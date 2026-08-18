import { z } from "zod";

const emptyToNull = (value: unknown) => value === "" || value === undefined ? null : value;
const moneyToCents = (value: unknown) => value === "" || value === undefined ? null : Math.round(Number(String(value).replace(",", ".")) * 100);

export const adminProductSchema = z.object({
  name: z.string().trim().min(2).max(160), slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/), description: z.string().trim().max(10000).default(""),
  categoryId: z.uuid(), status: z.enum(["available", "reserved", "sold", "hidden"]),
  price: z.preprocess(moneyToCents, z.number().int().nonnegative().nullable()), vatRate: z.preprocess(emptyToNull, z.coerce.number().refine((value) => value === 9 || value === 21).nullable()),
  dimensions: z.preprocess(emptyToNull, z.string().trim().max(100).nullable()), material: z.preprocess(emptyToNull, z.string().trim().max(100).nullable()), technique: z.preprocess(emptyToNull, z.string().trim().max(100).nullable()),
  year: z.preprocess(emptyToNull, z.coerce.number().int().min(1900).max(2200).nullable()), shippingMethod: z.enum(["pickup", "shipping", "consultation"]), shippingPrice: z.preprocess(moneyToCents, z.number().int().nonnegative().nullable()),
  published: z.preprocess((value) => value === "on" || value === true, z.boolean()), featured: z.preprocess((value) => value === "on" || value === true, z.boolean()),
});

export function toProductRow(data: z.infer<typeof adminProductSchema>) {
  return { name: data.name, slug: data.slug, description: data.description, category_id: data.categoryId, status: data.status, price_cents: data.price, vat_rate: data.vatRate, dimensions: data.dimensions, material: data.material, technique: data.technique, year: data.year, shipping_method: data.shippingMethod, shipping_cents: data.shippingPrice, published: data.published, featured: data.featured, updated_at: new Date().toISOString() };
}

