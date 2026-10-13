# Incidents behind the rules (audit 2026-10-13)

| Site | Invariant | What happened | Fix |
|---|---|---|---|
| trapezlemezes.hu | A | Order idempotency key via replacer array → nested items `{}` → 2nd order with same e-mail+phone within 1 h never reached the server, user redirected to the 1st order's success page (live since 2026-04-30). | PR #80 |
| trapezlemezes.hu | B | Fence branch only ran when `sizes.length === 0` → "roof + wall" quotes silently dropped the wall (116 m² instead of 160). | PR #80 |
| trapezlemezes.hu | C | Hidden "total length" fence inputs beat "per side" values (17 m² instead of 97); mode switch kept both. | PR #80, #83 |
| trapezlemezes.hu | D | "Remove roof" deleted DOM only; new roof index = `entries.length` collided. | PR #80 |
| trapezlemezes.hu | E | Screw modal closed with X left its `done` listener → each later click added 2+ cart items. | PR #80 |
| trapezlemezes.hu | H | Quote conversion guarded by sessionStorage → ~2.4× GA4 overcount. | PR #80 |
| trapezlemezes.hu | F/K | Sheet length > 800 cm accepted; server trusted client m². | PR #82 |
| femkeriteslec.hu | J/I | No GTM ID configured, no CMP → zero tracking and zero attribution on the live site; calculator pushed no events. | fix/kalkulator-audit-2026-10 |
| femkeriteslec.hu | L/E | `fetch().catch(()=>{})`, result shown before fetch; no in-flight guard → 2 e-mails + 2 CRM leads. | same |
| olcsokontenerhaz.hu | F | UI qty 1–50, server max 20 → English zod "Too big". | fix/kalkulator-audit-2026-10 |
| olcsokontenerhaz.hu | C | WC product kept the bathroom add-on (+378 900 Ft). | same |
| olcsokontenerhaz.hu | H | `quote_calculator_submitted` pushed before the Turnstile check. | same |
| olcsokontenerhaz.hu | J | `opened` behind a 5 s consent wait: 30 opened vs 530 step users. | same |
| painlessremovals.com | F | Server name regex rejected "Mr & Mrs Smith" → 400, lead lost. | fix/calculator-audit-2026-10 |
| painlessremovals.com | L | Contact POST only after an 8 s interstitial → closed tab = lost lead. | same |
| painlessremovals.com | C | Deselected extras still priced; furniture-only flag survived property change. | same |
| lomtalan.hu | L | Soft-launch gate 302'd `/ajanlat`, `/arkalkulator?…` (no trailing slash) to `/`. | fix/kalkulator-audit-2026-10 |
| lomtalan.hu | K | 60 s dedupe key written before delivery → retry after mail failure = "already sent". | same |
| lomtalan.hu | K | Client `calc_mid` used as Ads/Meta conversion value. | same |
| beautyflow.pro | I | Two resolvers merged per key → gclid + gbraid in one lead. | fix/lead-flow-audit-2026-10 |
| beautyflow.pro | H | `calculator_result_view` on every render. | same |

General pattern: the trapéz-specific bugs (A, B, D, E) did not recur, but F
(validation mismatch), C (stale branch state), H (duplicate/phantom
conversions), I (attribution gaps) and K (no server recompute) appeared on 4–5
of the 6 sites.
