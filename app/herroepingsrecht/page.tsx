import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
export const metadata: Metadata = { title: "Herroepingsrecht" };
export default function WithdrawalPage() { return <LegalPage eyebrow="Juridisch concept" title="Herroepingsrecht" intro="Informatie over bedenktijd bij online aankopen."><h2>Standaardwerken</h2><p>Voor online gekochte standaardwerken geldt in beginsel een wettelijke bedenktijd. De precieze termijn, startdatum, uitzonderingen en retourinstructies worden vóór livegang juridisch gecontroleerd.</p><h2>Persoonlijk maatwerk</h2><p>Een schilderij dat volgens persoonlijke specificaties wordt gemaakt kan buiten het herroepingsrecht vallen. Dit wordt altijd vóór de opdracht duidelijk en afzonderlijk overeengekomen.</p><h2>Herroepen</h2><p>Een definitief modelformulier, retouradres en praktische instructies worden toegevoegd zodra de bedrijfsgegevens en retourprocedure zijn vastgesteld.</p></LegalPage>; }

