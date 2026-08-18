# Interieurkunst CB

Portfolio en webshop voor Carolien Ballast, gebouwd met Next.js App Router, TypeScript, Supabase en Mollie. De bestaande vormgeving blijft leidend; publieke pagina’s lezen echte Supabase-data zodra de database is ingericht en gebruiken tot die tijd uitsluitend de duidelijk gemarkeerde, niet-bestelbare voorbeeldcatalogus.

## Lokaal installeren

Vereist: Node.js 22.13 of nieuwer en de Supabase CLI.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`. Voer vóór een commit uit:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Omgevingsvariabelen

Vul lokaal `.env.local` in en zet dezelfde waarden per omgeving in Vercel. Alleen `NEXT_PUBLIC_*` mag in de browser terechtkomen.

- `NEXT_PUBLIC_SUPABASE_URL`: project-URL uit Supabase.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: publieke anon/publishable key.
- `SUPABASE_SERVICE_ROLE_KEY`: uitsluitend server-side; nooit committen of tonen.
- `MOLLIE_API_KEY`: tijdens ontwikkeling uitsluitend `test_*`.
- `MOLLIE_WEBHOOK_SECRET`: lange willekeurige waarde die in de webhook-URL wordt meegestuurd.
- `NEXT_PUBLIC_SITE_URL`: lokaal `http://localhost:3000`, voor Mollie een publieke HTTPS-URL.
- `ADMIN_EMAIL`: ontvanger van beheermeldingen.
- `RATE_LIMIT_SECRET`: willekeurige serverwaarde voor gehashte request-fingerprints.
- `CRON_SECRET`: lange willekeurige bearer-token voor de reserveringscron.
- `EMAIL_FROM` en `RESEND_API_KEY`: pas invullen nadat het afzenderdomein is geverifieerd.

`.env.example` bevat alleen lege voorbeeldwaarden. `.env.local` en `.vercel` zijn genegeerd door Git.

## Supabase koppelen en migreren

Het bedoelde project heet `Interieurkunst CB`.

```bash
supabase login
supabase link --project-ref <project-ref>
supabase migration list --linked
supabase db push --linked --dry-run
supabase db push --linked
```

De migraties staan in `supabase/migrations`:

1. `202608180001_initial_shop.sql` maakt de oorspronkelijke webshopbasis.
2. `202608180002_complete_backend.sql` migreert die veilig naar het volledige schema met profielen, uitgebreide producten, orders, orderregels, reserveringen, aanvragen, instellingen, rate limiting, e-mail- en betaalgebeurtenissen, RLS en Storage.

De tweede migratie bewaart bestaande rijen en voert geen testproducten of persoonsgegevens in.

## TypeScript-types genereren

Na iedere schemawijziging:

```bash
supabase gen types typescript --linked > lib/supabase/database.types.ts
npm run typecheck
```

Controleer de diff voordat de gegenereerde types worden gecommit.

## Eerste beheerder veilig toevoegen

Er is geen openbare registratie en geen hardcoded wachtwoord.

1. Zet openbare registratie uit in Supabase Authentication.
2. Maak Carolien via het Supabase-dashboard aan met een uniek tijdelijk wachtwoord en een bevestigd e-mailadres.
3. Kopieer het UUID uit `auth.users`.
4. Voer in de SQL Editor uit:

```sql
insert into public.profiles(id, full_name, role)
values ('<auth-user-uuid>', 'Carolien Ballast', 'admin');
```

5. Log in via `/admin/login` en wijzig het tijdelijke wachtwoord volgens het Supabase-proces.

Editors kunnen producten, orders en aanvragen beheren. Alleen de rol `admin` kan profielen, centrale instellingen en Mollie-terugbetalingen wijzigen. Rollen zijn niet vanuit de publieke browser aanpasbaar.

## Storage

De migratie maakt twee buckets:

- `product-images`: privé als bucket; alleen beelden van gepubliceerde producten zijn via korte signed URLs leesbaar, beheer alleen voor admin/editor.
- `commission-uploads`: privé; alleen via serverupload en korte signed URL voor geautoriseerde beheerders.

