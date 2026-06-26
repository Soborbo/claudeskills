# Kanonikus esemény-térkép (source of truth a nevekhez)

Ez a fájl a **mérvadó** az esemény-nevekre ebben a skillben. (Az `EVENTS.md` a
funnel-adaptációs útmutató; névütközés esetén EZ a fájl nyer.)

## A két csatorna és a GA4-duplázás (FONTOS)

- A **Meta** dedupol `event_id` alapon (böngésző Pixel ↔ szerver CAPI) → nyugodtan
  mehet mindkét csatornán.
- A **GA4 NEM dedupol**. Ha a böngésző GTM GA4-tag ÉS a gateway GA4 MP is tüzel
  ugyanarra az eseményre → **duplán számol**. Ezért GA4-re **egy csatornát** válassz:
  - **Default (ajánlott): GA4 = böngésző (GTM)**, a gateway GA4 MP **kihagyva**.
    Hogyan: a site KV-configból **hagyd ki a `ga4` blokkot** → a gateway nem küld
    GA4 MP-t. Így a Meta CAPI + Google Ads megy szerver-oldalon, a GA4 marad böngésző.
  - **Vagy: GA4 = szerver MP backstop** (adblock/JS-tiltott usereknek), és akkor a
    böngésző GA4-tagot kell óvatosan kezelni. Csak akkor, ha tudatosan vállalod az
    átfedést. A legtöbb lead-gen oldalnak a default a jó.

## Kanonikus konverziós táblázat

| Konverzió | Böngésző dataLayer (events.ts) | **GA4 event-név** (GTM-tag emittálja) | Gateway `event_name` | Meta | Google Ads (conversion_actions kulcs) | GA4 Key Event? |
|---|---|---|---|---|---|:--:|
| Ajánlat/lead űrlap | `lead_submit` | `contact_form_submit` | `contact_form_submit` | Contact | `contact_form_submit` | ✅ |
| Kapcsolat űrlap | `contact_submit` | `contact_form_submit` | `contact_form_submit` | Contact | `contact_form_submit` | ✅ |
| Visszahívás | `callback_click` | `callback_conversion` | `callback_conversion` | Lead | `callback_conversion` | ✅ |
| Telefon klikk | `phone_click` | `phone_conversion` | `phone_conversion` | Contact | `phone_conversion` | ✅ |
| Email klikk | `email_click` | `email_conversion` | `email_conversion` | Contact | — | ✅ |
| WhatsApp klikk | `whatsapp_click` | `whatsapp_conversion` | `whatsapp_conversion` | Contact | — | ✅ |
| Kalkulátor kész (ajánlat) | `calculator_complete` | `quote_calculator_conversion` | `quote_calculator_conversion` | Lead | `quote_calculator_conversion` | ✅ |
| Kalkulátor első nézet | — | `quote_calculator_first_view` | `quote_calculator_first_view` | ViewContent | — | ❌ |

**A „GA4 event-név" oszlop a kulcs:** a GTM-ben a böngésző-tag EZT a nevet emittálja
(pl. a `lead_submit` dataLayer-eseményre tüzelő GA4-tag GA4 event-neve
`contact_form_submit`). Ha a gateway GA4 MP-t is használod, az UGYANEZT a nevet
küldi — így egységes a riport (de lásd a duplázás-figyelmeztetést fent).

## Engagement (NEM konverzió, NEM megy a gateway-re, NEM Key Event)

| dataLayer event | Cél | GA4 |
|---|---|---|
| `calculator_start` / `calculator_step` / `calculator_option` | funnel | regular event |
| `form_abandon` | űrlap-elhagyás | regular event |
| `scroll_depth` (25/50/75/100) | scroll | regular event |

## GA4-admin teendők (egyszer property-nként)

1. **Key Events (Admin → Events → Mark as key event):**
   `contact_form_submit`, `callback_conversion`, `phone_conversion`,
   `email_conversion`, `whatsapp_conversion`, `quote_calculator_conversion`.
2. **Custom dimensions (Admin → Custom definitions → event-scoped):**
   `event_id`, `session_id`, `source`, `service`, `device`,
   `calculator_name`, `step_id`. (A kampány-paraméterek — source/medium/campaign —
   natívan mennek a `campaign_details` eventtel, nem kell custom dimension.)
3. **Mérés-ellenőrzés:** GA4 DebugView + Meta Test Events + GTM Preview.

## Új konverzió felvétele
1. `events.ts`-ben push a böngésző dataLayer-eseményre (PII nélkül).
2. GTM: Custom Event trigger + GA4-tag (a kanonikus GA4 event-névvel) + opcionálisan
   Meta Pixel tag (`eventID` = DLV event_id) + Google Ads tag.
3. Gateway: `ALLOWED_EVENT_NAMES` + `EVENT_NAME_MAP` (Meta) bővítése a Serverside repóban,
   és a site KV `conversion_actions`-ban a Google Ads akció-ID.
4. GA4: Key Event jelölés + custom dimension regisztráció szükség szerint.
