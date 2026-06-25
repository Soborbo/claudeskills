import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { checkRobotsAiAccess, isRootAllowed, parseRobots } from '../../src/eeat/crawlers';

const here = path.dirname(fileURLToPath(import.meta.url));
const fx = (f: string) => readFileSync(path.join(here, '..', 'fixtures', f), 'utf8');

describe('parseRobots + isRootAllowed', () => {
  it('treats an absent group as allowed', () => {
    const g = parseRobots('User-agent: Googlebot\nDisallow: /private/');
    expect(isRootAllowed(g, 'PerplexityBot')).toBe(true);
  });

  it('honours an explicit Disallow: /', () => {
    const g = parseRobots('User-agent: GPTBot\nDisallow: /');
    expect(isRootAllowed(g, 'GPTBot')).toBe(false);
  });

  it('lets an equally-specific Allow beat Disallow', () => {
    const g = parseRobots('User-agent: GPTBot\nDisallow: /\nAllow: /');
    expect(isRootAllowed(g, 'GPTBot')).toBe(true);
  });

  it('prefers an exact agent group over the wildcard group', () => {
    const g = parseRobots('User-agent: *\nDisallow: /\n\nUser-agent: OAI-SearchBot\nAllow: /');
    expect(isRootAllowed(g, 'OAI-SearchBot')).toBe(true);
    expect(isRootAllowed(g, 'SomeOtherBot')).toBe(false);
  });
});

describe('checkRobotsAiAccess', () => {
  it('passes a permissive robots.txt with no fails', () => {
    const results = checkRobotsAiAccess(fx('robots.good.txt'));
    expect(results.some((r) => r.status === 'fail')).toBe(false);
  });

  it('fails on a blocked retrieval bot and warns on a blocked training bot', () => {
    const results = checkRobotsAiAccess(fx('robots.bad.txt'));
    const perplexity = results.find((r) => r.id === 'ai-crawler.retrieval.PerplexityBot');
    const gptbot = results.find((r) => r.id === 'ai-crawler.training.GPTBot');
    expect(perplexity?.status).toBe('fail');
    expect(gptbot?.status).toBe('warn');
  });

  it('returns not_found when robots.txt is absent', () => {
    const results = checkRobotsAiAccess(undefined);
    expect(results).toHaveLength(1);
    expect(results[0].status).toBe('not_found');
  });
});
