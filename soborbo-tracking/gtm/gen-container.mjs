// Generates a valid, importable GTM container export for soborbo-tracking.
// Implements docs/gtm-setup.md + docs/CANONICAL-EVENTS.md (browser side).
import { writeFileSync } from 'node:fs';

const ACC = '0';
const CNT = '0';

// ── id counters ──────────────────────────────────────────────────────
let tId = 0, gId = 0, vId = 0;
const nextTag = () => String(++tId);
const nextTrig = () => String(++gId);
const nextVar = () => String(++vId);

// Reserved built-in trigger ids
const ALL_PAGES = '2147479553';
const CONSENT_INIT = '2147479572';

const tags = [], triggers = [], variables = [];

// ── helpers ──────────────────────────────────────────────────────────
const tmpl = (key, value) => ({ type: 'TEMPLATE', key, value });
const bool = (key, value) => ({ type: 'BOOLEAN', key, value });
const tagRef = (key, value) => ({ type: 'TAG_REFERENCE', key, value });
const consent = (...types) => ({
  consentStatus: 'NEEDED',
  consentType: { type: 'LIST', list: types.map((t) => ({ type: 'TEMPLATE', value: t })) },
});

function dlv(name, dataLayerName) {
  const variableId = nextVar();
  variables.push({
    accountId: ACC, containerId: CNT, variableId,
    name: `DLV - ${name}`, type: 'v',
    parameter: [
      { type: 'INTEGER', key: 'dataLayerVersion', value: '2' },
      bool('setDefaultValue', false),
      tmpl('name', dataLayerName),
    ],
    fingerprint: '0',
  });
  return `{{DLV - ${name}}}`;
}

function constVar(name, value) {
  const variableId = nextVar();
  variables.push({
    accountId: ACC, containerId: CNT, variableId,
    name: `Const - ${name}`, type: 'c',
    parameter: [tmpl('value', value)],
    fingerprint: '0',
  });
  return `{{Const - ${name}}}`;
}

function customEventTrigger(eventName) {
  const triggerId = nextTrig();
  triggers.push({
    accountId: ACC, containerId: CNT, triggerId,
    name: `CE - ${eventName}`, type: 'CUSTOM_EVENT',
    customEventFilter: [{
      type: 'EQUALS',
      parameter: [tmpl('arg0', '{{_event}}'), tmpl('arg1', eventName)],
    }],
    fingerprint: '0',
  });
  return triggerId;
}

function tag(name, type, parameter, firingTriggerId, extra = {}) {
  const t = {
    accountId: ACC, containerId: CNT, tagId: nextTag(),
    name, type, parameter,
    fingerprint: '0', firingTriggerId,
    tagFiringOption: 'ONCE_PER_EVENT',
    ...extra,
  };
  tags.push(t);
  return t;
}

// ── Constants (placeholders to replace on import) ────────────────────
const GA4_ID = constVar('GA4 Measurement ID', 'G-XXXXXXXXXX');
const PIXEL_ID = constVar('Meta Pixel ID', 'META_PIXEL_ID');
const ADS_ID = constVar('Google Ads Conversion ID', 'AW-XXXXXXXXX');
const ADS_LABEL = constVar('Google Ads Conversion Label', 'CONVERSION_LABEL');

// ── Data Layer Variables (PII-free) ──────────────────────────────────
const V_EVENT_ID = dlv('event_id', 'event_id');
const V_VALUE = dlv('value', 'value');
const V_CURRENCY = dlv('currency', 'currency');
const V_SESSION = dlv('session_id', 'session_id');
const V_DEVICE = dlv('device', 'device');
const V_CALC = dlv('calculator_name', 'calculator_name');
const V_STEP_ID = dlv('step_id', 'step_id');
const V_STEP_IDX = dlv('step_index', 'step_index');
const V_FORM_ID = dlv('form_id', 'form_id');
const V_LAST_FIELD = dlv('last_field', 'last_field');
const V_SCROLL = dlv('scroll_percentage', 'scroll_percentage');
const V_SOURCE = dlv('source', 'source');
const V_SERVICE = dlv('service', 'service');

// ── Custom JS variable: User-Provided Data side-channel (Task 2) ─────
const V_UPD = (() => {
  const variableId = nextVar();
  variables.push({
    accountId: ACC, containerId: CNT, variableId,
    name: 'CJS - User Provided Data', type: 'jsm',
    parameter: [tmpl('javascript',
      'function(){\n' +
      '  // PII is written by setUserDataForEC() to a hidden side-channel,\n' +
      '  // NOT the dataLayer (GDPR). Keys: email, phone_number, first_name, last_name.\n' +
      '  try { return window.__sbUserData || {}; } catch (e) { return {}; }\n' +
      '}')],
    fingerprint: '0',
  });
  return '{{CJS - User Provided Data}}';
})();

