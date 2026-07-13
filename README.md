# navo

Der Gründungs-Navigator für alle, die nicht mehr auf den perfekten Moment warten wollen.

## Was hier drin ist

- `index.html` – Landingpage mit kostenlosem Ideen-Check und Kaufabschluss
- `erfolg.html` – Erfolgsseite nach der Stripe-Zahlung, generiert den bezahlten Zug
- `server.js` – Express-Backend mit drei API-Routen
- `package.json` – Abhängigkeiten (Express + Stripe)
- `.env.example` – Vorlage für die Umgebungsvariablen

## Lokal starten

1. `.env` aus `.env.example` kopieren und die drei Keys eintragen (Anthropic, Stripe, Basis-URL).
2. `npm install`
3. `npm start`
4. Im Browser: `http://localhost:3000`

## Nach der Zahlung

Stripe leitet den Käufer auf `/erfolg.html?session_id=…`. Dort beantwortet er drei kurze Fragen. Der Server prüft die Zahlung bei Stripe und lässt navo den Zug generieren.

## Zu tun vor Live-Gang

- Impressum (`impressum.html`) und Datenschutz (`datenschutz.html`) hinzufügen – rechtlich Pflicht in Deutschland.
- Beim Kauf-Flow eine Checkbox einbauen: *„Ich stimme zu, dass die Leistung sofort beginnt und ich mein Widerrufsrecht verliere."* – sonst 14 Tage Widerrufsrecht auf digitale Produkte.
- Persönlichen Absatz in `index.html` unter „Wer ist hinter navo?" ersetzen.
- Live-Keys von Stripe holen und `.env` in Produktion setzen.
- Testkauf durchführen (`4242 4242 4242 4242` im Stripe-Testmodus).
