# Postcode -> town autofill

A convenience, not a gate: if the lookup fails, the visitor types the town. Never
overwrite a value the visitor typed (the template marks its own fills with
`data-autofilled="true"` and only replaces those). Code:
`src/lib/forms/postcode-lookup.ts`.

UX: debounce input (about 300 ms), fill silently, a brief visual confirmation on
the filled field is enough.

## UK: postcodes.io

- Free, no API key, ONS data. No published SLA or rate limit (see perishable
  facts), so time out fast (3 s) and fail silently.
- The response has no `post_town`. `admin_district` gives administrative names
  such as "Bristol, City of": strip the `, City of` / `, County of` suffix.
- Outward code is enough for a town; a full postcode is not needed.
- If the browser calls it directly, no proxy is needed. If you proxy through the
  Worker (to cache), use `caches.default` and the same timeout.

## Hungary: GeoNames HU list

Decision I6: full list, not the old 383-entry partial map.

**Source:** GeoNames postal dump `https://download.geonames.org/export/zip/HU.zip`,
licensed **CC-BY 4.0**. Attribution is required: put "Postal data: GeoNames
(geonames.org), CC-BY 4.0" in the site's privacy/credits page or near the form,
and keep a `NOTICE` next to the data file.

**What the data looks like** (counted 2026-10-05): 3046 postcodes, 3571 settlement
rows; **335 postcodes belong to more than one settlement** (villages sharing a
post office). A single-value map silently picks the wrong village for those.

**Build pattern** (reference: `Soborbo/soborbo-webshop`,
`packages/engine/scripts/seed-postal.mjs`, read with
`gh api repos/Soborbo/soborbo-webshop/contents/packages/engine/scripts/seed-postal.mjs`):

1. Download and unzip `HU.zip`; read `HU.txt` (TSV: column 1 postcode, column 2
   place name).
2. Normalise the code (digits only) and the place (strip a trailing number, as
   `cleanPlace` does). GeoNames gives plain "Budapest" for every `1xxx` code; if
   the site wants the district, derive it from digits 2-3 (`1134` -> XIII.).
3. Unlike the webshop script, which keeps only the first place per code, keep
   **all** places: `{ "2049": ["Diósd"], "7473": ["Kaposgyarmat", "Gálosfa", "Hajmás"] }`.
4. Write a static JSON (about 70 KB raw, about 25 KB gzipped) or seed a D1 table if
   the site already has one. Commit the generator script, not just the output, so
   the list can be refreshed.

**Loading:** never bundle it into the page JS. Either fetch `/postcodes.json` on
first focus of the postcode field (browser caches it), or serve a small
`/api/postcode?code=` endpoint that returns the array for one code.

**UI for shared codes:** one place -> fill the town field. Several places -> show
a small select (or datalist) with those settlements and let the visitor pick; do
not guess. Unknown code -> leave the field for typing.

The template's current `public/postcodes.json` is a 3047-entry single-value map;
the shared-code selector is not built yet (see perishable facts, template
divergences).
