"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Category = { id: string; name: string };
type AdminProduct = { id: string; name: string; slug: string; status: string; price_cents: number | null; category_id: string; published: boolean; featured: boolean; dimensions: string | null; material: string | null; technique: string | null; year: number | null; vat_rate: number | null; shipping_method: string; shipping_cents: number | null; description: string };

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
    formData.delete("images");
    const payload = Object.fromEntries(formData.entries());
    const response = await fetch(editing ? `/api/admin/products/${editing.id}` : "/api/admin/products", { method: editing ? "PATCH" : "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
    const result = await response.json() as { id?: string; message?: string };
    if (!response.ok || !result.id) { setMessage(result.message ?? "Opslaan is niet gelukt."); setLoading(false); return; }
    for (const file of files) { const upload = new FormData(); upload.append("file", file); upload.append("productId", result.id); await fetch("/api/admin/uploads", { method: "POST", body: upload }); }
    setMessage("Het werk is opgeslagen."); setEditing(null); form.reset(); setLoading(false); router.refresh();
  }

  async function archive(id: string) { if (!window.confirm("Dit werk archiveren? Het verdwijnt uit de openbare collectie.")) return; const response = await fetch(`/api/admin/products/${id}`, { method: "DELETE" }); if (response.ok) router.refresh(); else setMessage("Archiveren is niet gelukt."); }

  return <div className="admin-manage">
    <section className="admin-form-panel"><div><p className="eyebrow">{editing ? "Werk aanpassen" : "Nieuw werk"}</p><h2>{editing ? editing.name : "Voeg een kunstwerk toe"}</h2></div><form className="admin-product-form" onSubmit={save} key={editing?.id ?? "new"}>
      <div className="form-grid"><label>Naam *<input name="name" defaultValue={editing?.name} required /></label><label>Slug *<input name="slug" defaultValue={editing?.slug} pattern="[a-z0-9-]+" required /></label></div>
      <label>Beschrijving<textarea name="description" rows={5} defaultValue={editing?.description} /></label>
      <div className="form-grid"><label>Categorie *<select name="categoryId" defaultValue={editing?.category_id} required><option value="">Kies</option>{categories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}</select></label><label>Status<select name="status" defaultValue={editing?.status ?? "hidden"}><option value="available">Beschikbaar</option><option value="reserved">Gereserveerd</option><option value="sold">Verkocht</option><option value="hidden">Verborgen</option></select></label></div>
      <div className="form-grid"><label>Prijs inclusief btw (€)<input name="price" inputMode="decimal" defaultValue={editing?.price_cents == null ? "" : (editing.price_cents / 100).toFixed(2)} /></label><label>Btw-tarief<select name="vatRate" defaultValue={editing?.vat_rate ?? ""}><option value="">Nog controleren</option><option value="9">9%</option><option value="21">21%</option></select></label></div>
      <div className="form-grid"><label>Afmetingen<input name="dimensions" defaultValue={editing?.dimensions ?? ""} /></label><label>Jaar<input name="year" type="number" min="1900" max="2200" defaultValue={editing?.year ?? ""} /></label></div>
      <div className="form-grid"><label>Materiaal<input name="material" defaultValue={editing?.material ?? ""} /></label><label>Techniek<input name="technique" defaultValue={editing?.technique ?? ""} /></label></div>
      <div className="form-grid"><label>Levering<select name="shippingMethod" defaultValue={editing?.shipping_method ?? "consultation"}><option value="pickup">Afhalen</option><option value="shipping">Verzenden</option><option value="consultation">In overleg</option></select></label><label>Verzendkosten (€)<input name="shippingPrice" inputMode="decimal" defaultValue={editing?.shipping_cents == null ? "" : (editing.shipping_cents / 100).toFixed(2)} /></label></div>
      <label>Foto&apos;s uploaden<input name="images" type="file" accept="image/jpeg,image/png,image/webp" multiple /></label>
      <div className="admin-checks"><label><input name="published" type="checkbox" defaultChecked={editing?.published} /> Openbaar zichtbaar</label><label><input name="featured" type="checkbox" defaultChecked={editing?.featured} /> Uitgelicht</label></div>
      <div className="admin-actions"><button className="button button-dark" disabled={loading} type="submit">{loading ? "Opslaan…" : "Werk opslaan"}</button>{editing && <button className="text-button" type="button" onClick={() => setEditing(null)}>Annuleren</button>}</div>{message && <p className="form-message" role="status">{message}</p>}
    </form></section>
    <section className="admin-list"><div className="section-heading"><div><p className="eyebrow">Collectie</p><h2>{products.length} werken</h2></div></div>{products.map((product) => <div className="admin-row" key={product.id}><div><strong>{product.name}</strong><span>{product.status} · {product.published ? "openbaar" : "concept"}</span></div><div><button type="button" onClick={() => setEditing(product)}>Bewerken</button><button type="button" onClick={() => archive(product.id)}>Archiveren</button></div></div>)}</section>
  </div>;
}

