import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArtworkLightbox } from "@/components/artwork-lightbox";

export const metadata: Metadata = { title: "Over Carolien", description: "Maak kennis met Carolien Ballast en haar vrije werk en schilderijen in opdracht." };

export default function AboutPage() {
  return <main className="about-page">
    <section className="about-hero"><div className="about-title"><p className="eyebrow">Carolien Ballast</p><h1>Schilderen begint bij wat blijft hangen.</h1></div><div className="about-image"><Image src="/art/carolien.jpg" alt="Carolien Ballast schildert in haar atelier" fill priority sizes="(max-width: 800px) 100vw, 50vw" /></div><p className="about-lead">Mensen, dieren, natuur — Carolien schildert wat haar raakt. Soms vrij en intuïtief, soms in opdracht rond een heel persoonlijk verhaal.</p></section>
    <section className="about-story"><p className="story-large">In een dorp in de omgeving van Deventer vindt ze de rust om te kijken, te proberen en opnieuw te beginnen.</p><div><p>Met acryl waardeert Carolien vooral de vrijheid: een kleur kan veranderen, een laag kan verdwijnen of juist zichtbaar blijven. Olieverf opent weer andere technieken en een ander tempo.</p><p>Wanneer ze schildert, draagt ze graag haar oude werkkleding — en vaak het oude vest van haar vader. Dat vest is meer dan praktisch. Het is een persoonlijke inspiratiebrenger die met haar meebeweegt in het atelier.</p><p>Carolien maakt zowel vrij werk als kunst in opdracht, waaronder portretten en schilderijen van huisdieren.</p><Link className="text-link" href="/kunst-in-opdracht">Lees over kunst in opdracht →</Link></div></section>
    <section className="about-art"><ArtworkLightbox className="about-artwork" src="/art/abstract-80x80.jpg" alt="Abstract schilderij van Carolien Ballast" caption="Abstract 80 × 80" sizes="100vw" /><blockquote>“De verf mag verrassen. Juist in het zoeken ontstaat vaak het werk.”</blockquote></section>
  </main>;
}
