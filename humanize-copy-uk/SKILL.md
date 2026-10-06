---
name: humanize-copy-uk
description: Write, rewrite or review English (UK) customer-facing copy for Soborbo's UK local-service and lead-gen sites (removals, clearances, cleaning, trades, beauty, coaching) so it reads like the owner wrote it - built only from facts the owner, the code or a checkable source gave, British English, no AI tells, no dashes, superlatives and review claims only with evidence (CAP Code, DMCCA). Use for web pages, service and area pages, landing pages, product or service descriptions, Google Business Profile descriptions, review replies and emails that go to customers, when the copy is in English, including when the request itself is written in Hungarian. Not for Hungarian copy (humanize-copy-hu), Google or Meta ad text (ads skill), JSON-LD (schema), keyword placement, titles and meta structure (seo-onpage), and not for code comments, documentation, commit messages or chat replies.
---

# Humanize copy (UK English)

The goal is copy the owner would sign as their own: specific, true, and written for one
kind of customer. Detector scores are not the goal. Google does not penalise text for
being AI-written; it penalises unhelpful, templated and scaled content however it was
made. People also judge AI text by feel no better than chance, so polishing surface
"tells" while the content stays generic fixes nothing.

| Need | Open |
|---|---|
| The structural AI tells, with before/after examples | `references/ai-tells.md` |
| CAP Code and DMCCA rules (superlatives, "free", reviews, prices), with dates | `references/perishable-facts.md` |

## Shared core

<!-- Mirrored in humanize-copy-hu/SKILL.md ("Közös mag"). Change both together. -->

**1. Work from real input, and add nothing.** Before writing, collect what is actually
known: the site config (`siteConfig`, `src/data/*`), the owner's notes, transcripts,
existing copy, real reviews, price lists, the project `CLAUDE.md` and memory. The rewrite
may reorder, cut, merge and reword. It may not add a fact, name, number, date, place,
customer story, quote, opinion or judgement that is not in that input. That includes
the plausible ones: a founding year, van sizes, "same-day quotes", opening hours, a
response-time promise, "fully insured", a neighbourhood the firm has never worked in.
Fleet specs, a callback-time promise, opening hours and an inferred founding year were
all invented by a model on one Soborbo site and had to be taken out again.

Why it matters: every sentence on a client's site is a promise made in their name. An
invented "we can usually quote same day" becomes a complaint when they cannot, and an
invented review or customer story is a banned practice in the UK (see below).

When a sentence needs a detail you do not have, either write the sentence without it, or
leave a visible question in the draft (`[ASK: how many vans?]`) and list it at the end.
Never fill the gap with a value that looks real.

**2. Claims filter.** Superlatives and absolutes ("No.1", "best in Bristol", "cheapest",
"fastest", "most trusted", "guaranteed", "always", "fully insured", "free") stay only if
the owner can show the evidence. CAP Code rule 3.7 requires the marketer to hold
documentary evidence for any claim a customer would take as objective, before it is
published. Reviews and ratings are quoted only from the real source, unedited in
meaning, and never written or "improved" by us (DMCCA 2024 Schedule 20 para 13; CAP 3.44).
Details and dates: `references/perishable-facts.md`.

**3. Concrete beats adjectives.** The most useful thing the old version of this skill
said: operational detail is what generic copy lacks and what customers need. What is
included in the price and what costs extra, how long the job takes, parking and access,
which van or equipment, what the customer needs to do beforehand, how payment works.
If the input has these, bring them forward. If it does not, ask for them: they are
worth more than any rewrite of the adjectives.

**4. Keep numbers the way the source gives them.** Real writing mixes exact and rounded
figures ("£95 for the first hour", "just over a week"), while generated text tends to
pick one register and use it everywhere. Keep each figure in the form the owner used.
Do not round a precise number to sound casual, and never invent precision.

**5. Structure, not word lists.** The reliable AI signals are structural: staged
contrasts ("it's not just X, it's Y"), forced threes, one-line closers, dashes as the
universal connector, inflated significance, label-colon bullets, Title Case headings.
Word habits change with every model release; structures persist. Read
`references/ai-tells.md` when reviewing a draft. Treat a tell as a symptom of saying
nothing specific, and fix the content, not just the phrase.

**6. A sample overrides the rules.** If the owner has written anything (an old page, a
Facebook post, an email, a call transcript), read it first and match its sentence length,
vocabulary, warmth and humour. Transcribed speech is the best source of voice: owners
often talk more plainly than they write (on one UK project the owner's written copy read
at about Flesch-Kincaid grade 10, his speech at about grade 3).

**7. No dashes, no AI phrasing.** In customer-facing copy there are no em dashes (—) and
no en dashes (–). Use a full stop, comma, colon or brackets instead, and a plain hyphen
in ranges ("2-3 hours", "Mon-Fri"). This is László's house rule for every client site,
and dashes are also one of the most recognisable AI habits in English web copy. Keep
dashes inside code, URLs and file names untouched.

