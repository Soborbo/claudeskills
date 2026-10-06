---
name: humanize-copy-hu
description: Magyar nyelvű vevői szöveg írása, átírása és átnézése Soborbo magyar ügyfeleinek (pl. Nemes Ventilátorház, trapezlemezes.hu, olcsokontenerhaz.hu, lomtalan.hu, Skinlab, Beautyflow), hogy úgy szóljon, mintha a tulaj írta volna - csak a tulajtól, a kódból vagy ellenőrizhető forrásból származó tényekkel, önöző megszólítással, természetes magyarsággal, gondolatjel és AI-ízű, tükörfordításos szerkezetek nélkül, felsőfokú állítással csak bizonyítékkal (Fttv.). Use for Hungarian web pages, service, area and category pages, product descriptions (UNAS too), GBP descriptions, review replies and customer emails, whenever the copy is in Hungarian. Not for English copy (humanize-copy-uk), Google or Meta ad text (ads skill), JSON-LD (schema), keyword placement, title and meta structure (seo-onpage), and not for code comments, documentation, commit messages or chat replies.
---

# Vevői szöveg emberi hangon (magyar)

A cél olyan szöveg, amit a tulaj a sajátjaként vállal: konkrét, igaz, és egyféle
vevőnek szól. Nem az AI-detektor a mérce. A Google nem azért bünteti a szöveget, mert
gép írta, hanem mert sablonos, semmitmondó vagy tömegesen gyártott. Az ember ráérzésre
alig jobban ismeri fel az AI-szöveget, mint a véletlen, ezért a felszíni „jelek”
lecsiszolása semmit nem javít, ha a tartalom üres marad.

| Mire van szükség | Mit nyiss meg |
|---|---|
| Magyar AI-jelek és tükörfordítások, előtte/utána példákkal | `references/ai-jelek.md` |
| Helyesírás és tipográfia (AkH 12), László házszabályai, helyesírás-ellenőrzés | `references/helyesiras.md` |
| Fttv. (felsőfok, vélemények, „ingyenes”), dátummal | `references/perishable-facts.md` |

## Közös mag

<!-- A humanize-copy-uk/SKILL.md „Shared core” részének magyar párja. A kettőt együtt módosítsd. -->

**1. Valós inputból dolgozz, és ne tegyél hozzá semmit.** Írás előtt gyűjtsd össze, mi
ismert: a site konfigurációja (`siteConfig`, `src/data/*`), a tulaj jegyzetei és
hangüzenetei, a régi leírás, a gyári adatlap, a valódi vélemények, az árlista, a projekt
`CLAUDE.md`-je és memóriája. Az átírás átrendezhet, húzhat, összevonhat és
újrafogalmazhat. Nem adhat hozzá olyan tényt, nevet, számot, dátumot, helyet, ügyféltörténetet,
idézetet, véleményt vagy értékelést, ami nincs az inputban. A hihetőket sem: alapítási
évet, flottaadatot, visszahívási időt, nyitvatartást, „kérésre hozunk” típusú ígéretet.
Ezek mind előfordultak már Soborbo-projekten (lomtalan.hu, Nemes Ventilátorház), és a
tulajnak kellett kiszednie őket.

Miért fontos: a szöveg minden mondata az ügyfél nevében tett ígéret. A kitalált
„kérésre nagyobb méretet is hozunk” 26 termékoldalon vállalt kötelezettséget a bolt
nevében, anélkül hogy bárki megkérdezte volna a tulajt. A kitalált vélemény pedig
tiltott kereskedelmi gyakorlat (lásd lent).

Ha egy mondathoz hiányzik egy adat, vagy írd meg a mondatot nélküle, vagy hagyj látható
kérdést a piszkozatban (`[KÉRDÉS: hány autó van?]`), és a végén sorold fel. Valódinak
látszó értékkel soha ne töltsd ki a hézagot.

