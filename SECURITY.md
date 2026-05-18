# Security Policy

## Unterstützte Versionen

ErinnerMich befindet sich noch in der Pre-1.0-Phase. Sicherheits-Patches gibt es ausschließlich für den aktuellen `main`-Branch und das produktiv ausgerollte Deployment unter <https://erinnermich.daniel-rck.workers.dev/>.

| Version | Unterstützt |
|---|---|
| `main` (latest) | ✅ |
| Ältere Commits / Forks | ❌ |

## Sicherheits­lücken melden

**Bitte keine öffentlichen Issues für Sicherheits­findings öffnen.**

Stattdessen ein privates Advisory über GitHub einreichen:

👉 <https://github.com/daniel-rck/ErinnerMich/security/advisories/new>

Bitte enthalten:

1. Eine knappe Beschreibung der Lücke
2. Reproduktions­schritte oder Proof-of-Concept
3. Betroffene Komponenten / Pfade
4. Eingeschätzte Auswirkung (Datenleck, XSS, Crypto-Bypass, …)

## Antwortzeit

Best-Effort, typischerweise innerhalb von **7 Tagen**. Du erhältst eine erste Einschätzung und – falls die Lücke bestätigt wird – einen Plan für den Fix und ein Disclosure-Datum.

## Scope

**Im Scope** sind unter anderem:

- XSS / HTML-Injection in der React-App
- Datenlecks aus IndexedDB oder `localStorage` an Dritte
- Schwächen in einer (geplanten) Sync-Verschlüsselung
- Schwachstellen in den Cloudflare-Worker-Endpunkten
- Schwächen im Service Worker / Workbox-Setup
- Supply-Chain-Probleme in unseren direkten Dependencies

**Nicht im Scope**:

- Generelle Browser-Bugs außerhalb unserer Kontrolle
- UI-/UX-Probleme ohne Sicherheits­impact
- Self-XSS, das eine Benutzer­interaktion mit dem eigenen Browser erfordert (z. B. Konsole)
- Findings auf nicht offiziellen Forks oder Mirrors

## Anerkennung

Wir nennen Reporter (mit Einverständnis) in den Release-Notes des Fixes. Bug-Bounties können wir derzeit nicht zahlen – herzlichen Dank trotzdem für jeden verantwortlichen Hinweis.
