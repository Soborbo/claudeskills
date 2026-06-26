# Migráció — már bekötött (régi) oldalak

A régi oldalak a legacy `tracking/` (Meta-only `/api/track`) vagy korábbi GA4/GTM
setupon vannak. A böngésző GA4-eseményeik (GTM-en át) MŰKÖDNEK — a változás a
SZERVER-oldal (Meta-only → gateway: mind a 3 platform). Ne tördd szét a meglévő
GA4-történetet.

## Aranyszabály
**Élő GA4-eseményt NE nevezz át** — az újraszegmentálja a historikus adatot.
Inkább add hozzá a gateway-t a hiányzó szerver-oldali részekhez.

## Ajánlott út (alacsony kockázat) — „bolt-on"
A régi oldal GA4-e marad böngésző-oldalon, a gateway CSAK a hiányzókat hozza
(Meta CAPI + Google Ads szerver-oldal):

1. Kliens: cseréld a régi `lib/tracking`-et a `soborbo-tracking/lib`-re + `<Turnstile/>`.
   (A dataLayer/GTM nevek maradhatnak a régiek — a GTM-tag adja a GA4 event-nevet.)
2. Szerver: `server/generate-site.mjs` a site-config-hoz, **de hagyd ki a `ga4`
   blokkot** → a gateway NEM küld GA4 MP-t (nincs GA4-duplázás a meglévő böngésző
   GA4 mellett). A Meta CAPI + Google Ads viszont megy szerver-oldalon.
3. Route + KV + Google Ads OAuth (lásd `server/SETUP-SERVER.md`).
4. Verifikáció: Meta Test Events (dedup), Google Ads Conversions, GA4 változatlan.

Eredmény: a régi oldal megkapja a szerver-oldali Meta + Google Ads előnyét
(adblock/ITP reziliencia, gclid-upload) GA4-duplázás és átnevezés NÉLKÜL.

## Teljes egységesítés (csak ha tudatosan kell)
Ha egységes kanonikus taxonómiát akarsz minden oldalon (cross-site riport):
1. „Deprecate, then add" (EVENTS.md): 30 napig tüzeld a régi ÉS az új GA4 event-nevet.
2. GTM-ben párhuzamosan a tag-ek; a gateway GA4 MP-t bekapcsolhatod a kanonikus névvel.
3. Riportokat átállítod az új névre, majd a régit leállítod.
   Vállalod az újraszegmentálást — ezért csak akkor, ha a cross-site egységesség megéri.

## Mit ne csinálj
- Ne kapcsold be a gateway GA4 MP-t egy olyan oldalon, ahol a böngésző GA4-tag
  már tüzeli ugyanazt az eseményt, hacsak nem akarsz duplázni (GA4 nem dedupol).
- Ne nevezd át a régi élő GA4-eseményeket átmeneti dual-fire nélkül.
