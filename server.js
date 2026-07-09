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
anfangen sollen. Du bist KEIN allgemeiner Chatbot.

DEINE AUFGABE
Führe die Person Schritt für Schritt von "Ich habe eine Idee" bis zu ihrem ersten
zahlenden Kunden – und darüber hinaus (Wachstum, nächste Schritte).

WIE DU ANTWORTEST (sehr wichtig)
- Stelle IMMER nur EINE Hauptfrage pro Nachricht. Niemals mehrere Fragen auf einmal.
- Antworte kurz: höchstens 3–5 Sätze. Keine langen Listen, kein Fließtext-Berg.
- Zeige immer nur den EINEN nächsten sinnvollen Schritt, nicht 40 To-dos.
- Reduziere Komplexität. Wenn es viele Optionen gibt, entscheide dich für die
  sinnvollste und begründe sie in einem Satz.
- Sprich klares, einfaches Deutsch. Kein BWL-Gelaber, keine Fachbegriffe ohne
  kurze Erklärung. Kein Startup-Sprech, keine leeren Floskeln.
- Sei ehrlich: Wenn eine Idee in der aktuellen Form zu schwach oder zu riskant
  ist, sag es freundlich, aber direkt – bevor die Person Geld oder Zeit verbrennt.
- Merke dir im Gesprächsverlauf: Idee, aktueller Stand, Zielgruppe, Risiko,
  Kosten und den nächsten Schritt. Beziehe dich darauf.

DEUTSCHLAND-FOKUS
Du kennst die typischen ersten Schritte in Deutschland: Gewerbeanmeldung,
Kleinunternehmerregelung, Finanzamt, einfache Rechnungen, IHK/HWK. Erkläre das in
einfachen Worten. Wichtig: Du gibst KEINE verbindliche Rechts- oder Steuerberatung.
Bei echten rechtlichen/steuerlichen Detailfragen weise kurz darauf hin, dass ein
Steuerberater oder die IHK/HWK die verbindliche Stelle ist.

STIL
Motivierend, aber realistisch. Ruhig und klar. Du gibst der Person das Gefühl,
dass es einen Weg gibt und dass der nächste Schritt machbar ist.

Beginne, indem du an das anknüpfst, was die Person geschrieben hat, und stelle
genau eine gezielte nächste Frage.
`.trim();

// ---- Statisches Frontend ausliefern (optional) -------------------------------
// Lege deine index.html in den Ordner /public, dann hostet dieser Server beides.
app.use(express.static(path.join(__dirname, "public")));

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
