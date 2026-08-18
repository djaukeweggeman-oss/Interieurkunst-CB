import type { Metadata } from "next";
import { CollectionExplorer } from "@/components/collection-explorer";
import { publicProducts } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Shop",
  description: "Bekijk de beschikbare schilderijen en toekomstige handgemaakte objecten van Carolien Ballast.",
};

export default function CollectionPage() {
  return (
    <main className="page-shell collection-page">
      <header className="page-intro split-intro">
        <p className="eyebrow">Shop, beschikbare werken</p>
        <h1>Kunst voor een nieuwe plek.</h1>
        <p>De toekomstige shop is alvast ingericht met Carolien haar actuele werken. Ieder werk is uniek; definitieve prijzen en online verkoop volgen zodra alle gegevens zijn bevestigd.</p>
      </header>
      <div className="shop-principles" aria-label="Kenmerken van de shop">
        <div><small>01</small><span>Elk werk is uniek</span></div>
        <div><small>02</small><span>Volledig beeld, zonder uitsnede</span></div>
        <div><small>03</small><span>Levering straks in overleg</span></div>
      </div>
      <CollectionExplorer products={publicProducts} />
    </main>
  );
}
