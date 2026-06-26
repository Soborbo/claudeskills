import { describe, it, expect } from 'vitest';
import { trackingConfig } from '../lib/config';
import { normalizePhone } from '../lib/persistence';

// A vitest.config.ts a HU piacot állítja be (PUBLIC_TRACKING_*) — ez bizonyítja,
// hogy a skill nem GBP-hardkódolt, hanem market-konfigurálható.
describe('market config (HU default a tesztekben)', () => {
  it('a trackingConfig a PUBLIC_TRACKING_* env-ből jön', () => {
    expect(trackingConfig.country).toBe('HU');
    expect(trackingConfig.currency).toBe('HUF');
    expect(trackingConfig.locale).toBe('hu');
  });

  it('ambiguous telefon a config-országot (HU) használja', () => {
    expect(normalizePhone('20 123 4567')).toBe('+36201234567');
  });

  it('UK szám attól még explicit GB-vel helyes', () => {
    expect(normalizePhone('7123 456789', 'GB')).toBe('+447123456789');
  });
});