**2. Állításszűrő.** A felsőfok és az abszolút állítás („a legjobb”, „a legolcsóbb”, „1.
számú”, „garantáltan”, „mindig”, „ingyenes”, „gazdaságosabb”, „környezetbarát”) csak akkor maradhat, ha a
tulaj bizonyítani tudja. Az Fttv. 14. §-a szerint a vállalkozás köteles a kereskedelmi
gyakorlatában szereplő tényállítás valóságát igazolni. Véleményt és értékelést csak a
valódi forrásból, értelmében változatlanul idézünk, és sosem írunk vagy „javítunk” mi.
Részletek és dátum: `references/perishable-facts.md`.

**3. A konkrétum többet ér a jelzőnél.** A régi humanize-copy skill legjobb tanácsa: az
operatív részlet az, ami a sablonszövegből hiányzik, és amire a vevőnek szüksége van. Mi
van benne az árban és mi kerül pluszba, mennyi ideig tart, hová lehet állni az autóval,
milyen eszközzel dolgoznak, mit kell a vevőnek előre elintéznie, hogyan fizet. Ha ez
megvan az inputban, hozd előre. Ha nincs, kérdezz rá: többet ér bármilyen jelző-cserénél.

**4. A számot abban a formában hagyd, ahogy a forrás adta.** Az élő szövegben keveredik
a pontos és a kerekített szám („bruttó 12 900 Ft-tól”, „nagyjából egy hét”), a gépi
szöveg viszont egy regisztert választ, és azt viszi végig. Ne kerekíts pontos számot a
lazaság kedvéért, és ne találj ki pontosságot.

**5. Szerkezet, nem szólista.** A megbízható AI-jelek szerkezetiek: a „nem csupán X,
hanem Y”, az erőltetett hármas, a csattanós zárómondat, a gondolatjel mint univerzális
kötőelem, a felfújt jelentőség, a félkövér címke és kettőspont minden felsorolásban, az
angolosan nagybetűzött cím. A szóhasználat modellenként változik, a szerkezet megmarad.
Átnézésnél nyisd meg a `references/ai-jelek.md`-t. A jel tünet: azt mutatja, hogy a
mondat nem mond semmi konkrétat. A tartalmat javítsd, ne csak a fordulatot.

**6. A minta felülírja a szabályt.** Ha a tulaj írt már valamit (régi oldal,
Facebook-poszt, e-mail, hangüzenet átirata), előbb azt olvasd el, és igazodj a
mondathosszához, a szókincséhez, a hangvételéhez. A beszélt nyelv átirata a legjobb
hangforrás: a tulaj gyakran egyszerűbben beszél, mint ahogy ír (egy UK-projekten a
tulaj írott szövege Flesch-Kincaid szerint kb. 10-es, a beszéde kb. 3-as szintű volt).

**7. Nincs gondolatjel, nincs AI-fordulat.** Vevői szövegben nincs hosszú (—) és
nagykötőjel (–) sem. Helyette pont, vessző, kettőspont vagy zárójel, tartományban sima
kötőjel („2-3 nap”, „H-P”). Ez László házszabálya minden ügyfél-site-on, és szigorúbb az
AkH-nál, amely a gondolatjelet és a tartomány nagykötőjelét helyesnek tartja (részletek
a `references/helyesiras.md`-ben). Kódban, URL-ben, fájlnévben a kötőjelhez ne nyúlj.

**8. A testvéroldalak tartalomban különbözzenek.** A sablonból készült, csak a
településnévben eltérő terület- és szolgáltatásoldal a Google szemében tömeges
tartalom. Minden testvéroldalnak saját tény kell (ott végzett munka, megközelítés,
távolság, helyi tudnivaló, amit a tulaj ismer), saját nyitás és saját sorrend. Ha a
tulajnak nincs helyi ténye, mondd ki, és javasolj kevesebb oldalt a töltelék helyett.

**9. Olvasói teszt átadás előtt.** A kész szöveget, és csak azt, add oda egy előzmények
nélküli segéd-agentnek (Claude Code-ban: Agent tool). Kérdezd meg tőle: kinek szól, mit
kínál, mennyibe kerül, mi a következő lépés, és melyik mondat hangzik sablonosnak,
homályosnak vagy gépinek. Amin elakad, azt javítsd. A claude.ai-on, ahol nincs
segéd-agent, kérd meg a felhasználót, hogy egy új beszélgetésben tegye fel ugyanezeket a
kérdéseket. Az ötlet az Anthropic `doc-coauthoring` skilljének Reader Testing lépéséből
jön.

