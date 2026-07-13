// navo Backend
// Zwei Hauptaufgaben:
// 1. Kostenloser Ideen-Check (POST /api/check)
// 2. Bezahlter erster Pinselstrich nach Stripe-Checkout (POST /api/pinselstrich)

const express = require("express");
const path = require("path");
const Stripe = require("stripe");

const app = express();
const PORT = process.env.PORT || 3000;
const BASE_URL = process.env.PUBLIC_BASE_URL || `http://localhost:${PORT}`;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5";
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

if (!ANTHROPIC_API_KEY) {
  console.error("FEHLER: ANTHROPIC_API_KEY fehlt in .env");
  process.exit(1);
}
if (!STRIPE_SECRET_KEY) {
  console.error("FEHLER: STRIPE_SECRET_KEY fehlt in .env");
  process.exit(1);
}

const stripe = Stripe(STRIPE_SECRET_KEY);

app.use(express.json({ limit: "50kb" }));
app.use(express.static(path.join(__dirname), { index: "index.html" }));

// ------------------------------------------------------------
// System-Prompts
// ------------------------------------------------------------

const SYSTEM_PROMPT_CHECK = `Du bist navo. Du bist kein Coach, kein Guru und kein Motivationstrainer. Du bist der ehrliche, ruhige Handwerker, der Menschen beim allerersten Schritt in ihre eigene Idee hilft.

Der Nutzer schickt dir einen einzigen Satz zu seiner Idee. Deine Aufgabe: Eine kurze, ehrliche erste Reaktion in DREI BIS VIER SÄTZEN. Nicht mehr.

Diese Reaktion muss:
1. Die Idee ernst nehmen, aber nicht loben. Kein "Coole Idee!", kein "Klingt vielversprechend!". Der Nutzer merkt Schmeichelei sofort und verliert Vertrauen.
2. Die eigentliche, unterliegende Frage benennen. Nicht "was für ein Geschäftsmodell", sondern die wirkliche Frage, die noch offen ist.
3. Auf eine Öffnung hinweisen – ohne den bezahlten Zug schon zu verraten. Beispiel: "Genau das kannst du in den nächsten 20 Minuten herausfinden."

Absolut vermeiden:
- Aufzählungen mit Bullet-Points
- Phrasen wie "spannend", "vielversprechend", "innovativ"
- 12-Punkte-Fahrpläne
- Businessplan-Sprech
- Motivationssätze
- Emojis
- Verallgemeinerungen wie "als Gründer musst du..."

Sprich in ruhiger, direkter, warmer Prosa. Duze den Nutzer. Sei kurz.`;

const SYSTEM_PROMPT_PINSELSTRICH = `Du bist navo. Du bist kein Coach, kein Guru und kein Motivationstrainer. Du bist der ehrliche, ruhige Handwerker, der Menschen beim allerersten Schritt in ihre eigene Idee hilft.

Der Nutzer hat drei Fragen beantwortet: seine Idee, seine Situation, seine größte Angst gerade. Deine Aufgabe: einen einzigen konkreten Zug für die nächsten 20 Minuten vorschlagen.

STRUKTUR DEINER ANTWORT (genau so, mit den Überschriften):

## Wo du gerade stehst
3-5 Sätze. Was ist die eigentliche Frage, die noch offen ist? Was hält den Nutzer wirklich zurück? Sei direkt aber warm. Kein Sugarcoating.

## Dein Zug – 20 Minuten
Ein einziger, klar umrissener Zug. Beschreibe genau, was der Nutzer in den nächsten 20 Minuten tun soll. Konkret ("Öffne einen Browser..." nicht "Recherchiere mal...").

## Drei Fragen für danach
Drei ehrliche, kurze Fragen (nummeriert), die der Nutzer sich NACH dem Zug stellen soll. Sie helfen ihm, das Ergebnis zu verstehen.

DIE FÜNF EISERNEN REGELN FÜR JEDEN ZUG:

Regel 1 – Solo machbar. Der Zug darf keine anderen Menschen erfordern. Keine Freunde, Familie, Kollegen. Kein "frag jemanden", kein "ruf jemanden an", kein "poste öffentlich". Der Nutzer könnte allein auf einer Insel sein und den Zug trotzdem machen.

Regel 2 – Minimales Werkzeug. Der Zug darf nur voraussetzen: einen Browser, Papier oder Notiz-App, das eigene Denken. Nichts, wofür man sich neu anmelden muss. Keine Software installieren. Kein Konto anlegen.

Regel 3 – Kein soziales Risiko. Kein öffentliches Posten, keine Sichtbarkeit für Dritte, keine Ablehnung durch echte Menschen. Der Nutzer muss sich nicht vor irgendwem exponieren.

Regel 4 – Konkreter, greifbarer Output. Nach dem Zug hat der Nutzer etwas Handfestes: ein Blatt mit Notizen, eine geschriebene Liste, eine strukturierte Erkenntnis. Kein "schönes Gefühl", sondern ein Werkzeug für den nächsten Schritt.

Regel 5 – Wirklich 20 Minuten. Der Zug muss von einer echten Person in 20 Minuten leistbar sein. Nicht 5, nicht 60. Wenn du unsicher bist, prüfe: würde ich das selbst in 20 Minuten schaffen, ohne Vorwissen? Wenn nein, mach den Zug kleiner.

ABSOLUT VERMEIDEN:
- Wörter wie "spannend", "vielversprechend", "innovativ"
- Phrasen wie "als Gründer musst du...", "erfolgreiche Unternehmer..."
- Businessplan-Sprech (USP, Value Proposition, KPI, MVP)
- Motivationssätze ("Du schaffst das!", "Glaub an dich!")
- Emojis
- Sätze mit "irgendwie", "vielleicht mal", "eventuell"

Sprich in ruhiger, direkter, warmer Prosa. Duze den Nutzer. Sei konkret bis zum Schmerz. Behandle ihn wie einen erwachsenen Menschen, der Wahrheit mehr braucht als Trost.`;

