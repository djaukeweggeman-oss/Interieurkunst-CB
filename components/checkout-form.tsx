"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { formatPrice } from "@/lib/catalog";
import { useCart } from "./cart-provider";

export function CheckoutForm() {
  const { items } = useCart();
  const [delivery, setDelivery] = useState("consultation");
  const [state, setState] = useState<{ loading?: boolean; message?: string }>({});
  const options = useMemo(() => [
    { value: "pickup", title: "Afhalen", body: "Afspraak in de omgeving van Deventer", allowed: items.every((item) => item.canBePickedUp !== false) },
    { value: "shipping", title: "Verzenden", body: "Tarief volgens productinstelling", allowed: items.every((item) => item.canBeShipped === true) },
    { value: "consultation", title: "Bezorging in overleg", body: "Carolien neemt contact op", allowed: items.every((item) => item.deliveryInConsultation !== false) },
  ].filter((option) => option.allowed), [items]);
  const effectiveDelivery = options.some((option) => option.value === delivery) ? delivery : options[0]?.value ?? "consultation";
  const subtotal = items.reduce((sum, item) => sum + (item.priceCents ?? 0), 0);
  const shipping = effectiveDelivery === "shipping" ? items.reduce((sum, item) => sum + (item.shippingCostCents ?? 0), 0) : 0;
  const total = subtotal + shipping;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState({ loading: true });
    const body = { ...Object.fromEntries(new FormData(event.currentTarget).entries()), delivery: effectiveDelivery, productIds: items.map((item) => item.id) };
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
      <section><p className="eyebrow">02 · Levering</p><div className="delivery-options">{options.map(({ value, title, body }) => <label className={effectiveDelivery === value ? "is-active" : ""} key={value}><input type="radio" name="deliveryOption" value={value} checked={effectiveDelivery === value} onChange={() => setDelivery(value)} /><strong>{title}</strong><span>{body}</span></label>)}</div></section>
      {effectiveDelivery === "shipping" && <section><p className="eyebrow">03 · Afleveradres</p><label>Straat en huisnummer *<input name="address" autoComplete="street-address" required /></label><div className="form-grid"><label>Postcode *<input name="postalCode" autoComplete="postal-code" required /></label><label>Plaats *<input name="city" autoComplete="address-level2" required /></label></div></section>}
      <label>Notitie voor Carolien<textarea name="note" rows={3} maxLength={1000} /></label>
      <label className="check-label"><input type="checkbox" name="terms" required />Ik ga akkoord met de algemene voorwaarden en heb het herroepingsrecht gelezen.</label>
    </div>
    <aside className="order-summary"><p className="eyebrow">Jouw bestelling</p>{items.map((item) => <div className="summary-line" key={item.id}><span>{item.name}<small>Aantal 1</small></span><strong>{formatPrice(item.priceCents)}</strong></div>)}<div className="summary-line"><span>Verzending</span><strong>{effectiveDelivery === "shipping" ? formatPrice(shipping) : "Gratis / in overleg"}</strong></div><div className="summary-total"><span>Totaal</span><strong>{formatPrice(total)}</strong></div><p>De server haalt producten, prijs, btw, levering en voorraad opnieuw uit Supabase op voordat de betaling start.</p><button className="button button-dark button-wide" disabled={state.loading || !options.length} type="submit">{state.loading ? "Betaling voorbereiden…" : "Bestellen en betalen ↗"}</button>{state.message && <p className="form-message is-error" role="alert">{state.message}</p>}</aside>
  </form>;
}
