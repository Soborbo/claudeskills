// ============================================
// 🔧 CUSTOMIZE: Different social proof per step/button
// ============================================

export interface SocialProofItem {
  type: 'review' | 'stat' | 'badge' | 'quote';
  text: string;
  subtext?: string;
  icon?: string;
  rating?: number; // 1-5 for reviews
}

// Map step IDs to their social proof
export const SOCIAL_PROOF: Record<string, SocialProofItem> = {
  // Example - replace with real data per step
  'service-type': {
    type: 'stat',
    text: '2,847',
    subtext: 'elégedett ügyfél',
    icon: '👥',
  },
  'property-size': {
    type: 'review',
    text: '"Gyors és megbízható!"',
    subtext: '– Kiss Péter, Budapest',
    rating: 5,
  },
  'extras': {
    type: 'stat',
    text: '15 év',
    subtext: 'tapasztalat',
    icon: '🏆',
  },
  'contact': {
    type: 'badge',
    text: '4.9/5 Google értékelés',
    subtext: '847 vélemény alapján',
    icon: '⭐',
  },
};

export function getSocialProofForStep(stepId: string): SocialProofItem | undefined {
  return SOCIAL_PROOF[stepId];
}
