import Image from "next/image";
import Link from "next/link";
import { ArtworkLightbox } from "@/components/artwork-lightbox";
import { ProductCard } from "@/components/product-card";
import { getPublicCatalog } from "@/lib/catalog-data";

export const revalidate = 60;

export default async function HomePage() {
  const { products, source } = await getPublicCatalog();
  return (
    <main>
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-copy">
          <p className="eyebrow">Vrij werk · kunst in opdracht</p>
          <h1 id="hero-title">
            <span className="hero-title-line">Kunst met</span>
            <span className="hero-title-line hero-title-mixed">een <em>eigen</em></span>
            <em className="hero-title-line hero-title-last">aanwezigheid.</em>
          </h1>
          <p className="hero-intro">
            Expressieve schilderijen en handgemaakte objecten die een ruimte
            niet alleen vullen, maar er iets wakker maken.
          </p>
          <div className="hero-actions">
            <Link className="button button-dark" href="/collectie">
              Bekijk de shop <span aria-hidden="true">↗</span>
            </Link>
            <Link className="text-link" href="/eerder-werk">
              Ontdek eerder werk <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>

        <figure className="hero-artwork">
          <ArtworkLightbox className="hero-image-wrap" src="/art/studio-hero.jpg" alt="Een schilderij van Carolien Ballast in een warm interieur" caption="Werk van Carolien Ballast in een interieur" priority sizes="(max-width: 900px) 100vw, 59vw" />
          <figcaption>
            <span>In een interieur</span>
            <span>Werk van Carolien Ballast</span>
          </figcaption>
        </figure>

        <p className="hero-index" aria-hidden="true">
          01 — 04
        </p>
      </section>

      <div className="discipline-strip" aria-label="Kunstvormen">
        <span>Schilderijen</span>
        <span>Handgemaakte potten</span>
        <span>Decoratieve objecten</span>
        <span>Kunst in opdracht</span>
      </div>

      <section className="intro-statement">
        <p className="eyebrow">Atelier nabij Deventer</p>
        <p>
          Geïnspireerd door <em>mens, dier en natuur</em> maakt Carolien vrij
          werk én persoonlijke schilderijen in opdracht.
        </p>
      </section>

      <section className="home-collection">
        <div className="section-heading">
          <div><p className="eyebrow">Shop · in voorbereiding</p><h2>Beschikbare werken</h2></div>
          <Link className="text-link" href="/collectie">Bekijk de volledige shop →</Link>
        </div>
        <div className="featured-grid">
          {products.filter((product) => product.featured).slice(0, 3).map((product, index) => <ProductCard product={product} index={index} key={product.id} />)}
        </div>
        {source === "fallback" && <p className="content-note">De huidige werken blijven als veilige voorbeeldcatalogus zichtbaar totdat de Supabase-productgegevens zijn ingevoerd. Zonder bevestigde prijs kan niets worden afgerekend.</p>}
      </section>

      <section className="artist-feature">
        <div className="artist-image"><Image src="/art/carolien.jpg" alt="Carolien Ballast aan het werk in haar atelier" fill sizes="(max-width: 760px) 100vw, 46vw" /></div>
        <div className="artist-copy">
          <p className="eyebrow">De maker</p>
          <h2>Vrij werk vanuit gevoel. Persoonlijk werk vanuit een verhaal.</h2>
          <p>Carolien schildert wat haar raakt: mensen, dieren en natuur. In haar atelier nabij Deventer werkt ze met acryl en olieverf, vaak met het oude vest van haar vader aan — een stille inspiratiebrenger.</p>
          <Link className="text-link" href="/over-carolien">Ontmoet Carolien →</Link>
        </div>
      </section>

      <section className="commission-teaser">
        <ArtworkLightbox className="commission-art" src="/art/portret-editorial.jpg" alt="Kleurrijk portretschilderij van Carolien Ballast" caption="Portret in opdracht" sizes="(max-width: 760px) 100vw, 38vw" />
        <div>
          <p className="eyebrow">Een werk voor jou</p>
          <h2>Jouw verhaal, geschilderd.</h2>
          <p>Een dierbaar portret, huisdier of abstract werk dat precies past bij jouw ruimte. Samen bespreken we beeld, formaat, kleuren en stijl.</p>
          <Link className="button button-light" href="/kunst-in-opdracht">Ontdek de werkwijze ↗</Link>
        </div>
      </section>
    </main>
  );
}
