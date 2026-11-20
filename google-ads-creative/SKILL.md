---
name: google-ads-creative
description: "Writes and optimises Google Ads creative for any campaign type: responsive search ads, Performance Max asset groups, Demand Gen, Display, video scripts, Shopping titles, plus sitelinks, callouts, structured snippets, price and promotion assets, and image/video briefs, in British English or Hungarian. Starts from the client's 10 USPs, scores them, builds a claim ledger, validates character limits and policy by script, and sets up one-variable split tests suited to small budgets. Use whenever the user asks to write, rewrite, review or test ad copy, headlines, descriptions, RSAs, PMax assets, sitelinks or other ad assets, asks which ad text performs better, wants a USP analysis for ads, or says things like 'írj hirdetést', 'hirdetésszöveg', 'headline-ok', 'sitelinkek', 'USP elemzés', 'ad copy', even if Google Ads is not named. Not for bidding, budgets, GAQL or mutate mechanics: those belong to google-ads-pmax-ops."
---

# Google Ads creative: copy, assets, briefs and tests

Writes the creative layer for any Google Ads format and plans how to test it. Bidding, budgets,
GAQL recipes and mutate patterns live in `google-ads-pmax-ops`; load that skill before reading
from or writing to an account, and follow its dry-run-first rule.

**What makes copy work here** (the research behind this skill, in one paragraph): a specific,
provable selling point matched to what the searcher typed, with one clear next step. Clever
wording comes last. Ad Strength and "power words" are weak predictors of results; conversions per
impression and cost per conversion are what the copy is judged on.

## House rules
- Discuss strategy in Hungarian; write ad copy in the market's language (en-GB or hu). British
  spelling and understatement for the UK: no "amazing", "revolutionary", "#1".
- Never invent a fact. Every number, price, guarantee, rating or "free" in an ad traces to the
  claim ledger (below). If it is not in the ledger, leave it out or ask.
- Never recommend uncapped Maximise Conversions on small budgets; bidding questions go to
  `google-ads-pmax-ops`.
- Nothing goes live without showing the copy with character counts and getting an explicit go.

## Workflow
Copy this checklist into the reply and tick it off. Do not skip a gate because the request sounds
simple: the intake and the ledger are what separate these ads from generic ones.

```
- [ ] 1 Intake complete (10 USPs + required fields)
- [ ] 2 USP analysis + claim ledger shown to the user
- [ ] 3 Account and search-term evidence read (if an account exists)
- [ ] 4 Angles chosen (2-4), one hypothesis each
- [ ] 5 Copy and assets written for the requested formats
- [ ] 6 validate_ads.py passes with 0 errors; warnings resolved or explained
- [ ] 7 Compliance pass (Google editorial + UK or HU rules)
- [ ] 8 Image/video briefs (PMax, Demand Gen, Display, Video)
- [ ] 9 Test plan: variable, metric, guardrail, stop rule
```

## 1 Intake
First collect what can be collected without the user: fetch the landing page(s), read the account
with `Google_Ads_MCP:gads_search` (current ads, assets, search terms), check memory for the
project. Then ask only for what is still missing, in one message, in the user's language.

Required before writing:
1. **Ten USPs**, in the client's own words. Fewer than ten real ones is a finding, not a blocker:
   say so and work with what holds up.
2. **Proof for each USP**: where the claim is shown (URL, review count and source, certificate,
   years, number of jobs). No proof means the USP is rewritten or dropped.
3. Market and language; for Hungarian, formal (Ön) or informal (te). Default formal for services
   bought by adults over 35, informal for beauty and youth brands. One register per account.
4. Services or products, the ad group / asset group map, and target keywords per group.
5. Service area: towns, districts, postcodes.
6. Offer and price: fixed price, "from" price (must be really available), free survey or quote.
7. Guarantees with their exact conditions.
8. Who buys, what they worry about, the three most common objections.
9. Two to five competitors and what they claim.
10. Final URL per group and the conversion goal (call, form, purchase).
11. Brand voice, banned words, claims the client must not make.
12. Seasonal offers with real end dates.
13. Existing photos and video (real jobs, team, vehicles, premises).
14. Regulated area? (aesthetic or medical treatment, pest-control products, finance.)

