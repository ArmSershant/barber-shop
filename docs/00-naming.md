# Platform Name — Shortlist

Goal: short, brandable, easy to type, pronounceable in both Armenian and English, with a clean `.com` (global ambition) and ideally a cheap `.am` (local trust signal). Armenian for "barber" is **սափրիչ** (*saprich*); English *fade* is widely used among Yerevan barbers.

> Availability note: I can't query registrars live here. Treat the availability column as a *guess to verify*. Check `.com` at any registrar and `.am` via **amnic.net** (the official Armenian registry) before committing. `.am` is popular globally as a hack domain (e.g. `book.am`), so it may cost more than a typical ccTLD.

| # | Name | Why it works | Risk / note | Domain to check |
|---|------|--------------|-------------|-----------------|
| 1 | **Sapor** | Rooted in *saprich* (սափրիչ = barber). Local meaning, short, brandable, looks good as a logo. Reads fine in English too. | "Sapore" = flavor in Italian — minor collision. | `sapor.am`, `getsapor.com` |
| 2 | **Chairly** | The barber's chair is the universal symbol; "book a chair." Friendly, modern, English-first. | Slightly generic `-ly` suffix. | `chairly.com`, `chairly.am` |
| 3 | **Trimly** | "Trim" = haircut action; playful and instantly understood. | Crowded `-ly` startup naming space. | `trimly.am`, `trimly.app` |
| 4 | **Fadebook** | "Fade" is the most-requested cut; "book" = the action. Memorable for a young male audience. | "...book" may feel derivative of Facebook. | `fadebook.am`, `fadebook.com` |
| 5 | **Klippr** | From "clip/clipper." Tech-y, short, app-store friendly. | Vowel-less spelling can confuse older clients. | `klippr.com`, `klippr.am` |
| 6 | **Brio** | Means energy/vibe; clean, premium feel; expandable to beauty later. | Not barber-specific; existing brands use "Brio." | `brio.am`, `getbrio.com` |
| 7 | **Saloon** *(Salon+book)* | Instantly says "salon/booking"; expandable to beauty salons. | "Saloon" = old western bar in English; spell carefully. | `saloon.am` |

## Recommendation

For an MVP that's **Yerevan-first but globally scalable**, my pick order:

1. **Sapor** — best balance of local meaning, brandability, and a clean wordmark.
2. **Chairly** — safest English-first choice for expansion beyond Armenia and beyond barbers.
3. **Trimly** — strongest if you want a fun, consumer-app tone.

Throughout this spec I use the working name **Sapor** and the namespace `sapor`. Renaming later is a cheap find-and-replace — the name only appears in branding, the repo name, and a few config values, never in the schema or API contracts.

## Suggested repo + handles

- GitHub repo: `sapor` (monorepo) or `sapor-platform`.
- Workspace scope: `@sapor/*` (e.g. `@sapor/api`, `@sapor/web`, `@sapor/shared`).
- Social: reserve `@saporapp` / `@sapor.am` on Instagram — the primary channel for Yerevan barbers.
