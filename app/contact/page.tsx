import type { Metadata } from "next";
import { Suspense } from "react";
import { ContactForm } from "@/components/contact-form";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = { title: "Contact", description: "Neem contact op met Carolien Ballast over een kunstwerk, bezorging of een persoonlijke opdracht." };

export default function ContactPage() {
  return <main className="page-shell contact-page"><header className="page-intro split-intro"><p className="eyebrow">Contact</p><h1>Een vraag, idee of werk gezien?</h1><p>Neem gerust contact op. Carolien denkt graag mee over een kunstwerk, bezorging of een persoonlijke opdracht.</p></header><section className="contact-layout"><div className="contact-details"><p className="eyebrow">Rechtstreeks</p><a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a><a href={`tel:${siteConfig.phone.replace(/\s/g, "")}`}>{siteConfig.phone}</a><span>{siteConfig.location}</span><p className="privacy-short">Er wordt geen volledig woonadres gepubliceerd. Persoonsgegevens worden alleen gebruikt om je vraag te behandelen.</p></div><Suspense fallback={<p>Formulier laden…</p>}><ContactForm /></Suspense></section></main>;
}
