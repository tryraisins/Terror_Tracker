# Project Handoff

## Current duplicate audit, 2026-11-13 17:47 UTC

- **Incomplete active goal:** individually source-review every active incident and plausible cross-border/date-shift/follow-up duplicate, merge only confirmed duplicates with the sanctioned dry-run/apply tool, and verify real APIs and rendered pages. Do not use project DeepSeek or Brave APIs. Pair ranking and inventory are not completed reviews.
- Latest `scratch/duplicate-review-20261108-all-pairs/live-snapshot.json` at 17:47 UTC: **974 active, 55 pending duplicate rows**. Four incorrectly resolved pair reviews were reopened; see the repair note below. `incident-coverage.json` is reconciled against this capture (changed entries reset to pending); all active entries remain pending full individual review. See `decisions-continuation.md` for exact IDs, sources and latest comparisons. Re-capture before further decisions because independent scans can change data.
- Latest live sequence: batch 45 and 46 reduced active 977 to 975; promotion of independently source-confirmed Gombe checkpoint shooting brought it to 976. Four same-event Gombe convoy queue rows resolved. Promotion inserted a record but left its row pending because candidate date was stored as a string and the script matched a BSON Date; separate evidence-backed disposition resolved it. Check row status for future promotions and repair/test the tool before relying on automatic resolution. Peter Kwen source correction and its queue disposition completed; see continuation ledger for artifacts. Use curl for HTTP: Python urllib gets 403 but curl returns live 200/404. User requests that their browser not be used.
- Merge queue integrity repair: the merge tool previously resolved unrelated third-incident comparisons and missed reverse-oriented pairs. Audited 83 automatically resolved reviews and found four affected rows, reopened and retargeted with fingerprinted dry-run/apply artifacts `scratch/review-dispositions/run-2026-11-13T17-36-23-033Z/` and `run-2026-11-13T17-37-44-479Z/`; three were subsequently source-reviewed and dismissed as distinct in `scratch/review-dispositions/run-2026-11-13T17-41-29-072Z/`; the Kaduna Nuru Suraj versus eight rescued victims comparison remains pending due to missing victim linkage. `scripts/merge-incidents.ts` now resolves exact pairs in either direction and retargets remaining references. `scripts/apply-review-decisions.ts` supports guarded restoration. Disposable CLI E2Es passed 4/4 merge-link and 3/3 restoration checks, and direct TypeScript check passed. See ledger for IDs and evidence.
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
- Next: compare three new and five changed records to their prior artifacts and source evidence, review remaining ranked and newly discovered plausible pairs individually, reconcile live duplicate queue, continue dry-run/apply and API verification. Do not mark incident coverage complete without full comparisons. Repair local dependency installation before rerunning focused lint/build; the earlier TypeScript and real-CLI disposable E2E passed, but lint/build and rendered visual QA remain unverified. The 17:41 retry failed because local `@babel/core` and the `next` executable are missing.

## 2026-11-13 Scan slots moved to DeepSeek off-peak

- `deploy/systemd/terror-scan.timer` is now `OnCalendar=*-*-* 11,23:00:00 UTC` (12:00 and 00:00 Lagos), superseding the 08:00/20:00 UTC slots recorded under 2026-10-29. DeepSeek bills 2x between 01:00-04:00 and 06:00-10:00 UTC on weekdays and half price at every other hour, weekends included, so the 08:00 slot paid peak rates on every weekday run. 11:00 UTC sits an hour clear of the 10:00 boundary, 23:00 UTC two hours clear of the 01:00 one, and a retry 20 minutes later is still off-peak. Slots stay 12h apart, so `SCAN_HEALTH_STALE_HOURS=18`, the hourly watchdog and the 20:30 UTC dead-man are unchanged. Weekly catch-up stays Sunday 14:00 UTC (off-peak all weekend) and its comment now names the new slots.
- Cost basis, DeepSeek platform CSV for key "Terror Tracker", 15 days (2026-10-30 to 11-13): $6.93 total, search calls $3.84, tokens $3.08. 2026-11-07 alone was $3.80 (3,173 requests, 3,828 searches) and was the operator's own audit backfill, so it is excluded as a one-off. Without it the run rate is about $6.7/month: tokens $4.6, search $2.1. Peak-priced tokens were about $2.4/month, so this move should save about $1.2/month. Search bills at $0.75 per 1,000 calls with no off-peak discount, so timing does not touch it.
- Operator decision 2026-11-13: no per-process cap on DeepSeek searches. Brave keeps its 40-call cap; DeepSeek stays uncapped, so a deliberate backfill can still spend a few dollars in one day.
- Model name is now `deepseek-flash` in `src/lib/deepseek.ts`, `scripts/rescue-held-locations.ts`, `.env.example`, `.github/workflows/daily-scan.yml` and both `deploy/env/*.example` files.
- **Regression found in the first test run, fixed the same evening.** The rename was not behaviour-neutral: the legacy `deepseek-chat` alias is served with thinking mode OFF, while `deepseek-flash` enables it by default. With the small `max_tokens` used here (400/500/700), reasoning consumed the budget and content came back empty: 8 "DeepSeek duplicate check returned an empty response", `deepseekErrors: 19`, coverage `INCOMPLETE`, and a failure alert at 20:16 UTC. The eight runs before it all had `deepseekErrors: 0`. Measured directly against the API on the same prompt: `deepseek-chat` 156 chars, 0 reasoning, 35 output tokens; `deepseek-flash` 172 chars, 396 chars reasoning, 142 output tokens; `deepseek-flash` with `thinking: {"type": "disabled"}` 156 chars, 0 reasoning, 35 tokens, identical to the alias. Fix: every chat call in `src/lib/deepseek.ts` and `scripts/rescue-held-locations.ts` now sends `thinking: {type: "disabled"}` (constant `DEEPSEEK_THINKING`). This also removes a 4x output-token increase. Live `/etc/terror-tracker/{scan,app}.env` were reverted to `deepseek-chat` while the fix was written, then switched back to `deepseek-flash` after the fixed image was deployed.
- Speed check with `FREE_SOURCE_CONCURRENCY=8`: discovery went from 18m39s to 17m45s and the total stays about 25 minutes, so the bump is real but small. Per-batch time is dominated by the three search lanes plus the Brave fallback on most states, not by article fetch concurrency. Do not expect a large win from tuning it further.
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
- `next build` was attempted using the installed binary and failed on missing local dependencies including `@alloc/quick-lru`, `@babel/runtime`, and `@emotion/react`; focused ESLint similarly cannot load `@babel/core`. TypeScript passed and the real merge CLI E2E passed. Repair the incomplete local install before repeating build/lint; do not claim those checks passed.
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
- Continued 2026-11-08: one Abeokuta duplicate merged, `6aef16e44eb3d454f18fb874` into `6aef16e44eb3d454f18fb872`, with PUNCH and Radio Nigeria naming the same victim Stone and roadway; North/South LGA conflict. Snapshot and run: `scratch/duplicate-review-20261108-all-pairs/batch-6/run-2026-11-08T00-33-52-174Z/`. Active count 996, date integrity PASS. Public API checks for batches 4-6 returned 200 on four survivors and 404 on four absorbed; each survivor page returned HTTP 200 (not visual inspection). `npm run merge:incidents` currently fails because local `tsx` binary is missing; `npx --yes --package tsx@4.20.6 tsx scripts/merge-incidents.ts ...` worked without changing project dependencies.
- Additional verified same-event leads still unmerged: Abande market `69d40c4223663dfd76c3e123` / `6aef164a4eb3d454f18fb651` (both cited sources identify 3 February, not March 31; casualties differ between police 5, traditional ruler 7, and former councillor 17). Rimi DPO `6aae5e7849374bb7212fa3c5` / `6aef16644eb3d454f18fb6ce` (both sources name Muhammad Sani Kabir, Magaji, Maigemu and three killed attackers; PUNCH says Friday 13 February and Premium Times Thursday 12 February; 1 police injured versus 3 security personnel). Both need uncertainty-aware identity/toll correction before applying merge, not the merge tool's unqualified maximum. The five clerics at Yari residence versus six on Bakura road remain unresolved: Premium Times explicitly notes the competing reports and the army denies an abduction at the residence; no shared victim names establish identity despite the agent's proposed merge.
- Further batches 4 and 5 absorbed three more records: Abangbe Dilu four abductees, Adoka six mourners (a later release report), and Duru-Kamang cattle raid (identical article republished 45 days later). Manifests and before/after snapshots: `scratch/duplicate-review-20261108-all-pairs/batch-4/` and `batch-5/`. The merge tool reported 997 active and date integrity PASS. The public API timed out twice after batch 4, so API and rendered-page checks for batches 4 and 5 remain outstanding.
- More important open lead: `6aef436f30ce82517547f2e8` is AFP's account of the same Nov 2 Sokoto-Gusau election-security bus ambush as survivor `6ae8efa0eec24a506cafbd4a`, based on the bus, police travelling from Sokoto, Senate primary, and police officials. AFP reports eight killed, five abducted and three injured, while other accounts report five killed. Do not blindly invoke the merge tool's highest-toll rule; reconcile the conflict and preserve uncertainty first. `6aef4376edaa11f6b0d89ebe` is a separate or conflated Reuters account of a police/CPG vehicle near Gidan-Giye, Tsafe; relationship to the AFP Gidan Kano incident remains unresolved.
- Kasuwan Daji (`6aae6253e48e98b0fd184530`, `6aef41e26afc55713f8e3af6`) is the same market attack according to Al Jazeera and BBC, on Saturday 3 January rather than the older record's 4 January. The older record also asserts 10 abducted and zero injured without support in those two sources; reconcile evidence and correct the date/tolls before a merge. The older Bukkuyum/Anka 50-death pair remains unmerged: its 150 motorcycles, toll and date are highly suggestive but both Anka record URLs are 404; the alternate location and its 10-abducted assertion have not been independently grounded.
- A read-only Go review returned candidate leads in `ranked.json` indices 69-110, not an applied or fully independently verified decision ledger. Next check Yobe Lamusuri records `6a981e0b7c9728c85213109d` and `6a982c0b88df506a04cbff10` against the same Sept 1 military operation; Abande market `69d40c4223663dfd76c3e123` and `6aef164a4eb3d454f18fb651` (31 March vs Feb 3 date); and Ogun `6aef16e44eb3d454f18fb872`/`6aef16e44eb3d454f18fb874`. The eight Millennium City rescue victims were recovered across several operations, so do not assume the report proves one original abduction. Do not accept any agent finding without checking actual sources and live record state.
- Further source-reviewed merges: batch 2 `scratch/duplicate-review-20261108-all-pairs/batch-2/run-2026-11-08T00-13-11-148Z/` merged three Sokoto-Gusau police-bus duplicates into `6ae8efa0eec24a506cafbd4a`, plus the Kwara-Kogi Eruku-Iyemero abduction, Okporojo Ebonyi attack, and Hong Adamawa Gaya-Sikalmi/Garstanu attack. Batch 3 `scratch/duplicate-review-20261108-all-pairs/batch-3/run-2026-11-08T00-14-35-741Z/` merged the Orumba North/South convoy attack and the Zariagi/Lokoja orphanage abduction. Eight records absorbed in total, active 1,008 to 1,000; six survivor API responses 200, eight absorbed API responses 404, six page requests 200; date integrity passed. Sources disagree on the police-bus incident date and precise state: the survivor retains pre-existing Zamfara and November 2; Kaura Namoda was the assignment destination, not the incident location. The Anambra sources disagree on North versus South. These uncertainties are in the merge reasons, not necessarily exposed on the page.
- Fesken/Fasken Rafi, Kebbi (`6aae6308d470b42e8012742d`, `6aef172e4eb3d454f18fb9a1`) is a likely duplicate: Guardian and AFP/Daily Trust describe 20 killed and Deputy Governor Umar Tafida's condolence visit. **Not yet merged:** AllAfrica/Premium Times claims Sunday 14 June whereas Guardian and AFP say the attack preceded the Saturday 13 June visit; neither establishes the older record's 11 June date. Resolve and accurately represent date uncertainty before merging. Confirmed distinct: Abande and Anwase market attacks, separate towns and days per TRT/AFP; Karofi Rukayya and Faduma incidents, distinct victims and days per Daily Trust.
- User requested an individual evidence review of all incidents against each other, including spelling, border and interstate-road variants. **Not complete.** Snapshot: 1,010 active records, 57 pending duplicate reviews. `scratch/duplicate-review-20261108-all-pairs/` contains the snapshot, 509,545 inventoried pairs, and 612 scored at least 10 for prioritization. The scores are crude lexical signals, not decisions; low-scoring pairs are not cleared, and the ranking does not adequately capture spelling variants. `scratch/duplicate-review-20261108-existing/` is the separate existing state/14-day audit, which cannot meet cross-border coverage. Re-run or reconcile against the live database before applying decisions.
- Two source-confirmed duplicates merged with `confirmed-pairs.json`, snapshots and summary under `scratch/duplicate-review-20261108-all-pairs/merges/run-2026-11-07T23-56-50-297Z/`: Riyom two visually impaired abductees (`6aed8ccff11a8d3c51044291` absorbed by `6aea41df25a5bf7a35389a07`), and Maciyan-Kyada patrol IED (`6aef42ff8ce1c2c72c18d3b5` absorbed by `6aef17754eb3d454f18fba63`). Later reports were mistaken for new events. Merge tool reported 1,008 active, date validation PASS, two pair reviews resolved. Public APIs returned 200 for survivors and 404 for absorbed IDs; both survivor pages returned HTTP 200. Source counts were 5 and 3, including two query-string variants of the same Counter-IED article.
- Zamfara 50-death records `6aae60a5244c2dc25e720c37` (Dutse Dan Ajiya/Tungan Duche, Anka) and `6aef166d4eb3d454f18fb6ea` (Tungan Dutse, Bukkuyum) are suspicious but **not merged**. Both sources on the first returned 404. Al Jazeera and Politics Nigeria describe Tungan Dutse on 19-20 Feb and 50 deaths, but do not establish the first record's place is the same incident. Find independent place/victim evidence before deciding. Do not infer identity from date and toll alone.
- Next: review source evidence across all pairs, including lower-scored and cross-state/date pairs, record explicit decisions and unresolved cases, compare new scans against the snapshot, and apply only evidenced merges through `merge-incidents`. The real API checks above do not substitute for visual browser inspection. Existing unrelated changes to `.gitignore`, `scripts/adjudicate-backfill.ts`, and `scripts/drain-pair-queue.ts` predate this work.

