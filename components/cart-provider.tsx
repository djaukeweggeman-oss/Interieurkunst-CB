"use client";

import Link from "next/link";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import { formatPrice, type Product } from "@/lib/catalog";

type CartItem = Pick<Product, "id" | "slug" | "name" | "priceCents" | "images" | "canBeShipped" | "canBePickedUp" | "deliveryInConsultation" | "shippingCostCents">;

type CartContextValue = {
  items: CartItem[];
  addItem: (product: Product) => void;
  removeItem: (id: string) => void;
  clear: () => void;
  openCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const storageKey = "interieurkunst-cb-cart";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [open, setOpen] = useState(false);
  const storageLoaded = useRef(false);

  useEffect(() => {
    let storedItems: CartItem[] = [];
    try {
      const stored = window.localStorage.getItem(storageKey);
      const parsed = stored ? JSON.parse(stored) : [];
      if (Array.isArray(parsed)) storedItems = parsed as CartItem[];
    } catch {
      window.localStorage.removeItem(storageKey);
    }
    queueMicrotask(() => {
      storageLoaded.current = true;
      setItems(storedItems);
    });
  }, []);

  useEffect(() => {
    if (!storageLoaded.current) return;
    window.localStorage.setItem(storageKey, JSON.stringify(items));
  }, [items]);

  const addItem = useCallback((product: Product) => {
    if (product.priceCents === null || product.status !== "available") return;
    setItems((current) => current.some((item) => item.id === product.id) ? current : [...current, product]);
    setOpen(true);
  }, []);

  const removeItem = useCallback((id: string) => setItems((current) => current.filter((item) => item.id !== id)), []);
  const clear = useCallback(() => setItems([]), []);
  const openCart = useCallback(() => setOpen(true), []);
  const value = useMemo(() => ({ items, addItem, removeItem, clear, openCart }), [items, addItem, removeItem, clear, openCart]);
  const total = items.reduce((sum, item) => sum + (item.priceCents ?? 0), 0);

  return (
    <CartContext.Provider value={value}>
      {children}
      {open && <button className="cart-backdrop" aria-label="Winkelmand sluiten" onClick={() => setOpen(false)} />}
      <aside className={`cart-drawer${open ? " is-open" : ""}`} aria-hidden={!open} inert={!open} aria-label="Winkelmand">
        <div className="cart-drawer-head">
          <div>
            <p className="eyebrow">Jouw selectie</p>
            <h2>Winkelmand</h2>
          </div>
          <button className="icon-button" type="button" onClick={() => setOpen(false)} aria-label="Winkelmand sluiten">
            <X aria-hidden="true" size={20} strokeWidth={1.5} />
          </button>
        </div>
        {items.length === 0 ? (
          <div className="cart-empty">
            <p>Je winkelmand is nog leeg.</p>
            <Link className="text-link" href="/collectie" onClick={() => setOpen(false)}>Bekijk de shop →</Link>
          </div>
        ) : (
          <>
            <div className="cart-items">
              {items.map((item) => (
                <div className="cart-line" key={item.id}>
                  <div>
                    <strong>{item.name}</strong>
                    <span>{formatPrice(item.priceCents)}</span>
                  </div>
                  <button type="button" onClick={() => removeItem(item.id)}>Verwijder</button>
                </div>
              ))}
            </div>
            <div className="cart-total"><span>Totaal</span><strong>{formatPrice(total)}</strong></div>
            <p className="cart-note">Unieke werken hebben altijd een aantal van één.</p>
            <Link className="button button-dark button-wide" href="/checkout" onClick={() => setOpen(false)}>Naar afrekenen ↗</Link>
          </>
        )}
      </aside>
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart moet binnen CartProvider worden gebruikt");
  return context;
}
