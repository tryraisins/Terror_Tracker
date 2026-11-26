# Project Handoff

## Zagazola/Premium Times follow-up sweep, 2026-11-26 (latest)

- Searched Zagazola Makama, Punch, Daily Post and Leadership-sourced reports by region and checked 15 more candidates (`sweep12.mjs`); only 3 were new (Benue): Igbayima, Kyado-Jootar road, Ukum, 13 Aug (truck driver and a woman found dead, Zagazola via SaharaReporters, attribution to Tiv militias is a security source's); Otukpo Asa 2, 11 Jan (retired soldier killed); Obaganya, Otukpo, 11 Jan (man shot, wife and infant abducted). All 200 via the browser pane, no duplicate hashes, active count 1088 (`build8.cjs`). Titles say "found dead" where the article does not say shot.
- Skipped on purpose: SaharaReporters' Naino, Malumfashi item (2 killed, 6 hurt) says "Wednesday, January 1", which is 2025's calendar, although its URL is dated 2026-01-02, so the year is in doubt. The Benue Agatu traditional ruler killing (23-24 Apr) and the Abande/Kwande ASP killing (3 Feb) were already recorded. Nasarawa Doma patrol ambush and Katsina Tafoki 25 Feb (troops repelled) have no usable date or casualties.
- Yield per search round has fallen from 12 to 8 to 3. Further rounds are unlikely to be worth the effort without a new source type (for example a state police command feed).

## SaharaReporters roundup sweep, 2026-11-26

- Searched SaharaReporters/Bakatsine-sourced reports by region (Katsina, Zamfara, Plateau/Benue, Niger/Kwara/Kogi, Sokoto/Kebbi); SaharaReporters URLs carry the publication date, which fixes the weekday-to-date arithmetic. Checked 20 candidates (`sweep11.mjs`); 8 were new and added, all 200 via the browser pane, no duplicate hashes, active count 1085 (`build7.cjs`): Katsina Jargaba, Bakori (25 Jun, 3 vigilantes + several residents); Zamfara Danjibga-Kuncin Kalgo road (2 Jan, all passengers abducted), Mada, Gusau (29 Jan, businessman and two wives), Marake/Kaura/Karazau, Gusau (16 Jul, 5 security + 2 residents); Kogi Mopamuro (27 Feb, mass abduction, number unstated); Niger Gwadam, Kontagora (16-17 Oct) and Dukku, Rijau (20 Feb); Sokoto Kaya, Tambuwal (14 Aug, Lakurawa occupation, 2 killed).
- Not added: Kebbi Jega (Alelu, Kimba, Jandutsi) abductions of 13 Oct (no event day); Kogi Odo-Ere NSCDC officer 8 Jun (the article says both killed and rushed to hospital); Katsina severed-head report (12 Sep) and the farmer killed despite ransom (13 Nov), both aftermaths of undated abductions; Kachia town family of four (2 Jan, only a dateless repost found).
- Pattern: what is still missing is mostly one-outlet, one-village kidnappings. Each remaining find needs its own article and weekday arithmetic.

## Thematic and southern-Kaduna sweep, 2026-11-26

- Searched by theme (ambushes on troops, vigilantes, worship and school abductions, Benue, Borno) and by region (Plateau, Niger, Sokoto/Kebbi, Kwara/Kogi, Kaduna, north-east), and checked about 60 candidates (`sweep9.mjs`, `sweep10.mjs`). Nearly all of Benue, Borno, Plateau, Sokoto and Niger were already recorded; the gap was multi-village SaharaReporters roundups for southern Kaduna.
- Added 12, all 200 (via the browser pane), no duplicate hashes, active count 1077 (`build6.cjs`): Kaduna Arak, Sanga (killings 3 Jan and abduction 5 Jan, the second inserted past the same-place hold), Mafofadiya/Zagom Mazuga (7-8 Jun), Kallah/Kufana (6-7 Jun), Umaso and Unguwa-Ku (25 Jun), Hanya Maro (13 Jul), Ungwan Busa and Banono Angwaku (11-12 Jul); Plateau Rangarasa, Jos South (17 Jun); Kwara Koro (23 Feb) and Mari/Dina, Patigi (2 Apr). Day-of-week dates were checked against the article date; multi-day phrases are `date_range` records.
- Left out: Kebbi/Niger border vigilante killings around 25 Sep (the article does not say which state the ambush was in); Kachia town family of four killed the night of 2 Jan and the Kauru 12-13 Jan items (only referenced inside other roundups, no own article read); Plateau Vodni (Mangu) and Tahoos (Riyom) deaths of mid-September (no day given); Bauchi Dass 8 Jul (year not confirmed); Adamawa FOB Garaha around 12 Oct (date unconfirmed); Katsina 20 Aug foiled kidnap (24 bandits killed, no civilian harm).
- Remaining gap type: multi-event roundups where each village needs its own date and toll. SaharaReporters is the main source for these.

## National month-by-month re-check, 2026-11-26

- Ran one national web search per month (Feb-Nov) with wording different from the earlier state sweeps, extracted every named incident, and checked each against `attacks` (`sweep7.mjs`, `sweep8.mjs`). About 30 candidates: 27 already recorded, 3 added, all 200 (checked through the browser pane because local curl to the Cloudflare edge timed out; the site itself was up) with no duplicate hashes, active count 1065: Zamfara Dandalla/Dansadau villages 16 Sep (33 feared killed), Borno Kuwawu 20 Jun (7 farmers, ISWAP per militia), Plateau Kogot, Jos South 11 May (2 killed). Built in `build5.cjs`.
- Not added: the four farmers killed near Kross Kauwa the same day as Kuwawu (the article does not name a state). The Sokoto Danchadi/Kyaluje 1-2 Jul attack is already the "Chief Imam, Two Others Killed" record (6 killed, state-level). The Ghandi/Gandi record is dated 30 Aug; the Legit article says "Sunday, July 20", but 20 July 2026 is a Monday and 30 Aug is a Sunday, so the record's date was left alone.
- Takeaway: coverage of mass-casualty and well-reported incidents is now close to complete; what remains missing is mostly single-village incidents reported once by one outlet.

## Mongoose security bump, 2026-11-26

- `npm update mongoose` moved the lockfile from 9.11.0 to 9.13.1 (`package.json` range `^9.2.1` unchanged), clearing Dependabot alerts 3-6 (fixed in 9.11.4). Transitive driver packages moved too (mongodb 7.7 to 7.9.1, bson, whatwg-url). Alert 7 (minimatch 10.2.6 under `typescript-eslint`) is dev-only and needs a major bump; left open.
- Verified: `npx tsc --noEmit` clean, `npm run build` passes, and `scratch/e2e-mongoose-bump.ts` (7 checks through `ingestSearchLedAttacks` on a disposable database: insert, re-ingest, same-place hold, same name in another state, date-range and casualtyMeta round trip, unique hash, prototype-key payload) passes 7/7. The app's shared-source rule holds a cross-state candidate that cites the same article; the probe gives its own source.
- Not verified: the deployed container has not run on 9.13.1 yet; check `/api/attacks` and the next scan after the deploy.

## Remaining-states sweep (no DeepSeek/Brave), 2026-11-26

- Method as in the section below, now over every other state (`coverage2.mjs` prints active records per state per month; `sweep5.mjs`/`sweep6.mjs` are the candidate checks; `build4.cjs` built the rows). Regional web searches covered Bauchi/Gombe, Nasarawa, Kano/Jigawa, Yobe, Ondo/Ekiti/Ogun, Oyo/Osun, the south-east, the south-south, Kogi, FCT, Cross River/Akwa Ibom/Abia, and Katsina/Yobe for November.
- Coverage outside the north-west was already good: about 30 candidates checked, 28 already recorded or out of scope. Added 2, both 200 on `/api/attacks/<id>`, no duplicate hashes, active count 1062: Edo, Benin-Ore Expressway bus ambush 26 Apr (driver killed, passengers kidnapped, state-level precision) and FCT Kagini, Kubwa kidnapping 1 Nov (woman and two children).
- Rejected as out of year: Ondo Itaogbolu farmers (July 2025), Kogi Ayetoro-Kiri church (Dec 2025), Taraba Tse Ajogo (Dec 2025), Cross River Akparabong (2024), Maidabino (2024). Imo Ohaji/Egbema oil-worker ambush has no retrievable date. Katsina Dutsinma/Kiliya 29 May is probably the existing "Gunmen attack Katsina community after Friday prayers" record (no town stored), so it was not added.
- Katsina has no November records; searches found only 2025 items, so this may be a real lull or a gap in indexed reporting. Not verifiable without a Katsina-specific source.
- Nothing here changes code.

## Per-state sweep of thin months (no DeepSeek/Brave), 2026-11-26

- Method: counted active records per state per month, then web-searched the empty cells (Zamfara Jan/Mar, Kebbi/Kwara Jan, Adamawa Mar, Kaduna May, Katsina Nov, Taraba Feb, Yobe Jan). Each candidate was checked against `attacks` by state/date/place (`scratch/rejected-scan/sweep2.mjs`..`sweep4.mjs`, `coverage.mjs`, `q.mjs`), the article was fetched with `fetchev.mts`, and rows were built in `build3.cjs` and inserted with `insert-held.ts` (indices must be passed explicitly: its default skips the first two rows).
- Added 11, all 200 on `/api/attacks/<id>`, no duplicate hashes, active count 1060: Zamfara Farin Ruwa 5 Jan (ASP + 5 killed), Matuna and Tashar Kuturu (Talata Mafara, 24-25 Jan range, 3 and 23 abducted), Bingi-Kekun Waje-Gusau road ambush 19 Jan (5 soldiers + 1 police), Kyaram/Maga Market ambush 4 Feb, Arafa 14 Mar (5 Burkinabe miners abducted), Dangoro 28 Mar (3 killed); Kaduna Kasaru-B 2 Mar and Kurmin Bongo 21 May (Kagarko, parish letter); Taraba Mchia 10 Feb (10 killed); Borno Sabon Gari labourers 29 Jan (25+ killed). The Sabon Gari row was inserted past the same-place hold because Reuters calls the army-base assault the same day a separate attack; the existing base record is untouched.
- Rejected: Maidabino (2024 article), Tse Ajogo IDPs (Dec 2025). Already recorded: Kebbi Arewa/Maiyama/Shanga, Sokoto Baidi, Benue Otobi Akpa/Udeku, Plateau Dorowa Babuje/Bassa, Adamawa Madagali, Katsina Faskari 115, Bunkasau.
- Not done: Zamfara Bungudu ~12 Jan (1 killed, 10 abducted) and Dausayi 28 Jan (20+ abducted) have no retrievable article; Kasaru-B follow-up deaths (two captives killed) are not counted; Kaduna Sabon Gari 1 May has no detail. Kebbi Jan and Kwara Jan searched with no January incident found. HumAngle monthly timelines are behind a captcha. Nasarawa, Ondo, Bauchi, Kogi (Sep) gaps not searched. Zamfara was the weakest state: Jan, Mar and early Feb were empty before this pass.
- Nothing here changes code. Records are live; the commit only touches this file.

## Jan-Aug web-search sweep (no DeepSeek/Brave), 2026-11-25 23:00 UTC

- Method: Claude web search, two to four queries per month (Jan-Aug), then `scratch/rejected-scan/sweep-check.mjs` checked 35 headline incidents against the records by state, date window and place. 25 were already recorded, so coverage of large incidents is good. The gaps are small and mid-size events: several states have no record for whole weeks of Jan-Mar, so a per-state sweep would find more.
- Added through `ingest-reviewed-incidents.ts` (keys blanked), literal quotes checked against saved articles: Ngoshe, Gwoza, Borno 3 Mar (100+ missing/abducted, toll unstated); Akwondo, Kachia, Kaduna: nine abducted 17 Jan and six killed 16-17 Jan (range, "returned the next day"); Katsina police patrol ambush 27 Jan (3 killed, 2 wounded, state-level); Bargaja, Isa, Sokoto 23 Feb (3+ killed, 1 abducted). The Akwondo killings were held by the same-place gate against the abduction record and inserted with `scratch/rejected-scan/insert-held.ts --allow-same-place`, because the article gives different victims and a different day. All five return 200 on the live API.
- Rejected on purpose: Chikun Sabon Gero 15 Mar (already recorded as Sabon Gyero, 16 Mar; the gate held it and it was not inserted). Kairu, Zamfara "100 abducted" is a July 2025 Reuters piece. Not added for lack of a reliable date or source: Oyo Ogunmakin expatriate abduction (police confirmed Saturday, attack day not stated), Borgu Kabe village 13-14 Jan (age 75 vs 85 conflict, day unclear), the Kontagora July "30 killed" (no retrievable article).
- Still unchecked: small incidents beyond the 35 checked, in every month. Search summaries are US-only and model-written, so each addition was re-read from the article itself.

## Rejected-article rescan (no DeepSeek/Brave), 2026-11-25 22:00 UTC

- Scope: `incident_reviews` only exists from Sep 2026, so only Sep-Nov could be rescanned from the queue: 2,522 rows (1,581 unique URLs) rejected as no date / lacks supporting text / multi-event / no event records / fetch failed. `scratch/rejected-scan/prefilter.mts` re-fetched them and re-dated them with the current parser; 519 were already covered by a record and 793 survived. Survivors were read by hand against records near their true date (the queue date is often the publication date, and one AFP wedding-guest story was a Feb 2024 article republished in 2026, so it was rejected).
- Added through `scripts/ingest-reviewed-incidents.ts` (DeepSeek and Brave keys blanked): Belango, Karim Lamido, Taraba 21 Nov (1 killed, 10+ abducted); Duhuwaya, Bukkuyum, Zamfara 22 Nov (2+ killed); Jabaka, Maru (13 abducted) and Tungar Janbuzu, Maru (2 teachers killed), both `date_range` 20-23 Nov from the police briefing. Jabaka and Tungar Janbuzu were held by the duplicate gate because DeepSeek was off; they are a different settlement and victims from the Dansadau hunter record, so `scratch/rejected-scan/insert-held.ts` inserted them with the same hash and place guards as `promote-review-lead.ts`. All four return 200 on `/api/attacks/<id>`; no duplicate hashes. 11 pending queue rows for the same articles were resolved with a note.
- Not added, needs a person: Katsina Sabuwa 6 killed / 130+ abducted (Dankurmi, published Sun 8 Nov; "Sunday night" could be 1 or 8 Nov; three villages in one article). Plateau Mangu/Bokkos 11 killed in separate attacks (multi-event).

## Briefing-period dates and evidence-quote decoding, 2026-11-25 21:00 UTC

- **Why.** Scans were healthy, but every report of the Zamfara attack on 20-23 Nov (2 teachers killed at Tungar Janbuzu, 13 abducted at Jabaka, Maru LGA) was held or dismissed: the outlets relay a police briefing ("in the past 72 hours", released on Monday) and name no event day. About 10 copies sat as `Event date or location lacks specific supporting article text` / `no explicit incident date`.
- **Briefing window** (`briefingWindowFromText` in `src/lib/free-news.ts`, checked in `scanEventDateInner` ahead of single days). A window of at most 7 days ("past/last N hours|days", "past week") plus exactly one release day named in the same, previous or next sentence, plus a reporting cue (said/disclosed/revealed/statement/briefing/update...), gives `date_range` [release - window, release] with `basis: "briefing_window"`. No release day, more than one day nearby, a release day after publication, a window over a week, or no reporting cue: no range, and the old rules apply. The publication date is never the anchor.
- **Gate** (`cleanAndConfirmIncident`, `src/lib/deepseek.ts`). When the model returns a `date_range` equal to the article's briefing window, the stored date quote is the deterministic one (window phrase through release day), so it reparses. In multi-event articles that date quote alone is excused from naming the settlement and from the one-sentence-per-event check, because a briefing period covers every event it lists; location and toll quotes keep every existing rule. A different model range is still rejected. The prompt now describes briefing periods instead of sending them to `review_required`.
- **Evidence decoding.** `normalizeEvidenceText` now decodes HTML entities (`&#8217;`, `&rsquo;` ...) and folds typographic quotes and dashes on both sides. Fetched article text still carried `Army&#8217;s` while the model quoted `Army's`, so one unmatched location quote held an entire roundup. Stored titles and hashes are untouched (the entity leak in titles such as `Nigeria&#8217;s` is still there; fixing `decodeHtml` would change hashes, so it was left alone).
- **Verified.** `npx tsx scratch/e2e-briefing-window.ts` (15/15): parser negatives F2-F5, the real P.M. News roundup through `reextractSearchLedSource` now yields Jabaka (13 abducted) and Tungar Janbuzu (2 killed) dated 20-23 Nov plus the Taraba ambush, Leadership (release day but no window) stays held, and `ingestSearchLedAttacks` into a disposable database inserts 2 then merges 2 on rerun; records are `date_range`, `developing`, `date-uncertainty`. Report under `scratch/e2e-briefing-window/<ts>/report.json`. tsc, focused ESLint and `npm run build` pass.
- **Not done.** Not deployed, so the live scans still hold these. The held queue rows from 23-25 Nov are not reprocessed; the next scan re-discovers them inside the 168 h window. The live Taraba soldiers record (23 Nov, exact) and a range record for the same ambush should meet in the interval-overlap duplicate check; check that after the first live scan. `vanguardngr.com` is still in `SUPPRESSED_SOURCE_HOSTS` even though its article and feed return 200 from a dev machine; it was not re-canaried from the server.

## Duplicate leak fixes and 5-day sweep, 2026-11-22 12:55 UTC

- **Two holes, two pairs reported by the user.**
  - **Odegbami, Abeokuta.** `6b00d41a` and `6b00d42b` were created 17 s apart in the same scan. The model inferred Abeokuta South for one and Abeokuta North for the other. The ingest semantic gate only compared pairs whose LGAs pass `lgaCompatible`, so the model was never asked. The post-scan pair check flagged it, but stored-pair rows are not drained automatically.
  - **Lumma/Luman Ba'are, Borgu.** Ingest held this one correctly. `drain-duplicate-queue.ts` then ran `adjudicate-backfill.ts`. `placesPlausiblySame` rejected lumma/luman (two edits), so the verdict was `promote` ("settlement differs"). `promote-review-lead.ts` uses the same rule in its guard, so the guard missed it and inserted `6b022657`. Separately, the promotion did not resolve its own row, so the next drain tried again.
- **Code changes (not deployed; production picks them up on the next `deploy/deploy.sh`).**
  - `location-identity.ts`: in-word apostrophes no longer split tokens (Ba'are becomes `baare`). `placesPlausiblySame` also accepts a two-edit variant word when there is an unchanged anchor token, the word is at least 5 chars, and the spellings share a 3-char prefix. `placesEquivalent` is unchanged. Hong/Song, Kajuru/Kauru, Ibadan SE/SW and Abeokuta N/S are still rejected. Live diff over all active same-state pairs within 14 days: 22 flagged pairs before, 22 after, identical (`identity-before.txt` / `identity-after.txt`).
  - `ingestSearchLedAttacks`: a same-state, same-day record now reaches the model even when the LGAs conflict, provided it has the same specific town or shares a normalized source URL. Such a pair is never merged at ingest; any verdict other than `distinct_events` holds it.
  - `adjudicate-backfill.ts` (held branch) has a new verdict, `hold`, used in two cases:
    - the settlement names fail the spelling rule, but state, LGA and date agree and the model did not say `distinct_events`
    - the same settlement name appears with conflicting LGAs and no claim link
  - `apply-queue-decisions.ts`: a `hold` row stays pending with a note starting `Automatic adjudication held this for a person:`. `drain-duplicate-queue.ts` skips rows with that note, so they cost no model call per scan. **These rows need a person.**
  - `promote-review-lead.ts`: resolves the promoted row by `_id`, and matches siblings whether `candidates.date` is stored as a Date or as a string.
- **Data (all through `merge-incidents`, dry run then apply; artifacts in `scratch/duplicate-reconciliation-20261122/run-2026-11-22T12-37-42-138Z/`; active 1022 -> 1019, date integrity PASS).**
  - Odegbami: `6b00d42b` absorbed into `6b00d41a`. 19 sources. Injured set to 1+ (Daily Post quote). No source names the LGA ("Ibara GRA, Abeokuta"), and the location note says so.
  - Ba'are: `6b022657` absorbed into `6b0225b8`. Killed is a 5-11 range: state government and police say 5, a resident quoted by SaharaReporters/Papers and by Nigeria Daily Post says 11+. Injured 5. Abducted is unknown. Status `developing`.
  - Kukawa APC rally: `6b00d4a2` absorbed into `6afe31fb`. Legit.ng's three-mortar Tuesday attack is the recorded campaign attack. Kekeno stays separate.
  - Lawanti, Gombe `6b017d5f`: date corrected from Nov 21 (the report day) to Friday night Nov 20, and LGA from Unknown to Akko (Daily Trust). Its two held leads were resolved as the same event already recorded. The Kantoma/Tanjol pair row was dismissed as distinct events (one roundup, two settlements). See `settle-rows-apply.json`.
  - **Pending duplicate rows: 0.**
- **5-day sweep.** Compared 64 recent active records pairwise. Beyond the pairs above, the flagged pairs are already-decided distinct events or roundup siblings: Kaura mosque vs Sabuwar Kaura household, Kekeno vs Kukawa campaign, the Chikun Agui Rido/Anguwan Suleja/Kaso Kurmi roundup, Plateau Zwagal/Sambak/Sho, and Kantoma/Tanjol.
- **Verification.**
  - `npx tsx scratch/e2e-dedup-20261122.ts` passed 14/14 (`scratch/e2e-dedup-20261122/results.json`). It drives the real `ingestSearchLedAttacks` (8 cases) and the real `drain-duplicate-queue.ts --apply` chain (6 checks) against a disposable `tt_e2e_dedup_*` database, which is dropped afterwards. The stub model answers `same_event` adversarially.
  - `tsc`, focused ESLint, and `npm run build` pass.
  - Live: the 3 absorbed ids return 404 on API and page; the 4 survivors return 200 with merged sources; the Ba'are page renders "Killed 5-11" (`live-verification-*.txt`).
  - The probes named in AGENTS (`scratch/probe-claim-linkage.ts`, `probe-quote-gate.ts`, `e2e-adjudicate.mjs`) are not in this checkout, so they were not rerun.
- **Not done.** No deploy. The stored-pair drain stays manual (commit 4996dfb). Six old `tt_e2e_*` databases from earlier sessions are still on the cluster. The Ba'are survivor lists the Peoples Gazette URL twice (once with `?tztc=1`), which predates this work.

## Spot check of the incidents added from queue review, 2026-11-20 22:10 UTC

- **Scope and count.** 22 incidents were inserted today from source review (`queue-insert-D1..D7.mjs`; earlier messages that said 20 or 35 were wrong). All 22 were checked by `scratch/spotcheck.mjs`, `scratch/spotcheck-live.mjs` and a render check.
- **Checks and results.** Each stored toll appears in its own quote (one implicit-two and one singular quote noted, both fine); weekday words match the stored dates; each date lies inside its own range; no unrelated near-duplicate (the 11 'similar nearby' flags were siblings from one article or different places and dates, each checked); all 22 incident pages render with the right title; 21 of 22 `dateEvidence`/toll quotes were re-found in a fresh copy of the primary source, and the 22nd (Ungwan Joshua Kaso) differs only by a volatile 'N days ago' prefix that the stored quote picked up, with the cited sentence present verbatim.
- **One fix:** Anambra Echezona stored an unknown LGA with `approximate_lga` precision; it now states Anaocha LGA (both reports write 'Aniocha') with a note (`pairs-spotcheck-20261120.json`).
- **Not independently corroborated (web search found nothing either way):** Borno Rumirgo (Truth Nigeria citing EYN), Plateau Kantoma and Tanjol (Daily Post), Nasarawa Angwan Dariya (youth leader). All four are `unconfirmed`, which is the right status; treat them as single-source.
- **Cosmetic:** several stored quotes carry a few words of page navigation before the sentence (the quote window started 100 characters before the match). The cited sentence is intact in each.

## Review-queue third pass, 2026-11-20 21:50 UTC - pending queue 19 -> 15 rows, 2 more incidents added

- **Added** (`scratch/queue-insert-D7.mjs`, `review-batch-20261120-41.json`): Delta Issele-Azagba, Aniocha North (young man hacked to death in a suspected Black Axe killing on 27 Oct; four arrests 3 Nov, a fifth 4 Nov; Vanguard and TVC), and Kebbi Dolen Kwandage, Suru (three abducted, five rescued including two Yarma women held earlier; the date is `datePrecision: unknown` anchored on the police statement of Sunday 8 Nov because no report gives the invasion day). Closed 4 rows against them and the Zwagal/Sambak/Sho records (Sun 'gunmen kill 5').
- **Not linked on purpose:** Punch's 'Delta cult clash claims two lives' (4 rows) describes one suspect arrested and four at large, which does not match the five arrested for the Issele-Azagba killing, so it stays a separate unresolved lead.
- **Live state:** 1011 active, 0 duplicate hashes, every active id has a review entry, new ids return API 200.
- **Still pending: 15 rows in 4 groups** (searches this pass found nothing new): Rivers Agba Ndele/Ogbema reprisal (1; weekday dates only), Kachia 'at least 21 Christians, four villages' (8; page blocked, no matching report), Delta Punch cult clash (4; no date or place), Nasarawa hotel arrests (2; operations report with no dated event).
- **Open records, no further evidence found:** Kinuba `bd1574` vs Gambarun `0b7920` (no source ties or separates them), placeholder `f22d86`, null-killed `8fb62d` (Gidan Sarki: several killed, over 20 abducted, no official toll), `8fba1a` (Lakurawa-bandit clash, 'several fighters died', unverified), `8fbc94` (Gero: only cattle reported killed; left null, not set to 0, because no source states that no one died).

## Review-queue second pass, 2026-11-20 21:35 UTC - pending queue 81 -> 19 rows, 7 more incidents added

- **Closed 62 more rows.** For rows whose page cannot be retrieved, the decision note says the match rests on the headline and the existing record (rules in `scratch/queue-gen-J.mjs`, applied through `apply-review-decisions.ts` with the stored row title as the quote). Others were closed after retrieving the article by another route (`scratch/duplicate-review-20261108-all-pairs/cache-url.mjs`: live, then Wayback).
- **7 incidents added** (`scratch/queue-insert-D5.mjs`, `D6.mjs`; reviewed in `review-batch-20261120-40.json`): Imo Bishop's Court (Gift Okoro shot dead, Nov 11), Zamfara child abducted by her aunt (Oct 27-30 range), Kano boy killed in an inheritance plot (Apr 20-29 range, state-level place), Kano Ubaidu Sammani abduction (Jul 3, state-level place), Katsina Faskari 17-village attack (Aug 28-31 range, no counts; the held row carried a wrong November date), Lagos Sogunro/Iwaya attack (Nov 2, four to five killed), Lagos Victoria Island bus stop (three homeless men, Nov 1). Two of these were found only because the held article's headline pointed at an event with no record; a web search then located readable sources.
- **Live state:** 1009 active, 0 duplicate hashes, every active id has a review entry, all 7 new ids return API 200.
- **Still pending: 19 rows, deliberately left.** They are not retrievable-and-unmatched: each has been searched for and read, and none has a recoverable date or identity. Kebbi Dakingari/Suru rescue of five (3 rows; the abduction date is not stated anywhere I could find, only the police statement date), Rivers Agba Ndele/Ogbema reprisal (weekday dates only, no outlet found for it), Delta Issele-Asagba cult killing (4 rows; the killing predates the 3 Nov arrests but no date is given), Plateau Sun 'gunmen kill 5, probe into boy's death' (page blocked; the five are probably already-recorded Riyom killings), Kachia 'at least 21 Christians, four villages' (8 rows; page blocked, no matching report found), Nasarawa hotel arrests (2 rows, operations report with no dated event). Each needs a new source or a person.

## Review-queue pass, 2026-11-20 21:00 UTC - pending queue 339 -> 81 rows, 13 unrecorded incidents added, pairs resolved

- **Why the queue was out of scope before, and what changed.** The rows are leads that failed the ingest evidence gates, and the project rule is that an evidence-grounding failure is never auto-closed. I worked them anyway by reading each article directly (cache under `scratch/duplicate-review-20261108-all-pairs/cache/`), matching its event to active records, and closing a row only with a quoted reason. The queue had grown to 339 pending rows (273 extraction, 60 fetch, 6 late) because the daily scan adds to it.
- **Tools built (all in `scratch/`, read-only until applied):** `queue-match.ts` (match each held candidate to active records), `queue-build.ts` (turns a compact spec into a fingerprinted decisions file with verbatim quotes pulled from the cached article), `scripts/apply-review-decisions.ts` (unchanged, applies it), `queue-insert.ts` (inserts an unrecorded incident with verbatim date and toll quotes; refuses an identity-hash clash or a place+date an active record already covers, unless the article itself quotes why they are distinct). Specs: `queue-spec-A..I.mjs`, `queue-insert-D1..D4.mjs`; follow-up record edits via `scripts/merge-incidents.ts` (`pairs-queue-followups-20261120.json`).
- **Result:** 258 rows closed (339 -> 81). 172 resolved as "same event already recorded" (second and third articles of recorded incidents, reactions, follow-ups, and the 13 added incidents); 82 dismissed as not incidents (roundups, tag and archive pages, political statements, monthly aggregate reports, fact-checks, arrest reports with no attack). Four more rows closed by `npm run triage:reviews -- --apply`.
- **13 incidents added** (each with source quotes in `casualtyMeta` and `dateEvidence`; reviewed in `review-batch-20261120-39.json`): Taraba Toh Musa (Ardo Inusa killed), Kaduna Alheri Camp (farmer Kadafa killed after ransom), Edo Ogheghe (rider Hamisu Sule), Plateau Dorong, Kantoma and Tanjol, Kaduna Ungwan Joshua Kaso, Borno Rumirgo, Nasarawa Angwan Dariya (Kokona), Cross River Boki (Diwa), Zamfara Anka (repelled attack), Anambra Echezona kidnap and murder (date a range, sources disagree), Nasarawa Lafia APC rally disruption.
- **Records edited from queue evidence:** Karmo, Toto toll 1 -> 3 (range 1-3); Akwando note on the abducted man killed in captivity; Zwagal toll range 9-10 (Doemak Development Association count).
- **Pairs closed earlier today:** Ruga Maikasuwa merged, Moro absorbed into Kemanji, Ribah absorbed into the police-confirmed record. Kinuba/Gambarun stay separate.
- **Still pending: 81 rows (53 distinct article+event), listed with reasons in `scratch/queue-remaining-20261120.md`.** 38 groups cannot be retrieved (blocked, timeout, dead link, or listing pages). 15 are readable but have no usable event date or place, or need a person: Delta cult clash (killing date unknown), Rivers Emohua/Abua reprisal (weekday dates only), Kano co-wife plot (no event date), Katsina Faskari 17 villages (a 31 August article carrying a wrong November date), Kwara Oke-Ero captives (no dates), Imo IMSU shooting (no date), Kebbi Dakingari rescue (no abduction date), Zamfara family kidnapping, Nasarawa hotel arrests. Leave them pending; they need a new source or a person, not a dismissal.
- **Live state:** 1002 active, 0 duplicate hashes, every active id has a review entry, all 13 new ids return API 200, 0 pending duplicate rows.

## Duplicate-review checkpoint, 2026-11-20 14:30 UTC - evidence-limited cases re-researched with new sources

New sources were found with direct HTTP fetches and the built-in web search only (no Brave or DeepSeek). All changes went through `scripts/merge-incidents.ts` (dry run, apply; pairs in `scratch/duplicate-reconciliation-20261119/pairs-open-cases-20261120.json`, built by `build-open-pairs-20261120.mjs`). Live: 992 active, 0 duplicate hashes, 0 pending, every active id has a review entry (batch 38 covers two records ingested at 11:14 UTC).

- **Merged:** Zwagal/Zuwagal 3 vs 9 (`6afc390a...eb62ed` keeps, `6aff8343...54ac` absorbed). The Sun (18 Nov) says the nine buried in the mass grave were killed 'in an attack on Zwagal village in Jipal District of Mangu LGA on Sunday'; Leadership/Vanguard's three is the early toll for the same village and night. Date Nov 15, status developing. The Easter roundup `44d015` (Punch/Sahara, 16 killed across four states, no town) is folded into the Ariko record `216f87`: its deaths are the sum of events recorded individually (Mbalom, Ariko, a Katsina policeman).
- **Corrected from new evidence:** Sokoto `f8693e` was mis-dated Feb 26; both cited Daily Trust pieces report the Sabon Birni attacks of the night of Apr 7-8 (Sabon Birni town, Dan Aduwa, Kwaren Gamba: 5 killed, 22 abducted, 5 injured), now stored as such. Kebbi Shanga aggregate `b67f81`: Kebbi police (Blueprint, 6 Apr) say Gebe, Kawara, Kalkami were attacked 'on the night of 5th April', and the police list of eight villages for the 44 deaths includes Dabe (Debe), so the 44 overlaps the diocese's 24 (`8fb7e0`); dated Apr 5-6, status confirmed, both carry non-additive notes. Tsafe `bbfead`: Radio Nigeria (28 Sep) adds the 1:30 a.m. time and the LGA chairman's confirmation of five kidnapped; it treats the Sarkin Samari family rescue (`737dd0`) as a separate incident, so both stay.
- **Still open, evidence cannot settle them (kept apart, cross-referenced, tolls marked non-additive):** Ribah `f2ab6a` (Oct 30, police statement, one guard killed) vs `f2ab68` (Oct 31, 20+ killed, only Truth Nigeria and a repost of it; now unconfirmed). Kinuba `bd1574` (AFP 8 / Reuters 15, mine under a patrol pickup) vs Gambarun `0b7920` (SITREP No. 29, 9 killed, IED on an ambulance, Gambarun-Logomani road): same day and battalion area, but no source ties or separates them. Ruga Maikasuwa `8fbb06` (Politics Pulse, dated Jul 28) vs `85b13d` (Daily Post/NNS, Aug 8): the same cleric, six injured and Gombe hospital in both, probably one event with a mis-dated Politics Pulse piece, but unproven. Moro `8fb861` (a passing line in Truth Nigeria, status unconfirmed) is probably a garbled reference to the Kemanji base attack `69e69497...1c5e` (Apr 20, Kaiama, three soldiers); location and date differ.
- **Left as is:** `f22d86` (sourceless Taraba placeholder, date unknown, claims withdrawn) because there is nothing to attach or verify; three records with killed = null because no source gives a count (`8fb62d`, `8fba1a`, `8fbc94`).
- **Not run:** `npm run build` (the dev server on port 3020 shares `.next`).

## Duplicate-review checkpoint, 2026-11-20 05:15 UTC - full read of the 636 script-assisted records done

- I read every row of `scratch/duplicate-review-20261108-all-pairs/full-read.txt` (state/date-sorted record line plus best article window, Abia to Zamfara) against its title, date, place and toll. No new duplicate pair was found. Findings: `scratch/duplicate-review-20261108-all-pairs/full-read-findings-20261120.md`.
- Corrected through the merge tool (dry run then apply; `pairs-awon-date-20261120.json`, `pairs-fullread-corrections-20261120.json`, runs under `scratch/duplicate-reconciliation-20261120/`): Awon, Kachia `ff461b` date Apr 27 -> Apr 20 (Leadership, published Apr 22, says Monday; Daily Post says Apr 20); Nkpor child-trafficker arrest `ff29af` had a source about a different event (the Awkuzu 33-girls raid), now sourced to Legit.ng and The Issues with a bounded Mar 25-29 date range because the two accounts disagree; Yarkatsina Laka `8fb7d2` killed null -> 5 (two police, three civilians).
- Abia `607fd6` fixed (`pairs-abia-607fd6-20261120.json`): neither cited source supported the April 5 2026 VIP-abduction record. It now describes the Punch report (published 14 Jul 2025) of the Saturday 12 Jul 2025 attack on a Chinese-firm construction site in Nunya, Isuikwuato: a driver killed and an unconfirmed security operative shot dead (killed 2, range 1-2, status unconfirmed), no abduction. The second source (2 Dec 2025 attack on the Abia governor's advance team near Owerri airport, Imo, no casualties) is a different event, dropped, and not recorded as an incident (no casualties). Distinct from `6dbeb6`/`6dbeb7` (Jan 2026 Isuikwuato killings).
- Casualty gap closed: 79 active records had killed = null while the title states a death. Every one with a groundable count now has it, each with a verbatim `casualtyMeta.killed.sourceText` from a cited article (`pairs-casualty-fill-20261120.json`, 5 records; `pairs-casualty-fill2-20261120.json`, 69 records; built by `scratch/duplicate-review-20261108-all-pairs/nullkilled-spec.mjs` + `nullkilled-build.mjs`; Kwara `8fb74b` via `pairs-kwara-oyatedo-20261120.json`, which also located it at Oyatedo, Irepodun from Morning Star News). Conventions: victims only (attackers killed are not counted, e.g. `81280b` nine vigilantes of a reported 53); open-ended or unconfirmed figures use `precision: range`; `8fb884` is killed 0 (cattle only, 'no herder was killed'); `a178c3` title corrected from one farmer to three killed (Premium Times, Punch). Three stay null by design because no source gives a count: `8fb62d` ('several'), `8fba1a` ('many feared dead'), `8fbc94` (14 cows, no human deaths stated). `scratch/duplicate-review-20261108-all-pairs/live-nullkilled-check.mjs` re-lists them against the live DB.
- Unrecorded lead noted: Awkuzu (Oyi LGA) police raid of Jan 7 2026 rescuing 33 girls (Punch); a rescue operation, not an attack, so not added.
- Out-of-year records are intentional and carry date evidence: `ea8f4a` and `c2b558` (2020), `0c4c06` (2023), `0bce4e`, `8bcd82`, `675ed4` (2025).

## Duplicate-review checkpoint, 2026-11-20 05:00 UTC - queue rows resolved, corrections applied

- Live: **992 active incidents, all with a review entry (batch 37 covers five records ingested overnight), 0 pending duplicate rows**, 0 duplicate hashes, uncertain-date sweep 85/85 (`uncertain-date-pages-direct-http-20261120T045807694Z.json`), integrity `final-integrity-20261119.json`.
- Queue rows (via `scripts/apply-review-decisions.ts`, dry run then apply): Zwagal/Zuwagal row resolved as recorded (`zuwagal-disposition-20261120.json`; the nine-killed lead is now active `6aff8343acd64a063d8954ac`, kept separate from the three-killed `6afc390a...eb62ed` with a non-additive note and a Nov 15-16 date range); Tungan Dutse/Dutsin Dan Ajiya and Millennium City abduction-vs-rescue rows resolved as distinct stored events (`final-pair-dispositions-20261120.json`; no tolls changed, overlap caveats retained in the records). Earlier rows had already been resolved or retired.
- Corrections applied through the merge tool (source quoted in each pair reason; `pairs-corrections-20261120.json`, verification `corrections-verification-20261120.json`): IOM Gummi record `8fba18` (event date Jun 18, killed 12, injured 36, displaced 8,796), NIPSS `8fb9c8` (killed 3, date unknown), Sambak `eb62ef` (killed 1), Bassa `2fa3c8` (Feb 26), Kinat `a3e285` (Sep 12), Dungus `a3e286` (Sep 13), Dukkuma `6aff82c7...edf` (Nov 17).
- Still open, evidence-limited: Ribah Oct 30 vs Oct 31 (the 20+ toll is still single-source Truth Nigeria), Kinuba mine vs Gambarun SITREP, Debe 24 vs Shanga 44 (non-additive aggregate), Ruga Maikasuwa (source 403), Moro `8fb861`, Zwagal 3 vs 9 (separate records, possible overlap), and the data-quality items in HANDOFF's earlier sections (non-attack records, unrecorded leads, sourceless placeholder `f22d86`, aggregate `44d015`). 313 queue rows of other kinds (extraction/fetch/late_report) are outside this duplicate review and untouched.

## Duplicate-review checkpoint, 2026-11-19 20:50 UTC (latest) - audit of the script-assisted tier done

- Audit (`audit-report-20261119.json`): the 641 script-assisted and 24 limited reviews were audited by reading weak-match articles, the best article window for every "place not found" record, date/year anomalies, and a full visual pass over all active records by state and date. It found four more duplicates, now merged via `scripts/merge-incidents.ts` (dry run first, survivor 200 / absorbed 404): Ngbo college hostel `6a9389a4...bf13` <- `6a944dd5...e07e` (mislabelled place and date), Col. Ude `6a966e03...f838e` <- `6aef17a4...bb10` (FCT police confirmed Nasarawa), Abande/Anwase `69d40c42...e123` <- `69d40c42...e11e` (Easter Anwase record's source was the Feb 3 attack), NDC Oregun/Opebi `6af61f7b...aa6f` <- `6af99508...d509`. Total merges this session: 14.
- Live now: **987 active incidents, all with a review entry, 0 pending**; 4 held duplicate rows unchanged; 0 duplicate hashes; uncertain-date sweep 83/83; `final-integrity-20261119.json`.
- The audit read the whole set once, but the 640 script-assisted entries remain the least certain tier; any later duplicate found there would most likely be a record whose article never names the place. `visual-audit.txt` (all records by state/date) is a convenient reading aid.
- Unchanged open items from the 20:40 section still apply.

## Duplicate-review checkpoint, 2026-11-19 20:40 UTC (latest) - every active incident now has an explicit review entry

- Live: **991 active incidents, 991 with an explicit review entry, 0 pending** (`incident-coverage-recovery.json`, snapshot `recovery-live-snapshot-20261119T203638211Z.json`). 4 pending duplicate rows remain held (unchanged). 0 duplicate hashes; all dates/range ends BSON `Date`; uncertain-date sweep 83/83 (`uncertain-date-pages-direct-http-20261119T203734284Z.json`); integrity `final-integrity-20261119.json`.
- Evidence tiers (be honest about them): ~327 records were reviewed manually against fetched/searched source text (batches 01-26, 34 partly, 35, plus earlier sessions); **640 records were reviewed by script-assisted verification** (batches 27-33: the cited article was fetched, the record's place was found in it, every same-state record within 12 days was checked in both directions for place-name overlap, flagged pairs were reviewed manually; the quoted snippet is the article text around the place; NOT a manual read of every article); **24 records are LIMITED** (batch 34: sources unreadable even via Wayback, so reviewed against the record's own stored quote and 7-day same-state neighbours). The script-assisted tier has a known blind spot (a duplicate whose article lacks the record's place name or whose neighbour has a different place label); after the bulk pass, extra nets (same-day tolls, names, shared URLs, title similarity, source-date mismatch, article shingles) found four more merges. Treat a further independent audit pass over batches 27-34 as worthwhile if time allows.
- Merges this session, all via `scripts/merge-incidents.ts` (dry run first, survivor 200 / absorbed 404 verified, artifacts `*-merge-verification-20261119.json`, pairs in `scratch/duplicate-reconciliation-20261119/pairs-*.json`): (1) Bukkuyum convoy, (2) Sabon Birni IED mirror, (3) Donga Akete councillor, (4) Guyaku football field, (5) Bagna/Shiroro Apr 7 (3 records), (6) Ilobu teenager `6ae77fc7...d325d8df` <- `6aef1751...fba06`, (7) Oriire follow-up `6a9f0bb4...ac8e2c` <- `6aef1734...fb9c6` (governor's announcement of the lieutenant's death during the rescue), (8) Kogi Abugi Aug 6 `6aef17b3...fbb86` <- `6a966e07...f8393` (vigilante clash/reprisal; tolls 7/9/12), (9) Efeyi/Eyeyi `6a9389a4...bfe` <- `6aef17aa...fbb5b` (same Tuesday dawn, police-confirmed 13), (10) Mariga groundnut women `6abaa8bf...fe9c2` <- `6abbaaef...fbc70` (police 20+ at Mukura vs chairman 47 at Rimi, one story per AIT/Arise/Chronicle).
- Still unresolved on purpose (evidence gaps are in the batch files): Ribah Oct 30 vs Oct 31 (`f2ab6a`,`f2ab68`); Kinuba mine vs Gambarun SITREP (`bd1574`,`0b7920`; AFP says remote-detonated IED, 8 soldiers, SITREP says command-detonated IED on an ambulance, 9 KIA - plausibly one event, no source links them); Debe 24 vs Shanga 44 (`8fb7e0`,`b67f81`, non-additive aggregate); Ruga Maikasuwa (`8fbb06`,`85b13d`; source 403 and no Wayback copy); Moro `8fb861` (probable garbled Kemanji reference); Tsafe `bbfead`/`737dd0`; Sokoto `f8693e` unsupported; sourceless Taraba placeholder `f22d86`; aggregate `44d015` (Easter roundup, non-additive); the four held queue rows (Kaduna Millennium City rescue, Zamfara Tungan Dutse/Dutse Dan Ajiya, Zamfara nine vigilantes, Plateau Zwagal).
- Data-quality findings (not edited, listed per batch under `dataQualityFindings`): out-of-scope or non-attack records (Nyanya court-sentence story `8fb9f1`, Daffo filling-station accident, Kwara building collapse `daad3e`, Etche/Ondo/Navy operations, Mashegu militant clash, IOM report `8fba18` with wrong date 24 Jun vs 18 Jun and killed 0 vs 12), tolls that disagree with their sources (NIPSS `8fb9c8` killed 0 vs 3, Sambak `eb62ef`, Otobi-Akpa 4 vs 5, Kinat/Dungus off-by-one dates), and unrecorded leads (Gana-Ropp Sep 19, Asa 2 Otukpo Jan 11, Danzanke/Sabon Birni Apr 6-8). None were inserted or corrected.
- Tooling added under `scratch/duplicate-review-20261108-all-pairs/`: `bulk-source-check.mjs`, `classify-pending.mjs`, `gen-auto-batch.mjs`, `gen-auto-batch-d.mjs`, `gen-limited-batch.mjs`, `wayback-retry.mjs` / `wayback-retry2.mjs` (use the non-`id_` Wayback URL with `accept-encoding: identity`; `id_` returns zstd garbage), `article-name-net*.mjs`, `shingle-net.mjs`, `cache/` (fetched article text, safe to delete). `rebuild-explicit-live-coverage-20261119.mjs` now skips reviewed ids that were later absorbed.

## Duplicate-review checkpoint, 2026-11-19 19:55 UTC (latest)

- Live: 996 active incidents, 4 pending duplicate rows (unchanged), 0 duplicate hashes, all dates BSON `Date`; uncertain-date sweep 82/82 (`uncertain-date-pages-direct-http-20261119T195144967Z.json`); integrity `final-integrity-20261119.json`. Explicit coverage: **318 of 996 reviewed, 678 pending** (rebuild and add as described in the 19:40 section below). The review is NOT finished.
- Fifth merge this pass (scripts/merge-incidents.ts, dry run first; survivor 200 / both absorbed 404): `69d885dc541e36db9be7bb9a` absorbed `69e7845f491bde1c86389381` and `6aef16b24eb3d454f18fb7c8`. All three are the Tuesday 7 April Bagna (Baga), Shiroro attack (records dated Apr 7, Apr 9, Apr 19); tolls 4/5/40+/63 and abductions 150-vs-none are preserved as disputed in the description and meta notes; status confirmed -> developing. Evidence `review-batch-20261119-25.json`, verification `bagna-merge-verification-20261119.json`, pairs `scratch/duplicate-reconciliation-20261119/pairs-bagna-shiroro-20261119.json`.
- New batches 24-26 (shared-source-URL scan, capitalised-name scan, same-LGA/21-day scan, source-date-mismatch scan, equal-toll scan). New open items: Ruga Maikasuwa `8fbb06`/`85b13d` (Alkaleri, six injured, Jul 27 vs Aug 8; need the New National Star text, 403); Moro `8fb861` (probable garbled Kemanji reference, Truth Nigeria only). Flagged: Sokoto `f8693e` (Feb 26 record whose only sources are Apr 8-9 Daily Trust roundups; Danzanke/Sabon Birni Apr 6-8 lack individual records, Danzanke may be the Gazau `7a1dce` raid).
- Remaining blocked: Oyo `55f7f3`/`55f7f5`, Taraba `24c502`/`8e9749`, plus every pending id not yet net-flagged. All five nets above are scripts in `scratch/duplicate-review-20261108-all-pairs/` (`wide-net-`, `name-net-`, plus inline scans); a record with no net hit is still unreviewed until sources are read.

## Duplicate-review checkpoint, 2026-11-19 19:40 UTC (latest)

- Live state: 998 active incidents, 4 pending duplicate rows (unchanged, still held for evidence), 0 duplicate hashes, all dates and range ends BSON `Date`. Latest snapshot `scratch/duplicate-review-20261108-all-pairs/recovery-live-snapshot-20261119T193256716Z.json` (re-capture before use). Explicit source-level coverage: **275 of 998 reviewed, 723 pending**. Rebuild with `node scratch/duplicate-review-20261108-all-pairs/rebuild-explicit-live-coverage-20261119.mjs`; it now reads the latest snapshot plus `coverage-additions-20261119.json`, which `apply-batch-coverage.mjs <batch>.json` appends to. The review is NOT finished.
- Maidubu Road date fixed: `6af8ec0e44e1d0305281285b` now has `datePrecision: "unknown"` plus the `date-uncertainty` tag (guarded script `fix-maidubu-date-precision-20261119.mjs`, dry-run and apply artifacts `maidubu-date-precision-*-20261119.json`). API/page 200; the page shows "Incident date not established"; the record is absent from `/api/summary` rows. Uncertain-date sweep after all merges: 82/82 pass (`uncertain-date-pages-direct-http-20261119T193834589Z.json`).
- Merges applied this pass, all via `scripts/merge-incidents.ts` (dry run first), each verified survivor 200 / absorbed 404 / page rendered:
  1. `6acd03457883d84bb00bb3c0` absorbed `6aef4352e134d4cbbdce9737`: Bukkuyum/Gwashi traders' convoy ambush (Reuters Sat Oct 10 20 killed; AFP Sunday 13; PM News 22 feared). Date range Oct 10-11, killed 22+ with 13/20/22 note.
  2. `6aef17694eb3d454f18fba41` absorbed `6aef42e45d02a677ca205678`: Sabon Birni IED, absorbed record was a dailypost-ng.com mirror read via Wayback.
  3. `6aef163e4eb3d454f18fb608` absorbed `6aef163e4eb3d454f18fb60f`: Donga (Taraba) Akete Ward councillor plus ten killed (Daily Trust Gundom Saturday vs NewsPointer 'late Tuesday'); date range Jan 6-10, killed 11+.
  4. `6a9f57ffdb88b34b038da3ee` absorbed `6aef16f84eb3d454f18fb8ca`: April 26 Guyaku football-field massacre; the absorbed record was a The Recorder tag page mis-dated Nov 1.
  Pairs files: `scratch/duplicate-reconciliation-20261119/pairs-*-20261119.json`; run artifacts in the `run-2026-11-19T19-*` directories; surface verifications `*-merge-verification-20261119.json`.
- Review evidence: 23 batch files `scratch/duplicate-review-20261108-all-pairs/review-batch-20261119-NN.json` (and `.resolved.json`), each with sources read, quotes, decision and missing evidence. Candidate generation was done with `build-work-queue-20261119.mjs`/`clusters-20261119.mjs` (same-state, 5 days, place overlap) and `wide-net-20261119.mjs` (14 days, shared tokens). All 94 candidate clusters are now covered except Oyo `55f7f3`/`55f7f5` (Tribune blocked) and Taraba `24c502`/`8e9749` (Gomben Dela source blocked, no corroboration found).
- Left open with exact missing evidence (see batch files): Mariga Rimi vs Mukura abduction (1fbc70, bfe9c2: need an equation of the two places or a victim roster); Ribah Kebbi Oct 30 vs Oct 31 (f2ab6a, f2ab68: need corroboration of the 20+ toll); Kinuba mine vs Gambarun SITREP (bd1574, 0b7920); Debe 24 vs Shanga 44 (8fb7e0, b67f81: no village allocation); Tsafe five abducted vs Sarkin Samari rescue (bbfead, 737dd0); trustur digest record 16c5c9.
- Data-quality findings (not duplicates, not edited): Sambak `6afc390b...eb62ef` killed null though Dauda John Davou was killed; Otobi-Akpa killed 4 vs reported 5; Gummi `8fba18` has the IOM report date 24 Jun instead of event date 18 Jun and killed 0 vs 12; Nyanya court-sentence record `8fb9f1` (2014 bombing) is not a 2026 incident; Daffo filling-station explosion is an industrial accident; Etche arrests, Navy refinery raid, Ondo Amotekun arrests and foiled Akure bomb plot are operations, not attacks; Mashegu militants clash; `2fa3c2` and `0bce53` Benue records whose sources do not support their own place/toll/date; Madagali/Hong `b277c2` bundles two events. Unrecorded leads: Barkin Ladi Gana-Ropp five killed Sep 19 and Riyom/Fan two-each deaths (Premium Times 21 Sep); Asa 2, Otukpo retired warrant officer killed Jan 11 (Punch 15 Jan). None inserted; use the lead/promotion route with its own evidence review.
- High-yield method note: records created 2026-11-07 12:14-12:20 UTC (about 213 unreviewed, event dates Jan-Oct) came from one backfill batch and produced three of the four merges (stale tag/mirror/duplicate-headline sources). Review that batch first against same-state neighbours, then the remaining 723 pending IDs.
- Tooling notes: Leadership, Premium Times, Channels, Tribune, FIJ, Zagazola and Dailynigerian block scripted GETs (403); use web-search excerpts or Wayback (`http://web.archive.org/web/<ts>/<url>`). `scratch/duplicate-review-20261108-all-pairs/fetchtext.mjs <url> "<kw|kw>" [window] [hits]` fetches and excerpts. Use `node node_modules/tsx/dist/cli.mjs` for scripts.

## Current duplicate-review checkpoint, 2026-11-19 19:01 UTC

- Live direct-Mongo snapshot `scratch/duplicate-review-20261108-all-pairs/recovery-live-snapshot-20261119T190106856Z.json`: 1,002 active incidents and 4 pending duplicate rows. Explicit coverage rebuilt from this snapshot records 40 incident IDs with source-level evidence and 962 pending revalidation. One distinct Tafawa attack was promoted since the prior workday snapshot. Do not use the historical 630/365 aggregate as an ID selector; prior IDs lack a recoverable mapping. The review remains active and incomplete.
- Benue July review: The held Olahimo July 21 vs Efeyi July 28 pair was source-reviewed and dismissed as distinct through exact-fingerprint dry-run/apply; no attack fields changed. All four related active records (Olahimo, Efeyi, Eyeyi/Agatu, Asa III) returned API/page 200. Eyeyi/Agatu vs Efeyi/Otukpo remains an unresolved plausible candidate because no independent source reconciles the settlement/LGA discrepancy or victim set. Saidu Musa remains missing, not counted as killed. Evidence, artifacts and missing linkage: `scratch/duplicate-review-20261108-all-pairs/decisions-continuation.md` (Benue section).
- Lagos NDC town-hall follow-ups: Sun, Channels and Ghanamma evidence ties three held rows to the existing Nov. 12 Oregun attack; later reports are follow-ups. Exact-fingerprint dry-run/apply resolved all three as already recorded; no toll/date update. Direct API/page both returned 200 and the Nov. 12 label rendered. Evidence/artifacts are in the continuation ledger (NDC section).
- Gidan Taba: Reuters' Nov. 9 report and Premium Times' council-chair account identify the same Nov. 7 weekend household attack. The pending Reuters lead was resolved as already recorded. Existing 11+ killed and 7+ abducted minima remain alongside 12/13 death and 13-abduction reports; rescue roster remains unresolved. Direct API/page returned 200 and the date/toll uncertainty rendered. Evidence/artifacts are in the continuation ledger (Gidan Taba section).
- Takum MACBAN chairman: Leadership's Ibrahim Dio and Premium Times' Ibrahim Saidu (D.O.) reports identify the same person at the same residence; Sunday/Monday conflict remains an 8–9 November range. One held lead was resolved as already recorded; no toll/date changes. API/page returned 200, and Mongo confirms BSON Date endpoints. Evidence/artifacts are in the continuation ledger (Takum section).
- Tafawa/Riyom: two herders were killed on Nov. 4, and a distinct pair, Abdulhamid Isa and Rabiu Sale, was killed on Nov. 14. The held Nov. 14 lead was source-reviewed and promoted to active ID `6aff3a97885808b849eb4e49`; its queue row was resolved against that ID after the promoter left it pending. Both Tafawa records are active with two killed each; API/pages returned 200. No merge/toll transfer. Evidence and artifacts are in the continuation ledger (Tafawa section).
- Adamawa Zangula/Mubi pair: Operation Hadin Kai's statement distinguishes the Nov. 8 Gombi military-position engagement from the Nov. 9 Mubi South farmer abduction/rescue. Northeast Star gives 12:18 a.m. Nov. 9 for Zangula, so its Nov. 8–9 range remains. The held pair was resolved as distinct through exact-fingerprint dry-run/apply. Both active incidents' APIs and `/incidents/<id>` pages returned 200 with dates displayed. Two additional rescued captives' original sites remain unknown. See the continuation ledger's Adamawa section and its verification artifact.
- Uncertain-date display sweep repeated through direct terminal GETs at `http://127.0.0.1:3020`: 79/79 uncertain-date APIs/pages returned 200; `/api/summary` returned 200; no unknown-date record appeared in timed summary. Artifact: `scratch/duplicate-review-20261108-all-pairs/uncertain-date-pages-direct-http-20261119T182318691Z.json`. Local behavior is verified; production remains unverified.
- Jigawa Turawa Nov. 11 held report was matched to the active event using PUNCH's named caller and injured-victim account plus Daily Post's event details. Exact-fingerprint dry-run/apply resolved it as already recorded; active record unchanged, API/page 200 with ten sources. See continuation ledger and `jigawa-turawa-direct-http-verification-20261119.json`.
- Plateau Zwagal/Zuwagal: Leadership reports three killed Sunday Nov. 15 around 9 p.m.; Daily Trust/MDA reports nine killed in a “last night”/Monday attack and damage particularly in adjacent Bong, published Nov. 17. Reposts conflict on Sunday versus Monday, and no victim list establishes if this is an early/final toll or a second event. Held row remains pending and existing three toll is unchanged. Exact missing evidence and fetched-source artifacts: continuation ledger, Plateau section.
- FCT convoy lead: Premium Times carried the FCT Police statement confirming the Nov. 13 Garki convoy attack; PRNigeria's Nov. 16 article is a release follow-up. It is already active as `6afb8e376ac9996f3cc2b55c`, distinct from the row's Gwarimpa firefighters record. Promoter dry-run safely stopped on existing active event; exact-fingerprint review disposition then marked the lead recorded. Both active records remain; Garki API/page 200 with correct event date. No injury number inferred. Evidence and artifacts in continuation ledger, FCT section.
- Plateau Sho lead: Leadership's multi-event article plus PUNCH identify the Nov. 15 5:20 p.m. killing of Da Ishaku Pam Vwos (79), already recorded with one death. Resolved held lead to that active record after exact-fingerprint dry-run/apply. API/page 200; no toll/source changes. Evidence and artifacts in continuation ledger, Sho section.
- Sabuwar Kaura: Eagle Online describes both the Nov. 16 family-home attack and Sunday Nov. 15 mosque massacre separately; Daily Post independently documents the earlier mosque attack and police baseline. Resolved the household-vs-mosque lead as distinct and linked the mosque lead to its active incident. Kept one death/unknown kidnappings in the mosque record because the newer seven/15 account conflicts with police one/four and the victim roster is not reconciled. Both active APIs/pages 200; no fields changed. See continuation ledger and verification artifact.
- Niger Maidubu Road hostage deaths: Daily Post identifies Anas and Sallama/Babawo as two of eight abducted; ObserveEarth used the Nov. 14 article date as its display anchor. Resolved the lead to active record `6af8ec0e44e1d0305281285b`, but a direct Mongo check found `datePrecision: exact_day` even though the incident description says no event/death date is established. **Next agent: correct this active record to `datePrecision: unknown` using a guarded BSON-safe mutation, preserve the required Date anchor without displaying it, and verify the rendered page says “Incident date not established” and `/api/summary` excludes it from timed rows.** The local unknown-date UI path was previously verified 79/79, but this record was not part of that set because its precision is wrong. Evidence and queue decision: `scratch/duplicate-review-20261108-all-pairs/niger-maidubu-road-fatalities-lead-review-20261119.json`; failed verification artifact: `niger-maidubu-lead-direct-http-verification-20261119.json`.
- Sabuwar Kaura household attack `6afc38f44be0cbe377eb6299`: PUNCH says late Nov. 15; Blueprint says early Nov. 16. Both identify Alhaji Sama’ila’s Sabuwar Kaura residence, one guard killed and five family members abducted. Corrected toll and BSON date range, added PUNCH source, and kept it separate from the preceding Kaura mosque attack. Four family-vs-mosque queue rows were source-resolved as distinct events; one family lead was resolved as already recorded. Dry/apply evidence and the unresolved Eagle article extraction are in the continuation ledger.
- Sho village `6afef4637165d52d28ff1083` was promoted from held row `6afeda9ee78fb58079b145a6` with `scripts/promote-review-lead.ts`. PUNCH and The Sun identify Da Ishaku Pam Vwos, 79, killed Nov. 15 at Sho; added sources and set killed=1 without assigning unallocated injuries. It is distinct from the Nov. 8 Bel attack and the same-day Zwagal/Sambak and Nov. 16 Tadai events. No merge was confirmed this checkpoint. The Eagle-derived Zamfara rows `6afd8963e78fb58079aef1bb` and `6afeda9ee78fb58079b145ac` remain pending because the source page returns 403 and the extraction conflicts with its title; do not assign the extracted seven-death/15-abduction toll without event-specific evidence.
- Uncertain-date rendering was checked by direct HTTP GETs only, no desktop browser. 79/79 active unknown, range, month-only or tagged-uncertain incidents returned API/page 200; `/api/summary` returned 200 and unknown-date incidents were absent from timed rows. The new Sabuwar Kaura page shows `15 November 2026 to 16 November 2026`. Artifact: `uncertain-date-pages-direct-http-20261119T130459682Z.json`. Direct API/page checks also passed 4/4 for Sabuwar Kaura, the Kaura mosque, Sho and the older Bel incident: `kaura-sho-direct-http-verification-20261119T131316598Z.json`.
- Kwankwaso's Bichi convoy leads: four repeated Nov. 16 reports were matched to the active Nov. 15 episode using the Sunday campaign/exit account and Monday Obi statements. Police confirms a Bichi APC–NDC clash and five injuries but does not resolve who initiated it or convoy-only targeting. All four exact-fingerprint dispositions applied; active API/page 200. No merge. Evidence: `scratch/duplicate-review-20261108-all-pairs/kwankwaso-convoy-individual-review-20261119.json`.
- Millennium City Oct. 27 abduction vs Oct. 31–Nov. 2 Chikun rescue: checked Trust Radio, Daily Post, Vanguard and the police roster carried by Channels/The Star. Six Oct. 27 victims are not named; the eight later rescued are named but their original dates/sites are not allocated. The overlap remains unresolved, with no merge or dismissal. Compared date-near Kaduna records. Evidence and exact missing linkage: `scratch/duplicate-review-20261108-all-pairs/millennium-city-rescue-individual-review-20261119.json`.
- Borno Kukawa APC campaign: independently checked Premium Times, Daily Post and Guardian; two repeated leads match the existing active campaign record and were resolved by exact-fingerprint dry-run/apply. The separate Kekeno attempt stays separate. The Nov. 16–17 range is rendered correctly; API/page checks passed for the campaign and Kekeno control. Evidence: `scratch/duplicate-review-20261108-all-pairs/kukawa-campaign-individual-review-20261119.json` and `borno-kukawa-direct-get-verification-20261119T135808048Z.json`.
- Yartsakuwa cluster: New Telegraph, PUNCH, News Express, Daily Reality and Premium Times tie five held variants to the same overnight attack and survivor Najeeb Yartsakuwa. The active Nov. 14–15 range, 3+ killed and 3+ injured remain, with kidnapped count unknown. All five held rows were dry-run/applied as already recorded; API/page and source-retention checks passed. Evidence: `scratch/duplicate-review-20261108-all-pairs/yartsakuwa-individual-review-20261119.json` and `yartsakuwa-direct-http-verification-20261119T140531074Z.json`.
- High-casualty Zamfara pair `6aef166d4eb3d454f18fb6ea` / `6aae60a5244c2dc25e720c37`: Reuters/Al Jazeera report Tungan Dutse in Bukkuyum; Channels/TheWill report Dutsin Dan Ajiya in Anka as a separate raid. AP/AFP later report a “Tungan Duste/Dutse Dan Ajiya” event in Anka with 38 killed, conflicting with the Bukkuyum account; IOM records an Anka attack on Feb. 22 with casualty totals aggregated across a separate Zurmi event. Exact location, date and victim/toll mapping remains unavailable. Review row `6aef86942c7e1736ae2ad9f7` remains pending; no merge or toll transfer. Evidence: `scratch/duplicate-review-20261108-all-pairs/zamfara-tungan-dutse-dutsin-dan-ajiya-individual-review-20261119.json`.
- Uncertain-date display was checked by direct terminal GETs at `http://127.0.0.1:3020`: an unknown-date incident shows “Incident date not established” without its hidden BSON anchor; the Anka date range displays Feb. 19–20. API and rendered pages returned 200 for both. Existing working-tree date display changes were used; no additional UI code change was needed. Evidence: `scratch/duplicate-review-20261108-all-pairs/uncertain-date-direct-http-recheck-20261119.json`. The earlier 79/79 uncertain-date sweep remains recorded above.
- Kebbi Bui district aggregate vs Mamunu, Awashaka, Masama and five unnamed villages: Reuters/Vanguard give separate village tolls inside the coordinated raid wave; police/AP give a district aggregate that overlaps those victims. Kept the roll-up and settlement records separate under the source rule against merging different settlements/victim sets; all four duplicate rows were source-reviewed, dry-run and dismissed as distinct settlement records. No incident fields or sources changed; source/date/toll data remains intact. Cross-state Gudu is only attacker origin, and the Feb. 20 Maje-road police-position attack is separate. Mongo confirmed 4 dismissed rows and 5 active records; API/page returned 200 for all 5 and showed Feb. 17–18. Evidence: `scratch/duplicate-review-20261108-all-pairs/kebbi-bui-aggregate-components-individual-review-20261119.json`, `kebbi-bui-review-live-verification-20261119.json`, `kebbi-bui-direct-http-verification-20261119.json`.
- Riyom pair `6aef42a8df7f7f48cd6db4a6` (Torok herders, Jun. 18) vs `6aae78974f754cc99da2bc2b` (Ta-Hoss vigilantes, Jun. 10): read Daily Post, Guardian and Premium Times; the dates, sites, victim groups and circumstances differ. Checked adjacent Jun. 19 Dyan attack separately. Held row `6af9bf0063f3fe9dea81e736` was dry-run/applied as distinct events; both records remain active with existing tolls/sources. API/page 200 for both. Evidence: `scratch/duplicate-review-20261108-all-pairs/riyom-torok-ta_hoss-individual-review-20261119.json`, `riyom-torok-ta_hoss-live-verification-20261119.json`, and `riyom-torok-ta_hoss-direct-http-verification-20261119.json`.
- Benue highway attack `6afa3d9d6fec1dde84982ca0` was checked against all Benue/Enugu/Kogi/Nasarawa/FCT records dated Nov. 12–16. The six-mourner report is explicitly a separate prior-week event; other route-window records differ by event and victims. Kept Nov. 14 exact, driver injured=1, and kidnapping as 3–6 because police/source accounts conflict; no duplicate merge. Direct API/page and active Mongo checks passed. Full uncertain-date sweep now passes 79/79, summary 200, unknown timed rows 0. Details: `decisions-continuation.md`, `benue-highway-direct-http-verification-20261119T133219137Z.json`, and `uncertain-date-pages-direct-http-20261119T133252246Z.json`.
- Six fingerprinted queue decisions passed dry-run/apply in `scratch/review-dispositions/run-2026-11-19T13-10-46-915Z/`. The two guarded incident updates have dry/apply artifacts under `scratch/duplicate-reconciliation-20261119/sabuwar-kaura-date-toll-*` and `sho-plateau-toll-*`. Keep dates as BSON Dates. Continue with a fresh capture, review every remaining active incident against plausible nearby/cross-state/date-shifted records, merge only confirmed duplicates through the sanctioned tool, and verify every merge. No production deployment was made. Preserve all other dirty worktree changes.

## Current review checkpoint, 2026-11-19 11:59 UTC

- Fresh direct Mongo snapshot `scratch/duplicate-review-20261108-all-pairs/recovery-live-snapshot-20261119T110720951Z.json`: 995 active incidents and 36 pending duplicate-review rows. The prior 10:45 checkpoint recorded 624 individually reviewed; six more incidents were source-reviewed and logged here, so the aggregate is 630 reviewed / 365 remaining. There were no merges in this continuation. The old per-ID `incident-coverage-recovery.json` is currently absent, so 630/365 is only an aggregate and must not be used as a per-ID selection list until coverage is reconstructed.
- Recreated `scratch/duplicate-review-20261108-all-pairs/decisions-continuation.md` after the previously referenced file was absent. It records the six new reviews; prior case summaries remain in this handoff. Rebuild prior per-ID coverage from surviving evidence or re-review before treating older IDs as cleared.
- Ikoyi, Kogi (`6a92a9fba9b079ce763110bd`): Kogi Government and FRCN support one killed and one injured; the June 4/5/6 date conflict is displayed as unknown. Police and DHQ identify two Aluta workers abducted and later rescued, but do not establish whether that abduction was part of the fatal/injury attack or a separate attack at the same venue. Kept kidnapped unknown and documented the exact missing linkage. Correction dry-run/apply artifacts under `scratch/duplicate-reconciliation-20261119/ikoyi-date-casualty-*`; API/page/summary direct GETs 200 and the page hides the June 6 anchor. Full evidence: `ikoyi-individual-review-20261119.json` and `ikoyi-uncertain-date-direct-get-verification-20261119.json`.
- Individually reviewed Gateway Sapade, Ogun (`69f32237ab8c8f72e256ec38`); Goniri 120 Battalion, Yobe (`6a92a9f9a9b079ce76311096`); Rigachiku/Kaduna River corridor, Kaduna (`6a92a9fba9b079ce763110c3`); Iluke Bunu school, Kogi (`6a92a9fba9b079ce763110c6`); and Kakangi, Kaduna (`6a92a9fea9b079ce763110f2`). No duplicate confirmed. Corrected Goniri to BSON date range May 9–10; preserved Rigachiku killed=7–8 and approximate-LGA location due source conflicts; changed Kakangi killed metadata to open minimum 9+ and added Premium Times. Dry-run/apply artifacts: `scratch/duplicate-reconciliation-20261119/date-toll-*`. Source-level comparisons and unresolved leads: `april27-july4-five-records-individual-review-20261119.json`. All five local API/page GETs returned 200 and rendered the expected toll/date details: `april27-july4-five-records-direct-get-verification-20261119.json`.
- Direct Mongo query plus local API and server-rendered-page GETs verified 78/78 active unknown, range, month-only and tagged uncertain-date records. Visible hero, When field and attack-history label show the correct uncertainty/range/month label; hidden date anchors are not presented as exact dates. Artifact: `uncertain-date-pages-local-recheck-direct-get-verification-20261119-after-ikoyi-yobe.json`. This is local HTTP verification; production remains unverified and no deployment was made.
- Continue until every active incident is reviewed and all confirmed duplicates are merged and verified. Do not use DeepSeek/Brave APIs or a desktop browser. No duplicate merge occurred in this checkpoint.

## Current review checkpoint, 2026-11-19 10:45 UTC

- Fresh direct Mongo snapshot `scratch/duplicate-review-20261108-all-pairs/recovery-live-snapshot-20261119T104346740Z.json`: 995 active incidents and 36 pending duplicate rows. Coverage reconciles: 624 individually reviewed and 371 pending. The individual source review remains active and incomplete. Do not stop between batches.
- April 17–22 pending pass: reviewed Bursari clearance exercise, Chekugi home invasion, Unguwan Yamma attempted abduction, Donga/Tor-Damisa police ambush, Odo-Eri church-family abduction, and Kirikiri quarters fire against their attached sources and plausible nearby candidates. Confirmed and merged the Donga/Tor-Damisa date-shift duplicate; kept March 18 survivor `6aef16984eb3d454f18fb753`, absorbed Apr. 19 follow-up `69ea0a4cf394c5e97f9a9950`. Dry-run/apply through `scripts/merge-incidents.ts`, active count 996→995, date integrity PASS. Survivor/API/page 200, absorbed/API 404, summary 200. Police-confirmed killed lower bound=4; other local totals conflict and are unresolved. Odo-Eri abduction count remains conflicted (TVC/police 3 vs PUNCH source at least 20). Evidence: `scratch/duplicate-review-20261108-all-pairs/april17-22-pending-pass-20261119.json` and `taraba-tse-kwe-merge-verification-20261119.json`.
- Zamfara Bukkuyum market convoy records `6acd03457883d84bb00bb3c0` (Oct. 11) and `6aef4352e134d4cbbdce9737` (Oct. 10) were independently source-reviewed. AFP via Citizen Digital and PM News/Ripples overlap on the Sunday Gwashi–Gurusu convoy but disagree on route direction and toll (AFP chief: 13 killed/11 wounded; PM News/Ripples: 22 feared dead). AFP was added to the Sunday record's source history; keep its 22-feared figure explicitly unverified and do not add AFP's injured figure before further toll reconciliation. Reuters via KELO places the other event on Saturday Oct. 10 around 2 p.m. from Gwashi toward Nasarawa market, with at least 20 killed (specified roster) and 19 wounded. Corrected its publication date to BSON Oct. 10, location to approximate Bukkuyum LGA route, and toll; retained the inaccessible original Voice of Emirates source and added Reuters. Dates/destinations/witness accounts support distinct events; no merge. Guarded correction dry-run/apply, source addition, and active hash uniqueness passed. Evidence: `scratch/duplicate-review-20261108-all-pairs/zamfara-bukkuyum-convoy-individual-review-20261119.json`; correction files under `scratch/duplicate-reconciliation-20261119/zamfara-saturday-convoy-*` and `zamfara-sunday-afp-source-*`.
- After the correction, local direct GETs for the Saturday record's API, rendered page, and summary returned 200; server-rendered page contains `10 OCT 2026`, `20+ killed`, `19 injured`, and `Nasarawa`.
- April 23–27 pass: reviewed Rivers Ikuru Town killing, Kano Rogo/Barbaji attack, OOU Ibogun robbery, Farm Centre market clash, and Kaduna Awon raid against the attached articles and date/location candidates. Corrected Rivers event date from Apr. 24 publication to Apr. 23 Thursday; cleared OOU injured=10 because source count referred to students attacked rather than injured, while the injury tally is unspecified. Both guarded corrections recomputed inconsistent stored hashes and passed active hash uniqueness. Local direct API/page GETs 200; page dates display Apr. 23 and Apr. 25. No duplicates or merges in this pass. Evidence: `scratch/duplicate-review-20261108-all-pairs/april23-27-pending-pass-20261119.json`.

- Goal remains active and incomplete. Fresh direct Mongo snapshot `scratch/duplicate-review-20261108-all-pairs/recovery-live-snapshot-20261119T094346139Z.json` has 996 active incidents and 36 pending duplicate-review rows. Coverage reconciles to 611 individually reviewed and 385 pending. Continue autonomously and refresh live state for later changes.
- Zamfara Bukuyum town record `6ae64d3a0c5471c319e2602e` was individually reviewed and its event date corrected from the Oct. 31 publication date to Oct. 28, supported by the Premium Times and TVC accounts of the police statement. The same-day Anka–Guruzu military ambush, prior-day FOB Bukuyum infiltration, Ribah Kebbi attacks, Nov. 1 police convoy and nearby Kebbi/Sokoto/Niger events are distinct by source-described site, force, victims, date and circumstances. No duplicate or merge. Added Premium Times/TVC source history; casualty fields remain null because the 30+ suspected attacker bodies and identities/count are unverified. Guarded BSON date correction dry-run/apply and hash validation passed; API/page/summary GETs 200, page displays `28 OCT 2026`. Evidence: `scratch/duplicate-review-20261108-all-pairs/bukuyum-individual-review-20261119.json`; artifacts: `scratch/duplicate-reconciliation-20261119/bukuyum-event-date-2026-11-19T09-36-33-000Z-dry-run/` and `bukuyum-event-date-2026-11-19T09-36-41-403Z-apply/`.
- Ojo LASU Road `69e76f6f246d3ad909e8a091`: individually checked against nearby Lagos, historical same-LGA and plausible cross-state/date-shift candidates. PUNCH and Daily Post disagree on the video’s event time; the original X timestamp is unavailable. Corrected the impossible narrative date and set `datePrecision: unknown` with the old date only as a hidden BSON anchor. Page says “Incident date not established”; summary excludes it from timed rows. No duplicate or casualty count added. Evidence: `ojo-lasu-road-individual-review-20261119.json`, `ojo-uncertain-date-direct-get-verification-20261119.json`, `ojo-unknown-summary-exclusion-direct-get-20261119.json`.
- Riyom Road abduction `6aea41df25a5bf7a35389a07`: two passengers abducted, seven escaped, both later released Nov. 4. Compared date-near Plateau and Benue cases; separate sites/victims. Kept abducted=2 and rescue as follow-up. API/page 200. Evidence: `riyom-road-two-abductees-individual-review-20261119.json`.
- Bassa Victor Yakong `6aeede3a1c7a0a562ce785cc` and Rewienku `6aef34974d9328b8f151ae19` are distinct by settlement, named victims, timing and circumstances despite same LGA and consecutive dates. Compared Mista Ali, Cubana Street and nearby Plateau incidents. API/page 2/2. Evidence: `bassa-rewienku-victor-yakong-individual-review-20261119.json`.
- Nanu, Kwara `6aef34aa4d9328b8f151af16`: Zagazola says one suspected attacker killed; Vanguard quoting the Defence Media Operations weekly briefing says two in the same Nov. 4 encounter. Keep casualty fields unknown pending reconciliation. No duplicate; API/page 200. Evidence: `nanu-individual-review-20261119.json`.
- Confirmed Bayelsa Secretariat duplicate merged: the active Nov. 4 record `6aef17064eb3d454f18fb909` was actually the Feb. 11 IED explosion, established by The Recorder’s event-specific article, PUNCH and Premium Times/police report. Kept older police-confirmed survivor `6a9389a4d17b55c4bc6dbee0`. Sanctioned dry-run/apply: active count 997→996, date-integrity PASS; survivor/absorbed API 200/404, survivor page 200. Three sources preserved/added; killed/injured/kidnapped=0, displaced unknown. Artifacts: `scratch/duplicate-reconciliation-20261119/run-2026-11-19T09-21-48-963Z/` and `run-2026-11-19T09-22-01-686Z/`; evidence: `bayelsa-secretariat-individual-review-20261119.json` and `bayelsa-secretariat-merge-verification-20261119.json`.
- Edo tanker driver `6aeb929f2e90cd1ba2ba59ee`: Daily Trust and Trust Radio identify Usman Abubakar, abducted at Ugbogun on the Benin–Lagos Road Oct. 31 and later rescued from Morgan Forest; his motor boy escaped. Compared Ogun alternative-road and Awa-Ijebu bus incidents, earlier Ugbokun checkpoint event, and Iguobazuwa bus attack. No duplicate. Keep abducted=1 despite rescue; other casualties unknown. API/page 200. Evidence: `edo-tanker-driver-individual-review-20261119.json`.
- Karim-Lamido `6aeb929f2e90cd1ba2ba59f0`: Premium Times, National Accord and Truth Nigeria date the Kuka Sarkin Yamma/Ruwan-Zafi attack to Nov. 3; reported 3 deaths, 15+ abducted and some rescued. Compared distinct Binnari Oct. 23 and Gomben Dela Oct. 26 incidents and same-date Benue market attack. No duplicate. A NaijaOnPoint alert has impossible “3rd October” chronology and unverified Jebjeb/five-rescued details; those links remain unresolved without an independent date and victim breakdown. Keep 15+ and do not add reported deaths to structured fields without reconciliation. API/page 200. Evidence: `taraba-kuka-ruwan-zafi-individual-review-20261119.json`.
- Local direct API and server-rendered page checks passed 76/76 active uncertain-date records (unknown, range, month-only), including Ojo. `/api/summary` excluded Ojo from timed rows. Production rendering remains unverified; no deployment was made. Artifact: `uncertain-date-pages-local-recheck-direct-get-verification-20261119-after-ojo.json`.
- Woro casualty source recheck: UNICEF's March field update after a Woro visit reports at least 200 killed and around 176 abducted; AP reports over 160 killed and confirms 163 Woro abductees rescued. Updated killed to 200+ as an open lower bound; left kidnapped 163+ as the verified minimum. Survivor's 13 deaths in captivity, 12 children remaining, KDA's 13 unaccounted, and about 76 later-joined captives from another settlement are kept distinct and not added to attack tolls. FIJ headline/body counts (187 vs 177 next day/204 by Feb. 12), early government 75, and abductee rosters (176 vs village list 167 vs 163 returned) remain documented conflicts. Direct local API/page/summary GETs 200; page displays 200+ killed and 163+ abducted over the 3–4 Feb range. Guarded correction artifacts and source review: `woro-casualty-root-recheck-20261119.json`, `woro-casualty-api-page-direct-get-verification-20261119.json`, `scratch/duplicate-reconciliation-20261119/woro-killed-minimum-2026-11-19T09-43-08-226Z-dry-run/`, and `...09-43-17-130Z-apply/`.
- No desktop browser, project DeepSeek/Brave API, discovery script or adjudication script was used. Preserve unrelated dirty changes. The previously referenced `incident-coverage-recovery.json` is absent; the latest six records are in the recreated `decisions-continuation.md`. Reconstruct the per-ID review mapping before using earlier aggregate coverage to select remaining records.

## Current review checkpoint, 2026-11-19 00:02 UTC

- The individual duplicate review remains active and incomplete. Fresh direct Mongo snapshot `scratch/duplicate-review-20261108-all-pairs/recovery-live-snapshot-2026-11-18T23-52-52-816Z.json` has 997 active incidents and 36 pending duplicate rows. Coverage reconciles exactly: 602 individually source-reviewed, 395 pending. Continue all pending records, refresh the live database for additions and changes, and do not stop between batches.
- Borno Kukawa campaign incident `6afe31fba07461f56e34f4e7` was source-reviewed against the date-near Gwoza military attack, same-LGA Kukawa records, and cross-state campaign-convoy candidates in Jigawa and Nasarawa. No duplicate was established. Premium Times says Nov 17; Guardian and MUK TV quote Yerwa News Express saying Nov 16. A guarded dry-run/apply stored a BSON Nov 16–17 date range, preserved the original source, and added three readable reports; all active dates and hashes passed integrity checks. Direct API/page GETs returned 200 and rendered the range; Gwoza control remained separate. Evidence: `kukawa-campaign-individual-review-20261119.json`, `kukawa-campaign-direct-get-verification-20261119.json`.
- Three additional Plateau records were source-reviewed: Vom's Apr 21 NSCDC facility protest and Hwol Gassa's Apr 25 raid are distinct. Sabon Gida Apr 20 remains a possible but unconfirmed link to the Apr 19 Gideon Luka killing because victim names, exact site and attack time for the Apr 20 account are missing; a later source lists them as separate events. No merge. Direct API/page GETs passed 3/3. Evidence: `plateau-april20-25-individual-review-20261119.json`.
- Uncertain-date rendering is locally verified by sequential direct HTTP API and server-rendered page GETs: 75/75 passed against the refreshed snapshot, including unknown, range, and month-only labels. Artifact: `uncertain-date-pages-local-recheck-direct-get-verification-20261119.json`. The production frontend previously rendered some unknown dates as exact calendar days; no deployment was made, so public rendering remains unverified and may still be stale.
- No desktop browser, project DeepSeek/Brave API, discovery script, or adjudication script was used. Preserve unrelated dirty changes. Current repository has many pre-existing modified files; do not deploy the full checkout wholesale. Continue from `incident-coverage-recovery.json` and `decisions-continuation.md`.

## Current review checkpoint, 2026-11-18 21:12 UTC

- The all-incidents duplicate review remains active and incomplete. Fresh direct Mongo snapshot `scratch/duplicate-review-20261108-all-pairs/recovery-live-snapshot.json`, captured at 2026-11-18T20:54:13.763Z, has 997 active incidents and 46 pending duplicate rows. Coverage reconciles exactly to all live IDs: 546 individually reviewed and 451 pending. The earlier 998-record baseline included the absorbed Omugo record; it has been removed from coverage.
- Three confirmed duplicates have been merged through `scripts/merge-incidents.ts`. The earlier Kwara family-abduction and Abia arrest-follow-up merges are recorded above. This checkpoint adds Omugo survivor `69c93c194694c37d012590ed`, with absorbed `6aef170e4eb3d454f18fb92d`. March 22 is stored as a BSON date, five sources are retained, and the evolving 8 abducted / 5+ feared dead / releases account is preserved without adding outcomes. Dry/apply artifacts are `scratch/duplicate-reconciliation-20261118/run-2026-11-18T20-09-10-090Z/` and `run-2026-11-18T20-09-38-424Z/`; direct API/page GET verification confirms survivor 200 and absorbed 404, with date integrity PASS.
- Individual review also compared Oro-Ago `69d37c852af105398e777d9d` to Omugo and the March 23 Woro-area IED. Daily Post and Choice Reporters place the event Wednesday evening, March 25, in Oro-Ago, but disagree on victim identities and casualty count; keep the record and toll unresolved pending victim-level evidence. Daily Post explicitly separates it from Sunday's Omugo church attack and Tuesday's Oro-Ago–Oke-Oyan convoy attack. The Woro incident is distinct by Kaiama LGA, road/border route, vehicle victims and IED circumstances. Evidence and source URLs are in `individual-review-batch-20261118T2011Z.json` and `decisions-continuation.md`.
- Additional source-level reviews: Owode Yewa is distinct from the shared-article Ojo/Lagos death but its source URL/date are misgrounded; Ilu-Abo is one attack with a Jan 25/26 date conflict and separate later Ilu-Abo incidents; Nyalun is separate from the nearby Jos/Barkin Ladi events but the source says Mar 31 while storage says Mar 30. Ishinkwo's Josephat Ikegwu killing is separate from Francis Igwe's Ndufu-Alike killing despite a shared PUNCH source URL. Akyawa/Udege Kasa is a single two-community communal clash; keep the 11 vs 13 toll overlap unresolved. Ariko churches are distinct from the Kahir wedding; the 7/5 deaths and 31/36 abduction/rescue reports conflict. Its 16-death Easter roundup row aggregates several states and remains a separate unreviewed record. Source details are in batches `individual-review-batch-20261118T2025Z.json` and `individual-review-batch-20261118T2038Z.json`.
- The local uncertain-date display fix in `src/lib/incident-view.ts`, `src/lib/summary.ts`, `src/app/api/summary/route.ts` and the incident detail page now passes a fresh direct-GET sweep: all 67 uncertain-date records returned API/page 200 with correct rendered labels, including 49 ranges, 14 unknown dates (eight explicit and six legacy-tagged), and four month-only records. The local summary endpoint returned zero unknown-date rows in timed buckets. Artifacts: `uncertain-date-pages-local-recheck-direct-get-verification-20261118.json` (67/67) and `corrected-records-local-direct-get-verification-20261118.json` (4/4). The production host still renders tagged Ankpa `6aae73e61dc87e96f2012877` as “30 August 2026, recorded to the exact day”; no deployment has been made. Local Next dev needed restoration of optional native packages under ignored `node_modules`; no source or lockfile changes were made for that environment repair. Do not deploy this checkout wholesale because it contains unrelated dirty changes.
- Individual review batch `individual-review-batch-20261118T2054Z.json` checked Dapchi `69d2ce13c0a3c16d1f87998d` against Damaturu and adjacent Borno attacks; Enugu Ezimo `69d322ce455e8b602d81f6e6` against same-state abduction and date-shift candidates; and Nasarawa Akunza Ashige `69d36b94f308eb8dcfac0d5f` against date-adjacent Benue/Plateau cases. No duplicates were confirmed. The batch includes article URLs and pair-specific evidence; no merge was needed.
- Guarded correction dry-run/apply fixed the Dapchi source mismatch and developing status, corrected Ezimo's unsupported killed count from three to one, and moved Akunza's incident date from the later Jan 1 death to the police-supported Dec 30 attack date. Existing final Akunza toll (three killed, eight injured) remains. Artifacts are under `scratch/duplicate-reconciliation-20261118/evidence-corrections/`; local APIs/pages returned 200 and direct evidence checks passed.
- Continue using direct HTTP plus Codex web search/article reading; do not use the desktop browser or project DeepSeek/Brave APIs/scripts. Preserve unrelated dirty changes. Continue the 451 pending individual reviews and take a fresh database snapshot before every later mutation. Completion still requires full review, sanctioned and verified merges, a live user-facing uncertain-date fix, and a final live recheck.

## Current review, 2026-11-18 06:10 UTC

- Goal remains active and incomplete. Fresh direct Mongo capture at 2026-11-18T06:08:34.994Z has 997 active incidents and 55 pending duplicate-review rows. Coverage reconciles to live IDs: 495 individually reviewed and 502 pending. Six records changed since the last coverage baseline and remain pending for source recheck; rankings and queue rows remain candidate leads only. Snapshot: `scratch/duplicate-review-20261108-all-pairs/recovery-live-snapshot-20261118T060834994Z-ondo-review.json`.
- Reviewed and corrected Jigawa Ringim record `69900f8849d2e9163a0bce4e`: the Feb 13, 2026 date and attached PUNCH URL were wrong. Event-specific Zagazola and WANEP reports identify Mar 5, 2025, at CGC Junction, Ringim, with three deaths. Guarded dry-run/apply corrected BSON date, title/location, sources and hash. No duplicate; status remains unconfirmed. Local API/page GETs returned 200. Evidence/artifacts: `scratch/duplicate-review-20261108-all-pairs/jigawa-ringim-individual-review-20261118.json`, `scratch/jigawa-ringim-record-correction-20261118/`, `scratch/duplicate-review-20261108-all-pairs/jigawa-ringim-direct-get-verification-20261118.json`.
- Re-reviewed Woro casualty evidence: retain 161+ killed and 163+ abducted as attributed conservative minima. UNICEF reports 200+ killed and around 176 abducted; FIJ reports 187 deaths; police initially reported 75. Captivity deaths and unaccounted hostages remain unlinked. No casualty edit or merge. Exact missing census/roster evidence is in `woro-casualty-root-recheck-20261118.json`.
- Individually reviewed Zamfara Magamin Diddi CPG incident `699fd3875b4ea97b84dfa9ed`. The source names three dead CPG members but gives no calendar day; the Feb 23 publication anchor is now tagged unknown and a later Guardian repetition is added. The Dutsin Dan Ajiya/Tungan Duste place/toll conflict remains unresolved; no source links it to these named guards. The old Daily Trust source is a distinct April Yarkatsinan Laka attack and is retained only as source history. No merge. Direct API/page check returned 200 and rendered “Incident date not established.”
- Individually reviewed Ondo Uso church abduction `69a33b5c66d59b3f2ff96260`. The Feb 25 date and six initially abducted are police-supported; deaths/injuries remain unknown. Police rescue and four-versus-five release accounts conflict, so the description now preserves the unresolved individual disposition and ransom evidence. Added FIJ/The Nation sources via guarded dry-run/apply; date/hash/count unchanged. No merge. API/page direct GETs returned 200. Evidence and artifacts are in the continuation ledger and `scratch/ondo-uso-release-uncertainty-20261118/`.
- Uncertain-date UI verification now passes 66/66 active records (48 ranges, 14 unknown, four month-only) with sequential local API and SSR-page GETs and bounded 429 retries. No desktop browser or public deployment used. Artifact: `scratch/duplicate-review-20261108-all-pairs/uncertain-date-pages-direct-get-verification-20261118.json`.
- Enugu Obelagu, Ogun Akintobi, Borno Yamtake Road and Anambra child abduction reviews remain recorded in the continuation ledger. No confirmed merge in this batch. See `scratch/duplicate-review-20261108-all-pairs/decisions-continuation.md` and `incident-coverage-recovery.json`.
- Preserve unrelated dirty changes. Do not use project DeepSeek/Brave APIs, discovery/adjudication scripts, or the user desktop browser. Continue source-based review of all pending records; this goal is not complete.
## Rivers Mbiama motorcyclist murder, unknown event date, 2026-11-17

Daily Trust, PUNCH, The Guardian and Peoples Gazette police-account reports all identify Sani Musa and the same Mbiama forest killing and body recovery. Police say suspects were arrested at Choba Motor Park on Oct 22; the reports were published Nov 13. No account states when Musa was lured or killed. The victim's Jigawa origin is not the incident location. No active victim/site/circumstance match was found in Rivers or the cross-state candidate check. Kept one Rivers record, preserved killed=1 and set date precision to unknown. The rendered `When` field says “Incident date not established.” No merge. See `rivers-mbiama-motorcyclist-individual-review-20261117.json`; guarded correction dry/apply directories are in `scratch/rivers-mbiama-date-correction-20261117/`.

Fresh Mongo capture at 2026-11-17T21:42:30.242Z reconciles 995 active IDs and 52 pending duplicate-review rows. Coverage now marks 490 individually reviewed / 505 pending. Direct GET verification returned API/page 200 for the Rivers record; full local uncertain-date direct GET sweep passed 65/65 (48 date ranges, 13 unknown dates, four month-only). Artifacts include `rivers-mbiama-unknown-date-direct-get-verification-20261117.json` and `all-uncertain-date-pages-direct-get-verification-20261117.json`.

## Previous review checkpoint, 2026-11-16 22:19 UTC
- Fresh direct Mongo capture after the confirmed merge: 990 active incidents and 35 pending duplicate-review rows. Coverage aligns with all 990 active IDs: 119 individually reviewed, 871 pending. Refresh the candidate-pair index from the live snapshot before continuing; rankings remain leads only. Continue from `scratch/duplicate-review-20261108-all-pairs/incident-coverage-recovery.json` and `decisions-continuation.md`.
- Oct 9 Bala-Tela and Oct 17 Tela-Bala/Guyaku, Gombi: full Daily Post and Inquirer reports establish separate events, with different dates/sites, civilian versus security victims and circumstances. Oct 17 five-security-personnel toll remains unconfirmed and unallocated; Oct 9 victim is unnamed. No merge. Evidence: `gombi-october-2026-review-20261116.json`.
- Plateau Rantis and Kwi: Premium Times/BYM and The Eagle/TruthNigeria establish Paul Danladi's Oct 7 Rantis killing and a separate Oct 8 Kwi security-operative killing. The Oct 8–12 roundup distinguishes both and other Plateau events. No merge or casualty transfer. Evidence: `plateau-october-7-8-review-20261116.json`.
- Omoku Jan 19 and Feb 5: police-based reporting identifies a Sambo Street masquerade shooting with one dead/eight injured, separate from the later Ogolo Street abduction/murders of Ifeanyi Azuazu and Chigozie Oluwu. Feb 6 body discovery is a follow-up. No merge. The Jan row's injured evidence text appears copied from unrelated Anambra reporting; count remains supported by the police-based report, with no change yet. Evidence: `omoku-january-february-review-20261116.json`.
- Kwande: Jan 6 Udeku farmers, Jan 7 Jato Aka cult clash and Jan 10 Udeku security ambush are separate by date, victim group, site and circumstances. Vanguard and PUNCH explicitly distinguish the Jan 10 attack from Jan 6. Merged the generic Jan 15 Udeku row into the well-sourced Jan 10 survivor after a clean dry run; 990 active records remain. GET verification: survivor API/page 200, absorbed API/page 404, correct date/toll/source retained. See `kwande-january-cluster-review-20261116.json`, `kwande-merge-direct-get-verification-20261116.json`, and `confirmed-merges/run-2026-11-16T22-06-49-028Z`.
- Plateau Aug 28: reconciled the roadblock report with the nine-passenger minibus/pastor reports and Dipak's eyewitness follow-up. The same two abductees were Pastors Hills Emmanuel and Gabriel Dipak; Emmanuel was killed in captivity, Dipak was released. Road survivor now records one killed/two abducted with overlap documented and Barnabas Aid/Guardian sources. Fang/Batok 2 and Radura killings are separate sites and victim groups. Direct GETs returned 200 for all three APIs/pages. Evidence and correction artifacts are in `plateau-aug28-cluster-review-20261116.json`, `plateau-aug28-cluster-direct-get-verification-20261116.json`, and `confirmed-merges/run-2026-11-16T22-17-18-789Z`.
- Adamawa Sep 30–Oct 1: the source explicitly separates the Garaha-Mojili outpost attack, Dakna village abduction, and Oct 1 Zangula/Guyaku flight event. Garaha and Dakna dates now render as the evidence-supported Sep 30–Oct 1 range with BSON endpoints; their anchors, casualties, locations, source history and hashes were validated. API and rendered pages returned 200 for both ranges and the Zangula page; evidence and correction artifacts are in `scratch/duplicate-review-20261108-all-pairs/adamawa-zangula-dakna-garaha-review-20261116.json` and `scratch/adamawa-midnight-date-correction/`.
- Data-integrity audit found four active `date_range` incidents whose stored hashes did not equal `hashFor`; repaired only their hash and `updatedAt` under guards after a four-row dry run. Recalculated active hashes are unique and all 39 active date-range records now match `hashFor`. Artifacts: `scratch/date-range-hash-repair/`; read-only audit: `scratch/active-date-range-hash-audit-20261116.json`.
- Direct local GET verification at `http://127.0.0.1:3010`: 8/8 incident APIs and rendered pages returned 200; both unknown-date cases render “Incident date not established,” and the two Adamawa ranges render “30 September 2026 to 1 October 2026.” See `scratch/duplicate-review-20261108-all-pairs/kogi-and-uncertain-date-direct-get-verification-20261116.json`.
- Kebbi Oct 7–8: reviewed the Maiyama FOB assault, Gubba highway-site ambush, and Bayawa warning/foiled operation as distinct events. FIJ explicitly separates Gubba and Bayawa; police and military-source accounts distinguish the FOB. Police says no attack occurred at Bayawa. Gubba dates conflict: FIJ quotes police as saying “yesterday” on Oct 8, while other reports explicitly say Oct 8. Guarded Mongo correction stores a BSON-backed Oct 7–8 date range; casualties, source history, location, and hash preserved. Direct local API and rendered pages returned 200 for all three; Gubba date range renders correctly. Review evidence `kebbi-maiyama-base-gubba-bayawa-review-20261116.json`; correction artifacts `scratch/kebbi-date-correction/`; GET verification `kebbi-maiyama-direct-get-verification-20261116.json`. No merge.
- Plateau Barkin Ladi mining pair: Premium Times and Daily Post place the Marit miners attack on Sep 26 and the Rakum attack on Sep 28. They identify different villages and victim groups, with separate 5+ killed/2+ injured versus 3 women killed/1+ injured reporting. No merge or toll transfer. `plateau-marit-rakum-mining-review-20261116.json`.
- Plateau Oct 8 roundup: TruthNigeria's full report distinguishes farmer Babangida Atah machete-injured at Rafi Katako about 1 p.m., Zubairu Danirai killed later on Manja–Mpili Road, and Corporal Abdulrahman Auwal killed about 6:51 p.m. on Kwi Road. The Eagle's separate Kwi account matches Auwal's trip, route, approximate time, and stolen motorcycle. One stored Kwi record covers both source accounts; the other two are distinct. No merge. `plateau-october-rafi-manja-kwi-review-20261116.json`.
- Plateau Oct 29–30: Premium Times and Leadership confirm four deaths at Sabon Angwa on Oct 29. Daily Trust allocates one additional death to Rakung on Thursday; The News Chronicle says the Rakung attack occurred early Oct 30. Stored Rakung date now displays as an Oct 29–30 range; Sabon Angwa and Rakung remain separate. A later BYM seven-death account does not allocate victims, so counts were not changed. Both local API/pages returned 200; date range and added source verified. `plateau-sabon-angwa-rakung-review-20261116.json`; correction artifacts `scratch/plateau-rakung-date-correction/`.
- Plateau Apr 8–9: PUNCH explicitly separates the Apr 8, 4:15 p.m. Bokkos Road ambush toward Nding (Ayuba Pam killed, two injured) from the Apr 9, 11 p.m. Mbwelle village attack in Bokkos LGA (at least eight killed). The two records stay distinct; unresolved Mbwelle 8-versus-20 toll remains. `plateau-mbwelle-bokkos-road-review-20261116.json`.
- Individually reviewed Lagos Epetedo (April 2) and Idumota/Pedro (April 7); PUNCH explicitly distinguishes them. Legacy 2025 URLs on the records concern unrelated cases. No merge. Enugu police briefing independently identifies Eke–Ezinze Road (April 10, Udi) and Obinaofia (April 12, Ezeagu) abductions as distinct operations, although the police link suspects to both. Osogbo Owo-Eba deaths on Oct 2 are separate from the Oct 4 Arowomole/Ojo Iku shooting; police say responding to treatment, while Tribune reports a later death with unclear circumstances. Preserve the unresolved final outcome and identity question. Evidence: `lagos-epetedo-idumota-review-20261116.json`, `enugu-osogbo-clusters-review-20261116.json`.
- Reviewed three coordinated 15 April Kwara raids and the nearby 18 April Olayinka monarch abduction. Iwo Odo-Ore (Isin), Gaa Dembo-Agunjin and Gaa-Idera (Ifelodun) remain separate by settlement and victim group; Olayinka is separate by date, palace site and named monarch. Conflicting abduction counts and one ambiguous “Odo-Ore” reference remain documented. No merge. Evidence and direct-source links: `kwara-april-three-community-review-20261116.json`.
- Reviewed the 26–27 September Mukura, Rimi/Tungan Rimi and Yargada abductions, plus same-date Unguwar Sarki and Kade Daba/rescue follow-up candidates. Different sites/dates/source accounts remain separate, and the six road users rescued near Kwanoni are not treated as abductees. No merge. Mukura/Rimi lack named victim lists, so individual overlap is not testable; Yargada source uncertainty stays documented. Evidence: `mukura-rimi-yargada-zamfara-cluster-review-20261116.json`.
- Gora and Unguwar Dambu are separate sequential raids per Daily Post. Both dates were previously set to exact 3 April although that is only the article publication date. Guarded direct-Mongo correction changed both to `datePrecision: unknown`, kept the old date only as a non-rendered compatibility anchor with its provisional explanation, and added the uncertainty tag. Dry-run planned 2/no writes; apply changed 2; artifacts under `scratch/uncertain-date-correction/`. Coverage notes and source: `gora-unguwar-dambu-review-20261116.json`.
- Amassoma April 2 pair remains unresolved: PUNCH names Blessing killed by a stray bullet near a laundry shop and Christian shot in an apartment after assailants sought his roommate. Its follow-up links the reports but does not establish whether the attackers or sequence were the same. Missing target/roommate linkage and movement between sites are documented; no merge. Evidence: `amassoma-cult-attack-linkage-unresolved-20261116.json`.
- Reviewed four Kajuru village records for Oct 14–20 and the Oct 24 Ungwan Mallami attack. The report's aggregate 18 abducted/one killed remains unallocated; Kutura, Mission Maraban, Janwuriya, and Ngwaku retain separate sites and reported victim groups. Ungwan Mallami is separate by date/location; six attackers killed in pursuit are not civilian casualties. Oct 31–Nov 2 Millennium City/Marabar Rido rescue victims are named but their abduction origins are not established; possible overlap with Oct 27 Nurul Suraj remains unresolved. Evidence: `kajuru-four-village-and-kaduna-followups-review-20261116.json`.
- The Feb 17 Magazu and Fadama records are confirmed separate raids per The Authority's article, which says Fadama was a separate later raid. No toll transfer or merge; source fetched directly over HTTP 200 and stored in scratch. Evidence: `magazu-fadama-separate-raids-review-20261116.json`.
- The tagged-date display gap is fixed: `incidentDateLabel` now treats `date-uncertainty` as unresolved when precision is missing or contradictorily `exact_day`; incident details no longer say “recorded to the exact day” for these records. Local production HTTP checks verified API and rendered pages for all six affected records plus two explicit-unknown-date records (8/8). 
px tsc --noEmit`, focused ESLint, and 
pm run build -- --webpack` pass. No external deployment or desktop browser used.
- Fresh live capture at 19:57:40Z: 991 active, 35 pending duplicate-review rows, 83 individually reviewed / 908 pending. The Mangu Kyikyau–Gyambwas vigilante attack was source-reviewed and kept distinct from the Barkin Ladi events. Evidence: `plateau-mangu-vigilante-review-20261116.json`.
- Takum duplicate queue disposition is verified (9 rows resolved, 35 pending duplicates) but does not count as individual incident review. No user browser or project DeepSeek/Brave APIs used. Continue all 908 pending records autonomously; task incomplete.
- Pindiga's unsupported Jan 1 date was corrected to police-supported Dec 28, 2025 with exact-day precision; its abduction toll is preserved as 4+ because a second account says six. Guarded correction and live API/page verification are documented below and in `scratch/pindiga-date-correction/`.
- Zamfara's Magamin Diddi reconciliation meeting (39 abducted) and Goron Namaye farm attack (at least 17 killed, 13 wounded) are separate events per AP and PUNCH. Contemporaneous reports date the meeting June 7; a later AP recap says Thursday before the Friday farm attack. Preserve this source weekday conflict and do not merge or transfer casualty figures. Evidence: `zamfara-reconciliation-goron-namaye-review-20261116.json`.
- Sokoto IED candidate pair: PUNCH and Daily Post establish one Kurawa–Sabon Birni road blast on Sunday, June 28. The second record's only source returns HTTP 404 and its description is navigation text; no merge until event-specific evidence identifies it. Missing evidence and source checks: `sokoto-ied-pair-review-20261116.json`.
- Borno police briefing distinguishes coordinated April 4 attacks at Nganzai Police HQ (four officers killed) and Mallam Fatori IDP-camp post, Damasak (hunter Atom Abua killed). Separate target sites and victim sets; keep distinct. Evidence: `borno-nganzai-mallam-fatori-review-20261116.json`.
- Corrected Pindiga Gombe's unsupported Jan 1 date anchor to police-supported Dec 28, 2025; set exact-day precision and recomputed its identity hash. Police's named list establishes at least four abductees; another report says six, and the previous structured value was three. Now renders `4+`, preserving unresolved upper toll. Guarded dry/apply artifacts and direct API/page verification are documented in the decision ledger and `scratch/pindiga-date-correction/`.
- Benue Ekwu-Ora Odaba's repelled Sunday-night abduction attempt and Otobi-Akpa's later Tuesday attack are distinct per PUNCH; preserve police four versus local five deaths at Otobi. No merge. Evidence: `benue-ekwu-ora-otobi-sequence-review-20261116.json`.
- Dangulbi/Sokoto reports describe two attacks in the same village: May 31 attack with at least 17 killed and a separate June 2 attack with a community-reported minimum 20, while police awaited a field report. Keep separate tolls and the second report unconfirmed; no merge or summation. Evidence: `dangulbi-two-attack-review-20261116.json`.
- Plateau Mangu: New Telegraph and Trust Radio identify three named watchmen killed about 7:49 p.m. Tuesday at Kyikyau–Gyambwas boundary, Mangu LGA. Distinct from same-cycle Barkin Ladi incidents at Gagshi/Rakok and the Sep 21 Rakwok attack. No merge. Evidence: `plateau-mangu-vigilante-review-20261116.json`.
- Ogun Awa-Ijebu: the Nov 3 bus abduction (10 travellers; released unharmed Nov 7) is separate from two Nov 8 police gun battles, including the later operation that killed another suspect. The shared Daily Post article explicitly describes multiple operations; do not merge or add suspect deaths to the passenger toll. Later operation's exact location/time remain unreported. Evidence: `awa-ijebu-followups-review-20261116.json`.
- Kebbi: police reporting separates Oct 28 Wawilaiyi/Kystu (8 allocated by police versus PUNCH's 12) and Oct 29 Samanaji (3) as attacks in different villages on separate days. Both are distinct from the Oct 22 Samanaji Market Yan Sakai attack (3 killed, 4 injured). Keep the 12-versus-8 discrepancy and do not transfer the Samanaji toll. Evidence: `kebbi-wawilaiyi-samanaji-cluster-review-20261116.json`.
- Kano sequence: Chiromawa/Garun Malam (Aug 29), Rantan/Bebeji (Aug 30) and Beli/Rogo (Aug 31) are separately identified attacks. Rantan source reporting also says three people were abducted and police said three died, while named reports list two deceased and the live record stores zero abducted. Keep that toll unresolved and do not move it onto the Beli chairman's abduction. Beli itself has a source conflict over a resident shot during the attack. Evidence: `kano-three-attacks-review-20261116.json`.
- Abia: Zagazola directly separates Uche Simon's Jan 28 shooting while returning from ABSU from Awba Abdulsalam's Jan 29 fatal shooting at Nnuya/Nnunya Junction on the Port Harcourt–Enugu Road. Same Isuikwuato LGA and shared roundup article, different victims and circumstances. No merge. Evidence: `isuikwuato-two-events-review-20261116.json`.
- Kogi Ofu, Aug 9/26/27: Re-read the police statement, Army report, survivor account, later rescue reports, and PUNCH's APC and NYSC reports. The Aug 9 police 15-count and Army 16-count describe the same attack: the police list and survivor interview share Joshua Daniel and Ngozi Stephen; retain the unresolved 15/16 discrepancy. The Aug 26 NYSC abduction near Ogene Zaria/Onicha-Igo and Aug 27 Ishaq Yunusa killing at Ojuwo Olijo are separate by date, site and victims. An Aug 11 report describes a separate nine-person Ofu rescue but gives no original event date and has no active record in the fresh capture. The Aug 13 Benue bus is separate by state, location, date and victim group. No merge. Evidence: `kogi-ofu-august-review-20261116.json`; direct source and coverage recorder: ecord-kogi-ofu-august-review-20261116.mjs`.
- Adamawa Sep 30–Oct 1: TruthNigeria's full report and The Times Nigeria distinguish three events: the Garaha-Mojili 232 Battalion engagement (three soldiers and one forest guard killed, ten soldiers injured, two women abducted); a concurrent but separate Dakna village raid (two women and one child abducted); and the Oct 1 Zangula/Guyaku corridor event that triggered civilian flight without a reported Zangula casualty toll. The events have separate sites and victim sets; no merge or toll transfer. An Authority follow-up's aggregate displacement and The Sun/Theatre Command report of separate Garkida/Garaha and Boima operations were checked; no active matching Garkida/Boima record. The same-date Borno Marte farm massacre is separate by state, villages and victims. Garaha and Dakna are now BSON-backed Sep 30–Oct 1 ranges; direct API/pages passed. Evidence: `adamawa-zangula-dakna-garaha-review-20261116.json`; date correction artifacts `scratch/adamawa-midnight-date-correction/`.
- Hash integrity: recomputed `hashFor` across all 991 active incidents; found and repaired four stale hashes on existing date-range records after a zero-collision dry run. The final read-only audit reports 39 date-range records, zero mismatches and zero expected-hash collisions. Artifacts: `scratch/date-range-hash-repair/` and `scratch/active-date-range-hash-audit-20261116.json`.

## Current review, 2026-11-16 17:53 UTC

- Live capture: 991 active incidents and 35 pending duplicate-review rows. Coverage aligned to all 991 live IDs: 38 individually reviewed, 953 pending. The refreshed 7,602-pair index is a candidate list only. Continue from `scratch/duplicate-review-20261108-all-pairs/incident-coverage-recovery.json` and `decisions-continuation.md`.
- Additional source-grounded reviews: the Sep 20–22 Plateau incidents (Dorowa Babuje, Henry Elisha/Rakwok, Gagshi Road operative, Rakok civilians) remain separate; possible overlap of two unnamed Sep 21 Gashish travellers with Dorowa/other attacks is unresolved for lack of identities and exact site. The Feb 18 Kebbi Bui cluster remains as village records plus an overlapping district aggregate; no aggregate toll was added to village counts. See ledger and artifacts `plateau-victim-linkage-review-20261116.json`, `kebbi-bui-village-aggregate-review-20261116.json`.
- Date display local verification remains: direct HTTP E2E 13/13, live local API/page checks 9/9, TypeScript, focused ESLint, and webpack production build pass. Public deployment and rendered visual check remain pending.
- The Takum queue disposition is verified (9 rows resolved, 35 pending duplicates) but does not count as individual incident review. No user browser or project DeepSeek/Brave APIs used. Continue all 953 pending records autonomously; task incomplete.
## Current review, 2026-11-16 17:45 UTC

- Latest direct live capture: 991 active incidents; 35 pending duplicate-review rows. The recovery coverage is aligned to all live IDs: 30 individually source-reviewed, 961 pending. The 7,602 ranked pairs are candidate leads only. Continue from `scratch/duplicate-review-20261108-all-pairs/incident-coverage-recovery.json` and `decisions-continuation.md`.
- Nine Takum MACBAN duplicate queue rows were independently source-checked and resolved as the same event already recorded, with Sunday/Monday disagreement retained in the survivor's 8–9 November range. Exact-fingerprint guarded dry-run/apply artifacts are under `scratch/review-dispositions/`; direct Mongo verification confirms all 9 resolved and 35 duplicate rows still pending. Queue disposition does not count as a separate incident review.
- Individually reviewed the Gaa-Alla, Gaa-Oke Abba and Famole (11 June) Kwara records and the Konkoso, Tunga-Makeri and Pissa (14 February) Borgu records. Each remains separate by settlement and reported victim/circumstance evidence. Borgu's UNICEF ~56 figure is an unallocated preliminary aggregate; it was not added to village tolls. Pissa-specific civilian toll remains unestablished. Details and direct article links are in the continuation ledger and `borgu-cluster-review-20261116.json`.
- Date display now handles unknown dates, bounded ranges, legacy string ranges and month-only dates without presenting an anchor as an exact day. Disposable-database direct HTTP E2E: 13/13; live-data local HTTP API/page checks: 9/9; TypeScript, focused ESLint and 
pm run build -- --webpack` pass. The public deployment was not changed or checked; local verification is not production verification.
- No user browser, project DeepSeek/Brave API, discovery or adjudication script was used. Continue reviewing all 961 pending incidents individually, checking newly added/changed records against each fresh live capture, and keep unsupported event links unresolved. Goal remains incomplete.
## Current review, 2026-11-16 17:20 UTC

- Latest live capture: 991 active incidents and 44 pending duplicate reviews. Recovery coverage is aligned to the live IDs: 24 source-reviewed, 967 still pending. The 7,602-pair ranked index is a lead list only. Continue from `scratch/duplicate-review-20261108-all-pairs/incident-coverage-recovery.json` and `decisions-continuation.md`.
- Confirmed duplicate: Takum MACBAN chairman, kept `6af37ba383ba7d1028a7f57a`, absorbed `6afae6eae8072c03008ceb86`. Dry/apply artifacts are under `scratch/duplicate-reconciliation-20261116/` (`16-52-28-346Z` dry, `16-52-57-461Z` apply); 992 to 991 active, date integrity PASS. Survivor retains 14 sources and the 8–9 November date range; tombstone retains its source.
- The 13 November Gwarimpa firefighter attack and 14 November Karshi convoy incident were individually source-reviewed and remain separate. Both records were clarified with sanctioned dry/apply updates; source and direct HTTP/Mongo verification are in the continuation ledger and `live-review-*-verification-20261116.json`.
- Uncertain-date display is implemented locally. Disposable-database direct HTTP E2E passed 13/13 for unknown, bounded, month-only and legacy ranges plus filters/statistics. Direct HTTP against the local Next server connected to the live DB passed 9/9 API/page checks, including the 8–9 and 14–15 November labels. Mongo checks confirmed BSON Date endpoints and source retention. No deployment was performed; production rendering remains unverified. Do not claim the live public site has the UI fix until deployed and checked.
- No user browser, DeepSeek API, Brave API, or project discovery/adjudication scripts were used. The local review server uses port 3010; inspect its PID/working directory and stop only that server if it remains running. The disposable E2E server on 3117 was stopped after its run.
- Continue individual, source-grounded review of the 967 pending active records and 44 pending duplicate rows, reconcile additions after each fresh capture, and keep ambiguous pairs open with the missing evidence recorded. The task is not complete.

## Current review, 2026-11-15 19:23 UTC

- Takum chairman Leadership article became accessible and was linked to the existing survivor by named victim, location and circumstances; the 8–9 November range remains. Source added via sanctioned dry/apply, date integrity PASS, API/page 200 with 12 sources. Queue decision 6af9c7b463f3fe9dea81f933 passed its exact-fingerprint dry run; after an incomplete no-change attempt, the guarded retry applied and the resolved live row was verified. Full individual review and visual QA remain pending. See the rebuilt continuation ledger.

- Live recapture 2026-11-16 04:46:39 UTC: 990 active, 36 pending duplicate rows, with no active-record changes, additions, removals, or queue ID changes from 04:18. Coverage remains 22 source-revalidated and 968 pending. Additional Gidan Taba / Dan Tafki / Mariga rescue pair checks and conflicting Mukura/Rimi reports are in the continuation ledger; victim overlaps remain unresolved, and no additional individual review was completed.

- Gora/Unguwar Dambu: distinct attacks, no merge. Corrected both to unconfirmed, explained provisional publication-date anchors and unrelated March source, and preserved 15+ as a minimum. Sanctioned dry/apply, date integrity and both API/page 200 passed; exact-date display and both full reviews remain pending. See continuation ledger.

- Marit and Rakum mining attacks are separate events, based on village-specific 26 and 28 September reporting. Marit record context, named location, minimum casualty reporting and unsupported zeroes corrected via sanctioned dry/apply; date integrity and API/page 200 passed. Both full reviews remain pending; see ledger.

- Live capture 2026-11-16 04:55:57 UTC: 990 active, 36 pending duplicate rows, no added/removed IDs or queue changes since 04:46; only the documented two Katsina records and Marit changed. Coverage 22 revalidated / 968 pending; 7,628 ranked candidate leads are not review decisions. See ledger for unresolved Sabon Birni, Pindiga and cross-state rescue evidence.

- Zamfara Binoni Marafa and Kebbi Bena–Sawade rescues have different named victims and are separate operations. Corrected rescue descriptions, source attribution and origin/overlap uncertainty using sanctioned dry/apply; both APIs/pages 200 and date integrity PASS. Full reviews pending; see ledger.

- Live capture 2026-11-16 04:58:32 UTC: 990 active, 36 pending duplicate rows, no added/removed IDs or queue changes since 04:55; only the documented two cross-state rescue records changed. Coverage 22 revalidated / 968 pending; 7,623 ranked leads are not decisions.

- Abande and Anwase market attacks are distinct, source-checked events. Added reported several abductees to Anwase as 1+ with source via sanctioned dry/apply and date integrity PASS. Public API timed out twice and page timed out once; retry verification. Both full reviews pending; see ledger.

- Live capture 2026-11-16 05:03:29 UTC: 990 active, 36 pending duplicate rows; no added/removed IDs or queue changes since 04:58, only documented Anwase changed. Coverage 22 revalidated / 968 pending; 7,623 ranked leads are not decisions.

- Confirmed Osogbo Ojo Iku duplicate: AfrikTimes explicitly links police Arowomole injury account and Ita-Olokan death reports. Kept older 6ac4aff3a5aefe87fd6483ab, absorbed 6aef34714d9328b8f151ad4b through dry/apply, 990 to 989 active/date integrity PASS, four sources retained; conflicting name, precise location and fate preserved. Both API checks and survivor page timed out at 15 seconds; retry survivor 200, absorbed 404 and page/visual QA. Full review pending; see ledger and `scratch/duplicate-reconciliation-20261116/run-2026-11-16T05-05-13-708Z/`.

- Live recapture 2026-11-16 05:06:56 UTC: 989 active, 36 pending duplicate rows; one absorbed Osogbo ID removed and its survivor changed, no other active or queue changes. Coverage 22 revalidated / 967 pending, rank 7,588 leads only.

- Public retry succeeded: Ojo Iku survivor API 200 with four sources, absorbed API 404, survivor page 200; Anwase API/page 200 with two sources and 1+ abducted. These are HTTP checks, not visual rendered QA. Details in recovery ledger and `public-retry-20261116.json`.

- Dangulbi raids on 31 May and 2 June are explicitly separate in Daily Trust. Corrected the second record to attributed 20+ killed, kidnapping unknown and developing status via sanctioned dry/apply; API/page 200 and date integrity PASS. Full reviews pending; see ledger.

- Live capture 2026-11-16 05:11:55 UTC: 989 active, 36 pending duplicate rows; no additions/removals or queue changes since 05:06, only documented second Dangulbi record changed. Coverage 22 revalidated / 967 pending; 7,588 ranked leads only.

- Tela-Bala church burning and later Tela-Bala/Guyaku assault are separate; first attack has 8 vs 9 October date disagreement. Later record now attributes five feared deaths as an unconfirmed estimate without village allocation, via sanctioned dry/apply; API/page 200, date integrity PASS. Date correction and full reviews pending; see ledger.

## Artifact loss and recovery, 2026-11-15 19:15 UTC

- The original scratch directory disappeared; the original duplicate snapshot, ranked list, coverage/decision ledgers, manifests, and merge/verification artifacts are missing. No matching restore was found in the recycle bin or attached worktrees; VSS inspection requires administrator privileges, which were not used; cause unknown. Do not treat the historical artifact paths below as present.
- Recovered 383 historical decision fragments from this chat's execution history into scratch/duplicate-review-20261108-all-pairs/decisions-recovered-from-session.md; they are unverified historical fragments, not the original ledger. A new continuation ledger and direct live snapshot were created in that directory, and a new 7,589-pair candidate index was built locally; ranking is not proof or completed review. Reconstructed 112 historical manifest inputs into its recovered-manifests folder with provenance index; these are not original artifacts or proof of application and must not be replayed without fresh review and dry run.
- Gidan Taba SANA source linked via named Maradun official and family-room fire, added via sanctioned dry/apply; API/page 200. Queue fingerprint dry/apply passed and direct database verification confirmed resolution, artifact `scratch/review-dispositions/run-2026-11-16T04-17-24-962Z/`. Full review pending.
- Gidan Taba US News Reuters article body read directly from embedded article data; four repeated held rows passed fingerprint dry/apply and direct MongoDB verification, artifact `scratch/review-dispositions/run-2026-11-16T04-13-46-202Z/`. Full review pending.
- Gidan Taba Firstpost source was read directly, added by sanctioned dry/apply and API/page 200 verified. Three repeated queue rows passed fingerprint dry/apply and direct MongoDB verification, artifact `scratch/review-dispositions/run-2026-11-16T04-11-10-604Z/`. Full review pending.
- Three Gidan Taba repeat Reuters queue rows were source-checked, guarded dry/apply passed and direct database read confirmed all three resolved; artifact `scratch/review-dispositions/run-2026-11-16T04-07-52-645Z/`. Other inaccessible sources and full incident review remain pending.
- Yartsakuwa: added police reports, attributed 3+ injured and kept 3+ killed, unknown total abducted and Nov 14–15 date range; sanctioned dry/apply and BSON date checks PASS. Public API/page later returned 200 with range, counts and eight sources; rendered visual QA remains pending. Two guarded queue decisions applied, and direct MongoDB reads confirmed both resolved; artifact `scratch/review-dispositions/run-2026-11-16T04-02-43-087Z/`. The Sahara lead remains pending. Full review pending; see ledger.
- Gidan Taba Reuters held lead re-read and fingerprint dry/apply passed; direct database read confirmed it resolved, artifact `scratch/review-dispositions/run-2026-11-16T03-57-49-903Z/`. Full incident review pending.
- New Takum Leadership queue row repeats an article already source-checked and added to the survivor. New fingerprint dry/apply passed and direct database read confirmed the repeated row resolved; apply artifact `scratch/review-dispositions/run-2026-11-16T03-53-57-402Z/`. Repeat cause verified: duplicate-lead keys include changing reason text. A future fix must preserve distinct events in multi-event articles and use disposable ingestion E2E; see ledger. Other Takum leads still require their own source bodies.
- Kano Bichi Kwankwaso convoy: attributed campaign claim of injuries recorded as 1+ with unconfirmed status; sanctioned dry/apply and API/page 200. SolaceBase queue lead, independent confirmation, full review and visual QA pending; see ledger.
- Bauchi Ruga new record: single security-source report identifies Chinese drilling worker and police inspector killed; corrected to attributed 2+ with unknown attack time, sanctioned dry/apply PASS and API/page 200. Corroboration, full review and visual QA pending; see ledger.
- Ijami/Oglewu Benue new incident: corrected one injured driver, three abducted versus three escaped, and added matching Sun source via sanctioned dry/apply; API/page 200. Sun held-lead guarded dry/apply completed and direct database read confirmed it resolved as the same event; apply artifact `scratch/review-dispositions/run-2026-11-16T03-48-31-004Z/`. The separate Daily Trust lead remains pending. Full incident review pending; see ledger.
- Borgu Konkoso, Tunga-Makeri and Pissa are distinct villages; added UNICEF preliminary approximately 56 deaths across the three without assigning it to one village or adding it to existing counts. Sanctioned dry/apply passed, all three APIs/pages 200; full reviews, allocation uncertainty and visual QA pending. See recovery ledger.
- Lagos Epetedo birthday-party killings and Idumota Pedro shooting are distinct. Clarified unrelated 2025 source history and removed an unsupported precise clock time via sanctioned dry/apply; both APIs/pages 200. Full reviews and visual QA pending; see recovery ledger.
- Amassoma Blessing and Christian are distinct named victims and incidents; removed unsupported zero injuries/abductions from Christian via sanctioned dry/apply, API/page 200. Full reviews and visual QA pending; see recovery ledger.
- Oyo Globus Farm 8 and Cocoa Research Institute are separate victim groups and abduction dates; corrected Globus invalid LGA and narrative using sanctioned dry/apply, API/page 200. Full individual reviews and visual QA pending; see recovery ledger.
- Plateau Gagshi/Rakok source reports disagree on whether the three mourners died in the security ambush or a separate prior attack. Preserved distinct victim groups and documented uncertainty in both records via sanctioned dry/apply, APIs/pages 200; full individual reviews and visual QA pending. See recovery ledger.
- Abia Isuikwuato shared-headline pair is two distinct named victims in separate attacks. Both misleading two-death headlines, unsupported kidnapping zeroes and over-precise location corrected by sanctioned dry/apply; both APIs/pages 200, source history retained. Full individual reviews and visual QA pending; see recovery ledger and `scratch/duplicate-reconciliation-20261115/run-2026-11-15T21-29-23-152Z/`.
- Convoy Leadership lead: source re-read and matches the election-duty bus by its deployment and specific assignment. Guarded dry run and apply passed, and direct MongoDB verification confirmed review 6af9bef063f3fe9dea81e6b4 resolved with disputed dates and tolls preserved. Artifacts `scratch/review-dispositions/run-2026-11-15T21-15-23-808Z/` and un-2026-11-15T21-18-10-167Z/`. See recovery ledger.
- Live capture 2026-11-16 04:18:38 UTC: 990 active and 36 pending duplicate reviews; no new or absent IDs since 04:04 and only the documented pending Gidan Taba record changed. No revalidated record changed. See ledger. A capture-script bug had reset the new coverage file; five source-revalidated decisions were restored after live checks. The corrected script passed a SHA-256 non-overwrite check. The prior handoff reported 43 individually reviewed, but original coverage and supporting artifacts are missing; the new recovery coverage currently marks twenty-two revalidated and 968 pending reconciliation or review (including the Gusau–Funtua trailer, Kogi NYSC, Mamunu, Kakafu, Kungaboku, Kukawa, Danjuma, Ejiba and Obajana; see recovery ledger); the prior 43 remain historical claims until their evidence and live changes are checked. Continue the full review, preserve uncertainty, and independently verify past merges and current sources.
- Local date-display and ingestion changes remain undeployed. Their previous test artifacts were lost with scratch; search-led ingestion E2E was reconstructed and rerun 7/7, date HTTP E2E 13/13 and summary integration 7/7 with no model/search APIs; fresh TypeScript, focused ESLint and webpack build PASS. Repeat remaining required checks and visual QA before release. Six unknown-date corrections were not applied; their manifest was lost and must be reconstructed from source evidence. Do not use the project's DeepSeek or Brave APIs.

## Current duplicate audit, 2026-11-15 15:32 UTC

- Oto-Awori–Ijanikin 69a3739370d4087410baa13d: corrected unsupported three deaths/zero injuries to one-plus killed and seven-plus injured, attributed source disagreement, removed ungrounded zeroes and corrected weekday. Sanctioned dry/apply/date integrity PASS; production API/page 200. Full duplicate review and visual QA pending. See ledger.

## Current duplicate audit, 2026-11-15 15:29 UTC

- Ilese Ogun 69a8f1daca96cbfc90eb44f1: replaced an unsupported 2026 robbery account with the source-supported 29 November 2025 suspected cult clash, two reported deaths and Ilese location with LGA discrepancy noted. Sanctioned dry/apply/date integrity PASS, API/page 200; full duplicate review and visual QA pending. See ledger.

## Current duplicate audit, 2026-11-15 15:17 UTC

- Live capture 15:17:57 UTC: 987 active, 52 pending duplicate rows, 43 individually reviewed / 944 pending. Gida Fulani three-person rescue individually reviewed; possible overlap with unnamed Maidubu survivors remains unresolved. Two Gidan Taba Reuters queue leads resolved after guarded dry/apply and verified; differing tolls retained. Three Takum decisions were resolved after guarded dry/apply and verified; one blocked Leadership lead remains pending. See ledger.

## Current duplicate audit, 2026-11-15 14:56 UTC

- Live capture 14:56:33 UTC: 987 active, 54 pending duplicate rows, 42 individually reviewed / 945 pending, no new IDs or changed reviewed incidents. New Gidan Taba Reuters leads match the existing event; one source added via sanctioned dry/apply and API/page verified, toll differences remain. The two exact-fingerprint queue decisions have a dry run in progress; Kaura mosque aide is named in accessible sources but the queued SolaceBase article is blocked by verification. No queue dispositions applied. See ledger.

## Current duplicate audit, 2026-11-15 14:55 UTC

- Mubang IED 69c860208644e9af8ac29449: corrected event date to January 14 and retained injury disagreement (six versus none), via sanctioned dry/apply, API/page 200. Full individual review and visual QA pending; see ledger.

## Current duplicate audit, 2026-11-15 14:50 UTC

- Separate Ekwu-Ora Odaba and Otobi-Akpa records had a cross-event headline and unsupported/conflicting tolls; corrected both via sanctioned dry/apply, date integrity PASS, APIs/pages 200. Both full individual reviews and visual QA remain pending. Live 14:51:10 UTC: 987 active, 51 pending duplicate rows, 42 reviewed / 945 pending, no new IDs. See ledger.

## Current duplicate audit, 2026-11-15 14:39 UTC

- Yartsakuwa 6af9bed51e7f7918f157c3a1: corrected unsupported exact four deaths to conservative 3+ with survivor/security-account disagreement explained; sanctioned dry/apply PASS, production API/page 200. Full individual review pending. Live 14:39:42 UTC: 987 active, 51 pending duplicate rows, 42 reviewed / 945 pending; no new IDs. See ledger.

## Current duplicate audit, 2026-11-15 14:33 UTC

- Live reconciliation at 14:30 had 988 active, 51 pending duplicate rows, 42 reviewed / 946 pending. Three new leads added to coverage; no reviewed records changed. A local cross-state normalized shared-source/date-compatible hold prevents this repeat from being silently reinserted; disposable ingestion E2E 7/7 and TypeScript PASS, final lint/build pending. New 6af9bed51e7f7918f157c3a3 was a confirmed duplicate of older convoy 6ae8efa0eec24a506cafbd4a and was merged via dry/apply artifacts; post-merge 14:34 capture: 987 active, 51 pending rows, 42 reviewed / 945 pending; API/page survivor 200 and absorbed 404, 29 sources and casualty/date disputes preserved. Retargeted one held candidate. The survivor had an existing full individual review, rechecked after this absorption; its disputed details and visual QA remain pending. See ledger.

## Current duplicate audit and date display, 2026-11-15 13:48 UTC

- Live 13:48:58 UTC: 985 active, 45 pending duplicate queue, 42 individually reviewed / 943 pending; no newly added IDs. Hussaini changed by BSON repair.
- Hussaini 6ae3a62ff00297451eff3f93: corrected existing string date-range endpoints to BSON dates via sanctioned dry/apply, preserving 20–27 October, all nine sources and date disagreement; database types and production API 200 verified. Full individual review pending; see ledger.

## Current duplicate audit and date display, 2026-11-15 13:42 UTC

- Live 13:42:26 UTC: 985 active, 45 pending duplicate queue, 42 individually reviewed / 943 pending. Two new records (Zamfara mosque and Opebi Road) and three changed pending records need review. Kaso's new follow-up was read and confirms its existing six-person accounting. Opebi road attack and Oregun venue attack are separately located episodes; do not merge on rally/date alone. See ledger.
- Date display, range-aware list filters, period/chart totals and unknown-date ingestion holds are implemented locally, not deployed. Disposable HTTP E2E 13/13, summary integration 7/7, search-led ingestion 7/7, legacy ingestion 4/4, TypeScript, focused ESLint and webpack build PASS. Codex IAB was unavailable, so visual QA remains pending; default Turbopack build could not resolve @alloc/quick-lru. Six source-reviewed unknown-date records have a dry-run-only manifest: deploy compatible code and verify it first, then rerun dry run before applying. Warm live-data local stats requests measured 1.1–1.46 s before the final annual-boundary refinement; deployed timings came from a different environment and are not a controlled comparison. See ledger for artifacts and remaining risks.

## Current duplicate audit, 2026-11-15 08:33 UTC

- Jigi four-person rescue 6a9389a4d17b55c4bc6dbeda corrected to explain that April 28 is the rescue date, not a proven abduction date; LGA remains uncertain and unsupported zero casualties removed. Dry/apply/date integrity PASS; API/page 200. UI still presents the anchor as an exact date; visual QA and full duplicate review pending. Seek victim names and abduction chronology; see ledger.
- Live 08:33:20 UTC: 983 active, 41 pending queue, 42 individually reviewed / 941 pending; no additions, only Jigi changed.

## Current duplicate audit, 2026-11-15 08:31 UTC

- Gida Dudu child abduction and rescue 6a9389a4d17b55c4bc6dbedc individually reviewed; distinct from the Yunusa and Barhama fatal cases and Jigi rescue. See ledger.
- Live 08:31:15 UTC: 983 active, 41 pending queue, 42 individually reviewed / 941 pending; no additions or changes.

## Current duplicate audit, 2026-11-15 08:29 UTC

- Both restored Barhama and Yunusa survivors individually compared with child-abduction, rescue and bordering-state records; June Gida Dudu child and two Plateau rescues are separate. Their rendered-page visual QA remains pending; evidence in ledger.
- Live 08:29:52 UTC: 983 active, 41 pending duplicate queue, 41 individually reviewed / 942 pending; no additions or changes.

## Current duplicate audit, 2026-11-15 08:27 UTC

- Repaired erroneous Bauchi merge: restored distinct Barhama 6a9389a4d17b55c4bc6dbed7 after guarded disposable E2E and live dry/apply; merged duplicate Yunusa 6a9389a4d17b55c4bc6dbed6 into older 69d390743735577a597273a5 via sanctioned tool, dry/apply/date integrity PASS. Both survivor APIs/pages 200, absorbed API/page 404; visual QA and full individual duplicate review remain pending. Evidence, artifacts and commands in ledger.
- Live 08:27:17 UTC: 983 active, 41 pending duplicate queue, 39 individually reviewed / 944 pending. Earlier urgent note below is superseded.


## Current duplicate audit, 2026-11-15 08:11 UTC

- Tyungu Jam/Mbaav survivor individually compared; subsequent Tiga abduction remains separate. Prior merge needs visual QA.
- Bauchi record 69d390743735577a597273a5 conflates details of two separately named child victims and its attached source; investigate and repair before any merge with 6a9389a4d17b55c4bc6dbed6. See ledger.
- Live 08:11:21 UTC: 983 active, 41 pending queue, 39 individually reviewed / 944 pending; no additions or changes.

## Current duplicate audit, 2026-11-15 07:38 UTC

- Aso A/Maraba Gurku survivor 69c4a1612f6de7afd3bddc1c individually reviewed; initial-shooting date and subsequent victim accounts remain disputed. Prior merge needs visual QA.
- Plateau rescue 69be7a60bb4958cfe2a55973 has a March 19 stored date but its sole source predates it and describes February 22 Mansur, Bauchi abductees rescued in Plateau. Original identity and possible overlap with Gwana remain unresolved; see ledger.
- Live 07:38:18 UTC: 983 active, 41 pending queue, 38 individually reviewed / 945 pending; no additions or changes.

## Current duplicate audit, 2026-11-15 07:36 UTC

- Adesida farm residence 69ac3d9947631332eed2f4f2 individually compared with nearby Akure attacks; Ben Daniels, the Olawale couple and Kajola poultry-farm victims are separate. The abducted wife's later outcome remains unverified. See ledger.
- Live 07:36:26 UTC: 983 active, 41 pending queue, 37 individually reviewed / 946 pending; no additions or changes.

## Current duplicate audit, 2026-11-15 07:34 UTC

- Ishinkwo monarch 69ce84ac5f4d2fe4dba14803 individually reviewed, distinct from Francis Igwe. Corrected report-date error from April 2 to April 1 and unsupported zeroes to unknown; dry/apply and date integrity PASS, API/page 200, four sources. Visual QA pending. The nearby Isuikwuato record has source provenance problems and remains pending.
- Live 07:34:45 UTC: 983 active, 41 pending queue, 36 individually reviewed / 947 pending; no additions, only Ishinkwo changed. See ledger.

## Current duplicate audit, 2026-11-15 07:32 UTC

- Francis Igwe, 69a8f1e8ca96cbfc90eb450b, individually reviewed; police recovery reports are follow-ups, and Josephat Ikegwu is a distinct monarch. Prior merge remains valid; visual QA still pending. See ledger.
- Live 07:32:56 UTC: 983 active, 41 pending queue, 35 individually reviewed / 948 pending; no additions or changes.

## Current duplicate audit, 2026-11-15 07:31 UTC

- Wanka clash individually reviewed against border-area and date-shifted records; February Garga and later Nyalun events are separate. Competing 10 versus about 20 security deaths remain explicit; see ledger.
- Jigawa anti-banditry and Tor-Donga guard records remain unresolved: current sources do not identify their events, and similar 2025 reports lack provenance linking them to the 2026 records.
- Live 07:31:22 UTC: 983 active, 41 pending queue, 34 individually reviewed / 949 pending; no additions or changes.

## Current duplicate audit, 2026-11-15 07:28 UTC

- Oro-Ago 69d37c852af105398e777d9d individually compared with Oyate, Omugo, April Ifelodun attacks and 2025 Oke-Ode; sources identify separate events. Ajere/Olu-Ode identity remains unresolved. See ledger.
- Live 07:28:38 UTC: 983 active, 41 pending queue, 33 individually reviewed / 950 pending; no additions or changes.

## Current duplicate audit, 2026-11-15 07:27 UTC

- Corrected Oro-Ago 69d37c852af105398e777d9d to March 25 and Ifelodun using event-specific sources; 2+ reported killed, 1+ injured, and injured-person identity unresolved. Original unrelated source retained with qualification. Dry/apply/date integrity PASS; API/page 200, four sources. Full individual review and visual QA remain pending; see ledger.
- Live 07:27:06 UTC: 983 active, 41 pending queue, 32 individually reviewed / 951 pending; no additions, only Oro-Ago changed.

## Current duplicate audit, 2026-11-15 07:22 UTC

- Omugo church individually compared; later Oro-Ago security deaths, April Ifelodun raids and Ekiti church incident are separate. Early escape versus later death/release group accounting remains unresolved. Oro-Ago record 69d37c852af105398e777d9d has an unrelated source and needs its own source/toll correction.
- Live 07:22:23 UTC: 983 active, 41 pending queue, 32 individually reviewed / 951 pending; no additions or changes.


## Current duplicate audit, 2026-11-15 07:20 UTC

- Omugo ECWA record now includes five pastor-identified reported deaths in captivity and three returned worshippers, while explicitly preserving the conflict with early reports of three immediate escapes. The five are within the eight abducted. Dry/apply/date integrity PASS, API/page 200, four sources; full individual duplicate review and visual QA pending.
- Live 2026-11-15T07:20:07.311Z: 983 active, 41 pending duplicate queue; 31 individually reviewed / 952 pending, no additions and only Omugo changed.


## Current duplicate audit, 2026-11-15 07:16 UTC

- Uso church individually reviewed; separate Ekiti, Kwara, Benue and Enugu church events have different locations and victims. Omugo, Kwara has conflicting early rescue versus later captivity/death accounts and needs independent follow-up; see ledger.
- Live 07:16:56 UTC: 983 active, 41 pending queue, 31 individually reviewed / 952 pending; no additions or changes.


## Current duplicate audit, 2026-11-15 07:15 UTC

- Uso church 69a33b5c66d59b3f2ff96260 corrected from five remaining captives to six originally abducted; one was initially rescued and police later confirmed the other five released. Added source and removed unsupported zeroes. Dry/apply/date integrity PASS, API/page 200, three sources; full individual review and visual QA pending.
- Live 2026-11-15T07:15:06.096Z: 983 active, 41 pending duplicate queue, 30 individually reviewed / 953 pending; no additions, only Uso changed.


## Current duplicate audit, 2026-11-15 07:12 UTC

- Magamin Diddi three guards individually compared; the June same-district reconciliation abduction and Kebbi border officers have different victims. Wider high-casualty Tungan/Anka and Ware reports have no demonstrated victim linkage and remain unresolved; see ledger.
- Live 07:12:36 UTC: 983 active, 41 pending queue, 30 individually reviewed / 953 pending, no added or changed IDs.

## Earlier duplicate audit, 2026-11-15 07:11 UTC

- Magamin Diddi 699fd3875b4ea97b84dfa9ed now cites sources naming its three guards; unrelated original source remains as history. District precision and developing status corrected. The 23 February date is a provisional publication anchor because the report does not state the attack day. Dry/apply/date integrity PASS, API/page 200, three sources; full individual review and rendered QA pending.
- Live 2026-11-15T07:11:05.716Z: 983 active, 41 pending queue, 29 individually reviewed / 954 pending; no additions, only Magamin changed. See ledger.


## Current duplicate audit, 2026-11-15 07:08 UTC

- Batch 56 merged the two new Maidubu/Kontagora records: Anas and Sallama/Babawo were among the same eight abductees and later reported killed. Dry/apply and date integrity PASS; survivor API/page 200, absorbed API/page 404, three sources. Source reports give no incident date; November 14 is only a labelled publication anchor but UI still renders exact. Visual QA and survivor's full individual review remain pending.
- Potential overlap with the 5 November 16-person Kontagora rescue is unresolved because the Maidubu abduction date and released victims are unknown; obtain victim-level linkage before action. New Zoma incident is also pending. Four existing pending records changed, IDs and details in ledger.
- Live 2026-11-15T07:07:53.002Z: 983 active and 41 pending duplicate rows. See incident-coverage.json for active/absorbed status; all new and changed records remain pending.


## Current duplicate audit, 2026-11-14 20:27 UTC

- Tsauni Asiya Ghali individually compared; no confirmed duplicate or documented release. Its February 24 date is only the article publication anchor, but the UI may render it as exact. Find a supported attack date or safe unknown-date representation; see ledger.
- Live 20:27:05 UTC: 981 active, 41 pending duplicate queue, 29 individually reviewed / 952 pending, no additions or changes.

## Earlier duplicate audit, 2026-11-14 20:23 UTC

- Eleyewo couple individually reviewed; a named follow-up reports both released after ransom. Added source and release to the existing record, preserving the two abducted and one injured. Dry/apply and date integrity PASS, API/page 200; visual QA pending. Details in ledger.
- Live 2026-11-14T20:23:49.003Z: 981 active, 41 pending duplicate queue, 28 individually reviewed / 953 pending; no additions, Eleyewo changed.

## Earlier duplicate audit, 2026-11-14 20:20 UTC

- Dorowa–Jong herders individually reviewed. The 21 February Jol teenagers and subsequent Dorowa bar victims are separate; the teenagers do not have an obvious named active record and need a held-lead/missing-event check. See ledger.
- Live 20:20:46 UTC: 981 active, 41 pending duplicate queue, 27 individually reviewed / 954 pending, no active IDs added or changed.

## Earlier duplicate audit, 2026-11-14 20:17 UTC

- Kula six-traveller abduction individually reviewed; no confirmed active duplicate or evidenced later release. The police rescue in the contextual paragraph of its Premium Times article concerns the separate Ojije church victims. See ledger.
- Live 20:17:02 UTC: 981 active, 41 pending duplicate queue, 26 individually reviewed / 955 pending, no new or changed active IDs.

## Earlier duplicate audit, 2026-11-14 20:14 UTC

- Mandara 6994829fa2c2f07793f41d2c now attributes the 10-death allegation, uses an unknown numeric toll, and expresses the 15–16 February date ambiguity. Dry/apply and date integrity PASS; Mongo confirms BSON endpoints, API/page 200 and four sources. The military's 14 February Mandaragirau attack may overlap but has no proven victim linkage; full individual review and visual QA remain pending. See ledger.
- Live 2026-11-14T20:14:47.004Z: 981 active, 41 pending duplicate rows, 25 individually reviewed / 956 pending; additions 0, changed 6994829fa2c2f07793f41d2c.

## Earlier duplicate audit, 2026-11-14 20:10 UTC

- Live 20:10:53 UTC: 981 active incidents, no new or changed active IDs since 20:08:38, 41 pending duplicate rows, 25 individually reviewed / 956 pending. Guyaku football survivor, Maganho, Doma and Amua are individually reviewed; see the decision ledger. Relevant new or changed records require reopening comparisons.
- Generic Sokoto 69a124fea5deaa1c12f8693e has a February date but both linked reports concern separate April incidents. Its missing original provenance and victims leave its overlap unresolved; see Maganho review.
- Mayo-Ladde was corrected to 21 April and Hong LGA, preserving the nine-death village count and separating Pubagu in the description. Dry and apply PASS, date integrity PASS, production API and page HTTP 200; API has three sources. Full individual review and rendered visual QA remain pending.
- Zaranga/Nzangula 7 September pair remains unresolved: accounts repeat a witness and one outlet treats 12 as an update, but another explicitly describes separate villages. Need independent location identity or named-victim linkage; do not merge or add tolls.
- Tor-Donga guards 69900f8849d2e9163a0bce53 has two unrelated links and a closely matching June 2025 camp-attack report; its stored February 2026 identity lacks victim names or original provenance. Do not change the year without event linkage. See ledger.
- Jigawa anti-banditry office 69900f8849d2e9163a0bce4e has an unrelated cited source; a March 2025 Ringim report matches its unusually specific account but original provenance is missing. Do not change the year or clear it until identity is established. See ledger.
- Madagali/Hong aggregate 69c93f9f084b08cd09b277c2 overlaps the Kirchinga record 6a9389a4d17b55c4bc6dbebf but also includes separate Hong victims. AFP and Reuters vary on their count, and the 21 February and 24 February Garaha camp reports may be conflated. Resolve event-level Garaha representation and tolls before merging the aggregate; the current count may double-count. See detailed ledger entries at Adamawa aggregate follow-up and Additional Kirchinga toll evidence.


- Corrected historical farm incident 6af4cdceeac5dbf3a6f2b356: survivor interviews identify Oke-Ako, Ekiti, on 23 October 2025, not Ondo in November 2026. Two or more were abducted at the farm and one operator was subsequently killed; later captives are not automatically added. Artifacts correction-oke-ako-20251113/run-2026-11-13T23-00-33-401Z/ and correction-oke-ako-source-20251113/run-2026-11-13T23-01-20-867Z/ passed date integrity; API/page 200, five sources. See ledger.

- Kaso displaced-farmer incident 6af7554337c56a0ba227fbb0 and Kunkumi child incident 6af2d29f423334b8df2a61e4 have individual source-based comparisons against the 22:30 live snapshot, including cross-state and date-range candidates. On every new capture, compare added and changed records against these reviewed cases and reset an affected entry to pending, even if the reviewed record itself did not change. See the detailed decision ledger. Other active incidents still require full individual review.

- Resolved 14 source-checked Takum chairman leads and the Gombe checkpoint-shooting follow-up against existing incidents. Dry scratch/review-dispositions/run-2026-11-13T22-18-56-211Z/, apply run-2026-11-13T22-22-38-576Z/, direct database verification 15/15 resolved. Two PM News queue leads remain pending because the source was inaccessible; retain Takum's reported date disagreement. See ledger.

- Kunkumi child abduction 6af2d29f423334b8df2a61e4 now records one abducted and the reported rescue, with Channels' explicit November 8 attack date added. correction-kunkumi-20261113/run-2026-11-13T22-22-22-585Z/ passed date integrity; API/page 200. The later individual candidate review is recorded in the ledger.

- Dan Tafki, Sokoto rescue 6af775b4f31497835f216e18 now records the conflicting November 8–9 dates as BSON dates and two or more abducted; API/page 200. See correction-dan-tafki-date-20261113 artifacts and decision ledger. Bayelsa follow-up and distinct Awa-Ijebu queue decisions applied in scratch/review-dispositions/run-2026-11-13T22-12-29-868Z/.

- Rivers Mbiama incident 6af77c0dc8bdb307777be20d has an unsupported November 13 exact date: suspects were arrested October 22. The named victim's death is missing. Seek a supported date or safe unknown-date representation; see the decision ledger.

## Current duplicate audit, 2026-11-14 19:47 UTC

- Batch 55 merged the Guyaku/Sabon-Gari football attack into older 6a9f57ffdb88b34b038da3ee. Same match, witness and governor visit link reports; 29+ covers wider Guyaku/Telabala attack and is not additive. April 26 event date replaces April 28 publication date. Dry/apply date integrity PASS, 982 to 981 active, survivor API/page 200, absorbed API/page 404, six sources. Visual QA and full survivor individual review pending.

- Added Awapul event-specific police source and retained unrelated earlier links as history. API/page 200, three sources, police reported no casualties; unknown displacement count. Full individual review and visual QA pending.

- Monguno individually reviewed; military seven versus independent at-least-22 toll remains unresolved and non-additive. Mandara/Biu unconfirmed record needs separate provenance review. Live 19:47:04 UTC: 981 active, 41 pending duplicate rows, 21 individually reviewed / 960 pending. No additions; Awapul and Guyaku changed and duplicate absorbed. Coverage updated.

## Earlier duplicate audit, 2026-11-14 19:40 UTC

- Live 19:40:41 UTC: 982 active, 41 pending duplicate rows, 20 individually reviewed / 962 pending; no new IDs, only the still-pending Monguno record changed. Coverage updated.

- Monguno Charlie 13 corrected to 7+ military deaths with seven versus at least 22 separately attributed, unknown abducted, and April 12–13 BSON date range; removed unsupported details. Dry/apply date integrity PASS, API/page 200, four sources. Rendered QA and full individual review pending. See ledger.

## Earlier duplicate audit, 2026-11-14 19:36 UTC

- Live 19:36:30 UTC: 982 active, 41 pending duplicate queue rows, 20 individually reviewed / 962 pending; no new IDs, only Maiduguri bombings changed. Coverage updated.

- Maiduguri March 16 bombings individually reviewed. Police 23 deaths/108 injured and later NEMA at least 26/146 are attributed and non-additive; NEMA hospital subtotals add to 145. Dry/apply date integrity PASS, API/page 200, five sources, visual QA pending. See ledger.

- Monguno Charlie 13 discrepancy was subsequently corrected as recorded above; its individual duplicate review is still pending.

## Earlier duplicate audit, 2026-11-14 19:31 UTC

- Batch 54 merged the Bani Iru Ekun video and later named-victim ambush report into older 6ae3a957f00297451eff409d. Dry/apply date integrity PASS, 983 to 982 active, survivor API/page 200, absorbed API/page 404, four sources and 4+ detained. Group chair reports six ambushed and rescued; exact overlap with four individually described captives is unresolved. See ledger.

- Bani attack day is unknown; October 26 is the pre-existing publication-date anchor. Description and dateEvidence say provisional, but current UI still renders exact day. A safe unknown-date representation or stronger evidence is needed; rendered QA and full individual review remain pending.

- Live 19:31:37 UTC: 982 active, 41 pending duplicate queue rows, 19 individually reviewed / 963 pending after completing both Oyo Kajola reviews; no new IDs, only Bani survivor changed and duplicate was absorbed. Coverage updated.

## Earlier duplicate audit, 2026-11-14 19:22 UTC

- Live 19:22:57 UTC: 983 active, 41 pending duplicate reviews; 17 individually reviewed / 966 pending after the Kajola council secretary review. Only the pending January Ilu-Abo incident changed since 19:18; no new IDs. Coverage updated.

- January Ilu-Abo school proprietor attack corrected to one dead, two other injured, one abducted, date range January 25–26 based on early and later police accounts; avoids counting John Ofuduwa as both injured and dead. Dry/apply date integrity PASS, direct Mongo confirms BSON dates, API/page 200, five sources. Rendered QA and full duplicate review pending. See ledger.

- March 9 Ilu-Abo council secretary individually reviewed against named and cross-state candidates. Preserve 2+ abducted and distinguish a subsequent attack with contested toll. The Oyo Kajola abduction and later ransom-delivery killing have now been individually compared and retained as separate victim events. See ledger.

## Earlier duplicate audit, 2026-11-14 19:18 UTC

- Live 19:18:54 UTC: 983 active, 41 pending duplicate queue rows, 16 individually reviewed / 967 pending. No new IDs; only the Ben Daniels incident changed. Coverage inventory updated.

- Ben Daniels Agunla Farm Road incident individually reviewed against nearby, adjacent-state and date-shifted candidates; no further duplicate established. Removed unsupported zero casualty figures with dry/apply artifacts, date integrity PASS, API/page 200 and three sources. Rendered QA pending. See ledger.

## Earlier duplicate audit, 2026-11-14 19:13 UTC

- Live 19:13:46 UTC: 983 active, 41 pending duplicate queue rows, 15 individually reviewed / 968 pending after completing the Agamo source comparison; no new IDs, only pending Agamo record changed. Coverage updated.

- Agamo monarch corrected via dry/apply manifest: police give approximately 7:10 p.m. attack and 7:50 report, widow says shots missed; use day precision and unknown unsupported injuries, restore Agamo/Akure North location. Date integrity PASS, API/page 200, eight sources. Rendered QA pending; individual comparison is complete against the 19:13 capture. See ledger.

- Agamo monarch individually reviewed across neighbouring-state, named-ruler, date-shifted and follow-up candidates; no further duplicate confirmed. See ledger.

- Codex in-app browser initialization failed: no IAB backend discovered. No native browser was opened. Rendered QA remains outstanding; HTTP 200 alone is not visual verification. Ribah October 30/31 pair remains unresolved as documented in ledger; distinguish chronology and casualty sets before merging or adding counts.

- Live capture 19:07:15 UTC: 983 active, 41 pending duplicate reviews, 14 individually reviewed and 969 pending after the Gusau–Funtua cement-trailer source comparison. No new IDs since the 18:58 coverage inventory; only the still-pending May Anka incident changed. Coverage inventory updated.

- Corrected May 7 Bagega–Anka IED 6a944dd656ec3f9ab055e092 to six deaths and attributed 6–8 injured, with no invented exact location. Dry/apply artifacts and sources are in the ledger; date integrity PASS, API/page 200 and four sources. Rendered QA and full duplicate review remain pending.

- Gusau–Funtua cement-trailer individual comparison completed against the 19:07 capture; driver injury disputed. Generic June IED leads remain unresolved against other June cases. See ledger.

## Earlier duplicate audit, 2026-11-14 18:58 UTC

- Gusau–Funtua cement-trailer individual comparison has started; driver injury is disputed. The generic June 10 Zamfara 1-dead/7-injured IED report may overlap the June 8 Bagega–Anka Golf blast, but lacks route, vehicle, victims and attribution; do not merge without event-level linkage. The June Sokoto IED pair remains unresolved because the second record's sole article is inaccessible to Codex web and curl TLS failed, and its stored body is boilerplate. Do not merge on date/title/count. See ledger.

- Sokoto–Gusau election-duty police convoy individually reviewed against cross-state, date-shifted and police incident candidates. Sources conflict on police/guard casualty composition, abductions and exact place; keep reports attributed and do not add tolls. Against the 18:58 capture, 13 of 983 active incidents are reviewed and 970 pending. See ledger.

- Bukkuyum town defence has unknown casualties and a provisional October 31 publication-date anchor; police say clearance began October 28 but the precise attack date is unsupported. Dry/apply date integrity PASS, API/page 200. A safe unknown-date representation or stronger evidence is still needed, as are rendered QA and full individual review. Live 18:58:54 UTC: 983 active, 41 pending duplicate rows, 12 reviewed / 971 pending, no new IDs, only this pending record changed. See ledger.

- Wawilaiyi/Kystu casualty allocation corrected to an attributed 8–12 range: police quote eight there and three other deaths in Samanaji; Punch reports twelve there. The possible overlap is unresolved. Dry/apply date integrity PASS, API/page 200; visual QA and individual reviews pending. Live 18:55:52 UTC: 983 active, 41 pending duplicate rows, 12 individually reviewed / 971 pending, no new IDs; only this pending record changed since 18:47. See ledger.

- Rechecked high-casualty Tungan Dutse / Dutsin Dan Ajiya pair: Reuters' 50 may cover multiple villages; THEWILL describes separate Bukkuyum and Anka incidents while other reporting conflates names. Do not merge or add both 50-death figures without settlement mapping and victim/toll allocation. IOM indexed report is aggregate and direct access returned 403. See ledger.

- Kogi NYSC convoy individually reviewed across the affected corridor, neighbouring states and later rescues; the 11 early and 21 later rescue counts remain non-additive because victim overlap is disputed. Against the 18:47 capture, 12 of 983 active records are reviewed and 971 remain pending. See ledger.

- Batch 53 merged the Imo NYSC October 30 trial follow-up into the older October 1 Umunoha incident after direct source comparison; active 984 to 983, date integrity PASS, survivor API/page 200, absorbed API/page 404, 18 sources, 21 abducted. Rendered QA and full survivor review pending. Live 18:47:04 UTC: 983 active, 41 pending duplicate rows, 11 individually reviewed and 972 pending; no new IDs, only the pending survivor changed and its duplicate was absorbed. See ledger.

- Kogi NYSC Aloma–Egane record now incorporates the later reported 21 rescued and 2+ injuries, preserving uncertain overlap with the early 11 and conflicting 15/16 corps-member reports. Dry/apply date integrity PASS, API/page 200; visual QA and full individual review pending. Live 18:42:43 UTC: 984 active, 41 pending duplicate rows, 11 individually reviewed and 973 pending; only this pending record changed since 18:39. See ledger.

- Woro individually reviewed against neighbouring, date-shifted and rescue candidates; Nuku location and toll disputes remain attributed. Ora-Igbomina record corrected with two named victims, police search and source, distinct from Woro; dry/apply date integrity PASS, API/page 200, visual QA and its own individual review pending. Live 18:39:58 UTC: 984 active, 41 pending duplicate rows, 11 individually reviewed and 973 pending; only Ora-Igbomina changed since 18:35. See ledger.

- Woro location now preserves the conflict between initial Woro/Nuku reports and FIJ's survivor-based finding that Nuku was not attacked in that raid. Dry/apply date integrity PASS, API/page 200, 12 sources; rendered QA and full duplicate review pending. Live 18:35:56 UTC: 984 active, 41 pending duplicate rows, 10 individually reviewed and 974 pending; only pending Woro changed since 18:33. See ledger.

- Woro casualty reports independently checked against UNICEF, AP and governor reporting; figures differ and remain attributed. Date range corrected to February 3–4, Mongo date and both endpoints verified BSON, API/page HTTP 200, 11 sources; visual QA and full individual review pending. Live 18:33:02 UTC: 984 active, 41 duplicate rows, 10 reviewed, 974 pending; only Woro changed since 18:29. See ledger.

- Live capture 18:29:12 UTC: 984 active, 41 pending duplicate rows, 10 individually reviewed and 974 pending; the additional review is Danjuma and wife, with the unnamed September road rescue still unlinked. No new IDs and only the pending Dandume record changed since 18:24. Coverage baseline updated.

- Corrected Dandume–Damari three-traveller rescue 6aaf77ab227884560cbe8872 to the military-stated September 17 date, named victims and readable narrative; dry/apply date integrity PASS, API/page HTTP 200, visual QA and full individual review pending. This is distinct from the February Danjuma couple. See ledger.

- Tsauni Asiya Ghali record now has its actual source and unknown unsupported casualty fields; the exact attack date remains unproven. Dry/apply date integrity passed, API/page HTTP 200, visual QA and individual review pending. Live capture 18:24:33 UTC has 984 active, 41 duplicate queue rows, 9 reviewed and 975 pending; no new IDs and only this pending record changed since 18:17. See ledger for artifacts.

- Wuturo record corrected to one killed and one injured from source-specific police evidence, preserving six sources; dry/apply date integrity PASS and API/page 200, visual QA pending. Separate March Kukawa/Goniri incidents need review. A generic Adamawa aggregate has an unsupported February 3 date; AFP explicitly links its 21-death market component to Kirchinga, already represented by the 18-death Kirchinga record. It also includes four Hong deaths, so do not merge it into Kirchinga. Resolve overlapping statistics safely and investigate whether the Hong four are the earlier Garaha attack or overlap Reuters seven; sources and conflicts are in the ledger. See ledger.

- Kaso displaced-farmer held lead was source-checked, dry-run, resolved and verified; its existing full review remains recorded. Details in the ledger.

- Three Obelagu, Pantami convoy and Lagos town-hall held leads passed dry/apply and were verified 3/3; the earlier long-running process completed. Kukawa individual review is recorded, with separate March Kukawa/Goniri incidents still to review. Artifacts and caveats are in the ledger.

- Eight Gidan Taba Reuters mirror leads were independently checked, resolved, and verified 8/8; inaccessible US News, Firstpost and Investing leads remain pending. The source-conflicting casualty figures remain unchanged. Four Belsho held leads were independently source-checked and resolved, verified 4/4; artifacts are in the ledger. The latest capture includes these dispositions. One held Bashiru Olajide duplicate lead was source-checked and resolved; dry/apply artifacts and direct verification are in the ledger. Millennium City raid versus eight-person rescue remains unresolved without victim-level linkage.

- Arome duplicate was already merged in batch 13 on November 8, superseding stale warnings. Rechecked live survivor and tombstone November 14: BSON range endpoints, five sources, survivor API/page 200, absorbed API/page 404; disposable CLI date-range test passed 5/5. Dates still conflict, visual QA pending. Full evidence and artifacts in the ledger.

- **Incomplete active goal:** individually source-review every active incident and plausible cross-border/date-shift/follow-up duplicate, merge only confirmed duplicates with the sanctioned dry-run/apply tool, and verify real APIs and rendered pages. Do not use project DeepSeek or Brave APIs. Pair ranking and inventory are not completed reviews.
- Latest live capture 2026-11-14 18:17 UTC: **984 active, 41 pending duplicate rows**. `incident-coverage.json` records nine individually reviewed (Kaso displaced farmers, Kunkumi child, Ejiba farm workers, Obajana pipeline worker, Utonkon–Okpoga travellers, Kungaboku raid, Kakafu family, Mamunu, Kukawa) and 975 pending. New Ilorin Gidado family record was corrected to October 25 and four abducted from the November 13 follow-up date; dry/apply artifacts and 200 API/page checks are in the ledger, visual QA and full duplicate review remain pending. Its possible overlap with older Abangbe Dilu record 6ae789964e053510d59b4e73 is unresolved: sources need a named-victim or explicit family link, see ledger; two changed political-procession records are distinct from the seven reviewed incidents. Amua received source correction (dry/apply and verification in ledger). Previously, no active IDs were added or records changed from 11:11 to 11:16; the February Bui aggregate had gained Trust Radio evidence since 11:09, distinct from the seven reviewed incidents. Mamunu individual comparison is documented in the ledger, with the district-aggregate overlap, toll conflicts and four queue pairs unresolved. Two new Gidan Taba Reuters leads point to an inaccessible Investing.com source and remain pending direct source verification. Reconcile new or changed records against reviewed incidents and reopen affected coverage; see `decisions-continuation.md` for exact searches, source comparisons, unresolved pairs and merge artifacts. HTTP checks do not verify rendered visuals; visual QA remains outstanding. Bui aggregate 6aef420a57a5b9cf1872dcc6 now notes 33/34/35+ reports, Trust Radio added via dry/apply scratch/duplicate-reconciliation-20261114/run-2026-11-14T11-10-45-059Z/ and run-2026-11-14T11-11-02-235Z/, date integrity PASS, API/page 200, visual QA pending. Production statistics still double-count its 33 deaths against village records; the aggregate is not an exact single-village duplicate. Investigate a safe aggregate exclusion model. Balia immigration officer 6aae5e7c49374bb7212fa3cf corrected to March 17 and Borgu/Balia, unsourced zeroes removed; dry/apply scratch/duplicate-reconciliation-20261114/run-2026-11-14T07-31-59-317Z/ and run-2026-11-14T09-53-11-167Z/, date integrity PASS, API/page 200; visual QA pending. Kungaboku 6aae5e7a49374bb7212fa3ca corrected from 20 to seven abducted, March 5, and one killed; 19 rescued includes other victims. Dry/apply scratch/duplicate-reconciliation-20261114/run-2026-11-14T07-29-05-137Z/ and run-2026-11-14T07-29-27-078Z/, date integrity PASS, API/page 200, visual QA pending. Individual Kungaboku comparison completed against 11:02 capture; police and NAN describe 20 versus 19 rescued around Gidan Dogo, and a 20-name list plus separate Paze household attacks require victim-level linkage before treating totals as identical or creating additional historical incidents. See ledger. Karku priest 6a9f0bafe30260a441ac8dff now preserves diocese headcount disagreement (3–8 killed, 9–11 abducted) and priest release; dry/apply scratch/duplicate-reconciliation-20261114/run-2026-11-14T07-25-51-640Z/ and run-2026-11-14T07-26-12-041Z/, date integrity PASS, API/page 200; visual QA pending. Oba-Isin Raheem/Funke Ogunrinde record 6aae5e7849374bb7212fa3c4 corrected to February 11 and relevant sources, retaining unrelated prior source with explanation; dry/apply scratch/duplicate-reconciliation-20261114/run-2026-11-14T07-16-52-184Z/ and run-2026-11-14T07-17-28-774Z/, date integrity PASS, API/page 200, visual QA pending. Independently verify purported release. Ibadan schoolgirl 6aae5e7749374bb7212fa3c3 corrected to February 12, one victim and family-reported release; dry/apply scratch/duplicate-reconciliation-20261114/run-2026-11-14T07-20-19-699Z/ and run-2026-11-14T07-21-12-950Z/, date integrity PASS, API/page 200; visual QA pending. Utonkon–Okpoga release follow-up added to 698f90eb7769ddd085dddfcc after dry/apply scratch/duplicate-reconciliation-20261114/run-2026-11-14T07-09-54-891Z/ and run-2026-11-14T07-10-31-483Z/, date integrity PASS, API/page 200; visual QA pending. Utonkon–Okpoga individual comparison completed against 11:02 capture, with scope and sources in the decision ledger. Kakafu individual comparison completed; overlap between the two four-person descriptions remains explicitly unresolved and needs named-victim linkage. Continue remaining individual reviews and reconcile new or changed records. Edo aggregate 6aae5e7749374bb7212fa3c1 corrected to February 8 Makeke, 3+ initially abducted with five-person disagreement, source history retained; dry/apply scratch/duplicate-reconciliation-20261114/run-2026-11-14T07-05-06-230Z/ and run-2026-11-14T07-05-39-456Z/, date integrity PASS, API/page 200, visual QA pending. Separate Auchi family needs an event date and generic duplicate check before insertion. See latest ledger entries before any history-preserving split, then continue remaining reviews and recapture live data.
- Latest live sequence: batch 45 and 46 reduced active 977 to 975; promotion of independently source-confirmed Gombe checkpoint shooting brought it to 976. Four same-event Gombe convoy queue rows resolved. Promotion inserted a record but left its row pending because candidate date was stored as a string and the script matched a BSON Date; separate evidence-backed disposition resolved it. Check row status for future promotions and repair/test the tool before relying on automatic resolution. Peter Kwen source correction and its queue disposition completed; see continuation ledger for artifacts. Use curl for HTTP: Python urllib gets 403 but curl returns live 200/404. User requests that their browser not be used.
- Gombe NSCDC outpost shooting follow-up added to already promoted driver incident `6af739e3829eb127cf90df05` with one injured; `scratch/duplicate-review-20261108-all-pairs/correction-gombe-outpost-20261113/run-2026-11-13T22-12-10-986Z/`, date integrity PASS, API/page 200. Queue lead `6af775c563f3fe9dea7dc7e9` still needs evidence-backed recorded disposition against this incident.
- Batch 52 disentangled a Delta/Kebbi political-violence roundup: merged its misallocated Delta death into older Asaba `6aef8659fe62640995427394` (1 killed, 5+ injured; conflicting reports attributed) and preserved the distinct November 5 Kebbi event with the source attached. `scratch/duplicate-review-20261108-all-pairs/batch-52/run-2026-11-13T22-05-49-982Z/`, 984 active, date integrity PASS; both survivors API/page 200, absorbed API/page 404. Visual QA pending.
- Corrected the source-confirmed missing one fatality for NSCDC Inspector Anyebe A. Abutu on November 10, `6af7554337c56a0ba227fbb2`; `scratch/duplicate-review-20261108-all-pairs/correction-agatu-nscdc-20261113/run-2026-11-13T22-03-15-029Z/`, date integrity PASS, API/page 200. Full candidate comparison remains pending.
- November 4 Kaso night household raid (seven abducted, one released) is distinct from the November 13 Kaso road abduction (six abducted, two released). Updated older family narrative without inventing an injury count; `scratch/duplicate-review-20261108-all-pairs/correction-kaso-family-20261113/run-2026-11-13T22-00-32-334Z/`, date integrity PASS, API/page 200.
- Ejiba November 12 four abducted and Kaso November 13 six abducted remain separate; source-backed records now note all four Ejiba victims rescued and two of six Kaso victims released, without changing original abduction counts. `scratch/duplicate-review-20261108-all-pairs/correction-kogi-kaso-20261113/run-2026-11-13T21-59-05-313Z/`, date integrity PASS, both APIs/pages 200. Full candidate comparison still pending.
- Batch 51 merged the Obele Junction sack-body duplicate into older `6af61fa33ce10f214e7aab02`, preserving November 9, one death and four sources. `scratch/duplicate-review-20261108-all-pairs/batch-51/run-2026-11-13T21-56-29-260Z/`, 985 active, date integrity PASS, survivor API/page 200 and absorbed API/page 404. Visual QA pending.
- Batch 50 merged the November 5 Kontagora-area 16-person rescue duplicate into older `6aef864afe6264099542733e`; the 21-person November 9 Mariga operation is distinct. `scratch/duplicate-review-20261108-all-pairs/batch-50/run-2026-11-13T21-54-54-759Z/`, 986 active, date integrity PASS; survivor API/page 200 and absorbed API/page 404, 16+ abducted, two sources. Visual QA pending.
- Corrected `6af7757af31497835f216dc6` as a later police gun battle, removing the ten abductees already recorded in the November 3 Awa-Ijebu bus event; one suspect killed in this encounter, another in a separate operation. `scratch/duplicate-review-20261108-all-pairs/correction-awa-followup-20261113/run-2026-11-13T21-52-49-283Z/`, date integrity PASS, API/page 200. See ledger.
- Batch 49 merged two confirmed Akintobi–Alabata farm abduction duplicates into older `6af6c8c800bfc3aa919ef691`, corrected four abducted and unknown LGA; the ten Awa-Ijebu bus passengers are a separate incident. Dry/apply `scratch/duplicate-review-20261108-all-pairs/batch-49/run-2026-11-13T21-49-45-616Z/` and un-2026-11-13T21-50-09-859Z/`; 987 active, date integrity PASS; survivor API/page 200 and both absorbed APIs/pages 404, three sources. Visual QA pending.
- Merge queue integrity repair: the merge tool previously resolved unrelated third-incident comparisons and missed reverse-oriented pairs. Audited 83 automatically resolved reviews and found four affected rows, reopened and retargeted with fingerprinted dry-run/apply artifacts `scratch/review-dispositions/run-2026-11-13T17-36-23-033Z/` and un-2026-11-13T17-37-44-479Z/`; three were subsequently source-reviewed and dismissed as distinct in `scratch/review-dispositions/run-2026-11-13T17-41-29-072Z/`; the Kaduna Nuru Suraj versus eight rescued victims comparison remains pending due to missing victim linkage. `scripts/merge-incidents.ts` now resolves exact pairs in either direction and retargets remaining references. `scripts/apply-review-decisions.ts` supports guarded restoration. Disposable CLI E2Es passed 4/4 merge-link and 3/3 restoration checks, and direct TypeScript check passed. See ledger for IDs and evidence.
- Source-reviewed Danko November 3 two-person rescue versus later November 5 Maga fatal abduction as distinct; queue disposition `scratch/review-dispositions/run-2026-11-13T17-44-54-705Z/`. The seven other rescued people were a separate operation. See ledger.
- Enugu Obelagu Umuamba `6af576a012ec0ea5043228dc`: source reports 2 killed and 2 injured, but stored November 10 exact date was the security visit, not a dated attack. Supported lower bound is unavailable and the current date model requires a bounded range; do not invent one. Queue row `6af5770c63f3fe9dea79fd2f` remains pending correction; see ledger for sources.
- Kade Daba `6aba77fa2dacfb136e737de3` corrected from 10 to 4+ abducted after military reporting showed the other six were rescued from a vehicle in a separate Tsafe incident, without evidence of their abduction. A second source identifies the separate six-person Tsafe rescue as the Sarkin Samari family on 26 September, distinct from the 27 September road incident; `correction-tsafe-family-20261113/run-2026-11-13T17-25-32-936Z/`. Artifacts `correction-kade-daba-20261113/run-2026-11-13T17-24-27-539Z/`, API/page 200.
- Separate Riyom June attacks corrected from direct sources, preserving conflicting names; `correction-riyom-june-20261113/run-2026-11-13T17-22-44-359Z/`, API/pages 200.
- Open possible farm overlap: Gwom-Ajang/Barkin Ladi versus Ashakon/Mangu on 24 October name similarly spelled injured women but conflict on ages, dead names and settlements. Do not merge without independent victim/location linkage; exact sources in ledger. Dong/Jos North was corrected from its own source; see ledger.
- Ankpali record `69dd206f95ffb6557d7d6d21` corrected a multi-community 14-death aggregate to the source-supported 9+ Ankpali fatalities and 1+ injuries, preserving the competing ten report; `correction-ankpali-allocation-20261113/run-2026-11-13T17-17-32-320Z/`, date integrity PASS, API/page 200. Check whether distinct Adija and Upu events exist.
- Batch 48 merged Obele Ovom metal-scavenger accounts into older `6a9389a4d17b55c4bc6dbee5`, correcting date to 12 July and retaining 1 killed/3 injured; `batch-48/run-2026-11-13T17-19-42-130Z/`. Active 974, date integrity PASS, survivor API/page 200 and absorbed API/page 404 (`batch-48/curl-verification.json`); visual QA pending.
- Batch 47 merged Makurdi Aliade Street six/eight death reports into older `6a9389a4d17b55c4bc6dbef6`, preserving 6–8 deaths and injury disagreement; `batch-47/run-2026-11-13T16-38-56-103Z/`. Active 975, date integrity PASS, survivor API/page 200 and absorbed API/page 404 (`batch-47/curl-verification.json`); visual QA pending.
- Batch 46 merged the disputed Yari-residence report into older `6aa66e1b0f312b04e442d63d` while correcting the road location and preserving conflicting victim counts/occupations; artifacts `batch-46/run-2026-11-13T16-18-02-321Z/`, date integrity PASS, 11 sources. Terminal curl confirmed survivor API/page 200 and absorbed API/page 404, eleven sources; `batch-46/curl-verification.json`. Visual layout remains unverified.
- Batch 45 merged Kinuba mine accounts into `6ad666a7ce112497dbbd1574` with Reuters/AFP toll differences preserved; apply artifacts `batch-45/run-2026-11-13T16-13-52-541Z/`, date integrity PASS. Production Chrome displayed survivor JSON and incident content with seven sources and 15+/6+, and the absorbed API/page showed not found. Terminal curl confirmed survivor API/page 200 and absorbed API/page 404, seven sources; `batch-45/curl-verification.json`. Python urllib received 403, but curl works. Visual layout remains unverified (screenshot timed out).
- Previous merge batch 44: Jan 10 Udeku security-officer reports merged into `69c860238644e9af8ac2946e`, distinct Jan 6 farmer attack corrected separately. Applied artifacts `batch-44/run-2026-11-12T22-36-19-215Z/`; both public survivor and corrected farmer APIs/pages returned HTTP 200 and absorbed ID returned 404. Rendered-page verification remains outstanding, as do full individual review and remaining source checks.
- Keep unresolved Rimi/Mukura potential overlapping rescues, Kebbi Bui district total overlapping village incidents, and vague Sabon Birni road IED separate until source evidence resolves identity. The overlapping Kebbi aggregate can inflate statistics. Woro source conflicts and all other specific cautions are in the ledger. Do not treat older entries below as current counts or open issues when superseded by the ledger.
- Next: compare three new and five changed records to their prior artifacts and source evidence, review remaining ranked and newly discovered plausible pairs individually, reconcile live duplicate queue, continue dry-run/apply and API verification. Do not mark incident coverage complete without full comparisons. Repair local dependency installation before rerunning focused lint/build; the earlier TypeScript and real-CLI disposable E2E passed, but lint/build and rendered visual QA remain unverified. The 17:41 retry failed because local `@babel/core` and the 
ext` executable are missing.

## 2026-11-13 Scan slots moved to DeepSeek off-peak

- `deploy/systemd/terror-scan.timer` is now `OnCalendar=*-*-* 11,23:00:00 UTC` (12:00 and 00:00 Lagos), superseding the 08:00/20:00 UTC slots recorded under 2026-10-29. DeepSeek bills 2x between 01:00-04:00 and 06:00-10:00 UTC on weekdays and half price at every other hour, weekends included, so the 08:00 slot paid peak rates on every weekday run. 11:00 UTC sits an hour clear of the 10:00 boundary, 23:00 UTC two hours clear of the 01:00 one, and a retry 20 minutes later is still off-peak. Slots stay 12h apart, so `SCAN_HEALTH_STALE_HOURS=18`, the hourly watchdog and the 20:30 UTC dead-man are unchanged. Weekly catch-up stays Sunday 14:00 UTC (off-peak all weekend) and its comment now names the new slots.
- Cost basis, DeepSeek platform CSV for key "Terror Tracker", 15 days (2026-10-30 to 11-13): $6.93 total, search calls $3.84, tokens $3.08. 2026-11-07 alone was $3.80 (3,173 requests, 3,828 searches) and was the operator's own audit backfill, so it is excluded as a one-off. Without it the run rate is about $6.7/month: tokens $4.6, search $2.1. Peak-priced tokens were about $2.4/month, so this move should save about $1.2/month. Search bills at $0.75 per 1,000 calls with no off-peak discount, so timing does not touch it.
- Operator decision 2026-11-13: no per-process cap on DeepSeek searches. Brave keeps its 40-call cap; DeepSeek stays uncapped, so a deliberate backfill can still spend a few dollars in one day.
- Model name is now `deepseek-flash` in `src/lib/deepseek.ts`, `scripts/rescue-held-locations.ts`, `.env.example`, `.github/workflows/daily-scan.yml` and both `deploy/env/*.example` files.
- **Regression found in the first test run, fixed the same evening.** The rename was not behaviour-neutral: the legacy `deepseek-chat` alias is served with thinking mode OFF, while `deepseek-flash` enables it by default. With the small `max_tokens` used here (400/500/700), reasoning consumed the budget and content came back empty: 8 "DeepSeek duplicate check returned an empty response", `deepseekErrors: 19`, coverage `INCOMPLETE`, and a failure alert at 20:16 UTC. The eight runs before it all had `deepseekErrors: 0`. Measured directly against the API on the same prompt: `deepseek-chat` 156 chars, 0 reasoning, 35 output tokens; `deepseek-flash` 172 chars, 396 chars reasoning, 142 output tokens; `deepseek-flash` with `thinking: {"type": "disabled"}` 156 chars, 0 reasoning, 35 tokens, identical to the alias. Fix: every chat call in `src/lib/deepseek.ts` and `scripts/rescue-held-locations.ts` now sends `thinking: {type: "disabled"}` (constant `DEEPSEEK_THINKING`). This also removes a 4x output-token increase. Live `/etc/terror-tracker/{scan,app}.env` were reverted to `deepseek-chat` while the fix was written, then switched back to `deepseek-flash` after the fixed image was deployed.
- Speed check, final: with `FREE_SOURCE_CONCURRENCY=8` **and** thinking disabled, a full run on 2026-11-13 20:53 UTC took **15m24s** end to end (preflight 2m03s, discovery **11m14s**, ingest 45s, sweep 17s, queue drain ~45s) against **25 minutes** and **18m39s** of discovery at `FREE_SOURCE_CONCURRENCY=4` that morning. That is roughly 40% off discovery. `deepseekErrors` was 0 and coverage `DEGRADED`, the normal healthy shape.
- Caution on that comparison: an intermediate run at concurrency 8 with thinking still on measured 17m45s of discovery, so the earlier read that "concurrency barely helped" was taken while thinking latency was inflating every model call. Both changes are in place now; do not attribute the whole 40% to fetch concurrency alone.
- Live host done 2026-11-13 18:00 UTC: timer installed to `/etc/systemd/system/` (backup `/root/terror-scan.timer.bak-<ts>`), `daemon-reload`, `terror-scan.timer` restarted, `systemd-analyze calendar` plus `list-timers` confirm the next slot at 23:00 UTC. `/etc/terror-tracker/scan.env` and `app.env` changed from `deepseek-chat` to `deepseek-flash`, still 600 root:root (backups `/root/{scan,app}.env.bak-<ts>`). App container recreated, reports `DEEPSEEK_MODEL=deepseek-flash`, and `http://127.0.0.1:3001/api/attacks?limit=1` returns 200.
- Gotcha, now recorded in `deploy/README.md` step 7: both scan timers use `Persistent=true`, so installing a schedule whose newly added earlier slot already passed fires one catch-up scan on restart. That fired at 18:00:57 UTC here. It is expected, not a fault, and costs one extra scan.
- Measured runtime: a full scan is **22-25 minutes**, not the 5-14 minutes the unit comment claimed (that comment was wrong, the 90-minute timeout is fine). Today's 08:00 UTC slot: preflight 2m42s (date integrity plus 20 review retries), discovery 18m39s for 37 states in 13 batches, ingest 58s, review sweep 1m16s over 348 rows, duplicate check 19s, queue drain 54s. Discovery is dominated by ~750 article fetches at `FREE_SOURCE_CONCURRENCY=4`, with Brave fallback on 23 of 37 states. The comment in `terror-scan.service` now says 22-25.
- `FREE_SOURCE_CONCURRENCY=8` (the code clamps at 8) in `deploy/env/scan.env.example`, the GitHub escape hatch, and the live `/etc/terror-tracker/scan.env`. It also caps feed paging in `discovery-feeds.ts`. This is the only speed lever found that costs nothing in coverage.
- The retry is sound: `scan-alert.sh` arms `terror-scan-retry.timer` from the unit's `OnFailure`, so `OnActiveSec=20min` starts after the failed run ends and can never collide with a running scan.

## 2026-11-08 Duplicate audit in progress

- **Latest 13:52 UTC:** Kukawa survivor `699e9e071d4dc06e62c2dc66` had publication date Feb 22 instead of the overnight Feb 20–21 attack; source-supported set-only correction also records 1+ injured and removes unsupported zero abduction/displacement. `scratch/duplicate-review-20261108-all-pairs/correction-kukawa/run-2026-11-08T13-51-38-349Z/`: 963 active, date integrity PASS; API/page 200. Feb 16 Cross Kauwa base attack is distinct; broader comparison remains pending.

- **Open Kebbi overlap:** `6aef420a57a5b9cf1872dcc6` reports 33 district-wide deaths for the 18 Feb Bui raids, while four existing records report Mamunu 16, Awashaka 5, Masama 3 and five other villages 10. Source linkage and 33/34/35 conflicts are in the decision ledger. The aggregate overlaps the village records; do not merge different victim sets or count the district total on top. Work out a source-preserving, sanctioned way to retire the aggregate without losing the separate village incidents.

- **Latest 13:49 UTC:** Individual Kakafu review corrected `699217cf4048faea94b86735` using Premium Times family identification and release of a three-year-old, preserving Punch disagreement about victim composition and changing unsupported zero injury/displacement to unknown. `scratch/duplicate-review-20261108-all-pairs/correction-kakafu/run-2026-11-08T13-48-25-429Z/`: 963 active, date integrity PASS, corrected API/page 200. The incident still needs full candidate comparison and remains pending in coverage ledger.

- **Latest 13:44 UTC:** Batch 34 merged two Utonkon–Okpoga bus duplicates `699063dd5bffac06821ede31` and `6a9389a4d17b55c4bc6dbef2` into `698f90eb7769ddd085dddfcc`, identified via passengers leaving Iheijwo Market for the Southwest. Date corrected to Feb 9; conflicting 1/2 killed and 14/15 abducted preserved. Punch's seven deaths combined the separate Tuutuu event, which remains recorded. `scratch/duplicate-review-20261108-all-pairs/batch-34/run-2026-11-08T13-43-23-368Z/`: 963 active, date integrity PASS; survivor API/page 200 and absorbed APIs/pages 404. Coverage ledger marks absorbed rows, survivor remains pending. Full review remains incomplete.

- **Incident coverage ledger:** `scratch/duplicate-review-20261108-all-pairs/incident-coverage.json` lists all 965 active records from the 13:38 UTC live capture. All remain pending for full individual review; previous pair decisions do not establish exhaustive coverage. Reconcile new/changed/deleted records on refresh, preserve completed decisions, and clear entries only after evidence-supported plausible-candidate comparisons including border, date-shift and follow-up cases.

- **Latest live capture 13:38 UTC:** `scratch/duplicate-review-20261108-all-pairs/live-snapshot.json` has 965 active and 57 pending duplicate rows; one added Enugu family incident compared with original snapshot. This is inventory only, not incident-by-incident evidence review. Zamfara Dutse Dan Ajiya/Tungan Dutse sources now explicitly conflict about whether they are distinct villages or conflated; see ledger, do not merge without stronger evidence.

- **Browser check:** Chrome accessibility inspection of Bargaja survivor `6a944dd756ec3f9ab055e098` showed the correct date, 3+ killed, 1+ injured, account and nine source links. Windows screenshots timed out, so visual layout is still unverified. The page labels unknown abducted/displaced counts as “impact reported; figure unknown” despite no evidence of those impacts. Investigate shared UI wording and verify other survivors before completion.

- **Latest 09:25 UTC:** Resolved the Bargaja/Tureta aggregate: source reporting dates the separate two-police Tureta ambush to June 21. Set-only sanctioned correction `scratch/duplicate-review-20261108-all-pairs/correction-tureta/run-2026-11-08T09-24-26-153Z/` converts `6a966df6a83adf70ab8f837f` to the Tureta event, two killed; Bargaja IED soldiers remain in `6a944dd756ec3f9ab055e098`. This avoids double counting while preserving both events. 965 active, date integrity PASS, corrected API/page 200. Earlier aggregate caution is superseded; full audit and rendered-page checks remain incomplete.

- **Latest 09:23 UTC:** Batch 33 merged Bargaja response IED `6aef42b901c788d405d50390` into `6a944dd756ec3f9ab055e098`, supported by matching distress-call details and a later funeral report of three soldiers. `scratch/duplicate-review-20261108-all-pairs/batch-33/run-2026-11-08T09-22-40-794Z/`: 965 active, date integrity PASS; survivor API/page 200 and absorbed API/page 404. Separate aggregate `6a966df6a83adf70ab8f837f` still duplicates these soldiers while including two police in a separate Tureta attack; preserve and disentangle that event. Individual review and visual verification remain incomplete.

- **Latest 09:21 UTC:** Batch 32 merged the Kujijiro farm attack `6aef42dcc7b4adfd0d89977e` into `6aef174b4eb3d454f18fb9f8`; a source explicitly reconciles six versus nine reports from the current and former BEPU chairmen, and the survivor preserves the disagreement. `scratch/duplicate-review-20261108-all-pairs/batch-32/run-2026-11-08T09-20-32-904Z/`: 966 active, date integrity PASS; survivor API/page 200 and absorbed API/page 404. Mbalom's nine-to-17 toll is linked by Guardian, but the other record's Firstpost article remains inaccessible. Review and rendered-page verification remain incomplete.

- **Latest 09:19 UTC:** Batch 31 merged Wanka `6aef421a5c95071fb7bb4a8c` into `69b60bb3509de9c97a0bdac3` and Angwan Rukuba `6aef422bab18667b9e1b30f0` into `6aae78974f754cc99da2bc2d`. Death-toll disagreement is preserved; the Jos 33 figure mixes attack and retaliation. `scratch/duplicate-review-20261108-all-pairs/batch-31/run-2026-11-08T09-18-22-339Z/`: 967 active, date integrity PASS; both survivor APIs/pages 200 and both absorbed APIs/pages 404. The 09:08 capture had 57 pending duplicate rows, including stale pair rows for previously absorbed records; reconcile current queue safely. Overall review and visual verification remain incomplete.

- **Latest 09:14 UTC:** Batch 30 merged Francis Igwe `6a9389a4d17b55c4bc6dbf11` into older `69a8f1e8ca96cbfc90eb450b`, correcting the older misspelled name, Ikwo location, March 1 abduction date and subsequent murder; Josephat Ikegwu is a distinct case. `scratch/duplicate-review-20261108-all-pairs/batch-30/run-2026-11-08T09-13-32-452Z/`: 969 active, date integrity PASS; survivor API/page 200 and absorbed API/page 404. Individual review and rendered-page verification remain incomplete.

- **Latest 09:12 UTC:** Batch 29 merged Giron Masa ambush `6aef169e4eb3d454f18fb788` into `69e4146d58f4bbb3bb8ad4c3`; the April 14 date was a condolence visit. March 24 attack date and contradictory 11/12 killed reports are preserved. `scratch/duplicate-review-20261108-all-pairs/batch-29/run-2026-11-08T09-11-48-375Z/`: 970 active, date integrity PASS; survivor API/page 200, absorbed API/page 404. Candidate 363 monarch cases are distinct, but the Francis Igwe record needs direct-source correction. The audit and rendered-page checks remain incomplete.

- **Latest 09:10 UTC:** Batch 28 merged Akyawa/Udege Kasa `69e5f9e65b581f1ea0c9dce3` into `69d0f66d21b46c1f6a9931e5` using the same police account, prior alleged two deaths and 50 plus two burned houses. Police counted 11 in the clash; Leadership headline said 13, and overlap is unknown. Date corrected to 3 April. `scratch/duplicate-review-20261108-all-pairs/batch-28/run-2026-11-08T09-09-57-227Z/`: 971 active, date integrity PASS; survivor API/page 200 and absorbed API/page 404. Individual review and rendered-page verification remain incomplete.

- **Latest 09:08 UTC:** Batch 27 merged Zakka family follow-up `6aef347c4d9328b8f151ad8c` into `6acbb2172657e922b3a34399`; Trust Radio directly links the three named family members and fourth woman to the Alrahus attack. Date conflict October 5/6 and distinct release status preserved. `scratch/duplicate-review-20261108-all-pairs/batch-27/run-2026-11-08T09-08-10-572Z/`: 972 active, date integrity PASS; survivor API/page 200 and absorbed API/page 404. Review remains incomplete and visual page verification outstanding.

- **Latest 09:06 UTC:** Batch 26 merged Tyungu Jam/Mbaav `6aef167e4eb3d454f18fb70b` into `69b368b41165f27b355d65c5`. Punch linked the named MT Tiga burial disruption to the March 5 attack. Corrected date, unsupported casualty counts, and later separate abduction; older unrelated January article remains as explicitly identified source history. `scratch/duplicate-review-20261108-all-pairs/batch-26/run-2026-11-08T09-05-38-135Z/`: 973 active, date integrity PASS; survivor API/page 200 and absorbed API/page 404. Candidate 290 unresolved note in ledger is superseded. Full source review and visual verification remain incomplete.

- **Latest 09:04 UTC:** Batch 25 merged the Tarfa EYN pastor attack `6aef41f82ea4d26ecba7f062` into `69c941c0084b08cd09b277f0`; source accounts differ on 21–22 January and Biu versus Hawul, both preserved. `scratch/duplicate-review-20261108-all-pairs/batch-25/run-2026-11-08T09-03-38-617Z/`: 974 active, date integrity PASS; survivor API/page 200 and absorbed API/page 404. Overall individual review remains incomplete; rendered visual checks remain outstanding.

- **Latest 09:02 UTC:** Batch 24 merged the Magamin Diddi reconciliation abduction (`6aef428d14d7a659c8feac9f` into `6a92a9fba9b079ce763110c0`) based on the shared meeting with a bandit leader's relatives; Punch and AP conflict on 7 versus 11 June, so date range preserves both. Applied artifact `scratch/duplicate-review-20261108-all-pairs/batch-24/run-2026-11-08T09-01-34-481Z/`: 975 active, date integrity PASS; survivor API/page 200 and absorbed API/page 404. Candidate 277 is an unresolved overlapping IED lead with a pre-existing two-event aggregate; see decision ledger. Overall review remains incomplete.

- **Latest 08:59 UTC:** Batch 23 merged Binper/Plateau `6aef432290b043418a482cb5` into older `6aae78964f754cc99da2bc2a`, matching the same overnight attack on sleeping residents. Date range 17–18 August and conflicting casualty reports are preserved; unsupported zero abducted removed. Artifacts `scratch/duplicate-review-20261108-all-pairs/batch-23/run-2026-11-08T08-58-52-587Z/`: 976 active, date integrity PASS, survivor API/page 200, absorbed API/page 404; rendering not visually checked. Candidate 265 remains unresolved because its cited Prompt News article is inaccessible. Full audit remains incomplete.

- **Latest 08:55 UTC:** Batch 22 merged `6aef4273d3b1cfb4676e5d03` into Mandaragirau survivor `6a92a9fba9b079ce763110b9`. Arise explicitly connects the military's Mandaragirau account to reports of the Mandara–Buratai road base; Pulse also identifies the 162 Battalion base as Mandaragirau. Survivor records 8+ killed and distinguishes military's five soldiers plus three CJTF from reports of eight soldiers, without adding possibly overlapping counts. `scratch/duplicate-review-20261108-all-pairs/batch-22/run-2026-11-08T08-54-55-350Z/`: 977 active, date integrity PASS, survivor API/page 200 and absorbed API/page 404. Overall source review still incomplete.
- **Latest 08:53 UTC:** Batch 21 merged Dorowa–Jong `6aef421178b7e799f7ad2601` into `699903cd3d03ed8d454e2943`, linked by three named victims, return from Quranic Tafsir, and the circumstances. Survivor records 3+ killed and notes some early reports said five. Source review also established that Dangulbi's Sunday raid and Tuesday raid were distinct; corrected first raid `6aae6308d470b42e80127433` from 1 June to 31 May through the sanctioned tool. `scratch/duplicate-review-20261108-all-pairs/batch-21/run-2026-11-08T08-53-11-992Z/`: 978 active, date integrity PASS; both survivors' APIs/pages 200 and absorbed API/page 404. Review remains incomplete.
- **Latest 08:51 UTC:** The live count rose from 981 to 983 during the audit because two new records were inserted for the previously merged Riyom disability abduction and Sokoto–Gusau police bus; an independent process also added sources to them. Batch 20 source-checked and merged those into `6aea41df25a5bf7a35389a07` and `6ae8efa0eec24a506cafbd4a`, plus the Sokoto–Isa teacher/driver ambush and Ijebu Awa ex-corps member abduction pairs. Riyom's Wednesday was the release date, not the attack date. Ijebu accounts say ten abducted plus a separate escapee. `scratch/duplicate-review-20261108-all-pairs/batch-20/run-2026-11-08T08-50-30-646Z/`: 979 active, date integrity PASS; four survivor APIs/pages 200, four absorbed APIs/pages 404; three pair reviews resolved and one held lead retargeted. Continue refreshing the live inventory: ongoing external processes can add records and duplicates while this audit runs. The review remains incomplete.
- **Latest 08:47 UTC:** Batch 19 merged Makuku clash `6aef17c14eb3d454f18fbc17` into `6a92aa01a9b079ce76311129` and Bokkos–Barkin Ladi roadblock `6a966e0ca83adf70ab8f839a` into `6a944ba8444c74d1660669f4`. For the roadblock the shared named driver proves duplicate identity; a later report of two abducted pastors and one death lacks the driver's name and remains a possible match, so the survivor no longer asserts that death as established. Evidence and links in `decisions-continuation.md`. `scratch/duplicate-review-20261108-all-pairs/batch-19/run-2026-11-08T08-46-57-820Z/`: 981 active, date integrity PASS; survivor APIs/pages 200 and absorbed APIs/pages 404. Full source-by-source individual review is still incomplete.
- **Latest 08:43 UTC:** Batch 18 merged Gurusu–Gwashi IED `6aef17da4eb3d454f18fbc8b` into `6a944dda56ec3f9ab055e0c2` and CRIN abduction `6acbcc642f15fb93e755f7f1` into `6aca356e3a030bbe7ca27931`. The former corrects the older record's wrong Anka LGA to Bukkuyum. The latter retains three abductees, the named-victim linkage, and the later release, and corrects the misleading Ibadan North location. Evidence in the continuation ledger; artifacts `scratch/duplicate-review-20261108-all-pairs/batch-18/run-2026-11-08T08-43-02-687Z/`. Active 983, date integrity PASS; survivors' APIs/pages 200 and absorbed APIs/pages 404. Overall review remains incomplete; continue without treating ranking as review.
- **Latest 08:41 UTC:** Batch 17 merged Kukareta cross-state duplicate `6aef16c54eb3d454f18fb80b` into older `6aef16c54eb3d454f18fb809`; the two sources identify the same unusual weapons recovery and two wounded soldiers, despite differing Borno/Yobe and Wednesday/Thursday claims. Survivor is Yobe/Damaturu, 22–23 April range, two wounded; 24/25 reported attacker deaths are narrative, not victim casualty figures. `scratch/duplicate-review-20261108-all-pairs/batch-17/run-2026-11-08T08-40-39-118Z/`; 985 active, date integrity PASS; survivor API/page 200 and absorbed API/page 404. Overall individual review is still far from complete.
- **Latest 08:39 UTC:** Batch 16 merged AFP police-bus `6aef436f30ce82517547f2e8` into survivor `6ae8efa0eec24a506cafbd4a`, based on both reports' Sokoto-origin bus and unique Zamfara North primary assignment. Five police deaths remain the reported minimum; AFP's competing eight deaths, five abducted and three injured are attributed in the description, while uncertain injury/abduction counts remain null. Existing 1–2 Nov date range retained. Applied artifact `scratch/duplicate-review-20261108-all-pairs/batch-16/run-2026-11-08T08-38-36-587Z/`; 986 active, date integrity PASS; survivor API/page 200, absorbed API/page 404. Reuters Gidan-Giye pair remains unresolved. Full review remains unfinished.
- **Latest 08:34 UTC:** Batch 15 merged Fesken/Fasken Rafi `6aef172e4eb3d454f18fb9a1` into older `6aae6308d470b42e8012742d`: same deputy governor's condolence visit, spelling variants explicitly linked by NTA. Sources conflict about the attack day; survivor now uses June month precision, 20+ killed and 1+ injured, with unsupported zero kidnapped/displaced removed. Applied artifact `scratch/duplicate-review-20261108-all-pairs/batch-15/run-2026-11-08T08-34-24-642Z/`; 987 active, date integrity PASS, survivor API/page 200 and absorbed API/page 404; API response saved. Browser visual checks remain unavailable. Full incident-by-incident review remains unfinished. Prior Fesken unmerged note is superseded.
- 
ext build` was attempted using the installed binary and failed on missing local dependencies including `@alloc/quick-lru`, `@babel/runtime`, and `@emotion/react`; focused ESLint similarly cannot load `@babel/core`. TypeScript passed and the real merge CLI E2E passed. Repair the incomplete local install before repeating build/lint; do not claim those checks passed.
- **Latest 08:32 UTC:** Batch 14 merged the independently source-checked Abande market pair and Rimi DPO pair. Abande survivor `69d40c4223663dfd76c3e123` now has the source-supported 3 February date, Abande/Kwande location, 5+ police-reported killed and explicit 7/about-17 conflicting reports. Rimi survivor `6aae5e7849374bb7212fa3c5` has a 12–13 February date range, Magaji location, one DPO killed and 1+ injured with the ministry's three-security-personnel report explained. The reported three attackers killed are separate from victim totals. Dry-run/apply artifacts `scratch/duplicate-review-20261108-all-pairs/batch-14/`; active 988, date integrity PASS. Survivor APIs and pages 200 and absorbed APIs 404; one absorbed page check was still running. Rendered visual checks remain blocked by unavailable IAB browser. Earlier below calling these two pairs unmerged is superseded. Full review is unfinished; continue the source-by-source ledger and fresh live reconciliation.
- **Latest continuation, 08:26 UTC:** full individual review remains incomplete. Live capture `scratch/duplicate-review-20261108-all-pairs/live-snapshot.json`: 990 active, 48 pending duplicate rows; one new Enugu family incident was not in the original snapshot and has not been reviewed. Batch 13 merged Arome family and new Sokoto–Gusau police-bus duplicates, preserving conflicting event dates as BSON date ranges. Dry-run and apply artifacts in `scratch/duplicate-review-20261108-all-pairs/batch-13/`, decision evidence in `decisions-continuation.md`. Both survivor APIs/pages returned 200 and absorbed APIs/pages 404; visual page inspection remains. Date integrity PASS. Earlier entries below that say Arome remains unmerged are superseded. `scripts/merge-incidents.ts` now validates and converts date-range bounds to BSON dates. Disposable real-CLI E2E passed 4/4 (invalid, reversed, dry run and applied merge; `scratch/duplicate-review-20261108-all-pairs/e2e-merge-dates/results.json`); TypeScript passed. ESLint could not run because local dependencies lack `@babel/core`, and build remains unrun. Do not use DeepSeek/Brave for review. Before next writes, recheck live records: separate pre-existing adjudication/drain processes were observed running in this checkout and may alter the queue.
- **Woro corrected:** AP's August survivor interviews support more than 160 killed and 163 Woro abductees rescued, while Premium Times reports the village head's estimate of 176 abducted. After dry run, the sanctioned tool recorded 161+ killed and 163+ abducted, removed the unsupported 146-reunited statement and unsupported zero injury/displacement counts, and attached both sources. `scratch/duplicate-review-20261108-all-pairs/woro-correction/run-2026-11-08T08-28-40-928Z/`; active 990, date integrity PASS, public API and page HTTP 200, saved `woro-correction/api.json`. Visual verification is uncompleted: the Codex in-app browser reported no available IAB backend. Earlier Woro warnings below are superseded.
- **User constraint:** never use the project's DeepSeek or Brave API subscriptions for review or web search. Use the harness web fetch/search or explicitly permitted OpenCode Go/Luna instead. Avoid project adjudication and discovery scripts that invoke those APIs. Database-only `merge-incidents` remains permitted.
- Batch 12 merged Oriire school-abduction duplicate `6aef425369b721b1338af3fa` into `6a9f0bb4e30260a441ac8e2c`, retaining the 15 May attack's one death while describing the government's nine deaths across abduction and later rescue separately. Artifact `scratch/duplicate-review-20261108-all-pairs/batch-12/run-2026-11-08T08-07-50-622Z/`; 990 active, date integrity PASS, survivor API 200 and absorbed 404. Further decisions 141 and 188 are in `decisions-continuation.md`; do not assume a shared town or toll proves a match. User reiterates goal is complete review of all remaining records, not another partial milestone.
- Batch 11 merged `6aef41e26afc55713f8e3af6` into `6aae6253e48e98b0fd184530` for the Kasuwan Daji market attack; BBC and Al Jazeera describe the same episode. Corrected date to 3 January, recorded police's over-30 killed as 31+ and eyewitness's 42 in description, removed unsupported count of 10 abducted, and recorded at least one injured with source evidence. `scratch/duplicate-review-20261108-all-pairs/batch-11/run-2026-11-08T01-58-31-339Z/`; 991 active, date integrity PASS, survivor API 200, absorbed 404, public browser snapshot shows corrected date, counts and sources.
- Batch 10 merged Damasak-area convoy IED duplicate `6aef41eab722eac4e805b6bd` into `6aae6af8245696a1787315aa`: 4 January event, five injured, sources report eight versus about nine killed. Survivor records 8+ with disagreement in description; `scratch/duplicate-review-20261108-all-pairs/batch-10/run-2026-11-08T01-55-41-983Z/`; active count 992, date integrity PASS, survivor API 200 and absorbed 404. Pair-level evidence and unresolved victim-scope/date conflicts logged in `scratch/duplicate-review-20261108-all-pairs/decisions-continuation.md`. The full review remains incomplete; the user requested continuing through all remaining records without intermittent pauses.
- Continuation: batch 9 merged Ikola clash duplicate `6aef4332c6b01036bea7aaa5` into `6a966e0ca83adf70ab8f8399`; preserved conflicting police/LASEMA death toll as 3-4 and injured as 2+, set supported Ikola location. `scratch/duplicate-review-20261108-all-pairs/batch-9/run-2026-11-08T01-49-52-589Z/`: 993 active, date integrity PASS; public page accessibility snapshot confirmed range, narrative and sources, absorbed API 404. Pair decisions and links are in `scratch/duplicate-review-20261108-all-pairs/decisions-continuation.md`. Ranked index 120 is confirmed duplicate Arome-family abduction, but reports differ Oct 25 vs Nov 1: hold until exact date is sourced or uncertainty safely represented. Important tool limitation: `merge-incidents.ts` writes `dateRange.start/end` as raw JSON strings rather than BSON dates, unlike `date`; do not apply a date range using that tool until corrected and verified. Other reviewed pairs remain distinct or unresolved as recorded; the overall review is not finished.
- Batch 8 merged Woro duplicate `6aef4200d2722d9e4dad709c` into `6aae60a5244c2dc25e720c29`: Daily Trust's Saturday was the 7 February Shettima condolence visit; https://www.channelstv.com/2026/02/07/kwara-attack-shettima-confirms-tinubus-deployment-of-army-battalion-nema-mobilisation/ explicitly connects that same visit to the 3 February Woro and Nuku attack. Artifact `scratch/duplicate-review-20261108-all-pairs/batch-8/run-2026-11-08T00-53-12-466Z/`; 994 active, date integrity PASS, API survivor 200 and absorbed 404. **Urgent data quality:** the survivor's pre-existing 160 killed and 146 abducted were preserved, not independently verified; all three of its old source URLs returned 404. The live Channels article reports at least 75 killed, and the Daily Trust piece over 100; neither confirms 160 or 146 abducted. Find reliable later sources and correct with evidence. Review `6aef86942c7e1736ae2ad9ed` is still pending despite the merge (script reported 0 resolved, likely reversed IDs); deterministic triage dry-run lists four stale references, but was not applied. Check safe targeted disposition. The survivor page opened in browser, but full visual inspection remains outstanding. Batch 7 public API now verified survivor 200, absorbed 404.
- Batch 7 merged Yobe Lamusuri operation duplicate `6a982c0b88df506a04cbff10` into `6a981e0b7c9728c85213109d`: PRNigeria and Channels describe the same 1 September operation, task-force unit, weapon recovery and military spokesperson. The only death described is an alleged attacker, not a victim. `scratch/duplicate-review-20261108-all-pairs/batch-7/run-2026-11-08T00-40-45-552Z/`: 995 active, date integrity PASS. Live DB confirms survivor active with two sources and absorbed tombstone; public API request timed out, so API/page checks remain pending. Out-of-scope status of that military-only record is a separate question.
- Continued 2026-11-08: one Abeokuta duplicate merged, `6aef16e44eb3d454f18fb874` into `6aef16e44eb3d454f18fb872`, with PUNCH and Radio Nigeria naming the same victim Stone and roadway; North/South LGA conflict. Snapshot and run: `scratch/duplicate-review-20261108-all-pairs/batch-6/run-2026-11-08T00-33-52-174Z/`. Active count 996, date integrity PASS. Public API checks for batches 4-6 returned 200 on four survivors and 404 on four absorbed; each survivor page returned HTTP 200 (not visual inspection). 
pm run merge:incidents` currently fails because local `tsx` binary is missing; 
px --yes --package tsx@4.20.6 tsx scripts/merge-incidents.ts ...` worked without changing project dependencies.
- Additional verified same-event leads still unmerged: Abande market `69d40c4223663dfd76c3e123` / `6aef164a4eb3d454f18fb651` (both cited sources identify 3 February, not March 31; casualties differ between police 5, traditional ruler 7, and former councillor 17). Rimi DPO `6aae5e7849374bb7212fa3c5` / `6aef16644eb3d454f18fb6ce` (both sources name Muhammad Sani Kabir, Magaji, Maigemu and three killed attackers; PUNCH says Friday 13 February and Premium Times Thursday 12 February; 1 police injured versus 3 security personnel). Both need uncertainty-aware identity/toll correction before applying merge, not the merge tool's unqualified maximum. The five clerics at Yari residence versus six on Bakura road remain unresolved: Premium Times explicitly notes the competing reports and the army denies an abduction at the residence; no shared victim names establish identity despite the agent's proposed merge.
- Further batches 4 and 5 absorbed three more records: Abangbe Dilu four abductees, Adoka six mourners (a later release report), and Duru-Kamang cattle raid (identical article republished 45 days later). Manifests and before/after snapshots: `scratch/duplicate-review-20261108-all-pairs/batch-4/` and `batch-5/`. The merge tool reported 997 active and date integrity PASS. The public API timed out twice after batch 4, so API and rendered-page checks for batches 4 and 5 remain outstanding.
- More important open lead: `6aef436f30ce82517547f2e8` is AFP's account of the same Nov 2 Sokoto-Gusau election-security bus ambush as survivor `6ae8efa0eec24a506cafbd4a`, based on the bus, police travelling from Sokoto, Senate primary, and police officials. AFP reports eight killed, five abducted and three injured, while other accounts report five killed. Do not blindly invoke the merge tool's highest-toll rule; reconcile the conflict and preserve uncertainty first. `6aef4376edaa11f6b0d89ebe` is a separate or conflated Reuters account of a police/CPG vehicle near Gidan-Giye, Tsafe; relationship to the AFP Gidan Kano incident remains unresolved.
- Kasuwan Daji (`6aae6253e48e98b0fd184530`, `6aef41e26afc55713f8e3af6`) is the same market attack according to Al Jazeera and BBC, on Saturday 3 January rather than the older record's 4 January. The older record also asserts 10 abducted and zero injured without support in those two sources; reconcile evidence and correct the date/tolls before a merge. The older Bukkuyum/Anka 50-death pair remains unmerged: its 150 motorcycles, toll and date are highly suggestive but both Anka record URLs are 404; the alternate location and its 10-abducted assertion have not been independently grounded.
- A read-only Go review returned candidate leads in anked.json` indices 69-110, not an applied or fully independently verified decision ledger. Next check Yobe Lamusuri records `6a981e0b7c9728c85213109d` and `6a982c0b88df506a04cbff10` against the same Sept 1 military operation; Abande market `69d40c4223663dfd76c3e123` and `6aef164a4eb3d454f18fb651` (31 March vs Feb 3 date); and Ogun `6aef16e44eb3d454f18fb872`/`6aef16e44eb3d454f18fb874`. The eight Millennium City rescue victims were recovered across several operations, so do not assume the report proves one original abduction. Do not accept any agent finding without checking actual sources and live record state.
- Further source-reviewed merges: batch 2 `scratch/duplicate-review-20261108-all-pairs/batch-2/run-2026-11-08T00-13-11-148Z/` merged three Sokoto-Gusau police-bus duplicates into `6ae8efa0eec24a506cafbd4a`, plus the Kwara-Kogi Eruku-Iyemero abduction, Okporojo Ebonyi attack, and Hong Adamawa Gaya-Sikalmi/Garstanu attack. Batch 3 `scratch/duplicate-review-20261108-all-pairs/batch-3/run-2026-11-08T00-14-35-741Z/` merged the Orumba North/South convoy attack and the Zariagi/Lokoja orphanage abduction. Eight records absorbed in total, active 1,008 to 1,000; six survivor API responses 200, eight absorbed API responses 404, six page requests 200; date integrity passed. Sources disagree on the police-bus incident date and precise state: the survivor retains pre-existing Zamfara and November 2; Kaura Namoda was the assignment destination, not the incident location. The Anambra sources disagree on North versus South. These uncertainties are in the merge reasons, not necessarily exposed on the page.
- Fesken/Fasken Rafi, Kebbi (`6aae6308d470b42e8012742d`, `6aef172e4eb3d454f18fb9a1`) is a likely duplicate: Guardian and AFP/Daily Trust describe 20 killed and Deputy Governor Umar Tafida's condolence visit. **Not yet merged:** AllAfrica/Premium Times claims Sunday 14 June whereas Guardian and AFP say the attack preceded the Saturday 13 June visit; neither establishes the older record's 11 June date. Resolve and accurately represent date uncertainty before merging. Confirmed distinct: Abande and Anwase market attacks, separate towns and days per TRT/AFP; Karofi Rukayya and Faduma incidents, distinct victims and days per Daily Trust.
- User requested an individual evidence review of all incidents against each other, including spelling, border and interstate-road variants. **Not complete.** Snapshot: 1,010 active records, 57 pending duplicate reviews. `scratch/duplicate-review-20261108-all-pairs/` contains the snapshot, 509,545 inventoried pairs, and 612 scored at least 10 for prioritization. The scores are crude lexical signals, not decisions; low-scoring pairs are not cleared, and the ranking does not adequately capture spelling variants. `scratch/duplicate-review-20261108-existing/` is the separate existing state/14-day audit, which cannot meet cross-border coverage. Re-run or reconcile against the live database before applying decisions.
- Two source-confirmed duplicates merged with `confirmed-pairs.json`, snapshots and summary under `scratch/duplicate-review-20261108-all-pairs/merges/run-2026-11-07T23-56-50-297Z/`: Riyom two visually impaired abductees (`6aed8ccff11a8d3c51044291` absorbed by `6aea41df25a5bf7a35389a07`), and Maciyan-Kyada patrol IED (`6aef42ff8ce1c2c72c18d3b5` absorbed by `6aef17754eb3d454f18fba63`). Later reports were mistaken for new events. Merge tool reported 1,008 active, date validation PASS, two pair reviews resolved. Public APIs returned 200 for survivors and 404 for absorbed IDs; both survivor pages returned HTTP 200. Source counts were 5 and 3, including two query-string variants of the same Counter-IED article.
- Zamfara 50-death records `6aae60a5244c2dc25e720c37` (Dutse Dan Ajiya/Tungan Duche, Anka) and `6aef166d4eb3d454f18fb6ea` (Tungan Dutse, Bukkuyum) are suspicious but **not merged**. Both sources on the first returned 404. Al Jazeera and Politics Nigeria describe Tungan Dutse on 19-20 Feb and 50 deaths, but do not establish the first record's place is the same incident. Find independent place/victim evidence before deciding. Do not infer identity from date and toll alone.
- Next: review source evidence across all pairs, including lower-scored and cross-state/date pairs, record explicit decisions and unresolved cases, compare new scans against the snapshot, and apply only evidenced merges through `merge-incidents`. The real API checks above do not substitute for visual browser inspection. Existing unrelated changes to `.gitignore`, `scripts/adjudicate-backfill.ts`, and `scripts/drain-pair-queue.ts` predate this work.

## 2026-11-07 Palette: red attacks, neutral killed

- Red now means attacks (`--attacks:#e5484d`); the killed measure is neutral `#c4cbc7` with pill ink `#edf0ee` on `#24282a`, so a death toll is never red. Abducted stays `#3e8ee6`. `--danger:#e5484d` and `--danger-soft:#2e1718` keep error panels and the admin checkbox red now that `--killed` is neutral.
- Touched `src/app/globals.css`, `src/lib/summary.ts` (`MEASURES` colours), the Killed impact key in `IncidentDetailClient.tsx`, the killed pill in `opengraph-image.tsx`, and `DESIGN.md`.
- Verified: 
px tsc --noEmit`, 
pm run build` with a disposable `JWT_SECRET`, and computed styles plus screenshots on the overview, `/patterns` (attacks and killed measures), `/map`, an incident page and its OG image. Killed figures stay `#edf0ee` (about 9:1 on the surface); literal black was rejected as unreadable on the dark cards.
- Unchanged: the red brand silhouette, the unused legacy `AttackCard`/`StatCard`/`HorizontalBar`, admin layout. 
ext dev` re-adds a Next.js agent-rules block to `AGENTS.md`; it was reverted rather than committed.

## 2026-11-07 Scan crash fixed, year backfill built and piloted

- **Why the 2026-11-06 20:00 and 20:37 scans recorded FAILED with every count at zero:** `persistIncidentReviews` upserted an aggregator page title of 2,247 characters against a 500-character schema maximum, unValidators: true` threw, and the run aborted after ingest but before the sweep, duplicate pass and report. Host log: `ValidationError: title ... length 2247 ... at persistIncidentReviews (incident-review.ts:74)`. Fix: every stored review field is clamped to its schema limit before the write, an invalid `publishedAt` costs the date rather than the lead, and a lead that still fails validation is skipped and counted instead of killing the run. `ScanRun` gained an optional `error` field so a failure records its cause instead of zero counts. Proof: 
px tsx scratch/backfill/e2e-review-limits.ts` against a disposable database, 12/12 (long title, publisher, state and reason clamped; blank reason skipped; bad date stored with null; duplicate-pair writer protected; zero attacks written).
- **Backfill driver:** `scripts/backfill-year.ts`. Explicit `--from/--to/--states`, week cells (default 7 days), two non-Brave lanes (Google News RSS with real date bounds, DeepSeek Search), global URL dedupe, every URL re-run through eextractSearchLedSource(..., { historical: true })` which skips only the now-relative window check, and publication only through `ingestSearchLedAttacks`. Ledger under `scratch/backfill-year/<run-id>/`: `cells.jsonl`, `candidates.jsonl`, `published.jsonl`, `summary.json`, `coverage.json`. Dry run by default; `--resume`, `--status`, `--coverage`, `--apply`.
- **Measured provider behaviour that shaped the grid** (`scratch/backfill/probe-window-shapes/`, raw responses): DeepSeek Search returns a real `date` per result now preserved as `NewsDiscoveryResult.date`, but `after:`/`before:` are ranking hints, not filters. One state-day query returned **0** results, a state-week **1 to 5**, a state-month **19 to 50**. Google News RSS honours `after:`/`before:` exactly but returns few items. A literal per-day grid would therefore be theatre; cells are weeks and `--coverage` expands them back to every jurisdiction-day.
- **Pilot on the host** (`/srv/terror-tracker/backfill/pilot-20261107`, 8 cells, Plateau and Benue, January): 85 URLs, 56 fetched, 8 events, 0 lane errors, 0 failed cells, about 30 s per cell. Extracted events are correct, e.g. Gero/Jos South 6 Jan (1 killed), Udeku Maav-Ya/Kwande 6 Jan (5 killed, three near-duplicate records that ingest will cluster), Kuru mining site 22 Jan (7 killed).
- **Duplicate audit:** `scripts/audit-duplicate-clusters.ts`, read-only. Blocks by state and a 14-day window, scores shared source URL, tolerant place match, LGA compatibility and title overlap, folds in the 154 pending duplicate review rows, and emits `pairs.json` in `merge-incidents` format plus clusters and a report. First production run: 691 active records, 1,348 comparisons, 67 pair candidates, 40 clusters, 154 queue pairs, artifacts in `scratch/duplicate-audit-20261107/`. Do not use `audit:duplicates:execute` (Gemini, direct merge).
- **Sweep and publication complete (2026-11-07).** 1,665 cells, 1,665 done, 0 failed, 84 lane errors out of about 10,000 search calls, 763 candidates. `--coverage`: 11,470 jurisdiction-days (310 days x 37 jurisdictions), 11,470 covered, 0 missing. Publication through `ingestSearchLedAttacks` in batches of 10: **269 inserted, about 130 merged, about 235 held, 0 errors, 2 tombstone collisions reported and not resurrected**. Active records 691 -> **965**. Months now 62/82/66/155/79/92/69/73/86/169/32 (Jan-Nov). API 200 and rendered page 200 verified for new records; `/api/stats` reports 965.
- **Duplicate audit calibration:** the two highest-scoring pairs were checked against their sources and are **distinct events, not duplicates**. The Conclave article reports two separate Isuikwuato killings (28 Jan Mgbelu Umunnekwu, 29 Jan Nnunya Junction); the Punch article reports a repelled kidnap attempt at Ekwu-Ora Odaba and a separate 13 Jan killing of five at Otobi-Akpa. A shared source URL and an identical inherited title are therefore not evidence of one event, exactly as AGENTS.md says.
- **Duplicate and hold adjudication completed 2026-11-07.** Every audit pair and every held backfill candidate is decided; nothing is pending.
  - Pairs: 85 decisions across the pre- and post-publication audits. 6 claim-linked merges proposed, **3 applied** through `merge-incidents` with artifacts: Adoka six mourners (Benue), Toto Kuru/Kauru teacher (Nasarawa), and Aloghom/Nchiya vigilante (Plateau, both records citing the same Daily Post article and the same victim, Dauda Shamaki). 3 rejected: FCT Bwari family (25 Oct vs 1 Nov, both sources after both dates, nothing decides it), Benue herders 7-vs-2 toll conflict, Taraba pair linked only by the single token "Kabiru".
  - Held: **194 candidates, all decided.** 97 `same_event` (87 source URLs attached as corroboration, 10 already present, identity and toll untouched); 54 `promote` (40 inserted through `promote-review-lead`, 10 refused by its guard and attached to the blocking record instead, 4 collapsed as internal duplicates); 43 `dismiss` with a recorded reason (24 toll conflicts without a claim link, 5 unplaceable or aggregate, 14 internal duplicates of a kept item).
  - Precision note: 10 state-only promotes went through a rescue pass that reads the article and accepts a settlement only when a quoted sentence names it. Precision is set from the quote (`exact` for "in/at", `surrounding_area` for "near", otherwise `approximate_lga`). Five survived; the sixth was a weekly roundup and was dismissed.
  - `promote-review-lead` now accepts LGA-only records as `approximate_lga` with town Unknown, per the field conventions, and guards them by LGA plus date. `scratch/backfill/e2e-promote-lga.mjs` proves 7/7 on a disposable database: insert, second same-LGA/date refusal, unplaceable refusal.
  - un-backfill-promotions.ts` runs each promotion through the audited tool, turns a guard refusal into a source attach on the named blocker, and resolves the review row with a note. It also collapses promotes within the same place and 2.5 days before running.
  - Final state: **1,002 active** (691 before the backfill), 29 tombstones, `/api/stats` agrees. Absorbed ids `6ae8efb2eec24a506cafbd74`, `6ae79e376a4d789018ff0eb5` and `6aef434ab6a15fb7cf887a67` return 404; survivors and a promoted record (`6aef41e26afc55713f8e3af6`) return 200 from the API and render 200.
  - Decisions and artifacts: `scratch/backfill/adjudication/` (pairs.jsonl, held.jsonl, held-rescued.jsonl, held-apply.jsonl, promotion-outcomes.json, held-apply-report.json) and `scratch/duplicate-audit-20261107-final/`. Copied to `/srv/terror-tracker/backfill/adjudication/` so they survive the dev machine.
  - Still open: the 194 pending duplicate rows in the queue are mostly stored-pair rows from before this pass; a further audit of 1,002 records will surface new candidates as records are added. The recall sample was not run.
- **Recall sample and the one automation fix both reviewers ranked first (2026-11-07).**
  - 22 jurisdiction-weeks (one high-volume and one mid-volume state per month, the week with the most records). An independent Claude WebSearch/WebFetch pass found **36 events, 29 already present, 7 missing: 81% sample recall**. Interval is wide at this size; re-sample after the fix.
  - All 7 misses failed identically: the article states only a weekday ("on Sunday") and the page's publication date was not extracted, so `dateEvidenceFromText` returned "no explicit incident date" and the event was dropped.
  - Cause, traced rather than guessed: `absorbResults` built `DiscoverySource` from url/title/publisher and dropped `NewsDiscoveryResult.date`. `fetchAndExtract` already falls back to `u.publishedAt`. Fix: carry the search result's date into `DiscoverySource`, and let eextractSearchLedSource` accept `source.publishedAt`.
  - Proof: 
px tsx scratch/backfill/e2e-publication-date.mjs`, **5/5** against a local fixture page: a dated weekday-only report resolves to the preceding Sunday and is admitted, an undated one stays a review lead and is not inserted.
  - Terra and Sonnet reviewed the automation gaps independently and ranked the same change first. Other agreed items, not built yet: close refused promotions in the daily path (the backfill driver does this), and mark budget-exhausted duplicate holds so they are retried rather than accumulating. Both said do not automate toll conflicts, ambiguous dates, or any merge outside `equiv`/claim linkage.
- **Queue drain completed (2026-11-07).** All 191 held duplicate leads are decided and the queue reached **0 pending duplicates**:
  - 67 `same_event`: 56 source attaches with the row resolved, 11 dismissed because the toll conflicted and no claim link existed.
  - 124 `promote`: most were refused by the nearby-place guard and attached to the blocking record instead; a small number became records (active count 1,002 to 1,007); 46 had no settlement or LGA and were dismissed with that reason after a rescue pass read the article; the last row was the Tribune police-convoy report, attached to the existing Sokoto-Zamfara ambush record.
  - Applier: `scripts/apply-queue-decisions.ts` (dry run by default, idempotent, skips closed rows). Rescue/close: `scratch/backfill/queue/rescue-and-close.mjs`.
  - Note: the scheduled scan creates new holds. The queue is not permanently empty, which is why the agreed automation item is to run this pass after each scan.
- **Extraction and fetch backlog drained to zero (2026-11-07).** `triage:reviews --apply` dismissed 136 exhausted rows plus 6 permanent rejections; the remaining 37 were made due and retried through etryIncidentReviews` until their attempt budget was spent, then a second sweep dismissed 47. `scratch/backfill/drain-reviews.mjs` is the repeatable loop. Every pending row of every kind is now closed: `pending: 0`.
- **Final duplicate pass after the promotions.** The audit found 2 fresh pairs, both created by today's promotions: Binnari (62 killed, four-day gap from a late reaction story) and Tungan-Bako (Islamiyya abduction, 14 across four sources versus 15 in one, two-day gap). Both merged into the older, richer records with the variance recorded. Absorbed ids return 404, survivors 200, `/api/stats` reports 1,007. Net since the start of this work: 691 to 1,007 active.
- **Automatic queue drain shipped (2026-11-07).** `scripts/drain-duplicate-queue.ts` runs after every scan from un-scan.sh` (12 rows per run, best effort so a queue failure never fails a scan). It exports the pending held duplicate leads, adjudicates them against the record they collided with, applies the decisions, and dismisses a state-only lead with the recorded reason instead of leaving it pending. Artifacts go to `/var/log/terror-tracker/queue-drain/<timestamp>/summary.json`.
  - Proof: `scratch/backfill/e2e-drain-live.mjs` plus `e2e-drain-verify.mjs`, against a disposable database seeded with one stored incident and one held duplicate naming the same victim. The real drain exited 0, the row resolved, the source was attached, one record remained, and the disposition note was written: **4/4 checks**, `pendingAfter: 0`.
  - Bug found while proving it: the script used the native-collection `.project()` on a Mongoose model, and the error path left the connection open, so the process hung instead of exiting. Both fixed.
  - The scheduled scan had already produced 66 new holds by the time this was built, which is exactly the recurrence the drain exists to stop. At 12 rows per scan it drains over a few runs; it is a bound, not a promise of an empty queue at all times.
  - First production run (`/var/log/terror-tracker/queue-drain/2026-11-07T21-30-10-410Z/`): 12 pending, 9 exportable, 9 decided, 4 dismissed, 2 guard-blocked and attached, 0 failed, pending 66 to 57, exit 0.
  - Caveat found by that run: the drain handles **single-candidate held leads**. A stored-pair row (two candidates in one row) is skipped by this path and still needs the pair adjudicator or a merge. Those are the ones the audit produces, and they should be closed by the audit workflow, not this drain.
- **Stored-pair pass built but deliberately kept manual (2026-11-07).** `scripts/drain-pair-queue.ts` adjudicates a stored pair with claim linkage, merges eligible pairs through `merge-incidents`, and dismisses the rest as distinct events. On a live pair it exceeded 17 minutes without producing a decision, because each side can fetch two articles and run a claim-extraction model call per article. That does not fit a scan slot, so it is **not** wired into un-scan.sh`. Run it by hand with a small limit:
  `docker compose --env-file .env.deploy --profile scan run --rm --no-deps scan npx tsx scripts/drain-pair-queue.ts --limit 2 --apply`
  - Both drains now carry hard timeouts (20 minutes for adjudication, 8 for a merge, 25 for the applier) and `terror-scan.service` is raised to `TimeoutStartSec=5400` so a slow pass cannot kill a scan.
  - Consequence for the queue: the held-lead stream is self-draining after each scan; **stored-pair rows are not**. At the time of writing there were 57 stored pairs pending, which is the honest remainder of this automation.
  - Next improvement, if it is worth it: let the automated pass read one article per side instead of two. That roughly halves the cost; the manual path keeps the two-article depth for hard cases.
- **Recall follow-up:** the 7 misses are documented but not inserted; their pages expose no publication date to the import path, and inventing one would be the exact wrong-date risk the rules forbid.
- **Ops:** new image `d4c1687-scan` deployed. Backfill ledger mount is `/srv/terror-tracker/backfill` (uid 1000). Reproduce with `docker compose --env-file .env.deploy --profile scan run --rm --no-deps -v /srv/terror-tracker/backfill:/app/scratch/backfill-year scan npx tsx scripts/backfill-year.ts --from 2026-01-01 --to 2026-11-07 --run-id sweep-20261107 --coverage`, and publish with `--publish-only --apply` (never without `--publish-only`, or it re-runs discovery).

## 2026-11-04 V5 redesign implementation

- The user rejected V3 and a sparse V4 comp, approved the V5 comps (`design/v5-comps/`, local and gitignored) and asked for them to be built. `DESIGN.md` is the source of truth: dark only, app shell (sidebar on desktop, bottom tab bar on phones), panels, muted colour (terracotta killed `#d4694f`, steel blue abducted `#5a8cc8`, neutral attacks), Plus Jakarta Sans only.
- New public pages: `/patterns` (state-by-month heatmap, attributed perpetrators, deadliest attacks), `/states` and `/states/[state]` (real slugs only; unknown slugs are 404). Rebuilt: `/`, `/map` (`?m=` measure, `?s=` or `?state=` selection, status filter), `/incidents` (same API, filters, deep links, pagination; cards instead of rows), `/incidents/[id]` (share rail, record history), `/about` (`#corrections` anchor), the link-preview image and the sitemap.
- New `GET /api/summary`: one slim public row per active record this Nigeria year plus the Lagos day; Overview, Map, Patterns and States aggregate it client-side (`src/lib/summary.ts`, `src/lib/use-summary.ts`). `/api/attacks` and `/api/stats` are unchanged.
- Sharing: `src/components/Share.tsx` (WhatsApp, X, Facebook, Telegram, LinkedIn, copy text, save image, copy link; phones use the native share sheet first). State outlines are defined once per page (`MapDefs` in `src/components/icons.tsx`) and referenced by every locator.
- Removed the replaced Navbar, Footer, YearChart, NigeriaMap, RecordCard, ShareIncident, ScanStatus and StatusBadge components. Admin keeps its classes, restyled through token aliases in `globals.css`; its header is a simple admin bar.
- Verification: 
px tsc --noEmit` and 
pm run build` pass. Focused ESLint leaves five eact-hooks/set-state-in-effect` errors in lines this change did not touch (admin page, incidents deep-link effect and loader, incident reload); they fail the same way on main. E2E 
ode scratch/v5-redesign-e2e/v5-e2e.mjs [baseUrl]` passed 9/9 against the local dev server on the production database (read-only): overview totals equal `/api/stats`, controls, map deep links, incidents deep links and pagination, share URLs, preview PNG, sheet focus return, state 200/404, phone overflow and tab bar, design rules, console, admin login. Screenshots and esults.json` sit beside the script.
- Shipped to main as 7832101 plus 8c0f3a1 (heatmap screen-reader labels escaped the scroll area and widened `/patterns` by about 300px on phones; the local run missed it because it checked before data loaded, and the script now waits for content). The E2E passed 9/9 against production on 2026-11-04.
- Open finding, not caused by this change: production pages carry a Google tag (`G-YMCW9KY30X`, loader at `/bi6p/`) that is not in the repo, so the host injects it, and the site's CSP blocks it (two inline scripts and the loader). Analytics from that tag are therefore not running. The E2E records these blocks in esults.json` under `cspBlocks` instead of failing. Fix by removing the host injection or by allowing the tag in the CSP in `src/proxy.ts`; that is the user's call.
- Not verified: real phones and Safari, the authenticated admin workspace, and Plus Jakarta Sans glyphs in the browser beyond the catalogue's file check. The preview image renders in the default 
ext/og` font, so weights there are regular.

## 2026-11-01 Review queue completed

- Completed all **319 pending incident_reviews**, grouped into 199 source URLs. Live verification at 2026-11-01T19:04:20.022Z: **0 pending**, 292 resolved, 25 excluded, and 2 stored-pair reviews dismissed as distinct events with both records retained. There are **657 active incidents** after this run. Future collectors can create new reviews; this is a verified completion snapshot.
- Published **34 missing incidents** through the actual ingestion entry point. Dates retain exact-day, month-only or bounded-range evidence. Attacker deaths and unallocated multi-event totals were excluded. Full report with public record links and source-group decisions: `scratch/incident-review-completion.md`. All 319 IDs, fingerprints, notes and evidence: `scratch/review-decisions-final.json`.
- Merged NYSC duplicate `6acf7196975dfd4142b259a6` into older `6abf827f18c8ba906b5cf979`. Named-victim/bus/rescue evidence reconciles Ihiala/Anambra with Umunoha/Mbaitoli/Imo; survivor has 21 abductees, 13 sources and explicit early-report uncertainty. Standard merge snapshots: `scratch/duplicate-reconciliation-20261101/run-2026-11-01T18-24-55-942Z/`. Production survivor is 200; absorbed record is 404. Earlier Hussaini merge `6ae4fafc06af784a9e64a776` into `6ae3a62ff00297451eff3f93` remains intact; its absorbed ID is also 404.
- Retained distinct Ribah 30/31 October records and distinct Kogi captive groups. Published Umar Adamu Jagar's Lamor-Gotkum killing separately from the next-day Lamor farmer/pastor attack. Do not loosen global LGA/place identity rules. Recycled Kano child court case (2024), Hilltop hotel attack (2021), Ijibor school scare (2025), archives, accidents and individual out-of-scope crimes received specific exclusion notes.
- New audited CLIs: `scripts/apply-review-decisions.ts`, `scripts/ingest-reviewed-incidents.ts`, `scripts/repair-reviewed-evidence.ts`. They use explicit manifests, snapshots and preflight/guarded writes. Publication always calls normal ingestion gates; no manual hold bypass remains. Schema validation checks the entire candidate batch before writes. Evidence repair can change only pinned source text or explicitly clear a pinned unsupported toll.
- Final page review caught wrong per-event quote selection in scratch-generated multi-event candidates. Corrected 11 fields using literal source evidence: four Kajuru date citations, per-event toll quotes, and clearing Mariga's unsupported 29 abducted (source says 29 rescued from an attempted abduction). Repeat wrote zero changes. **Do not reapply original publication manifests without the later corrections.** Repair snapshots: `scratch/review-evidence-repairs/run-2026-11-01T19-02-44-719Z/`.
- Verification: both real-CLI disposable-database E2Es pass; unsupported quote refusal, dry-run zero writes, batch schema preflight, idempotency and nearby-event hold proved. tsc, focused ESLint and production build pass. `scratch/review-completion-verification.json` records 37 production API checks, all 34 new records, 11 corrected evidence fields, hash uniqueness and date integrity. Four production pages rendered without browser errors; screenshots and page text in `scratch/review-pages-result.json`. Repeating all 319 dispositions wrote zero changes and left zero pending. DB changes are public. The user subsequently requested committing and pushing the three review utilities and this handoff to main; scratch evidence and generated artifacts stay local. The temporary local verification server was stopped.
- Separate historical-backfill collection `credible_unresolved_incidents` had 172 open historical candidates before this focused batch; it was not adjudicated in this run. Earlier two Osun promotions remain: Ilobu `6ae77fc7122bf6c6d325d8df` and Osogbo `6ae78028e353d5cb843c4fa6`; snapshots under `scratch/osun-review-20261101/` and `scratch/osun-ajibola-20261101/`. Do not confuse historical-backfill status with the empty incident review queue.

## 2026-11-01 Ribah: a dropped "20 killed" toll, and why the pair is not a duplicate

- The two Ribah records are separate events and were left separate. `6ae6f5b81311f55c9af2ab6a` (Fri 30 Oct, Zuru LGA per the police statement) is two attacks repelled with guard Hassan Boder killed, corroborated by Vanguard and The Leader NG both carrying the same statement. `6ae6f5b61311f55c9af2ab68` (Sat 31 Oct, Danko/Wasagu LGA) is the Truth Nigeria raid with 20+ killed and abductions. Each source states its own date and outcome, so this is not a merge. Ribah is administratively Danko/Wasagu, so the police statement's "Zuru" is likely the emirate; the record keeps the source's wording.
- Cause of the missing toll, two defects stacked in `verifyIncidentWithDeepSeek`:
  - `TOLL_NOUNS.killed` had only past participles, so a toll stated as "killing more than 20 people" could not ground a figure. `VICTIM_NOUNS` had the same gap.
  - The paraphrase rescue could never fire: `findTollSentence` returns a raw sentence, but support was tested with 
ormalizedArticle.includes(quote)` (lowercased) and `quoteSupported` was not recomputed. Every real sentence starts with a capital, so a rescued quote failed and the figure was dropped anyway.
- Also changed: an open minimum keeps the written figure (`20` with `max: null`) instead of becoming 21, in both the heuristic (`free-news.ts`) and the model path; open minimums now use `precision: "range"` so the UI renders `20+` rather than "About 20"; and a record holding a range can no longer sit at `unconfirmed`, matching the rule the heuristic path already applied.
- Backfill: `scripts/backfill-dropped-tolls.ts` re-runs the real extraction path for a record's own source and fills only empty casualty fields, never overwriting a stated figure. Event identity is decided by `sameIncidentIdentity` on the repository's strict place rules: the event day must match, a known settlement that differs is never overridden by an LGA that agrees, a known LGA that differs rejects the match, and at least one comparable place field must agree. Exactly one identity match is required across every event the article yielded. The write is guarded on the record still being active and still empty in those exact fields. `--self-test` proves the identity rules without touching the database. Applied to `6ae6f5b61311f55c9af2ab68` (killed 20+, status `developing`) and `6ae3a94df00297451eff4040` (Plateau, killed 1 / injured 1). Artifacts under `scratch/backfill-dropped-tolls/`.
- Review with GPT-6.1 Sol (the Codex lane; Terra was retired) ran two rounds, both REVISE, every finding fixed: the backfill could pick a different event, the support check still accepted any verbatim quote through an `||`, a rescued sentence could borrow another category's minimum qualifier, the write was not conditional, and LGA agreement could override a settlement conflict. `countQuoteSupports` now delegates to `tollClause`, the model quote is accepted only when that clause test passes, the minimum qualifier is read from the matched clause (`"twenty were killed and at least five were injured"` keeps 20 exact and 5 open), and the backfill update is filtered on the fields it expects to still be empty. A third full review was not run, per the two-repair-round cap.
- One consequence worth knowing: the Plateau record's 1 killed / 1 injured now stands on its own source sentence (`"one of the victims, identified as Talatu Sunday, 67, had been shot dead"`) rather than on a clause match, because the tightened gate treats the appositive commas as clause breaks and no longer reproduces that figure. The stored data is correct and quoted; a re-run would not overwrite it.
- Proof: 
px tsx scratch/probe-toll-grounding.ts` (gerund grounds, rescue finds the sentence, "three killed, seven abducted" still refuses to cross categories, the mixed-qualifier sentence keeps each count's own qualifier, 20+ rendering). Live re-extraction of the Truth Nigeria article still returns `killed: 20, precision: range, max: null` through the tightened gate; the rendered page shows "20+ minimum reported count" with the quote and status Developing. tsc, focused ESLint and 
pm run build` pass.
- Older records reviewed (11 audited, plus the two already filled): only one carried a figure the pipeline could not produce. `6a966de9a83adf70ab8f836c` (Kogi communal clash) now has killed 2 / injured 1 from the police statement quoted in Daily Trust, written through the new `--curated` mode of the backfill script, which only fills empty fields and guards the write the same way. The others are genuinely "not reported": six name a single victim with no count ("kill pastor's son", "kill senior Army officer"), one is a HURIWA statement with no toll, one a multi-community Taraba wave where the only number (two young men) belongs to one community, and one a Kogi-style clash whose article was rejected by the model. None were changed.
- eextractSearchLedSource` now takes a eachHours` for both the publication age and the event interval (default 336, the widest scan window). The scan itself is unchanged; a backfill may read further back because the record already exists. The strict identity rules still decide which event in the article is the record's.
- Flagged, not changed: `69d885dc541e36db9be7bb9a` is titled "Terrorists Kill Scores in Niger Communities" but its Zagazola source says security forces killed scores of the bandits attacking Bagna and Erene. There is no civilian toll in the article, and as a security-force operation with no victim casualties it may be out of scope. Fixing or deleting it needs a decision; nothing was written.
- Fixed the last open item from the Luna round: `groundingCheck` is now category-aware. `GroundingInput` carries `tolls: { value, victims }[]` instead of a flat list of figures, and the check asks `tollClause(quote, value, victims)` for each, so "20 were injured" can no longer anchor a killed toll. The unused `VICTIM_NOUNS` window test is gone, `TollCategory` is exported from `quote-grounding.ts`, and `scripts/adjudicate-duplicate-reviews.ts` builds the pairs from both records' own categories. Proof: `scratch/probe-toll-grounding.ts` now asserts a killed toll grounds and the same figure as an injured toll does not; `scratch/probe-quote-gate.ts` (10/10) and `scratch/e2e-adjudicate.mjs` (14/14, real CLI on a disposable database) both still pass. The E2E's same-event fixture is held earlier, at `claimsLink`, so it does not exercise the new branch; the probe does.
- Review with GPT-6 Luna (read-only audit) raised five more items. Fixed: the backfill now runs the incoming value and its meta through 
ormalizeCasualtyFields` before writing, so a range cannot carry min > max and an "unknown" meta cannot publish a number; the multi-event place gate now matches a settlement as a whole word (`textNamesPlace`) instead of a substring, so "Bori" no longer matches "Borin"; and the probe covers a cross-category matrix, the qualifier variants and the place-prefix case. Rejected as mistaken: its claim that "20 people were injured" can ground a killed count, because `tollClause` reads `TOLL_NOUNS`, not `VICTIM_NOUNS`, and the probe proves that pair plus four others are refused. Accepted ambiguity: "casualties" stays in `TOLL_NOUNS.killed`. `/api/stats` matches a direct database sum exactly (623 records, 2253 killed, 582 injured), so an open range flows through as its representative value.
- Data written: Ribah `6ae6f5b61311f55c9af2ab68` killed 20+ / developing, Plateau `6ae3a94df00297451eff4040` killed 1 / injured 1, Kogi `6a966de9a83adf70ab8f836c` killed 2 / injured 1.

## 2026-10-29 Two daily scans and DeepSeek Search lane

- Schedule (repo only, uncommitted): `deploy/systemd/terror-scan.timer` is now `*-*-* 08,20:00:00 UTC` (09:00 and 21:00 Lagos). The weekly catch-up moved from Sunday 19:30 to **Sunday 14:00 UTC** because 19:30 would overlap the 20:00 slot and un-scan.sh`'s flock turns an overlap into exit 75 plus a failure alert. `SCAN_HEALTH_STALE_HOURS=18`, the hourly watchdog and the 20:30 UTC dead-man were left alone (healthy worst case is about 13 h). **The live server keeps its own copies of the timers**: copy both to `/etc/systemd/system/`, `systemctl daemon-reload`, `systemctl restart terror-scan.timer terror-scan-weekly.timer`, then check `systemd-analyze calendar "*-*-* 08,20:00:00 UTC" "Sun 14:00:00 UTC"` and `systemctl list-timers 'terror-*'`. Not verified locally (no systemd on this machine).
- Risk of 12 h gaps: publisher feed first pages hold 20 min to about 2 h, so recall leans on the search lanes and on the feed paging in `discovery-feeds.ts`. Ship them together.
- DeepSeek Search provider (uncommitted): `src/lib/news-discovery.ts` has provider `deepseek`, `POST ${DEEPSEEK_BASE_URL}/v1/tools/search` with the existing `DEEPSEEK_API_KEY`, `$0.75 per 1,000` successful calls, billing starts 2026-11-01 00:00 Beijing time. Freshness is an `after:YYYY-MM-DD` suffix on the query, clamped to 128 chars. 401/403/429 and 402 are BLOCKED; 402 also sets a process flag so the rest of the scan skips it. It is not the model's `web_search` tool (that is `deepseek-v4-pro` only and the model picks the queries).
- Lane order in `collectSearchLedIncidents`: primary lane per state is DuckDuckGo, Google News, DeepSeek Search; Brave then Bing only when that lane found nothing or all of it failed. Chosen over Brave-first because Brave ran dry on 2026-10-16 as fallback-only, and 37 states x 2 runs x 30 days is about 2,200 calls a month. Reordering is a one-line change. Switches: `NEWS_DISCOVERY_ENABLE_DEEPSEEK_SEARCH=false`, `DEEPSEEK_SEARCH_MIN_DELAY_MS` (default 250). Cost is about $1.70 a month at this volume.
- `src/lib/search-lane-health.ts` now also raises "DeepSeek Search rejected the key or balance" (401/402) and "DeepSeek Search failed for N of M states" (half or more); `deploy/search-lane-alert.sh` text updated.
- Proof (real API, key from `.env.local`): `scratch/deepseek-search/probe.mts` (6 states, 10 results each, all inside the 168 h window, mostly direct publisher URLs; `deepseek-chat` still answers, served as `deepseek-flash`; results in `probe-result.json`). `e2e-lane.ts` through `collectSearchLedIncidents`, Brave removed, feeds off, Plateau/Zamfara/Benue: baseline 44 URLs and 10 admitted, with DeepSeek 57 URLs and 15 admitted (adds The Sun, Tribune, New Telegraph, a Gwom-Ajang/Barkin Ladi record); outputs `e2e-baseline.json`, `e2e-with.json`, `summarize.mjs`. `e2e-failures.ts` (stub server: 401, 402, 429, 504, non-JSON, no results array, empty, over-length query, junk results) and `e2e-collector-stub.ts` (402 stops after one request and raises the alert, kill switch sends none) all pass; outputs `e2e-failures.txt`, `e2e-collector-stub.txt`. tsc, ESLint on the three changed lib files, and 
pm run build` pass.
- Not done / unverified: a full 37-state scan with the new lane (about 9 s per state per lane, so expect a longer run); the DeepSeek top-up and balance monitoring beyond the 402 alert; whether DeepSeek keeps `deepseek-chat` as an alias (it works today).

## 2026-10-29 Gero duplicate and source coverage gaps

- Gero (Jos South, Plateau, Mon 26 Oct): `6ae2e99a391f0d066703fcea` (dated 29 Oct from Blueprint's publish date, 6 killed) merged into `6ae09aa666d3220b5353fc0e`. Survivor is now Gero, 6 killed / 1 injured (Plateau police revision of the community's 7), `confirmed`, 10 sources including Channels TV, Premium Times, PUNCH, ThisDay, News Central. Six pending duplicate rows closed ("same event already recorded", `scratch/source-gap/close-gero-rows.mjs`). Artifacts: `scratch/duplicate-reconciliation-20261029/`, pair file `scratch/source-gap/pairs.json`. The adjudicator holds such rows because the candidates name no victims; they need a person.
- Why the sources were "missed": Channels and Premium Times are registered feeds. (1) Brave's monthly quota ran out 2026-10-16 18:55 UTC; since then every scan is feed-only (about 55 URLs per run against about 175) and DEGRADED, and nothing alerts on that. Needs a top-up or a Brave-independent search lane (not done). (2) Feed first pages hold 20 minutes (Leadership) to about 2 hours (Premium Times, Daily Trust, Blueprint) while scans run hours apart.
- Implemented (uncommitted): `src/lib/discovery-feeds.ts` now reads older feed pages (`?paged=2..N`, `SEARCH_FEED_PAGES`, default 3). Page one is required; older pages are best effort and stop on error or when a page repeats page one (Daily Post, ICIR, and PUNCH from Node ignore `paged`). Real-feed run, 168 h window: 33 incident-headline articles at depth 1, 45 at depth 3 (`scratch/source-gap/e2e-feed-depth*.txt`; 
px tsx scratch/source-gap/e2e-feed-depth.ts`). tsc and ESLint clean; 
pm run build` not run.
- Implemented (uncommitted): Brave-independent search lane. `src/lib/news-discovery.ts` has a `googlenews` provider (Google News RSS search, `hl=en-NG gl=NG`, `when:` from the freshness setting). RSS links are wrappers, so each is resolved to the publisher URL through the same signed `batchexecute` call the Google News page makes; an item that does not resolve is dropped, never passed on, and a list that resolves to nothing is a FAIL. Suppressed hosts are skipped before decoding. `collectSearchLedIncidents` now runs DuckDuckGo and Google News as the free lane (a failed lane only counts when both fail, so Brave is no longer called when Google News works). Kill switch: `NEWS_DISCOVERY_ENABLE_GOOGLE_NEWS=false`. Unknown risk: Google can rate-limit or change the endpoint; the failure shows as a `googlenews` search failure in the report.
- Proof (no DB writes, Brave key removed, feeds off, Plateau/Zamfara/Benue, 168 h): without the lane 19 URLs, 3 incidents, no Channels/Premium Times/PUNCH; with it 30 URLs, 8 incidents including Channels, Premium Times, PUNCH and PM News on the Gero attack. Files: `scratch/source-gap/e2e-google-news-lane.ts`, `e2e-gn-baseline.json`, `e2e-gn-with.json`, `summarize-gn.mjs`; failure paths `e2e-google-news-blocked.ts` (429, consent page, undecodable links, empty feed) and `e2e-google-news-negatives.ts`. A full 37-state scan was not run; expect it to take longer (about 9 s per state here).
- Implemented (uncommitted): search-lane alerting. `src/lib/search-lane-health.ts` (`searchLaneAlerts`, `probeBraveLane`) turns a down lane into report text; `scripts/search-led-scan.ts` writes it to `searchLaneAlerts` in the JSON report, the step summary and a `SEARCH LANE ALERT` console line. Brave is only a fallback now, so a healthy scan never calls it and would never see the quota gone; the scan therefore makes one single-result Brave query per scan. `deploy/search-lane-alert.sh`, called at the end of un-scan.sh`, emails once per UTC day (stamp eports/.search-lane-alert`), clears the stamp after a clean scan, never arms a retry and never changes the scan's exit status. **Host steps needed:** copy `search-lane-alert.sh` and the edited un-scan.sh` to `/srv/terror-tracker/` (chmod 755) and redeploy the scan image; until then run-scan.sh just logs a missing-script line. Proof: `bash scratch/source-gap/e2e-search-lane-alert.sh` (17 checks) over real reports from `make-lane-report.ts`; jq and curl are stand-ins in `scratch/source-gap/fake-bin/` because neither exists on this machine, so no mail was sent through Resend.
- Not done: a faster feed-only pass, 
pm run build`.

## 2026-10-29 Binari Duplicate (reaction-story date)

- Merged `6ae21fca1ba9bec263679ff9` (dated 28 Oct, "about 80", Senate-resolution sources) into `6adc95a93489bd12ce24c502` (Binnari, 23 Oct). Survivor keeps 58 killed; NEMA's 62 is an open toll conflict. Artifacts: `scratch/binari-dup/merge-run/`.
- Cause: the date came from the page dateline/weekday of a reaction story, and the duplicate lookup only searches +/-1 day, so the earlier record was never compared. Fix implemented (uncommitted) from `scratch/binari-dup/ingest-fix-plan.md`:
  - `src/lib/free-news.ts`: `dateEvidenceFromText` no longer takes a full date equal to the publication day when it is not introduced by on/of/a weekday (page dateline), nor a weekday/today/yesterday/date that directly follows a reacting body (Senate, House of Reps/Assembly, plenary, governor; not "governor's"). New export `hasOnlyNonEventDates`.
  - `src/lib/deepseek.ts`: `cleanAndConfirmIncident` sends the candidate to review when the model's date quote, judged with the 80 characters before it, is only a dateline or reaction date. Probed on the real Blueprint page: the original code confirmed it as 28 Oct, the fix returns review.
  - `src/lib/search-led-discovery.ts`: the duplicate lookup loads records within 336 h; the deterministic merge keeps its 24 h tolerance; the semantic check uses 336 h only when the town is `placesPlausiblySame`. A cross-day `same_event` is held, never merged. Location rules untouched.
  - Proof: 
px tsx scratch/binari-dup/e2e-ingest-fix.ts` (14/14, `scratch/binari-dup/e2e-results.json`; baseline before the fix was 10/14). tsc and build pass; ESLint on the three files has only two pre-existing warnings in deepseek.ts.
  - Cost: a town hit twice within 14 days now sends the second report to the model instead of inserting it; with the model off it is held. Active pairs in this window were 9 of 591 records before the two merges.
- Kwi (Plateau, 8 Oct): merged `6ad0bf496f6815ca64af1c28` into `6ace412cc9fe030f71d579ba` after re-reading sources (Eagle, Legit.ng, Truth Nigeria). The 25 Oct dismissal (review `6ad0bf6b9a5e030f6a77377d`, "different events") rested on injured-vs-killed, but the Truth Nigeria article says the officer died. No shared victim name, so confidence is high, not certain. That review row's disposition note was left as written and is now wrong. Artifacts: `scratch/binari-dup/merge-run-kwi/`.
- Binnari held duplicate rows: five (Punch 26, Al Jazeera 62 x2, India Today 62/52, Africa Eye "Benari" 40) were read and resolved as the same event; their sources were attached to `6adc95a93489bd12ce24c502` (now 24 sources). The adjudicator holds these because the held candidates have LGA "Unknown" or the spelling "Benari"; the disposition was a one-off, `scratch/binari-dup/disposition-binnari.ts`, snapshots in `scratch/binari-dup/disposition-apply/`.
- Toll set to NEMA's 62 killed, 52 injured (TVC quote, `merge-incidents` override, `scratch/binari-dup/pairs-toll.json`, artifacts `scratch/binari-dup/merge-run-toll/`); 58 stays in the description. Status stays `developing`. The `casualties_conflict` tag was left on the record. About ten `extraction` rows for the same attack (ThisDay 30, Daily Post 50, Blueprint 50, AP/Kelo 40, Daily Post Senate 80) stay pending as leads; they are evidence-grounding failures, not duplicates.

## 2026-10-28 Self-Hosted Migration Off Netlify (in progress)

- New target: the Contabo box `ops@185.216.203.128` (Ubuntu 26.04, 4 vCPU, 7.9 GB, Docker 29, Caddy already serving `sloplens-api.tryraisins.dev`). `tryraisins.dev` is on Cloudflare nameservers. Decision: keep the whole Next.js app as one server behind Cloudflare (proxied, Full strict), not a static frontend + separate API. The app is request-time throughout (`layout.tsx` `await connection()`/`headers()`, `incidents/[id]` `force-dynamic`, `proxy.ts` nonce CSP, 14 route handlers) and deliberately same-origin (`sameSite: "strict"`, CSRF origin allowlist, `connect-src 'self'`).
- Code added: `Dockerfile` (targets unner` = standalone, `scan` = full source + node_modules), `.dockerignore`, `.github/workflows/publish-image.yml` (GHCR + auto-deploy on push to `main`), `deploy/` (compose, deploy.sh, run-scan.sh, scan-alert.sh, scan-deadman.sh, Caddyfile.snippet, env examples, 10 systemd units, README), new `/api/admin/scan-runs`.
- 
ext.config.ts` emits `output: "standalone"` only when `BUILD_TARGET=container`, so the Netlify build keeps its current shape until the hostname moves. Do not make it unconditional.
- `getClientIP` (`src/lib/security.ts`) now reads `cf-connecting-ip` first, then Netlify's header, then `x-real-ip`. Without this, every visitor behind Cloudflare shares one rate-limit bucket. The Netlify branch is dead code once cutover completes.
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` is inlined into the client bundle at build time, so it is a GitHub **variable** and a Docker build arg, not runtime env. The publish workflow fails loudly if it is missing.
- Alerting: systemd `OnFailure=` → `scan-alert.sh` emails through Resend (`alerts@tryraisins.dev`) and arms one retry 20 minutes later; `terror-scan-alert-final` covers the retry so it cannot loop; `scan-deadman.timer` emails if no report exists for 18 hours. Public `/api/scan-health` now returns only `{lastCompletedAt}`; warnings and run history moved behind the session-gated `/api/admin/scan-runs`, rendered in the admin panel's "Collection health" section. `ScanHealth.tsx` was deleted.
- Verified on the box: image builds in CI and pulls from GHCR (public package), `deploy.sh` passes a Mongo-backed readiness probe, the app serves `/`, `/api/attacks`, `/api/stats`, `/api/scan-health` on `127.0.0.1:3001`, and `/api/stats` matches production exactly (586 attacks, 2279 killed), so the box is on the production database. `/api/admin/scan-runs` returns 200 with a minted session and 401 without one. Public HTML contains no "overdue" text.
- Auto-deploy works end to end: the CI SSH key is pinned with `command="/usr/local/bin/terror-deploy.sh"` and estrict`; the wrapper accepts only a 40-character sha. `DEPLOY_ENABLED=true`, `DEPLOY_HOST=185.216.203.128`, `DEPLOY_SSH_KEY` and `DEPLOY_KNOWN_HOSTS` are set. Note `sudo -n` is required because compose must read the root-owned env files.
- The scan now runs from the host, not GitHub Actions. `terror-scan.timer`, `terror-scan-weekly.timer` and `scan-deadman.timer` are enabled; the `schedule:` block is gone from `daily-scan.yml`, which is now `workflow_dispatch` only. `BRAVE_SEARCH_API_KEY` and `DEEPSEEK_API_KEY` were taken from the developer's `.env.local`, and Resend is live (sender `alerts@tryraisins.dev`, recipient `tryraisins@gmail.com`), so `scan-alert.sh` delivers for real. Verified: a manual un-scan.sh` run and then `systemctl start terror-scan.service` each completed 37 states in about 5 minutes with exit 0, wrote the report, archived a copy and recorded a `ScanRun`; the alert unit emailed and armed the retry, and the dead-man check reported "nothing to do" on a fresh report.
- `scan-alert.sh` and `scan-deadman.sh` read the four keys they need out of `scan.env` with ead_env` instead of sourcing it. Sourcing broke on `ALERT_EMAIL_FROM=Terror Tracker <alerts@...>` (unquoted `<` is a shell syntax error) and would have evaluated anything a future value contained. `ALERT_EMAIL_FROM` is a bare address now; the scripts add the display name.
- Staging verified 2026-10-28. 
ew.tryraisins.dev` is proxied through Cloudflare and served by Caddy from the box. Caddy 2.6.2 holds a real Let's Encrypt certificate for it (issued over HTTP-01, which works through the proxy; `disable_tlsalpn_challenge` is required). Through Cloudflare, `/api/version`, `/api/attacks`, `/api/stats`, `/api/scan-health` return 200, `/api/admin/scan-runs` returns 401, and `/api/auth/login` returns 400 rather than 503, which proves the Turnstile secret and the hostname allowlist are wired. Origin TLS also answers 200 when Cloudflare is bypassed.
- Caddyfile gotcha: this box has Caddy **2.6.2**, which has no `trusted_proxies` global option (2.7+ only). Adding it makes the whole config fail to parse and the reload fail. `deploy/Caddyfile.snippet` documents this. The reload failure left the running config untouched, which is why `sloplens-api` stayed up.
- **Cutover done 2026-10-28.** `terrortracker.tryraisins.dev` is now a proxied A record to `185.216.203.128`; Caddy holds Let's Encrypt certificates for it and for 
ew.tryraisins.dev`. The public `/api/version` buildId matches the box exactly, so the domain is served from the host and not Netlify.
- Smoke test through Cloudflare after cutover: `/`, `/incidents`, `/about`, `/map`, `/admin`, a detail page with real content, its OG image (PNG), `/sitemap.xml`, `/robots.txt`, `/manifest.json` and every public API all return 200; `/api/auth/check` and `/api/admin/scan-runs` return 401; `/incidents/not-an-id` returns 404; `http` redirects 301 to `https`. Edge caching behaves without any Cloudflare Cache Rule: `/_next/static/*.css` is `public, max-age=31536000, immutable` and went MISS then HIT, while HTML stays 
o-store` and `DYNAMIC`.
- Fixed 2026-10-28: the soft 404. `incidents/[id]/page.tsx` called 
otFound()` only for malformed ids, so a well-formed id pointing at nothing rendered a "record not found" body with a 200. It now 404s for any id with no record, keeps the client error state for a database failure, and `src/app/not-found.tsx` renders a branded 404 with 
oindex`. Verified on production: missing id 404 with the branded page, malformed id 404, unknown route 404, real record 200.
- Deploy reliability: the CI deploy failed once because GHCR resets large layer downloads from this host over IPv6. Measured directly: the same 11 MB file takes 2.3 s over IPv4 and fails immediately over IPv6, while `docker pull` intermittently uses IPv6 for the Fastly-backed blob host. `deploy.sh` retries ten times with a widening backoff and still falls back to a locally present tag. The durable fix is host-level (either fix IPv6 to GitHub or prefer IPv4 for the daemon); it was not applied because Docker cannot be restarted without interrupting the other projects on the box.
- 2026-10-28 review pass returned REVISE. All findings addressed:
  - **Rate-limit bypass (was the serious one).** `cf-connecting-ip` was trusted unconditionally while the origin was reachable directly, so anyone hitting `185.216.203.128` could forge it and rotate the rate-limit key, defeating login throttling. Caddy now answers 403 to any peer outside the Cloudflare ranges (ACME paths excepted) and strips caller-supplied `X-Real-Ip` and `X-Nf-Client-Connection-Ip`. Verified: direct origin with a forged header 403, direct root 403, through Cloudflare 200, loopback 200, and the DNS-only `sloplens-api` block deliberately unchanged at 200.
  - **Off-box monitoring.** Every other alert ran on the host being monitored. `scan-watchdog.yml` runs hourly on GitHub and reaches the host through the deploy key's forced command, which now accepts `health` as well as a sha. A failed SSH is itself the alert. It reads the app's `lastCompletedAt` (last completed ScanRun), not the report mtime the on-box dead-man uses. The public URL is deliberately unused: Cloudflare challenges GitHub runner IPs and returns a bot page instead of JSON, which the first version discovered by failing.
  - **Alerting can no longer be lost to a mail failure.** The retry timer is armed before anything that can fail, so a Resend outage or a missing key still buys the rescan.
  - **Deploy script.** `flock` against a racing manual deploy; `.env.deploy` written only after the images are confirmed, with the tag passed by environment so a failed pull cannot point the scan at a missing image; the local fallback checks both the runner and the scan tag; rollback is probed and reported instead of silently exiting 1; sha-tagged images older than current/previous are pruned every deploy.
  - **Scan runner.** The slot container is named `terror-scan-slot` and any leftover is removed before a run, because systemd's timeout kills the script but not the container, which is what would otherwise let two scans overlap. A held lock exits 75 rather than 0 so a skipped slot alerts. The report directory is chowned to uid 1000.
  - **Pipeline.** `publish-image` refuses to build or deploy from a non-main ref.
  - Verified after the fixes: a full unit run took 6 min 7 s, exited 0, wrote a report, archived it, left no slot container behind; the watchdog ran green and printed the parsed payload; both images still deploy automatically.
  - Still unexercised: the `deploy.sh` rollback branch, the watchdog's failure branch (arithmetic only), and a real Resend outage.
- Review-queue automation, phase 1, rebuilt on claim-level linkage (option 2). The toll-conflict question is now gated by a comparison of what the articles actually claim, not by the identity fields that found the pair. `src/lib/claim-linkage.ts` extracts people, sites, times, tolls and distinctive phrases from each side and links only when the two share a named person, or a specific site plus a shared time or a matching toll for the same victim type. A shared site alone is the neighbourhood they already share and a shared toll alone is a count outlets copy, so neither is enough. `extractArticleClaims` in `src/lib/deepseek.ts` does the extraction and never decides linkage.
- Consequence, and the reason this design is right: on the real Binnari pair that the earlier version resolved, three of the stored record's source articles still fetch, and the claim comparison finds no shared person, site, time or toll. It holds. That matches AGENTS.md, which names that exact pair as the case that must be held because the dates and tolls conflict. So the earlier six resolutions were at best unproven.
- `extractArticleParts` now returns a `body` field because `text` began with the title and description, and the title is part of the identity hash. `fetchArticleText` returns body text only and preserves the reader's line structure. The judgeable quote must be one body sentence, 60 characters, name the settlement, state one of the two tolls beside a victim noun, and share a distinctive record detail.
- The `exact_day` requirement was dropped again: the queue row exists because the ingest hash matched on the stored date anchor, and broad precision is fine now that claims are the guard. Equality of the normalized anchor and rejection of `unknown` remain.
- Evidence: `scratch/probe-claim-linkage.ts` 9/9 (shared person links; site+time links; site+matching toll links; site alone, toll alone, same settlement different site, settlement-as-site, wrong victim type and title-only tokens all rejected). `scratch/probe-quote-gate.ts` 10/10. `scratch/e2e-adjudicate.mjs` 14/14 with the real pair as the positive case, asserting that a resolution records a quote and that holding is acceptable. Production dry run resolves 0 of 8, and that is the honest answer: these rows are ambiguous or fail identity.
- Phase 2 (late reports) done 2026-10-28. The sweep now owns them instead of the queue: `WIDEST_SCAN_WINDOW_HOURS` (336, the Sunday catch-up) decides. An event whose interval END is inside that window is marked retryable and due now, so the next scan retries it through the same evidence gates with a fourteen-day window. An event older than that is dismissed with a note naming it as historical backfill. A row with no parsed candidate stays pending because there is no event date to compare. Applied to production: 50 pending late reports became 3, with 47 dismissed and 3 queued for re-extraction. The note on every dismissal names the reason, and the rows are dismissed, not deleted, so a backfill can still find them.
- Phase 2 review corrections: an in-window row that has already spent its retry budget now falls through to the exhausted disposition instead of being silently skipped, the requeue list excludes already-retryable rows so a dry run and an apply report the same number, the docblock lists five dispositions, and etryIncidentReviews` uses `WIDEST_SCAN_WINDOW_HOURS` so the cutoff and the retry window cannot drift.
- `scratch/e2e-late-reports.mjs` is the repeatable artifact: 12/12 against a disposable database, covering 335h requeued, beyond-window dismissed, month_only inside the window requeued, date_range beyond it dismissed, missing and null candidates pending, a spent budget exhausted, an already-retryable row untouched, dry-run and apply counts agreeing, and a second sweep changing nothing. Note for future work: the sweep compares interval END, and an exact-day interval ends at 23:59:59, so a date a few hours past the window can still be inside it. My first fixture got that wrong, not the code.
- Phase 3, first increment 2026-10-28. The grounding gate used to withhold an entire incident when one casualty figure had no quotable support. Now `cleanAndConfirmIncident` rescues the figure first (`findTollSentence` in `src/lib/quote-grounding.ts`: the number must sit in a sentence next to a victim noun for that field, digits, words or comma-grouped), and only drops the figure when no sentence supports it, recording the incident with an unknown toll instead. `droppedCounts` is returned on `DeepSeekCleanupResult` so the loss is visible. Date and location still reject, because an incident without them has no identity. `scratch/probe-toll-rescue.ts` is 6/6.
- Measured the extraction backlog before building further: 35 date or location unsupported, 33 other, 27 multi-event or roundup, 19 casualty quote unsupported, 15 model count disagreement. So the casualty fix alone cannot drain it. A five-row production sample through `scripts/requeue-extraction-reviews.ts` confirmed that: all five were held, none resolved, because they were disagreement and roundup rows.
- `scripts/requeue-extraction-reviews.ts` makes due extraction rows due now and hands them to etryIncidentReviews`, the same path the scan uses. Dry run by default. The rows are already retryable and due 93 at a time, so the scan is retrying them anyway and failing; the script exists to force a batch after a grounding change.
- Cross-session reconciliation 2026-10-29. A commit from a separate Claude Code session (fe3ae1e, "Stop reaction stories dating incidents and widen the duplicate lookup") landed in the middle of this work and its diff swept in two of my in-progress declarations (`multiEventArticle`, `usedEvidence`), so `git blame` attributes them to the wrong commit and reverting fe3ae1e alone would break the later one. An Opus review of the two sets found them compatible but opened four defects, all now fixed: the non-event-date rule made a bare publication-day quote reparse to null, and the old `Boolean(reparsedDate && ...)` form read that as "no mismatch", so a model date one day off could pass; the toll rescue was still running for multi-event articles despite the comment saying otherwise; the multi-event place check ran before the general guard, so rejections named the wrong cause and a state-only record could never degrade; and the one-sentence-per-event check compared raw sentences against normalised quotes, so it could miss a borrowed sentence. The admin row also lost the stored record id that a held lead needs, now restored with a link.
- Still open from that review, deliberately: the adjudicator's `limit` always takes the 25 oldest duplicates, so cross-day holds and stored pairs can starve decidable rows; the audit script's URL grouping strips the whole query string and its evidence rule differs from ingest (it checks casualty quotes, accepts town or LGA, and flags rescued dates); and a page that carries both a dateline and an introduced date can be rejected by the dateline because the guard checks the first occurrence. None of these can publish wrong data; they cost throughput or reviewer time.
- Phase 3, second increment 2026-10-28/29. Two things:
  - Date rescue: when the model's own date quote is not in the article, `cleanAndConfirmIncident` re-derives the date from the body (`dateEvidenceFromText`) and accepts it only when it lands on the same day or interval. A different date is never substituted silently.
  - Location degrades instead of rejecting: a named settlement is `exact` even when the LGA is unstated, an LGA without a settlement is `approximate_lga`, and a state on its own is `approximate_state`, which is exactly what AGENTS.md's field conventions describe. Previously any Unknown LGA or town rejected the incident.
- The real blocker was the retry treadmill: a re-extraction that returned no incident and no new lead left the row pending, incremented the attempt counter and repeated until the budget ran out. etryIncidentReviews` now dismisses that case with "Re-read the source and it reports no eligible incident any more", which is a conclusive answer rather than a failure.
- Measured effect on production: two batches of 8 and 19 due rows produced 3 resolved, 12 dismissed as no-eligible-incident, 12 held, 2 records inserted and 1 merged. Two inserted records (Kaduna, Bauchi) rendered 200 on `/api/attacks/<id>` and `/incidents/<id>`. Their precision was initially `approximate_state` because of my mapping; corrected to `exact` since both name a settlement, and the mapping itself is fixed.
- Extraction queue: 132 at the start of the increment, 126 pending after two batches, 108 still retryable. The scheduled scan drains roughly 5-20 due rows per run, so the rest will follow without manual batches.
- Remaining for phase 3: roundup splitting, one incident per event (27 rows where the article reports several attacks and the model will not separate them).
- Netlify is retained for rollback: 
etlify.toml` and `@netlify/plugin-nextjs` stay until roughly 2026-11-04, since pointing the record back at `terrortracker.netlify.app` is a one-minute undo. Already removed: the two dead 
etlify/functions/scheduled-*.mts` (no `config.schedule`, never wired) and the now-unused `@netlify/functions` dependency.
- Remaining work: one browser pass of an admin write action (login plus a delete or review move), because the CSRF origin check is tied to `NEXT_PUBLIC_APP_URL` and cannot be exercised from the staging hostname. Then, after the rollback window, delete 
etlify.toml`, the Next plugin dependency, the Netlify site itself, and the 
ew.tryraisins.dev` Caddy block plus its DNS record.
- Traps found. 
etlify env:list --context production --json` and `env:get --context production` mask "secret"-typed values as a run of asterisks plus the last four characters (`****************cker`), while `env:get` without a context returns the real value for keys that exist in the dev context. Masked values must be rejected, not trusted. Piping `git show` output straight into a remote `tee` flattens a file to one line, which silently broke every systemd unit; `-join "
"` first. GHCR resets large layer downloads from this host over IPv6, so `deploy.sh` retries the pull five times and falls back to a locally present tag.

## 2026-10-28 V3 Redesign Implementation

- The user rejected the V2 look entirely, asked for a new design in pen.dev (edesign new.pen` at the project root, gitignored with its edesign new-assets/` folder; the Map script node points at the local gitignored `design/map-v3.js`), then asked for it to be implemented and pushed to `main`. `DESIGN.md` describes the system, the colour roles and the page layouts.
- Decisions made along the way: dark only; neutral white and grey text (the first blue-grey text was rejected); killed red, abducted amber, injuries neutral; the huge Home death-toll numeral stays white; no map or state ranking on Home; Inter Tight and Inter (kept for Yoruba, Hausa and Igbo glyph coverage).
- Code: rewrote `globals.css` (admin, date-picker and loading-state rules kept), `layout.tsx` (Inter and Inter Tight replace Noto), `page.tsx` (Home), `about/page.tsx` (Method), `Navbar.tsx`, `Footer.tsx`, `StatusBadge.tsx` (plain text, no dot). New `YearChart.tsx` replaces `BarChart.tsx`: one tick per day on desktop, monthly bars below 1024px. `/api/stats` now also returns `byDay`. `RecordCard.tsx` shows the place as the heading with the headline beneath and exports `placeParts`; place separators are commas, not middle dots. Records, Map and Incident keep their behaviour and structure but follow the skill rules (no arrow glyphs, no `↗`, "Previous page" and "Next page", map ranking rows unnumbered, Incident title is the place with the headline beneath).
- Not redrawn in Pen and derived from the desktop comps: mobile Records, Incident, Map and Method. Empty and error states reuse the existing components with the new tokens. Admin screens were restyled only through shared tokens and were not visually checked, and neither were real phones or Safari.
- Verification: 
px tsc --noEmit` passes; focused ESLint shows only the five existing eact-hooks/set-state-in-effect` errors that `main` already has; 
pm run build` passes (disposable `JWT_SECRET`). 
ode scratch/v3-redesign-e2e/v3-e2e.mjs http://localhost:3107` passed 22/22 against the local production build with live data: figures from the API, one tick per day with the busiest day tallest and the last seven days highlighted, colour roles, no arrows, middle dots or link underlines, filters, deep links, detail, map, error recovery, phone layout and no overflow at 320 to 1920px. Screenshots and esults.json` are in `scratch/v3-redesign-e2e/` (uncommitted). The old `scratch/v2-redesign-e2e/` suite targets V2 markup and no longer applies.
- Page titles: the section layouts (`incidents`, `map`, `about`) no longer put "NATracker" in their own titles, because the root template adds it. `incidents/layout.tsx` restates a `default` and `template` object, since a plain string there drops the root template for `/incidents/[id]` and the record pages lost their brand. The V3 E2E asserts every public title names the brand exactly once. The Pen document's sample figures were replaced by live data in code. The Home chart's Deaths and Abductions modes use the same tick geometry as Attacks.

## 2026-10-25 Duplicate Gate Fix, Reconciliation, Queue Cleanup and Next.js Security Upgrade

- Reported: `/incidents/6adcb2f27450e4eabdcbc6ee` and `/incidents/6addee73c4b829d647eb0aa6` were the same 23 October Kaura Namoda attack. Daily Post spelled the LGA "Kauran Namoda", Daily Trust "Kaura Namoda". The one-character difference defeated the title hash, the deterministic location gate (`sameLga` exact string equality) and the semantic gate, whose `compatibleLga` precondition required equal LGAs or an unknown, so DeepSeek was never asked. Replaying the exact prompt on the stored pair returns `same_event` in both orders.
- Second defect: the post-insert `DuplicateCheckerService` did detect such pairs, but `persistDuplicateReviewPairs` stored only eview_required`/
ot_assessed`, so a confident `same_event` was silently discarded.
- Fix: new `src/lib/location-identity.ts`. `placesEquivalent` (compact equality, 80% token agreement, one anchored one-character spelling variant) is used by the deterministic merge gate; `placesPlausiblySame` (adds containment and two-character anchored variants) only decides whether a pair reaches the semantic gate; `lgaCompatible` treats an unstated LGA as compatible. Numeric tokens are significant, so Garki Area 1 and Garki Area 2 never merge. Hong/Song, Kajuru/Kauru and Ibadan South East/West are rejected on purpose.
- `search-led-discovery.ts`: gate B uses `sameLga` plus `sameSpecificLocation`, gate C uses `lgaCompatible`. `deepseek.ts` derives `location.precision` from the validated town/LGA and keeps the approximate-location tag consistent. `incident-review.ts` queues `same_event` and adds `sweepIncidentReviews`, which runs after every scan. The workflow retry budget is now 20 per scan; the function clamps to 20.
- `scripts/merge-incidents.ts` (
pm run merge:incidents`): explicit pair list, dry run by default, one transaction per pair, source union, casualty figure kept with its own evidence quote, hash recompute, tombstone-hash rewrite with the original hash in `_deletedReason`, unique un-<timestamp>` artifacts, overlap rejection, per-record rerun provenance, and review cleanup that resolves settled pairs and retargets held candidates. `scripts/promote-review-lead.ts` inserts a held lead as its own incident with normalized duplicate guards. `scripts/triage-incident-reviews.ts` (
pm run triage:reviews`) is the dry-run/apply wrapper for the sweep.
- Active records 587 to 579. Merged: Kaura Namoda (with the Daily Trust "over 30" abduction figure), Plateau Kwi, Oyo Alaho, Borno Gamboru Ngala, Ebonyi Okporojo, Bauchi kidnap/murder, Benue Apa, Taraba Binnari (police figure 58 with the Leadership quote), Edo Akoko-Edo rescue. Promoted one held lead: the Dakna raid in Hong LGA, a separate event from the Garaha-Mojili outpost attack in the same article. Corrected: Ohimini abduction count 1 to 8 with both rescue reports; Maiyama construction-site record separated from the forward-base assault after source review; Apa settlements and casualty zeros reverted to what the retained Punch article supports.
- Deliberately not merged after source review: the Abia Isuikwuaito pair (two victims at two junctions on consecutive days), the Kebbi Arewa Lakurawa trio (separate settlements carved from one coordinated attack), Katsina Malumfashi (separate Gora and Unguwar Dambu attacks), Plateau Rakum and Marit mining sites, Adamawa Bala-Tela and Tela-Bala/Guyaku, Zamfara Tsafe abduction and rescue.
- Review queue: duplicate rows 69 pending to zero (52 dismissed with per-cluster evidence, the rest resolved by merges or promotion). Extraction queue 1,383 pending to 175 pending plus 43 retained late reports and 46 fetch failures. 1,197 extraction rows dismissed for conclusive content rejections (no Nigerian state, no incident date, not an incident, scope rejection, fact-check); 22 evidence-grounding failures were reopened after review because they are extraction quality, not proof the article is unusable.
- Agent prompts: new project `AGENTS.md` makes the duplicate routine automatic, documents the identity rules, the tools, the queue policy and the verification contract.
- Next.js security upgrade: 16.4.0 to 16.4.3, verified in worktree branch `security/next-16.4.3` (commit `5a3ff01`) and applied to the working tree. 
ext.config.ts` now sets `experimental.agentUpgrade: "security"`. 
pm audit --omit=dev` clean, build passes on 16.4.3.
- Review: Sol reviewed the change and returned REVISE; its findings drove the numeric-token fix, the sweep-scope narrowing, the Apa correction, the merge-cli hardening and the retarget-instead-of-resolve behaviour. Opus verified the rendered merged records at 390/768/1440 and fixed two display defects (`locationLabel` repeating a town equal to its LGA, underscor ed tags). Neither found overflow.
- Verification: 
px tsc --noEmit`, focused ESLint (the one eact-hooks/set-state-in-effect` error on `IncidentDetailClient` is pre-existing) and 
pm run build` pass on 16.4.3. 
px tsx scratch/dup-fix-e2e/dedup-e2e.ts` passes 6/6 through the real `ingestSearchLedAttacks`: spelling-variant merge, Kwi Road not merged, casualty conflict held, same town in a different LGA inserted, Kalim-Lamido held for the semantic gate, numbered subdivisions not merged. Live API returns 404 for every absorbed id and 200 with merged data for every survivor.
- Still open: 175 retryable extraction leads and 46 fetch failures will drain at up to 20 per scan; 43 late reports are retained leads with no automatic path. Two sources of the same BBC story remain on the Binnari record because the URL normalizer does not equate different hosts. One stored source title carries a literal HTML entity from ingestion. `hashFor` is still title-based while `generateAttackHash` is event-based, which needs a hash backfill. Merge plans are computed before their transaction, so a concurrent collector write during a manual merge could be overwritten.


## 2026-10-12 "V2 Editorial" Redesign Implementation

- The user rejected the deployed Public Ledger look ("AI slop", too much on the home page, no geography on the home page), redesigned every page in Pen (edesign.pen`, "V2" frames, desktop and mobile), asked for the monthly chart and key metrics to stay on the home page and for state rankings to live only on the Map page, then asked for implementation and a push. Map state names must show when there is room and fall back to counts only on narrow widths. `DESIGN.md` describes the system.
- Branch edesign-v2-editorial`. Rewritten: `globals.css` (new tokens; states, admin and date-picker rules kept), `layout.tsx` (Noto Sans + Noto Serif; Noto Sans Mono dropped), `page.tsx`, `incidents/page.tsx` (filter bar of selects + dates; sort tabs; `?focus=search`), `incidents/[id]/IncidentDetailClient.tsx`, `map/page.tsx` (measure toggle, ranking buttons with Show all 37, attributed groups), `about/page.tsx`, `Navbar.tsx` (no utility strip or bottom nav), `Footer.tsx`, `RecordCard.tsx` (owPlace`, ecordDay`), `BarChart.tsx` (HTML columns, three measures, data table), `NigeriaMap.tsx` (`labels="auto"`, retuned offsets, units), `StatusBadge.tsx` (neutral marks). New: `ScanStatus.tsx`. `/api/stats` now returns seven latest records.
- Fixed while verifying: the related-records section briefly said "no other records" while loading (now shows a loading line); map labels Anambra/Enugu and Bayelsa/Rivers collided.
- Verification: 
px tsc --noEmit` and 
ext build` (disposable `JWT_SECRET`) pass. Changed files add no new lint errors (the five eact-hooks/set-state-in-effect` errors are the same ones on `main`). 
ode scratch/v2-redesign-e2e/v2-e2e.mjs http://localhost:3107` passed 19/19 against the local production build with live data and the real nonce CSP; screenshots and esults.json` are in `scratch/v2-redesign-e2e/` (uncommitted).
- Not verified: authenticated admin screens, real phones/Safari, and the production deploy (not merged at handoff).

## 2026-10-12 "Public Ledger" Redesign Implementation

- The user asked for a fresh redesign in Pen (edesign.pen`), chose dark-only and the real map outline, then asked to implement it and pick the best fonts. Merged to `main` as `f0d768d` via PR #3 (rebase merge) and deployed to production by Netlify on 12 October 2026. The same E2E suite passed 18/18 against `https://terrortracker.tryraisins.dev` after the deploy. `DESIGN.md` records the system and the font evidence.
- Fonts: Noto Sans (variable width for condensed display) + Noto Sans Mono via 
ext/font`, chosen because a browser glyph test showed they are the only tested pairing that covers Yoruba, Hausa and Igbo letters in every role. The Google Fonts `@import` was removed.
- Rewritten: `src/app/globals.css` (single dark ledger system with legacy variable aliases), `layout.tsx`, `page.tsx` (dashboard), `incidents/page.tsx`, `incidents/[id]/IncidentDetailClient.tsx`, `map/page.tsx`, `about/page.tsx`, `components/Navbar.tsx` (utility strip with real `/api/scan-health` time, masthead search to `/incidents?search=`), `Footer.tsx`, `RecordCard.tsx`, `BarChart.tsx` (measures its container; value labels, peak and partial-month marks). New: `components/NigeriaMap.tsx`, `components/StatusBadge.tsx`.
- Data changes: `/api/stats` `byState` returns every state (was top 10); `getPublicIncident` now returns `dateEvidence` and source `publishedAt` (both already in the public field allowlist). `IncidentRecord` type gained both fields.
- Bugs fixed while verifying: the archive let a slower stale response overwrite newer filtered results (now request-sequenced); react-select ids caused hydration mismatches (now stable `instanceId`); a failed related-records request was shown as "no related records" (now a retryable notice).
- Verification: 
px tsc --noEmit` and 
ext build` (disposable `JWT_SECRET`) pass. Changed files add no new lint errors; the five remaining eact-hooks/set-state-in-effect` errors are the same ones present on `main`. 
ode scratch/ledger-redesign-e2e/ledger-e2e.mjs http://localhost:3107` passed 18/18 against the local production build with live data and the real nonce CSP (fonts, search deep link, filters, pagination, stale-response race, empty and error recovery, detail impact semantics, map selection, overflow at 320–1440px, mobile drawer/bottom nav, no page errors or CSP violations). Screenshots and esults.json` are in `scratch/ledger-redesign-e2e/` (uncommitted).
- Not verified: authenticated admin screens (only the sign-in view was rendered), real phones/Safari, and deployment. `.claude/launch.json` was added for the local dev preview.

## 2026-10-07 Security Hardening Follow-up

- Fixed the casualty-sorted public attacks API to use the same explicit public-field allowlist as normal reads, removing the leaked `_totalAffected` helper.
- Production admin login now returns 503 instead of using per-instance in-memory counters if distributed Upstash limiting is missing, fails, or times out. Development keeps the in-memory fallback.
- Netlify site configuration contains both Upstash REST environment variables. A distributed runtime check was not performed.
- During the read-only environment check, the Netlify CLI printed production secret values into task output. Rotate the production MongoDB, Google service-account, admin, JWT, API, cron, and Upstash credentials; no credentials were changed here.
- Commit `2569d86` is pushed to `main` and deployed to Netlify as ready deploy `6ac65fd35ac7710008e404f6`. A live casualty-sort API request returned without `_totalAffected` or the former internal fields. The distributed login limiter was not actively exercised.
- Remaining actions: coordinate credential rotation and verify production login throttling. Do not include environment values in logs or handoff notes.

## 2026-10-07 Security Assessment (live prod)

- Ran an owner-authorized, app-only security assessment of `terrortracker.tryraisins.dev` (source review + bounded active tests). Full report and evidence: ignored `security-audit/REPORT.md`. No production incident data was modified; all mutation routes are gated.
- Fixes: rate-limit key was attacker-controlled via `X-Forwarded-For` (`getClientIP` now prefers Netlify's `x-nf-client-connection-ip`, then `x-real-ip`, then last XFF hop); public attack APIs now project only `PUBLIC_ATTACK_FIELDS`; malformed login JSON returns 400; rate-limit buckets are namespaced; cron/API secrets use `crypto.timingSafeEqual`.
- CSP now uses a fresh per-request script nonce forwarded through `src/proxy.ts`; root layout renders dynamically so Next applies nonces to generated scripts. Turnstile receives the same nonce via `LoginModal`. Duplicate API CSP removed; `X-Powered-By` disabled. Inline styles remain allowed because the UI uses style attributes.
- Dependencies: exact-pinned 
ext` and `eslint-config-next` 16.4.0; removed unused `@google-cloud/vertexai`, which brought in vulnerable `gaxios` 6 / `uuid` 9. 
pm audit --omit=dev` is clean. Full audit still reports five high advisories in dev-only ESLint's `fast-glob`/`micromatch`/`braces` chain; no patched braces release is available in the configured registry, and npm proposes an incompatible Next ESLint config 14 downgrade.
- Other changes: `src/app/api/admin/reviews/route.ts` casts the validated review status to `IncidentReviewStatus` for updated mongoose types. `.gitignore` excludes local `security-audit/REPORT.md` and artifacts.
- Verification: 
px tsc --noEmit`, focused ESLint on changed files, 
pm run build` (Next 16.4.0), and 
pm audit --omit=dev` pass. Local production headers/HTML confirm nonce agreement on CSP, root metadata, and all framework scripts; `script-src` has no `unsafe-inline`, `X-Powered-By` is absent, and API response projections omit internal fields. Local tests also reconfirmed malformed login -> 400 and XFF-rotation-resistant throttling.
- Open: authenticated admin actions were not exercised (only one admin account, not shared). `/api/version` continues exposing an opaque build ID because `UpdateNotifier` needs a per-deployment token to detect updates. Full audit's dev-only ESLint transitive advisory remains as noted above.
- Confirmed NOT vulnerable: admin routes require session + admin role (forged/`alg:none` JWT -> 401); `/api/cleanup` and `/api/cron/*` require `x-cron-secret`; Turnstile fails closed; CORS is a fixed allowlist; no operator injection; no tracked secrets.

## 2026-10-07 Admin Login CAPTCHA

- Added Cloudflare Turnstile to `/admin` sign-in. The browser sends a single-use token; `/api/auth/login` validates it with Siteverify before database access and requires the `admin_login` action plus a hostname in `TURNSTILE_ALLOWED_HOSTNAMES`.
- Production Cloudflare Turnstile widget is configured for `terrortracker.tryraisins.dev` in managed mode. Netlify production has `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`, and `TURNSTILE_ALLOWED_HOSTNAMES` set; the values match the widget and expected hostname. The Netlify plan currently exposes all scopes and did not apply the optional Secrets Controller write-only flag, so the secret is stored as a Netlify environment variable but is not flagged as write-only.
- Production initially blocked Turnstile because `src/proxy.ts` omitted `challenges.cloudflare.com` from CSP. Commit `10c01740b60a6bb948c5cc771ebec1b1b187e84e` adds the host to `script-src`, `connect-src`, and `frame-src`; deploy `6ac61d7c298f6b176a220e55` is ready. The cache-busted live `/admin` response returns HTTP 200 and contains all three CSP allowances. Interactive challenge completion and login API rejection were not exercised in a browser. Locally, 
px tsc --noEmit`, focused ESLint, `git diff --check`, and 
pm run build` passed before the CSP-only change; Netlify successfully built and published the CSP fix.

## 2026-10-06 Incident Coverage and Review Recovery

- Objective: implement all six coverage recommendations and push to GitHub. Feature commit `52bca04` is pushed on `main` and deployed by Netlify (`6ac4c91d9423130008fc70e5`).
- Every existing daily slot now runs; GitHub concurrency serializes overlapping attempts. Daily discovery covers seven days, and Sunday 19:30 UTC adds fourteen-day catch-up. Manual dispatch supports 336 hours. Search queries use publication freshness without a current-month keyword that could exclude September events.
- `IncidentReview` stores source evidence, candidates, reason, publication metadata and disposition in `incident_reviews`. Repeated sightings preserve decisions and retry budgets. Each scan retries up to five due extraction/fetch leads, at most three attempts per source/kind. Resolved sources must pass the same extraction, admission and duplicate gates; normal scans can also settle captured leads. Duplicate/casualty conflicts and older late reports remain for admin review.
- `ScanRun` stores each attempt and state coverage in `scan_runs`. Recovery uses provider receipts, including successful empty searches; errors are attributed to their own state. Registered publisher RSS supplements search through identical article gates. Failed feeds are coverage metadata, while failed article fetches enter review.
- Date ranges, supporting date excerpts and publication-anchored relative dates now pass through extraction, DeepSeek and storage. Invalid/future dates fail closed. Legacy exact-day hashes stay compatible; overlapping/adjacent date intervals are conservatively held for duplicate review. Dashboard recent-record projection includes range metadata; calendar-day labels avoid adding a day when UTC range-end instants are formatted in Lagos.
- Public `/api/scan-health` and dashboard show last completed coverage, latest attempt, failed states, errors and pending reviews. No completed scan within 18 hours, an incomplete/failed attempt, or a run stuck over 90 minutes produces a warning. Article evidence stays private. Protected admin review actions support dismissal, reopening and bounded retry requests.
- Verification: TypeScript, focused ESLint and production build pass (local build needs disposable `JWT_SECRET`). Isolated MongoDB E2E proves 37-state collection, provider recovery, RSS, range storage, late/ambiguous review, idempotency, preserved dispositions, bounded retries and failed-scan persistence. HTTP checks prove admin authorization/dispositions and sanitized stale/failed health. Rerunnable scripts, logs and reports are uncommitted under `scratch/incident-coverage-e2e/`; database is `codex_incident_coverage_20261006`, never the production fixture target.
- Rendered verification passed in headless Edge at 1440px and 390px: health warnings, correct Borno range, real admin sign-in, queue dismissal/reopening, no page errors and no horizontal overflow. Production health and admin sign-in also render; public review API returns 401. Browser-use IAB and native browser connector were unavailable.
- First live run `37448069790` completed: 37/37 provider receipts, 171 URLs fetched, zero search/fetch/DeepSeek/ingest failures, 88 persistent leads, 7 source merges. Leadership RSS timed out, so coverage is `DEGRADED`. Three inserted reports overlapped existing events. Reconciliation archived both confirmed Osogbo duplicates and the ambiguous Kaduna aggregate, retained Osogbo sources on the original record, and preserved casualty counts. Evidence is uncommitted in `scratch/incident-coverage-e2e/live/`.
- Live verification exposed concatenated town aliases, city-level location labels and multi-community descriptions bypassing the pre-insert guard. The correction normalizes compound aliases and uses bounded DeepSeek event comparison on nearby same-LGA records before insertion; disabled/unavailable/ambiguous assessments are held. Stored-pair eview_required`/unassessed findings enter permanent review; confirmed same-event pairs do not create duplicate queue rows. Second live run `37449580238` completed successfully: 37/37 jurisdictions, 175/175 URLs fetched, zero search/fetch/feed/DeepSeek/ingest errors, zero inserts, 11 source merges, and 16 new review rows; coverage is `REVIEW_REQUIRED`. The public health API reports it as current. Full scanner E2E, five additional duplicate E2E scenarios, focused lint, TypeScript and build pass.
- Preserve unrelated `design/`, `output/`, existing `scratch/` work and existing untracked maintenance scripts. Do not commit E2E artifacts or credentials.

## 2026-10-06 Manual Incident Catch-up

- Interpreted the invalid requested start date "September 31" as October 1. A 132-hour report-only search scanned all 37 state/jurisdiction queries from 2026-09-30 20:10 UTC through 2026-10-06 08:10 UTC. It discovered 185 URLs, fetched 180, admitted 14 candidates, and left 82 review leads. Search coverage was incomplete: both DuckDuckGo and Brave failed for Borno and Oyo; five article fetches and three DeepSeek calls also failed.
- Live API initially contained only two active event records from October 1: Kaduna and Imo. Added four source-reviewed incidents in MongoDB: Marte, Borno (at least 15 killed; event date range Sep 30-Oct 1); Bukuru/Jos South, Plateau (one reported killed and seven injured, marked developing); Owo-Eba, Osogbo (two killed Oct 2); and Arowomole, Osogbo (one injured Oct 4). Borno's three missing residents were not counted as abducted. IDs and before/after evidence are in ignored `audit-2026/daily/manual-incident-audit-20261006/`.
- Production API now returns eight active records dated/ranged Sep 30 onward. `assertActiveAttackDateIntegrity` passed after the inserts. No code or workflow deployment was changed. Existing conflicting Imo abduction counts remain unmodified.
- Root causes: the schedule guard in `.github/workflows/daily-scan.yml` skips every later same-Lagos-day scan after any successful or in-progress scan, including after an early manual dispatch. The Oct 5 dispatch ran at 02:01 Lagos, before reports on later events were published, then suppressed later scheduled runs. The normal scan also uses a rolling 96-hour event-date window, only 10 results per state query, and a 40-call Brave cap; review leads are report-only, not queued for adjudication. The DeepSeek prompt requires one ISO event date and the discovery/ingest path writes `exact_day`, despite MongoDB supporting date ranges. These limits explain late-report and multi-day-event misses. The Oct 6 manual scan itself remained incomplete because Borno and Oyo search providers failed.
- Known unresolved review: the Imo NYSC abduction is already recorded, but reports conflict on the number abducted (roughly 18-20); no count was changed. Several same-event Kaduna and Plateau candidate variants were deduplicated or excluded. Review the resulting app display for the Borno date range and the developing Plateau death count.

Last updated: 2026-10-06

## 2026-10-05 Production UI Improvement Implementation

- User selected Newsreader headings + Geist interface text and asked for incremental improvements to the existing production design, followed by a GitHub push. Preserve the dark/red shell, routes, data behavior and unrelated local work.
- First slice updates the font imports/tokens, changes incident wording to “Last updated,” fits text-valued impact metrics, marks the in-progress month in both chart views and tooltips, adds keyboard/touch-readable chart controls plus a disclosure table, and raises small-link contrast using the existing light-red token.
- Files in this implementation: `src/app/globals.css`, `src/app/page.tsx`, `src/app/api/stats/route.ts`, `src/app/incidents/[id]/IncidentDetailClient.tsx`, `src/components/BarChart.tsx`. `DESIGN.md` records the chosen font system. Do not stage the existing `design/`, `output/`, `scratch/`, or incident maintenance scripts without a direct reason.
- Branch: `codex/newsreader-geist-ui-improvements`; implementation commit `d5eac6a` is pushed to `origin` (no PR opened). 
px tsc --noEmit`, targeted ESLint on the changed TS/TSX files and 
pm run build` pass; the build requires a disposable local `JWT_SECRET` because the module validates it at import time. Repo-wide 
pm run lint` remains blocked by 495 existing errors and 80 warnings, mostly in archived audit scripts and unrelated source files. Local production preview showed live dashboard/detail data, both chart modes, October partial labeling, table values matching the API, and “Last updated” wording. Mobile viewport was not verified.
- Next slice: filter URL persistence and map state-index search. Reporting-quality aggregation still needs metric definitions plus backend scope validation.

Branch: main

## 2026-10-05 Homepage Font Comparison

- Added `design/font-study.html`, a standalone homepage specimen with four switchable pairs: current Source Serif 4 + Source Sans 3, Newsreader + Inter, IBM Plex Serif + IBM Plex Sans, and Newsreader + Geist. The production dark/red theme and 4 October snapshot content remain fixed so the type can be compared fairly.
- Local preview: `http://127.0.0.1:4173/font-study.html` (Python server PID 9384). The initial combined Google Fonts URL returned HTTP 400 because the two optical-size axes were malformed, leaving every option on fallback fonts. Replaced it with a valid weights-only family request; the stylesheet now returns HTTP 200, all four controls switch state and URL, and Newsreader, IBM Plex and Geist render visibly differently in desktop screenshots. Mobile CSS breakpoints are present but no mobile viewport was verified.
- No app source, API, data, commit, or deployment changed. The page is a review artifact; implementation should wait for the user's font choice.

## 2026-10-05 Focused Pen Improvement Proposal

- User asked to clear the previous Pen design and show incremental improvements to production. Deleted all 18 earlier canvas roots and created five focused views plus proposal notes and a desktop viewport crop in the same user-opened native file. `design/README.md` lists current IDs and the native path; `output/production-proposal/export.pdf` is the current review export. Older exports are superseded.
- Preserved production dark/red styling, serif headings, gradients, masthead, route responsibilities and record evidence/history. Proposed partial-month labeling, word-value fit, compact filters, state-index search/numeric legend and an expandable reporting-context panel. Rendered chart/filter and 390/320px impact views were inspected. Counts use the 4 October 510-record snapshot, including source-checked unconfirmed totals and state counts.
- Static Pen states do not prove runtime interactions. No app source, database, commit or deployment changes occurred. Next: user reviews this focused proposal, then implement selected improvements with real queries and end-to-end validation.

## 2026-10-04 Production Design Improvement Direction

- User rejected the replacement Pen direction and explicitly prefers the existing production theme. Preserve the dark/red palette, serif headings, floating navigation, card style, current charts and map structure. `DESIGN.md` now records this direction; `design/production-improvements.md` contains the ranked audit and acceptance criteria.
- Fresh production inspection confirmed phone Unknown overflow (161px text in a 132px value region at 390px), expanded filters pushing the result count to y=743px, absent partial-month labeling and small red links at 4.12:1 contrast. Existing lighter-red token gives 6.56:1 on the panel background. Other source findings include incomplete filter URL/chip state and Last reviewed derived from updatedAt.
- Next: implement a focused first slice of impact-card fit, truthful timestamp wording, link contrast and partial-month context using existing tokens/components. Then improve filter persistence and state-index search; quality analytics require scoped server aggregation. This audit changed no app code or production behavior.

## 2026-10-04 Pen Redesign Proposal (Superseded)

- Previously created 16 design views plus a system board in the user-opened native file. Those roots were deleted on 5 October at the user's request; the same file now contains the focused improvement proposal above. The connector cannot export a native `.pen` copy into the repository.
- `DESIGN.md`, `design/README.md` and `design/metrics.md` record direction, view IDs, evidence and metric definitions. Local review PDF/PNGs are in `output/pen-redesign/`; snapshots and a rerunnable summary are in `output/design-audit-20261004/`. Outputs are not Git-ignored and should stay out of commits.
- Addressed phone Unknown-value overflow, state lookup, filter sheets, partial months, source context and missing reporting metadata. Preserved fonts, route responsibilities, sharing/history and safe admin contracts. Final values use the refreshed 510-record snapshot after the separate reconciliation below.
- Rendered desktop/phone views, a 320px detail and a 1024px tablet overview were inspected. Selected text/control palette pairs meet 4.5:1 / 3:1 respectively. Static canvases do not verify runtime behavior or accessibility. This task changed no app source, deployment or database; concurrent ingestion edits were preserved.
- This direction was rejected by the user. Retain its artifacts as historical proposals; do not integrate its palette or layouts. Metric definitions can inform the incremental production improvements above. Never ship a design snapshot as live data.

## 2026-10-04 Duplicate Detection Follow-up

- The Oct 4 scheduled run `37202785728` inserted a third report of the Oct 1 Babban Saura attack (one killed, nine abducted). The Oct 2 discovery run `36993326707` inserted two reports in one scan because it compared town names by exact equality. A later Oct 2-published report was assigned Oct 2 as the event date, so it evaded the prior same-day match. The separate same-day event guard skipped the later Oct 4 slots as intended.
- `src/lib/search-led-discovery.ts` now compares normalized town aliases in the one-day event window even when source URLs differ. Same-day casualty conflicts and adjacent-date matches are held for review; only compatible same-day events merge their sources.
- `src/lib/deepseek.ts` and `src/lib/duplicate-checker.ts` now add conservative pairwise DeepSeek assessments to heuristic duplicate candidates. Source URLs are excluded from event identity. The workflow enables the check for up to 30 high-scoring pairs per run; results are review metadata only and do not auto-merge records. The scheduled scan report and duplicate-check API expose the classification and rationale.
- Source review confirms the underlying event occurred around 1 a.m. Thursday, Oct 1, in Babban Saura (PW), Chikun LGA; Punch reports nine people initially abducted and one rescued. Production reconciliation kept `6abf827e18c8ba906b5cf96f`, merged all five independent source links, and soft-deleted `6abf827e18c8ba906b5cf974` and `6ac24a028c4d3dddfe82882f` in a guarded MongoDB transaction. Snapshots, plan, and post-write validation are in ignored `audit-2026/duplicate-reconciliation-babban-saura-20261004/`.
- Live API confirms the canonical Oct 1 record is active with five sources and both duplicate IDs return 404. The collection moved from 512 to 510 active records (520 total). 
px tsc --noEmit`, focused ESLint, and `git diff --check` passed. No scan/E2E run was performed. The workflow changes remain local and must be pushed to `main` before future scheduled runs use them.

## 2026-10-03 Scan Coverage Tolerance + DEGRADED Status

- A manual dispatch of the daily scan (run 37112448844) failed on `Fatal: Scan coverage is incomplete` even though the scan worked: 37/37 state queries, 140 URLs discovered, 139 fetched, 1 inserted, 4 merged. The only problem was a single publisher fetch failure (`thernicheng.com` timeout, then HTTP 422). The old gate in `scripts/search-led-scan.ts` treated any `fetchFailures.length > 0` as `INCOMPLETE` and exited 1.
- `scripts/search-led-scan.ts` now computes a fetch-failure budget = `max(SCAN_MAX_FETCH_FAILURES (default 3), ceil(urlsFetched * SCAN_FETCH_FAILURE_TOLERANCE_RATIO (default 0.1)))`. `INCOMPLETE` (exit 1) now triggers only on `queriesRun !== states.length`, `searchFailures.length > 0`, `ingest.errors > 0`, or `fetchFailures.length > budget`.
- Status precedence is now `INCOMPLETE` > `DEGRADED` > `REVIEW_REQUIRED` > `COMPLETE`. `DEGRADED` means fetch failures were non-zero but within budget; it exits 0 and is visible in the step summary. `fetchFailureBudget` is included in the JSON report, and the summary shows `N unresolved fetch errors (budget B)`.
- `.github/workflows/daily-scan.yml` sets `SCAN_MAX_FETCH_FAILURES: "3"` and `SCAN_FETCH_FAILURE_TOLERANCE_RATIO: "0.1"` explicitly. Retry crons (09:30/12:30/15:30 UTC) still fire only after an `INCOMPLETE` (failed) run, so genuine provider outages still retry while isolated flaky fetches no longer do.
- Verified in commit `d88f39a`: 
px tsc --noEmit`, 
px eslint scripts/search-led-scan.ts`, and `git diff --check` pass, and E2E dispatch of [run 37114326068](https://github.com/tryraisins/Terror_Tracker/actions/runs/37114326068) succeeded. That run reproduced the original trigger (1 unresolved fetch failure) and reported `coverageStatus: DEGRADED` with `fetchFailureBudget: 13` (from 129 fetched, `max(3, ceil(129 × 0.1))`), 0 search failures, 0 ingest errors. No test framework exists in the repo.

## 2026-10-01 Paced Incident Scan

- Manually dispatched [GitHub Actions run 36858745867](https://github.com/tryraisins/Terror_Tracker/actions/runs/36858745867) on `baa2a28578d64e080290c21db0d0da21fa441518`. It succeeded in 5m02s: all 37 state queries ran, 128 URLs were discovered and fetched, with no search/fetch failures or Brave 429. The configured 5-second minimum delay was active. The prior run failed because Brave reported its monthly quota exhausted; this run shows the key can search again, but does not establish whether the quota reset or pacing alone resolved it.
- `.github/workflows/daily-scan.yml` now schedules attempts at 06:30, 09:30, 12:30, and 15:30 UTC (07:30, 10:30, 13:30, and 16:30 Lagos). The guard skips later attempts only when a same-Lagos-day scan is still running or succeeded; it allows another attempt after a failed run. This adds retry opportunities but cannot force GitHub to deliver a scheduled event.
- Scan coverage is `REVIEW_REQUIRED`: 1 candidate was DeepSeek-confirmed and inserted, 127 rejected, 8 held for review, and 22 duplicate candidate pairs were reported. Public API verification confirms inserted record `6abe4c1c7912b75cb9145e78`, “Sea robbers kidnap two victims in Ibeno, Akwa Ibom” (2 abducted, unconfirmed).
- Review the inserted Ibeno event date before treating it as source-certified: the underlying NAN report ([People’s Gazette](https://gazettengr.com/navy-rescues-two-kidnap-victims-recovers-stolen-engines-in-akwa-ibom/)) establishes the Ibeno kidnapping and rescue but describes the commander’s disclosure as Wednesday without explicitly dating when the abduction occurred. The ingest assigned 30 Sep from the article date. Keep this as a date-evidence review item.

## 2026-09-30 Duplicate Event Reconciliation

- Live API snapshot covered all 509 active records (514 total documents). A candidate-led scan found 26 near-date/source/location pairs and 40 repeated-source groups. Three duplicate pairs were confirmed and merged: Bungudu (kept event date 27 Sep), Yargada (kept 27 Sep), and Efeyi, Benue (kept the police-confirmed 13 deaths and joined the Daily Post source). The three duplicate documents were soft-deleted; public active count is now 506. Other repeated article URLs describe distinct locations/events and remain separate.
- `src/lib/search-led-discovery.ts` now canonicalizes source URLs and matches a shared article only when state, LGA, specific town, event date, and non-conflicting casualty values also agree. If the candidate date differs by one day or casualties conflict, it is held without inserting and reported for review. Article publication time is stored on the source entry separately from the incident event date. URL equality alone never merges multi-event articles. The scan workflow reports held conflicts as `REVIEW_REQUIRED`.
- Guarded transaction, full MongoDB before/after snapshots, candidate list, and validation are in ignored `audit-2026/duplicate-event-reconciliation-20260930/`. Validation passed: 514 documents retained, active count 509 → 506, all three primary rows active, all three duplicate rows soft-deleted. The public API confirmed all six IDs after apply.
- Candidate-led audit only: the 26 close pairs were reviewed for same-event evidence; the repeated-source scan is recorded in `shared-source-url-groups.json`. The Trustur Katsina rescue/operation record `6ab7af42449947594916c5c9` remains a separate scope review lead, not auto-merged as a duplicate. Search coverage is not a proof that every possible duplicate exists in the candidate set.
- Focused ESLint, 
px tsc --noEmit`, and `git diff --check` passed. The ingestion fix is local to this checkout and must be deployed before scheduled ingestion uses it. No unrelated untracked scripts or `scratch/` files were changed.

## Incident Sharing and Social Previews

- Incident detail routes now load the public record on the server and render it into the initial HTML, while retaining the existing client detail interactions.
- Each incident has record-specific title, description, canonical URL, Open Graph article metadata, and Twitter/X large-card metadata. `/incidents/[id]/opengraph-image` renders a 1200×630 branded, non-graphic card using the incident title, date, location, and record status.
- Detail pages offer native device sharing, WhatsApp, Facebook, and Twitter actions. Desktop places sharing beside the location/date details at the far right edge of the content area; narrow screens stack it above the impact cards with visible spacing.
- Incident record history now appears before related records on the detail page.
- Verification: 
px tsc --noEmit`, targeted ESLint, `git diff --check`, and 
pm run build` pass. A local production-server check returned a 200 incident page with server-rendered title metadata and a 200 `image/png` OG card (68 KB). Live social crawler previews still require a deployed public URL.

## Current Objective

Maintain source-grounded, event-level incident records. DeepSeek cleanup now classifies one-event,
multi-event, roundup/review, and non-incident articles; each accepted event needs text evidence for
its date, location, and every non-null casualty field. Ambiguous multi-event articles fail closed to
review. Search-led ingestion must allow several event records to share one article URL and must not
use URL identity alone as a duplicate key.

### 2026-09-29 Full Displayed-Incident Reconciliation

- Scanned the 496 active reports returned by the public API against the live
  `TerrorTracker.attacks` collection. Source-supported group splits and corrections resulted
  in 10 new active incident records, 12 existing-record updates, and 3 duplicate soft-deletes.
- The collection now has 503 active and 5 soft-deleted documents. MongoDB and the public API
  agree; all 10 inserted IDs are visible. Final active records have no duplicate event hashes
  or exact date/state/LGA/town/group identity collisions.
- The user-flagged 21 August Borgu record remains one explicitly aggregated incident because
  available sources do not allocate casualties by village. It is not a duplicate of the
  September Mukura report.
- Audit evidence and snapshots are in ignored `audit-2026/all-displayed-audit-20260929/`.
  This was a conservative candidate-led reconciliation, not source-by-source recertification of
  all 496 records; ambiguous leads remain for later review. No application code was changed; this pass reconciled the live database.

### 2026-09-29 Multi-Event Article Handling

- `src/lib/deepseek.ts` returns event arrays with verbatim date, location, and casualty evidence.
  Invalid classifications, missing evidence, or inseparable roundups are rejected or marked for
  review. Open-ended casualty minima retain ange` metadata.
- `src/lib/search-led-discovery.ts` holds articles with explicit multiple-event cues when DeepSeek
  is disabled, fails, or returns only one event. Event hashes include town; fallback duplicate
  matching requires the same date, state, LGA, and specific town.
- `src/lib/incident-view.ts` displays open-ended minima as `N+`.
- Flagged BBC article `c60m3e7jmwxgo` combines multiple reported events. Updated Mukura record
  `6abaa8bf423e2782fbbfe9c2` to its police-reported 27 Sep event and `21+` abducted; location is
  Mukura village, Mariga LGA. Inserted separate Rimi, Mariga record `6abbaaef4590034d6d1fbc70`
  (26 Sep, `47+` abducted), with BBC and AFP/Yahoo sources. Updated existing Yargada record
  `6aba77f92dacfb136e737dcc` in place to 27 Sep, exact named community, `40+` abducted, and BBC/AFP
  evidence; no duplicate was inserted. All three retain `developing` status and casualty source
  text. The unsupported aggregate `60` was removed from the Mukura record.
- Guarded DB artifact is in ignored `audit-2026/multi-event-sep28/`. A full Attack snapshot and
  fingerprint guarded a transaction; two records were updated, one inserted, active count +1, and
  post-write validation passed. The public API confirmed all three records after apply.
- Verification: 
px tsc --noEmit`, targeted ESLint, and production 
pm run build` passed. The
  build required a process-only temporary `JWT_SECRET`. No tests were added or run. Existing
  untracked scripts and `scratch/` are user work; do not stage them.

## Recent Dashboard Update (2026-09-23)

- The home dashboard monthly chart now switches between incident counts and victim impact (deaths/abductions), so unlike measures are not compared on a shared axis.
- State ranking includes each displayed state's percentage of all recorded incidents for the reporting year. The percentage denominator is the full yearly total, not only the top-state slice.
- Validation: changed dashboard files pass targeted ESLint and 
px tsc --noEmit`. Repository-wide 
pm run lint` still reports existing errors across audit/scripts and unrelated components.

## Current Objective

Maintain Nigeria incident discovery and victim-only casualty extraction. Recent parser
hardening addresses clear human impact (e.g. "abduct village head", "abandon three
kidnap victims", "kill security commander, abduct two") previously stored as zero or
unknown casualties. GitHub Actions is the daily scheduler. The 2026-09-24 catch-up run
scanned all 37 states and fetched 144/144 URLs with no fetch/search/provider errors;
four candidates matched existing records, and a separate Kebbi communal-violence lead
was manually verified and inserted. The run remains `REVIEW_REQUIRED` because other
leads still need date/scope review. GitHub had no Sep24 scheduled run by 08:28 UTC, so
the workflow now has a guarded retry schedule at 09:30 UTC. Source/date dedup matching
now requires a same-town match instead of merging unrelated incidents solely because
state, LGA, and date match. Relative weekday dates resolve against the publication date
in Lagos time. Search coverage remains non-exhaustive.

### 2026-09-30 Scheduled Scan Follow-up

- The scheduled run did trigger on `main`, but GitHub created it at 12:50 UTC, 6h20
  after the 06:30 UTC primary slot. Its backup-guard step was skipped, consistent with
  the primary schedule; no 09:30 retry run was present in history at 13:04 UTC. It
  failed the coverage gate after 116/118 URLs fetched; two publishers timed out.
  Discovery covered all 37 states, and ingest merged one source into an existing record.
  Run: `36717434884`.
- A manual `workflow_dispatch` run (`36718308516`) was triggered at 12:58 UTC. It fetched
  all 78 discovered URLs, but Brave Search returned HTTP 429 for 13 state queries, so
  coverage was incomplete and the job failed. Ingest merged one source and inserted no
  incident. This confirms a provider rate limit, not a missing MongoDB secret.
- GitHub documents that scheduled events can be delayed or dropped during Actions load.
  Five extra daily scan slots are not a safe fix: they could increase Brave 429s and
  repeat full scans. Current evidence supports a late schedule event plus independent
  publisher/provider coverage failures; it does not establish a specific GitHub outage.
- Rate-limit mitigation now serializes Brave requests with a 5-second minimum interval,
  retries one transient 429 using Brave reset headers, and stops further requests when
  Brave reports exhausted monthly quota. The workflow also serializes scheduled/manual
  runs. TypeScript, targeted ESLint, and `git diff --check` passed; run `36720293883`
  below verifies the provider response with the new pacing in the production workflow.
- Manual run `36720293883` on `c986a6e` confirmed a monthly Brave quota block, not a
  burst-rate issue: the scan attempted all 37 states, discovered/fetched 0 URLs, and
  inserted/merged 0 records. The monthly quota circuit breaker prevented repeated 429s.
  The scheduled retry guard is now being tightened to allow only one scheduled scan per
  Lagos day, with the second slot reserved for days when no scan ran at all.
- Public API reconciliation and manual source search found no confidently new record to
  admit: Niger's 47 abducted in Rimi and Zamfara's 40 in Yargada are already recorded;
  the five abducted in Tsafe has conflicting reported dates and an existing nearby record.
  A 27 Sep Iburu Hanya (Kajuru, Kaduna) report describes one killed and one injured, but
  only one accessible report was found and the abducted count is unclear, so it remains a
  review lead. No writes were made during this manual review.
- The 09:30 UTC schedule guard now checks for any completed or running scan on the same
  Lagos date, so the backup only runs when no scan has run. This avoids repeating a scan
  after a quota/provider failure while retaining recovery when GitHub misses the primary.

### Recent Scan Reconciliation (2026-09-24)

- Manual workflow run `35975794590` (`68f5d80`): 37/37 states, 144/144 URLs fetched,
  2 retry attempts, 0 fetch failures, 0 search failures, 4 candidates, 36 review leads,
  0 insertions and 4 duplicate merges. All four candidates were already represented:
  three Plateau reports and the Taraba TSU raid. New Plateau source links were merged
  into existing records. The report artifact is `incident-scan-report-35975794590`.
- A review lead for the Lafagu/Buya communal violence in Bagudo, Kebbi was dated to
  Sunday 2026-09-20 by cross-source reporting. Added as attack
  `6ab4e3b695ce6e7d427d445b`, with a reported minimum of 15 killed, approximate
  multi-community location, developing status, and Channels, Daily Post, and Punch
  sources. Verified against live MongoDB after insertion.
- GitHub scheduled runs Sep20-23 failed immediately because `MONGODB_URI` was absent;
  the secret was added after the Sep23 scheduled attempt. No Sep24 schedule event was
  present by 08:28 UTC. The workflow now schedules a second daily run at 09:30 UTC
  (10:30 Lagos) and skips its scan if a same-Lagos-day run has already succeeded or is
  still running. Workflow requires `actions: read` for this guard.
- `ingestSearchLedAttacks` no longer treats state + LGA + date alone as a duplicate;
  its location/date fallback now also requires the same specific town. Exact candidate
  hash and source URL matching remain in place.

### Recent Milestone (2026-09-21)
- **Heuristic Casualty Extraction Hardening (`src/lib/free-news.ts`, `src/lib/search-led-discovery.ts`)**:
  - Expanded `extractCasualtyAssessment` to parse appositive/parenthetical clauses (e.g. `at least nine people, including a pastor, have been killed`).
  - Added support for auxiliary verb constructs (`have been`, `has been`, `were`, `was`, `are`, `is`) and adverbs (eportedly`, `allegedly`, `confirmed`, `feared`).
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
- **Quarantine**: 20 esolved_to_attack`, 3 `duplicate_of_existing_attack`,
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
- **Quarantine**: 35 esolved_to_attack`, 14 `duplicate_of_existing_attack`,
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
- **Quarantine**: 4 esolved_to_attack`, 18 `duplicate_of_existing_attack`,
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
- **Quarantine**: 13 esolved_to_attack`, 18 `duplicate_of_existing_attack`,
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
- **Quarantine**: 7 esolved_to_attack`, 18 `duplicate_of_existing_attack`,
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
- **Quarantine**: 6 esolved_to_attack`, 6 `duplicate_of_existing_attack`,
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
182 esolved_to_attack`, 116 `duplicate_of_existing_attack`, 309 `excluded_out_of_scope`,
and **174 still `open`** across all states (mostly batches 1–4 discovery leftovers plus a few
deliberately-left-open ambiguous events from batches 6–10).

## Important Constraints

- Always equire('dotenv').config({ path: '.env.local' })` (NOT `.env`).
- Active-query uses `{ _deleted: { $ne: true } }`; state field is `location.state`.
- Never count terrorist/insurgent/bandit deaths as victim casualties
  (profile: civilians, soldiers, police, vigilantes).
- Single trustworthy direct source => `unconfirmed`; two independent => `confirmed`;
  credible conflict => `developing`. Rescue/foil/raid/arrest ops are NOT attacks.
- SHA-256 dedup before every insert (`title|date|state|lga`).
- Never run 
ode -e "..."` with `$` operators in PowerShell; write script files.
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
- 
etlify/functions/scheduled-discovery-background.mts` — retained background function, no longer
  scheduled; scheduled discovery runs through GitHub Actions.
- `scripts/search-led-scan.ts` — manual / CI entry point.
- `.github/workflows/daily-scan.yml` — primary daily scheduler (06:30 UTC), plus manual dispatch;
  runs the scan with GitHub Actions secrets and a 60-minute timeout.
- 
etlify/functions/scheduled-update-background.mts` is retained but is no longer scheduled.

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
- Netlify schedule declarations were removed from 
etlify.toml`; production deploy
  `6ab3c6c6a415930008021f2e` for commit `2843a73` is ready and reports no function schedules.
  GitHub scheduled events can be delayed or dropped, so monitor run history.

### Env required for the cron
- GitHub Actions secrets: `MONGODB_URI`, `BRAVE_SEARCH_API_KEY`, `DEEPSEEK_API_KEY`.
- Netlify no longer owns a schedule for these jobs.
- Gemini/VertAII code is left in place but is no longer in the scheduled path.

### Do not repeat
- Do not rely on DuckDuckGo `df=` or Bing HTML for recency — both are ineffective/unusable here.
- Do not anchor relative date language to the run time; always use the article publish date.

- 13:56 UTC: independently checked five additional candidate pairs and kept distinct events separate; details and source links in `scratch/duplicate-review-20261108-all-pairs/decisions-continuation.md`. Corrected previously merged Okporojo survivor `6a9389a4d17b55c4bc6dbf0f` through dry-run/apply artifact `correction-okporojo/run-2026-11-08T13-56-09-898Z/`: conflicting killed reports retained as 4+, injured 1+, abducted number and displaced unknown; active count 963 and date integrity PASS, API/page 200, visual rendering unverified. Rescue records `6ada202a25cac6b9cbd4ef5b` and `6ada202a25cac6b9cbd4ef5d` use rescue dates, not verified abduction dates, and need comparison to original attacks. Every survivor remains pending in the individual coverage ledger until comprehensive comparison is substantiated.
- 13:58 UTC: source-confirmed Owo-Eba and Ita-Olokan, Osogbo are distinct; corrected their casualty figures using `correction-osogbo/run-2026-11-08T13-57-59-331Z/`. Active count 963, date integrity PASS, both APIs/pages 200; visual rendering and broader individual reviews remain pending. Source links and verification are in the decision ledger.
- 13:59 UTC: corrected Olayinka monarch incident `69e4066bc4c5bd7dcc3860ce` which combined distinct earlier village raids and reported 10 abducted. Police said one and local residents said three palace abductees; it now records 1+ with disagreement. `correction-olayinka/run-2026-11-08T13-59-34-215Z/`, 963 active, date integrity PASS, API/page 200; full evidence and remaining comparisons are in the ledger.
- 14:01 UTC: corrected three separate Kwara raid records to retain conflicting village-specific abduction counts and the reported Idera rescue, using `correction-kwara-raids/run-2026-11-08T14-00-59-029Z/`; 963 active, date integrity PASS, three APIs/pages 200. Ledger contains source details; full review remains pending.
- 14:04 UTC batch 35 merged composite Nganzai headquarters duplicate `69d3f5e999168c9769cabd9c` into older `69d24d3dbcb8f30d36bcd1a2`, retained four officer deaths and three sources, and preserved the separate Damasak hunter incident. Unsupported 25-death composite figure was not carried forward. `batch-35/run-2026-11-08T14-04-03-305Z/`: 962 active, date integrity PASS, survivor and Damasak APIs/pages 200, absorbed API/page 404. Individual survivor review and visual rendering remain pending; ledger details sources and evidence.
- 14:06 UTC: corrected the date of the separate Ayuba Pam road ambush, documented differing Mbwelle casualty reports with the missing 20-death source, and filled Tenebo police-camp casualty counts from police-sourced reporting. `correction-plateau-tenebo/run-2026-11-08T14-06-26-256Z/`, 962 active, date integrity PASS, all three APIs/pages 200. Full individual reviews and visual rendering remain pending. Pindiga's possible December 2025 date is unresolved; see ledger.
- 14:08 UTC: corrected an Ondo record that falsely combined the April 9 Igushin farm killings, an unrelated Okitipupa family homicide, and a subsequent Ilado attack; direct police-sourced report supports two killed at the farm and a resident reported three abducted. Separately corrected Idogun–Imeri event description and removed unsupported injury count. `correction-ondo/run-2026-11-08T14-08-30-591Z/`: 962 active, date integrity PASS, both APIs/pages 200. See decision ledger for sources and remaining individual review.
- Live capture at 14:07:23 UTC found 962 active and 57 pending duplicate queue rows. Coverage ledger reconciled without missing or untracked IDs; subsequent Ondo corrections are recorded separately. This capture is not final or evidence of individual review.
- 14:09 UTC: corrected Gubba highway attack to retain police/resident toll disagreement and remove an injury count not clearly attributable to the site. `correction-gubba/run-2026-11-08T14-09-50-521Z/`, 962 active, date integrity PASS, API/page 200. Bayawa warning record remains a separate scope question; full review pending.
- 14:11 UTC: corrected Kemanji's unsupported exact composite casualties using governor, government and local reports, retaining disagreements as 3+ killed, 6+ injured and an unknown abduction count with the official denial recorded. `correction-kemanji/run-2026-11-08T14-11-15-706Z/`, 962 active, date integrity PASS; API/page 200. Comprehensive review and visual rendering remain pending.
- 14:12 UTC: source comparison established Chiromawa, Rantan and Beli are three distinct Kano attacks. Corrected Beli record, which had wrongly described a surviving boy as killed, and recorded differing reported tolls and names. `correction-beli/run-2026-11-08T14-12-41-884Z/`, 962 active, date integrity PASS, API/page 200; full reviews pending.
- 14:14 UTC: source evidence distinguishes the September Marit and Rakum mining-site attacks; corrected Rakum injury uncertainty using `correction-rakum/run-2026-11-08T14-14-10-519Z/`, 962 active, date integrity PASS, API/page 200. Broad review remains pending.
- 14:20 UTC: live capture 965 active/60 pending rows found three additions and independently changed records; coverage ledger reconciled and reset changed records pending. Batch 36 merged new police convoy duplicate into older `6aef4376edaa11f6b0d89ebe` after HNGN and Newsscroll linked guard accounts to the same Sokoto election-duty bus. Stored date Nov 1–3, police five dead plus three additional guard deaths reported, two wounded, abduction count unknown. Also corrected newly ingested Jibia 23-soldier incident to July 2020 based on actual publication and contemporary AFP; its preexisting 2026 source publication timestamp remains wrong because sanctioned tool rejects source override, needing safe repair. `batch-36/run-2026-11-08T14-19-51-650Z/`: 964 active, date integrity PASS, four held candidates retargeted; both survivor APIs/pages 200 and absorbed API/page 404. Ledger has sources and full uncertainty; rendering and all comprehensive incident reviews remain pending.
- 14:23 UTC: fixed the Jibia source publication timestamp safely through the enhanced merge tool. `e2e-source-dates.mjs` passed 4/4 disposable-database cases and `tsc --noEmit` passed; applied `correction-jibia-source/run-2026-11-08T14-23-01-664Z/`, 964 active, date integrity PASS, direct Mongo read verified BSON event and source dates and preserved source URLs, API/page 200. This supersedes the pending source timestamp note above. Historical duplicate review and rendering still pending.
- Anambra Ogidi and Oko/Ekwulobia were source-confirmed distinct; corrected the latter from an unsupported 2026 date to July 9, 2025 and the former to February 6, 2026. Evidence and `correction-anambra-dates/run-2026-11-08T14-16-12-942Z/` are in the ledger; both APIs/pages returned 200.
- 14:26 UTC: independently source-reviewed and dismissed seven distinct stored-event queue pairs with snapshot fingerprints using `distinct-queue-20261108.json`; dry-run and apply artifacts under `scratch/review-dispositions/run-2026-11-08T14-25-44-725Z/` and un-2026-11-08T14-26-27-938Z/`. Direct DB check: 7/7 distinct notes, 53 pending duplicate rows, 964 active. Pair dispositions do not establish full incident review; coverage remains pending.
- 14:29 UTC batch 37: found the older `6ae8efa0eec24a506cafbd4a` already represented the police-bus attack, and merged the batch-36 intermediate survivor into it; retained 28 sources, conflicting five/eight casualty accounts, unknown abduction count and Nov 1–3 date range. Also merged the source-confirmed Tureta duplicate into older `6a966df6a83adf70ab8f837f`, retaining the separate Isa–Bargaja incident. `batch-37/run-2026-11-08T14-29-07-844Z/`: 962 active, date integrity PASS, both survivor APIs/pages 200 and all three absorbed APIs/pages 404; four held leads retargeted. The first police-bus tombstone points through the intermediate tombstone to the final survivor; direct ancestry retargeting remains an integrity follow-up. Full reviews and rendered visual QA remain pending.
- 14:34 UTC: resolved four source-reviewed queue leads already represented by the final police-bus or Tureta survivor, after fingerprint-guarded dry run and apply (ecorded-queue-20261108.json`, artifacts `scratch/review-dispositions/run-2026-11-08T14-32-33-458Z/` and un-2026-11-08T14-34-34-049Z/`). Verified 4/4 resolved, 49 pending duplicate rows and 962 active. Comprehensive reviews remain pending.
- 14:35 UTC: corrected the new Obajana Dangote-worker record to one abducted and later rescued, using the Kogi vigilante-service account; `correction-obajana/run-2026-11-08T14-35-50-209Z/`, 962 active, date integrity PASS, API/page 200. Full individual duplicate review pending.
- 14:37 UTC: source review distinguished May 3 Fan, May 5 Nding Susut and May 9 Barkin Ladi attacks and corrected the latter two casualty records through `correction-nding-barkin/run-2026-11-08T14-37-13-134Z/`; 962 active, date integrity PASS, both APIs/pages 200. Also distinguished the August 14 Kokoli clash from August 21 Borgu mosque raids. Full incident reviews pending.
- 18:35 UTC: safely repaired police-bus tombstone ancestry using enhanced sanctioned merge tool. Disposable `e2e-tombstone-chain.mjs` passed 4/4 and TypeScript passed; `correction-police-ancestry/run-2026-11-08T18-35-28-928Z/` applied after dry-run, 962 active and date integrity PASS. Direct DB check: both deleted ids now name the active final survivor, previous ancestry and 1/7/28 source histories preserved; absorbed API/pages 404, survivor API/page 200. This supersedes the earlier outstanding ancestry note. Comprehensive review remains incomplete.

- 18:36 UTC: refreshed live inventory: 962 active incidents, 49 pending duplicate rows; coverage ledger reconciled with no missing, new untracked or unrecorded changed IDs. This does not establish individual review; continue source comparisons.

- 18:42 UTC: corrected Olahimo teen-herder record to one sourced death and unconfirmed missing worker, through `correction-olahimo/run-2026-11-08T18-41-59-438Z/`; 962 active, date integrity PASS, API/page 200 and response verified. Full review pending. Three source-confirmed distinct queue pairs applied, verification pending; see ledger. Nuru Suraj abductions versus eight-person later rescue remains unresolved until victim-level linkage is found.
- Verified the three distinct queue dispositions directly in Mongo; 46 pending duplicate rows at that point. Prepared two more source-supported Plateau dispositions, dry-run artifact `scratch/review-dispositions/run-2026-11-08T18-42-16-114Z/`; apply and verification in progress.
- 18:45 UTC batch 38: merged source-linked Mbalom duplicate into older `6aae6af9245696a1787315ac`, preserved police/local 9/11 versus AFP 17 disagreement and 5 a.m./5 p.m. reports. `batch-38/run-2026-11-08T18-45-19-630Z/`: 961 active, date integrity PASS, survivor API/page 200 with seven sources and 11+ killed/1+ injured, absorbed API/page 404. Visual QA and comprehensive review remain pending. Its stale duplicate queue row still needs fingerprinted recorded disposition. Two separate Plateau queue pairs applied and directly verified; 44 pending duplicate rows. Ledger contains source evidence and reconciliation.
- Mbalom queue follow-up resolved and verified against the survivor, apply `scratch/review-dispositions/run-2026-11-08T18-47-26-439Z/`; 43 pending duplicate rows. Five further source-based distinct pair decisions are prepared and being dry-run; detailed evidence in ledger.
- Five further source-supported distinct pair dispositions applied and verified 5/5 (`scratch/review-dispositions/run-2026-11-08T18-49-30-115Z/`); 38 pending duplicate rows. Two Tafawa comparisons prepared with named victims and separate dates; dry-run underway. Individual incident coverage remains pending.
- Tafawa source-supported pair dispositions applied and verified 2/2; 36 pending duplicate rows. Identified Eyeyi/Agatu versus Efeyi/Otukpo as a plausible cross-LGA duplicate but left unresolved due missing event-specific identity linkage despite matching district spelling/date/toll. Three police-bus held-source decisions prepared and dry-run in progress; see ledger.
- 18:54 UTC batch 39 merged Aso A reprisal duplicate into older `69c4a1612f6de7afd3bddc1c`, retaining conflicting source narratives and unquantified injuries. `batch-39/run-2026-11-08T18-54-25-497Z/`: 960 active, date integrity PASS, seven sources, survivor API/page 200, absorbed API/page 404. Stale queue row awaits disposition; full individual review and visual QA pending.
- Three independently source-checked police-bus held leads resolved and directly verified (`scratch/review-dispositions/run-2026-11-08T18-55-06-174Z/`); 33 pending duplicate rows. Aso A stale queue follow-up dry-run underway. Bayelsa cult-attack pair remains unresolved due inaccessible original article.
- Aso A stale queue row resolved and verified, 32 pending duplicate rows. Gero date/casualty uncertainty corrected using `correction-gero/run-2026-11-08T18-59-35-317Z/`: 960 active, date integrity PASS, API/page 200 and returned date range/metadata verified; full duplicate review and visual QA pending. Separate Anwase/Abande source-reviewed queue decision prepared; see ledger.
- Gero follow-up: initial precision value was invalid and was repaired to the supported `date_range` using `correction-gero-range/run-2026-11-08T19-01-01-293Z/`; 960 active, integrity PASS, API confirms both endpoints and precision, page 200.
- Anwase versus Abande market pair disposition applied and directly verified (`scratch/review-dispositions/run-2026-11-08T19-02-32-817Z/`); 31 pending duplicate rows. Dakna/Zangula also source-confirmed distinct and pending disposition. A merge-tool precision validation E2E is in progress on a disposable database after a real invalid precision was corrected.
- 19:05 UTC: corrected Abeda Shitile differing police and local tolls to 3+ killed/2+ injured with attributed alternatives, retained 28 sources (`correction-abeda/run-2026-11-08T19-05-55-910Z/`), 960 active, date integrity PASS, API/page 200 and response verified. Source-backed held leads remain to disposition; full review and visual QA pending. Merge tool now rejects invalid date precision using application enum: disposable real CLI E2E 5/5 (including failure reproduced before fix), `tsc --noEmit` passed; see ledger.
- Dakna/Zangula distinct disposition applied and verified (`scratch/review-dispositions/run-2026-11-08T19-06-22-103Z/`); 30 pending duplicate rows. Two Abeda same-event held leads prepared for fingerprinted disposition.
- Live capture 19:07:55 UTC: 960 active, 30 pending duplicate reviews; normalized timestamps and IDs reconcile with coverage ledger, no untracked additions/unexplained changes/missing IDs. This inventory does not complete individual review.
- Two named-victim Abeda held leads resolved and verified against survivor (`scratch/review-dispositions/run-2026-11-08T19-08-34-908Z/`); 28 pending duplicate rows. Gero/Bukuru distinct source-supported pair is being dry-run.
- Gero/Bukuru distinct disposition applied and directly verified (`scratch/review-dispositions/run-2026-11-08T19-11-12-316Z/`); 27 pending duplicate rows. Ribah versus Maga and Ora Ayegbaju versus Kemanji source comparisons support distinct events; queue decisions pending.
- 19:14 UTC batch 40: merged two February 3 Doma records into older `69916f22d2fd954e5196125a` with police 13 versus community 20–27 reporting, corrected the false February 12 date and removed unsupported injury count. Preserved legacy links but explicitly noted that Jikamshi, Sayaya and Falale articles describe other events. `batch-40/run-2026-11-08T19-14-44-007Z/`: 959 active, date integrity PASS, six sources, survivor API/page 200, absorbed API/page 404. Full review and visual QA pending.
- Ora Ayegbaju/Kemanji and Ribah/Maga pair dispositions applied and verified 2/2 (`scratch/review-dispositions/run-2026-11-08T19-15-39-733Z/`); 25 pending duplicate rows. Jikamshi correction dry-run passed; apply underway.
- Jikamshi correction applied (`correction-jikamshi/run-2026-11-08T19-16-59-812Z/`): removed unsupported dual-attack title and 15/24 figures, recorded police-sourced three dead and 11 surviving injured at Jikamshi, Musawa. 959 active, date integrity PASS, API/page 200 with fields verified; full individual review and visual QA pending.
- Millennium City rescue correction (`correction-millennium-rescue/run-2026-11-08T19-20-47-709Z/`) makes clear October 31–November 2 are rescue dates, not original abduction dates, and uses approximate Chikun location. 959 active, date integrity PASS, API/page 200 with fields verified. Overlap with original kidnapping victims remains unresolved and the active rescue record may double-count; seek victim-level linkage before merging or retiring.
- Three Plateau distinct pair decisions applied and verified (`scratch/review-dispositions/run-2026-11-08T19-21-49-641Z/`); 22 pending duplicate rows. One BusinessDay rescue follow-up lead prepared for recorded disposition; this does not resolve the original abduction overlap.
- Kabba-Bunu six-person rescue clarified as a rescue-date record (`correction-kabba-rescue/run-2026-11-08T19-24-12-571Z/`); only one original abduction date is known and overlap for five remains unresolved. 959 active, date integrity PASS, API/page 200 and fields verified.

Latest continuation: 959 active after batch 40. Abangbe source correction applied at `scratch/duplicate-review-20261108-all-pairs/correction-abangbe/run-2026-11-08T19-28-47-290Z/`; recorded queue dispositions are in progress. Maikujeri publication-date/casualty correction dry-run passed at `correction-maikujeri/run-2026-11-08T19-30-40-548Z/`, apply pending. Maikujeri versus Tungan-Bako remains uncertain. See decisions ledger for sources and exact missing linkage. The full individual review remains incomplete.

Batch 41 resolved Maikujeri/Tungan-Bako through independently named proprietor Aminu Bako, overriding the prior unresolved note. Older `6ae79e4b6a4d789018ff0edf` retained, newer `6aec3b959b9cc45c2ff28f6a` absorbed; 958 active, date integrity PASS, API/page 200 and 404 respectively, source and casualty uncertainty verified. See `batch-41/run-2026-11-08T19-33-39-326Z/` and the decisions ledger. Visual QA and comprehensive individual review remain pending.

At 19:35 UTC a fresh capture had 958 active, 19 pending duplicate rows, with every active ID and updated timestamp reconciled against the coverage ledger. Three subsequent reviewed queue rows resolved via `scratch/review-dispositions/run-2026-11-08T19-38-43-034Z/`; a fourth Ogun/Oyo named-victim lead is in dry-run. Yakubu date corrected to 17 October via `correction-yakubu/run-2026-11-08T19-38-18-077Z/`, API/page HTTP 200. Browser attachment timed out again; rendered visual QA remains unverified. All active incidents remain pending complete individual duplicate review; do not mistake queue reduction for completion.

Bui District 33-death aggregate overlaps four village-level records (34 total in Vanguard); aggregate description and precision corrected under `correction-bui-aggregate/run-2026-11-08T19-45-51-397Z/`. IMPORTANT: automatic statistics still sum both aggregate and components, so the double-count remains unresolved despite the warning. Do not merge distinct village victim groups or invent an allocation. Kakafu named-family overlap also remains uncertain; `correction-kakafu/run-2026-11-08T19-44-20-329Z/` labels it. Ogun held lead applied under `scratch/review-dispositions/run-2026-11-08T19-41-56-052Z/`. See ledger for supporting sources.

November 12 continuation: live capture at 21:46:59 UTC found 980 active, 88 pending duplicate reviews, 22 additions and 10 changed records compared with the coverage ledger; reconciled all to pending. Batch 42 merged three new election-police-bus duplicates and one repeated eight-person rescue report through dry-run/apply `scratch/duplicate-review-20261108-all-pairs/batch-42/run-2026-11-12T21-49-26-981Z/`: 976 active and date integrity PASS; survivor API/pages 200, four absorbed API/pages 404, source and uncertainty metadata verified. One settled pair review resolved. Original-abduction overlap for the rescuees, Bui aggregate double-counting, rendered page QA and the comprehensive source-supported review remain unresolved. Read the decisions ledger and refresh the live snapshot before the next batch; daily collection can reinsert previously merged events.

Gidan Taba named vigilante/family fire reports reconcile November 9 publication and November 7 event, but police/council counts differ; corrected to 11+ killed and 7+ abducted with attributed alternatives and rescue uncertainty under `scratch/duplicate-review-20261108-all-pairs/correction-gidan-taba-20261112/run-2026-11-12T21-52-03-723Z/`. 976 active, date integrity PASS, API/page HTTP 200, visual QA pending. Jigawa anti-banditry-office record has an unrelated linked Punch source and a possibly similar March 2025 incident; no common victim or source identity established, so do not silently re-date it. See ledger.

Takum `6af37ba383ba7d1028a7f57a` now names police-confirmed victim Ibrahim Saidu (D.O.) and one death; matching held lead resolved with artifact `scratch/review-dispositions/run-2026-11-12T21-56-16-489Z/`. Lagos Oregun/Ikeja town-hall record now gives exact venue and four-plus reported injured; `correction-oregun-injuries-20261112/run-2026-11-12T21-56-47-991Z/`, API/page HTTP 200. Two related source-checked held leads are in a fingerprinted dry-run; third linked article inaccessible. Plateau Bel/Belsho reports remain uncertain due lack of shared named victim despite similar totals; see decision ledger. Current full review and rendered QA remain incomplete.

Two Oregun source-checked held leads applied `scratch/review-dispositions/run-2026-11-12T21-59-54-259Z/`; third remains pending. Zangula Kilba Gombi engagement is distinct from Mubi rescue; conflicting November 8/9 dates preserved via `correction-zangula-20261112/run-2026-11-12T21-59-28-384Z/`. Mubi farmer Happiness Dama Dauda and two additional rescuees are distinguished via `correction-mubi-20261112/run-2026-11-12T22-01-08-412Z/`; original abductions of the two others remain unlinked. Both API/page HTTP 200, date integrity PASS. Reconcile live before continuing; comprehensive review, automatic Bui double-count and rendered QA remain outstanding.

Batch 43 merged eight-person rescue intermediate `6aef5d5fcdf2d5a3282bbb5a` into older `6aea41df25a5bf7a35389a18`; identical named rescuees verified from Blueprint, Sun and Leadership. Applied `batch-43/run-2026-11-12T22-05-47-284Z/`; repaired the earlier tombstone chain with `correction-rescue-ancestry-20261112/run-2026-11-12T22-06-10-076Z/`. 975 active, date integrity PASS, survivor API/page 200, both tombstone API/pages 404, direct Mongo ancestry verified; original abduction links, visual QA and full review remain pending. Mista Ali held-lead dry-run passed; apply underway. See ledger.

At 22:11:59 UTC the live inventory had 975 active incidents and 80 pending duplicate reviews; all 975 still need full individual source-supported review. Two Sudan Times held leads were source-verified and resolved (`scratch/review-dispositions/run-2026-11-12T22-10-31-733Z/`, checked in Mongo). Later source-backed corrections to the Olajide abduction/killing and Obele body discovery applied via `scratch/duplicate-review-20261108-all-pairs/correction-kwara-obele-20261112/run-2026-11-12T22-12-45-991Z/`; both public APIs/pages HTTP 200, date integrity PASS, coverage timestamps reconciled. Their inaccessible held sources remain pending. Continue from the decisions ledger, recapture live, and do not treat queue clearance or HTTP 200 as complete review or rendered QA.

Woro verification: prior 160/146 warning is superseded by existing 161+/163+ sourced fields, now corroborated by AP and UNICEF (which reports 200+ killed/about 176 kidnapped); police initially reported 75 deaths. Added attributed alternatives without summing them. Separately, removed eight Nuku-Woro vehicle fatalities wrongly attributed to Niger's Luma bridge bombing, and corrected the separate named-driver Woro vehicle record to 1+ killed/1+ injured. Whether the eight-person vehicle report refers to that named driver's vehicle remains unproven. `scratch/duplicate-review-20261108-all-pairs/correction-woro-cross-border-20261112/run-2026-11-12T22-14-57-519Z/` applied after dry-run; 975 active, date integrity PASS, three API/pages HTTP 200; visual and comprehensive review pending. See ledger for sources and resume from fresh live capture.

Three repeated Takum named-victim leads resolved and verified (`scratch/review-dispositions/run-2026-11-12T22-17-46-057Z/`). Akwando source comparison matched named victims while revealing inconsistent abduction totals and reported times; record corrected to 18+ with attributed 18/20/21 and midnight/noon uncertainty, `scratch/duplicate-review-20261108-all-pairs/correction-akwando-time-20261112/run-2026-11-12T22-18-22-333Z/`, API/page HTTP 200 and integrity PASS. Two related source-checked queue leads are in dry-run; see ledger. The full individual review and rendered page QA remain incomplete.

Two named-list Akwando held leads resolved and verified (`scratch/review-dispositions/run-2026-11-12T22-19-39-134Z/`). Majelisa record corrected to one named injured victim (`scratch/duplicate-review-20261108-all-pairs/correction-majelisa-20261112/run-2026-11-12T22-20-56-251Z/`), API/page HTTP 200; three same-named-victim leads in dry-run. 975 active at last mutation; comprehensive source review and rendered QA remain incomplete. See ledger for sources and refresh live.

Capture 22:22:14 UTC: 975 active, 75 pending duplicate rows, coverage ledger fully reconciled, all 975 full individual reviews pending. Three Majelisa named-victim leads resolved and verified (`scratch/review-dispositions/run-2026-11-12T22-22-36-764Z/`). Luma bridge description now preserves a local report claiming two deaths without treating the uncorroborated claim as confirmed (`scratch/duplicate-review-20261108-all-pairs/correction-bridge-claim-20261112/run-2026-11-12T22-23-04-215Z/`), API/page HTTP 200. Two existing-rescue queue decisions are in dry-run; the unrelated-original-abduction overlap remains unresolved. See ledger.

Eight-rescue held/stale rows resolved against the merged named-victim survivor (`scratch/review-dispositions/run-2026-11-12T22-24-46-085Z/`); direct Mongo verification confirms the separate Nuru Suraj overlap row remains pending. The comprehensive review and rendered QA are unfinished.

Two stale stored-pair rows from the police-bus merge resolved and directly verified (`scratch/review-dispositions/run-2026-11-12T22-26-51-245Z/`); separate nonspecific early alerts still need linkage. Three named-victim Abeda held leads passed dry-run and apply is in progress. Karmo, Nasarawa reports remain uncertain due no named or otherwise distinctive victim linkage; see the ledger. Comprehensive review remains incomplete.

Three repeated named-victim Abeda held leads resolved and verified (`scratch/review-dispositions/run-2026-11-12T22-27-51-082Z/`). A third Gidan Taba death-toll account naming the same family was added with uncertainty under `scratch/duplicate-review-20261108-all-pairs/correction-gidan-13-20261112/run-2026-11-12T22-29-31-669Z/`; public API/page HTTP 200 and integrity PASS, matching held lead in dry-run. A distinct October 2025 Gidan-Giye patrol ambush has the same 5 police/3 guards as the 2026 reported convoy; do not conflate by location or count. See ledger for source evidence. Full individual review and visual QA remain incomplete.

Latest live capture at 22:30:56 UTC: 975 active, 65 pending duplicate rows, coverage reconciled; later actions require another capture. The BusinessDay Gidan Taba named-family lead resolved (`scratch/review-dispositions/run-2026-11-12T22-30-38-402Z/`). Source-reviewed Kogi pair shown distinct by police report: corrected Ibaji clash date to May 5–6 and LGA, and Dekina attack to one named victim while excluding a separate Ofu ambush, using `scratch/duplicate-review-20261108-all-pairs/correction-kogi-distinct-20261112/run-2026-11-12T22-32-10-604Z/`; 975 active, date integrity PASS, API and pages HTTP 200. Individual reviews and visual QA remain pending; continue from decisions ledger.

Borgu February raids: source-reviewed Konkoso, Tunga-Makeri and Pissa as distinct settlements. AP attributes 26 deaths to Konkoso, while the Daily Trust account allocates that figure across Konkoso/Pissa without a Pissa breakdown. Uncertainty added to survivor title, description and casualty note (`scratch/duplicate-review-20261108-all-pairs/correction-konkoso-allocation-20261112/run-2026-11-12T22-34-16-391Z/`), API/page HTTP 200, date integrity PASS. The numeric estimate remains attributed, not confirmed as 26 in Konkoso alone. Full individual reviews and rendered QA remain pending.

Batch 44 merged the Jan 10 Udeku security-officer duplicate into older `69c860238644e9af8ac2946e`, correcting an erroneous seven-death aggregate to the two officers; the five farmers were killed in an earlier distinct event. `scratch/duplicate-review-20261108-all-pairs/batch-44/run-2026-11-12T22-36-19-215Z/`: 974 active, date integrity PASS, survivor API/page 200 with five sources and absorbed API/page 404. A nearby vague Jan 15 Kwande record has a mislinked source; a separate Jan 14 named father-and-son attack exists, but mapping that generic record needs further evidence. Full review and rendered QA remain pending; see ledger and recapture live.

Udeku five-farmer attack is distinct from the January 10 security ambush: contemporaneous reports date it Tuesday January 6, not its stored January 8 publication date. Corrected via `scratch/duplicate-review-20261108-all-pairs/correction-udeku-farmers-20261112/run-2026-11-12T22-37-27-197Z/`; 974 active, integrity PASS, API/page HTTP 200. The generic January 15 Kwande record remains uncertain and unmerged. Continue full review.

Live capture 22:38:06 UTC: 974 active and 64 pending duplicate rows, coverage IDs/timestamps reconciled; no full individual review is yet marked complete. Taraba `69d42e170bc1b49a71e7fa76` has an unrelated December 2025 source and an exact March 31 date apparently taken from a 2026 political statement that does not date the killings or establish they are one event. Correction dry-run rejected `datePrecision: unknown` because the current model supports only exact_day/date_range/month_only; no write was made. Seek event-specific sourcing or a safe unknown-date representation, and preserve uncertainty. See ledger.

Rimi 47-farmer and Mukura 20+ records may overlap: Channels and Punch connect their reports to the same rescue search, but no named common victim or verified settlement mapping has been found. Both descriptions now flag uncertainty (`scratch/duplicate-review-20261108-all-pairs/correction-rimi-mukura-20261112/run-2026-11-12T22-40-41-029Z/`), 974 active, integrity PASS, API/page HTTP 200. Automatic statistics still sum both, so possible double-count remains. Do not merge without event-level identity evidence. Full review and visual QA remain pending.

Sabon Birni June 28 IED source explicitly reports several injured; corrected the recorded null injury to 1+ (`scratch/duplicate-review-20261108-all-pairs/correction-sabon-birni-20261112/run-2026-11-12T22-41-53-274Z/`), integrity PASS, API/page HTTP 200. A similar June 29 incident may duplicate it but its sole source is inaccessible and no victim/vehicle link is available; do not merge based on title/date/toll alone. Potential double-count, full review and rendered QA remain pending.

Dorowa Babuje and Jol sources describe separate February 22 attacks. Dorowa survivor now attributes security 7 deaths/2 injuries versus community 9/3, and marks disputed Barkin Ladi versus Riyom LGA (`scratch/duplicate-review-20261108-all-pairs/correction-dorowa-20261112/run-2026-11-12T22-43-00-897Z/`); 974 active, integrity PASS, API/page HTTP 200. Earlier Jol victims should be separately compared; full review and visual QA pending.

Maganho, Tangaza attack corrected to February 11 and 1+ injuries from its contemporaneous report (`scratch/duplicate-review-20261108-all-pairs/correction-maganho-20261112/run-2026-11-12T22-45-10-322Z/`), API/page HTTP 200 and integrity PASS. A shared Daily Trust URL actually concerns April Sabon Birni raids and does not identify the separate generic February 26 Sokoto record; that record remains unresolved. See ledger for additional 2025/2026 cross-year and incorrect-source findings. Full review and visual QA remain pending.

Apa February Akpete and March Ojantele/Okpette attacks have different named victims and circumstances. Corrected February date and 1+ injuries; March casualty disagreement is now attributed as police six bodies versus resident about 15, plus resident-reported injuries and an abducted girl (`scratch/duplicate-review-20261108-all-pairs/correction-akpete-apa-20261112/run-2026-11-12T22-46-24-983Z/`). 974 active, integrity PASS, both APIs/pages HTTP 200. Full review and visual QA remain pending.

Kebbi Tangaram May 24 and Maga November 5 are separate attacks with different victim groups. Maga's reported but unquantified abductions now show 1+ via `scratch/duplicate-review-20261108-all-pairs/correction-maga-20261112/run-2026-11-12T22-47-42-383Z/`; 974 active, date integrity PASS, API/page HTTP 200. Full review and visual QA pending.
# Live reconciliation, 2026-11-13 23:04 UTC

The fresh `scratch/duplicate-review-20261108-all-pairs/live-snapshot.json` has 984 active incidents and 64 captured review rows. No active IDs were added since the preceding capture. The Oke-Ako correction described below is the substantive changed record; its full review remains pending. Its named 2025 farm victims are distinct from the previously reviewed November 2026 Kaso displaced farmers and Kunkumi child. `incident-coverage.json` is reconciled to this capture: 2 active individually reviewed, 982 pending; it also retains historical absorbed entries. Ejiba review is in progress, not yet marked complete. Review rows can change independently; inspect live state before dispositions.

# Tanker correction, 2026-11-13 23:09 UTC

Corrected `6aeb929f2e90cd1ba2ba59ee`: the original source says driver Usman Abubakar and his motor boy were intercepted, not that both were abducted. [Trust Radio](https://trustradio.com.ng/en/police-rescue-kidnapped-tanker-driver-in-edo) says Imran Sokoto escaped while the driver was abducted and later rescued. Set one abducted, preserved both sources and recorded the supported highway location. Manifest `scratch/duplicate-review-20261108-all-pairs/correction-edo-tanker-20261114.json`; dry artifact `scratch/duplicate-reconciliation-20261113/run-2026-11-13T23-09-16-205Z/`, apply un-2026-11-13T23-09-36-852Z/`, 984 active, date integrity PASS. Public API and page HTTP 200; API has two sources and corrected figures, `scratch/duplicate-review-20261108-all-pairs/correction-edo-tanker-20261114-verification.json`. No visual page check. The tanker and Ejiba both remain pending full individual review. Refresh the live snapshot after this update.

# Live reconciliation, 2026-11-13 23:10 UTC

Post-correction `live-snapshot.json` has 984 active IDs and 64 captured review rows, with no newly added IDs since 23:04. The only substantively changed active record is the Edo tanker driver described below; its individual review remains pending. It concerns named adult driver Usman Abubakar on a highway, distinct from the two fully reviewed Kaso displaced-farmer and Kunkumi child incidents. Coverage is reconciled to the new snapshot: 2 reviewed and 982 pending.

# Unresolved cross-state bus lead

New Edo Line `6aee35c85ee950de24a0f5af` and Ogun/Ibadan `6aece390cd27b25a9d38409d` share a November 3 Benin-to-Ibadan route and may be the same event, but the accessible family accounts name different people and conflict on NYSC status and ransom. Police's operational summary identifies a New Edo Line bus, but does not identify either family's victim. Do not merge until a source connects the named victims, vehicle, or reports. Evidence and precise missing link are in `decisions-continuation.md`.

# Ejiba source comparisons in progress

Additional source checks for the Ejiba four farm workers distinguish the earlier Kontagora and Mariga rescues, the named Ogun farm victims, Majelisa grazing dispute, Eruku-Iyemero engagement-party travellers and Obajana pipeline worker. Links and comparison details are in `decisions-continuation.md`; Ejiba remains pending full review. Continue with remaining candidates, refresh live data and reconcile coverage before clearing it.

# Live reconciliation, 2026-11-14 06:01 UTC

Fresh `scratch/duplicate-review-20261108-all-pairs/live-snapshot.json`: 984 active, 68 captured duplicate review rows, no new active IDs since the prior coverage snapshot. Two existing pending incidents changed: Gombe Pantami campaign convoy `6af576a512ec0ea5043228f9` and Ikeja political town hall `6af61f7b3ce10f214e7aaa6f`. They remain pending individual review. Their political-event narratives and sources do not describe the previously reviewed Kaso displaced farmers or Kunkumi child. Coverage now references this capture: 2 reviewed, 982 pending. Check the four additional queue rows before dispositions. Ejiba remains pending.

# New Dan Tafki queue lead

Queue row `6af79a8763f3fe9dea7df857` is a same-rescue lead for survivor `6af775b4f31497835f216e18`: PressPoint names Nafisa Abubakar and Aminu Sahabi, matching the existing sources. Keep the November 8–9 date uncertainty and 2+ abducted minimum. Source-reviewed but not yet disposed; use the guarded disposition tool with dry run and apply, preserving source history. See decision ledger.

# Dan Tafki queue disposition applied

Queue row `6af79a8763f3fe9dea7df857` was resolved as the same named-victim rescue already recorded. Manifest `scratch/duplicate-review-20261108-all-pairs/queue-dan-tafki-20261114.json`; dry artifact `scratch/review-dispositions/run-2026-11-14T06-03-45-136Z/`, apply un-2026-11-14T06-04-40-642Z/` modified 1. The source was already present on survivor `6af775b4f31497835f216e18`. Fresh snapshot 06:05:54 UTC: 984 active, 67 pending duplicate rows; the row no longer appears pending. Total pending reviews across all kinds after apply: 287. The previous note saying disposition is pending is superseded. Reconcile coverage snapshot timestamp and check any other changes before clearing incidents.

# Gidan Taba held sources

Reuters describes a volunteer plus ten relatives killed and thirteen abducted in the weekend Gidan Taba attack; the council chairman's account describes twelve family members and an undetermined abduction count. An independent synthesis identifies these as differing accounts of the attack but says they have not been reconciled. Two held queue rows `6af79a8763f3fe9dea7df858` and `6af79a8763f3fe9dea7df856` remain pending until their original sources and survivor `6af0d8e3b556b127db7a8faf` are compared. Do not sum the tolls. Details and links in decision ledger.

# Gidan Taba Reuters republication resolved

Yahoo row `6af79a8763f3fe9dea7df856` republishes the Reuters account already on survivor `6af0d8e3b556b127db7a8faf`; Yahoo source added through sanctioned set-only manifest `correction-gidan-yahoo-20261114.json`, dry artifact `scratch/duplicate-reconciliation-20261114/run-2026-11-14T06-07-47-440Z/`, apply un-2026-11-14T06-08-11-201Z/`, date integrity PASS. Queue dry/apply `scratch/review-dispositions/run-2026-11-14T06-08-49-146Z/` and un-2026-11-14T06-09-33-422Z/` modified one. Fresh capture 06:10:53 UTC shows 984 active and 66 pending duplicate rows, with Yahoo row absent; survivor API returned 200. Other Firstpost row remains pending due inaccessible source. Casualty disagreement remains on survivor. Reconcile coverage with fresh snapshot.

# Takum Chronicle lead resolved

Held row `6af79a8763f3fe9dea7df85a` names Ibrahim Saidu (D.O.) and the residence shooting, matching survivor `6af37ba383ba7d1028a7f57a`; its Chronicle source was already retained. Manifest `queue-takum-chronicle-20261114.json`, dry `scratch/review-dispositions/run-2026-11-14T06-12-28-251Z/`, apply un-2026-11-14T06-13-14-563Z/` modified one. Live 06:14:06 UTC capture: 984 active, 65 pending duplicate rows, this row absent. Sunday/Monday uncertainty remains. Reconcile coverage with new snapshot before clearance.

# Takum Daily Trust lead resolved

Row `6af79a8763f3fe9dea7df859` is the same named Ibrahim Saidu residence shooting already recorded. The original Daily Trust page returns 402; its publisher's accessible Trust Radio republication was read. Original source was already on survivor. Manifest `queue-takum-trust-20261114.json`, dry `scratch/review-dispositions/run-2026-11-14T06-15-29-934Z/`, apply un-2026-11-14T06-16-23-726Z/` modified one. Live capture 06:16:51 UTC: 984 active, 64 pending duplicate rows, this row absent. Three PM News leads remain inaccessible and pending. Reconcile coverage with latest capture.

# Three Gidan Taba leads resolved

Rows `6af77c1d63f3fe9dea7dd04d`, `6af77c1d63f3fe9dea7dd04c`, `6af77c1c63f3fe9dea7dd04b` reproduce Reuters or AFP reporting already preserved on survivor `6af0d8e3b556b127db7a8faf`. Manifest `queue-gidan-three-20261114.json`, dry `scratch/review-dispositions/run-2026-11-14T06-18-30-481Z/`, apply un-2026-11-14T06-19-08-522Z/` modified three. Live capture 06:20:17 UTC: 984 active, 61 pending duplicate rows, all three absent. Conflicting tolls remain preserved. Reconcile coverage against latest capture.

# Asaba NDC lead resolved

Premium Times lead `6af79a8863f3fe9dea7df85c` concerns the same NDC million-man march, damaged campaign vehicles, Ochei response and dispute over a police warning as survivor `6aef8659fe62640995427394`. Its source was already retained and conflicting injury counts remain. Manifest `queue-asaba-premium-20261114.json`; dry `scratch/review-dispositions/run-2026-11-14T06-21-59-881Z/`, apply un-2026-11-14T06-22-48-943Z/` modified one. Live capture 06:23:34 UTC: 984 active, 60 pending duplicate rows, row absent. Reconcile coverage to this capture.

# Lagos town hall lead resolved

Arise lead `6af79a8863f3fe9dea7df85d` describes the existing Oregun town hall incident `6af61f7b3ce10f214e7aaa6f`; Arise's follow-up names Classique Event Centre and journalist Samuel Adebanjo. Two Arise sources added without changing tolls via `correction-lagos-arise-20261114.json`, dry/apply artifacts `scratch/duplicate-reconciliation-20261114/run-2026-11-14T06-24-31-235Z/` and un-2026-11-14T06-24-54-836Z/`, date integrity PASS. Queue dry/apply `scratch/review-dispositions/run-2026-11-14T06-25-29-560Z/` and un-2026-11-14T06-26-49-331Z/` modified one. Live 06:27:41 UTC: 984 active, 59 pending duplicate rows, row absent. Reconcile coverage with changed survivor; full incident review remains pending.

# Karmo held lead remains unresolved

`6af778f863f3fe9dea7dccad` versus `6aeede461c7a0a562ce785fa`: the held Leadership-derived account says a woman was killed over cattle eating crops, two more died in retaliation, and houses and motorcycles burned. The survivor's Daily Post source says one civilian killed in a land dispute and a motorcycle burned, with troops responding November 5. They may describe one evolving clash but neither identifies the victim in the other or explicitly links the accounts; the held report dates its initial event to the prior Wednesday. Do not replace one death with three or resolve solely on the shared place. Find a police, local authority or witness account linking the original victim and reprisal sequence. Sources and details are in the ledger. Coverage snapshot was reconciled at 06:27:41 UTC; 2 reviewed and 982 pending before any later changes.

# Belsho duplicate merged

`6af755d134e1de0f604767d9` was merged into older `6af22b2a5931a0695983c0d7`: [Daily Times](https://dailytimesng.com/two-deadly-attacks-deepen-security-concerns-in-barkin-ladi/) links the commuter ambush to the three named Bel village victims in the older source. [The Sun](https://thesun.ng/plateau-bleeds-again-as-gunmen-kill-soldier-4-others/) names two injured people; survivor now records 2+ injured and retains reported timing differences. Set-only dry/apply `scratch/duplicate-reconciliation-20261114/run-2026-11-14T06-30-46-171Z/` and un-2026-11-14T06-31-07-549Z/`; merge manifest `batch-belsho-20261114.json`, dry/apply un-2026-11-14T06-32-03-572Z/` and un-2026-11-14T06-32-25-264Z/`. 983 active, date integrity PASS, one pair review resolved. Survivor API/page 200, absorbed API/page 404, 8 sources and injury metadata verified in `batch-belsho-verification.json`. Visual rendering still unverified. Refresh live snapshot and coverage; survivor still needs full individual review.

# Gombe convoy lead resolved; live coverage

The Sun queue lead `6af775c463f3fe9dea7dc7e6` and Premium Times describe the same Pantami convoy attack, burning tyres and damaged vehicles, citing Amnesty. The Sun source was already on survivor `6af576a512ec0ea5043228f9`; its description of the violence as deadly does not establish deaths. Manifest `queue-gombe-sun-20261114.json`, dry `scratch/review-dispositions/run-2026-11-14T06-34-44-211Z/`, apply un-2026-11-14T06-35-29-681Z/` modified one. Live capture 06:36:23 UTC has 983 active and 57 pending duplicate rows, with this row absent. Coverage at preceding 06:33:30 capture was reconciled: 2 reviewed and 981 pending. Reconcile subsequent capture before clearing further incidents.

# Two Gombe convoy leads resolved

Punch and Daily Nigerian rows `6af775c463f3fe9dea7dc7e8` and `6af775c463f3fe9dea7dc7e7` describe the same Pantami reception convoy attack at Jekadafari, including burning barriers and damaged windscreens. Both sources were already on survivor `6af576a512ec0ea5043228f9`. Manifest `queue-gombe-two-20261114.json`, dry `scratch/review-dispositions/run-2026-11-14T06-37-52-254Z/`, apply un-2026-11-14T06-38-31-419Z/`, two modified. Live capture 06:38:59 UTC: 983 active, 55 pending duplicate rows, both absent. Reconcile coverage timestamp before clearing further incidents.

# Lagos and Asaba sources and leads

Premium Times sources added to existing Lagos `6af61f7b3ce10f214e7aaa6f` and Asaba `6aef8659fe62640995427394` incidents after dry run, apply artifact `scratch/duplicate-reconciliation-20261114/run-2026-11-14T06-40-54-429Z/`, date integrity PASS. Queue rows `6af775c463f3fe9dea7dc7de` and `6af775c363f3fe9dea7dc7dd` resolved after dry `scratch/review-dispositions/run-2026-11-14T06-41-36-548Z/`, apply un-2026-11-14T06-42-25-455Z/`, two modified. Articles also mention separate other events, which are not absorbed. Live capture 06:43:32 UTC: 983 active, 53 pending duplicate rows, both rows absent. Reconcile changed survivors with coverage and verify public pages; full review remains pending.

# Political-source verification and coverage

Lagos `6af61f7b3ce10f214e7aaa6f` and Asaba `6aef8659fe62640995427394` public APIs and pages returned HTTP 200 after the source updates. API responses show the added Premium Times URLs, 15 and 18 sources respectively, Lagos 4+ injured and Asaba 1 killed/5+ injured with conflicting reports retained. Artifact `scratch/duplicate-review-20261108-all-pairs/political-source-verification.json`. This is HTTP/API verification, not visual rendering. Coverage reconciled to 06:43:32 UTC snapshot: 2 reviewed, 981 pending among 983 active. The earlier note saying public-page checks were pending is superseded for HTTP only.

# Ejiba individual review completed

`6af7554137c56a0ba227fbab` has been individually compared against plausible local, cross-state, rescue and date-shifted candidates using the 06:43:32 UTC live snapshot and sources detailed in `decisions-continuation.md`. No confirmed active duplicate or unresolved specific Ejiba pair found. Other incidents' independent uncertainties remain open. Coverage now records 3 reviewed, 980 pending among 983 active; reopen Ejiba if relevant new or changed evidence emerges. Earlier notes saying its individual review is pending are superseded.

# Obajana worker review in progress

`6af083ee65f01aae82ea8f4c` concerns pipeline worker Muri Sadiq taken November 4 and rescued. Local all-time search found the earlier Obajana police-station attack and Zariagi school case; adjacent-state date-range candidates have been enumerated. Source comparisons begun in the decision ledger, but full review is pending. Check the Zariagi school source and the remaining nearby, cross-state and rescue candidates before clearance.

# Obajana review follow-up

The Zariagi school case is a distinct April orphanage raid; Adoka mourners, Ugbogun tanker driver and Baruten farmer are also distinct from pipeline worker Muri Sadiq based on the sources and victim circumstances. See ledger. Remaining candidate comparisons are pending, so Obajana is not yet marked fully reviewed.

# Enugu family release correction

`6af02fe327ac31cc82d28e5e` now records four abducted and their later release. [Premium Times](https://www.premiumtimesng.com/news/top-news/924100-gunmen-release-kidnapped-mother-three-sons-after-n4-million-ransom.html) names Bridget Okey and her sons and reports that a family source alleged ransom while the council chairman denied payment. Both claims are preserved without adjudication. Set-only manifest `correction-enugu-family-20261114.json`, dry `scratch/duplicate-reconciliation-20261114/run-2026-11-14T06-51-11-170Z/`, apply un-2026-11-14T06-52-04-398Z/`, 983 active and date integrity PASS. API and page HTTP 200; four abducted, release text and 13 sources verified in `correction-enugu-family-verification.json`. Visual check and full individual review remain pending; refresh live coverage. This named family is distinct from Obajana worker Muri Sadiq.

# Live reconciliation 06:54 UTC

Fresh `live-snapshot.json` at 2026-11-14 06:54:17 UTC has 983 active, 53 pending duplicate rows and no newly added active IDs relative to coverage. The Enugu family correction is the sole changed active incident and remains pending individual review. Its named mother and children differ from the three reviewed incidents (Kaso displaced farmers, Kunkumi boy and Ejiba four workers). Coverage reconciled: 3 reviewed and 980 pending. Obajana review continues.

# Obajana additional source comparisons

The October Kabba–Ayere passenger ambush, earlier Ayegunle Bunu raid, Victor Yakong's Bassa abduction and Akwando village raid are distinct from Muri Sadiq's pipeline abduction based on named victims and circumstances. See decision ledger. Obajana remains pending remaining cross-state and release comparisons.

# Obajana cross-state comparisons

Riyom visually impaired travellers, Mariga 21-person rescue, Maga town raid and Karim-Lamido village attacks are different victim groups or operations from pipeline worker Sadiq. Source links are in the ledger. Obajana remains pending the remaining location and date comparisons.




















































































































