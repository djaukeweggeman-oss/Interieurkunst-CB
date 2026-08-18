import "server-only";
import { unstable_cache } from "next/cache";
import {
  portfolio as fallbackPortfolio,
  publicProducts as fallbackProducts,
  type PortfolioItem,
  type Product,
  type ProductCategory,
} from "@/lib/catalog";
import type { CategoryRow, ProductImageRow, ProductRow } from "@/lib/supabase/database.types";
import { createPublicSupabaseClient } from "@/lib/supabase/public";

type CatalogResult = { products: Product[]; source: "supabase" | "fallback" };

function categoryFromSlug(slug: string | undefined): ProductCategory {
  if (slug === "potten") return "pot";
  if (slug === "objecten") return "object";
  return "painting";
}

function legacyDimensions(product: ProductRow) {
  const values = [
    product.width_cm == null ? null : `${product.width_cm}`,
    product.height_cm == null ? null : `${product.height_cm}`,
    product.depth_cm == null ? null : `${product.depth_cm}`,
  ].filter(Boolean);
  if (values.length >= 2) return `${values.join(" × ")} cm`;
  return product.dimensions;
}

function mapProduct(
  row: ProductRow,
  categories: Map<string, CategoryRow>,
  images: ProductImageRow[],
  publicUrl: (path: string) => string,
): Product {
  const category = categories.get(row.category_id);
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: categoryFromSlug(category?.slug),
    status: row.status,
    priceCents: row.price_cents,
    vatRate: row.vat_percentage === 9 || row.vat_percentage === 21 ? row.vat_percentage : null,
    dimensions: legacyDimensions(row),
    material: row.material,
    technique: row.technique,
    year: row.year_created,
    description: row.description,
    images: images
      .filter((image) => image.product_id === row.id)
      .sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order)
      .map((image) => ({
        src: publicUrl(image.storage_path),
        alt: image.alt_text || row.name,
        width: image.width ?? 1600,
        height: image.height ?? 1600,
      })),
    featured: row.is_featured,
    isPortfolioItem: row.is_portfolio_item,
    canBeShipped: row.can_be_shipped,
    canBePickedUp: row.can_be_picked_up,
    deliveryInConsultation: row.delivery_in_consultation,
    shippingCostCents: row.shipping_cost_cents,
    createdAt: row.created_at,
    shipping: row.can_be_shipped ? "shipping" : row.can_be_picked_up ? "pickup" : "consultation",
  };
}

const loadCatalog = unstable_cache(async (): Promise<CatalogResult> => {
  const supabase = createPublicSupabaseClient();
  if (!supabase) return { products: fallbackProducts, source: "fallback" };

  const [productResult, categoryResult, imageResult] = await Promise.all([
    supabase.from("products").select("*").not("published_at", "is", null).is("archived_at", null)
      .in("status", ["available", "reserved", "sold"]).order("published_at", { ascending: false }),
    supabase.from("categories").select("*").eq("is_active", true).order("sort_order"),
    supabase.from("product_images").select("*").order("sort_order"),
  ]);

  if (productResult.error || categoryResult.error || imageResult.error) {
    console.warn("[catalog] Supabase-catalogus kon niet veilig worden geladen; de voorbeeldcatalogus blijft actief.");
    return { products: fallbackProducts, source: "fallback" };
  }
  if (!productResult.data.length) return { products: fallbackProducts, source: "fallback" };

  const categoryMap = new Map(categoryResult.data.map((category) => [category.id, category]));
  const signedImages = await supabase.storage.from("product-images").createSignedUrls(imageResult.data.map((image) => image.storage_path), 60 * 60);
  const signedUrlMap = new Map((signedImages.data ?? []).map((image) => [image.path, image.signedUrl]));
  const publicUrl = (path: string) => signedUrlMap.get(path) ?? "";
  return {
    products: productResult.data.map((product) => mapProduct(product, categoryMap, imageResult.data, publicUrl)),
    source: "supabase",
  };
}, ["public-catalog-v2"], { revalidate: 60, tags: ["catalog"] });

export async function getPublicCatalog() {
  return loadCatalog();
}

export async function getPublicProducts() {
  return (await loadCatalog()).products;
}

export async function getPublicProduct(slug: string) {
  return (await getPublicProducts()).find((product) => product.slug === slug);
}

export async function getPortfolioItems(): Promise<PortfolioItem[]> {
  const { products, source } = await loadCatalog();
  if (source === "fallback") return fallbackPortfolio;
  const items = products.filter((product) => product.isPortfolioItem && product.images.length);
  if (!items.length) return fallbackPortfolio;
  return items.flatMap((product) => product.images.slice(0, 1).map((image) => ({
    id: product.id,
    category: product.category === "painting" ? "Overig werk" as const : product.category === "pot" ? "Overig werk" as const : "Overig werk" as const,
    src: image.src,
    alt: image.alt,
    width: image.width,
    height: image.height,
  })));
}
