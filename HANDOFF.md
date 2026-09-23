# Project Handoff

Last updated: 2026-09-23
Branch: main

## Current Objective

Maintain Nigeria incident discovery and victim-only casualty extraction. Recent parser
hardening addresses clear human impact (e.g. "abduct village head", "abandon three
kidnap victims", "kill security commander, abduct two") previously stored as zero or
unknown casualties. GitHub Actions is the daily scheduler. The 2026-09-23 manual run
completed all 37 queries but admitted zero of 177 fetched URLs, exposing a 48-hour
window, date-metadata filters, and missing fetch-level diagnostics. A 2026-09-23
hardening change widens the default overlap to 96 hours, retries transient requests,
and preserves rejected leads and fetch/provider errors for review. Relative weekday
dates now resolve against the publication date in Lagos time. Search coverage remains
non-exhaustive.

### Recent Milestone (2026-09-21)
- **Heuristic Casualty Extraction Hardening (`src/lib/free-news.ts`, `src/lib/search-led-discovery.ts`)**:
  - Expanded `extractCasualtyAssessment` to parse appositive/parenthetical clauses (e.g. `at least nine people, including a pastor, have been killed`).
  - Added support for auxiliary verb constructs (`have been`, `has been`, `were`, `was`, `are`, `is`) and adverbs (`reportedly`, `allegedly`, `confirmed`, `feared`).
  - Expanded victim nouns in `people` pattern with `others`, `passengers`, `travellers`, `commuters`.
  - Updated `buildCandidate` in `src/lib/search-led-discovery.ts` to evaluate `${title}. ${lead}` against casualty extraction terms so headline figures like "Nine Killed..." are captured.
  - Added batch progress logging to `uniqueStates` loop in `src/lib/search-led-discovery.ts` so Netlify logs report live progress during the 37-state scan.
  - Hardened `extractTown` to reject generic incident descriptors like `Separate Gunmen Attacks` or `Fresh Attack`.
- **Database Reconciliation (`scripts/update-plateau-incident.ts`)**:
  - The initial broad attribution of nine deaths to Gana-Ropp was superseded by the 2026-09-23 source review: five Gana-Ropp deaths were reported for 19 Sep, before the scan window; the in-window Dorowa Babuje record was narrowed to two deaths. Do not rerun the old one-off updater without re-adjudicating its source.
  - Verified `6ab13a4687749f8740a4e914` ("Armed robbers raid TSU students’ residences in Jalingo"): correctly records 0 casualties (property raid only, no human casualties reported), displaying "Not reported".

### Recent Milestone (2026-09-20)
- **Heuristic Casualty Extraction Hardening (`src/lib/free-news.ts`)**:
  - Expanded `extractCasualtyAssessment` to parse written number words (`one` to `fifty`) in addition to digits.
  - Added support for singular victim roles/titles (count = 1) including `village head`, `security commander`, `monarch`, `pastor`, `officer`, etc., with optional descriptive adjectives (`local`, `prominent`, `community`).
  - Added support for `<count> kidnap victims` and `abduction of <count>` structures.
  - Expanded verb/noun forms across `killed`, `injured`, `kidnapped`, and `displaced`.
- **DeepSeek AI Verification Prompt (`src/lib/deepseek.ts`)**:
  - Clarified operation exclusion rule: offensive operations without victim harm are excluded, but armed attacks and kidnappings where victims were abducted (even if troops responded or rescued victims) are confirmed with victim counts recorded.
- **Search-Led Discovery (`src/lib/search-led-discovery.ts`)**:
  - Added 24h grace window to `minMs` check in `applyDeepSeekCleanup` for true incident event dates when published within the 48h discovery window.
  - Passed comprehensive regex terms to `extractCasualtyAssessment`.
- **Database Reconciliation (`scripts/update-recent-top3.ts`)**:
  - `6aaf77ab227884560cbe8876` ("Gunmen abduct village head in Kano"): updated to `date: 2026-09-17`, `kidnapped: 1`, `town: Aujarawar Alkali`, tags `deepseek-verified`. Displays "1 abducted".
  - `6aaf77ab227884560cbe8872` ("Bandits flee, abandon three kidnap victims as troops strike in Katsina"): updated to `kidnapped: 3`, `lga: Dandume`, tags `deepseek-verified`. Displays "3 abducted".
  - `6aaf77ac227884560cbe887a` ("Bandits kill security commander, abduct two in Kwara community"): updated to `killed: 1, kidnapped: 2`, tags `deepseek-verified`. Displays "1 killed · 2 abducted".

## Current State

- Backfill checkpoint before the 2026-09-23 audit: **467 active attacks**. The 2026-09-23 audit added 8 records (collection count 475 -> 483); re-query active count before relying on the exact current total.
- Backfill batches completed:
  - Batch 1 (Abia, Adamawa, Akwa Ibom, Anambra) — DONE
  - Batch 2 (Bauchi, Bayelsa, Benue, Borno) — DONE
  - Batch 3 (Cross River, Delta, Ebonyi, Edo) — DONE
  - Batch 4 (Ekiti, Enugu, FCT, Gombe) — DONE
  - **Batch 5 (Imo, Jigawa, Kaduna, Kano) — DONE (2026-09-19)**
  - **Batch 6 (Katsina, Kebbi, Kogi, Kwara) — DONE (2026-09-19)**
  - **Batch 7 (Lagos, Nasarawa, Niger, Ogun) — DONE (2026-09-19)**
  - **Batch 8 (Ondo, Osun, Oyo, Plateau) — DONE (2026-09-19)**
  - **Batch 9 (Rivers, Sokoto, Taraba, Yobe) — DONE (2026-09-19)**
  - **Batch 10 (Zamfara) — DONE (2026-09-19) — FINAL BATCH; 10-batch backfill COMPLETE**
- Daily audit / revalidation work from the earlier session (HANDOFF history) is
  unchanged; see git log and `audit-2026/` artifacts.

## Batch 5 Result (apply-batch5.js)

Recon found the handoff's 4 "new" inserts already existed in the DB. Actions taken:

- Handoff proposed inserts all matched existing records (SKIP_EXISTS):
  Kaduna Easter Ariko `69d25dd33ea3759043216f87`; Naridon `6aae6308d470b42e80127429`;
  Kano Rogo APC `6a96b860df2fc83e4972095e`; Kano Bebeji APC `6a96b85fdf2fc83e4972095b`.
- **4 genuinely-new attacks inserted** (verified against live sources):
  1. `6aae7250dcdbfa903054a3a1` — Kaduna, Ungwan Atiku (Kachia), 2026-06-28; 1 killed, 11 abducted; unconfirmed.
  2. `6aae7250dcdbfa903054a3a2` — Kaduna, Abu-Fadan/Sanga, 2026-08-22; 2 killed, 2 abducted; unconfirmed.
  3. `6aae7250dcdbfa903054a3a3` — Imo, Ohaji/Egbema soldier ambush, 2026-05-04; 1 killed, 1 injured; confirmed.
  4. `6aae7251dcdbfa903054a3a4` — Imo, Eziobodo/Ihiagwa (Owerri West), 2026-05-13; injuries, attempted abduction foiled; developing.
- **Enrichments**: Kaduna Easter Ariko (Punch + France24, kidnapped=31, confirmed);
  Kano Rogo APC (Daily Post + Punch, killed=2); Naridon (Africanews + BBC Pidgin + Punch);
  Kano Yankamaye/Tsanyawa `6a944dd056ec3f9ab055e04a` (Sahara + Zagazola, killed=5, injured=4, confirmed).
- **Duplicate consolidation**: Naridon duplicate `6a944dd456ec3f9ab055e076` merged into
  `6aae6308d470b42e80127429` and soft-deleted (`_deletedReason`).
- **Quarantine**: 20 `resolved_to_attack`, 3 `duplicate_of_existing_attack`,
  11 `excluded_out_of_scope` in `credible_unresolved_incidents`.
- Pre/post snapshot: `audit-2026/backfill-2026/snapshots/database-snapshot-batch5.json`.
- Total active attacks: 438 -> 437 (dup merge) -> **441** (+4 inserts).
- Post-validation: **0 errors**. Re-run: all SKIP_EXISTS / NO_OP_IDEMPOTENT.

## Batch 6 Result (apply-batch6.js)

Recon cross-checked the 115 unresolved candidates against the 60 existing batch-state
attacks. Five known-good candidates were duplicates of existing attacks (all SKIP_EXISTS):
Katsina Matazu/Rabe `6a92a9faa9b079ce763110af`; Kebbi Tsamiya NSCDC `6a9f0d1395800aba5535acbe`;
Kebbi Rafin Makuku `6a92aa01a9b079ce76311129`; Kogi Dekina NECO `6a9f0bb3e30260a441ac8e1e`;
Kogi Zariagi orphanage `6a9f0bb2e30260a441ac8e17`.

- **6 genuinely-new attacks inserted** (verified against live sources):
  1. `6aae73e41dc87e96f2012872` — Kogi, Ayegunle Bunu (Kabba/Bunu), 2026-06-01; 1 killed, 1 injured, 31 abducted; confirmed.
  2. `6aae73e41dc87e96f2012873` — Kwara, Igbesi (Isin) monarch abduction, 2026-08-22; ruler + residents, victim count unstated; confirmed.
  3. `6aae73e51dc87e96f2012874` — Kebbi, Yauri APC chairman wife/son abduction, 2026-06-22; 2 abducted; confirmed.
  4. `6aae73e51dc87e96f2012875` — Kebbi, Tangaram (Danko/Wasagu), 2026-05-24; 13 abducted; confirmed.
  5. `6aae73e51dc87e96f2012876` — Katsina, Unguwar Aminu (Bakori), 2026-08-11; 2 killed, 4 injured, 6 abducted; unconfirmed.
  6. `6aae73e61dc87e96f2012877` — Kogi, Ankpa/Ojoku travellers, 2026-08-30 (storage anchor; attack on/before 28 Aug); 3 killed, 9 abducted; developing.
- **Enrichments** (5, tag `enriched_20260919`): Katsina Matazu/Rabe (+8 sources, confirmed);
  Kebbi Tsamiya/NSCDC (+3 sources, `location.lga` set to Bagudo, hash recomputed);
  Kebbi Rafin Makuku (+4 sources, status confirmed); Kogi Dekina/NECO (+5 sources);
  Kogi Zariagi/orphanage (+2 sources).
- **Duplicate consolidations**: none soft-deleted this batch; the 5 known-good candidates were
  already present and were enriched in place instead.
- **Quarantine**: 35 `resolved_to_attack`, 14 `duplicate_of_existing_attack`,
  53 `excluded_out_of_scope` in `credible_unresolved_incidents`.
- Pre/post snapshot: `audit-2026/backfill-2026/snapshots/database-snapshot-batch6.json`.
- Total active attacks: 441 -> **447** (+6 inserts). Batch-state attacks: 60 -> 66.
- Post-validation: **0 errors** both runs. Re-run: all SKIP_EXISTS / NO_OP_IDEMPOTENT,
  0 quarantine writes, 0 enrichment writes.

## Batch 7 Result (apply-batch7.js)

Recon cross-checked the 53 unresolved candidates against the 39 existing batch-state
attacks. Most candidates were out-of-scope, wrong state/year, or duplicates of existing
attacks (no known-good quarantine candidate needed a plain SKIP_EXISTS guard).

- **3 genuinely-new attacks inserted** (verified against live sources):
  1. `6aae75c97369d3a9a42e42f4` — Nasarawa, Anguwar Ninzo/Gudi (Akwanga), 2026-05-06 21:00; 6 NSUK students + 1 visitor = 7 abducted; confirmed.
  2. `6aae75ca7369d3a9a42e42f5` — Ogun, Ipojo Golden Estate/Oke-Eri (Ijebu Ode), 2026-05-11 19:00; 3 abducted, 1 woman shot/injured; confirmed.
  3. `6aae75ca7369d3a9a42e42f6` — Niger, Pissa (Borgu), 2026-06-13 09:00 (Sat; storage anchor, date-uncertainty); 3 killed, houses burned; confirmed.
- **Enrichments** (3, tag `enriched_20260919`): Ogun Magbon dredging site `6a944dd156ec3f9ab055e05a`
  (+Punch, status confirmed); Lagos Ikola/Alimosho hoodlum clash `6a966e0ca83adf70ab8f8399`
  (+Blueprint, status confirmed; stored 4 killed vs Blueprint 3 killed conflict left unreconciled);
  Niger Borgu mosque/community attack `6a92aa01a9b079ce76311133` (+Organiser/AFP Lakurawa attribution).
- **Duplicate consolidation**: `6a9722c795ededd498956970` (Bandits Abduct Worshippers During
  Friday Prayer, Borgu 2026-08-21) merged into the richer `6a92aa01a9b079ce76311133`
  (+1 source) and soft-deleted with `_deletedReason`.
- **Quarantine**: 4 `resolved_to_attack`, 18 `duplicate_of_existing_attack`,
  29 `excluded_out_of_scope`; **2 left `open`** (Lagos NURTW killings `6a94d08285e2744b7d3a7ac0`,
  `6a94d08285e2744b7d3a7ac1` — union/political motive unresolved).
- Pre/post snapshot: `audit-2026/backfill-2026/snapshots/database-snapshot-batch7.json`.
- Total active attacks: 447 -> **449** (+3 inserts, -1 duplicate merge). Batch-state: 39 -> 41.
- Post-validation: **0 errors** both runs. Re-run: all SKIP_EXISTS / NO_OP_IDEMPOTENT,
  0 quarantine writes, 0 enrichment writes.

## Batch 8 Result (apply-batch8.js)

Recon cross-checked the 96 unresolved candidates against the 63 existing batch-state
attacks. Most candidates were out-of-scope (rescue/foil/raid/arrest ops, commentary,
court, false alarms, wrong-year <=2025), wrong-state, mob/cult/communal violence,
ordinary individual crime, or duplicates of attacks already in the DB.

- **9 genuinely-new attacks inserted** (verified against live sources):
  1. `6aae78964f754cc99da2bc2a` — Plateau, Bin Mper/Binper (Kombun District, Mangu), 2026-08-18 00:30; 20–30 killed (ThisDay 20 / Independent 24 / Guardian 30+), ~50 houses razed; confirmed; `casualty-uncertainty`.
  2. `6aae78974f754cc99da2bc2b` — Plateau, Ta-Hoss (Riyom), 2026-06-10 22:00; 2 vigilantes killed; confirmed.
  3. `6aae78974f754cc99da2bc2c` — Plateau, Gwande (Sha–Daffo axis, Bokkos), 2026-06-17 19:30; district head Saf Samuel Alaket killed; confirmed.
  4. `6aae78974f754cc99da2bc2d` — Plateau, Gari Ya Waye/Angwan Rukuba (Jos North), 2026-03-29 19:30 (Palm Sunday); police 26 / governor 28 killed; 48-hr curfew; confirmed; `casualty-uncertainty`.
  5. `6aae78984f754cc99da2bc2e` — Ondo, Ode Oriya (Owo), 2026-06-13 20:30; village head abducted, wife shot/injured; confirmed.
  6. `6aae78984f754cc99da2bc2f` — Ondo, Ago-Oyinbo/Ala Daadaa (Akure North), 2026-08-11 (P.M. News/Veracity date; outlets published 21 Aug); Amotekun officers killed (Corps: 2 dead + 1 fatal; reports: 4); confirmed; `date-uncertainty`,`casualty-uncertainty`.
  7. `6aae78984f754cc99da2bc30` — Osun, Ede (Aisu/Akoda/Sekona motor parks), 2026-06-09; 6 injured (Vanguard 3, P.M. News 1 feared dead); confirmed; `casualty-uncertainty`.
  8. `6aae78994f754cc99da2bc31` — Osun, Okuku/Oyinlola DC School Ward 2 (Odo-Otin), 2026-07-26; INEC PVC distribution attacked, 3 packs stolen; confirmed.
  9. `6aae78994f754cc99da2bc32` — Oyo, Challenge/Elewura (Ibadan South West), 2026-06-03 07:00; ex-minister Adelabu’s sister + twin sons (3) abducted; confirmed.
- **Enrichments** (2, tag `enriched_20260919`): Ondo pastor’s-son abduction `6a966df5a83adf70ab8f837d`
  (+4 sources; **corrected `casualties.kidnapped` 9 → 1** — the stored 9 was the victim’s age;
  status `unconfirmed` → `confirmed`); Osun Ora/Ifedayo LG vice-chairman `6a9f0bb4e30260a441ac8e25`
  (+4 sources; status set `confirmed`). Both had a stale legacy `hash`; hash recomputed.
- **Duplicate consolidations**: none soft-deleted this batch. 9 quarantine clusters were
  classified `duplicate_of_existing_attack` against existing records (Ondo pastor’s-son,
  Ondo two-farmers N100m, Osun Ora VC, Osun Ilesa/Boluwaduro cult, Oyo Oriire school,
  Plateau Radura/pastor, Garga 20 security, Kawel/Mushere, Kum/Riyom).
- **Quarantine**: 13 `resolved_to_attack`, 18 `duplicate_of_existing_attack`,
  43 `excluded_out_of_scope`; **22 left `open`** (ambiguous political/election violence,
  aggregate roundups, single-source events: Ondo NULGE/N10m ransom; Osun Osogbo-monarch,
  Accord chairman, 14-yr-old, police-patrol attacks, APC-convoy, pre-rally ambush;
  Oyo fresh attack 2026-06-14; Plateau 5-killed 2026-05-31, cattle kill, 3-killed 2026-04-04,
  2-villagers 2026-05-12, 16-killed 2026-05-10, several-night-attacks 2026-06-02, Barnabas
  30-killed). No `open` candidate was inserted.
- Pre/post snapshot: `audit-2026/backfill-2026/snapshots/database-snapshot-batch8.json`.
- Total active attacks: 449 -> **458** (+9 inserts). Batch-state: 63 -> 72.
- Post-validation: **0 errors** both runs. Re-run: all SKIP_EXISTS / NO_OP_IDEMPOTENT,
  0 quarantine writes, 0 enrichment writes.

## Batch 9 Result (apply-batch9.js)

Recon cross-checked the 57 unresolved candidates against the 47 existing batch-state
attacks. Most candidates were out-of-scope (rescue/foil/raid/arrest/clearance ops,
attacker-only kills, airstrikes, commentary, fact-checks, wrong-year <=2025),
communal/cult violence, ordinary crime, or duplicates of attacks already in the DB
(Tofa/Rabah 2026-09-07, Ghandi/Rabah 2026-06-16, two-soldiers Sokoto ambush,
Taraba Kofai Amadu, Goniri/Gujba ISWAP base assault).

- **5 genuinely-new attacks inserted** (verified against live sources):
  1. `6aae7ab380ad4073468ded61` — Rivers, Omoku/Oba Road (Ogba/Egbema/Ndoni), 2026-07-21 17:00;
     OSPAC commander Ozomela Stephen Nwaocha + 3 women killed, 2 injured; confirmed; `date-uncertainty`
     (Daily Post “Tuesday” vs Daily Trust “Monday”).
  2. `6aae7ab380ad4073468ded62` — Sokoto, Dan Gulbi (Tureta), 2026-06-02 08:00; second attack in
     48 hours after the Eid massacre (existing `6aae6308d470b42e80127433`); ~20 killed (community estimate);
     confirmed; `casualty-uncertainty`.
  3. `6aae7ab380ad4073468ded63` — Sokoto, Tsamaye (Sabon Birni), 2026-08-03 21:00; ≥21 feared dead,
     37 abducted, 18 missing after boat capsize; **developing**; `casualty-uncertainty`.
  4. `6aae7ab480ad4073468ded64` — Sokoto, Gidan Kare (Tureta), 2026-08-27 08:00; Islamic teacher
     Mallam Abubakar Danjimme killed + residents abducted; **unconfirmed** (single publisher, police
     said details pending); `date-uncertainty`.
  5. `6aae7ab480ad4073468ded65` — Sokoto, Mallamawar Yari/Gawakuke ward (Rabah), 2026-03-07 18:30;
     1 killed, 5 abducted; **unconfirmed** (single publisher, police-confirmed).
- **Enrichments** (3, tag `enriched_20260919`):
  - Taraba Kofai Amadu ambush `6a966df1a83adf70ab8f8377` (+Linda Ikeji +NigerianEye sources;
    **`casualties.killed` null → 1** — Linda Ikeji documented the young man shot dead; status
    `unconfirmed` → `confirmed`; hash recomputed).
  - Sokoto Gorau raid `6a944ddb56ec3f9ab055e0ca` (+Leadership source; status `unconfirmed` → `confirmed`;
    the Leadership article also documents the separate Gidan Kare attack, inserted above).
  - Sokoto two-soldiers ambush `6a966df9a83adf70ab8f8382` (+NigerianEye source; status → `confirmed`).
- **Duplicate consolidations**: none soft-deleted this batch. Duplicate clusters were classified
  `duplicate_of_existing_attack` (Rivers Rumuodogo‑2 communal reprisal; Sokoto Tofa/Rabah Sep‑7;
  Sokoto Tsamaye Aug; Ghandi/Rabah; two-soldiers ambush; Taraba Kofai Amadu; Yobe Goniri/Buni Gari).
- **Quarantine**: 7 `resolved_to_attack`, 18 `duplicate_of_existing_attack`,
  24 `excluded_out_of_scope`; **8 left `open`** (Rivers ADC family-home arson 2026-08-19;
  Sokoto IDP abduction 2026-07-16, Tsamaye mosque attack 2026-07-28/29, Sokoto community attack
  2026-08-21, “kill 4/abduct 4” championnews, “two killed/25 kidnapped” 2026-04-03; Taraba
  Al Jazeera 50-killed aggregate, Taraba/Benue Tiv attacks 2026-02-10). No `open` candidate inserted.
- Pre/post snapshot: `audit-2026/backfill-2026/snapshots/database-snapshot-batch9.json`.
- Total active attacks: 458 -> **463** (+5 inserts). Batch-state: 47 -> 52.
- Post-validation: **0 errors** both runs. Re-run: all SKIP_EXISTS / NO_OP_IDEMPOTENT,
  0 quarantine writes, 0 enrichment writes, 0 inserts.

## Batch 10 Result (apply-batch10.js)

Recon cross-checked the 27 unresolved candidates against the 21 existing Zamfara
attacks. Most candidates were out-of-scope (troop repel/foil/clearance ops,
attacker-only kills, an air strike, commentary, aggregate reports, wrong-year
<=2025) or duplicates of attacks already in the DB (Bungudu council-chairman
residence 2026-07-25, Magami highway ambush 2026-05-10, Gusau-Funtua highway
2026-08-25, Anka/Dutse Dan Ajiya massacre 2026-02-20).

- **4 genuinely-new attacks inserted** (verified against live sources):
  1. `6aae7ce692479bd42a5d9aac` — Zamfara, Sauna District / Sauna Ruwan Gora Ward
     (Talata Mafara), 2026-07-21 13:00; 23 farmers killed (police-confirmed; sources range
     20–24: Reuters/Amnesty 24, Vanguard/Daily Trust 23, Al Jazeera 20), 5 injured; confirmed;
     `casualty-uncertainty`,`date-uncertainty` (Reuters/AFP Tue 21 Jul vs Sahara/Daily Trust Wed 22 Jul).
  2. `6aae7ce792479bd42a5d9aad` — Zamfara, Goron Namaye (Maradun), 2026-06-12; 17 farmers killed,
     13 injured; confirmed (AP, Amnesty International, New Telegraph, National Daily, The Leader).
  3. `6aae7ce792479bd42a5d9aae` — Zamfara, Bagega–Anka road / Tungar Kudaku–Bagega (Anka),
     2026-06-08 18:15 WAT; commercial Golf 3 hit an IED, 10 killed, 7 injured; confirmed
     (TheCable, Naija News, NigerianEye, The Sun). Distinct from the existing 2026-06-15 EOD
     police IED and 2026-05-07 Anka roadside records.
  4. `6aae7ce792479bd42a5d9aaf` — Zamfara, Taketsaba (Talata Mafara), 2026-08-25; 3 residents
     killed (incl. NSCDC officer Aliyu M. Taketsaba), 10 abducted (incl. women/babies); **unconfirmed**
     (single reporting origin — conflict analyst Bakastine — carried by Daily Post, NigerianEye, TG News;
     no police statement).
- **Enrichments** (2, tag `enriched_20260919`):
  - Zamfara Magami/Gusau highway ambush `6a966deda83adf70ab8f8372` (+4 sources: Daily Post
    30-travellers, Channels TV, Pravda/AFP, Prompt News; **`casualties.killed` null → 30**;
    status `unconfirmed` → `confirmed`; stale legacy `hash` recomputed).
  - Zamfara Bungudu council-chairman residence `6a92a9ffa9b079ce76311104` (+3 sources: Channels TV,
    THISDAYLIVE, Sahara Reporters; status stays `developing` because Channels reports 2 policemen +
    vigilante killed vs THISDAY/Punch/TheCable 4 security operatives; stale legacy `hash` recomputed).
- **Duplicate consolidations**: none soft-deleted this batch. 6 quarantine clusters were classified
  `duplicate_of_existing_attack` (Bungudu residence ×2, Gusau-Funtua highway 2026-08-25 ×1,
  Magami highway ambush ×2, Anka/Dutse Dan Ajiya Al Jazeera video ×1).
- **Quarantine**: 6 `resolved_to_attack`, 6 `duplicate_of_existing_attack`,
  14 `excluded_out_of_scope`; **1 left `open`** — `6a94d08285e2744b7d3a7b33` (Channels TV,
  "Soldier, Policeman Killed As Troops Foil Attack By Terrorists In Zamfara", FOB Kasuwan Daji,
  Kaura Namoda, 2026-08-02: repelled base infiltration, 1 Army officer + 1 policeman killed,
  9 abducted civilians rescued). Ambiguous under the repel/operational-result exclusion vs the
  security-personnel-casualty inclusion; not inserted.
- Pre/post snapshot: `audit-2026/backfill-2026/snapshots/database-snapshot-batch10.json`.
- Total active attacks: 463 -> **467** (+4 inserts). Batch-state (Zamfara): 21 -> 25.
- Post-validation: **0 errors** both runs. Re-run: all SKIP_EXISTS / NO_OP_IDEMPOTENT,
  0 quarantine writes, 0 enrichment writes, 0 inserts.

### Backfill completion summary (Batches 5–10)

All state groups are done. Batch 10 was the final state group; the 10-batch backfill is
**COMPLETE**. Totals after Batch 10: **467 active attacks**; quarantine collections hold
182 `resolved_to_attack`, 116 `duplicate_of_existing_attack`, 309 `excluded_out_of_scope`,
and **174 still `open`** across all states (mostly batches 1–4 discovery leftovers plus a few
deliberately-left-open ambiguous events from batches 6–10).

## Important Constraints

- Always `require('dotenv').config({ path: '.env.local' })` (NOT `.env`).
- Active-query uses `{ _deleted: { $ne: true } }`; state field is `location.state`.
- Never count terrorist/insurgent/bandit deaths as victim casualties
  (profile: civilians, soldiers, police, vigilantes).
- Single trustworthy direct source => `unconfirmed`; two independent => `confirmed`;
  credible conflict => `developing`. Rescue/foil/raid/arrest ops are NOT attacks.
- SHA-256 dedup before every insert (`title|date|state|lga`).
- Never run `node -e "..."` with `$` operators in PowerShell; write script files.
- Every apply pass must be snapshot-first and re-runnable (NO_OP_IDEMPOTENT).

## Commands

```bash
node scripts/scan-batchN.js      # inventory existing attacks + unresolved candidates
node scripts/apply-batchN.js     # guarded apply (snapshot, dedup, quarantine, validate)
```

## Recent Changes

- Added `scripts/scan-batch10.js`, `scripts/inspect-batch10-unresolved.js`,
  `scripts/apply-batch10.js`, plus read-only helpers `scripts/dump-batch10-attacks.js`
  and `scripts/count-open-quarantine.js`.
- Added `scripts/scan-batch9.js`, `scripts/inspect-batch9-unresolved.js`,
  `scripts/apply-batch9.js`.
- Added `scripts/scan-batch8.js`, `scripts/inspect-batch8-unresolved.js`,
  `scripts/apply-batch8.js`.
- Added `scripts/scan-batch7.js`, `scripts/inspect-batch7-unresolved.js`,
  `scripts/apply-batch7.js`, and the read-only verifier `scripts/check-batch7.js`.
- Added `scripts/scan-batch5.js`, `scripts/apply-batch5.js`.
- Added `scripts/scan-batch6.js`, `scripts/apply-batch6.js`, and the read-only helper
  `scripts/check-batch6-missing.js`.
- Several read-only recon helpers: `scripts/check-batch5-state.js`,
  `scripts/check-batch5-details.js`, `scripts/dump-batch5.js`,
  `scripts/dump-batch5-candidates.js`.

## Next Actions

1. Review the remaining manual-review leads from GitHub run `35873334644`; retry unresolved
   publisher fetches on the next run and adjudicate against direct sources.
2. Backfill is COMPLETE (Batches 1–10). No further state-group batches remain.
3. Ongoing maintenance: resolve the **174 quarantine candidates still `open`** across all
   states. Highest-value/known-ambiguous sets to revisit first (each needs a second
   independent direct publisher before any insert):
   - Zamfara: `6a94d08285e2744b7d3a7b33` (2026-08-02 FOB Kasuwan Daji repel; soldier+policeman killed).
   - Sokoto: `6a9f54260d69792dd72c5d5c`, `6a9f54270d69792dd72c5d5d`,
     `6a9f54270d69792dd72c5d60`, `6a9f54280d69792dd72c5d64` (batch 9 leftovers).
   - Plateau: `6a9f54230d69792dd72c5d47`, `6a9f54240d69792dd72c5d4e`,
     `6a9f54250d69792dd72c5d51`, `6a9f54250d69792dd72c5d53`,
     `6a9f54250d69792dd72c5d56` (batch 8 aggregate/fresh-attack unknowns).
   - Osun: `6a94d08285e2744b7d3a7ae6`–`…7aea` political/election violence; Lagos
     NURTW `6a94d08285e2744b7d3a7ac0`/`…ac1`; Ondo `6a94d08285e2744b7d3a7ad8`,
     `6a94d08285e2744b7d3a7ae0`; Oyo `6a9f54210d69792dd72c5d3d`.
   - Batches 1–4 discovery leftovers (Abia/Akwa Ibom/Borno/FCT/Imo etc.) include many
     aggressor-only, rescue, threat-only, fact-check and wrong-state items; a pass should
     classify the clearly out-of-scope ones and only keep genuinely unresolved events.
4. Reconcile the known casualty/date conflicts recorded under Known Issues below if a
   definitive official release appears.
5. Keep Brave API usage as fallback only (~597 requests remaining).

## Known Issues / Do Not Repeat

- The original Batch 5 handoff data was STALE: its 4 "new" inserts already existed.
  Always run DB recon before trusting a handoff insert list. The same held for Batch 6:
  5 of the "strong candidate" events already existed as attacks and were enriched.
- Quarantine IDs `6a9f54050d69792dd72c5ca9`, `6a9f54090d69792dd72c5cb4`,
  `6a9f54090d69792dd72c5cb7`, `6a9f540a0d69792dd72c5cb3` do not exist in the DB.
  Likewise Batch 6 quarantine ID `6a9f54140d69792dd72c5cec` appears in the scan output
  but does not exist in `credible_unresolved_incidents`.
- Batch 6 date discrepancy: the Kebbi Shanga March ambush quarantine records (2026-03-25,
  9 soldiers + 1 police + 1 civilian = 11 killed) map to existing `69e4146d58f4bbb3bb8ad4c3`
  (stored as 2026-04-14). Classified `duplicate_of_existing_attack`; the stored date was
  not corrected this batch.
- Batch 6 candidates left `open` (ambiguous or single-source; NOT inserted): Katsina
  `6a9f540c0d69792dd72c5cba`, `6a9f540c0d69792dd72c5cbb`, `6a9f540d0d69792dd72c5cbf`,
  `6a94d08285e2744b7d3a7a96`; Kebbi `6a94d08285e2744b7d3a7aa1`, `6a9f540f0d69792dd72c5ccb`,
  `6a9f540f0d69792dd72c5ccc`, `6a9f54140d69792dd72c5ce8`; Kwara `6a94d08285e2744b7d3a7ab2`,
  `6a94d08285e2744b7d3a7ab3`, `6a9f54190d69792dd72c5d0a`.
- Many unresolved Imo/Jigawa candidates remain `open` by design (party-secretariat
  thuggery, bomb explosion with insufficient location, mosque-abduction aggregator
  pieces). They need live-source resolution before any insert.
- Batch 7 left 2 Lagos NURTW killing candidates `open` (union/political motive unclear):
  `6a94d08285e2744b7d3a7ac0`, `6a94d08285e2744b7d3a7ac1`. Not inserted.
- Batch 7: `6a966e0ca83adf70ab8f8399` (Lagos Ikola/Alimosho clash) stored 4 killed but
  Blueprint reports 3 killed + 2 injured for the same event; casualty figures were NOT
  overwritten. Reconcile in a later pass if a third source clarifies.
- Batch 7 applied `hashUpdated=true` to 3 enriched legacy records (`6a944dd1…`, `6a966e0c…`,
  `6a92aa01…`) because their stored `hash` did not match the canonical
  `generateHash()` output. Hash issue was corrected; validation found 0 duplicate hashes.
- The Nasarawa quarantine item `6a9f541b0d69792dd72c5d16` ("ISSP-linked Lakurawa …")
  is actually the Niger Borgu attack (Dikera/Binzi, 2026-08-21) mis-tagged as Nasarawa;
  classified `duplicate_of_existing_attack`, not wrong-state.
- Batch 8 left 22 candidates `open` (NOT inserted) — see the Batch 8 Result list above.
  They are mostly ambiguous Osun election/political violence (some may be the same events
  as existing Ikire/Osogbo records), Plateau 2026-05/06 aggregate roundups, and a few
  single-source events (Ondo NULGE thug attack, Ondo N10m-ransom farmers, Oyo 2026-06-14
  attack). Resolve with a second independent publisher before inserting.
- Batch 8 unresolved open questions / conflicts:
  - Mangu Bin Mper (2026-08-18) casualty conflict 20/24/30+ was stored as 24 with
    `casualty-uncertainty`; reconcile if a police-confirmed figure is published.
  - Jos North Angwan Rukuba (2026-03-29) killed stored as 28 (governor) vs police 26;
    initial-attack vs reprisal death split unresolved.
  - Ondo Amotekun ambush date conflict (11 Aug per P.M. News/Veracity vs 21 Aug publication)
    stored as 2026-08-11; deaths reported as 4 but Corps confirmed 2 + 1 fatal (stored 3).
  - Osun Ede motor-park injuries conflict (6 vs 3, 1 feared dead) stored as 6 injured, 0 killed.
  - `6a944dd956ec3f9ab055e0b4` (Osogbo palace shooting) is stored dated 2026-08-15 but the
    Channels account places the palace-visit shooting on 2026-08-19; not corrected this batch.
  - Ondo pastor’s-son record `6a966df5a83adf70ab8f837d` had `casualties.kidnapped` stored as 9
    (the victim’s age); corrected to 1 in Batch 8.
- Batch 8 enrichments `6a966df5…` and `6a9f0bb4…` also had stale legacy `hash` values
  (did not match canonical `generateHash()`); hash recomputed, validation found 0 duplicate
  hashes.
- Batch 9 left 8 candidates `open` (NOT inserted) — see the Batch 9 Result list above.
  Resolve with a second independent publisher before inserting.
- Batch 9 unresolved open questions / conflicts:
  - Rivers Omoku (2026-07-21): Daily Post places the OSPAC-commander killing on Tuesday
    evening, Daily Trust on Monday evening; stored as 2026-07-21 (Daily Post) with
    `date-uncertainty`.
  - Sokoto Tsamaye (2026-08-03): stored 21 killed / 37 abducted as a developing, unverified
    toll; the same village also had an earlier mosque attack on 2026-07-28/29 (3 killed in the
    mosque, 7 bodies recovered) which is a separate candidate left `open` — confirm whether the
    two are distinct before inserting the July event.
  - Sokoto Dan Gulbi (2026-06-02): stored ~20 killed from community claims; no police-confirmed
    figure. Distinct from the existing Eid massacre `6aae6308d470b42e80127433`.
  - Sokoto Gidan Kare (2026-08-27): the Leadership article covers both Gorau and Gidan Kare; the
    Gorau portion maps to existing `6a944ddb56ec3f9ab055e0ca` (enriched), the Gidan Kare portion
    inserted as unconfirmed. Exact abduction count unstated.
  - Yobe Buni Gari 27 Brigade ISWAP assault (2026-05-08; ThisDay/Punch: 2 soldiers killed,
    50 ISWAP neutralised) was classified `duplicate_of_existing_attack` against
    `6a92a9f9a9b079ce76311096` (Channels: ISWAP attack repelled at 120 Task Force Battalion,
    Goniri, 2026-05-09) to avoid a near-duplicate Gujba base-assault record. The camp name
    (Buni Gari vs Goniri) and date conflict were NOT reconciled; revisit if a definitive
    security-force release clarifies whether these are one or two incidents.
  - Batch 9 apply re-run guard caveat: the Gidan Kare insert and the Gorau enrichment share the
    same Leadership source URL, so on the 2nd run the insert's SKIP_EXISTS guard matched the
    Gorau record (`6a944ddb56ec3f9ab055e0ca`) rather than the insert itself
    (`6aae7ab480ad4073468ded64`). Harmless — still 0 inserts / 0 writes — but the logged _id is
    misleading.
- Batch 10 unresolved open questions / conflicts:
  - Zamfara Sauna District (2026-07-21): stored 23 killed (police-confirmed) with
    `casualty-uncertainty` (Reuters/Amnesty 24, Vanguard/Daily Trust 23, Al Jazeera 20;
    Global Witness Monitor 21–23) and `date-uncertainty` (Reuters/AFP/legit place the raid on
    Tue 21 Jul; Sahara/Daily Trust on Wed 22 Jul). uanworld reports the police consolidated the
    ">20 killed over three hours" and "24 farmers (Amnesty)" accounts as ONE event — the record
    deliberately merges them; do not create a second Sauna record.
  - Zamfara Magami/Gusau highway (2026-05-10): stored killed=30 from the Zamfara Community
    Protection Guard PRO / Daily Post; the original Daily Post report said only "several", so
    the 30 figure rests on the CPG account. Some outlets call the route Magami–Dansadau (existing
    record says Gusau–Magami/Magami ward). Reconcile if a police-confirmed figure appears.
  - Zamfara Bungudu residence (2026-07-25): casualty conflict preserved (Channels TV
    2 policemen + 1 vigilante = 3 vs THISDAY/Punch/TheCable 4 security operatives); status left
    `developing`.
  - Zamfara Bagega–Anka IED (2026-06-08, 10 killed) is distinct from the existing Anka–Bagega
    EOD police IED (2026-06-15, 3 police) and the 2026-05-07 Anka roadside blast (6 killed);
    three separate incidents on the same corridor.
  - Zamfara Taketsaba (2026-08-25) is inserted `unconfirmed` on a single reporting origin
    (conflict analyst Bakastine via Daily Post/NigerianEye/TG News); no police statement was
    published. Upgrade only with an official or genuinely independent source.
  - The Batch 10 Magami and Bungudu enrichments reported `hashUpdated=true` because their stored
    legacy `hash` values did not match canonical `generateHash()`; hashes were recomputed and
    validation found 0 duplicate hashes. Same class of stale-hash issue seen in Batches 7–9.

## Scheduled Daily Discovery (free + Brave fallback)

Objective: replace the paid Gemini/VertexAI discovery path with a free, scheduled daily scan of
all 37 jurisdictions over the trailing 48 hours.

### Components
- `src/lib/search-led-discovery.ts` — free discovery + non-AI ingestion.
  - Discovery: per-state query → DuckDuckGo HTML (free) first; if a state yields zero candidates,
    fall back to Brave Search API with a recency filter, capped by `BRAVE_SEARCH_MAX_CALLS_PER_RUN`
    (default 40; enough to cover all 37 jurisdictions per run) and shuffled so coverage rotates.
    Bing HTML is **disabled** (returns unusable
    results). Articles are fetched directly with a Jina reader (r.jina.ai) fallback for 403s.
  - Guards: denial/fact-check headline rejection, rescue/recovery/security-operation rejection,
    real `article:published_time` anchoring (relative dates are never anchored to "now"), and a
    48h publication + incident-date window.
  - Ingestion: SHA-256 (`title|date|state|lga`) + source-URL + location/date dedup; **no Gemini**.
- `src/lib/deepseek.ts` — **optional** DeepSeek cleanup/confirmation pass over heuristic-cleared
  incidents. Enabled only when `DEEPSEEK_API_KEY` is set (and `DEEPSEEK_CLEANUP_ENABLED` is not
  `"false"`), so the scan is free by default. It confirms the source describes a specific,
  completed, original incident (rejecting denials, security-force operations, threats/roundups)
  and returns cleaned title/date/state/LGA/town/group/status/victim-only casualties. On a
  DeepSeek error it fails open (keeps the heuristic candidate) and increments `deepseekErrors`.
- `netlify/functions/scheduled-discovery-background.mts` — retained background function, no longer
  scheduled; scheduled discovery runs through GitHub Actions.
- `scripts/search-led-scan.ts` — manual / CI entry point.
- `.github/workflows/daily-scan.yml` — primary daily scheduler (06:30 UTC), plus manual dispatch;
  runs the scan with GitHub Actions secrets and a 60-minute timeout.
- `netlify/functions/scheduled-update-background.mts` is retained but is no longer scheduled.

### Verified behaviour (read-only test, 2026-09-19)
- 6 states, 48h window: 53 URLs discovered, 53 fetched, 0 fetch errors; Brave fallback used per
  state; 1 marginal candidate; no false positives after fixes.
- Bugs found and fixed during testing: old articles dated "now", denial/fact-check admission,
  rescue/raid admission, and missing `kill`/`abduction` headline coverage.
- Known limits: free DuckDuckGo ignores recency (Brave is the only reliable fresh engine); many
  articles lack a parseable publish date and are dropped; casualty extraction can miss
  (e.g. "kill 15" → 0). The RSS lane remains the freshest source; search-led is a gap-filler.

### Scheduler migration (2026-09-23)
- GitHub Actions secrets `MONGODB_URI`, `BRAVE_SEARCH_API_KEY`, and `DEEPSEEK_API_KEY` were
  configured from the existing ignored local environment file; secret values are not stored here.
- Manual production workflow run `35860483242` completed successfully in 3m48s: connected to
  MongoDB, completed all 37 state queries, discovered 178 URLs, fetched 177, admitted 0
  candidates, and reported 1 fetch error. This was not a timeout or early cutoff. The
  scheduled/manual job at the time used a trailing 48-hour window, which excluded dates
  earlier than 21 Sep at that run time. Its hard filters also required a publication date
  and rejected some rescue/operation headlines before examining the full incident context.
  Ingestion completed with 0 inserts, 0 merges, and 0 errors; duplicate scan reported 7
  candidates across 5 states (report-only). One later read-only retry pass found a transient
  article timeout that recovered on retry; earlier audit output stored only aggregate fetch
  errors, not the original failed URLs.
- Workflow hardening: default 96-hour incident window (manual dispatch supports 48–168h),
  10 search results per state query, seven-day publication horizon while keeping the event
  date inside the selected window, and one retry for network/408/425/429/5xx article fetches.
  Failed article and search-provider requests plus date/location review leads are included
  in a 30-day GitHub artifact. Incomplete provider/fetch coverage fails the job after saving
  the report; candidates needing review remain visible without being auto-admitted. Weekday
  incident dates resolve relative to publication day in Lagos time when security context and
  a reliable publication timestamp are present.
- Manual verification run `35871689427` on commit `668a598` completed all 37 state queries:
  148 URLs discovered/fetched, 6 retry attempts, no fetch or search-provider failures, 4
  admitted candidates, 55 review leads, 0 inserted, 4 matched/merged, and 0 ingest errors.
  The Sokoto Sabon Gari record already existed with six abducted and one injured; the new
  military roundup corroborates that event as part of a 23-person rescue across two locations.
  Other admitted records also matched existing records. No new incident row was required.
  The artifact status was `REVIEW_REQUIRED`; the run preceded weekday-date parsing.
- Follow-up run `35873334644` on commit `c2c58c1` also completed all 37 state queries and
  parsed the weekday-dated Plateau report. It fetched 147/148 URLs (6 retries), admitted 5
  candidates, retained 36 review leads, inserted 0, matched/merged 5, and had 0 ingest
  errors. The job correctly ended `INCOMPLETE` because the Advocate Kebbi URL returned 403
  and its Jina retry timed out. Independent mirrors date that report to 18 Sep, outside the
  20–23 Sep window. MongoDB already held the admitted incidents; no new incident row was
  required. The run artifact is `incident-scan-report-35873334644`.
- The previously retried Borno report refers to the 17 Sep Gajiram attack already in MongoDB;
  Kebbi reports are dated 18 Sep and fall outside the 20–23 Sep audit window; the Plateau
  report overlaps already-adjudicated 19–20 Sep events. No additional in-window incident
  from those retry URLs was eligible for insertion.
- GitHub Actions is now the primary scheduler at 06:30 UTC (07:30 Lagos); workflow timeout is 60m.
- Netlify schedule declarations were removed from `netlify.toml`; production deploy
  `6ab3c6c6a415930008021f2e` for commit `2843a73` is ready and reports no function schedules.
  GitHub scheduled events can be delayed or dropped, so monitor run history.

### Env required for the cron
- GitHub Actions secrets: `MONGODB_URI`, `BRAVE_SEARCH_API_KEY`, `DEEPSEEK_API_KEY`.
- Netlify no longer owns a schedule for these jobs.
- Gemini/VertAII code is left in place but is no longer in the scheduled path.

### Do not repeat
- Do not rely on DuckDuckGo `df=` or Bing HTML for recency — both are ineffective/unusable here.
- Do not anchor relative date language to the run time; always use the article publish date.
