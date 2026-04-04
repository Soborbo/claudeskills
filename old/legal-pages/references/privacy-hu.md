# Adatvédelmi Tájékoztató (Magyar)

Cserélje ki a `[HELYŐRZŐK]`-et a valós adatokra.

```markdown
# Adatvédelmi Tájékoztató

**Utolsó frissítés: [DÁTUM]**

## Adatkezelő

[CÉG_NÉV] ("mi", "velünk", "a cég") üzemelteti a [WEBOLDAL_URL] weboldalt.

**Elérhetőség:**
- Cím: [CÍM]
- E-mail: [EMAIL]
- Telefon: [TELEFON]
[HA_CÉGJEGYZÉKSZÁM]- Cégjegyzékszám: [CÉGJEGYZÉKSZÁM][/HA]

## Milyen adatokat gyűjtünk?

### Az Ön által megadott adatok:
[MINDEN_ŰRLAPMEZŐRE]
- [MEZŐ_NÉV]
[/MINDEN]

### Automatikusan gyűjtött adatok:
- IP-cím (anonimizált)
- Böngésző típusa
- Meglátogatott oldalak
- Oldalon töltött idő

## Hogyan használjuk fel az adatokat?

Az Ön adatait a következőkre használjuk:
- Megkeresésekre való válaszadás
- Árajánlatok és szolgáltatások nyújtása
- Szolgáltatással kapcsolatos kommunikáció
- Weboldalunk fejlesztése

**NEM tesszük a következőket:**
- Adatok értékesítése harmadik félnek
- Marketing küldése hozzájárulás nélkül
- Adatok megosztása az EGT-n kívülre megfelelő garanciák nélkül

## Jogalap (GDPR)

| Cél | Jogalap |
|-----|---------|
| Megkeresésekre válaszolás | Jogos érdek |
| Szolgáltatás nyújtása | Szerződés teljesítése |
| Marketing (hozzájárulással) | Hozzájárulás |
| Weboldal analitika | Jogos érdek |

## Adatmegőrzés

- Megkeresések adatai: 2 év az utolsó kapcsolatfelvételtől
- Analitikai adatok: 14 hónap
- Marketing hozzájárulás: Visszavonásig

## Az Ön jogai

A GDPR alapján Önnek joga van:
- Hozzáférni adataihoz
- Pontatlan adatok helyesbítéséhez
- Adatok törléséhez ("elfeledtetéshez való jog")
- Adatkezelés korlátozásához
- Adathordozhatósághoz
- Tiltakozáshoz
- Hozzájárulás visszavonásához

**Jogai gyakorlásához:** Írjon a [EMAIL] címre "Adatvédelmi kérelem" tárggyal.

30 napon belül válaszolunk.

## Sütik (Cookie-k)

Részletekért lásd [Cookie Szabályzatunkat](/cookie-szabalyzat).

## Harmadik fél szolgáltatások

A következő szolgáltatásokat használjuk:
[HA_ANALITIKA]
- **Google Analytics** — Weboldal analitika ([Adatvédelem](https://policies.google.com/privacy))
[/HA]
- **Cloudflare** — Biztonság ([Adatvédelem](https://www.cloudflare.com/privacypolicy/))
[HA_EMAIL]
- **Resend** — E-mail küldés ([Adatvédelem](https://resend.com/legal/privacy-policy))
[/HA]

## Adatbiztonság

Adatait a következőkkel védjük:
- SSL/TLS titkosítás
- Biztonságos tárhely (Cloudflare)
- Korlátozott hozzáférés

## Változtatások

Ezt a tájékoztatót frissíthetjük. Ellenőrizze az "Utolsó frissítés" dátumot.

## Panasz

Ha nem elégedett, panaszt tehet:

**Nemzeti Adatvédelmi és Információszabadság Hatóság (NAIH)**
- Weboldal: naih.hu
- Telefon: +36 1 391 1400
- Cím: 1055 Budapest, Falk Miksa utca 9-11.
```

## Helyőrző referencia

| Helyőrző | Forrás |
|----------|--------|
| `[CÉG_NÉV]` | legal_info.business_name |
| `[WEBOLDAL_URL]` | site URL |
| `[CÍM]` | legal_info.address |
| `[EMAIL]` | legal_info.email |
| `[TELEFON]` | legal_info.phone |
| `[CÉGJEGYZÉKSZÁM]` | legal_info.company_number |
| `[DÁTUM]` | Aktuális dátum |
| `[MEZŐ_NÉV]` | form_fields tömb |