// ── Triggers (Custom Event) ──────────────────────────────────────────
// Canonical dataLayer event names (events.json). The lead/quote form AND the
// calculator completion share quote_calculator_submitted (§2.1) → ONE trigger.
const T_QUOTE = customEventTrigger('quote_calculator_submitted');
const T_CONTACT = customEventTrigger('contact_form_submitted');
const T_CALLBACK = customEventTrigger('callback_request_submitted');
const T_PHONE = customEventTrigger('phone_number_clicked');
const T_EMAIL = customEventTrigger('email_address_clicked');
const T_WHATSAPP = customEventTrigger('whatsapp_button_clicked');
const T_CALC_OPEN = customEventTrigger('quote_calculator_opened');
const T_CALC_STEP = customEventTrigger('quote_calculator_step_completed');
const T_CALC_OPT = customEventTrigger('quote_calculator_option_selected');
const T_ABANDON = customEventTrigger('form_abandoned');
const T_SCROLL = customEventTrigger('scroll_depth');

// ── Base tags ────────────────────────────────────────────────────────
// NOTE: the Consent Mode v2 DEFAULT (denied) is intentionally NOT shipped as a GTM
// tag. It is declared inline in <Tracking/> (Tracking.astro), which runs BEFORE
// gtm.js loads — the only correct place for the default (a GTM tag on Consent
// Initialization fires after gtm.js, too late, and duplicating it risks silent
// divergence). Tracking.astro is the single source of truth for the consent default.

tag('Conversion Linker', 'gclidw', [
  bool('enableCrossDomain', false),
], [ALL_PAGES]);

// Google tag (googtag) — first-party GA4 measurement (Google Tag Gateway).
// Replaces the legacy GA4 Configuration tag (gaawc) per §5.6.
tag('Google Tag', 'googtag', [
  tmpl('tagId', GA4_ID),
], [ALL_PAGES], { consentSettings: consent('analytics_storage') });

// ── GA4 event tag factory ────────────────────────────────────────────
function ga4Event(name, ga4EventName, firing, params) {
  tag(name, 'gaawe', [
    tmpl('measurementId', GA4_ID),
    tmpl('eventName', ga4EventName),
    { type: 'LIST', key: 'eventParameters', list: params.map(([k, v]) => ({
      type: 'MAP', map: [tmpl('name', k), tmpl('value', v)],
    })) },
  ], firing, { consentSettings: consent('analytics_storage') });
}

// Conversions — canonical GA4 event names (= dataLayer names, = gateway names)
ga4Event('GA4 - quote_calculator_submitted', 'quote_calculator_submitted', [T_QUOTE], [
  ['value', V_VALUE], ['currency', V_CURRENCY], ['event_id', V_EVENT_ID], ['calculator_name', V_CALC],
  ['session_id', V_SESSION], ['device', V_DEVICE], ['source', V_SOURCE], ['service', V_SERVICE],
]);
ga4Event('GA4 - contact_form_submitted', 'contact_form_submitted', [T_CONTACT], [
  ['value', V_VALUE], ['currency', V_CURRENCY], ['event_id', V_EVENT_ID],
  ['session_id', V_SESSION], ['device', V_DEVICE], ['source', V_SOURCE], ['service', V_SERVICE],
]);
ga4Event('GA4 - callback_request_submitted', 'callback_request_submitted', [T_CALLBACK], [
  ['event_id', V_EVENT_ID], ['session_id', V_SESSION], ['device', V_DEVICE],
]);
ga4Event('GA4 - phone_number_clicked', 'phone_number_clicked', [T_PHONE], [
  ['event_id', V_EVENT_ID], ['session_id', V_SESSION], ['device', V_DEVICE],
]);
ga4Event('GA4 - email_address_clicked', 'email_address_clicked', [T_EMAIL], [
  ['event_id', V_EVENT_ID], ['session_id', V_SESSION],
]);
ga4Event('GA4 - whatsapp_button_clicked', 'whatsapp_button_clicked', [T_WHATSAPP], [
  ['event_id', V_EVENT_ID], ['session_id', V_SESSION],
]);
// Engagement (regular events, not Key Events)
ga4Event('GA4 - quote_calculator_opened', 'quote_calculator_opened', [T_CALC_OPEN], [
  ['calculator_name', V_CALC], ['session_id', V_SESSION],
]);
ga4Event('GA4 - quote_calculator_step_completed', 'quote_calculator_step_completed', [T_CALC_STEP], [
  ['step_id', V_STEP_ID], ['step_index', V_STEP_IDX], ['session_id', V_SESSION],
]);
ga4Event('GA4 - quote_calculator_option_selected', 'quote_calculator_option_selected', [T_CALC_OPT], [
  ['step_id', V_STEP_ID], ['session_id', V_SESSION],
]);
ga4Event('GA4 - form_abandoned', 'form_abandoned', [T_ABANDON], [
  ['form_id', V_FORM_ID], ['last_field', V_LAST_FIELD], ['session_id', V_SESSION],
]);
ga4Event('GA4 - scroll_depth', 'scroll_depth', [T_SCROLL], [
  ['scroll_percentage', V_SCROLL], ['session_id', V_SESSION],
]);

