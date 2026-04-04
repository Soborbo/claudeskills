/**
 * FAQ Schema Generator
 *
 * Generates schema.org FAQPage JSON-LD for rich snippets in search results.
 *
 * @example
 * const schema = faqSchema([
 *   {
 *     question: 'Mennyibe kerül a költöztetés?',
 *     answer: 'Az ár függ a távolságtól és a mennyiségtől. Kérjen ingyenes árajánlatot!'
 *   },
 *   {
 *     question: 'Mikor tudnak jönni?',
 *     answer: 'Általában 1-2 héten belül tudunk időpontot egyeztetni.'
 *   }
 * ]);
 */

export interface FAQItem {
  /** The question being answered */
  question: string;

  /** The answer to the question (can include HTML) */
  answer: string;
}

export interface FAQSchema {
  '@context': 'https://schema.org';
  '@type': 'FAQPage';
  mainEntity: Array<{
    '@type': 'Question';
    name: string;
    acceptedAnswer: {
      '@type': 'Answer';
      text: string;
    };
  }>;
}

/**
 * Generate FAQPage schema from array of Q&A items
 */
export function faqSchema(items: FAQItem[]): FAQSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}

/**
 * Generate a single Question schema (for embedding in other schemas)
 */
export function questionSchema(item: FAQItem) {
  return {
    '@type': 'Question',
    name: item.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: item.answer,
    },
  };
}

export default faqSchema;
