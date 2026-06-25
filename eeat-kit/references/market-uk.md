# Market pack — United Kingdom

`--market uk`. Validators in `markets.ts`: `isValidUkCompanyNumber`, `findRegistration`,
`detectAccreditations`.

## Registration / transparency
- **Companies House number** — display it (8 digits, or 2 letters + 6 digits e.g.
  SC/NI/OC). `business.registration` looks for it near a "Company No / Registered in
  England…" label. Link `sameAs` to the public register (schema side: schema-entity-graph).
- `vatID` where applicable.

## Accreditations / trust marks (logo + link to the register = the signal)
Detected by `business.accreditations`:
- **Gas Safe Register** — legally required for gas work.
- **NICEIC / NAPIT** — electrical.
- **FENSA / CERTASS** — windows/doors.
- **MCS** — renewables/heat pumps. **HETAS** — solid fuel.
- **TrustMark** — the only government-endorsed quality scheme (umbrella).
- **Which? Trusted Traders**, **Checkatrade**, **TrustATrader**, **FMB** — vetted
  directories/memberships.

Distinction worth stating on-page: directories check business basics; official
registers verify legal competence.

## Directories / review platforms (citations + AI third-party presence)
Checkatrade, TrustATrader, Which? Trusted Traders, MyBuilder, Rated People, Bark, Yell,
Trustpilot, Google. Being listed across several builds NAP citations and feeds the
third-party sources AI engines pull from. Keep NAP byte-for-byte identical.

## Notes
- UK consumers expect transparent registered-company details; absent/opaque ownership
  is a Low/Lowest rater trigger.
- Gas/electrical safety niches edge toward higher-scrutiny (YMYL-adjacent): raise
  credential and review signals accordingly.
