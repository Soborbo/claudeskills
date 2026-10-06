# AI-jelek és tükörfordítások magyar vevői szövegben

Magyar nyelvű, nyilvános AI-jel-gyűjtemény nincs (a Wikipédia „Signs of AI writing”
oldalának sincs magyar változata, 2026-10-06). Ez a lista ezért három forrásból áll, és
minden tételnél jelölve van, honnan jön:

- **[László]**: László vagy ügyfele visszadobta, memóriában rögzítve (a fájlnév a tételnél).
- **[humanizer]**: a blader/humanizer v3.1.0 nyelvfüggetlen szerkezeti jele
  (https://github.com/blader/humanizer). A humanizer maga írja az 1. mintánál, hogy a
  „nem X, hanem Y” formula minden nyelvben megvan.
- **[saját]**: a skill írójának megfigyelése a magyar gépi szövegről. Ezek nincsenek még
  László javításaival igazolva; ha egy visszadobás megerősíti vagy cáfolja, írd át a
  jelölést.

Miért vannak ezek a jelek: a modell a legvalószínűbb következő szót írja, ezért
alapértelmezésben azt választja, ami a legtöbb olvasóra ráillik. Magyarul ehhez jön,
hogy a modell angol mintákon tanult a legtöbbet, így az angol szerkezet átüt a magyaron.
A javítás szinte mindig egy konkrét tény az inputból, nem egy ügyesebb fordulat. Ha
nincs tény a mondathoz, a mondat többnyire mehet.

Az „utána” példák illusztrációk; a bennük álló adat a tulajtól jönne. Innen semmilyen
részletet ne másolj ügyfélszövegbe.

## Szerkezeti jelek (ezek az erősebbek)

**1. „Nem csupán X, hanem Y”** [humanizer + saját]. Változatai: „nem csak … hanem …
is”, „több mint egy egyszerű …”, „nem X, hanem Y” csattanó. A tagadott felére senki nem
gondolt, a mondat így súlyt ad, de állítást nem. László a Nemes első változatát éppen a
„tükörfordítás-ízű, csattanós szerkezetek” miatt érezte „magyartalannak” [László,
Nemes `feedback_szovegstilus`].
Előtte: A konténerház nem csupán egy épület, hanem egy új életszakasz kezdete.
Utána: A konténerház [n] nap alatt áll össze a telken, és [mi van benne az árban].

**2. Erőltetett hármas** [humanizer]. „Gyors, megbízható és megfizethető”; három
egyforma szerkezetű előnymondat; három kártya, amelyből a harmadik csak a sor kedvéért
van. Ha három valódi dolog van, maradhat; ha nincs, a valódi szám kell.

**3. Csattanós zárómondat** [humanizer]. „És ez a különbség.”, „Ennyire egyszerű.”, a
bekezdést megismétlő egymondatos bekezdés. A rövid mondat akkor jó, ha új tényt hoz.

**4. Felvezetés a lényeg helyett** [saját]. „Fontos megjegyezni, hogy”, „Nem titok,
hogy”, „Érdemes tudni, hogy”, „Lássuk, mire kell figyelni!”, „Mindenki tudja, hogy”.
Húzd ki a felvezetést, és kezdd a ténnyel. (Az „érdemes” a Nemes tiltott-szó szűrésében
is szerepel [László, `feedback_forras_fegyelem`], ott a tanácsadó-ajánló értelme miatt.)

**5. Felfújt jelentőség és marketingtöltelék** [László + humanizer]. „Prémium”,
„innovatív” [László, claude.ai Trapezlemezes projekt], „egyedülálló”, „kiemelkedő”,
„páratlan”, „zökkenőmentes”, „gondtalan”, „a … világában”, „kulcsfontosságú szerepet
játszik” [saját]. Ide tartozik a túlzó állítás: „csőventilátor, amelyet nem hallani”,
„mert nyilván hallani” [László, Nemes `feedback_szovegstilus`].
Előtte: Prémium minőségű, innovatív megoldásainkkal zökkenőmentes élményt biztosítunk.
Utána: A ventilátor zajszintje 1 méterről [x] dB(A); a házban [mm] vastag ásványgyapot bélés van.

**6. Kitalált üzleti ígéret** [László, Nemes `feedback_forras_fegyelem`; claude.ai
Lomtalan.hu projekt]. „Kérésre hozunk”, „megrendeljük”, „raktárról”, „24 órán belül
visszahívjuk”, nyitvatartás, alapítási év, flottaadat. Ez nem stílushiba, hanem
kötelezettségvállalás a tulaj nevében. Csak forrásból.

**7. Adatlista szöveg helyett, vagy szöveg adat nélkül** [László, Nemes
`feedback_szovegstilus`]. A „502 m³/h, 60 W, 44 dB(A)” sor nem leírás, az általános
dicséret sem az. A szám mondatban álljon, és mondja meg, mire elég.

**8. Címke és kettőspont minden sorban** [humanizer + László]. „**Célközönség:** …”,
„**Előny:** …” minden felsorolásban. A Nemes boltban az ilyen „Célközönség:” blokkok a
beszállítói feed AI-szövegéből jöttek [László, Nemes `reference_feed_szinkron_termekek`].

**9. Angolos nagybetűzés a címben** [humanizer + AkH 198]. „Miért Válasszon
Minket?” helyett „Miért válasszon minket?”. Magyarul ez nem stílus, hanem helyesírási
hiba: egyedi címben csak az első szó és a tulajdonnév nagy kezdőbetűs. (Hirdetési
címsorban László más szabályt használ, az az ads skill dolga.)

**10. Gondolatjel mint univerzális kötőelem** [László, globális `CLAUDE.md`;
humanizer]. Vevői szövegben nincs: pont, vessző, kettőspont vagy zárójel kell helyette.

## Tükörfordítás és nyelvtani jelek

Ezek mind [saját] jelölésűek: a magyar gépi szöveg jellegzetes hibái, László
javításaiban név szerint még nem szerepeltek, de a „magyartalan” és
„tükörfordítás-ízű” kifogás [László, Nemes] alá tartoznak.

- **„Ön”-halmozás:** „Ön kiválasztja, mi Önnek a legjobb, és Önt értesítjük.” A magyar
  ige jelöli a személyt: „Kiválasztja, melyik illik a házához, mi pedig értesítjük.”
- **„Kerül …-ra/-re” passzívum:** „felszerelésre kerül”, „kiszállításra kerül”.
  Helyette ige: „felszereljük”, „kiszállítjuk”.
- **„Rendelkezik” és „biztosít”:** „15 éves tapasztalattal rendelkezünk”, „biztosítjuk
  a gyors kiszállítást”. Helyette: „15 éve csináljuk”, „[n] napon belül kiszállítjuk”
  (ha a szám megvan).
- **Angol mondatnyitók szó szerint:** „Legyen szó akár X-ről, akár Y-ról” (Whether
  you're…), „Ha Ön is …, akkor jó helyen jár” (Look no further), „Ne habozzon
  kapcsolatba lépni velünk” (Don't hesitate to contact us), „Fedezze fel”, „Tegye
  otthonát még …-bbá”.
- **Birtokos- és főnévhalmozás:** „a szolgáltatásaink minőségének folyamatos
  fejlesztése”. Igével: „folyamatosan javítjuk, amit csinálunk” (vagy konkrétan, mit).
- **„Valamint”, „továbbá”, „ezen felül”** minden második mondat elején. Az „és” vagy
  semmi is elég.
- **Retorikai kérdés nyitásként:** „Szeretné, ha a költözés gyerekjáték lenne?” Kezdd
  azzal, amit a vevő keres.
- **Felkiáltójel a tényeken:** „Ingyenes felmérés!” A tény felkiáltójel nélkül is tény.

## Szavak, amelyek gyakran gépi szöveget jeleznek

Csak második körben, a szerkezeti jelek után: átfogó, kulcsfontosságú, zökkenőmentes,
innovatív, prémium, egyedülálló, kiemelkedő, testreszabott, holisztikus, a … világában,
utazás (átvitt értelemben), szinergia [saját; a „prémium” és az „innovatív” László]. Bármelyik
lehet a pontos szó (a „testreszabott” egy konfigurátornál igaz lehet). Egy önmagában
semmit nem bizonyít.

## Ami marad

- valódi, konkrét részlet a tulajtól (utca, szokatlan munka, megnevezett beszállító);
- a tulaj saját közbevetése, önjavítása;
- idézet, vélemény szövege, terméknév, jogi szöveg;
- minden, amit a tulaj mintaszövege szándékosan használ.
