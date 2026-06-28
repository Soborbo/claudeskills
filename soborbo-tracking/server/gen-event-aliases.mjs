#!/usr/bin/env node
/**
 * gen-event-aliases.mjs — generates `event-aliases.json` + `docs/EVENT-MIGRATION.md`
 * from the vendored `events.json` (§5.10).
 *
 * Purpose: existing live sites emit the LEGACY event names (GA4 + dataLayer). A
 * reporting tool reads `event-aliases.json` to UNION the legacy + canonical names
 * into ONE canonical metric, and uses the per-site `cutover_date` to mark where the
 * legacy names stop and the canonical names take over.
 *
 * Run: node server/gen-event-aliases.mjs   (npm run gen:aliases)
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const EVENTS = JSON.parse(
  readFileSync(fileURLToPath(new URL('../events.json', import.meta.url)), 'utf8')
);

// legacy (GA4 + dataLayer) name -> canonical name.
const aliases = {};
for (const e of EVENTS) {
  if (e.legacy_ga4) aliases[e.legacy_ga4] = e.name;
  if (e.legacy_datalayer) aliases[e.legacy_datalayer] = e.name;
}

const aliasOut = {
  _comment:
    'GENERATED from events.json by server/gen-event-aliases.mjs — do not hand-edit. ' +
    'Legacy GA4 + dataLayer names -> canonical. A reporting tool unions old+new into ONE ' +
    'canonical metric; set cutover_date PER SITE (ISO date the site switched its client to ' +
    'canonical) to mark where the legacy names stop.',
  generated_from: 'events.json',
  cutover_date: null,
  aliases,
  canonical: EVENTS.map((e) => e.name)
};
writeFileSync(
  fileURLToPath(new URL('../event-aliases.json', import.meta.url)),
  JSON.stringify(aliasOut, null, 2) + '\n'
);

const rows = EVENTS.filter((e) => e.legacy_ga4 || e.legacy_datalayer).map(
  (e) => `| \`${e.legacy_ga4 ?? '—'}\` | \`${e.legacy_datalayer ?? '—'}\` | \`${e.name}\` | ${e.meta ?? '—'} | ${e.kind} |`
);
const md = `# Event migration — legacy → canonical

GENERATED from \`events.json\` by \`server/gen-event-aliases.mjs\` (alongside
\`event-aliases.json\`). For an existing live site, a reporting tool unions the
**legacy** and **canonical** names into one metric, and uses the per-site
\`cutover_date\` (in \`event-aliases.json\`) to mark where the old names stop.

## Migration plan per live site
1. Note the site's current (legacy) event names from its live GTM / GA4.
2. Deploy the updated \`gtm/container.json\` + \`lib/\` so the client emits canonical names.
3. Set \`cutover_date\` to that deploy date; in reporting, union legacy+canonical via the
   \`aliases\` map below (before the date the legacy names carry the data, after it the
   canonical names do).

## Alias table

| Legacy GA4 name | Legacy dataLayer name | Canonical name | Meta | Kind |
|---|---|---|---|---|
${rows.join('\n')}

> The gateway also accepts the legacy GA4 names and normalizes them to canonical at
> ingress (Serverside), so a not-yet-migrated client keeps working during the parallel run.
`;
writeFileSync(fileURLToPath(new URL('../docs/EVENT-MIGRATION.md', import.meta.url)), md);

console.log(
  `Wrote event-aliases.json (${Object.keys(aliases).length} aliases) + docs/EVENT-MIGRATION.md`
);