JPEG, PNG en WebP zijn toegestaan. De server controleert bestandssignatuur en grootte, verwijdert metadata met Sharp, maakt unieke bestandsnamen en legt afmetingen vast. Productafbeeldingen zijn maximaal 10 MB; opdrachtreferenties maximaal 8 MB.

## Mollie-testbetaling

1. Rond de Mollie-onboarding af zodra KvK, btw-gegevens en zakelijke rekening beschikbaar zijn.
2. Gebruik eerst een `test_*` API-key.
3. Genereer `MOLLIE_WEBHOOK_SECRET` en stel een publieke HTTPS-`NEXT_PUBLIC_SITE_URL` in.
4. Start een checkout met een gepubliceerd, beschikbaar testproduct met prijs en btw.
5. Controleer redirect, `/bestelling/<token>`, de order in `/admin/bestellingen` en de webhooklogs.

Mollie kan localhost niet rechtstreeks bereiken. Gebruik voor lokaal webhooktesten een gecontroleerde HTTPS-tunnel en stel die tijdelijk als site-URL in. De webhook haalt iedere status opnieuw bij Mollie op, vergelijkt order, payment-ID, valuta en bedrag, en verwerkt gebeurtenissen idempotent.

Een terugbetaling vereist adminrechten én het opnieuw intypen van het ordernummer. Uitbetaling naar Revolut Pro is een instelling in Mollie en hoort niet in deze code.

## Reserveringen opschonen

Bij iedere checkout worden verlopen reserveringen vrijgegeven. Daarnaast bestaat:

```text
GET of POST /api/cron/release-reservations
Authorization: Bearer <CRON_SECRET>
```

Laat Vercel Cron dit endpoint bijvoorbeeld iedere vijf minuten aanroepen wanneer het Vercel-abonnement die frequentie ondersteunt. Zonder correct bearer-token geeft het endpoint 401. De reserveringsduur staat privé in `site_settings` onder `checkout.reservation` en is in beheer instelbaar van 1 tot 60 minuten.

## E-mailvoorbereiding

`lib/email/service.ts` schrijft e-mailgebeurtenissen naar `email_events`; `lib/email/templates.ts` bevat de zes voorbereide Nederlandse templates. Zonder provider worden gebeurtenissen als `disabled` opgeslagen en claimt de applicatie niet dat een e-mail is verzonden.

Voor Resend zijn later nodig:

- geverifieerd afzenderdomein;
- SPF- en DKIM-records van de provider;
- aanbevolen DMARC-record;
- `RESEND_API_KEY` en `EMAIL_FROM` in Vercel.

## Vercel instellen en deployen

1. Koppel de repository aan het bestaande Vercel-project.
2. Voeg alle variabelen uit `.env.example` toe met juiste scope voor Development, Preview en Production.
3. Gebruik nooit productiegeheimen in onbetrouwbare previewbranches.
4. Push een gecontroleerde commit naar GitHub.
5. Controleer de previewdeployment, databaseverbinding, adminlogin, formulieren en Mollie-testmodus.
6. Promoveer pas daarna naar productie.

Na wijziging van Vercel-variabelen lokaal opnieuw ophalen:

```bash
vercel env pull .env.local --yes
```

Let op: dit overschrijft `.env.local`.

## Belangrijke routes

- `/collectie` en `/collectie/[slug]`: echte productdata met veilige fallback.
- `/eerder-werk`: portfolio-items uit Supabase, anders bestaand portfolio.
- `/contact` en `/kunst-in-opdracht`: gevalideerde, begrensde inzendingen.
- `/checkout`: servercontrole, order en atomaire reservering vóór Mollie.
- `/bestelling/[token]`: gecontroleerde betaalstatus.
- `/admin`: producten en afbeeldingen.
- `/admin/bestellingen`: orderoverzicht, detail, verwerking en bevestigde refund.
- `/admin/aanvragen`: contact- en opdrachtaanvragen plus privé signed URLs.
- `/admin/instellingen`: publieke gegevens en reserveringsduur.

Zie verder `BACKEND_STATUS.md`, `SETUP_CHECKLIST.md`, `SECURITY_NOTES.md` en `CONTENT_TODO.md`.
