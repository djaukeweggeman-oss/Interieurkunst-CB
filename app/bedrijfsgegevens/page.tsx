import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import { siteConfig } from "@/lib/site-config";
export const metadata: Metadata = { title: "Contact en bedrijfsgegevens" };
export default function BusinessPage() { return <LegalPage eyebrow="Transparantie" title="Contact & bedrijfsgegevens" intro="De bekende gegevens van Interieurkunst CB."><dl className="business-list"><div><dt>Handelsnaam</dt><dd>Interieurkunst CB — nog te bevestigen bij inschrijving</dd></div><div><dt>Contactpersoon</dt><dd>{siteConfig.artist}</dd></div><div><dt>E-mail</dt><dd>{siteConfig.email}</dd></div><div><dt>Telefoon</dt><dd>{siteConfig.phone}</dd></div><div><dt>Regio</dt><dd>{siteConfig.location}</dd></div><div><dt>KvK-nummer</dt><dd>Nog niet beschikbaar</dd></div><div><dt>Btw-id</dt><dd>Nog niet beschikbaar</dd></div><div><dt>Vestigings- en retouradres</dt><dd>Nog niet bevestigd; niet openbaar gepubliceerd</dd></div></dl></LegalPage>; }