// ------------------------------------------------------------
// Claude-Aufruf (kleiner Wrapper)
// ------------------------------------------------------------

async function askClaude(systemPrompt, userMessage, maxTokens = 1500) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Claude-API-Fehler: ${res.status} – ${text}`);
  }
  const data = await res.json();
  return data.content?.[0]?.text?.trim() || "";
}

// ------------------------------------------------------------
// Route 1: Kostenloser Ideen-Check
// ------------------------------------------------------------

app.post("/api/check", async (req, res) => {
  try {
    const idee = String(req.body?.idee || "").trim();
    if (!idee) {
      return res.status(400).json({ error: "Keine Idee mitgegeben." });
    }
    if (idee.length > 500) {
      return res.status(400).json({ error: "Bitte in einem Satz." });
    }
    const antwort = await askClaude(
      SYSTEM_PROMPT_CHECK,
      `Meine Idee in einem Satz: ${idee}`,
      400
    );
    res.json({ antwort });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Etwas ist schiefgelaufen. Probier's gleich nochmal." });
  }
});

// ------------------------------------------------------------
// Route 2: Stripe-Checkout starten
// ------------------------------------------------------------

app.post("/api/checkout", async (req, res) => {
  try {
    const idee = String(req.body?.idee || "").trim().slice(0, 500);
    const widerrufVerzicht = req.body?.widerruf_verzicht === true;
    if (!widerrufVerzicht) {
      return res.status(400).json({ error: "Widerrufsverzicht muss bestätigt werden." });
    }
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "eur",
            unit_amount: 1900,
            product_data: {
              name: "navo – Dein erster Pinselstrich",
              description:
                "Ein persönlicher, ehrlicher erster Zug für deine Idee. 20 Minuten. Kein Abo. Geld zurück, wenn's dir nichts bringt.",
            },
          },
        },
      ],
      metadata: {
        idee,
        widerruf_verzicht: "ja",
        widerruf_zeitpunkt: new Date().toISOString(),
      },
      success_url: `${BASE_URL}/erfolg.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${BASE_URL}/#kaufen`,
    });
    res.json({ url: session.url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Bezahlvorgang konnte nicht gestartet werden." });
  }
});

// ------------------------------------------------------------
// Route 3: Bezahlten Pinselstrich generieren
// ------------------------------------------------------------

app.post("/api/pinselstrich", async (req, res) => {
  try {
    const sessionId = String(req.body?.session_id || "").trim();
    const idee = String(req.body?.idee || "").trim();
    const situation = String(req.body?.situation || "").trim();
    const angst = String(req.body?.angst || "").trim();

    if (!sessionId) return res.status(400).json({ error: "Session fehlt." });
    if (!idee || !situation || !angst)
      return res.status(400).json({ error: "Bitte alle drei Fragen beantworten." });

    // Zahlung bei Stripe verifizieren
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== "paid") {
      return res.status(402).json({ error: "Bezahlung noch nicht bestätigt." });
    }

    const userMessage =
      `Meine Idee: ${idee}\n\nMeine Situation gerade: ${situation}\n\nMeine größte Angst gerade: ${angst}`;

    const antwort = await askClaude(SYSTEM_PROMPT_PINSELSTRICH, userMessage, 1800);
    res.json({ antwort });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Konnte den Zug nicht erzeugen. Schreib mir bitte kurz, dann klären wir das." });
  }
});

// ------------------------------------------------------------
// Health
// ------------------------------------------------------------

app.get("/api/health", (_req, res) => res.json({ ok: true }));

// ------------------------------------------------------------
// Start
// ------------------------------------------------------------

app.listen(PORT, () => {
  console.log(`navo läuft auf ${BASE_URL}`);
});
