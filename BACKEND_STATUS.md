# Backendstatus

## Volledig gebouwd en lokaal geverifieerd

- Versiebeheerbare Supabase-migraties voor alle gevraagde tabellen, constraints, indexen en timestamps.
- Rollen `admin` en `editor` via `profiles`, zonder openbare registratie of noodwachtwoord.
- RLS op alle publieke en gevoelige tabellen; klantdata is nooit openbaar leesbaar.
- Afgeschermde `product-images`-bucket met publiek leesrecht uitsluitend voor gepubliceerde werken, plus privé `commission-uploads`.
- Gegenereerde-vorm TypeScript-databasetypes en getypeerde Supabase-clients.
- Supabase-catalogus voor home, shop, productdetail en portfolio met niet-bestelbare fallback.
- Productbeheer, archivering, publiceren, prijzen/btw, levering en afbeeldingsbeheer.
- Orderoverzicht, filters, zoeken, detail, tijdlijn, verwerking, verzending, afronding en bevestigde refund.
- Contact- en opdrachtaanvragen met Zod, honeypot, duurzame rate limiting, deduplicatie en plain-text sanitization.
- Privé-referentiefoto’s met type/signatuurcontrole, limiet, metadata-verwijdering en signed URLs.
- Servercheckout die prijzen, btw, levering en voorraad uitsluitend uit de database gebruikt.
- Atomaire unieke reserveringen, automatische vrijgave en databaseblokkade tegen dubbele verkoop.
- Mollie-paymentcreatie, redirect, gecontroleerde statuspagina en idempotente webhook.
- Beveiligd cronendpoint voor verlopen reserveringen.
- E-mailqueue-interface en zes templates; veilig uitgeschakeld zonder provider.
- Centrale publieke site-instellingen en privé reserveringsduur.
- 12 backendtests, ESLint, TypeScript-controle, statische RLS/migratiecontrole en een geslaagde Next.js-productiebuild.
- Next.js 16.3.1 met 0 bekende kwetsbaarheden in productieafhankelijkheden volgens `npm audit --omit=dev`.
- Visueel gecontroleerde desktop- en mobiele flows zonder horizontale overflow, kapotte beelden of browserconsolefouten.

## Extern nog niet actief

- De remote Supabase-migratie is via dry-run gecontroleerd, maar nog niet toegepast zolang expliciete goedkeuring voor de databaseschemawijziging ontbreekt.
- De lokale en Vercel-omgeving missen nog minimaal de service-role key; deze mag niet in Git worden gezet.
- Mollie kan nog niet worden geactiveerd omdat bedrijfsinschrijving, btw-gegevens, zakelijke rekening en Mollie-onboarding ontbreken.
- Resend of een andere e-mailprovider is nog niet gekozen en het afzenderdomein is niet geverifieerd.
- Er is nog geen eerste Auth-gebruiker met een `profiles`-rij aangemaakt.

De applicatie faalt in deze situaties gesloten: geen nepbestelling, geen onbeveiligde login en geen claim dat een bericht of e-mail echt is verwerkt.
