import "server-only";
import { unstable_cache } from "next/cache";
import { siteConfig } from "@/lib/site-config";
import type { Json } from "@/lib/supabase/database.types";
import { createPublicSupabaseClient } from "@/lib/supabase/public";

function objectValue(value: Json): Record<string, Json | undefined> {
  return value && !Array.isArray(value) && typeof value === "object" ? value : {};
}

const loadSettings = unstable_cache(async () => {
  const supabase = createPublicSupabaseClient();
  if (!supabase) return null;
  const result = await supabase.from("site_settings").select("key,value").eq("is_public", true);
  if (result.error) {
    console.warn("[settings] Publieke instellingen konden niet worden geladen; de lokale standaardwaarden blijven actief.");
    return null;
  }
  return Object.fromEntries(result.data.map((row) => [row.key, objectValue(row.value)]));
}, ["public-site-settings-v1"], { revalidate: 300, tags: ["site-settings"] });

export async function getPublicSiteSettings() {
  const settings = await loadSettings();
  const business = settings?.["business.public"] ?? {};
  const contact = settings?.["contact.public"] ?? {};
  const delivery = settings?.["delivery.public"] ?? {};
  const social = settings?.["social.public"] ?? {};
  const seo = settings?.["seo.public"] ?? {};
  return {
    businessName: typeof business.business_name === "string" ? business.business_name : siteConfig.name,
    artistName: typeof business.artist_name === "string" ? business.artist_name : siteConfig.artist,
    email: typeof contact.email === "string" ? contact.email : siteConfig.email,
    phone: typeof contact.phone === "string" ? contact.phone : siteConfig.phone,
    location: typeof contact.location === "string" ? contact.location : siteConfig.location,
    delivery,
    social,
    seo,
  };
}
