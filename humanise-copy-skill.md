---
name: humanize-copy
description: Apply to all customer-facing website copy. Transforms AI text into human-sounding copy written by a real business owner. Vocabulary, rhythm, voice, local specificity, structure, mechanical fixes. Calibrated for UK local service pages.
---

# Humanize Copy

These techniques create controlled irregularity, not chaos. If the page reads like someone trying too hard to sound casual, pull back.

Target three detection metrics: **perplexity** (word predictability), **burstiness** (sentence variation), **uniformity** (style consistency).

---

## ABSOLUTE BANS

**Never use em dashes (—).** Replace with full stops, commas, parentheses, colons, or semicolons.

**Never use emojis.** Nowhere.

**Kill on sight:** delve, tapestry, landscape (metaphor), leverage, foster, harness, pivotal, meticulous, multifaceted, nuanced, robust, comprehensive, innovative, cutting-edge, seamless, holistic, realm, paradigm, embark, endeavour, elevate, spearhead, underpin, underscore, cornerstone, game-changer, synergy

**Replace with plain English:** ensure→make sure, utilise→use, facilitate→help, navigate→sort out, optimise→improve, streamline→simplify, enhance→improve, crucial→important, encompasses→covers, residing→living, commence→start, regarding→about, subsequently→then, numerous→many, prior to→before, in order to→to, tailored→suited, bespoke→custom/made for you, dynamic→(delete), scalable→(delete), ecosystem→(delete), solution-oriented→(delete)

**Kill transition words:** furthermore, moreover, additionally, consequently, notably. Replace with "and", "but", "so", "plus", "also", or nothing.

**Kill phrase templates:** "In today's rapidly-evolving...", "Whether you're a...or a...", "It's not just about X, it's about Y", "Look no further", "Your trusted partner in...", "We understand that...", "When it comes to...", "[Thing] is key", "We pride ourselves on...", "Don't hesitate to..."

---

## TECHNIQUES

### Vocabulary

1. **Purge AI lexicon first.** Search-and-replace every banned word before any other edit. Use the word you'd say on the phone.

2. **Restore simple verbs.** AI replaces "is" with "serves as" or "represents." Reverse it. "Our team is experienced" not "Our team represents a wealth of expertise."

3. **Drop formal transitions.** However→But. Furthermore→And. Consequently→So. Best move: no transition at all.

### Rhythm

4. **Sentence length: 4-to-25-word range.** Average 14-18 words. 15-25% under 8 words. 10-15% over 25. Vary these targets slightly per page.

5. **One fragment per 300 words.** "Worth every penny." / "Big difference." AI never produces fragments.

6. **Vary punctuation.** Rotate commas, semicolons, parentheses, colons, ellipses, full stops. Variety itself is a human signal.

### Voice

7. **Rewrite the first paragraph from scratch.** Open with a specific detail, story, or claim. Never a broad context statement. "Last Tuesday we moved a piano down three flights on Caledonia Place" not "Moving house can be stressful."

8. **One honest caveat per page.** "We're not the cheapest. But we've never broken a customer's telly."

9. **One founder opinion per page.** "Personally, I think most people underestimate how long packing takes. Budget a full day."

10. **One micro-story per page (2-3 sentences).** "One of our regulars in Headington has moved four times in six years. She says we're faster each time. (We just know where she keeps the kettle now.)"

11. **One commercial filter per page.** "If you just need two blokes for an hour to shift a sofa, we're probably not your best option." AI never excludes customers. Humans do.

12. **One booking-forward statement in the first 400 words.** "If you're moving within BS8 this month, we can usually quote same day." Detector-safe content that doesn't convert is useless.

### Local Specificity

13. **Five named entities per 800 words minimum.** Road names, postcodes, council names, landmarks, nearby areas. Google ranks entity density. Never use Level 2-3 generics ("vibrant community", "rich history"). Delete on sight.

14. **Operational details AI can't generate.** Van sizes, real timing, what's included vs extra, insurance figures, parking logistics, council form names.

15. **Reference the journey from depot.** "We're 15 minutes up the A34." Real operational knowledge training data doesn't contain.

16. **Mix precision with imprecision.** Alternate "7-10 working days" with "just over a week." Humans toggle between exact and fuzzy. AI picks one.

### Structure

17. **Vary paragraph length dramatically.** At least three single-sentence paragraphs. At least two of 4+ sentences. No two consecutive paragraphs the same length.

18. **Break symmetry.** If listing three things, make one shorter, expand one, or add a side comment to only one. Perfect triads are an AI fingerprint.

19. **70/30 content-to-personality ratio.** 70% information, 30% voice. AI runs 95/5.

20. **Cross-page differentiation (multi-area sites).** Max 40% sentence overlap between sibling pages. Different structural order, opening style, price framing, and internal links per page. No identical section headings across 3+ sibling pages. Same template across 10 pages = scaled content, even if each passes GPTZero.

### Mechanical

21. **Contractions in most sentences.** At least 2 per paragraph. "We're", "it's", "don't", "can't". If you wouldn't use the uncontracted form out loud, contract it.

22. **Convert nominalisations to active verbs.** "The completion of your move"→"completing your move." Search for "the [noun] of" patterns.

23. **Allow natural looseness.** Don't correct every minor imperfection during editing. A missing comma, a slightly informal construction, a sentence that starts with "And" or "But". Let these stand. Grammatical perfectionism is an AI signal.

24. **Kill 10% of explanatory sentences as final pass.** Delete every tenth. If clarity survives, it was filler.

---

## PROMPTING STRATEGY

Generate section by section, never full pages. Use role prompts: "You are a straight-talking [business] owner in [city] with [X] years' experience. Write like you're on the phone to a customer." Include banned word list in every prompt. Feed real local details and one real anecdote per section.

---

## FINAL CHECKLIST

```
[ ] Zero banned words, phrases, em dashes, emojis
[ ] First paragraph: specific detail, not broad context
[ ] Booking-forward statement in first 400 words
[ ] Sentence length varies (15-25% short, 10-15% long)
[ ] One fragment per 300 words
[ ] One caveat, one opinion, one micro-story, one commercial filter
[ ] 5+ named entities per 800 words, zero generics
[ ] Operational details and depot journey included
[ ] Precision/imprecision mix present
[ ] No two consecutive paragraphs same length
[ ] No perfect triads or symmetrical lists
[ ] At least 2 contractions per paragraph
[ ] Nominalisations converted to active verbs
[ ] Natural looseness preserved (not over-polished)
[ ] 10% explanatory sentences deleted
[ ] Cross-page overlap under 40%, no repeated headings (multi-area)
[ ] Read aloud, stumbles rewritten
```