## 2026-11-07 Palette: red attacks, neutral killed

- Red now means attacks (`--attacks:#e5484d`); the killed measure is neutral `#c4cbc7` with pill ink `#edf0ee` on `#24282a`, so a death toll is never red. Abducted stays `#3e8ee6`. `--danger:#e5484d` and `--danger-soft:#2e1718` keep error panels and the admin checkbox red now that `--killed` is neutral.
- Touched `src/app/globals.css`, `src/lib/summary.ts` (`MEASURES` colours), the Killed impact key in `IncidentDetailClient.tsx`, the killed pill in `opengraph-image.tsx`, and `DESIGN.md`.
- Verified: `npx tsc --noEmit`, `npm run build` with a disposable `JWT_SECRET`, and computed styles plus screenshots on the overview, `/patterns` (attacks and killed measures), `/map`, an incident page and its OG image. Killed figures stay `#edf0ee` (about 9:1 on the surface); literal black was rejected as unreadable on the dark cards.
- Unchanged: the red brand silhouette, the unused legacy `AttackCard`/`StatCard`/`HorizontalBar`, admin layout. `next dev` re-adds a Next.js agent-rules block to `AGENTS.md`; it was reverted rather than committed.

## 2026-11-07 Scan crash fixed, year backfill built and piloted

- **Why the 2026-11-06 20:00 and 20:37 scans recorded FAILED with every count at zero:** `persistIncidentReviews` upserted an aggregator page title of 2,247 characters against a 500-character schema maximum, `runValidators: true` threw, and the run aborted after ingest but before the sweep, duplicate pass and report. Host log: `ValidationError: title ... length 2247 ... at persistIncidentReviews (incident-review.ts:74)`. Fix: every stored review field is clamped to its schema limit before the write, an invalid `publishedAt` costs the date rather than the lead, and a lead that still fails validation is skipped and counted instead of killing the run. `ScanRun` gained an optional `error` field so a failure records its cause instead of zero counts. Proof: `npx tsx scratch/backfill/e2e-review-limits.ts` against a disposable database, 12/12 (long title, publisher, state and reason clamped; blank reason skipped; bad date stored with null; duplicate-pair writer protected; zero attacks written).
- **Backfill driver:** `scripts/backfill-year.ts`. Explicit `--from/--to/--states`, week cells (default 7 days), two non-Brave lanes (Google News RSS with real date bounds, DeepSeek Search), global URL dedupe, every URL re-run through `reextractSearchLedSource(..., { historical: true })` which skips only the now-relative window check, and publication only through `ingestSearchLedAttacks`. Ledger under `scratch/backfill-year/<run-id>/`: `cells.jsonl`, `candidates.jsonl`, `published.jsonl`, `summary.json`, `coverage.json`. Dry run by default; `--resume`, `--status`, `--coverage`, `--apply`.
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
  - `run-backfill-promotions.ts` runs each promotion through the audited tool, turns a guard refusal into a source attach on the named blocker, and resolves the review row with a note. It also collapses promotes within the same place and 2.5 days before running.
  - Final state: **1,002 active** (691 before the backfill), 29 tombstones, `/api/stats` agrees. Absorbed ids `6ae8efb2eec24a506cafbd74`, `6ae79e376a4d789018ff0eb5` and `6aef434ab6a15fb7cf887a67` return 404; survivors and a promoted record (`6aef41e26afc55713f8e3af6`) return 200 from the API and render 200.
  - Decisions and artifacts: `scratch/backfill/adjudication/` (pairs.jsonl, held.jsonl, held-rescued.jsonl, held-apply.jsonl, promotion-outcomes.json, held-apply-report.json) and `scratch/duplicate-audit-20261107-final/`. Copied to `/srv/terror-tracker/backfill/adjudication/` so they survive the dev machine.
  - Still open: the 194 pending duplicate rows in the queue are mostly stored-pair rows from before this pass; a further audit of 1,002 records will surface new candidates as records are added. The recall sample was not run.
- **Recall sample and the one automation fix both reviewers ranked first (2026-11-07).**
  - 22 jurisdiction-weeks (one high-volume and one mid-volume state per month, the week with the most records). An independent Claude WebSearch/WebFetch pass found **36 events, 29 already present, 7 missing: 81% sample recall**. Interval is wide at this size; re-sample after the fix.
  - All 7 misses failed identically: the article states only a weekday ("on Sunday") and the page's publication date was not extracted, so `dateEvidenceFromText` returned "no explicit incident date" and the event was dropped.
  - Cause, traced rather than guessed: `absorbResults` built `DiscoverySource` from url/title/publisher and dropped `NewsDiscoveryResult.date`. `fetchAndExtract` already falls back to `u.publishedAt`. Fix: carry the search result's date into `DiscoverySource`, and let `reextractSearchLedSource` accept `source.publishedAt`.
  - Proof: `npx tsx scratch/backfill/e2e-publication-date.mjs`, **5/5** against a local fixture page: a dated weekday-only report resolves to the preceding Sunday and is admitted, an undated one stays a review lead and is not inserted.
  - Terra and Sonnet reviewed the automation gaps independently and ranked the same change first. Other agreed items, not built yet: close refused promotions in the daily path (the backfill driver does this), and mark budget-exhausted duplicate holds so they are retried rather than accumulating. Both said do not automate toll conflicts, ambiguous dates, or any merge outside `equiv`/claim linkage.
