import Link from "next/link";
import { ArtworkLightbox } from "@/components/artwork-lightbox";
import { categoryLabels, formatPrice, statusLabels, type Product } from "@/lib/catalog";

export function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const image = product.images[0];
  return (
    <article className={`product-card product-card-${index % 3}`}>
      {image ? <div className="product-visual">
        <ArtworkLightbox
          className="product-image"
          src={image.src}
          alt={image.alt}
          caption={product.name}
          priority={index === 0}
          sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 33vw"
          style={{ aspectRatio: "4 / 5" }}
        />
        <span className={`status-chip status-${product.status}`}>{statusLabels[product.status]}</span>
      </div> : <div className="concept-art" aria-label="Conceptbeeld wordt later toegevoegd"><span>Concept</span></div>}
      <div className="product-info">
        <div><p>{categoryLabels[product.category]}</p><h2><Link href={`/collectie/${product.slug}`}>{product.name}</Link></h2><Link className="product-detail-link" href={`/collectie/${product.slug}`}>Bekijk details →</Link></div>
        <p>{formatPrice(product.priceCents)}</p>
      </div>
    </article>
  );
}
