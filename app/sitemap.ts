import type { MetadataRoute } from "next";
import { publicProducts } from "@/lib/catalog";
import { siteConfig } from "@/lib/site-config";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["", "/collectie", "/eerder-werk", "/kunst-in-opdracht", "/over-carolien", "/contact", "/privacy", "/voorwaarden", "/verzending-retourneren", "/herroepingsrecht", "/bedrijfsgegevens"];
  return [...routes.map((route) => ({ url: `${siteConfig.siteUrl}${route}`, changeFrequency: route === "" ? "weekly" as const : "monthly" as const, priority: route === "" ? 1 : 0.7 })), ...publicProducts.map((product) => ({ url: `${siteConfig.siteUrl}/collectie/${product.slug}`, changeFrequency: "weekly" as const, priority: 0.8 }))];
}

