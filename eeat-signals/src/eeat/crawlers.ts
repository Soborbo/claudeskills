/**
 * robots.txt AI-crawler access check.
 *
 * Two classes of bot matter differently for AI *visibility*:
 *  - RETRIEVAL bots fetch pages to answer a live user query / ground an AI
 *    answer. Blocking them removes you from that engine's answers → `fail`.
 *  - TRAINING bots / control tokens govern whether content may be used to
 *    train (or, for Google-Extended, ground) a model. Blocking them is a
 *    legitimate policy choice the site owner makes → `warn`, never `fail`.
 *
 * Google-Extended is NOT a search or retrieval crawler: it has no user agent of
 * its own, it is a robots.txt control token for Gemini training + grounding,
 * and Google states it does not affect inclusion or ranking in Google Search.
 * AI Overviews are governed by Googlebot + snippet controls instead. See
 * references/perishable-facts.md.
 *
 * Classic Googlebot (which also powers Google AI Overviews) is intentionally
 * out of scope here — normal crawl/index rules belong to schema-audit /
 * soborbo-astro-cloudflare, not to this kit.
 */
import type { CheckResult } from './types';

export const RETRIEVAL_BOTS = [
  'OAI-SearchBot',
  'ChatGPT-User',
  'PerplexityBot',
  'Perplexity-User',
  'Claude-SearchBot',
  'Claude-User',
] as const;

export const TRAINING_BOTS = ['GPTBot', 'ClaudeBot', 'CCBot', 'Applebot-Extended', 'Google-Extended'] as const;

/** Bot-specific notes appended to a training-bot `warn`. */
const TRAINING_NOTES: Partial<Record<(typeof TRAINING_BOTS)[number], string>> = {
  'Google-Extended':
    ' Google-Extended is a control token for Gemini training and grounding (Gemini Apps, Vertex AI); it does not affect Google Search inclusion, ranking or AI Overviews. Owner decision.',
};

interface Group {
  agents: string[];
  rules: { type: 'allow' | 'disallow'; path: string }[];
}

export function parseRobots(txt: string): Group[] {
  const groups: Group[] = [];
  let current: Group | null = null;
  let lastWasAgent = false;
  for (const lineRaw of txt.split(/\r?\n/)) {
    const line = lineRaw.replace(/#.*$/, '').trim();
    if (!line) continue;
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const field = line.slice(0, idx).trim().toLowerCase();
    const value = line.slice(idx + 1).trim();
    if (field === 'user-agent') {
      if (!current || !lastWasAgent) {
        current = { agents: [], rules: [] };
        groups.push(current);
      }
      current.agents.push(value.toLowerCase());
      lastWasAgent = true;
    } else if (field === 'allow' || field === 'disallow') {
      if (!current) {
        current = { agents: ['*'], rules: [] };
        groups.push(current);
      }
      current.rules.push({ type: field, path: value });
      lastWasAgent = false;
    } else {
      lastWasAgent = false;
    }
  }
  return groups;
}

/** Group that applies to `bot`: an exact agent match wins over the `*` group. */
function groupFor(groups: Group[], bot: string): Group | null {
  const b = bot.toLowerCase();
  const exact = groups.find((g) => g.agents.includes(b));
  if (exact) return exact;
  return groups.find((g) => g.agents.includes('*')) ?? null;
}

/** Is the site root `/` crawlable for this bot? */
export function isRootAllowed(groups: Group[], bot: string): boolean {
  const g = groupFor(groups, bot);
  if (!g) return true; // no rule = allowed
  const blocksRoot = g.rules.some((r) => r.type === 'disallow' && r.path === '/');
  const allowsRoot = g.rules.some((r) => r.type === 'allow' && r.path === '/');
  // Google tie-break: an equally-specific Allow beats Disallow.
  return blocksRoot ? allowsRoot : true;
}

export function checkRobotsAiAccess(robotsTxt: string | undefined): CheckResult[] {
  if (robotsTxt === undefined)
    return [
      {
        id: 'ai-crawler.robots',
        signal: 'robots.txt AI-crawler access',
        status: 'not_found',
        observed_differences: 'No robots.txt supplied to the audit — pass it with --robots to evaluate AI-bot access.',
      },
    ];
  const groups = parseRobots(robotsTxt);
  const out: CheckResult[] = [];
  for (const bot of RETRIEVAL_BOTS) {
    const ok = isRootAllowed(groups, bot);
    out.push({
      id: `ai-crawler.retrieval.${bot}`,
      signal: `Retrieval bot allowed: ${bot}`,
      status: ok ? 'pass' : 'fail',
      ...(ok ? {} : { observed_differences: `${bot} is Disallowed from /. This removes the site from that engine's live AI answers.` }),
    });
  }
  for (const bot of TRAINING_BOTS) {
    const ok = isRootAllowed(groups, bot);
    out.push({
      id: `ai-crawler.training.${bot}`,
      signal: `Training bot allowed: ${bot}`,
      status: ok ? 'pass' : 'warn',
      ...(ok ? {} : {
            observed_differences: `${bot} is Disallowed from / (training opt-out). Legitimate policy choice; reduces long-term brand familiarity in that model.${TRAINING_NOTES[bot] ?? ''}`,
          }),
    });
  }
  return out;
}