## Magyar réteg

**Megszólítás: önözés.** Ez az alapértelmezés (László döntése, I10, 2026-10-02). Ha a
projekt `CLAUDE.md`-je tegezést ír elő, az nyer. Az „Ön” nagy kezdőbetűje a tisztelet
jele, az AkH 147. pontja szerint megengedett; a site meglévő gyakorlatát kövesd, és
legyen következetes. A magyar ige jelöli a személyt, ezért az „Ön” csak ott kell, ahol
nyomaték vagy egyértelműség kívánja. A minden mondatba tett „Ön”, „Önnek”, „Önt” angolos,
és gépiesen hat.

**Hangvétel: a tapasztalt szakember beszél.** Többes szám első személy („mi”,
„nálunk”, „azt látjuk”), közvetlenül, mellébeszélés nélkül, mint egy szakember, aki a
saját munkájáról mesél. A hivatalos, személytelen fogalmazás kerülendő. Egyértelmű
ajánlás és őszinte korlát („mi nem ajánljuk”, „ezért nem árulunk 0,4-es lemezt”) erős
bizalmi jel, de csak akkor, ha a tulaj mondta. Kitalált „őszinteség” rosszabb, mint
semmi. (Forrás: trapezlemezes.hu hangvétel-memória és a claude.ai Trapezlemezes
projekt: konkrét forintösszegek, „prémium” és „innovatív” típusú töltelék nélkül.)

**Termékszöveg (Nemes Ventilátorház tulajdonosától tanult minta):**

- A terméket a teljes, kategóriát is mondó nevén nevezd meg („Rosenberg ZeroBox 160
  ipari hangcsillapított ventilátor”), ne általánosítva („csőventilátor”).
- Túlzó állítás helyett a tény: „amelyet nem hallani” helyett a bélés vastagsága és a
  zajszint dB(A)-ben, 1 méterről. A tulaj indoka: „mert nyilván hallani”.
- A szám mondatban álljon, ne adatsorban: „Óránként 502 köbméter levegőt tud megmozgatni
  160-as csőátmérő mellett, ami elég egy kisebb iroda, rendelő vagy üzlethelyiség csendes
  szellőztetésére.”
- Puszta adatfelsorolás sem jó: legyen benne, miért jobb ez a termék (USP), de csak
  forrásból (gyári adatlap, régi leírás, ellenőrzött boltbeli tény).
- Szerelési tanácsot, amit a gyártó nem mond ki, és gazdaságossági vagy összehasonlító
  értékelést („gazdaságosabb”, „gyorsabb”) ne írj magadtól.
- Átdolgozásnál a régi leírás kulcskifejezéseit (anyagnév, szabvány, típusnév, szám)
  tételesen vesd össze az új szöveggel. Egy körben három, a vevő által keresett
  megnevezés esett ki így („melegen hengerelt”, „AWA-bilincs”, „tömítő mandzsetta”).

**Belső szó helyett a vevő szava.** A vevői szövegbe nem kerül belső zsargon, belső
kategórianév vagy munkacím. A projektenkénti írásmód (pl. Nemes: „Standard”, nem
„sztenderd”), a tiltott szavak (pl. „raktárról”) és a fix zárómondatok a projekt
`CLAUDE.md`-jébe valók, nem ide; írás előtt nézd meg őket ott.

**Tipográfia röviden** (részletek: `references/helyesiras.md`): idézőjel „…”, belső
idézet »…«; tizedesvessző; öt- vagy többjegyű szám hármas csoportokban, nem törő
szóközzel (12 900 Ft); mértékegység előtt szóköz (40 mm, 23 °C), a százalékjel tapad
(48%); címben csak az első szó és a tulajdonnév nagy kezdőbetűs (AkH 198). A hirdetési
címsor más szabály szerint megy (ads skill), ide nem tartozik.

**Emoji:** vevői szövegben és vevőnek menő levélben nincs; emoji helyett egyszínű SVG ikon.

## Munkamenet

