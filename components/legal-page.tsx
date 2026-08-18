import Link from "next/link";

export function LegalPage({ eyebrow, title, intro, children, review = true }: { eyebrow: string; title: string; intro: string; children: React.ReactNode; review?: boolean }) {
  return <main className="page-shell legal-page"><header className="page-intro compact-intro"><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p>{intro}</p></header>{review && <aside className="legal-draft"><strong>Concept voor lokale controle</strong><p>Deze tekst is nog geen definitief juridisch advies. Ontbrekende bedrijfsgegevens zijn bewust niet ingevuld en moeten vóór livegang worden gecontroleerd.</p></aside>}<article className="legal-content">{children}</article><Link className="text-link" href="/contact">Vraag stellen →</Link></main>;
}