// ── Meta Pixel ───────────────────────────────────────────────────────
tag('Meta Pixel - Base', 'html', [
  tmpl('html',
    '<script>\n' +
    "  !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?\n" +
    "  n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;\n" +
    "  n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;\n" +
    "  t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,\n" +
    "  document,'script','https://connect.facebook.net/en_US/fbevents.js');\n" +
    "  fbq('init','" + PIXEL_ID + "');\n" +
    "  fbq('track','PageView');\n" +
    '</script>'),
  bool('supportDocumentWrite', false),
], [ALL_PAGES], { consentSettings: consent('ad_storage', 'ad_user_data') });

tag('Meta Pixel - Lead', 'html', [
  tmpl('html',
    '<script>\n' +
    '  var v = ' + V_VALUE + ';\n' +
    "  var cd = (typeof v === 'number' && v > 0) ? { value: v, currency: '" + V_CURRENCY + "' } : {};\n" +
    "  fbq('track','Lead', cd, { eventID: '" + V_EVENT_ID + "' });\n" +
    '</script>'),
  bool('supportDocumentWrite', false),
], [T_QUOTE, T_CALLBACK], { consentSettings: consent('ad_storage', 'ad_user_data') });

tag('Meta Pixel - Contact', 'html', [
  tmpl('html',
    '<script>\n' +
    "  fbq('track','Contact', {}, { eventID: '" + V_EVENT_ID + "' });\n" +
    '</script>'),
  bool('supportDocumentWrite', false),
], [T_CONTACT, T_PHONE, T_EMAIL, T_WHATSAPP], { consentSettings: consent('ad_storage', 'ad_user_data') });

// ── Google Ads Conversion (with Enhanced Conversions side-channel) ───
tag('Google Ads - Conversion', 'awct', [
  tmpl('conversionId', ADS_ID),
  tmpl('conversionLabel', ADS_LABEL),
  tmpl('orderId', V_EVENT_ID),
  tmpl('conversionValue', V_VALUE),
  tmpl('currencyCode', V_CURRENCY),
  bool('enableConversionLinker', true),
  bool('rdp', false),
  bool('enableUserProvidedData', true),
  tmpl('userProvidedData', V_UPD),
], [T_QUOTE, T_CALLBACK, T_PHONE], {
  consentSettings: consent('ad_storage', 'ad_user_data'),
});

// ── Assemble export ──────────────────────────────────────────────────
const container = {
  exportFormatVersion: 2,
  exportTime: '2026-01-01 00:00:00',
  containerVersion: {
    path: `accounts/${ACC}/containers/${CNT}/versions/0`,
    accountId: ACC,
    containerId: CNT,
    containerVersionId: '0',
    name: 'Soborbo Tracking — canonical (v5)',
    container: {
      path: `accounts/${ACC}/containers/${CNT}`,
      accountId: ACC,
      containerId: CNT,
      name: 'Soborbo Tracking',
      publicId: 'GTM-XXXXXXX',
      usageContext: ['WEB'],
      fingerprint: '0',
      tagManagerUrl: 'https://tagmanager.google.com/',
    },
    tag: tags,
    trigger: triggers,
    variable: variables,
    builtInVariable: [
      { accountId: ACC, containerId: CNT, type: 'EVENT', name: 'Event' },
      { accountId: ACC, containerId: CNT, type: 'PAGE_URL', name: 'Page URL' },
    ],
    fingerprint: '0',
  },
};

const out = process.argv[2];
writeFileSync(out, JSON.stringify(container, null, 2) + '\n');
console.log(`Wrote ${out}: ${tags.length} tags, ${triggers.length} triggers, ${variables.length} variables`);
// Validate it round-trips
JSON.parse(JSON.stringify(container));
console.log('JSON valid ✓');
