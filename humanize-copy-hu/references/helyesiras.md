# Helyesírás és tipográfia magyar vevői szövegben

Alap: A magyar helyesírás szabályai, 12. kiadás (AkH 12),
https://helyesiras.mta.hu/helyesiras/default/akh12 (a pontszámok 2026-10-06-án
ellenőrizve). Ahol László házszabálya eltér az AkH-tól, az nyer, és jelölve van.

## Írásjelek

| Mit | AkH 12 | Ügyfél-site-on |
|---|---|---|
| Gondolatjel (–) közbevetésben | helyes, két oldalán szóköz (AkH 240 g) | **nincs** (László házszabálya): vessző, zárójel, kettőspont vagy új mondat |
| Tartomány, „-tól -ig” (9–11 óra) | nagykötőjel (AkH 264 c) | **sima kötőjel**: 9-11 óra, 2-3 nap, H-P (László házszabálya) |
| Hosszú gondolatjel (—) | a magyarban nem használatos | nincs |
| Idézőjel | „…” (alul nyit, felül zár); idézeten belül »…« (AkH 240 j, 257) | ugyanígy; az angol "…" és a “…” hibás |
| Szóköz | írásjel előtt nincs; a nyitó zárójel és idézőjel a következő szóhoz tapad (AkH 240) | ugyanígy |

Az eltérés oka: László globális szabálya (2026-10) minden ügyfélnek szánt szövegre
kimondja: „nincs gondolatjel (em/en dash; tartományban sima kötőjel: 2-3)”. A korábbi
projektekben ez fokozatosan szigorodott: a Skinlabon 2026-05-ben csak a hosszú
gondolatjel ment ki, a tartomány nagykötőjele maradt; a Soborbo-árajánlatban 2026-08-ban
a hosszú helyett még nagykötőjel állt. Meglévő site-on ezért ne cseréld tömegesen a
régi nagykötőjeleket kérdés nélkül: új szövegben már ne legyen, a régiről kérdezz.

## Számok és mértékegységek

- **Tizedesvessző:** 38,6; 0,5 mm (AkH 274).
- **Ezres tagolás:** öt- vagy többjegyű számnál hármas csoportokban, szóközzel: 12 900,
  357 864 (AkH 274, 291). A négyjegyű szám egyben marad (4500), kivéve oszlopban
  ötjegyűek mellett. Weben nem törő szóköz kell (`&nbsp;` vagy U+00A0, illetve keskeny
  U+202F), hogy a szám ne törjön két sorba.
- **Mértékegység és pénznem:** a szám után szóközzel: 40 mm, 502 m³/h, 23 °C,
  12 900 Ft. A toldalék kötőjellel: 160-as, 10%-os, 5 m²-es.
- **Százalék:** a jel tapad a számhoz: 48% (AkH 275).
- **Időpont:** 10:35, a kettőspont nem tapad szóközzel (AkH 240 f).
- **Sorszám:** pont a szám után: 3. emelet, 1978. évi.

## Nagy kezdőbetű

- **Címek:** egyedi címben (oldalcím, H1, H2, cikkcím) csak az első szó és a tulajdonnév
  nagy kezdőbetűs: „Konténerház telepítése lépésről lépésre” (AkH 198). A minden szót
  nagybetűvel kezdő angolos cím hiba.
- **Megszólítás:** az „ön”, „önök” szöveg belsejében általában kisbetűs, de tisztelet
  kifejezésére nagy kezdőbetű is alkalmazható (AkH 147). A site meglévő gyakorlatát
  kövesd, és egy oldalon belül legyen egységes.
- **Hirdetési címsor:** László külön szabálya (Title Case, a mértékegység kicsi)
  a hirdetésre vonatkozik, nem a weboldalra; az ads skill kezeli.

## Helyesírás-ellenőrzés gépi segítséggel

László olcsokontenerhaz.hu-n kipróbált módszere (`helyesiras-atvizsgalas-modszer`
memória): az `nspell` + `dictionary-hu` páros Node-ban kifut a memóriából, ne próbáld.
Ami működik, a `dictionary-hu` nyers `.dic` fájljából (kb. 91 ezer szótő):

1. **Szótő-előtag próba:** a magyar toldalékoló nyelv, minden érvényes szó egy szótővel
   kezdődik; ami eggyel sem, az tőhiba (`mestterséges`).
2. **Ritka toldalék:** vágd le a leghosszabb illeszkedő tövet, és nézd a maradékot; a
   korpuszban egyszer-kétszer előforduló toldalék gyanús (`telephelyünkün`).
3. **Egy betűnyi eltérés gyakori párhoz** a saját szövegkorpuszban (`megodlhatja` és
   `megoldhatja`).

Buktatók ugyanonnan: az idézőjel-cserét („…" helyett „…”) soronként futtatva a szkript
eltöri a HTML-attribútumokat, ha előttük `class="..."` áll; diffben nézd át. A
vendorolt kódban (pl. `src/lib/` tracking-mag) a kommentekhez ne nyúlj.
