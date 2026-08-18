import type { Metadata } from "next";
import { PortfolioGallery } from "@/components/portfolio-gallery";
import { getPortfolioItems } from "@/lib/catalog-data";

export const metadata: Metadata = { title: "Eerder werk", description: "Een selectie portretten, dieren, abstract werk, tekeningen en olieverf van Carolien Ballast." };

export const revalidate = 60;

export default async function PortfolioPage() {
  return <main className="page-shell portfolio-page"><header className="page-intro split-intro"><p className="eyebrow">Portfolio</p><h1>Werk dat een spoor heeft achtergelaten.</h1><p>Een selectie uit Carolien haar eerdere werk. Omdat titels, jaartallen en technieken niet overal bekend zijn, zijn die bewust niet ingevuld.</p></header><PortfolioGallery items={await getPortfolioItems()} /></main>;
}