- **Queue drain completed (2026-11-07).** All 191 held duplicate leads are decided and the queue reached **0 pending duplicates**:
  - 67 `same_event`: 56 source attaches with the row resolved, 11 dismissed because the toll conflicted and no claim link existed.
  - 124 `promote`: most were refused by the nearby-place guard and attached to the blocking record instead; a small number became records (active count 1,002 to 1,007); 46 had no settlement or LGA and were dismissed with that reason after a rescue pass read the article; the last row was the Tribune police-convoy report, attached to the existing Sokoto-Zamfara ambush record.
  - Applier: `scripts/apply-queue-decisions.ts` (dry run by default, idempotent, skips closed rows). Rescue/close: `scratch/backfill/queue/rescue-and-close.mjs`.
  - Note: the scheduled scan creates new holds. The queue is not permanently empty, which is why the agreed automation item is to run this pass after each scan.
- **Extraction and fetch backlog drained to zero (2026-11-07).** `triage:reviews --apply` dismissed 136 exhausted rows plus 6 permanent rejections; the remaining 37 were made due and retried through `retryIncidentReviews` until their attempt budget was spent, then a second sweep dismissed 47. `scratch/backfill/drain-reviews.mjs` is the repeatable loop. Every pending row of every kind is now closed: `pending: 0`.
- **Final duplicate pass after the promotions.** The audit found 2 fresh pairs, both created by today's promotions: Binnari (62 killed, four-day gap from a late reaction story) and Tungan-Bako (Islamiyya abduction, 14 across four sources versus 15 in one, two-day gap). Both merged into the older, richer records with the variance recorded. Absorbed ids return 404, survivors 200, `/api/stats` reports 1,007. Net since the start of this work: 691 to 1,007 active.
- **Automatic queue drain shipped (2026-11-07).** `scripts/drain-duplicate-queue.ts` runs after every scan from `run-scan.sh` (12 rows per run, best effort so a queue failure never fails a scan). It exports the pending held duplicate leads, adjudicates them against the record they collided with, applies the decisions, and dismisses a state-only lead with the recorded reason instead of leaving it pending. Artifacts go to `/var/log/terror-tracker/queue-drain/<timestamp>/summary.json`.
  - Proof: `scratch/backfill/e2e-drain-live.mjs` plus `e2e-drain-verify.mjs`, against a disposable database seeded with one stored incident and one held duplicate naming the same victim. The real drain exited 0, the row resolved, the source was attached, one record remained, and the disposition note was written: **4/4 checks**, `pendingAfter: 0`.
  - Bug found while proving it: the script used the native-collection `.project()` on a Mongoose model, and the error path left the connection open, so the process hung instead of exiting. Both fixed.
  - The scheduled scan had already produced 66 new holds by the time this was built, which is exactly the recurrence the drain exists to stop. At 12 rows per scan it drains over a few runs; it is a bound, not a promise of an empty queue at all times.
  - First production run (`/var/log/terror-tracker/queue-drain/2026-11-07T21-30-10-410Z/`): 12 pending, 9 exportable, 9 decided, 4 dismissed, 2 guard-blocked and attached, 0 failed, pending 66 to 57, exit 0.
  - Caveat found by that run: the drain handles **single-candidate held leads**. A stored-pair row (two candidates in one row) is skipped by this path and still needs the pair adjudicator or a merge. Those are the ones the audit produces, and they should be closed by the audit workflow, not this drain.
- **Stored-pair pass built but deliberately kept manual (2026-11-07).** `scripts/drain-pair-queue.ts` adjudicates a stored pair with claim linkage, merges eligible pairs through `merge-incidents`, and dismisses the rest as distinct events. On a live pair it exceeded 17 minutes without producing a decision, because each side can fetch two articles and run a claim-extraction model call per article. That does not fit a scan slot, so it is **not** wired into `run-scan.sh`. Run it by hand with a small limit:
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
- Verification: `npx tsc --noEmit` and `npm run build` pass. Focused ESLint leaves five `react-hooks/set-state-in-effect` errors in lines this change did not touch (admin page, incidents deep-link effect and loader, incident reload); they fail the same way on main. E2E `node scratch/v5-redesign-e2e/v5-e2e.mjs [baseUrl]` passed 9/9 against the local dev server on the production database (read-only): overview totals equal `/api/stats`, controls, map deep links, incidents deep links and pagination, share URLs, preview PNG, sheet focus return, state 200/404, phone overflow and tab bar, design rules, console, admin login. Screenshots and `results.json` sit beside the script.
- Shipped to main as 7832101 plus 8c0f3a1 (heatmap screen-reader labels escaped the scroll area and widened `/patterns` by about 300px on phones; the local run missed it because it checked before data loaded, and the script now waits for content). The E2E passed 9/9 against production on 2026-11-04.
- Open finding, not caused by this change: production pages carry a Google tag (`G-YMCW9KY30X`, loader at `/bi6p/`) that is not in the repo, so the host injects it, and the site's CSP blocks it (two inline scripts and the loader). Analytics from that tag are therefore not running. The E2E records these blocks in `results.json` under `cspBlocks` instead of failing. Fix by removing the host injection or by allowing the tag in the CSP in `src/proxy.ts`; that is the user's call.
- Not verified: real phones and Safari, the authenticated admin workspace, and Plus Jakarta Sans glyphs in the browser beyond the catalogue's file check. The preview image renders in the default `next/og` font, so weights there are regular.

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
  - The paraphrase rescue could never fire: `findTollSentence` returns a raw sentence, but support was tested with `normalizedArticle.includes(quote)` (lowercased) and `quoteSupported` was not recomputed. Every real sentence starts with a capital, so a rescued quote failed and the figure was dropped anyway.
