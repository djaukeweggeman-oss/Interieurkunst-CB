# Interieurkunst CB

Moderne kunstenaarsportfolio en webshopbasis voor Carolien Ballast. De site gebruikt Next.js App Router, TypeScript, Tailwind CSS, Supabase en een voorbereide Mollie-integratie. Publicatie is bewust nog niet uitgevoerd.

## Lokaal starten

Vereist: Node.js 22 of nieuwer.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open daarna `http://localhost:3000`.

## Huidige veilige modus

- De openbare Jimdo-inhoud en een representatieve selectie eigen kunstfoto’s zijn lokaal gemigreerd.
- Onbekende prijzen, jaartallen, btw-tarieven en technieken zijn niet verzonnen.
- Zonder Supabase worden formulieren alleen als lokale demo bevestigd en nergens opgeslagen.
- Zonder Supabase én een echte Mollie-testsleutel kan geen bestelling worden aangemaakt of betaald.
- De beheeromgeving heeft geen noodwachtwoord. Zonder gekoppelde Supabase-authenticatie blijft `/admin` gesloten.

## Supabase koppelen

1. Maak binnen het bestaande Supabase-account een project.
2. Kopieer `.env.example` naar `.env.local` en vul de project-URL, anon key en uitsluitend server-side service-role key in.
3. Voer `supabase/migrations/202608180001_initial_shop.sql` uit via de Supabase CLI of SQL Editor.
4. Maak Carolien aan via Supabase Auth.
5. Voeg haar echte `auth.users.id` toe aan `public.admin_users`; zie `supabase/seed.sql`.
6. Controleer in Storage de openbare bucket `artworks` en de RLS-policies.

## Mollie testmodus

Voeg pas na zakelijke onboarding een `test_*` API-key toe. `NEXT_PUBLIC_SITE_URL` moet voor Mollie-webhooks een publiek bereikbare HTTPS-URL zijn; Mollie kan `localhost` niet aanroepen. De webhook haalt elke betaalstatus rechtstreeks bij Mollie op en verwerkt deze idempotent in Supabase.

## Belangrijke routes

- `/collectie` — collectie met filters en sortering
- `/eerder-werk` — gemigreerd portfolio
- `/kunst-in-opdracht` — uitleg en aanvraagformulier
- `/checkout` — veilige checkoutbasis
- `/admin` — beveiligd beheer
- `/api/mollie/webhook` — Mollie-statusverwerking

## Controle vóór livegang

Werk alle punten in `CONTENT_TODO.md` af, voer `npm run lint` en `npm run build` uit en test vervolgens aankoop, mislukte betaling, verlopen reservering, beheer, uploads en e-mail op een afgeschermde previewomgeving.
