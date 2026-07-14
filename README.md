# navo V2

Persistenter Begleiter von der Idee bis zum ersten zahlenden Kunden.
Einmaliger Kauf (39 €), Lifetime-Zugang, kein Abo.

## Architektur

- **Frontend:** statische HTML-Seiten (`index.html`, `app.html`, `login.html`, Rechtsseiten)
- **Backend:** Node.js + Express (`server.js`)
- **DB:** Postgres via Neon (`db.js`)
- **Auth:** Signed Session-Cookie + Magic-Link (per E-Mail via Resend)
- **KI:** Anthropic Claude (persistente Konversation pro Nutzer)
- **Zahlung:** Stripe Checkout

## Lokal starten

1. `.env` aus `.env.example` erstellen, alle Keys eintragen (siehe `TODO.md`)
2. `npm install`
3. `npm start`
4. Im Browser: `http://localhost:3000`

Die Datenbank wird beim ersten Start automatisch initialisiert (Tabellen `users`, `messages`, `login_tokens`).

## Nutzerfluss

**Erstkauf:**
1. Nutzer landet auf `/`, gibt Idee ein → kostenloser Ideen-Check
2. Klick auf „Ich fang jetzt an – 39 €" → Widerrufsverzicht bestätigen → Stripe
3. Nach Zahlung: `/erfolg?session_id=…` verifiziert die Zahlung serverseitig, legt Konto an, setzt Session-Cookie
4. Redirect nach `/app` → Chat mit navo beginnt

**Rückkehr auf einem anderen Gerät:**
1. Nutzer öffnet `/login`, gibt seine E-Mail ein
2. Server verschickt Magic-Link (via Resend)
3. Klick auf Link → `/login/verify?token=…` → Session-Cookie → `/app`

## API-Endpunkte

- `POST /api/check` – Kostenloser Ideen-Check (öffentlich, rate-limited)
- `POST /api/checkout` – Startet Stripe-Session
- `GET  /erfolg` – Nach Stripe: legt Konto an, loggt ein
- `POST /api/login` – Verschickt Magic-Link
- `GET  /login/verify` – Verifiziert Magic-Link, loggt ein
- `POST /api/logout` – Löscht Session-Cookie
- `GET  /api/me` – Konto-Info (Auth erforderlich)
- `GET  /api/history` – Chat-Historie (Auth erforderlich)
- `POST /api/chat` – Neue Nachricht an navo (Auth erforderlich)
- `GET  /api/health` – Healthcheck

## Deployment auf Render

Siehe `TODO.md` für die exakte Schritt-für-Schritt-Anleitung.
