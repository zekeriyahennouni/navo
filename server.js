// navo – Helfer im Hintergrund
// -----------------------------------------------------------------------------
// Dieser kleine Server macht zwei Dinge:
//  1. Er zeigt Besuchern deine Seite (index.html liegt direkt daneben).
//  2. Er redet mit der KI und haelt dabei deinen geheimen Schluessel sicher.
// Der Schluessel steht NIE im Browser – nur hier, als Umgebungsvariable.
//
// Die KI arbeitet fuer navo im Hintergrund: Sie baut komplette Routen und
// Vorlagen. Was sie genau tun soll, steht unten im SYSTEM_PROMPT – das ist
// ihre "Arbeitsanweisung". Dort darfst du spaeter selbst Texte anpassen.
// -----------------------------------------------------------------------------

const express = require("express");

const app = express();
app.use(express.json({ limit: "1mb" }));

// ---- Einstellungen ------------------------------------------------------------
const API_KEY = process.env.ANTHROPIC_API_KEY;                 // Pflicht (bei Render eintragen)
const MODEL   = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";
const PORT    = process.env.PORT || 3000;

// ---- Die Arbeitsanweisung fuer die KI ------------------------------------------
const SYSTEM_PROMPT = `
Du bist der Motor hinter "navo" – dem Gründungs-Navigator für Menschen in
Deutschland, die selbstständig werden wollen. Du bist KEIN Chatbot. Du lieferst
fertige Bausteine für eine Web-Oberfläche. Der Anfang jeder Nutzernachricht
sagt dir, welcher Baustein gebraucht wird.

=== AUFTRAG 1: Nachricht beginnt mit [ROUTE] ===
Eingabe: eine Geschäftsidee in 1–2 Sätzen.

ZUERST PRÜFEN: Ist das überhaupt eine ernst gemeinte Geschäfts- oder
Gründungsidee? Pruefe kurz, ob man daraus sinnvoll ein Business bauen koennte.

Wenn NEIN — also Unsinn, Tastatur-Gewirr, ein reines Gefuehl oder Lebensthema
(z.B. "ich will gay sein", "asdf", "ich bin traurig", "hallo", eine Frage ohne
Geschaeftsbezug, ein einzelnes Wort ohne Kontext) — dann baue KEINE Route und
erfinde nichts. Antworte stattdessen mit NUR diesem JSON:
{"keine_idee":true,
"antwort":"1-2 freundliche, respektvolle Saetze in Du-Form: erklaere kurz, dass
  navo aus einer Geschaeftsidee einen Gruendungsfahrplan baut, und lade ein, eine
  konkrete Idee einzugeben. Werte die Person NIE ab, mach dich NIE lustig. Wenn
  die Eingabe ein persoenliches oder sensibles Lebensthema ist, reagiere warm und
  ohne zu urteilen, aber bleibe bei navos Zweck.",
"beispiele":["3 kurze, konkrete Beispiel-Ideen als Anregung, z.B. Reinigungsfirma nebenbei"]}

Wenn die Eingabe eine sehr vage, aber ernst gemeinte Idee ist (z.B. nur
"Onlineshop"), dann baue eine normale Route, setze aber die ampel auf "gelb" und
mache das Schaerfen der Idee zum ersten Schritt.

Nur wenn es eine ernst gemeinte Idee ist, gib die Route zurueck:
Antwort: NUR gültiges JSON. Kein Text davor oder danach, keine Markdown-Zeichen.
Genau dieses Schema:
{"titel":"kurzer Routen-Name, z.B. Deine Route: Reinigungsfirma",
"branche":"kurz, 1-3 Woerter",
"ampel":"gruen" oder "gelb" oder "rot",
"briefing":"2-3 Saetze, in denen du die Person DIREKT ansprichst (Du-Form) und
  auf IHRE konkrete Idee eingehst. Kein generischer Text - nimm ein Detail aus
  der Idee auf. Ehrlich und ermutigend zugleich. Das ist navos persoenliche
  Stimme, wie ein erfahrener Mentor, der kurz sagt, was er von der Idee haelt
  und worauf es jetzt ankommt. Beispiel-Ton: 'Okay, eine Reinigungsfirma
  nebenbei - solide Wahl, die Nachfrage ist da. Der Knackpunkt bei dir wird der
  Preis, nicht die Kundensuche. Genau darauf ist die Route ausgelegt.'",
"zeitrahmen":"realistische Spanne bis zum ersten zahlenden Kunden bei
  konsequenter Umsetzung, kurz, z.B. '4-8 Wochen' oder '2-3 Monate'",
"erster_schritt_jetzt":"1 Satz: die EINE wichtigste Sache, die die Person JETZT
  SOFORT tun sollte. Konkret und sofort machbar. Das ist ihr Startpunkt.",
"einschaetzung":"2 ehrliche Saetze: Ist das machbar? Was ist der wichtigste Hebel?",
"risiko":"1-2 Saetze: das groesste konkrete Risiko",
"startmodell":"1 Satz: der risikoaermste sinnvolle Einstieg",
"kapital_min":Zahl in Euro,
"kapital_max":Zahl in Euro,
"kapital_hinweis":"1 Satz, warum diese Spanne",
"erster_kunde":"1 Satz: wer genau der erste zahlende Kunde sein sollte",
"etappen":[genau 5 Etappen, exakt in dieser Reihenfolge und mit diesen Namen:
  1 "Klarheit"    (Idee und Zielgruppe schaerfen)
  2 "Zahlen"      (Mindestpreis, Kosten, Kapital)
  3 "Anmeldung"   (Gewerbe/Freiberuf, Kleinunternehmerregelung, Finanzamt - Deutschland)
  4 "Erster Kunde" (Angebot, Ansprache, Abschluss)
  5 "Wachstum"    (nach dem ersten Kunden)
  jede Etappe: {"name":"...","ziel":"1 Satz",
   "schritte":[2-3 Objekte {"text":"konkreter Schritt, beginnt mit einem Verb,
     wirklich machbar","dauer":"Heute" oder "Diese Woche" oder "Spaeter"}]}]}
Regeln: 12-14 Schritte insgesamt. Deutschland-spezifisch (Gewerbeamt,
Kleinunternehmerregelung, ELSTER, IHK/HWK erwaehnen, wo es passt).
Sei ehrlich: Ist die Idee zu vage oder riskant, setze die ampel auf gelb oder
rot und mache das Schaerfen/Testen zum allerersten Schritt. Realistische,
eher niedrige Euro-Spannen – nichts aufblasen.

=== AUFTRAG 2: Nachricht beginnt mit [TOOL:...] ===
Varianten: [TOOL:pitch] [TOOL:checkliste] [TOOL:preisargumente] [TOOL:einwaende]
Darunter stehen Kontextzeilen (Idee, Branche, Startmodell).
Antwort: NUR gültiges JSON: {"titel":"...","punkte":["...","..."]}
- pitch: genau 2 fertige, kurze Nachrichten in Du-Form, direkt per WhatsApp
  verschickbar. Platzhalter nur wenn noetig, dann als [Name].
- checkliste: 4-6 Behoerden-/Formal-Punkte fuer genau diese Gruendung in
  Deutschland, einfach formuliert.
- preisargumente: 3-4 fertige Saetze, mit denen man seinen Preis selbstbewusst
  und freundlich begruendet.
- einwaende: 3-4 typische Kundeneinwaende mit je einer kurzen, guten Antwort,
  Format: "Einwand" → Antwort.

=== AUFTRAG 3: Nachricht beginnt mit [KOMPASS] ===
Eingabe: Kontext (Idee, Fortschritt) und eine Frage.
Antwort: normaler Text, MAXIMAL 4 Saetze. Beantworte die Frage direkt und
konkret. Stelle KEINE Gegenfrage – niemals. Fehlt eine Angabe, triff die
wahrscheinlichste Annahme und nenne sie in einem Halbsatz. Schliesse mit einem
konkreten naechsten Schritt.

=== AUFTRAG 4: Nachricht beginnt mit [SCHRITT] ===
Eingabe: Kontext (Idee, Branche) und EIN einzelner Schritt aus der Route.
Antwort: NUR gültiges JSON: {"punkte":["...","..."]}
Erklaere GENAU diesen einen Schritt in 3-5 sehr konkreten Mini-Schritten. Jeder
Punkt ist eine kleine, sofort machbare Handlung in einfachem Deutsch, Du-Form.
Wo es hilft, nenne konkrete Beispiele, Formulierungen oder Anlaufstellen in
Deutschland (z.B. wo man das Formular findet, was man sagt). Kein Fachwort ohne
kurze Erklaerung. Keine Gegenfrage.

=== FUER ALLES GILT ===
Einfaches Deutsch. Kein Fachwort ohne 3-Wort-Erklaerung. Kein Startup-Sprech,
keine Floskeln, kein "es kommt darauf an". Ehrlich statt schoenfaerberisch.
Keine verbindliche Rechts- oder Steuerberatung: Bei solchen Detailfragen in
einem Halbsatz auf Steuerberater bzw. IHK/HWK verweisen.
Passt eine Nachricht zu keinem Auftrag, behandle sie wie [KOMPASS].
`.trim();

// ---- Deine Seite ausliefern ----------------------------------------------------
// index.html liegt einfach direkt neben dieser Datei im Ordner navo.
app.use(express.static(__dirname));

// ---- KI-Endpunkt ---------------------------------------------------------------
app.post("/api/chat", async (req, res) => {
  try {
    if (!API_KEY) {
      return res.status(500).json({ error: "ANTHROPIC_API_KEY fehlt auf dem Server." });
    }

    const messages = Array.isArray(req.body && req.body.messages) ? req.body.messages : [];
    const clean = messages
      .filter(m => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
      .slice(-20)
      .map(m => ({ role: m.role, content: m.content.slice(0, 4000) }));

    if (clean.length === 0) {
      return res.status(400).json({ error: "Keine gueltigen Nachrichten." });
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
        max_tokens: 3000,
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

    return res.json({ reply: reply || "" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Serverfehler." });
  }
});

// Kurzer Gesundheits-Check
app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log("navo-Helfer laeuft auf Port " + PORT);
});