## 2 USP analysis and claim ledger
Score each USP 1-5 on five criteria; weighted total out of 5.

| Criterion | Weight | Question |
|---|---|---|
| Specific | 25% | A number or concrete fact, not an adjective? |
| Provable | 25% | Is the proof on the landing page or a linkable source? |
| Relevant to intent | 20% | Does someone typing this keyword care? |
| Distinct | 20% | Do competitors say the same? If yes, cap this at 2. |
| Fits the field | 10% | Sayable in 30 characters in this language? |

Then rewrite weak USPs into testable claims, or mark them unusable:
- "Minőségi szolgáltatás" → "12 év, 1400+ költözés" (needs the numbers) or drop.
- "Fast" → "Out the same day" only if true every working day.

Output this table, then the ledger. The user should see which of their USPs survived and why.

```
| # | USP as given | Score | Verdict | Ad-ready form (chars) | Use as |
| 1 | Fix árak     | 4.6   | Lead    | Fix ár, rejtett díj nélkül (26) | benefit, objection |

CLAIM LEDGER
| Claim in ad            | Proof / where shown            | Status |
| 4,9/5, 300+ értékelés  | Google profile, 2026-11: 4.9, 312 | verified |
| Ingyenes felmérés      | /arak page, no conditions      | verified |
| Legolcsóbb             | none                           | BLOCKED |
```
Status is `verified`, `client-stated` (ask the user to confirm before launch) or `BLOCKED`.

## 3 Evidence from the account
Run these through `Google_Ads_MCP:gads_search` (query patterns in `google-ads-pmax-ops`):
- Search terms per ad group with clicks and conversions. These are the customer's own words; the
  best headline is often a converting search term tidied up.
- If one ad group mixes intents (service + price + emergency + DIY), say so and propose a split
  before writing: no copy fixes a mixed ad group.
- Existing RSAs and asset performance labels; which messages already win.
- Competitor ads via the Transparency Center recipe in `google-ads-pmax-ops`. Goal: find the
  crowded phrases to avoid and the gap to own, never to copy.

## 4 Angles
An angle is one hypothesis: *persona × motivation × proof*. Example: "landlord, wants it gone
today, proof = same-day slots". Pick 2-4 from: price certainty, speed, trust/proof, local,
risk removal (guarantee, insurance), convenience, specialist, pre-qualifying (price or minimum
job stated up front). Each RSA or asset group leans on one lead angle so a test can be read.

Stage of the buyer decides tone (Neil Patel's buying-stage point, Schwartz's awareness levels):
"pest control" → why us; "how to get rid of bed bugs" → problem and fast answer; brand term →
reassure and send to the right page.

## 5 Writing rules
Four foundations for every ad (Aaron Young): **keyword focus**, a **specific CTA**, a
**distinctive selling point**, and an **emotional trigger** tied to a real problem or outcome
("Save 12 hours on your taxes", not "Professional accounting").

Rules, strongest evidence first:
- **Mirror the query** [Google]. Target keyword whole in at least 2 headlines; at least 3
  headlines without it, about benefit, proof or offer.
- **Every asset stands alone.** Google shows 1-3 headlines in any order, may move a headline
  into the description, and may promote one to a sitelink. No headline may depend on another.
- **Short and concrete** [Optmyzr, ~20k accounts, correlational]. At least 4 headlines of 20
  characters or fewer; descriptions around 60-75 characters; sentence case, not Title Case
  (keep proper nouns capitalised). Do not pad to 30 for Ad Strength.
- **Numbers beat adjectives** [Neil Patel, MECLABS cases; consistent with Optmyzr]. "1400+ moves"
  over "experienced". Precise figures only from the ledger.
- **Message match** [Neil Patel; Google landing-page experience]. The lead headline's promise is
  the landing page H1's promise, in near-identical words. If they differ, flag it.
