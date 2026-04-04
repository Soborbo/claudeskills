/**
 * Email Typo Detection
 * Uses Levenshtein distance to suggest corrections
 */

const EMAIL_TYPOS: Record<string, string> = {
  'gmail.con': 'gmail.com',
  'gmail.co': 'gmail.com',
  'gmial.com': 'gmail.com',
  'gmal.com': 'gmail.com',
  'gnail.com': 'gmail.com',
  'gamil.com': 'gmail.com',
  'yaho.com': 'yahoo.com',
  'yahooo.com': 'yahoo.com',
  'hotmal.com': 'hotmail.com',
  'hotmial.com': 'hotmail.com',
  'outlok.com': 'outlook.com',
  'outloo.com': 'outlook.com',
  'fremail.hu': 'freemail.hu',
  'freemal.hu': 'freemail.hu',
  'citromal.hu': 'citromail.hu',
};

const COMMON_DOMAINS = [
  'gmail.com',
  'yahoo.com',
  'hotmail.com',
  'outlook.com',
  'freemail.hu',
  'citromail.hu',
  'vipmail.hu',
  't-online.hu',
];

/**
 * Get email suggestion if typo detected
 */
export function getSuggestion(email: string): string | null {
  if (!email || !email.includes('@')) return null;
  
  const [local, domain] = email.toLowerCase().trim().split('@');
  if (!domain) return null;
  
  // Check exact typo map first
  if (EMAIL_TYPOS[domain]) {
    return `${local}@${EMAIL_TYPOS[domain]}`;
  }
  
  // Levenshtein distance for close matches
  for (const correct of COMMON_DOMAINS) {
    const distance = levenshtein(domain, correct);
    if (distance > 0 && distance <= 2) {
      return `${local}@${correct}`;
    }
  }
  
  return null;
}

/**
 * Levenshtein distance algorithm
 */
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  
  // Create distance matrix
  const dp: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0));
  
  // Initialize first column
  for (let i = 0; i <= m; i++) {
    dp[i][0] = i;
  }
  
  // Initialize first row
  for (let j = 0; j <= n; j++) {
    dp[0][j] = j;
  }
  
  // Fill in the rest
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(
          dp[i - 1][j],     // deletion
          dp[i][j - 1],     // insertion
          dp[i - 1][j - 1]  // substitution
        );
      }
    }
  }
  
  return dp[m][n];
}
