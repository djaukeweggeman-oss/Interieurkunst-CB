"use client";

import { useCart } from "./cart-provider";
import type { Product } from "@/lib/catalog";

export function AddToCart({ product }: { product: Product }) {
  const { addItem } = useCart();
  const disabled = product.status !== "available" || product.priceCents === null;
  return (
    <button className="button button-dark button-wide" type="button" disabled={disabled} onClick={() => addItem(product)}>
      {product.status === "sold" ? "Dit werk is verkocht" : product.status === "reserved" ? "Tijdelijk gereserveerd" : product.priceCents === null ? "Prijs volgt — informeer gerust" : "Toevoegen aan winkelmand ↗"}
    </button>
  );
}
