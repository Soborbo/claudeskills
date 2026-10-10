# Skill-mérce

Minden új vagy átírt skill ennek feleljen meg. Elfogadva: 2026-10-05 (Skillveglegesites, J1 + K19).

## 1. Egy skill = egy feladattípus

- Egy skill egy szándékot szolgál (pl. „űrlap építése”, „schema”, „hirdetésfiók-audit”). Ha két skill ugyanarra a kérésre töltődne be, az egyik felesleges.
- A `description` három dolgot mond: **mit** csinál, **mikor** kell, és **mire NEM** való. Példa: „…Not for Zod schemas or database schemas.”
- Nincs „Always use this skill”, „MUST”, „CRITICAL” típusú nyomásnyelv a leírásban. A betöltést a pontos leírás hozza, nem a kiabálás.

## 2. Rövid és magyarázó

- A `SKILL.md` legfeljebb **500 sor**. A részletek a `references/` alá kerülnek, és a SKILL.md mondja meg, mikor kell őket megnyitni.
- A törzs **magyaráz**: miért van egy szabály, mi történik, ha megszegik. Egy indokolt szabályt a modell jobban alkalmaz, mint egy indoklás nélküli tiltást.
- Amit a modell amúgy is tud (Zod-alapok, try/catch, általános WCAG, CWV-táblázat), az nem kerül bele.
- Nincs kötelező szertartás: számozott, mindig végigjárandó lépéssor, kötelező sablon minden szakasszal, aláírás/hash a jóváhagyásról.

## 3. Nincs kvóta

Tilos minden olyan szám, ami a tartalmat mennyiségre kényszeríti: „egy anekdota oldalanként”, „5 helynév 800 szavanként”, „minden mező kitöltve”, karakterlimit a title-re, belső link-keret. Ezek kitalált tényeket és gépies szöveget szülnek.

A kvóta-tilalom a **kódra vonatkozó szabályokra is** áll: sorszám-határ fájlra, kötelező tesztfájl-szám rétegenként, minden védelemre kötelező mutáció. Ezek átrendezést és teszt-zajt szülnek, nem minőséget (soborbo-crm mérés, 2026-10-10: a 200 soros fájlszabály miatti átrendezés egy PR termékkód-sorainak 57%-a volt).

Mérhető **határ** lehet (pl. „legfeljebb 7 kalkulátor-lépés”), ha indokolt, és felülírható a projekt adatai alapján.

## 4. Forrásfegyelem

- A skill nem írhat elő és nem tanácsolhat kitalált tényt, számot, értékelést, hivatkozást.
- Statisztika csak forrással és dátummal.
- **Romlandó tény** (API-verzió, Google-szabály, határidő, ár, limit) csak egy dátumozott `references/perishable-facts.md`-ben áll, a forrás linkjével és az ellenőrzés dátumával. Félévente felülvizsgálandó.
- Ahol a tudás gyorsan avul (Google Search Central, schema.org, könyvtár-API-k), a skill megmondja, honnan frissítsen: hivatalos dokumentáció URL-je vagy Context7.

## 5. A kód egy helyen van

- A futó kód kanonikus helye a kódrepó (pl. `Soborbo/leadgen-template-site`, `Soborbo/Serverside`). A skill **hivatkozik** rá, nem másolja.
- Ha a skillnek kódmintát kell adnia, az rövid, és megmondja, melyik fájl az eredeti.
- Telepítésnél és buildnél a lépések egyszerűek és determinisztikusak: egy út, nem választási lehetőségek listája.

## 6. Tiltólista: ezek soha ne kerüljenek vissza

A régi skillekben (`old/`) ártalmas tanácsok voltak. Egyik skill sem tartalmazhatja:

- szándékos helyesírási hibák vagy „tökéletlenségek” beírása a szövegbe;
- „bucket brigade” és hasonló kattintásvadász klisék;
- kitalált hatásszámok („+19,72%”, „3× AI-láthatóság”);
- kötelező FAQ / HowTo / Speakable schema (a FAQ rich result 2026-05-07 óta senkinek nem jelenik meg, HowTo 2023 óta nincs);
- saját (self-serving) AggregateRating a saját cégen, vagy platformok közötti értékelés-összesítés;
- a CookieYes `marketing` kulcsa (a helyes: `advertisement`);
- Google-cégprofil Q&A „seedelése”, kategória-trükközés;
- geotag mint rangsorolási tényező;
- fail-open spam- vagy botvédelem (a Turnstile hiányzó kulcsnál/tokennél elutasít).

## 7. Ellenőrzés kiadás előtt

- **Betöltési teszt:** 15-20 valós kéréssel (a korábbi munkákból) kipróbálva, hogy jókor és csak akkor töltődik be.
- A hivatkozott fájlok és parancsok léteznek (link-ellenőrzés).
- Nem ütközik más skill leírásával.
