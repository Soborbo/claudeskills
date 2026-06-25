# Market pack — Hungary (Magyarország)

`--market hu`. Validators in `markets.ts`: `isValidHuAdoszam` (CDV checksum),
`isValidHuCegjegyzekszam`, `findRegistration`, `detectAccreditations`.

## Cégadatok / átláthatóság (kötelező megjeleníteni)
- **Cégjegyzékszám** — `CC-FF-NNNNNN`; CC = bírósági kód 01–20. Megjelenítés az
  Impresszumban/ÁSZF/Kapcsolat oldalon. (`business.registration`)
- **Adószám** — `8számjegy-1-2`; a 8. számjegy CDV ellenőrző. Az auditor valódi
  checksummal validál (pl. `12180439-2-41` érvényes). Egyéni vállalkozó: külön
  nyilvántartás, nincs cégjegyzékszám.
- Hivatalos, **ingyenes** lekérdezés: e-cegjegyzek.hu; hiteles adat:
  occsz.e-cegjegyzek.hu; beszámolók: e-beszamolo.im.gov.hu. ⚠️ Kerüld a fizetős
  utánzatokat (cegtalalo.hu, ceginformacio.hu) — amit árulnak, az hivatalosan ingyenes.

## Bizalmi jelek / pecsétek (detektálja: `business.accreditations`)
- **Árukereső „Megbízható Bolt”** — a kulcs HU e-commerce pecsét (valós vásárlók;
  zöld keret ≥10 értékelés/90 nap & ≥4.2 átlag; zöld háttér ≥60 & ≥4.6). Beépítve
  Shoprenter/Shoptet/Viltor platformokba; „Ország Boltja” verseny.
- **FEOSZ „fogyasztóbarát webáruház”**; **Trustindex** értékelés-widget + „Vélemény
  tanúsítvány”. **Google értékelések / Google Cégem** dominálják a helyi bizalmat.

## Katalógusok / értékelő helyek (citáció + AI third-party jelenlét)
- Helyi citáció: **Cylex**, **Arany Oldalak** (aranyoldalak.hu), **Telefonkönyv**
  (telefonkonyv.hu), cegkat.hu. NAP szó szerint azonos legyen.
- Marketplace / ár-összehasonlító: **Árukereső** (arukereso.hu), argep.hu, **eMAG**,
  vatera.hu, jofogas.hu, hardverapro.hu (IT).
- Közösségi bizalom: **gyakorikerdesek.hu**, hardverapro fórumok.

## Magyar nyelvű AI = first-mover előny
A magyar alulreprezentált az AI tréningadatban; a magyar nyelvű AI-citáció vékonyabb és
kevésbé versengő, mint az angol — a legtöbb helyi versenytárs még nem optimalizál rá.
Magyar Wikipédia + magas tekintélyű kiadók (hvg.hu, portfolio.hu) a valószínű forráskör.
Írj answer-first, tényekkel sűrű magyar tartalmat, és engedd be az AI retrieval botokat.

## Megjegyzés
A .hu ccTLD Magyarországra céloz (standard); dokumentált külön „bizalmi szorzó” nincs.
SMB-nél az entitás-bizalom útja: Organization schema + GBP + cégadatok + azonos NAP a
fenti katalógusokban (a schema oldalt a schema-entity-graph/schema-audit kezeli).