- **Local signals** [Neil Patel]: town or district in a headline and in the path.
- **Pre-qualify when leads are paid for** [Aaron Young]: a price or minimum-job line lowers CTR
  and can raise conversion rate and lead quality. Offer it as its own test.
- **Ad Strength is a diagnostic.** Reach "Good" so serving is not restricted, then stop.
  "Excellent" does not predict better CPA.

### Power words: vocabulary, not strategy
No controlled search-ads test shows that a word such as "free", "you", "because", "imagine",
"instantly" or "guaranteed" lifts conversions; the published lists come from blog headlines and
anecdotes. Where it was measured, urgency raised CTR and often lowered conversion rate. So treat
a power word as the carrier of a ledger claim, and measure it on conversions, not clicks.

| Job | en-GB (credible) | hu (credible) | Only if |
|---|---|---|---|
| Price certainty | fixed price, no hidden fees, no call-out fee | fix ár, rejtett díj nélkül, nincs kiszállási díj | true for every job |
| Speed | same-day, today, within 2 hours | még ma, 2 órán belül, azonnal | operationally true |
| Proof | 4.9/5 from 300+ reviews, since 2012, BPCA member | 4,9/5, 300+ értékelés, 12 éve, számlával | in ledger |
| Risk removal | fully insured, guaranteed, money back | biztosított, garanciával, pénzvisszafizetés | written terms exist |
| Free | free quote, free survey | ingyenes felmérés, díjmentes árajánlat | no conditions at all |
| Reason-why | because, so you | mert, így | a real reason follows |
| You-focus | your, you | Ön, az Ön / te | matches register |
| Local | local, in Bristol, near you | helyi, Budapesten, a közelben | served area |
| New / now | new, now, today | új, most, ma | genuinely new or current |

Avoid in both markets: best, #1, leading, cheapest (legjobb, első számú, piacvezető, legolcsóbb)
unless the ledger holds comparative proof against the whole market; hype adjectives; fake scarcity.
Competitor brand names in ad text (a Neil Patel tactic) are off by default: trademark and
comparative-advertising risk. Use only on the user's explicit instruction and never with a claim
about the competitor.

### Hungarian notes
- Words are long: plan the keyword headline first, then shorten the rest. Drop articles, use
  "+" and numerals, prefer a noun phrase to a full sentence.
- Accented letters count as one character. Never strip accents to save space.
- Keyword insertion breaks on inflection ("költöztetés budapest" reads as broken Hungarian). Use
  `{KeyWord:Default}` only in ad groups whose keywords already read as correct headlines.
- Prices: "9 900 Ft-tól", gross for consumers. Decimal comma: "4,9/5".

## 6 Formats
Limits last verified 2026-11 against Google Ads Help. If a mutate is rejected on length or
count, trust the API error and update this table.

| Format | Text fields (max chars × count) | Notes |
|---|---|---|
| Responsive search ad | headline 30 × 3-15; description 90 × 2-4; path 15 × 2 | Write 12-15 headlines, 4 descriptions. Two RSAs per ad group for testing (three is the cap). |
| Performance Max asset group | headline 30 × 3-15 (one ≤15); long headline 90 × 1-5; description 90 × 2-5 (one ≤60); business name 25 | Plus images, logos, video, search themes, audience signal. One theme per asset group. |
| Demand Gen image / carousel | headline 40 × 5; description 90 × 5; business name 25; carousel card headline 40, 2-10 cards | Keep one headline ≤30. Interruption format: lead with the outcome, not the keyword. |
| Demand Gen video | headline 40; long headline 90; description 90; CTA from list | Video ≥10 s to run in-stream. Script rules in section 8. |
| Responsive display ad | headline 30 × 5; long headline 90 × 1; description 90 × 5; business name 25 | Long headline must work with no description shown. |
| Shopping / Merchant Center | title 150 (front-load 70); description 5000 | Brand + product type + key attributes (size, material, colour, thickness) + differentiator. No promo text, no price, no capitals. |
| App | headline 30 × 5; description 90 × 5 | Rare here; same standalone rule. |
| Local Services Ads | none | Profile-driven: reviews, categories, photos. Advise on profile, not copy. |
| Call ads | — | Being retired (no new ads from 2026-02). Use an RSA with a call asset. |

