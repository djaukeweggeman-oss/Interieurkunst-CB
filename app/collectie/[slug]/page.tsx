import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCart } from "@/components/add-to-cart";
import { ArtworkLightbox } from "@/components/artwork-lightbox";
import { ProductCard } from "@/components/product-card";
import { categoryLabels, formatPrice, statusLabels } from "@/lib/catalog";
import { getPublicProduct, getPublicProducts } from "@/lib/catalog-data";
import { siteConfig } from "@/lib/site-config";

type Props = { params: Promise<{ slug: string }> };

export const revalidate = 60;

export async function generateStaticParams() {
  return (await getPublicProducts()).map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getPublicProduct(slug);
  if (!product) return {};
  const description = product.description.slice(0, 155);
  const image = product.images[0] ? new URL(product.images[0].src, siteConfig.siteUrl).toString() : undefined;
  return {
    title: product.name,
    description,
    openGraph: { title: product.name, description, images: image ? [{ url: image, alt: product.images[0].alt }] : [] },
    twitter: { card: "summary_large_image", title: product.name, description, images: image ? [image] : [] },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getPublicProduct(slug);
  if (!product) notFound();
  const related = (await getPublicProducts()).filter((item) => item.id !== product.id && item.category === product.category).slice(0, 3);
  const details = [
    ["Afmetingen", product.dimensions], ["Materiaal", product.material], ["Techniek", product.technique], ["Jaar", product.year?.toString()], ["Categorie", categoryLabels[product.category]],
  ].filter(([, value]) => value);
  const deliveryOptions = [
    product.canBePickedUp && "Afhalen op afspraak",
    product.canBeShipped && `Verzenden${product.shippingCostCents ? ` (${formatPrice(product.shippingCostCents)})` : ""}`,
    product.deliveryInConsultation && "Levering in overleg",
  ].filter(Boolean).join(" · ");
  const structuredData = {
    "@context": "https://schema.org", "@type": "Product", name: product.name, description: product.description,
    image: product.images.map((image) => new URL(image.src, siteConfig.siteUrl).toString()),
    brand: { "@type": "Brand", name: "Interieurkunst CB" },
    offers: product.priceCents === null ? undefined : { "@type": "Offer", priceCurrency: "EUR", price: (product.priceCents / 100).toFixed(2), availability: product.status === "available" ? "https://schema.org/InStock" : "https://schema.org/OutOfStock" },
  };
  return (
    <main className="product-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <nav className="breadcrumbs" aria-label="Broodkruimel"><Link href="/collectie">Shop</Link><span>—</span><span>{product.name}</span></nav>
      <section className="product-layout">
        <div className="product-gallery">
          {product.images.length ? product.images.map((image, index) => <ArtworkLightbox className="product-detail-image" src={image.src} alt={image.alt} caption={product.name} priority={index === 0} sizes="(max-width: 860px) 100vw, 58vw" style={{ aspectRatio: `${image.width} / ${image.height}` }} key={image.src} />) : <div className="concept-art"><span>Beeld volgt</span></div>}
        </div>
        <aside className="product-summary">
          <p className="eyebrow">{categoryLabels[product.category]} · {statusLabels[product.status]}</p>
          <h1>{product.name}</h1>
          <p className="product-price">{formatPrice(product.priceCents)}</p>
          <p className="product-description">{product.description}</p>
          <dl>{details.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
          <div className="delivery-note"><strong>Levering</strong><p>{deliveryOptions || "Neem contact op om de levering af te stemmen."}</p></div>
          <AddToCart product={product} />
          {product.priceCents === null && <Link className="text-link product-enquiry" href={`/contact?werk=${encodeURIComponent(product.name)}`}>Vraag naar dit werk →</Link>}
        </aside>
      </section>
      {related.length > 0 && <section className="related"><div className="section-heading"><div><p className="eyebrow">Meer ontdekken</p><h2>Andere werken</h2></div></div><div className="featured-grid">{related.map((item, index) => <ProductCard product={item} index={index} key={item.id} />)}</div></section>}
    </main>
  );
}
