# Reviews: asking for them, linking to them, staying legal

Genuine reviews are a Trust signal people actually read, and they feed the third-party
sources AI engines quote. This file covers the visible and operational side. Review
**markup** (AggregateRating, self-serving rules) belongs to the `schema` skill.

Open this file when a site needs a review-request flow, a "leave us a review" link, or a
check that existing review practice is legal.

## The rules that decide everything else

Both Google and UK law draw the same line: ask **every** customer for an **honest**
review, and never reward, filter or bury. Sources and dates are in
[perishable-facts.md](./perishable-facts.md).

- **Ask everyone, not just the happy ones.** Google's policy forbids "selectively
  solicit positive reviews". The CMA's DMCCA guidance (CMA208 §4.5) treats
  "encouraging just those who are satisfied to leave reviews" as cherry-picking. So no
  "If you were happy, please review us" wording, and no satisfaction pre-survey that only
  forwards 5-star answers to Google (review gating).
- **No incentives.** No discount, prize draw or freebie for a review, and nothing for
  changing or removing a negative one.
- **Never write, buy or commission reviews**, including from staff, friends or an agency.
  Under the **DMCCA 2024** (Schedule 20 para 13, in force since 6 April 2025) this is a
  banned practice in the UK, whatever its effect. The CMA can fine up to 10% of global
  turnover. It also covers displaying reviews misleadingly, for example showing only the
  good ones on the site.
- **Don't suppress negatives.** Don't threaten reviewers, and don't make a refund or
  complaint resolution conditional on a review not being left. Reply to the review
  instead.
- **HU:** since the EU Omnibus Directive (2019/2161), fake consumer reviews and their
  commissioning are on the EU blacklist of unfair commercial practices; in Hungary the
  Fttv. (2008. évi XLVII. tv.) annex implements it. Google's policy applies equally.
  *(The exact annex point number was not checked for this file.)*

## Direct review link

Send people straight to the review box on the Google Business Profile:

```
https://search.google.com/local/writereview?placeid=<PLACE_ID>
```

- Find the Place ID with Google's Place ID Finder:
  https://developers.google.com/maps/documentation/places/web-service/place-id
- The GBP dashboard also gives a short review link ("Ask for reviews" / "Get more
  reviews"). Either works; use one consistently so it can be tested.
- Put the Place ID in `siteConfig` next to the GBP URL, not hard-coded in a template.
  Click the link once after every deploy that touches it.

## GBP website link with UTM

Give the GBP "Website" field a tagged URL so GBP traffic can be told apart in GA4:

```
https://<domain>/?utm_source=google&utm_medium=organic&utm_campaign=gbp
```

`utm_medium=organic` keeps the visits in GA4's Organic Search channel. A made-up medium
such as `gbp` matches no default channel and lands in "Unassigned". The campaign value is
what separates GBP from ordinary organic visits.

## Request templates

Send a few days after the job is finished, by the person the customer dealt with. Fill
the brackets from real job data. Never invent a name, date or detail. Don't send a
reminder more than once. No emojis.

### EN — email

```
Subject: Your [service] on [date]: would you review us?

Hi [first name],

Thanks for choosing [business] for your [service] in [area].

Would you leave an honest Google review of how it went? Good or bad,
it helps other people in [area] decide, and it tells us what to fix.

[direct review link]

Thanks,
[sender name], [business]
```

### EN — SMS

```
Hi [first name], [sender] from [business] here. Thanks for having us on [date].
Would you leave an honest Google review? [short link]
```

### HU — e-mail (önözve)

```
Tárgy: [szolgáltatás], [dátum]: értékelné a munkánkat?

Kedves [Vezetéknév Keresztnév]!

Köszönjük, hogy minket választott a(z) [szolgáltatás] elvégzésére.

Megírná a Google-ön, hogyan látta a munkánkat? Akár jó, akár rossz
a tapasztalata, segít másoknak a döntésben, nekünk pedig abban, hogy mit
csináljunk jobban.

[értékelő link]

Köszönettel:
[küldő neve], [cégnév]
```

### HU — SMS

```
Jó napot! [küldő], [cégnév]. Köszönjük a bizalmat ([dátum]).
Ha van egy perce, értékelje munkánkat a Google-ön: [rövid link]
```

## Showing reviews on the site

- Show real reviews with the reviewer's first name and date, and link to the platform
  where they live so they can be checked.
- If you show a selection, don't present it as representative. The safest option is an
  embed or link to the full list.
- Star ratings on the page are content, not markup. Whether any markup is allowed is a
  `schema` question (self-serving AggregateRating is not eligible).