Rövid javításnál (egy bekezdés, egy cím, egy GBP-leírás) elég a magot alkalmazni és a
tényeket ellenőrizni. Egy oldalnál vagy oldalsorozatnál ez a sorrend válik be:

- Gyűjtsd össze az 1. pontban felsorolt inputot, és jegyezd fel, mi hiányzik.
- Ha van meglévő piszkozat, olvasd végig, és jelöld be az AI-jeleket
  (`references/ai-jelek.md`), a legerősebbel kezdve, mielőtt bármit átírnál.
- Írd meg vagy írd át. Minden alátámasztott állítás maradjon; ami csak ismétel, menjen.
- Vesd össze az eredményt az inputtal állításonként: került bele új tény, változott
  szám, esett ki valódi részlet? Az alátámasztatlan hozzáadás hiba, a kiesett valódi
  részlet is az.
- Futtass helyesírás-ellenőrzést (`references/helyesiras.md`), aztán az olvasói tesztet.

Amit visszaadsz: a kész szöveget; egy rövid listát arról, mit hagytál ki vagy
tompítottál bizonyíték híján; és a tulajnak szóló nyitott kérdéseket. Ha a szöveg fájlba
kerül, csak a prózát módosítsd: komponens, prop, link, slug és kód maradjon érintetlen.

## Mikor ne nyúlj hozzá

- A tulaj saját szövegéhez, ha csak korrektúrát kért: a hibát javítsd, a hangját hagyd,
  azokat a mondatokat is, amelyeket te másképp írnál.
- Idézethez, vélemény szövegéhez, jogi vagy szabályozott szöveghez (ÁSZF,
  adatkezelési tájékoztató, garanciális feltétel), terméknévhez, gyártói típusjelhez.
- Egyetlen hármas felsoroláshoz vagy egyetlen szokványos fordulathoz egyébként konkrét
  szövegben. Egy jel önmagában gyenge bizonyíték; több együtt a figyelmeztető.
- A szokatlan, konkrét részlethez, ami a hangot viszi (valódi utca, egy valódi vevő
  furcsa megjegyzése, a tulaj száraz közbevetése). Ettől emberi a szöveg.

## Végső ellenőrzés

- Minden ténymondat visszavezethető az inputra? Vállalná a tulaj?
- Maradt felsőfok, „ingyenes”, „garantált” vagy értékelés bizonyíték nélkül?
- Maradt gondolatjel, angolos nagybetűs cím, emoji, „Ön”-halmozás, tükörfordítás?
- A testvéroldalaktól tényekben is eltér, nem csak a településnévben?
- Az olvasói teszt megtalálta az ajánlatot, az árinformációt és a következő lépést?

## Források

- László memóriái (a PR leírása sorolja fel fájlonként): Nemes `feedback_szovegstilus`,
  `feedback_forras_fegyelem`, `feedback_standard_iras`; trapezlemezes.hu
  `feedback_hangnem`; olcsokontenerhaz.hu `helyesiras-atvizsgalas-modszer`; Skinlab
  `skinlab-design-conventions`; claude.ai-export (Trapezlemezes, Lomtalan.hu projektek);
  globális `CLAUDE.md` „Web, SEO, szöveg” szakasza.
- blader/humanizer v3.1.0 (MIT, kb. 54 ezer csillag, ellenőrizve 2026-10-06): a
  szerkezeti jelek előbb, mert a szóhasználat modellenként változik; tényt, nevet, számot
  nem adhatsz hozzá; a minta felülírja a szabályt; „mikor ne nyúlj hozzá”. Eltérés: a
  humanizer megengedi, hogy a hanghoz illő véleményt tegyünk a szövegbe; itt a vélemény a
  tulajé, ezért azt sem tesszük hozzá. https://github.com/blader/humanizer
- Wikipédia: Signs of AI writing (a WikiProject AI Cleanup tanácsadó oldala, nem
  irányelv; magyar változata nincs):
  https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing
- Anthropic `doc-coauthoring`, Reader Testing:
  https://github.com/anthropics/skills/tree/main/skills/doc-coauthoring
- AkH 12: https://helyesiras.mta.hu/helyesiras/default/akh12
