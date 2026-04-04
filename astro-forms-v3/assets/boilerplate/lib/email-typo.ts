/**
 * Email Typo Detection
 * Suggests corrections for common domain typos.
 * Covers both UK and Hungarian email providers.
 */

const EMAIL_TYPOS: Record<string, string> = {
  // Gmail
  'gmail.con': 'gmail.com',
  'gmail.co': 'gmail.com',
  'gmial.com': 'gmail.com',
  'gmal.com': 'gmail.com',
  'gnail.com': 'gmail.com',
  'gamil.com': 'gmail.com',
  'gmaill.com': 'gmail.com',
  // Yahoo
  'yaho.com': 'yahoo.com',
  'yahooo.com': 'yahoo.com',
  'yahoo.co': 'yahoo.com',
  // Hotmail / Outlook
  'hotmal.com': 'hotmail.com',
  'hotmial.com': 'hotmail.com',
  'hotmil.com': 'hotmail.com',
  'outlok.com': 'outlook.com',
  'outloo.com': 'outlook.com',
  'outlool.com': 'outlook.com',
  // UK-specific
  'btinternrt.com': 'btinternet.com',
  'btinteret.com': 'btinternet.com',
  'sky.con': 'sky.com',
  'talktlk.net': 'talktalk.net',
  'taltalk.net': 'talktalk.net',
  'virginmeda.com': 'virginmedia.com',
  'iclod.com': 'icloud.com',
  'icloud.con': 'icloud.com',
  // Hungarian
  'fremail.hu': 'freemail.hu',
  'freemal.hu': 'freemail.hu',
  'citromal.hu': 'citromail.hu',
};

const COMMON_DOMAINS = [
  // International
  'gmail.com',
  'yahoo.com',
  'hotmail.com',
  'outlook.com',
  'icloud.com',
  'live.com',
  // UK
  'btinternet.com',
  'sky.com',
  'talktalk.net',
  'virginmedia.com',
  'aol.com',
  // Hungarian
  'freemail.hu',
  'citromail.hu',
  'vipmail.hu',
  't-online.hu',
];

/**
 * Get email suggestion if a typo is detected.
 * Returns the corrected email, or null if no typo found.
 */
export function getEmailSuggestion(email: string): string | null {
  if (!email || !email.includes('@')) return null;

  const [local, domain] = email.toLowerCase().trim().split('@');
  if (!domain) return null;

  // Check exact typo map first
  if (EMAIL_TYPOS[domain]) {
    return `${local}@${EMAIL_TYPOS[domain]}`;
  }

  // Levenshtein distance for close matches
  for (const correct of COMMON_DOMAINS) {
    if (domain === correct) return null; // Exact match, no suggestion
    const distance = levenshtein(domain, correct);
    if (distance > 0 && distance <= 2) {
      return `${local}@${correct}`;
    }
  }

  return null;
}

/**
 * Levenshtein distance between two strings.
 */
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(
          dp[i - 1][j],
          dp[i][j - 1],
          dp[i - 1][j - 1]
        );
      }
    }
  }

  return dp[m][n];
}
