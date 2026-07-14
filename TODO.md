# navo — Offene Punkte vor dem echten Launch

Diese Punkte muss Zekeriya persönlich erledigen. Sie sind bewusst nicht automatisiert oder mit erfundenen Daten befüllt.

## Vor dem allerersten öffentlichen Reel

- [ ] **Foto einbauen.** In `index.html` unter `.founder-photo` den Text-Platzhalter durch ein echtes Bild ersetzen. Empfehlung: `<img src="/foto.jpg" alt="Zekeriya, Gründer von navo" style="width:120px;height:120px;border-radius:50%;object-fit:cover;">`
- [ ] **Anthropic-Guthaben aufladen.** Mindestens 5 € auf https://console.anthropic.com/settings/billing, sonst antwortet die API nicht.
- [ ] **Stripe live schalten.** Aktuell Testmodus. Live-Key holen und `STRIPE_SECRET_KEY` bei Render austauschen.
- [ ] **Manueller Testkauf.** Mit Stripe-Testkarte `4242 4242 4242 4242` einen kompletten Kauf durchspielen und den Zug generieren lassen.
- [ ] **Marken-E-Mail.** Sobald du eine hast (z. B. `hallo@navo.de`), alle Vorkommen von `zekeriyahennouni15@gmail.com` in HTML-Dateien austauschen.

## Nach dem ersten Live-Kauf

- [ ] **Erfahrung mit dem ersten Käufer dokumentieren.** Was hat er gemacht? Was hat funktioniert? Als Content-Grundlage für weitere Reels.
- [ ] **Erste ehrliche Bewertung sammeln.** Bevor Testimonials auf die Seite kommen, dürfen sie nicht erfunden sein.

## Datenschutzerklärung – manuelle Prüfung

- [ ] Vor echtem Traffic durch einen der offiziellen Generatoren laufen lassen (e-recht24.de oder datenschutz-generator.de) und mit der jetzigen Datei abgleichen. Was fehlt, ergänzen.

## Nice-to-haves (nicht dringend)

- [ ] Eigene Domain kaufen (~10 €/Jahr, Namecheap oder Strato), bei Render als Custom Domain hinterlegen.
- [ ] OG-Image für Social Sharing erstellen (1200×630 PNG mit Logo + Headline). Datei als `og-image.png` speichern, in `index.html` `<meta property="og:image">` ergänzen.
- [ ] Render auf bezahlten Tier upgraden (7 $/Monat), damit die Seite nicht bei Inaktivität einschläft (30-Sekunden-Cold-Start).
- [ ] Analytics einbauen — aber nur DSGVO-freundlich (Plausible.io oder Fathom, kein Google Analytics).
