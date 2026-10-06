# Market pack — Hungary (Magyarország)

`--market hu`. Validators in `markets.ts`: `isValidHuAdoszam` (CDV checksum),
`isValidHuCegjegyzekszam`, `isValidHuPostcode` / `hasHuPostalAddress`, `findRegistration`,
`detectAccreditations`. Impresszum check in `checks.ts`: `checkHuImpresszum`.

## Impresszum — Ekertv. 4. § (jogi kötelezettség, nem csak bizalmi jel)

A 2001. évi CVIII. törvény (Ekertv.) 4. §-a szerint a szolgáltatónak „elektronikus úton
közvetlenül és folyamatosan, könnyen hozzáférhető módon" közzé kell tennie legalább:

| Pont | Adat | Auditor |
|---|---|---|
| a) | a szolgáltató neve | kézi ellenőrzés |
| b) | székhely, telephely (ennek hiányában lakcím) | `irányítószám + település` vagy `<address>` |
| c) | elérhetőség, különösen a rendszeresen használt e-mail-cím | `mailto:` vagy e-mail-minta |
| d) | nyilvántartó bíróság/hatóság neve + nyilvántartási szám (cégjegyzékszám, EV-nyilvántartási szám) | érvényes cégjegyzékszám vagy „nyilvántartási szám: …”, és bíróság/hatóság megnevezése |
| e) | engedélyköteles tevékenységnél: engedélyező hatóság, elérhetősége, engedélyszám | kézi ellenőrzés |
| f) | adószám, ha áfaalany | CDV-helyes adószám |
| g) | szabályozott szakmánál: kamara, szakképesítés, szakmai szabályok elérése | kézi ellenőrzés |
| h) | a tárhelyszolgáltató székhelye, elérhetősége (e-mail) | „tárhely” szó a lapon |

- Az auditor az impresszum-oldalon (`/impresszum/`, `/cegadatok/`, `/jogi-nyilatkozat/`,
  vagy „Impresszum” H1) **fail**-t ad, ha a gépileg ellenőrizhető mezők bármelyike hiányzik
  (`business.impresszum-fields`). Minden más oldalon azt nézi, van-e impresszum-link
  (vagy inline minden adat); ha nincs: **warn** (`business.impresszum`).
- Az a), e), g) pontot gép nem tudja megítélni: a név egyezzen a cégnyilvántartással,
  az engedély- és kamarai adat csak ott kell, ahol a tevékenység megköveteli.
- Cloudflare-en futó site-nál a tárhelyszolgáltató a Cloudflare, Inc.; a pontos címet és
  elérhetőséget a Cloudflare saját oldaláról kell venni, nem emlékezetből.
- A jogszabály szövege és a hatályos változat dátuma: [perishable-facts.md](./perishable-facts.md).

## Cégadatok / átláthatóság (kötelező megjeleníteni)
- **Cégjegyzékszám** — `CC-FF-NNNNNN`; CC = bírósági kód 01–20. Megjelenítés az
  Impresszumban/ÁSZF/Kapcsolat oldalon. (`business.registration`)
- **Cím** — az auditor csak `irányítószám + településnév` mintát fogad el (Budapest
  1011–1239, vidék 2000–9999), puszta négyjegyű számot (évszám, ár) nem. (`business.address`)
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

## Magyar nyelvű AI = first-mover előny (vélemény, nem mért adat)
Feltételezés: a magyar alulreprezentált az AI tréningadatban, ezért a magyar nyelvű
AI-citáció vékonyabb és kevésbé versengő, mint az angol. Erre nincs mérésünk.
Magyar Wikipédia + magas tekintélyű kiadók (hvg.hu, portfolio.hu) a valószínű forráskör.
Írj answer-first, tényekkel sűrű magyar tartalmat, és engedd be az AI retrieval botokat.

## Megjegyzés
A .hu ccTLD Magyarországra céloz (standard); dokumentált külön „bizalmi szorzó” nincs.
SMB-nél az entitás-bizalom útja: Organization schema + GBP + cégadatok + azonos NAP a
fenti katalógusokban (a schema oldalt a `schema` skill kezeli).
