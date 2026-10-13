# Incidents behind the rules (audit 2026-10-13)

| Site | Invariant | What happened | Fix |
|---|---|---|---|
| trapezlemezes.hu | A | Order idempotency key via replacer array → nested items `{}` → 2nd order with same e-mail+phone within 1 h never reached the server, user redirected to the 1st order's success page (live since 2026-04-30). | trapezlemezes-webshop#80 |
| trapezlemezes.hu | B | Fence branch only ran when `sizes.length === 0` → "roof + wall" quotes silently dropped the wall (116 m² instead of 160). | trapezlemezes-webshop#80 |
| trapezlemezes.hu | C | Hidden "total length" fence inputs beat "per side" values (17 m² instead of 97); mode switch kept both. | trapezlemezes-webshop#80, #83 |
| trapezlemezes.hu | D | "Remove roof" deleted DOM only; new roof index = `entries.length` collided. | trapezlemezes-webshop#80 |
| trapezlemezes.hu | E | Screw modal closed with X left its `done` listener → each later click added 2+ cart items. | trapezlemezes-webshop#80 |
| trapezlemezes.hu | H | Quote conversion guarded by sessionStorage → ~2.4× GA4 overcount. | trapezlemezes-webshop#80 |
| trapezlemezes.hu | F/K | Sheet length > 800 cm accepted; server trusted client m². | trapezlemezes-webshop#82 |
| femkeriteslec.hu | J/I | No GTM ID configured, no CMP → zero tracking and zero attribution on the live site; calculator pushed no events. | [femkeriteslechu#31](https://github.com/Soborbo/femkeriteslechu/pull/31) |
| femkeriteslec.hu | L/E | `fetch().catch(()=>{})`, result shown before fetch; no in-flight guard → 2 e-mails + 2 CRM leads. | [femkeriteslechu#31](https://github.com/Soborbo/femkeriteslechu/pull/31) |
| olcsokontenerhaz.hu | F | UI qty 1–50, server max 20 → English zod "Too big". | [olcsokontenerhaz#37](https://github.com/Soborbo/olcsokontenerhaz/pull/37) |
| olcsokontenerhaz.hu | C | WC product kept the bathroom add-on (+378 900 Ft). | [olcsokontenerhaz#37](https://github.com/Soborbo/olcsokontenerhaz/pull/37) |
| olcsokontenerhaz.hu | H | `quote_calculator_submitted` pushed before the Turnstile check. | [olcsokontenerhaz#37](https://github.com/Soborbo/olcsokontenerhaz/pull/37) |
| olcsokontenerhaz.hu | J | `opened` behind a 5 s consent wait: 30 opened vs 530 step users. | [olcsokontenerhaz#37](https://github.com/Soborbo/olcsokontenerhaz/pull/37) |
| painlessremovals.com | F | Server name regex rejected "Mr & Mrs Smith" → 400, lead lost. | [painlessremovals#77](https://github.com/Soborbo/painlessremovals/pull/77) |
| painlessremovals.com | L | Contact POST only after an 8 s interstitial → closed tab = lost lead. | [painlessremovals#77](https://github.com/Soborbo/painlessremovals/pull/77) |
| painlessremovals.com | C | Deselected extras still priced; furniture-only flag survived property change. | [painlessremovals#77](https://github.com/Soborbo/painlessremovals/pull/77) |
| lomtalan.hu | L | Soft-launch gate 302'd `/ajanlat`, `/arkalkulator?…` (no trailing slash) to `/`. | [lomtalan.hu#32](https://github.com/Soborbo/lomtalan.hu/pull/32) |
| lomtalan.hu | K | 60 s dedupe key written before delivery → retry after mail failure = "already sent". | [lomtalan.hu#32](https://github.com/Soborbo/lomtalan.hu/pull/32) |
| lomtalan.hu | K | Client `calc_mid` used as Ads/Meta conversion value. | [lomtalan.hu#32](https://github.com/Soborbo/lomtalan.hu/pull/32) |
| beautyflow.pro | I | Two resolvers merged per key → gclid + gbraid in one lead. | [Beautyflow_website#89](https://github.com/Soborbo/Beautyflow_website/pull/89) |
| beautyflow.pro | H | `calculator_result_view` on every render. | [Beautyflow_website#89](https://github.com/Soborbo/Beautyflow_website/pull/89) |

General pattern: the trapéz-specific bugs (A, B, D, E) did not recur, but F
(validation mismatch), C (stale branch state), H (duplicate/phantom
conversions), I (attribution gaps) and K (no server recompute) appeared on 4–5
of the 6 sites.
