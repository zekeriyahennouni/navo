# navo — Deployment-Checkliste V2

Diese Schritte musst du selbst durchgehen, damit V2 live geht. Reihenfolge einhalten.

## 1. Neon-Datenbank (Postgres) einrichten

- [ ] Auf https://neon.tech mit GitHub einloggen (kostenlos)
- [ ] Neues Projekt erstellen: Region **Europe (Frankfurt)**, Postgres 16
- [ ] Nach dem Setup zeigt Neon dir die Connection-URL. Kopieren.
- [ ] Format: `postgresql://user:password@ep-xxx.eu-central-1.aws.neon.tech/neondb?sslmode=require`

## 2. Resend (Login-Mail) einrichten

- [ ] Auf https://resend.com mit E-Mail registrieren (kostenlos)
- [ ] "API Keys" → "Create API Key" → kopieren (fängt mit `re_` an)
- [ ] Für V1 kannst du die Absender-Adresse `onboarding@resend.dev` benutzen — funktioniert sofort ohne eigene Domain
- [ ] Sobald du eine Domain hast, dort verifizieren und Absender ändern (z. B. `navo@zekeriyahennouni.de`)

## 3. Session-Secret erzeugen

- [ ] Im Terminal ausführen: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- [ ] Das Ergebnis ist dein `SESSION_SECRET`

## 4. Environment Variables bei Render eintragen

Im Render-Dashboard → Environment → Add Environment Variable:

- [ ] `ANTHROPIC_API_KEY` = dein Anthropic-Key (schon vorhanden)
- [ ] `ANTHROPIC_MODEL` = `claude-sonnet-4-5`
- [ ] `STRIPE_SECRET_KEY` = dein Stripe-Key (schon vorhanden)
- [ ] `DATABASE_URL` = deine Neon-Connection-URL aus Schritt 1
- [ ] `RESEND_API_KEY` = dein Resend-Key aus Schritt 2
- [ ] `RESEND_FROM` = `navo <onboarding@resend.dev>` (bis eigene Domain da ist)
- [ ] `SESSION_SECRET` = dein Wert aus Schritt 3
- [ ] `PUBLIC_BASE_URL` = `https://navo-0cvg.onrender.com` (deine Render-URL)

## 5. Code deployen

- [ ] Alle Dateien aus dem ZIP ins GitHub-Repo hochladen (überschreiben + neue dazu)
- [ ] Neue Dateien in V2: `app.html`, `login.html`, `db.js`
- [ ] Gelöscht in V2: `erfolg.html` (wird jetzt vom Server dynamisch behandelt)
- [ ] Render startet automatisch neu

## 6. Erster Test (Stripe Test-Modus)

- [ ] navo-URL im Browser öffnen
- [ ] Idee eintippen → kostenlosen Check bekommen
- [ ] „Ich fang jetzt an – 39 €" klicken
- [ ] Auf Stripe: E-Mail angeben (echte, die du liest), Karte `4242 4242 4242 4242`, Datum `12/28`, CVC `123`
- [ ] Nach Zahlung: automatisch auf /app landen, Chat funktioniert
- [ ] Zweiter Browser: /login öffnen, E-Mail eingeben, Magic-Link kommt in dein Postfach

## 7. Vor echtem Launch

- [ ] Foto einbauen in `index.html` (Wer navo baut-Sektion)
- [ ] Stripe von Test- auf Live-Modus umstellen und `STRIPE_SECRET_KEY` bei Render ersetzen
- [ ] Anthropic-Guthaben aufladen (mindestens 10 € für die ersten Nutzer)
- [ ] Optional: Eigene Domain (Namecheap/Strato ~10 €/Jahr) bei Render als Custom Domain hinterlegen
- [ ] Optional: Marken-Mail einrichten und `hallo@navo.de` überall austauschen

## Wichtige Grenzen der Free-Tiers

- **Neon Free:** 0.5 GB Storage, 1 Datenbank – reicht für tausende Nutzer
- **Resend Free:** 100 Mails pro Tag, 3000 pro Monat – reicht für den Start
- **Anthropic:** pay-as-you-go, ~0.5 Cent pro Chat-Nachricht mit Sonnet
- **Render Free:** Server schläft nach 15 Min Inaktivität – erster Aufruf danach dauert ~30 s