**8. Sibling pages must differ in substance.** Area and service pages built from one
template, with the town name swapped, are what Google calls scaled content. Each sibling
needs its own facts (jobs done there, access issues, distance, local rules the owner
knows), its own opening and its own order. If the owner has no area-specific facts, say
so and suggest fewer area pages rather than padding.

**9. Reader test before handing over.** Give the final text, and nothing else, to a fresh
sub-agent with no context (in Claude Code: the Agent tool). Ask it: who is this for, what
is offered, what does it cost, what should I do next, and which sentences sound templated,
vague or machine-written. Fix what it stumbles on. On claude.ai, where there is no
sub-agent, tell the user to paste the text into a fresh chat with the same questions.
Idea from the Reader Testing stage of Anthropic's `doc-coauthoring` skill.

## British English and the owner's voice

- **Spelling and words:** British throughout (colour, organise, metres, licence as noun,
  tyre, flat, postcode, mobile). Prices in £ with VAT stated the way the client trades
  (CAP 3.18: consumer prices include non-optional taxes and charges).
- **Voice:** a local owner talking to a customer on the phone. "We" for the business,
  "you" for the reader, contractions where you would say them aloud. Starting a sentence
  with "And" or "But" is fine.
- **Plain words** are preferred where they mean the same thing: use rather than utilise,
  help rather than facilitate, start rather than commence, about rather than regarding,
  before rather than prior to, to rather than in order to. These are preferences, not
  bans: "bespoke" is ordinary British usage (bespoke wardrobes), and a technical term
  the customer searches for stays.
- **Lead-gen stock phrases** read as filler because every competitor's page has them:
  "Look no further", "Whether you're a... or a...", "We pride ourselves on", "Your trusted
  partner in", "Don't hesitate to contact us", "When it comes to", "In today's fast-paced
  world", "stress-free", "hassle-free", "a team of dedicated professionals". Replace them
  with the fact they were standing in for, or cut them.
- **Opening:** start with something specific the reader came for (what is done, where,
  for whom, roughly what it costs), not with a general statement about how stressful
  moving is.
- **Next step early:** near the top, one sentence that tells the reader how to book or
  get a quote, using only the routes the site really offers (form, phone, calculator).
  A page that reads well but does not lead anywhere has failed its job.
- **Honest limits, only from the owner:** a sentence saying who the service is not for,
  or what the firm does not do, is a strong trust signal, but only if the owner said it.
  Do not invent one to sound candid.
- **Emoji:** none in customer-facing copy or customer emails. (Internal admin
  notifications are a separate decision and not in scope.)

## How to work

For a short edit (one paragraph, a heading, a GBP description), just apply the core and
check the facts. For a page or a set of pages, this order works well:

- Collect the input listed in core point 1 and note what is missing.
- If there is an existing draft, read it whole and mark the tells (`references/ai-tells.md`),
  strongest first, before changing anything.
- Write or rewrite. Keep every supported claim; cut what only restates.
- Compare the result against the input, claim by claim: anything new, any number changed,
  anything lost? An unsupported addition is an error. A lost real detail is an error too.
- Run the reader test (core point 9).

What to return: the final copy; a short list of claims removed or softened because there
was no evidence; and the open questions for the owner. If the text goes into a file,
change the prose only: keep components, props, links, slugs and code untouched.

## When not to touch it

- Text the owner wrote themselves and asked only to proofread: fix errors, leave the
  voice, including sentences you would have written differently.
- Quotes, review text, legal or regulated wording (terms, privacy, insurance wording,
  CAP-required disclaimers), product names and trade terms.
- A single dash or a single list of three in otherwise specific copy. One tell alone is
  weak evidence; several together are the signal.
- Unusual, specific details that carry the voice (a real street, an odd remark from a
  real customer, a dry aside the owner wrote). They are what makes copy human.

## Final check

- Is every factual sentence traceable to the input? Would the owner sign it?
- Does any superlative, "free", "guaranteed" or rating remain without evidence?
- Any em or en dash, Title Case heading, emoji, or stock phrase left?
- Does it differ from its sibling pages in facts, not just in the place name?
- Did the reader test find the offer, the price information and the next step?

## Sources

- blader/humanizer v3.1.0 (MIT, about 54k stars, checked 2026-10-06): structural tells
  first because word habits change; never add facts, names or numbers; a writing sample
  overrides the rules; "when not to act". https://github.com/blader/humanizer
  Difference: humanizer allows adding an opinion where the voice calls for one. Here
  opinions belong to the owner, so they are not added either.
- Wikipedia: Signs of AI writing (WikiProject AI Cleanup advice page, not policy):
  "do not merely treat these signs as the problems to be fixed".
  https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing
- Anthropic `doc-coauthoring` skill, Reader Testing stage:
  https://github.com/anthropics/skills/tree/main/skills/doc-coauthoring
- Google on AI-generated content and scaled content abuse:
  https://developers.google.com/search/docs/fundamentals/using-gen-ai-content and
  https://developers.google.com/search/docs/essentials/spam-policies
