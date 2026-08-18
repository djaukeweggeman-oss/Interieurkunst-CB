"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, ShoppingBag, X } from "lucide-react";
import { useState } from "react";
import { useCart } from "./cart-provider";

const links = [
  ["/eerder-werk", "Eerder werk"],
  ["/collectie", "Shop"],
  ["/kunst-in-opdracht", "In opdracht"],
  ["/over-carolien", "Over Carolien"],
] as const;

export function SiteHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const { items, openCart } = useCart();
  const isActive = (href: string) => href === "/collectie" ? pathname.startsWith(href) : pathname === href;

  return (
    <>
      <header className="site-header">
        <nav className="header-nav" aria-label="Hoofdnavigatie">
          {links.slice(0, 2).map(([href, label]) => <Link className={isActive(href) ? "is-active" : ""} href={href} key={href}>{label}</Link>)}
        </nav>
        <Link className="wordmark" href="/" aria-label="Interieurkunst CB, home">
          <span>Interieurkunst CB</span>
          <small>Carolien Ballast</small>
        </Link>
        <nav className="header-nav header-nav-right" aria-label="Secundaire navigatie">
          <Link className={isActive("/over-carolien") ? "is-active" : ""} href="/over-carolien">Over Carolien</Link>
          <Link className={isActive("/kunst-in-opdracht") ? "is-active" : ""} href="/kunst-in-opdracht">In opdracht</Link>
          <button className="bag-button" type="button" onClick={openCart} aria-label={`Winkelmand met ${items.length} werken`}>
            <ShoppingBag aria-hidden="true" size={17} strokeWidth={1.5} /><span>{items.length}</span>
          </button>
          <button className="menu-button" type="button" onClick={() => setMenuOpen(true)} aria-label="Menu openen">
            <Menu aria-hidden="true" size={22} strokeWidth={1.5} />
          </button>
        </nav>
      </header>
      <div className={`mobile-menu${menuOpen ? " is-open" : ""}`} aria-hidden={!menuOpen} inert={!menuOpen}>
        <div className="mobile-menu-head">
          <span>Menu</span>
          <button className="icon-button" type="button" onClick={() => setMenuOpen(false)} aria-label="Menu sluiten"><X size={22} /></button>
        </div>
        <nav aria-label="Mobiele navigatie">
          {links.map(([href, label], index) => <Link className={isActive(href) ? "is-active" : ""} href={href} onClick={() => setMenuOpen(false)} key={href}><small>0{index + 1}</small>{label}</Link>)}
          <Link href="/contact" onClick={() => setMenuOpen(false)}><small>05</small>Contact</Link>
        </nav>
      </div>
    </>
  );
}
