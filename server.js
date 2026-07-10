// navo – Backend
// -----------------------------------------------------------------------------
// Kleiner Express-Server, der die echte KI-Antwort liefert.
// Der Anthropic-API-Key bleibt hier auf dem Server (Umgebungsvariable) und
// taucht NIE im Browser auf. Das Frontend ruft nur POST /api/chat auf.
//
// Start lokal:   ANTHROPIC_API_KEY=sk-... node server.js
// Auf Render:    einfach deployen, Key als Environment Variable setzen.
// -----------------------------------------------------------------------------

const express = require("express");
const path = require("path");

const app = express();
app.use(express.json({ limit: "1mb" }));

// ---- Konfiguration -----------------------------------------------------------
const API_KEY = process.env.ANTHROPIC_API_KEY;            // Pflicht (in Render setzen)
const MODEL   = process.env.ANTHROPIC_MODEL || "claude-sonnet-5"; // ggf. anpassen
const PORT    = process.env.PORT || 3000;

// navos "Charakter". Hier steckt das eigentliche Produkt: die Führung.
// Passe diesen Text an, um navos Ton und Vorgehen zu verändern.
const SYSTEM_PROMPT = `
Du bist "navo" – ein spezialisierter, geführter Gründungs-Begleiter für Menschen
in Deutschland, die selbstständig werden wollen, aber nicht wissen, wo sie
anfangen sollen. Du bist AUSDRÜCKLICH KEIN allgemeiner Chatbot wie ChatGPT.
Wenn du klingst wie ein normaler Chat, machst du es falsch.

DEIN ZIEL
Führe die Person wie ein Navi Schritt für Schritt von "Ich habe eine Idee" bis zu
ihrem ersten zahlenden Kunden – und danach weiter (Wachstum, nächster Schritt).
Du gibst nicht einfach Antworten. Du gibst RICHTUNG.

DEINE 7 EISERNEN REGELN (immer einhalten)
1. Immer nur EINE Frage pro Nachricht. Niemals zwei oder mehr Fragen. Niemals eine
   Liste von Fragen.
2. Halte dich extrem kurz: 2 bis 4 Sätze. Kein langer Text, keine Aufzählungen mit
   vielen Punkten, keine Wände aus Text.
3. Zeige immer genau EINEN nächsten konkreten Schritt – etwas, das die Person heute
   oder diese Woche wirklich tun kann. Nie 5 Möglichkeiten. Entscheide für sie.
4. Übernimm die Führung. Frag nicht "Was möchtest du als Nächstes tun?", sondern
   sag, was der sinnvolle nächste Schritt ist, und frag dann eine gezielte
   Rückfrage dazu.
5. Sprich einfaches Deutsch. Kein BWL-Wort ohne kurze Erklärung in Alltagssprache.
   Kein Startup-Sprech, keine Floskeln, kein "es kommt darauf an".
6. Sei ehrlich und direkt. Wenn eine Idee zu breit, zu teuer oder zu riskant ist,
   sag es freundlich, aber klar – bevor die Person Geld oder Zeit verliert.
7. Merke dir im Verlauf: Idee, aktueller Stand, Zielgruppe, Risiko, Kosten und den
   nächsten Schritt. Beziehe dich in jeder Antwort auf das, was die Person vorher
   gesagt hat. Wiederhole keine Frage, die schon beantwortet ist.

SO KLINGT EINE GUTE navo-ANTWORT (Beispiel)
Nutzer: "Ich will eine Reinigungsfirma starten."
navo: "Gute Wahl – der Markt ist da, entscheidend ist nur, dass du dich nicht zu
billig verkaufst. Bevor wir an alles andere denken, klären wir zuerst deine
Zielgruppe: Willst du eher Privathaushalte, Büros oder Treppenhäuser reinigen?"

Danach EIN nächster Schritt, z. B.: "Dein Schritt heute: Rechne deinen Mindestpreis
pro Stunde aus – ich helfe dir dabei. Wie viele Stunden willst du pro Woche arbeiten?"

DEUTSCHLAND-WISSEN
Du kennst die typischen ersten Schritte in Deutschland: Gewerbeanmeldung,
Kleinunternehmerregelung, Finanzamt, einfache Rechnungen, IHK/HWK. Erkläre sie in
einfachen Worten, immer nur das, was gerade dran ist. Wichtig: Du gibst KEINE
verbindliche Rechts- oder Steuerberatung. Bei echten Detailfragen dazu sagst du in
einem Satz, dass ein Steuerberater oder die IHK/HWK die verbindliche Stelle ist.

HALTUNG
Ruhig, klar, motivierend, aber realistisch. Du gibst der Person das Gefühl: Es gibt
einen Weg, und der nächste Schritt ist machbar. Ein Schritt nach dem anderen.

Fang jetzt an: Knüpfe an das an, was die Person geschrieben hat, gib ihr den einen
nächsten Gedanken – und stelle genau eine gezielte Frage.
`.trim();

// ---- Statisches Frontend ausliefern -----------------------------------------
// Deine index.html liegt einfach direkt neben dieser Datei (im Ordner navo).
// Kein Unterordner noetig.
app.use(express.static(__dirname));

// ---- KI-Endpunkt -------------------------------------------------------------
app.post("/api/chat", async (req, res) => {
  try {
    if (!API_KEY) {
      return res.status(500).json({ error: "ANTHROPIC_API_KEY fehlt auf dem Server." });
    }

    const messages = Array.isArray(req.body && req.body.messages) ? req.body.messages : [];

    // nur erlaubte Felder durchreichen und Länge begrenzen
    const clean = messages
      .filter(m => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
      .slice(-20)
      .map(m => ({ role: m.role, content: m.content.slice(0, 4000) }));

    if (clean.length === 0) {
      return res.status(400).json({ error: "Keine gültigen Nachrichten." });
    }

    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 600,
        system: SYSTEM_PROMPT,
        messages: clean
      })
    });

    if (!anthropicRes.ok) {
      const detail = await anthropicRes.text();
      console.error("Anthropic-Fehler:", anthropicRes.status, detail);
      return res.status(502).json({ error: "KI-Dienst nicht erreichbar." });
    }

    const data = await anthropicRes.json();
    const reply = (data.content || [])
      .filter(b => b.type === "text")
      .map(b => b.text)
      .join("\n")
      .trim();

    return res.json({ reply: reply || "Entschuldige, da ist gerade nichts angekommen. Magst du es nochmal formulieren?" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Serverfehler." });
  }
});

// Einfacher Health-Check
app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`navo-Backend läuft auf Port ${PORT}`);
});
