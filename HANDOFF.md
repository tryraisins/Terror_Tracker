# Project Handoff

## 2026-10-07 Security Hardening Follow-up

- Fixed the casualty-sorted public attacks API to use the same explicit public-field allowlist as normal reads, removing the leaked `_totalAffected` helper.
- Production admin login now returns 503 instead of using per-instance in-memory counters if distributed Upstash limiting is missing, fails, or times out. Development keeps the in-memory fallback.
- Netlify site configuration contains both Upstash REST environment variables. A distributed runtime check was not performed.
- During the read-only environment check, the Netlify CLI printed production secret values into task output. Rotate the production MongoDB, Google service-account, admin, JWT, API, cron, and Upstash credentials; no credentials were changed here.
- Remaining actions: coordinate credential rotation and verify production login throttling after deployment. Do not include environment values in logs or handoff notes.

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
