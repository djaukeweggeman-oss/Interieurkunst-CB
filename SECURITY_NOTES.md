# Beveiligingsnotities

## Vertrouwensgrenzen

- De browser mag product-ID’s en klantinvoer sturen, maar nooit prijs, btw, voorraad, verzendkosten of betaalstatus bepalen.
- De service-role key bestaat alleen in serverroutes en servermodules en staat nooit onder `NEXT_PUBLIC_*`.
- Bezoekers bestellen zonder account; orders zijn alleen via een willekeurige publieke token beperkt zichtbaar met een minimale statusselectie.
- Beheer-API’s controleren op iedere request de Auth-sessie en de rol uit `profiles`.

## Database en RLS

- RLS staat op alle relevante tabellen.
- Publiek leesbaar zijn alleen actieve categorieën, gepubliceerde zichtbare producten, gekoppelde afbeeldingen en expliciet publieke instellingen.
- Orders, orderregels, reserveringen, aanvragen, profielen, rate limits, betaal- en e-mailgebeurtenissen zijn niet publiek leesbaar.
- Rollen kunnen alleen via een geautoriseerde serverroute of rechtstreeks beveiligd databasebeheer worden gewijzigd.

## Voorraad en betalingen

- `reserve_products_for_checkout` vergrendelt productrijen met `FOR UPDATE`, weigert dubbele ID’s en maakt order, snapshots en reserveringen in één transactie.
- Een partiële unieke index staat maximaal één actieve reservering per product toe.
- Producten worden pas `sold` na een rechtstreeks bij Mollie opgehaalde, gecontroleerde `paid`-status.
- Webhooks vergelijken payment-ID, metadata, valuta en bedrag en gebruiken een unieke event key voor idempotentie.
- Refunds vereisen adminrechten en bevestiging door het ordernummer opnieuw in te typen.

## Formulieren en bestanden

- Zod valideert lengte, e-mail, datum en toegestane waarden.
- Honeypot, minimale invultijd, duurzame database-rate limiting en unieke submission hashes beperken misbruik en dubbele inzendingen.
- Request-fingerprints worden gehasht met een servergeheim; ruwe IP-adressen worden niet opgeslagen.
- Beheerteksten worden als plain text opgeslagen en React escaped ze bij weergave.
- Alleen JPEG, PNG en WebP met kloppende magic bytes worden geaccepteerd.
- Sharp decodeert en encodeert opnieuw zonder EXIF of andere metadata.
- Opdrachtreferenties blijven privé en worden alleen via een vijf minuten geldige signed URL getoond.

## Logging en fouten

- Publieke responses bevatten Nederlandse, niet-technische meldingen.
- Serverlogs bevatten een gebied en foutcode, geen volledige persoonsgegevens, formulierinhoud of secrets.
- Zonder externe configuratie sluit de functie veilig: geen demo-opslag, geen schijnbetaling en geen onveilige beheerlogin.

## Open punten

- De productieafhankelijkheden zijn op 18 augustus 2026 gecontroleerd met `npm audit --omit=dev`: 0 bekende kwetsbaarheden. Herhaal dit periodiek en beoordeel updates zonder geforceerde major upgrades.
- Stel bewaartermijnen voor orders, aanvragen, privébeelden, logs en e-mailgebeurtenissen juridisch vast.
- Activeer MFA voor Supabase, GitHub, Vercel, Mollie en de gekozen e-mailprovider.