**RSA headline mix for 15** (adjust to the angle; fewer is fine if they are distinct): 3 keyword
+ place, 3 benefit/USP, 2 proof, 2 offer or price, 2 objection removal, 2 CTA, 1 brand.
**Pinning**: default is one keyword headline pinned to position 1 (or 2-3 interchangeable
keyword headlines all pinned to 1), a CTA optionally pinned to 3, position 2 free. Pin legally
required text. Google advises against pinning; account studies and Aaron Young's tests favour
light pinning, so treat the pin as a test variable. With AI Max final URL expansion on, pins are
not honoured.
**PMax**: reuse the Search messages that already win; long headlines are full sentences that
carry benefit + proof; write 10-25 search themes from converting search terms; state whether
final URL expansion should be on (see `google-ads-pmax-ops` for the setting).

**Assets** (write these with every Search or PMax build; they take more screen space than the ad):

| Asset | Limits | How many | Writing rule |
|---|---|---|---|
| Sitelink | text 25; two descriptions 35 each (both or neither) | 6-8 | Each goes to a different page and answers a different next question: prices, areas, reviews, a service, about, contact. Never repeat a headline. |
| Callout | 25 | 6-10 | Facts with no verb: "Fix ár", "Fully insured". No duplicates of sitelinks. |
| Structured snippet | value 25; 3-10 values | 1-2 headers | Header from Google's list: Service catalog, Types, Brands, Neighborhoods, Models, Styles, Amenities, Courses, Destinations, Insurance coverage, Shows, Featured hotels, Degree programs. |
| Price | header 25; description 25; 3-8 items | 1 set | Only real, current prices with the right qualifier (From / Up to / Average). |
| Promotion | item 20 | when live | Real offer, real end date, same terms on the page. |
| Call | real business number | 1 | No phone numbers in ad text. No Google forwarding number (house rule). |
| Location | linked Business Profile | 1 | Check the profile name and address match the site. |
| Lead form | headline 30; description 200; business name 25 | optional | Only when the site form is the weak point. |
| Image (Search) | 1:1 and 1.91:1 | 4+ | Real photos, no text overlay, no logo-only images. |
| Business name / logo | 25; 1:1 logo | 1 | Needs advertiser verification. |

## 7 Compliance
This is a filter, not legal advice. Flag anything doubtful and leave the decision to a person.
- **Google editorial**: no exclamation mark in headlines, no repeated punctuation, no emoji or
  symbols, no ALL CAPS words except real acronyms, no "click here" / "kattintson ide", no phone
  number in text, standard spelling. Prices, offers and ratings in the ad must be visible on the
  landing page. Trademarks of others: not in ad text without permission.
- **UK (ASA / CAP Code, CMA, DMCC Act)**: hold documentary evidence before the ad runs for any
  objective claim; "best", "leading", "cheapest", "No.1" need comparative proof; "free" means no
  cost and no catch; "from £X" must be available to a meaningful share of customers; show the
  total price (no drip pricing); review claims must be real and current. Aesthetic treatments:
  no prescription-only medicines (botulinum toxin) advertised at all, no trivialising or
  time-pressure offers for cosmetic procedures, no targeting under-18s; say "hair reduction"
  unless permanence is substantiated.
- **HU (Fttv., Grt., GVH practice)**: a superlative ("leg-", "piacvezető", "első számú") must
  be provable against all competitors for the whole time the ad runs; "ingyenes" only with no
  condition; a discount needs a real reference price (lowest in the previous 30 days);
  consumer prices gross. Health and medical-service claims are restricted: no cure promises.
- **Regulated or unsure**: mark the asset `needs sign-off` in the output instead of softening it
  silently.

