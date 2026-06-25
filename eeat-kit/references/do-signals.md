# DO — E-E-A-T signals to place

Each signal lists: what to add (visible), the auditor check that verifies it, and
where the **schema** form (if any) is owned. Add the visible signal here; emit the
markup via schema-entity-graph; validate it via schema-audit.

## Experience (first-hand) — the asymmetric edge
- Real, original photography of actual jobs/products/installs (not stock). Caption them.
- Before/after evidence; case studies with specific metrics (m², days, £/Ft, counts).
- First-person operational detail: "we installed/removed/fitted…", "ezt mi szereltük be".
- Original data: spec comparisons, tests, surveys — the single hardest thing for a
  larger competitor to copy and a strong AI-citation magnet.
- Verified by: `experience.first-hand`. Schema: none required (it's content).

## Expertise
- Named author with a bio stating **specific** credentials: years in trade, dates,
  certifications, named qualifications, concrete results — never "passionate about".
- Topical depth: pillar + spokes covering the full question universe; cite primary sources.
- Verified by: `author.bio-credentials`. Schema (`Person.hasOccupation/knowsAbout`):
  schema-entity-graph builds, schema-audit validates.

## Authoritativeness
- Consistent entity identity (same name/address/phone everywhere).
- Recognised accreditations/trade bodies shown with logo + link to the public register.
- Third-party presence (directories, reviews, PR) — see ai-visibility.md; ~85% of AI
  brand mentions come from third-party domains, so off-site presence is the real lever.
- Verified by: `business.accreditations`, `business.address`. Schema (`sameAs`):
  schema-entity-graph / schema-audit.

## Trust (the load-bearing pillar)
- Visible: phone, postal address, company registration (UK number / HU cégjegyzékszám
  + adószám), About with named people, Contact, Privacy, Terms; returns/refund/shipping
  for product pages. HTTPS.
- Genuine reviews surfaced on the page; Google Business Profile complete and active.
- Verified by: `business.phone`, `business.address`, `business.registration`,
  `trust-page.*`. Review **schema** eligibility & self-serving rules: schema-audit.

## Authorship visibility
- A visible byline on every article/blog page, linking to an author/profile page.
- Verified by: `author.visible-byline`. (The `Person` entity + `@id` is schema-audit.)

## GEO / AI readiness
- Answer-first opening (~40–360 chars) that directly answers the page's core question.
- Fact density: specific numbers, dates, named quotes throughout.
- Allow AI **retrieval** crawlers in robots.txt (OAI-SearchBot, ChatGPT-User,
  PerplexityBot, Perplexity-User, Claude-SearchBot, Claude-User, Google-Extended).
- Verified by: `geo.answer-first`, `ai-crawler.*`. See ai-visibility.md.

## Service vs product emphasis
- **Service** (removals, ventilation, beauty): operator credentials, GBP + reviews,
  accreditations, local trust, case studies.
- **Product** (sheet metal, fences, container houses): Product detail by knowledgeable
  staff, customer product reviews (rich-result-eligible, unlike self-reviews), returns/
  shipping policy, original product photography, proprietary spec/test data, marketplace
  presence (Árukereső/eMAG in HU).
