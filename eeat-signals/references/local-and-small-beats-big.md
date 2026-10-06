# Local trust & small-business-beats-big

Local + niche search **levels the field**: for local-intent queries Google weighs
relevance and proximity over raw domain authority, so a focused operator can outrank a
national brand that has ten times the budget but weak local execution.

## The asymmetric advantages (a chain can't easily match)
1. **Genuine first-hand Experience** — real photos of real jobs, before/after, owner
   know-how. The one E-E-A-T pillar money can't manufacture and AI can't generate.
2. **A steady flow of genuine reviews** from real local customers, asked of every
   customer, with owner replies. How to ask legally: [reviews.md](./reviews.md).
3. **Niche topical depth** — own one narrow topic completely; indexes and ranks faster.
4. **Proprietary data/proof** — original specs, tests, comparisons (also the top GEO lever).
5. **Hyper-local targeting** — "[service] in [neighbourhood]" beats broad head terms.
   Which page owns which local keyword, and how area pages link: `seo-onpage`.
6. **AI-search structure** — fact-dense, answer-first content lifts lower-authority sites
   disproportionately.

## Where national competitors are weak (attack these)
- Thin/neglected Google Business Profiles; inconsistent NAP across directories.
- Generic, templated location pages (doorway risk).
- Low review engagement; no owner responses.

## Google Business Profile as a trust asset (signal, not owned by this kit)
- The real business name as used on signage and the site (no keywords, no legal suffix
  stuffing); the most specific primary category that is true for the business, plus
  relevant secondaries; complete description, services, attributes, hours; real,
  regularly-updated photos.
- Answer genuine questions people ask. Do not post questions yourself or from friends'
  accounts and answer them ("seeding"): it is deceptive and against Google's policies.
- Reviews: ask every customer, reply to all, no incentives. Direct review link, request
  templates and the GBP-link UTM: [reviews.md](./reviews.md). Keep GBP fields aligned
  with on-site NAP.

## Worked example — trapézlemez seller (HU), generalises to any trade/product SMB
- **Experience**: original photos of actual T8/T18/T35 profiles, coatings, real roofs
  supplied/installed; before/after; "ezt a tetőt mi szereltük be".
- **Proprietary data**: a profile/spec comparison (gauge, coating, load, Ft/m²) as a
  table — citable by AI, uncopyable by a reseller.
- **Topical depth**: pillar "trapézlemez" + spokes (profil-típusok, bevonatok, rögzítés,
  páralecsapódás/HRV, m² kalkulátor, "melyik trapézlemez kell" döntési útmutató), each
  answer-first with cited specs. The page/keyword map and internal links behind it:
  `seo-onpage`.
- **Trust**: visible cégjegyzékszám + adószám, phone, address, an Impresszum with the
  Ekertv. 4. § fields; Árukereső Megbízható Bolt if a webshop; genuine Google reviews.
- **Authoritativeness off-site**: gyakorikérdések threads, építkezés/felújítás forums,
  supplier directories (Cylex, Arany Oldalak).
- **Schema** (hand-off): Organization/LocalBusiness (e.g. `RoofingContractor`/
  `HardwareStore`), Product with real Offers, Person for the expert — built by
  the `schema` skill.

Run `npm run audit -- --dir ./dist --market hu` to verify the visible side of all of this.
