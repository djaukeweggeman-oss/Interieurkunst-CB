import { z } from "zod";
import type { ProductRow } from "@/lib/supabase/database.types";

const emptyToNull = (value: unknown) => value === "" || value === undefined ? null : value;
const checkbox = (value: unknown) => value === "on" || value === true || value === "true";
const moneyToCents = (value: unknown) => value === "" || value === undefined
  ? null
  : Math.round(Number(String(value).replace(",", ".")) * 100);

export const adminProductSchema = z.object({
  name: z.string().trim().min(2).max(160),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  shortDescription: z.string().trim().max(300).default(""),
  description: z.string().trim().max(10000).default(""),
  categoryId: z.uuid(),
  status: z.enum(["draft", "available", "reserved", "sold", "archived"]),
  price: z.preprocess(moneyToCents, z.number().int().nonnegative().nullable()),
  vatPercentage: z.preprocess(emptyToNull, z.coerce.number().refine((value) => value === 9 || value === 21).nullable()),
  widthCm: z.preprocess(emptyToNull, z.coerce.number().positive().max(10000).nullable()),
  heightCm: z.preprocess(emptyToNull, z.coerce.number().positive().max(10000).nullable()),
  depthCm: z.preprocess(emptyToNull, z.coerce.number().positive().max(10000).nullable()),
  weightGrams: z.preprocess(emptyToNull, z.coerce.number().int().positive().max(10_000_000).nullable()),
  material: z.preprocess(emptyToNull, z.string().trim().max(100).nullable()),
  technique: z.preprocess(emptyToNull, z.string().trim().max(100).nullable()),
  yearCreated: z.preprocess(emptyToNull, z.coerce.number().int().min(1900).max(2200).nullable()),
  shippingPrice: z.preprocess(moneyToCents, z.number().int().nonnegative().nullable()),
  canBeShipped: z.preprocess(checkbox, z.boolean()),
  canBePickedUp: z.preprocess(checkbox, z.boolean()),
  deliveryInConsultation: z.preprocess(checkbox, z.boolean()),
  published: z.preprocess(checkbox, z.boolean()),
  isFeatured: z.preprocess(checkbox, z.boolean()),
  isPortfolioItem: z.preprocess(checkbox, z.boolean()),
}).superRefine((data, context) => {
  if (["available", "reserved"].includes(data.status) && (data.price === null || data.vatPercentage === null)) {
    context.addIssue({ code: "custom", message: "Beschikbare werken hebben een prijs en btw-tarief nodig." });
  }
  if (data.published && ["draft", "archived"].includes(data.status)) {
    context.addIssue({ code: "custom", message: "Een concept of gearchiveerd werk kan niet worden gepubliceerd." });
  }
  if (!data.canBeShipped && !data.canBePickedUp && !data.deliveryInConsultation) {
    context.addIssue({ code: "custom", message: "Kies minimaal één leveringswijze." });
  }
});

export function toProductRow(
  data: z.infer<typeof adminProductSchema>,
  currentPublishedAt: string | null = null,
): Partial<ProductRow> & Pick<ProductRow, "name" | "slug" | "category_id"> {
  const publishedAt = data.published ? currentPublishedAt ?? new Date().toISOString() : null;
  return {
    name: data.name,
    slug: data.slug,
    short_description: data.shortDescription,
    description: data.description,
    category_id: data.categoryId,
    status: data.status,
    price_cents: data.price,
    vat_percentage: data.vatPercentage,
    width_cm: data.widthCm,
    height_cm: data.heightCm,
    depth_cm: data.depthCm,
    weight_grams: data.weightGrams,
    material: data.material,
    technique: data.technique,
    year_created: data.yearCreated,
    can_be_shipped: data.canBeShipped,
    can_be_picked_up: data.canBePickedUp,
    delivery_in_consultation: data.deliveryInConsultation,
    shipping_cost_cents: data.shippingPrice,
    stock_quantity: data.status === "sold" ? 0 : 1,
    published_at: publishedAt,
    is_featured: data.isFeatured,
    is_portfolio_item: data.isPortfolioItem || data.status === "sold",
    archived_at: data.status === "archived" ? new Date().toISOString() : null,
  };
}
