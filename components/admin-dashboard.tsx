"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Category = { id: string; name: string };
type AdminImage = { id: string; public_url: string; alt_text: string; sort_order: number; is_primary: boolean; width: number | null; height: number | null };
type AdminProduct = {
  id: string; name: string; slug: string; short_description: string; description: string; category_id: string;
  status: "draft" | "available" | "reserved" | "sold" | "archived"; price_cents: number | null;
  vat_percentage: number | null; width_cm: number | null; height_cm: number | null; depth_cm: number | null;
  weight_grams: number | null; material: string | null; technique: string | null; year_created: number | null;
  can_be_shipped: boolean; can_be_picked_up: boolean; delivery_in_consultation: boolean; shipping_cost_cents: number | null;
  published_at: string | null; is_featured: boolean; is_portfolio_item: boolean; images: AdminImage[];
};

async function jsonRequest(url: string, init: RequestInit) {
  const response = await fetch(url, init);
  const result = await response.json().catch(() => ({})) as { id?: string; message?: string };
  if (!response.ok) throw new Error(result.message ?? "De wijziging is niet gelukt.");
  return result;
}

export function AdminDashboard({ products, categories }: { products: AdminProduct[]; categories: Category[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<AdminProduct | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setMessage("");
    const form = event.currentTarget;
    const formData = new FormData(form);
    const files = formData.getAll("images").filter((item): item is File => item instanceof File && item.size > 0);
    const imageAltText = String(formData.get("imageAltText") ?? "");
    formData.delete("images"); formData.delete("imageAltText");
    try {
      const result = await jsonRequest(editing ? `/api/admin/products/${editing.id}` : "/api/admin/products", {
        method: editing ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(Object.fromEntries(formData.entries())),
      });
      const productId = result.id;
      if (!productId) throw new Error("Het product-ID ontbreekt.");
      for (const file of files) {
        const upload = new FormData(); upload.append("file", file); upload.append("productId", productId); upload.append("altText", imageAltText);
        await jsonRequest("/api/admin/uploads", { method: "POST", body: upload });
      }
      setMessage(files.length ? "Het werk en de afbeeldingen zijn opgeslagen." : "Het werk is opgeslagen.");
      setEditing(null); form.reset(); router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Opslaan is niet gelukt.");
    } finally { setLoading(false); }
  }

  async function archive(id: string) {
    if (!window.confirm("Dit werk archiveren? Het blijft in de database maar verdwijnt uit de openbare collectie.")) return;
    try { await jsonRequest(`/api/admin/products/${id}`, { method: "DELETE" }); router.refresh(); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Archiveren is niet gelukt."); }
  }

  async function updateImage(productId: string, imageId: string, data: Record<string, unknown>) {
    try {
      await jsonRequest(`/api/admin/products/${productId}/images/${imageId}`, {
        method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(data),
      });
      router.refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Afbeelding bijwerken is niet gelukt."); }
  }

  async function deleteImage(productId: string, imageId: string) {
    if (!window.confirm("Deze afbeelding definitief verwijderen? Dit kan niet ongedaan worden gemaakt.")) return;
    try { await jsonRequest(`/api/admin/products/${productId}/images/${imageId}`, { method: "DELETE" }); router.refresh(); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Afbeelding verwijderen is niet gelukt."); }
  }

  return <div className="admin-manage">
    <section className="admin-form-panel"><div><p className="eyebrow">{editing ? "Werk aanpassen" : "Nieuw werk"}</p><h2>{editing ? editing.name : "Voeg een kunstwerk toe"}</h2></div><form className="admin-product-form" onSubmit={save} key={editing?.id ?? "new"}>
      <div className="form-grid"><label>Naam *<input name="name" defaultValue={editing?.name} required /></label><label>Slug *<input name="slug" defaultValue={editing?.slug} pattern="[a-z0-9-]+" required /></label></div>
      <label>Korte omschrijving<input name="shortDescription" maxLength={300} defaultValue={editing?.short_description} /></label>
      <label>Beschrijving<textarea name="description" rows={5} defaultValue={editing?.description} /></label>
      <div className="form-grid"><label>Categorie *<select name="categoryId" defaultValue={editing?.category_id} required><option value="">Kies</option>{categories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}</select></label><label>Status<select name="status" defaultValue={editing?.status ?? "draft"}><option value="draft">Concept</option><option value="available">Beschikbaar</option><option value="reserved">Gereserveerd</option><option value="sold">Verkocht</option><option value="archived">Gearchiveerd</option></select></label></div>
      <div className="form-grid"><label>Prijs inclusief btw (€)<input name="price" inputMode="decimal" defaultValue={editing?.price_cents == null ? "" : (editing.price_cents / 100).toFixed(2)} /></label><label>Btw-tarief<select name="vatPercentage" defaultValue={editing?.vat_percentage ?? ""}><option value="">Nog controleren</option><option value="9">9%</option><option value="21">21%</option></select></label></div>
      <div className="form-grid form-grid-thirds"><label>Breedte (cm)<input name="widthCm" inputMode="decimal" defaultValue={editing?.width_cm ?? ""} /></label><label>Hoogte (cm)<input name="heightCm" inputMode="decimal" defaultValue={editing?.height_cm ?? ""} /></label><label>Diepte (cm)<input name="depthCm" inputMode="decimal" defaultValue={editing?.depth_cm ?? ""} /></label></div>
      <div className="form-grid"><label>Gewicht (gram)<input name="weightGrams" type="number" min="1" defaultValue={editing?.weight_grams ?? ""} /></label><label>Jaar<input name="yearCreated" type="number" min="1900" max="2200" defaultValue={editing?.year_created ?? ""} /></label></div>
      <div className="form-grid"><label>Materiaal<input name="material" defaultValue={editing?.material ?? ""} /></label><label>Techniek<input name="technique" defaultValue={editing?.technique ?? ""} /></label></div>
      <div className="admin-checks admin-checks-stack"><label><input name="canBePickedUp" type="checkbox" defaultChecked={editing?.can_be_picked_up ?? true} /> Kan worden afgehaald</label><label><input name="canBeShipped" type="checkbox" defaultChecked={editing?.can_be_shipped} /> Kan worden verzonden</label><label><input name="deliveryInConsultation" type="checkbox" defaultChecked={editing?.delivery_in_consultation ?? true} /> Levering in overleg</label></div>
      <label>Verzendkosten (€)<input name="shippingPrice" inputMode="decimal" defaultValue={editing?.shipping_cost_cents == null ? "" : (editing.shipping_cost_cents / 100).toFixed(2)} /></label>
      <label>Nieuwe foto&apos;s<input name="images" type="file" accept="image/jpeg,image/png,image/webp" multiple /></label>
      <label>Alt-tekst voor nieuwe foto&apos;s<input name="imageAltText" maxLength={300} placeholder="Beschrijf wat op de afbeelding staat" /></label>
      <div className="admin-checks admin-checks-stack"><label><input name="published" type="checkbox" defaultChecked={Boolean(editing?.published_at)} /> Openbaar zichtbaar</label><label><input name="isFeatured" type="checkbox" defaultChecked={editing?.is_featured} /> Uitgelicht</label><label><input name="isPortfolioItem" type="checkbox" defaultChecked={editing?.is_portfolio_item} /> Ook tonen bij eerder werk</label></div>
      <div className="admin-actions"><button className="button button-dark" disabled={loading} type="submit">{loading ? "Opslaan…" : "Werk opslaan"}</button>{editing && <button className="text-button" type="button" onClick={() => setEditing(null)}>Annuleren</button>}</div>{message && <p className="form-message" role="status">{message}</p>}
    </form>
    {editing?.images.length ? <div className="admin-image-list"><p className="eyebrow">Afbeeldingen beheren</p>{editing.images.map((image, index) => <div className="admin-image-row" key={image.id}><Image src={image.public_url} alt={image.alt_text} width={image.width ?? 140} height={image.height ?? 140} sizes="90px" /><div><input aria-label="Alt-tekst" defaultValue={image.alt_text} onBlur={(event) => updateImage(editing.id, image.id, { altText: event.currentTarget.value })} /><span>{image.is_primary ? "Hoofdfoto" : `Positie ${index + 1}`}</span></div><div><button type="button" disabled={image.is_primary} onClick={() => updateImage(editing.id, image.id, { isPrimary: true })}>Maak hoofdfoto</button><button type="button" disabled={index === 0} onClick={() => updateImage(editing.id, image.id, { sortOrder: Math.max(0, image.sort_order - 1) })}>Omhoog</button><button type="button" onClick={() => deleteImage(editing.id, image.id)}>Verwijder</button></div></div>)}</div> : null}
    </section>
    <section className="admin-list"><div className="section-heading"><div><p className="eyebrow">Collectie</p><h2>{products.length} werken</h2></div></div>{products.map((product) => <div className="admin-row" key={product.id}><div><strong>{product.name}</strong><span>{product.status} · {product.published_at ? "openbaar" : "concept"} · {product.images.length} foto&apos;s</span></div><div><button type="button" onClick={() => { setEditing(product); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Bewerken</button><button type="button" onClick={() => archive(product.id)}>Archiveren</button></div></div>)}</section>
  </div>;
}