- Also changed: an open minimum keeps the written figure (`20` with `max: null`) instead of becoming 21, in both the heuristic (`free-news.ts`) and the model path; open minimums now use `precision: "range"` so the UI renders `20+` rather than "About 20"; and a record holding a range can no longer sit at `unconfirmed`, matching the rule the heuristic path already applied.
- Backfill: `scripts/backfill-dropped-tolls.ts` re-runs the real extraction path for a record's own source and fills only empty casualty fields, never overwriting a stated figure. Event identity is decided by `sameIncidentIdentity` on the repository's strict place rules: the event day must match, a known settlement that differs is never overridden by an LGA that agrees, a known LGA that differs rejects the match, and at least one comparable place field must agree. Exactly one identity match is required across every event the article yielded. The write is guarded on the record still being active and still empty in those exact fields. `--self-test` proves the identity rules without touching the database. Applied to `6ae6f5b61311f55c9af2ab68` (killed 20+, status `developing`) and `6ae3a94df00297451eff4040` (Plateau, killed 1 / injured 1). Artifacts under `scratch/backfill-dropped-tolls/`.
- Review with GPT-6.1 Sol (the Codex lane; Terra was retired) ran two rounds, both REVISE, every finding fixed: the backfill could pick a different event, the support check still accepted any verbatim quote through an `||`, a rescued sentence could borrow another category's minimum qualifier, the write was not conditional, and LGA agreement could override a settlement conflict. `countQuoteSupports` now delegates to `tollClause`, the model quote is accepted only when that clause test passes, the minimum qualifier is read from the matched clause (`"twenty were killed and at least five were injured"` keeps 20 exact and 5 open), and the backfill update is filtered on the fields it expects to still be empty. A third full review was not run, per the two-repair-round cap.
- One consequence worth knowing: the Plateau record's 1 killed / 1 injured now stands on its own source sentence (`"one of the victims, identified as Talatu Sunday, 67, had been shot dead"`) rather than on a clause match, because the tightened gate treats the appositive commas as clause breaks and no longer reproduces that figure. The stored data is correct and quoted; a re-run would not overwrite it.
- Proof: `npx tsx scratch/probe-toll-grounding.ts` (gerund grounds, rescue finds the sentence, "three killed, seven abducted" still refuses to cross categories, the mixed-qualifier sentence keeps each count's own qualifier, 20+ rendering). Live re-extraction of the Truth Nigeria article still returns `killed: 20, precision: range, max: null` through the tightened gate; the rendered page shows "20+ minimum reported count" with the quote and status Developing. tsc, focused ESLint and `npm run build` pass.
- Older records reviewed (11 audited, plus the two already filled): only one carried a figure the pipeline could not produce. `6a966de9a83adf70ab8f836c` (Kogi communal clash) now has killed 2 / injured 1 from the police statement quoted in Daily Trust, written through the new `--curated` mode of the backfill script, which only fills empty fields and guards the write the same way. The others are genuinely "not reported": six name a single victim with no count ("kill pastor's son", "kill senior Army officer"), one is a HURIWA statement with no toll, one a multi-community Taraba wave where the only number (two young men) belongs to one community, and one a Kogi-style clash whose article was rejected by the model. None were changed.
- `reextractSearchLedSource` now takes a `reachHours` for both the publication age and the event interval (default 336, the widest scan window). The scan itself is unchanged; a backfill may read further back because the record already exists. The strict identity rules still decide which event in the article is the record's.
- Flagged, not changed: `69d885dc541e36db9be7bb9a` is titled "Terrorists Kill Scores in Niger Communities" but its Zagazola source says security forces killed scores of the bandits attacking Bagna and Erene. There is no civilian toll in the article, and as a security-force operation with no victim casualties it may be out of scope. Fixing or deleting it needs a decision; nothing was written.
- Fixed the last open item from the Luna round: `groundingCheck` is now category-aware. `GroundingInput` carries `tolls: { value, victims }[]` instead of a flat list of figures, and the check asks `tollClause(quote, value, victims)` for each, so "20 were injured" can no longer anchor a killed toll. The unused `VICTIM_NOUNS` window test is gone, `TollCategory` is exported from `quote-grounding.ts`, and `scripts/adjudicate-duplicate-reviews.ts` builds the pairs from both records' own categories. Proof: `scratch/probe-toll-grounding.ts` now asserts a killed toll grounds and the same figure as an injured toll does not; `scratch/probe-quote-gate.ts` (10/10) and `scratch/e2e-adjudicate.mjs` (14/14, real CLI on a disposable database) both still pass. The E2E's same-event fixture is held earlier, at `claimsLink`, so it does not exercise the new branch; the probe does.
- Review with GPT-6 Luna (read-only audit) raised five more items. Fixed: the backfill now runs the incoming value and its meta through `normalizeCasualtyFields` before writing, so a range cannot carry min > max and an "unknown" meta cannot publish a number; the multi-event place gate now matches a settlement as a whole word (`textNamesPlace`) instead of a substring, so "Bori" no longer matches "Borin"; and the probe covers a cross-category matrix, the qualifier variants and the place-prefix case. Rejected as mistaken: its claim that "20 people were injured" can ground a killed count, because `tollClause` reads `TOLL_NOUNS`, not `VICTIM_NOUNS`, and the probe proves that pair plus four others are refused. Accepted ambiguity: "casualties" stays in `TOLL_NOUNS.killed`. `/api/stats` matches a direct database sum exactly (623 records, 2253 killed, 582 injured), so an open range flows through as its representative value.
- Data written: Ribah `6ae6f5b61311f55c9af2ab68` killed 20+ / developing, Plateau `6ae3a94df00297451eff4040` killed 1 / injured 1, Kogi `6a966de9a83adf70ab8f836c` killed 2 / injured 1.

## 2026-10-29 Two daily scans and DeepSeek Search lane

- Schedule (repo only, uncommitted): `deploy/systemd/terror-scan.timer` is now `*-*-* 08,20:00:00 UTC` (09:00 and 21:00 Lagos). The weekly catch-up moved from Sunday 19:30 to **Sunday 14:00 UTC** because 19:30 would overlap the 20:00 slot and `run-scan.sh`'s flock turns an overlap into exit 75 plus a failure alert. `SCAN_HEALTH_STALE_HOURS=18`, the hourly watchdog and the 20:30 UTC dead-man were left alone (healthy worst case is about 13 h). **The live server keeps its own copies of the timers**: copy both to `/etc/systemd/system/`, `systemctl daemon-reload`, `systemctl restart terror-scan.timer terror-scan-weekly.timer`, then check `systemd-analyze calendar "*-*-* 08,20:00:00 UTC" "Sun 14:00:00 UTC"` and `systemctl list-timers 'terror-*'`. Not verified locally (no systemd on this machine).
- Risk of 12 h gaps: publisher feed first pages hold 20 min to about 2 h, so recall leans on the search lanes and on the feed paging in `discovery-feeds.ts`. Ship them together.
- DeepSeek Search provider (uncommitted): `src/lib/news-discovery.ts` has provider `deepseek`, `POST ${DEEPSEEK_BASE_URL}/v1/tools/search` with the existing `DEEPSEEK_API_KEY`, `$0.75 per 1,000` successful calls, billing starts 2026-11-01 00:00 Beijing time. Freshness is an `after:YYYY-MM-DD` suffix on the query, clamped to 128 chars. 401/403/429 and 402 are BLOCKED; 402 also sets a process flag so the rest of the scan skips it. It is not the model's `web_search` tool (that is `deepseek-v4-pro` only and the model picks the queries).
- Lane order in `collectSearchLedIncidents`: primary lane per state is DuckDuckGo, Google News, DeepSeek Search; Brave then Bing only when that lane found nothing or all of it failed. Chosen over Brave-first because Brave ran dry on 2026-10-16 as fallback-only, and 37 states x 2 runs x 30 days is about 2,200 calls a month. Reordering is a one-line change. Switches: `NEWS_DISCOVERY_ENABLE_DEEPSEEK_SEARCH=false`, `DEEPSEEK_SEARCH_MIN_DELAY_MS` (default 250). Cost is about $1.70 a month at this volume.
- `src/lib/search-lane-health.ts` now also raises "DeepSeek Search rejected the key or balance" (401/402) and "DeepSeek Search failed for N of M states" (half or more); `deploy/search-lane-alert.sh` text updated.
- Proof (real API, key from `.env.local`): `scratch/deepseek-search/probe.mts` (6 states, 10 results each, all inside the 168 h window, mostly direct publisher URLs; `deepseek-chat` still answers, served as `deepseek-flash`; results in `probe-result.json`). `e2e-lane.ts` through `collectSearchLedIncidents`, Brave removed, feeds off, Plateau/Zamfara/Benue: baseline 44 URLs and 10 admitted, with DeepSeek 57 URLs and 15 admitted (adds The Sun, Tribune, New Telegraph, a Gwom-Ajang/Barkin Ladi record); outputs `e2e-baseline.json`, `e2e-with.json`, `summarize.mjs`. `e2e-failures.ts` (stub server: 401, 402, 429, 504, non-JSON, no results array, empty, over-length query, junk results) and `e2e-collector-stub.ts` (402 stops after one request and raises the alert, kill switch sends none) all pass; outputs `e2e-failures.txt`, `e2e-collector-stub.txt`. tsc, ESLint on the three changed lib files, and `npm run build` pass.
- Not done / unverified: a full 37-state scan with the new lane (about 9 s per state per lane, so expect a longer run); the DeepSeek top-up and balance monitoring beyond the 402 alert; whether DeepSeek keeps `deepseek-chat` as an alias (it works today).

## 2026-10-29 Gero duplicate and source coverage gaps

- Gero (Jos South, Plateau, Mon 26 Oct): `6ae2e99a391f0d066703fcea` (dated 29 Oct from Blueprint's publish date, 6 killed) merged into `6ae09aa666d3220b5353fc0e`. Survivor is now Gero, 6 killed / 1 injured (Plateau police revision of the community's 7), `confirmed`, 10 sources including Channels TV, Premium Times, PUNCH, ThisDay, News Central. Six pending duplicate rows closed ("same event already recorded", `scratch/source-gap/close-gero-rows.mjs`). Artifacts: `scratch/duplicate-reconciliation-20261029/`, pair file `scratch/source-gap/pairs.json`. The adjudicator holds such rows because the candidates name no victims; they need a person.
- Why the sources were "missed": Channels and Premium Times are registered feeds. (1) Brave's monthly quota ran out 2026-10-16 18:55 UTC; since then every scan is feed-only (about 55 URLs per run against about 175) and DEGRADED, and nothing alerts on that. Needs a top-up or a Brave-independent search lane (not done). (2) Feed first pages hold 20 minutes (Leadership) to about 2 hours (Premium Times, Daily Trust, Blueprint) while scans run hours apart.
- Implemented (uncommitted): `src/lib/discovery-feeds.ts` now reads older feed pages (`?paged=2..N`, `SEARCH_FEED_PAGES`, default 3). Page one is required; older pages are best effort and stop on error or when a page repeats page one (Daily Post, ICIR, and PUNCH from Node ignore `paged`). Real-feed run, 168 h window: 33 incident-headline articles at depth 1, 45 at depth 3 (`scratch/source-gap/e2e-feed-depth*.txt`; `npx tsx scratch/source-gap/e2e-feed-depth.ts`). tsc and ESLint clean; `npm run build` not run.
- Implemented (uncommitted): Brave-independent search lane. `src/lib/news-discovery.ts` has a `googlenews` provider (Google News RSS search, `hl=en-NG gl=NG`, `when:` from the freshness setting). RSS links are wrappers, so each is resolved to the publisher URL through the same signed `batchexecute` call the Google News page makes; an item that does not resolve is dropped, never passed on, and a list that resolves to nothing is a FAIL. Suppressed hosts are skipped before decoding. `collectSearchLedIncidents` now runs DuckDuckGo and Google News as the free lane (a failed lane only counts when both fail, so Brave is no longer called when Google News works). Kill switch: `NEWS_DISCOVERY_ENABLE_GOOGLE_NEWS=false`. Unknown risk: Google can rate-limit or change the endpoint; the failure shows as a `googlenews` search failure in the report.
- Proof (no DB writes, Brave key removed, feeds off, Plateau/Zamfara/Benue, 168 h): without the lane 19 URLs, 3 incidents, no Channels/Premium Times/PUNCH; with it 30 URLs, 8 incidents including Channels, Premium Times, PUNCH and PM News on the Gero attack. Files: `scratch/source-gap/e2e-google-news-lane.ts`, `e2e-gn-baseline.json`, `e2e-gn-with.json`, `summarize-gn.mjs`; failure paths `e2e-google-news-blocked.ts` (429, consent page, undecodable links, empty feed) and `e2e-google-news-negatives.ts`. A full 37-state scan was not run; expect it to take longer (about 9 s per state here).
- Implemented (uncommitted): search-lane alerting. `src/lib/search-lane-health.ts` (`searchLaneAlerts`, `probeBraveLane`) turns a down lane into report text; `scripts/search-led-scan.ts` writes it to `searchLaneAlerts` in the JSON report, the step summary and a `SEARCH LANE ALERT` console line. Brave is only a fallback now, so a healthy scan never calls it and would never see the quota gone; the scan therefore makes one single-result Brave query per scan. `deploy/search-lane-alert.sh`, called at the end of `run-scan.sh`, emails once per UTC day (stamp `reports/.search-lane-alert`), clears the stamp after a clean scan, never arms a retry and never changes the scan's exit status. **Host steps needed:** copy `search-lane-alert.sh` and the edited `run-scan.sh` to `/srv/terror-tracker/` (chmod 755) and redeploy the scan image; until then run-scan.sh just logs a missing-script line. Proof: `bash scratch/source-gap/e2e-search-lane-alert.sh` (17 checks) over real reports from `make-lane-report.ts`; jq and curl are stand-ins in `scratch/source-gap/fake-bin/` because neither exists on this machine, so no mail was sent through Resend.
- Not done: a faster feed-only pass, `npm run build`.

## 2026-10-29 Binari Duplicate (reaction-story date)

- Merged `6ae21fca1ba9bec263679ff9` (dated 28 Oct, "about 80", Senate-resolution sources) into `6adc95a93489bd12ce24c502` (Binnari, 23 Oct). Survivor keeps 58 killed; NEMA's 62 is an open toll conflict. Artifacts: `scratch/binari-dup/merge-run/`.
- Cause: the date came from the page dateline/weekday of a reaction story, and the duplicate lookup only searches +/-1 day, so the earlier record was never compared. Fix implemented (uncommitted) from `scratch/binari-dup/ingest-fix-plan.md`:
  - `src/lib/free-news.ts`: `dateEvidenceFromText` no longer takes a full date equal to the publication day when it is not introduced by on/of/a weekday (page dateline), nor a weekday/today/yesterday/date that directly follows a reacting body (Senate, House of Reps/Assembly, plenary, governor; not "governor's"). New export `hasOnlyNonEventDates`.
  - `src/lib/deepseek.ts`: `cleanAndConfirmIncident` sends the candidate to review when the model's date quote, judged with the 80 characters before it, is only a dateline or reaction date. Probed on the real Blueprint page: the original code confirmed it as 28 Oct, the fix returns review.
  - `src/lib/search-led-discovery.ts`: the duplicate lookup loads records within 336 h; the deterministic merge keeps its 24 h tolerance; the semantic check uses 336 h only when the town is `placesPlausiblySame`. A cross-day `same_event` is held, never merged. Location rules untouched.
  - Proof: `npx tsx scratch/binari-dup/e2e-ingest-fix.ts` (14/14, `scratch/binari-dup/e2e-results.json`; baseline before the fix was 10/14). tsc and build pass; ESLint on the three files has only two pre-existing warnings in deepseek.ts.
  - Cost: a town hit twice within 14 days now sends the second report to the model instead of inserting it; with the model off it is held. Active pairs in this window were 9 of 591 records before the two merges.
- Kwi (Plateau, 8 Oct): merged `6ad0bf496f6815ca64af1c28` into `6ace412cc9fe030f71d579ba` after re-reading sources (Eagle, Legit.ng, Truth Nigeria). The 25 Oct dismissal (review `6ad0bf6b9a5e030f6a77377d`, "different events") rested on injured-vs-killed, but the Truth Nigeria article says the officer died. No shared victim name, so confidence is high, not certain. That review row's disposition note was left as written and is now wrong. Artifacts: `scratch/binari-dup/merge-run-kwi/`.
- Binnari held duplicate rows: five (Punch 26, Al Jazeera 62 x2, India Today 62/52, Africa Eye "Benari" 40) were read and resolved as the same event; their sources were attached to `6adc95a93489bd12ce24c502` (now 24 sources). The adjudicator holds these because the held candidates have LGA "Unknown" or the spelling "Benari"; the disposition was a one-off, `scratch/binari-dup/disposition-binnari.ts`, snapshots in `scratch/binari-dup/disposition-apply/`.
- Toll set to NEMA's 62 killed, 52 injured (TVC quote, `merge-incidents` override, `scratch/binari-dup/pairs-toll.json`, artifacts `scratch/binari-dup/merge-run-toll/`); 58 stays in the description. Status stays `developing`. The `casualties_conflict` tag was left on the record. About ten `extraction` rows for the same attack (ThisDay 30, Daily Post 50, Blueprint 50, AP/Kelo 40, Daily Post Senate 80) stay pending as leads; they are evidence-grounding failures, not duplicates.

## 2026-10-28 Self-Hosted Migration Off Netlify (in progress)

- New target: the Contabo box `ops@185.216.203.128` (Ubuntu 26.04, 4 vCPU, 7.9 GB, Docker 29, Caddy already serving `sloplens-api.tryraisins.dev`). `tryraisins.dev` is on Cloudflare nameservers. Decision: keep the whole Next.js app as one server behind Cloudflare (proxied, Full strict), not a static frontend + separate API. The app is request-time throughout (`layout.tsx` `await connection()`/`headers()`, `incidents/[id]` `force-dynamic`, `proxy.ts` nonce CSP, 14 route handlers) and deliberately same-origin (`sameSite: "strict"`, CSRF origin allowlist, `connect-src 'self'`).
- Code added: `Dockerfile` (targets `runner` = standalone, `scan` = full source + node_modules), `.dockerignore`, `.github/workflows/publish-image.yml` (GHCR + auto-deploy on push to `main`), `deploy/` (compose, deploy.sh, run-scan.sh, scan-alert.sh, scan-deadman.sh, Caddyfile.snippet, env examples, 10 systemd units, README), new `/api/admin/scan-runs`.
- `next.config.ts` emits `output: "standalone"` only when `BUILD_TARGET=container`, so the Netlify build keeps its current shape until the hostname moves. Do not make it unconditional.
- `getClientIP` (`src/lib/security.ts`) now reads `cf-connecting-ip` first, then Netlify's header, then `x-real-ip`. Without this, every visitor behind Cloudflare shares one rate-limit bucket. The Netlify branch is dead code once cutover completes.
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` is inlined into the client bundle at build time, so it is a GitHub **variable** and a Docker build arg, not runtime env. The publish workflow fails loudly if it is missing.
- Alerting: systemd `OnFailure=` → `scan-alert.sh` emails through Resend (`alerts@tryraisins.dev`) and arms one retry 20 minutes later; `terror-scan-alert-final` covers the retry so it cannot loop; `scan-deadman.timer` emails if no report exists for 18 hours. Public `/api/scan-health` now returns only `{lastCompletedAt}`; warnings and run history moved behind the session-gated `/api/admin/scan-runs`, rendered in the admin panel's "Collection health" section. `ScanHealth.tsx` was deleted.
- Verified on the box: image builds in CI and pulls from GHCR (public package), `deploy.sh` passes a Mongo-backed readiness probe, the app serves `/`, `/api/attacks`, `/api/stats`, `/api/scan-health` on `127.0.0.1:3001`, and `/api/stats` matches production exactly (586 attacks, 2279 killed), so the box is on the production database. `/api/admin/scan-runs` returns 200 with a minted session and 401 without one. Public HTML contains no "overdue" text.
- Auto-deploy works end to end: the CI SSH key is pinned with `command="/usr/local/bin/terror-deploy.sh"` and `restrict`; the wrapper accepts only a 40-character sha. `DEPLOY_ENABLED=true`, `DEPLOY_HOST=185.216.203.128`, `DEPLOY_SSH_KEY` and `DEPLOY_KNOWN_HOSTS` are set. Note `sudo -n` is required because compose must read the root-owned env files.
- The scan now runs from the host, not GitHub Actions. `terror-scan.timer`, `terror-scan-weekly.timer` and `scan-deadman.timer` are enabled; the `schedule:` block is gone from `daily-scan.yml`, which is now `workflow_dispatch` only. `BRAVE_SEARCH_API_KEY` and `DEEPSEEK_API_KEY` were taken from the developer's `.env.local`, and Resend is live (sender `alerts@tryraisins.dev`, recipient `tryraisins@gmail.com`), so `scan-alert.sh` delivers for real. Verified: a manual `run-scan.sh` run and then `systemctl start terror-scan.service` each completed 37 states in about 5 minutes with exit 0, wrote the report, archived a copy and recorded a `ScanRun`; the alert unit emailed and armed the retry, and the dead-man check reported "nothing to do" on a fresh report.
- `scan-alert.sh` and `scan-deadman.sh` read the four keys they need out of `scan.env` with `read_env` instead of sourcing it. Sourcing broke on `ALERT_EMAIL_FROM=Terror Tracker <alerts@...>` (unquoted `<` is a shell syntax error) and would have evaluated anything a future value contained. `ALERT_EMAIL_FROM` is a bare address now; the scripts add the display name.
- Staging verified 2026-10-28. `new.tryraisins.dev` is proxied through Cloudflare and served by Caddy from the box. Caddy 2.6.2 holds a real Let's Encrypt certificate for it (issued over HTTP-01, which works through the proxy; `disable_tlsalpn_challenge` is required). Through Cloudflare, `/api/version`, `/api/attacks`, `/api/stats`, `/api/scan-health` return 200, `/api/admin/scan-runs` returns 401, and `/api/auth/login` returns 400 rather than 503, which proves the Turnstile secret and the hostname allowlist are wired. Origin TLS also answers 200 when Cloudflare is bypassed.
- Caddyfile gotcha: this box has Caddy **2.6.2**, which has no `trusted_proxies` global option (2.7+ only). Adding it makes the whole config fail to parse and the reload fail. `deploy/Caddyfile.snippet` documents this. The reload failure left the running config untouched, which is why `sloplens-api` stayed up.
- **Cutover done 2026-10-28.** `terrortracker.tryraisins.dev` is now a proxied A record to `185.216.203.128`; Caddy holds Let's Encrypt certificates for it and for `new.tryraisins.dev`. The public `/api/version` buildId matches the box exactly, so the domain is served from the host and not Netlify.
- Smoke test through Cloudflare after cutover: `/`, `/incidents`, `/about`, `/map`, `/admin`, a detail page with real content, its OG image (PNG), `/sitemap.xml`, `/robots.txt`, `/manifest.json` and every public API all return 200; `/api/auth/check` and `/api/admin/scan-runs` return 401; `/incidents/not-an-id` returns 404; `http` redirects 301 to `https`. Edge caching behaves without any Cloudflare Cache Rule: `/_next/static/*.css` is `public, max-age=31536000, immutable` and went MISS then HIT, while HTML stays `no-store` and `DYNAMIC`.
- Fixed 2026-10-28: the soft 404. `incidents/[id]/page.tsx` called `notFound()` only for malformed ids, so a well-formed id pointing at nothing rendered a "record not found" body with a 200. It now 404s for any id with no record, keeps the client error state for a database failure, and `src/app/not-found.tsx` renders a branded 404 with `noindex`. Verified on production: missing id 404 with the branded page, malformed id 404, unknown route 404, real record 200.
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
- Phase 2 review corrections: an in-window row that has already spent its retry budget now falls through to the exhausted disposition instead of being silently skipped, the requeue list excludes already-retryable rows so a dry run and an apply report the same number, the docblock lists five dispositions, and `retryIncidentReviews` uses `WIDEST_SCAN_WINDOW_HOURS` so the cutoff and the retry window cannot drift.
- `scratch/e2e-late-reports.mjs` is the repeatable artifact: 12/12 against a disposable database, covering 335h requeued, beyond-window dismissed, month_only inside the window requeued, date_range beyond it dismissed, missing and null candidates pending, a spent budget exhausted, an already-retryable row untouched, dry-run and apply counts agreeing, and a second sweep changing nothing. Note for future work: the sweep compares interval END, and an exact-day interval ends at 23:59:59, so a date a few hours past the window can still be inside it. My first fixture got that wrong, not the code.
- Phase 3, first increment 2026-10-28. The grounding gate used to withhold an entire incident when one casualty figure had no quotable support. Now `cleanAndConfirmIncident` rescues the figure first (`findTollSentence` in `src/lib/quote-grounding.ts`: the number must sit in a sentence next to a victim noun for that field, digits, words or comma-grouped), and only drops the figure when no sentence supports it, recording the incident with an unknown toll instead. `droppedCounts` is returned on `DeepSeekCleanupResult` so the loss is visible. Date and location still reject, because an incident without them has no identity. `scratch/probe-toll-rescue.ts` is 6/6.
- Measured the extraction backlog before building further: 35 date or location unsupported, 33 other, 27 multi-event or roundup, 19 casualty quote unsupported, 15 model count disagreement. So the casualty fix alone cannot drain it. A five-row production sample through `scripts/requeue-extraction-reviews.ts` confirmed that: all five were held, none resolved, because they were disagreement and roundup rows.
- `scripts/requeue-extraction-reviews.ts` makes due extraction rows due now and hands them to `retryIncidentReviews`, the same path the scan uses. Dry run by default. The rows are already retryable and due 93 at a time, so the scan is retrying them anyway and failing; the script exists to force a batch after a grounding change.
- Cross-session reconciliation 2026-10-29. A commit from a separate Claude Code session (fe3ae1e, "Stop reaction stories dating incidents and widen the duplicate lookup") landed in the middle of this work and its diff swept in two of my in-progress declarations (`multiEventArticle`, `usedEvidence`), so `git blame` attributes them to the wrong commit and reverting fe3ae1e alone would break the later one. An Opus review of the two sets found them compatible but opened four defects, all now fixed: the non-event-date rule made a bare publication-day quote reparse to null, and the old `Boolean(reparsedDate && ...)` form read that as "no mismatch", so a model date one day off could pass; the toll rescue was still running for multi-event articles despite the comment saying otherwise; the multi-event place check ran before the general guard, so rejections named the wrong cause and a state-only record could never degrade; and the one-sentence-per-event check compared raw sentences against normalised quotes, so it could miss a borrowed sentence. The admin row also lost the stored record id that a held lead needs, now restored with a link.
- Still open from that review, deliberately: the adjudicator's `limit` always takes the 25 oldest duplicates, so cross-day holds and stored pairs can starve decidable rows; the audit script's URL grouping strips the whole query string and its evidence rule differs from ingest (it checks casualty quotes, accepts town or LGA, and flags rescued dates); and a page that carries both a dateline and an introduced date can be rejected by the dateline because the guard checks the first occurrence. None of these can publish wrong data; they cost throughput or reviewer time.
- Phase 3, second increment 2026-10-28/29. Two things:
  - Date rescue: when the model's own date quote is not in the article, `cleanAndConfirmIncident` re-derives the date from the body (`dateEvidenceFromText`) and accepts it only when it lands on the same day or interval. A different date is never substituted silently.
  - Location degrades instead of rejecting: a named settlement is `exact` even when the LGA is unstated, an LGA without a settlement is `approximate_lga`, and a state on its own is `approximate_state`, which is exactly what AGENTS.md's field conventions describe. Previously any Unknown LGA or town rejected the incident.
- The real blocker was the retry treadmill: a re-extraction that returned no incident and no new lead left the row pending, incremented the attempt counter and repeated until the budget ran out. `retryIncidentReviews` now dismisses that case with "Re-read the source and it reports no eligible incident any more", which is a conclusive answer rather than a failure.
- Measured effect on production: two batches of 8 and 19 due rows produced 3 resolved, 12 dismissed as no-eligible-incident, 12 held, 2 records inserted and 1 merged. Two inserted records (Kaduna, Bauchi) rendered 200 on `/api/attacks/<id>` and `/incidents/<id>`. Their precision was initially `approximate_state` because of my mapping; corrected to `exact` since both name a settlement, and the mapping itself is fixed.
- Extraction queue: 132 at the start of the increment, 126 pending after two batches, 108 still retryable. The scheduled scan drains roughly 5-20 due rows per run, so the rest will follow without manual batches.
- Remaining for phase 3: roundup splitting, one incident per event (27 rows where the article reports several attacks and the model will not separate them).
- Netlify is retained for rollback: `netlify.toml` and `@netlify/plugin-nextjs` stay until roughly 2026-11-04, since pointing the record back at `terrortracker.netlify.app` is a one-minute undo. Already removed: the two dead `netlify/functions/scheduled-*.mts` (no `config.schedule`, never wired) and the now-unused `@netlify/functions` dependency.
- Remaining work: one browser pass of an admin write action (login plus a delete or review move), because the CSRF origin check is tied to `NEXT_PUBLIC_APP_URL` and cannot be exercised from the staging hostname. Then, after the rollback window, delete `netlify.toml`, the Next plugin dependency, the Netlify site itself, and the `new.tryraisins.dev` Caddy block plus its DNS record.
- Traps found. `netlify env:list --context production --json` and `env:get --context production` mask "secret"-typed values as a run of asterisks plus the last four characters (`****************cker`), while `env:get` without a context returns the real value for keys that exist in the dev context. Masked values must be rejected, not trusted. Piping `git show` output straight into a remote `tee` flattens a file to one line, which silently broke every systemd unit; `-join "`n"` first. GHCR resets large layer downloads from this host over IPv6, so `deploy.sh` retries the pull five times and falls back to a locally present tag.

## 2026-10-28 V3 Redesign Implementation

- The user rejected the V2 look entirely, asked for a new design in pen.dev (`redesign new.pen` at the project root, gitignored with its `redesign new-assets/` folder; the Map script node points at the local gitignored `design/map-v3.js`), then asked for it to be implemented and pushed to `main`. `DESIGN.md` describes the system, the colour roles and the page layouts.
- Decisions made along the way: dark only; neutral white and grey text (the first blue-grey text was rejected); killed red, abducted amber, injuries neutral; the huge Home death-toll numeral stays white; no map or state ranking on Home; Inter Tight and Inter (kept for Yoruba, Hausa and Igbo glyph coverage).
- Code: rewrote `globals.css` (admin, date-picker and loading-state rules kept), `layout.tsx` (Inter and Inter Tight replace Noto), `page.tsx` (Home), `about/page.tsx` (Method), `Navbar.tsx`, `Footer.tsx`, `StatusBadge.tsx` (plain text, no dot). New `YearChart.tsx` replaces `BarChart.tsx`: one tick per day on desktop, monthly bars below 1024px. `/api/stats` now also returns `byDay`. `RecordCard.tsx` shows the place as the heading with the headline beneath and exports `placeParts`; place separators are commas, not middle dots. Records, Map and Incident keep their behaviour and structure but follow the skill rules (no arrow glyphs, no `↗`, "Previous page" and "Next page", map ranking rows unnumbered, Incident title is the place with the headline beneath).
- Not redrawn in Pen and derived from the desktop comps: mobile Records, Incident, Map and Method. Empty and error states reuse the existing components with the new tokens. Admin screens were restyled only through shared tokens and were not visually checked, and neither were real phones or Safari.
- Verification: `npx tsc --noEmit` passes; focused ESLint shows only the five existing `react-hooks/set-state-in-effect` errors that `main` already has; `npm run build` passes (disposable `JWT_SECRET`). `node scratch/v3-redesign-e2e/v3-e2e.mjs http://localhost:3107` passed 22/22 against the local production build with live data: figures from the API, one tick per day with the busiest day tallest and the last seven days highlighted, colour roles, no arrows, middle dots or link underlines, filters, deep links, detail, map, error recovery, phone layout and no overflow at 320 to 1920px. Screenshots and `results.json` are in `scratch/v3-redesign-e2e/` (uncommitted). The old `scratch/v2-redesign-e2e/` suite targets V2 markup and no longer applies.
- Page titles: the section layouts (`incidents`, `map`, `about`) no longer put "NATracker" in their own titles, because the root template adds it. `incidents/layout.tsx` restates a `default` and `template` object, since a plain string there drops the root template for `/incidents/[id]` and the record pages lost their brand. The V3 E2E asserts every public title names the brand exactly once. The Pen document's sample figures were replaced by live data in code. The Home chart's Deaths and Abductions modes use the same tick geometry as Attacks.

## 2026-10-25 Duplicate Gate Fix, Reconciliation, Queue Cleanup and Next.js Security Upgrade

- Reported: `/incidents/6adcb2f27450e4eabdcbc6ee` and `/incidents/6addee73c4b829d647eb0aa6` were the same 23 October Kaura Namoda attack. Daily Post spelled the LGA "Kauran Namoda", Daily Trust "Kaura Namoda". The one-character difference defeated the title hash, the deterministic location gate (`sameLga` exact string equality) and the semantic gate, whose `compatibleLga` precondition required equal LGAs or an unknown, so DeepSeek was never asked. Replaying the exact prompt on the stored pair returns `same_event` in both orders.
- Second defect: the post-insert `DuplicateCheckerService` did detect such pairs, but `persistDuplicateReviewPairs` stored only `review_required`/`not_assessed`, so a confident `same_event` was silently discarded.
- Fix: new `src/lib/location-identity.ts`. `placesEquivalent` (compact equality, 80% token agreement, one anchored one-character spelling variant) is used by the deterministic merge gate; `placesPlausiblySame` (adds containment and two-character anchored variants) only decides whether a pair reaches the semantic gate; `lgaCompatible` treats an unstated LGA as compatible. Numeric tokens are significant, so Garki Area 1 and Garki Area 2 never merge. Hong/Song, Kajuru/Kauru and Ibadan South East/West are rejected on purpose.
- `search-led-discovery.ts`: gate B uses `sameLga` plus `sameSpecificLocation`, gate C uses `lgaCompatible`. `deepseek.ts` derives `location.precision` from the validated town/LGA and keeps the approximate-location tag consistent. `incident-review.ts` queues `same_event` and adds `sweepIncidentReviews`, which runs after every scan. The workflow retry budget is now 20 per scan; the function clamps to 20.
- `scripts/merge-incidents.ts` (`npm run merge:incidents`): explicit pair list, dry run by default, one transaction per pair, source union, casualty figure kept with its own evidence quote, hash recompute, tombstone-hash rewrite with the original hash in `_deletedReason`, unique `run-<timestamp>` artifacts, overlap rejection, per-record rerun provenance, and review cleanup that resolves settled pairs and retargets held candidates. `scripts/promote-review-lead.ts` inserts a held lead as its own incident with normalized duplicate guards. `scripts/triage-incident-reviews.ts` (`npm run triage:reviews`) is the dry-run/apply wrapper for the sweep.
- Active records 587 to 579. Merged: Kaura Namoda (with the Daily Trust "over 30" abduction figure), Plateau Kwi, Oyo Alaho, Borno Gamboru Ngala, Ebonyi Okporojo, Bauchi kidnap/murder, Benue Apa, Taraba Binnari (police figure 58 with the Leadership quote), Edo Akoko-Edo rescue. Promoted one held lead: the Dakna raid in Hong LGA, a separate event from the Garaha-Mojili outpost attack in the same article. Corrected: Ohimini abduction count 1 to 8 with both rescue reports; Maiyama construction-site record separated from the forward-base assault after source review; Apa settlements and casualty zeros reverted to what the retained Punch article supports.
- Deliberately not merged after source review: the Abia Isuikwuaito pair (two victims at two junctions on consecutive days), the Kebbi Arewa Lakurawa trio (separate settlements carved from one coordinated attack), Katsina Malumfashi (separate Gora and Unguwar Dambu attacks), Plateau Rakum and Marit mining sites, Adamawa Bala-Tela and Tela-Bala/Guyaku, Zamfara Tsafe abduction and rescue.
- Review queue: duplicate rows 69 pending to zero (52 dismissed with per-cluster evidence, the rest resolved by merges or promotion). Extraction queue 1,383 pending to 175 pending plus 43 retained late reports and 46 fetch failures. 1,197 extraction rows dismissed for conclusive content rejections (no Nigerian state, no incident date, not an incident, scope rejection, fact-check); 22 evidence-grounding failures were reopened after review because they are extraction quality, not proof the article is unusable.
- Agent prompts: new project `AGENTS.md` makes the duplicate routine automatic, documents the identity rules, the tools, the queue policy and the verification contract.
- Next.js security upgrade: 16.4.0 to 16.4.3, verified in worktree branch `security/next-16.4.3` (commit `5a3ff01`) and applied to the working tree. `next.config.ts` now sets `experimental.agentUpgrade: "security"`. `npm audit --omit=dev` clean, build passes on 16.4.3.
- Review: Sol reviewed the change and returned REVISE; its findings drove the numeric-token fix, the sweep-scope narrowing, the Apa correction, the merge-cli hardening and the retarget-instead-of-resolve behaviour. Opus verified the rendered merged records at 390/768/1440 and fixed two display defects (`locationLabel` repeating a town equal to its LGA, underscor ed tags). Neither found overflow.
- Verification: `npx tsc --noEmit`, focused ESLint (the one `react-hooks/set-state-in-effect` error on `IncidentDetailClient` is pre-existing) and `npm run build` pass on 16.4.3. `npx tsx scratch/dup-fix-e2e/dedup-e2e.ts` passes 6/6 through the real `ingestSearchLedAttacks`: spelling-variant merge, Kwi Road not merged, casualty conflict held, same town in a different LGA inserted, Kalim-Lamido held for the semantic gate, numbered subdivisions not merged. Live API returns 404 for every absorbed id and 200 with merged data for every survivor.
- Still open: 175 retryable extraction leads and 46 fetch failures will drain at up to 20 per scan; 43 late reports are retained leads with no automatic path. Two sources of the same BBC story remain on the Binnari record because the URL normalizer does not equate different hosts. One stored source title carries a literal HTML entity from ingestion. `hashFor` is still title-based while `generateAttackHash` is event-based, which needs a hash backfill. Merge plans are computed before their transaction, so a concurrent collector write during a manual merge could be overwritten.


## 2026-10-12 "V2 Editorial" Redesign Implementation

- The user rejected the deployed Public Ledger look ("AI slop", too much on the home page, no geography on the home page), redesigned every page in Pen (`redesign.pen`, "V2" frames, desktop and mobile), asked for the monthly chart and key metrics to stay on the home page and for state rankings to live only on the Map page, then asked for implementation and a push. Map state names must show when there is room and fall back to counts only on narrow widths. `DESIGN.md` describes the system.
- Branch `redesign-v2-editorial`. Rewritten: `globals.css` (new tokens; states, admin and date-picker rules kept), `layout.tsx` (Noto Sans + Noto Serif; Noto Sans Mono dropped), `page.tsx`, `incidents/page.tsx` (filter bar of selects + dates; sort tabs; `?focus=search`), `incidents/[id]/IncidentDetailClient.tsx`, `map/page.tsx` (measure toggle, ranking buttons with Show all 37, attributed groups), `about/page.tsx`, `Navbar.tsx` (no utility strip or bottom nav), `Footer.tsx`, `RecordCard.tsx` (`rowPlace`, `recordDay`), `BarChart.tsx` (HTML columns, three measures, data table), `NigeriaMap.tsx` (`labels="auto"`, retuned offsets, units), `StatusBadge.tsx` (neutral marks). New: `ScanStatus.tsx`. `/api/stats` now returns seven latest records.
- Fixed while verifying: the related-records section briefly said "no other records" while loading (now shows a loading line); map labels Anambra/Enugu and Bayelsa/Rivers collided.
- Verification: `npx tsc --noEmit` and `next build` (disposable `JWT_SECRET`) pass. Changed files add no new lint errors (the five `react-hooks/set-state-in-effect` errors are the same ones on `main`). `node scratch/v2-redesign-e2e/v2-e2e.mjs http://localhost:3107` passed 19/19 against the local production build with live data and the real nonce CSP; screenshots and `results.json` are in `scratch/v2-redesign-e2e/` (uncommitted).
- Not verified: authenticated admin screens, real phones/Safari, and the production deploy (not merged at handoff).

## 2026-10-12 "Public Ledger" Redesign Implementation

- The user asked for a fresh redesign in Pen (`redesign.pen`), chose dark-only and the real map outline, then asked to implement it and pick the best fonts. Merged to `main` as `f0d768d` via PR #3 (rebase merge) and deployed to production by Netlify on 12 October 2026. The same E2E suite passed 18/18 against `https://terrortracker.tryraisins.dev` after the deploy. `DESIGN.md` records the system and the font evidence.
- Fonts: Noto Sans (variable width for condensed display) + Noto Sans Mono via `next/font`, chosen because a browser glyph test showed they are the only tested pairing that covers Yoruba, Hausa and Igbo letters in every role. The Google Fonts `@import` was removed.
- Rewritten: `src/app/globals.css` (single dark ledger system with legacy variable aliases), `layout.tsx`, `page.tsx` (dashboard), `incidents/page.tsx`, `incidents/[id]/IncidentDetailClient.tsx`, `map/page.tsx`, `about/page.tsx`, `components/Navbar.tsx` (utility strip with real `/api/scan-health` time, masthead search to `/incidents?search=`), `Footer.tsx`, `RecordCard.tsx`, `BarChart.tsx` (measures its container; value labels, peak and partial-month marks). New: `components/NigeriaMap.tsx`, `components/StatusBadge.tsx`.
- Data changes: `/api/stats` `byState` returns every state (was top 10); `getPublicIncident` now returns `dateEvidence` and source `publishedAt` (both already in the public field allowlist). `IncidentRecord` type gained both fields.
- Bugs fixed while verifying: the archive let a slower stale response overwrite newer filtered results (now request-sequenced); react-select ids caused hydration mismatches (now stable `instanceId`); a failed related-records request was shown as "no related records" (now a retryable notice).
- Verification: `npx tsc --noEmit` and `next build` (disposable `JWT_SECRET`) pass. Changed files add no new lint errors; the five remaining `react-hooks/set-state-in-effect` errors are the same ones present on `main`. `node scratch/ledger-redesign-e2e/ledger-e2e.mjs http://localhost:3107` passed 18/18 against the local production build with live data and the real nonce CSP (fonts, search deep link, filters, pagination, stale-response race, empty and error recovery, detail impact semantics, map selection, overflow at 320–1440px, mobile drawer/bottom nav, no page errors or CSP violations). Screenshots and `results.json` are in `scratch/ledger-redesign-e2e/` (uncommitted).
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
- Dependencies: exact-pinned `next` and `eslint-config-next` 16.4.0; removed unused `@google-cloud/vertexai`, which brought in vulnerable `gaxios` 6 / `uuid` 9. `npm audit --omit=dev` is clean. Full audit still reports five high advisories in dev-only ESLint's `fast-glob`/`micromatch`/`braces` chain; no patched braces release is available in the configured registry, and npm proposes an incompatible Next ESLint config 14 downgrade.
- Other changes: `src/app/api/admin/reviews/route.ts` casts the validated review status to `IncidentReviewStatus` for updated mongoose types. `.gitignore` excludes local `security-audit/REPORT.md` and artifacts.
- Verification: `npx tsc --noEmit`, focused ESLint on changed files, `npm run build` (Next 16.4.0), and `npm audit --omit=dev` pass. Local production headers/HTML confirm nonce agreement on CSP, root metadata, and all framework scripts; `script-src` has no `unsafe-inline`, `X-Powered-By` is absent, and API response projections omit internal fields. Local tests also reconfirmed malformed login -> 400 and XFF-rotation-resistant throttling.
- Open: authenticated admin actions were not exercised (only one admin account, not shared). `/api/version` continues exposing an opaque build ID because `UpdateNotifier` needs a per-deployment token to detect updates. Full audit's dev-only ESLint transitive advisory remains as noted above.
- Confirmed NOT vulnerable: admin routes require session + admin role (forged/`alg:none` JWT -> 401); `/api/cleanup` and `/api/cron/*` require `x-cron-secret`; Turnstile fails closed; CORS is a fixed allowlist; no operator injection; no tracked secrets.

## 2026-10-07 Admin Login CAPTCHA

- Added Cloudflare Turnstile to `/admin` sign-in. The browser sends a single-use token; `/api/auth/login` validates it with Siteverify before database access and requires the `admin_login` action plus a hostname in `TURNSTILE_ALLOWED_HOSTNAMES`.
- Production Cloudflare Turnstile widget is configured for `terrortracker.tryraisins.dev` in managed mode. Netlify production has `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`, and `TURNSTILE_ALLOWED_HOSTNAMES` set; the values match the widget and expected hostname. The Netlify plan currently exposes all scopes and did not apply the optional Secrets Controller write-only flag, so the secret is stored as a Netlify environment variable but is not flagged as write-only.
- Production initially blocked Turnstile because `src/proxy.ts` omitted `challenges.cloudflare.com` from CSP. Commit `10c01740b60a6bb948c5cc771ebec1b1b187e84e` adds the host to `script-src`, `connect-src`, and `frame-src`; deploy `6ac61d7c298f6b176a220e55` is ready. The cache-busted live `/admin` response returns HTTP 200 and contains all three CSP allowances. Interactive challenge completion and login API rejection were not exercised in a browser. Locally, `npx tsc --noEmit`, focused ESLint, `git diff --check`, and `npm run build` passed before the CSP-only change; Netlify successfully built and published the CSP fix.

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
- Live verification exposed concatenated town aliases, city-level location labels and multi-community descriptions bypassing the pre-insert guard. The correction normalizes compound aliases and uses bounded DeepSeek event comparison on nearby same-LGA records before insertion; disabled/unavailable/ambiguous assessments are held. Stored-pair `review_required`/unassessed findings enter permanent review; confirmed same-event pairs do not create duplicate queue rows. Second live run `37449580238` completed successfully: 37/37 jurisdictions, 175/175 URLs fetched, zero search/fetch/feed/DeepSeek/ingest errors, zero inserts, 11 source merges, and 16 new review rows; coverage is `REVIEW_REQUIRED`. The public health API reports it as current. Full scanner E2E, five additional duplicate E2E scenarios, focused lint, TypeScript and build pass.
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
- Branch: `codex/newsreader-geist-ui-improvements`; implementation commit `d5eac6a` is pushed to `origin` (no PR opened). `npx tsc --noEmit`, targeted ESLint on the changed TS/TSX files and `npm run build` pass; the build requires a disposable local `JWT_SECRET` because the module validates it at import time. Repo-wide `npm run lint` remains blocked by 495 existing errors and 80 warnings, mostly in archived audit scripts and unrelated source files. Local production preview showed live dashboard/detail data, both chart modes, October partial labeling, table values matching the API, and “Last updated” wording. Mobile viewport was not verified.
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
- Live API confirms the canonical Oct 1 record is active with five sources and both duplicate IDs return 404. The collection moved from 512 to 510 active records (520 total). `npx tsc --noEmit`, focused ESLint, and `git diff --check` passed. No scan/E2E run was performed. The workflow changes remain local and must be pushed to `main` before future scheduled runs use them.

## 2026-10-03 Scan Coverage Tolerance + DEGRADED Status

- A manual dispatch of the daily scan (run 37112448844) failed on `Fatal: Scan coverage is incomplete` even though the scan worked: 37/37 state queries, 140 URLs discovered, 139 fetched, 1 inserted, 4 merged. The only problem was a single publisher fetch failure (`thernicheng.com` timeout, then HTTP 422). The old gate in `scripts/search-led-scan.ts` treated any `fetchFailures.length > 0` as `INCOMPLETE` and exited 1.
- `scripts/search-led-scan.ts` now computes a fetch-failure budget = `max(SCAN_MAX_FETCH_FAILURES (default 3), ceil(urlsFetched * SCAN_FETCH_FAILURE_TOLERANCE_RATIO (default 0.1)))`. `INCOMPLETE` (exit 1) now triggers only on `queriesRun !== states.length`, `searchFailures.length > 0`, `ingest.errors > 0`, or `fetchFailures.length > budget`.
- Status precedence is now `INCOMPLETE` > `DEGRADED` > `REVIEW_REQUIRED` > `COMPLETE`. `DEGRADED` means fetch failures were non-zero but within budget; it exits 0 and is visible in the step summary. `fetchFailureBudget` is included in the JSON report, and the summary shows `N unresolved fetch errors (budget B)`.
- `.github/workflows/daily-scan.yml` sets `SCAN_MAX_FETCH_FAILURES: "3"` and `SCAN_FETCH_FAILURE_TOLERANCE_RATIO: "0.1"` explicitly. Retry crons (09:30/12:30/15:30 UTC) still fire only after an `INCOMPLETE` (failed) run, so genuine provider outages still retry while isolated flaky fetches no longer do.
- Verified in commit `d88f39a`: `npx tsc --noEmit`, `npx eslint scripts/search-led-scan.ts`, and `git diff --check` pass, and E2E dispatch of [run 37114326068](https://github.com/tryraisins/Terror_Tracker/actions/runs/37114326068) succeeded. That run reproduced the original trigger (1 unresolved fetch failure) and reported `coverageStatus: DEGRADED` with `fetchFailureBudget: 13` (from 129 fetched, `max(3, ceil(129 × 0.1))`), 0 search failures, 0 ingest errors. No test framework exists in the repo.

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
- Focused ESLint, `npx tsc --noEmit`, and `git diff --check` passed. The ingestion fix is local to this checkout and must be deployed before scheduled ingestion uses it. No unrelated untracked scripts or `scratch/` files were changed.

## Incident Sharing and Social Previews

- Incident detail routes now load the public record on the server and render it into the initial HTML, while retaining the existing client detail interactions.
- Each incident has record-specific title, description, canonical URL, Open Graph article metadata, and Twitter/X large-card metadata. `/incidents/[id]/opengraph-image` renders a 1200×630 branded, non-graphic card using the incident title, date, location, and record status.
- Detail pages offer native device sharing, WhatsApp, Facebook, and Twitter actions. Desktop places sharing beside the location/date details at the far right edge of the content area; narrow screens stack it above the impact cards with visible spacing.
- Incident record history now appears before related records on the detail page.
- Verification: `npx tsc --noEmit`, targeted ESLint, `git diff --check`, and `npm run build` pass. A local production-server check returned a 200 incident page with server-rendered title metadata and a 200 `image/png` OG card (68 KB). Live social crawler previews still require a deployed public URL.

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
  review. Open-ended casualty minima retain `range` metadata.
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
- Verification: `npx tsc --noEmit`, targeted ESLint, and production `npm run build` passed. The
  build required a process-only temporary `JWT_SECRET`. No tests were added or run. Existing
  untracked scripts and `scratch/` are user work; do not stage them.

## Recent Dashboard Update (2026-09-23)

- The home dashboard monthly chart now switches between incident counts and victim impact (deaths/abductions), so unlike measures are not compared on a shared axis.
- State ranking includes each displayed state's percentage of all recorded incidents for the reporting year. The percentage denominator is the full yearly total, not only the top-state slice.
- Validation: changed dashboard files pass targeted ESLint and `npx tsc --noEmit`. Repository-wide `npm run lint` still reports existing errors across audit/scripts and unrelated components.

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
- 14:26 UTC: independently source-reviewed and dismissed seven distinct stored-event queue pairs with snapshot fingerprints using `distinct-queue-20261108.json`; dry-run and apply artifacts under `scratch/review-dispositions/run-2026-11-08T14-25-44-725Z/` and `run-2026-11-08T14-26-27-938Z/`. Direct DB check: 7/7 distinct notes, 53 pending duplicate rows, 964 active. Pair dispositions do not establish full incident review; coverage remains pending.
- 14:29 UTC batch 37: found the older `6ae8efa0eec24a506cafbd4a` already represented the police-bus attack, and merged the batch-36 intermediate survivor into it; retained 28 sources, conflicting five/eight casualty accounts, unknown abduction count and Nov 1–3 date range. Also merged the source-confirmed Tureta duplicate into older `6a966df6a83adf70ab8f837f`, retaining the separate Isa–Bargaja incident. `batch-37/run-2026-11-08T14-29-07-844Z/`: 962 active, date integrity PASS, both survivor APIs/pages 200 and all three absorbed APIs/pages 404; four held leads retargeted. The first police-bus tombstone points through the intermediate tombstone to the final survivor; direct ancestry retargeting remains an integrity follow-up. Full reviews and rendered visual QA remain pending.
- 14:34 UTC: resolved four source-reviewed queue leads already represented by the final police-bus or Tureta survivor, after fingerprint-guarded dry run and apply (`recorded-queue-20261108.json`, artifacts `scratch/review-dispositions/run-2026-11-08T14-32-33-458Z/` and `run-2026-11-08T14-34-34-049Z/`). Verified 4/4 resolved, 49 pending duplicate rows and 962 active. Comprehensive reviews remain pending.
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
