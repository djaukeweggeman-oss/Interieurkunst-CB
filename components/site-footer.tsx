import Link from "next/link";
import { siteConfig } from "@/lib/site-config";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-heading">
        <Link className="footer-mark" href="/" aria-label="Interieurkunst CB, home">
          <p><span>Interieurkunst</span><span>CB</span></p>
          <span>Kunst van Carolien Ballast</span>
        </Link>
        <p>Vrij werk en persoonlijke schilderijen vanuit Carolien haar atelier nabij Deventer.</p>
      </div>
      <div className="footer-links">
        <div><small>Ontdek</small><Link href="/collectie">Shop</Link><Link href="/eerder-werk">Eerder werk</Link><Link href="/kunst-in-opdracht">Kunst in opdracht</Link></div>
        <div><small>Atelier</small><Link href="/over-carolien">Over Carolien</Link><Link href="/contact">Contact</Link></div>
        <div><small>Contact</small><a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a><a href={`tel:${siteConfig.phone.replace(/\s/g, "")}`}>{siteConfig.phone}</a><span>{siteConfig.location}</span></div>
        <div><small>Informatie</small><Link href="/privacy">Privacy</Link><Link href="/voorwaarden">Voorwaarden</Link><Link href="/verzending-retourneren">Verzending & retourneren</Link><Link href="/bedrijfsgegevens">Bedrijfsgegevens</Link></div>
      </div>
      <div className="footer-bottom"><span>© {new Date().getFullYear()} Interieurkunst CB</span><span>Unieke kunst · met de hand gemaakt</span></div>
    </footer>
  );
}
