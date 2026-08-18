"use client";

import { useMemo, useState } from "react";
import { ArtworkLightbox } from "@/components/artwork-lightbox";
import type { PortfolioItem } from "@/lib/catalog";

export function PortfolioGallery({ items }: { items: PortfolioItem[] }) {
  const categories = ["Alles", ...Array.from(new Set(items.map((item) => item.category)))] as const;
  const [active, setActive] = useState<string>("Alles");
  const visible = useMemo(() => active === "Alles" ? items : items.filter((item) => item.category === active), [active, items]);
  return (
    <>
      <div className="filter-group portfolio-filters">{categories.map((category) => <button className={active === category ? "is-active" : ""} type="button" onClick={() => setActive(category)} key={category}>{category}</button>)}</div>
      <div className="portfolio-grid">{visible.map((item, index) => <figure className="portfolio-item" key={item.id}><ArtworkLightbox className="portfolio-artwork" src={item.src} alt={item.alt} caption={`Eerder werk · ${item.category}`} priority={index === 0} sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 33vw" /><figcaption><span>{item.category}</span><span>{String(index + 1).padStart(2, "0")}</span></figcaption></figure>)}</div>
    </>
  );
}
