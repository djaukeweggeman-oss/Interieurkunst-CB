import type { Metadata } from "next";
import { ArtworkLightbox } from "@/components/artwork-lightbox";
import { CommissionForm } from "@/components/commission-form";

export const metadata: Metadata = { title: "Kunst in opdracht", description: "Laat Carolien Ballast een persoonlijk schilderij maken op basis van jouw verhaal en een scherpe referentiefoto." };

const steps = [
  ["01", "Vrijblijvend kennismaken", "Vertel Carolien wat je in gedachten hebt en voor wie of welke plek het werk bedoeld is."],
  ["02", "Wensen samenbrengen", "Afbeelding, formaat, kleuren en stijl worden zorgvuldig besproken."],
  ["03", "Een goede foto", "Carolien werkt op basis van een voldoende scherpe referentiefoto."],
  ["04", "Heldere afspraak", "Prijs, materiaal en planning worden vooraf vastgelegd."],
  ["05", "Het werk ontstaat", "Daarna begint het persoonlijke schilderproces in Carolien haar atelier."],
];

export default function CommissionPage() {
  return <main className="commission-page">
    <section className="commission-hero"><div><p className="eyebrow">Persoonlijk gemaakt</p><h1>Een verhaal dat alleen van jou kan zijn.</h1><p>Voor jezelf, voor iemand die je dierbaar is of als ankerpunt in een interieur. Carolien vertaalt jouw foto en wensen naar een uniek schilderij.</p></div><ArtworkLightbox className="commission-hero-image" src="/art/portret-editorial.jpg" alt="Kleurrijk portret door Carolien Ballast" caption="Portret in opdracht" priority sizes="(max-width: 800px) 100vw, 47vw" /></section>
    <section className="process-section"><div className="section-heading"><div><p className="eyebrow">Van idee naar kunstwerk</p><h2>Zo werkt een opdracht</h2></div></div><ol className="process-list">{steps.map(([number, title, body]) => <li key={number}><span>{number}</span><h3>{title}</h3><p>{body}</p></li>)}</ol></section>
    <section className="form-section"><div className="form-intro"><p className="eyebrow">Vertel je idee</p><h2>Begin vrijblijvend.</h2><p>Je hoeft nog niet alles te weten. Een eerste idee, foto of gevoel is genoeg om samen te onderzoeken wat mogelijk is.</p></div><CommissionForm /></section>
  </main>;
}
