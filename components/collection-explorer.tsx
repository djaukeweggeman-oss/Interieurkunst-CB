"use client";

import { useMemo, useState } from "react";
import { ProductCard } from "./product-card";
import { categoryLabels, type Product, type ProductCategory, type ProductStatus } from "@/lib/catalog";

type AvailabilityFilter = "all" | Extract<ProductStatus, "available" | "sold">;

export function CollectionExplorer({ products }: { products: Product[] }) {
  const categories = Array.from(new Set(products.map((product) => product.category)));
  const statuses = Array.from(new Set(products.map((product) => product.status)));
  const [category, setCategory] = useState<"all" | ProductCategory>("all");
  const [availability, setAvailability] = useState<AvailabilityFilter>("all");
  const [sort, setSort] = useState<"new" | "low" | "high">("new");

  const visible = useMemo(() => {
    const result = products.filter((product) => (category === "all" || product.category === category) && (availability === "all" || product.status === availability));
    if (sort === "low") return [...result].sort((a, b) => (a.priceCents ?? Number.MAX_SAFE_INTEGER) - (b.priceCents ?? Number.MAX_SAFE_INTEGER));
    if (sort === "high") return [...result].sort((a, b) => (b.priceCents ?? -1) - (a.priceCents ?? -1));
    return result;
  }, [availability, category, products, sort]);

  return (
    <>
      <div className="collection-toolbar">
        <div className="filter-group" aria-label="Categorieën">
          <button className={category === "all" ? "is-active" : ""} onClick={() => setCategory("all")} type="button">Alles</button>
          {categories.map((item) => <button className={category === item ? "is-active" : ""} onClick={() => setCategory(item)} type="button" key={item}>{categoryLabels[item]}</button>)}
        </div>
        <div className="filter-group" aria-label="Beschikbaarheid">
          {statuses.includes("available") && <button className={availability === "available" ? "is-active" : ""} onClick={() => setAvailability(availability === "available" ? "all" : "available")} type="button">Beschikbaar</button>}
          {statuses.includes("sold") && <button className={availability === "sold" ? "is-active" : ""} onClick={() => setAvailability(availability === "sold" ? "all" : "sold")} type="button">Verkocht</button>}
        </div>
        <label className="sort-select">Sorteer <select value={sort} onChange={(event) => setSort(event.target.value as typeof sort)}><option value="new">Nieuwste eerst</option><option value="low">Prijs laag — hoog</option><option value="high">Prijs hoog — laag</option></select></label>
      </div>
      <div className="collection-count">{visible.length} {visible.length === 1 ? "werk" : "werken"}</div>
      {visible.length ? <div className="collection-grid">{visible.map((product, index) => <ProductCard product={product} index={index} key={product.id} />)}</div> : <div className="empty-state"><h2>Geen werken in deze selectie</h2><p>Kies een andere categorie of beschikbaarheidsstatus.</p></div>}
    </>
  );
}