## 8 Image and video briefs
Deliver a brief the client can shoot on a phone; image cropping and upload are in
`google-ads-pmax-ops`.
- **Images**: real jobs, real team, real vehicles and premises; a face looking at the camera or
  at the work; one subject per frame, centred so 1.91:1, 1:1 and 4:5 crops all work; no text
  baked in, no collage, no stock where a real photo exists. Per asset group: 4+ landscape,
  4+ square, 2+ portrait, each showing a different proof (result, people, process, place).
  Before/after only where the sector's rules allow it.
- **Video**: PMax auto-generates a video unless one is supplied in each orientation, and the
  auto version is usually poor. Supply 16:9, 1:1 and 9:16, each 10 s or longer. Script to
  Google's ABCD (Google/Kantar's own research, so treat as guidance):
  **A**ttention in the first 2-5 s, **B**rand shown early and spoken, **C**onnection through a
  person and a real situation, **D**irection with one spoken and on-screen CTA.

```
VIDEO BRIEF (15-30 s, phone, vertical first)
0-3 s   Hook: the problem or the result, shown not told. On-screen text ≤ 6 words.
3-10 s  Who we are + the lead USP, said by a real person on site. Logo visible.
10-20 s Proof: the job being done, the number, the review.
20-30 s CTA: one action, spoken and on screen. End card with brand + URL.
Shots to capture: ... | Line to say (≤ 25 words): ... | Sound: voice, no music-only cut.
```

## 9 Optimisation and testing
Small accounts cannot test 15 × 4 asset combinations in any useful time. Test **angles and one
variable at a time**, the way Aaron Young runs it:
1. Two RSAs per ad group, identical except for one variable. Order of tests that has paid off:
   keyword headline pinned to position 1 vs unpinned → CTA pinned vs free → lead angle (price vs
   speed vs proof) → pre-qualifier vs none → description lead.
2. Run a test for at least 30 days and at least 100 clicks per ad; do not change bidding or
   keywords in the same window, or the result cannot be attributed.
3. Judge on **conversions per impression** and **cost per conversion** (lead gen) or conversion
   value per impression (shop). CTR is a guardrail only: a lower-CTR ad that converts better wins.
4. Decide with `python3 validate_ads.py --test IMPR_A CONV_A IMPR_B CONV_B`. Winner at
   P ≥ 90%. If there is no winner after 60 days, keep the leader, label the result
   "directional", and move to the next variable. Where the same test runs in several ad groups,
   add the numbers together before deciding.
5. Winner stays, loser is paused, winner is duplicated with the next single change. Keep a test
   log: date, ad group, variable, result, confidence.

Reading the account:
- Asset labels (Best / Good / Low) are relative and impression-based; with few impressions they
  mean little. Replace a "Low" asset only after it has had real exposure, and replace it with a
  different angle, not a synonym.
- Search terms monthly: new converting phrases become headlines; irrelevant ones become negatives.
- Falling CTR with steady impression share and position suggests fatigue or a new competitor
  message: check competitors before rewriting.
- PMax: judge the asset group as a whole on cost per lead against the Search campaign; swap the
  weakest text and image assets in small batches, then leave it alone for two weeks.
- Rewriting copy does not fix a broken landing page, mixed-intent ad group or bad conversion
  tracking. Say so when that is the real problem.

## 10 Validator
Deterministic checks are done by script, not by eye: lengths (accents and keyword insertion
handled), counts, near-duplicates, editorial rules, unbacked claim words, keyword coverage,
pins, Hungarian register mix. Save the script below as `validate_ads.py`, write the copy to
`ads.json`, run `python3 validate_ads.py ads.json`, fix, and repeat until there are 0 errors.
Present copy only after it passes. Warnings are judgement calls: resolve or explain each one.

