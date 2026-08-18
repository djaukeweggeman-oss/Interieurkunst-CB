"use client";

import Link from "next/link";
import { useState } from "react";
import { formatPrice } from "@/lib/catalog";
import { useCart } from "./cart-provider";

export function CheckoutForm() {
  const { items } = useCart();
  const [delivery, setDelivery] = useState("consultation");
  const [state, setState] = useState<{ loading?: boolean; message?: string }>({});
  const total = items.reduce((sum, item) => sum + (item.priceCents ?? 0), 0);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState({ loading: true });
    const body = { ...Object.fromEntries(new FormData(event.currentTarget).entries()), delivery, productIds: items.map((item) => item.id) };
    try {
      const response = await fetch("/api/checkout", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      const result = await response.json() as { checkoutUrl?: string; message?: string };
      if (!response.ok || !result.checkoutUrl) throw new Error(result.message ?? "Betaling starten is niet gelukt.");
      window.location.assign(result.checkoutUrl);
    } catch (error) { setState({ message: error instanceof Error ? error.message : "Er ging iets mis." }); }
  }

  if (!items.length) return <div className="empty-state checkout-empty"><h2>Je winkelmand is leeg</h2><p>Op dit moment hebben de gemigreerde werken nog geen bevestigde prijs en kunnen ze daarom niet veilig worden afgerekend.</p><Link className="button button-dark" href="/collectie">Naar de shop ↗</Link></div>;

  return <form className="checkout-layout" onSubmit={submit}>
    <div className="checkout-fields">
      <section><p className="eyebrow">01 · Contact</p><div className="form-grid"><label>Naam *<input name="name" autoComplete="name" required /></label><label>E-mailadres *<input name="email" type="email" autoComplete="email" required /></label></div><label>Telefoonnummer *<input name="phone" type="tel" autoComplete="tel" required /></label></section>
      <section><p className="eyebrow">02 · Levering</p><div className="delivery-options">{[["pickup", "Afhalen", "Afspraak in de omgeving van Deventer"], ["shipping", "Verzenden", "Tarief volgens productinstelling"], ["consultation", "Bezorging in overleg", "Carolien neemt contact op"]].map(([value, title, body]) => <label className={delivery === value ? "is-active" : ""} key={value}><input type="radio" name="deliveryOption" value={value} checked={delivery === value} onChange={() => setDelivery(value)} /><strong>{title}</strong><span>{body}</span></label>)}</div></section>
      {delivery === "shipping" && <section><p className="eyebrow">03 · Afleveradres</p><label>Straat en huisnummer *<input name="address" autoComplete="street-address" required /></label><div className="form-grid"><label>Postcode *<input name="postalCode" autoComplete="postal-code" required /></label><label>Plaats *<input name="city" autoComplete="address-level2" required /></label></div></section>}
      <label className="check-label"><input type="checkbox" name="terms" required />Ik ga akkoord met de algemene voorwaarden en heb het herroepingsrecht gelezen.</label>
    </div>
    <aside className="order-summary"><p className="eyebrow">Jouw bestelling</p>{items.map((item) => <div className="summary-line" key={item.id}><span>{item.name}<small>Aantal 1</small></span><strong>{formatPrice(item.priceCents)}</strong></div>)}<div className="summary-line"><span>Verzending</span><strong>{delivery === "pickup" ? "Gratis" : "In overleg"}</strong></div><div className="summary-total"><span>Totaal</span><strong>{formatPrice(total)}</strong></div><p>Consumentenprijzen zijn inclusief btw. De exacte btw-specificatie volgt uit de productinstelling.</p><button className="button button-dark button-wide" disabled={state.loading} type="submit">{state.loading ? "Betaling voorbereiden…" : "Bestellen en betalen ↗"}</button>{state.message && <p className="form-message is-error" role="alert">{state.message}</p>}</aside>
  </form>;
}
