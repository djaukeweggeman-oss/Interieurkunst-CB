# Handmatige setupchecklist

## Supabase

- [ ] Expliciet toestemming geven om beide migraties op project `Interieurkunst CB` toe te passen.
- [ ] Na toepassing `supabase migration list --linked` controleren.
- [ ] `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` en `SUPABASE_SERVICE_ROLE_KEY` lokaal en in Vercel instellen.
- [ ] Publieke registratie uitschakelen in Supabase Auth.
- [ ] Carolien via Supabase Auth aanmaken en als `admin` toevoegen aan `profiles`.
- [ ] Login, uitloggen en onbevoegde toegang testen.
- [ ] Product toevoegen, wijzigen, publiceren en archiveren.
- [ ] Afbeelding uploaden, alt-tekst wijzigen, hoofdfoto kiezen, sorteren en verwijderen.
- [ ] Controleren dat `commission-uploads` privé is en signed URLs verlopen.

## Beveiligingswaarden

- [ ] Een lange willekeurige `RATE_LIMIT_SECRET` genereren.
- [ ] Een andere lange willekeurige `CRON_SECRET` genereren.
- [ ] Later een aparte `MOLLIE_WEBHOOK_SECRET` genereren.
- [ ] Geen van deze waarden in Git, chatberichten of screenshots plaatsen.

## Mollie en bedrijfsgegevens

- [ ] KvK-inschrijving afronden.
- [ ] Btw-id en juiste btw-behandeling per product bevestigen.
- [ ] Revolut Pro/zakelijke rekening activeren.
- [ ] Mollie-profiel afronden en uitbetalings-IBAN daar instellen.
- [ ] Eerst een Mollie `test_*` key instellen.
- [ ] Test betaal-, mislukte, verlopen, geannuleerde en refundflow uitvoeren.
- [ ] Pas na volledige controle een live key toevoegen.

## E-mail

- [ ] Provider kiezen, bijvoorbeeld Resend.
- [ ] Afzenderdomein verifiëren.
- [ ] SPF, DKIM en DMARC instellen.
- [ ] `EMAIL_FROM` en `RESEND_API_KEY` in Vercel zetten.
- [ ] Worker voor `email_events` activeren en alle zes templates proefverzenden.

## Vercel en livegang

- [ ] Alle variabelen uit `.env.example` per Vercel-omgeving instellen.
- [ ] Previewomgeving volledig testen.
- [ ] Vercel Cron voor `/api/cron/release-reservations` instellen.
- [ ] Definitieve domeinnaam als `NEXT_PUBLIC_SITE_URL` instellen.
- [ ] Juridische teksten laten controleren.
- [ ] Pas daarna productiecheckout en live Mollie activeren.