Input (one object or a list of them):
```json
{"name": "Removals Bristol – RSA A (fixed price)", "format": "rsa", "lang": "en",
 "keywords": ["removals bristol"], "claims_ok": ["free"], "ai_max_url_expansion": false,
 "headlines": [{"text": "Removals in Bristol", "pin": 1}, "Fixed price, no hidden fees"],
 "descriptions": ["..."], "paths": ["removals", "bristol"],
 "long_headlines": [], "business_name": "Painless Removals",
 "sitelinks": [{"text": "Prices", "d1": "Instant online estimate", "d2": "Fixed price before you book"}],
 "callouts": ["Fully insured"], "snippet_values": ["House removals", "Packing"]}
```
`format` is `rsa`, `pmax`, `demandgen` or `rda`. `claims_ok` lists claim words that have a
verified ledger entry. Hungarian keywords are matched as whole words, so an inflected form
("költöztetést") triggers a coverage warning that can be explained away.

```python
#!/usr/bin/env python3
"""Validate Google Ads text assets. Usage: python3 validate_ads.py ads.json
       Test read-out:  python3 validate_ads.py --test IMPR_A CONV_A IMPR_B CONV_B
Stdlib only. Exit code 1 if any ERROR."""
import json, random, re, sys, unicodedata

# (max chars, min count, max count) per field; Google Ads limits, last verified 2026-11
LIMITS = {
    "rsa": {"headlines": (30, 3, 15), "descriptions": (90, 2, 4), "paths": (15, 0, 2)},
    "pmax": {"headlines": (30, 3, 15), "long_headlines": (90, 1, 5), "descriptions": (90, 2, 5),
             "paths": (15, 0, 2), "business_name": (25, 1, 1)},
    "demandgen": {"headlines": (40, 1, 5), "long_headlines": (90, 0, 5), "descriptions": (90, 1, 5),
                  "business_name": (25, 1, 1)},
    "rda": {"headlines": (30, 1, 5), "long_headlines": (90, 1, 1), "descriptions": (90, 1, 5),
            "business_name": (25, 1, 1)},
}
ASSET_LIMITS = {"callouts": 25, "snippet_values": 25, "sitelink_text": 25, "sitelink_desc": 35,
                "price_header": 25, "price_desc": 25, "promotion_item": 20}
# Words that are claims: allowed only when listed in "claims_ok" (i.e. present in the claim ledger)
CLAIM = r"\b(best|no\.? ?1|#1|leading|cheapest|lowest|top[- ]rated|guaranteed?|free|award[- ]winning|" \
        r"legjobb\w*|legolcsóbb\w*|legnagyobb\w*|leggyorsabb\w*|első számú|piacvezető\w*|garan\w+|ingyen\w*|díjnyertes\w*)"
BANNED = r"(click here|kattints? ide|kattintson ide)"
NEAR_DUP = 0.7   # token Jaccard above this = two assets say the same thing, wasting a slot
SHORT_H = 20     # Optmyzr: shorter headlines correlate with lower CPA; also lets 3 headlines fit

def text_of(a): return a["text"] if isinstance(a, dict) else a
def count(s):
    s = re.sub(r"\{(?:KeyWord|Keyword|keyword|KEYWORD|LOCATION\([^)]*\)):([^}]*)\}", r"\1", s)  # DKI counts as its default
    return len(unicodedata.normalize("NFC", s))
def tokens(s): return set(re.findall(r"\w+", s.lower()))

def check(d):
    out, fmt, lang = [], d.get("format", "rsa"), d.get("lang", "en")
    ok = [c.lower() for c in d.get("claims_ok", [])]
    E = lambda m: out.append("ERROR  " + m); W = lambda m: out.append("WARN   " + m)
    if fmt not in LIMITS: E(f"unknown format '{fmt}'; use one of {list(LIMITS)}"); return out
    every = []
    for field, (mx, lo, hi) in LIMITS[fmt].items():
        items = d.get(field, [])
        items = [items] if isinstance(items, str) else items
        if not lo <= len(items) <= hi: E(f"{field}: {len(items)} given, allowed {lo}-{hi}")
        for a in items:
            t = text_of(a); every.append((field, t)); n = count(t)
            if n > mx: E(f"{field} {n}/{mx} chars, cut {n - mx}: \"{t}\"")
    for sl in d.get("sitelinks", []):
        for key, lim in (("text", "sitelink_text"), ("d1", "sitelink_desc"), ("d2", "sitelink_desc")):
            if sl.get(key):
                every.append(("sitelink", sl[key]))
                if count(sl[key]) > ASSET_LIMITS[lim]: E(f"sitelink {key} {count(sl[key])}/{ASSET_LIMITS[lim]}: \"{sl[key]}\"")
        if bool(sl.get("d1")) != bool(sl.get("d2")): E(f"sitelink \"{sl.get('text')}\": give both descriptions or neither")
    for field in ("callouts", "snippet_values"):
        for t in d.get(field, []):
            every.append((field, t))
            if count(t) > ASSET_LIMITS[field]: E(f"{field} {count(t)}/{ASSET_LIMITS[field]}: \"{t}\"")
    for field, t in every:   # editorial + claims on every asset
        if re.search(r"[!?.]{2,}|[\U0001F300-\U0001FAFF☀-➿]", t): E(f"repeated punctuation, emoji or symbol: \"{t}\"")
        if "!" in t and field in ("headlines", "long_headlines", "sitelink", "callouts"): E(f"exclamation mark not allowed in {field}: \"{t}\"")
        if any(len(w) > 4 and w.isupper() for w in re.findall(r"[^\W\d_]+", t)): W(f"ALL-CAPS word (ok only for real acronyms/brands): \"{t}\"")
        if re.search(BANNED, t, re.I): E(f"generic 'click here' CTA: \"{t}\"")
        if re.search(r"(\+?\d[\d \-/]{7,}\d)", t): E(f"phone number in ad text (use a call asset): \"{t}\"")
        for m in re.finditer(CLAIM, t, re.I):
            if not any(c in m.group(0).lower() or m.group(0).lower() in c for c in ok):
                W(f"claim word '{m.group(0)}' not in claims_ok (needs a claim-ledger entry): \"{t}\"")
    for field in ("headlines", "descriptions", "long_headlines", "callouts"):   # duplicates
        ts = [text_of(a) for a in d.get(field, [])] if not isinstance(d.get(field), str) else []
        for i in range(len(ts)):
            for j in range(i + 1, len(ts)):
                a, b = tokens(ts[i]), tokens(ts[j])
                if a and b and len(a & b) / len(a | b) >= NEAR_DUP: W(f"near-duplicate {field}: \"{ts[i]}\" ~ \"{ts[j]}\"")
    hs = d.get("headlines", [])
    if fmt in ("rsa", "pmax") and hs:
        short = sum(count(text_of(h)) <= SHORT_H for h in hs)
        if short < min(4, len(hs)): W(f"only {short} headlines <= {SHORT_H} chars; aim for 4+")
        if fmt == "pmax" and not any(count(text_of(h)) <= 15 for h in hs): E("PMax needs one headline <= 15 chars")
        if fmt == "pmax" and not any(count(text_of(x)) <= 60 for x in d.get("descriptions", [])): E("PMax needs one description <= 60 chars")
        for kw in d.get("keywords", []):
            n = sum(tokens(kw) <= tokens(re.sub(r"\{[^:}]*:([^}]*)\}", r"\1", text_of(h))) for h in hs)
            if n < 2: W(f"keyword '{kw}' appears whole in {n} headline(s); Google asks for 2")
    if fmt == "rsa":
        pins = {}
        for field in ("headlines", "descriptions"):
            for a in d.get(field, []):
                if isinstance(a, dict) and a.get("pin"): pins.setdefault((field, a["pin"]), []).append(a["text"])
        if sum(len(v) for v in pins.values()) > 6: W("more than 6 pinned assets: Google has little left to rotate")
        if {("headlines", 1), ("headlines", 2), ("headlines", 3)} <= set(pins): W("all three headline positions pinned; leave H3 free")
        if pins and d.get("ai_max_url_expansion"): W("AI Max final URL expansion is on: pins are not honoured; do not rely on pins for compliance text")
    if lang == "hu":
        blob = " ".join(t for _, t in every)
        formal = re.search(r"\bÖn\w*\b", blob) or re.search(r"\b(kérjen|hívjon|foglaljon|rendeljen|nézze|válasszon|keressen)\b", blob, re.I)
        informal = re.search(r"\b(kérj|hívj|foglalj|rendelj|nézd|válassz|keress|neked|téged)\b", blob, re.I)
        if formal and informal: E(f"mixed formal/informal address: '{formal.group(0)}' vs '{informal.group(0)}'")
    return out

def test(ia, ca, ib, cb, n=20000):
    """P(B beats A) on conversions per impression, Beta(1,1) priors, Monte Carlo."""
    random.seed(7)  # fixed seed: same inputs give the same answer
    wins = sum(random.betavariate(1 + cb, 1 + ib - cb) > random.betavariate(1 + ca, 1 + ia - ca) for _ in range(n))
    p = wins / n
    verdict = "B wins" if p >= 0.9 else "A wins" if p <= 0.1 else "no decision yet: keep running or call it directional"
    print(f"conv/impr A={ca / ia:.4%} B={cb / ib:.4%}  P(B>A)={p:.1%}  -> {verdict}")

if __name__ == "__main__":
    if len(sys.argv) == 6 and sys.argv[1] == "--test":
        test(*map(int, sys.argv[2:])); sys.exit(0)
    if len(sys.argv) != 2: sys.exit(__doc__)
    try:
        data = json.load(open(sys.argv[1], encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as e:
        sys.exit(f"Cannot read {sys.argv[1]}: {e}. Pass a JSON file; see the input example in SKILL.md.")
    sets = data if isinstance(data, list) else [data]
    bad = False
    for i, s in enumerate(sets):
        res = check(s)
        print(f"== {s.get('name', f'set {i + 1}')} [{s.get('format', 'rsa')}/{s.get('lang', 'en')}]: "
              f"{sum(r.startswith('ERROR') for r in res)} errors, {sum(r.startswith('WARN') for r in res)} warnings")
        for field in ("headlines", "long_headlines", "descriptions"):
            for a in s.get(field, []) if not isinstance(s.get(field), str) else []:
                print(f"   {count(text_of(a)):>3}  {field[:-1]:<14} {text_of(a)}" + (f"  [pin {a['pin']}]" if isinstance(a, dict) and a.get('pin') else ""))
        print("\n".join("   " + r for r in res))
        bad |= any(r.startswith("ERROR") for r in res)
    sys.exit(1 if bad else 0)
```

## 11 Output
Deliver in this order, in English for copy and headings (Hungarian commentary is fine):
1. USP table and claim ledger.
2. Angles chosen, one line each.
3. Per ad group or asset group: the validator's count listing (length, field, text, pin), then
   assets (sitelinks, callouts, snippets, price, promotion), each line with its character count.
4. Items marked `needs sign-off` or `client-stated`, with what is needed to clear them.
5. Image and video briefs where the format uses them.
6. Test plan: variable, primary metric, guardrail, minimum run, decision rule.
7. What is not validated: say plainly that the copy is a set of hypotheses until the test reads
   out, and name anything assumed.

To publish, hand the approved set to the `google-ads-pmax-ops` mutate flow (dry run, diff, go).

## Sources behind the rules
Google Ads Help (RSA best practices, asset specs, editorial policy); Optmyzr RSA and Ad Strength
studies; Adalysis RSA studies; Aaron Young / Define Digital Academy (four foundations, layered
split tests); Neil Patel (message match, numbers, local signals, buying stages, power-word
lists); nowork-studio google-ads-copy skill (claim ledger, angle hypotheses); ASA/CAP, GVH.
Account-level studies are correlational and guru case studies are single accounts: when a rule
here conflicts with this account's own test results, the account's results win.
