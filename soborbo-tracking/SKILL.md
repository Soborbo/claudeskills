---
name: soborbo-tracking
description: >-
  MOVED — the canonical Soborbo lead-gen tracking package (Astro client lib +
  event-gateway onboarding) now lives IN the engine repo: github.com/Soborbo/Serverside
  → soborbo-tracking/. As of 2026-07-21 it is no longer a standalone claudeskills
  skill and there is no vendored events.json copy: the worker and the client lib
  share the single canonical Serverside/src/events.json. Use the copy in Serverside.
---

# soborbo-tracking — MOVED to the Serverside repo

This skill was **consolidated into the engine repo** on 2026-07-21.

**Canonical home:** [`github.com/Soborbo/Serverside`](https://github.com/Soborbo/Serverside)
→ [`soborbo-tracking/`](https://github.com/Soborbo/Serverside/tree/main/soborbo-tracking).

## Why it moved

The package used to live here and **vendor a copy** of the canonical event
taxonomy (`events.json`) plus a **hand-ported copy** of the per-site generator.
Two machine guards (`check-event-contract.mjs --engine`, and the Serverside-side
F1-4 contract lock) only *guarded* that cross-repo drift — they could not remove
it. Co-locating the client lib with the gateway worker collapses the duplication
entirely: **one repo, one `src/events.json`, one `scripts/generate-site.mjs`**, no
vendoring, no drift class.

## Where things are now (all in Serverside)

- Client lib + components + GTM + backend-dispatch reference → `soborbo-tracking/`
- Install runbook → `soborbo-tracking/INSTALL.md`
- Server binding / onboarding → `soborbo-tracking/server/SETUP-SERVER.md` +
  the `.claude/skills/onboard-site` skill, driving the canonical
  `scripts/generate-site.mjs`
- The single canonical event source → `src/events.json`

## Consumers

The live sites (beautyflow / lomtalan / skinlab) vendor their own copy of the
client lib and were **not** affected by the move; when they next re-vendor, pull
from `Serverside/soborbo-tracking/`, not from here.
