# Terror Tracker: agent notes

Project-specific rules. Global working instructions still apply.

## What this app is

Next.js 16 App Router + MongoDB (Mongoose). `attacks` is the incident collection; `incident_reviews` is the review queue; `scan_runs` records each discovery attempt. The scheduled collector is `scripts/search-led-scan.ts`, run by `.github/workflows/daily-scan.yml`. There is no ORM, no migrations directory and no test framework.

## Incident identity

`Attack.hash` is a unique index over `title|date|state|lga|town` (`hashFor` in `src/lib/search-led-discovery.ts`). It is a first-line gate only.

Ingest then compares places through `src/lib/location-identity.ts`:

- `placesEquivalent` is strict and is the only rule allowed to merge without a model.
- `placesPlausiblySame` is tolerant and only decides whether a pair reaches the semantic check.
- Hong/Song, Kajuru/Kauru and Ibadan South East/West are deliberately rejected. Do not loosen these rules to make a merge happen; widen evidence instead.

Article URLs are never event identity. One article legitimately supports several records (roundups, multi-event stories). A shared URL is a signal to compare, not proof.

## Duplicate routine

Run this whenever the task touches ingestion, data quality, or an incident that looks duplicated. Do not wait to be asked.

1. **Find candidates.** Query active records in the same state within a few days and compare normalized `location.lga`/`location.town`. Also read the `incident_reviews` collection: `kind: "duplicate"`.
2. **Get evidence per pair.** Open the cited articles. Decide from the source text: event date, settlement, LGA, victim counts, named victims. Same place and date is not enough on its own.
3. **Merge or keep.** Merging needs the older/stable record kept and the other absorbed. Never merge when the sources describe different settlements or different victim sets, even if the LGA and date match.
4. **Act with the tools, not ad-hoc updates:**

```bash
npm run triage:reviews                         # dry run: deterministic queue sweep
npm run triage:reviews -- --apply
npm run adjudicate:duplicates                              # dry run: model decides held toll conflicts
npm run adjudicate:duplicates -- --apply
npm run merge:incidents -- --pairs <pairs.json>            # dry run
npm run merge:incidents -- --pairs <pairs.json> --apply
npx tsx scripts/promote-review-lead.ts --review <rowId>    # dry run
npx tsx scripts/promote-review-lead.ts --review <rowId> --apply
```

`adjudicate-duplicate-reviews` decides held toll conflicts. It only accepts a held lead: one stored candidate, no `candidateId`, and a candidate that is not the record itself. A stored-pair review (two records, `candidates: [A, B]`) is skipped, because taking `candidates[0]` there compares the record with itself. Before asking anything it re-verifies state, `placesEquivalent` town, `sameLga`, and an `exact_day` date key equal on both sides; an `unknown` key never matches, and a near-miss stays pending. The model answers `same_event_counts_differ` / `different_event` / `review_required` and fails closed; a rationale shorter than 40 characters is treated as a refusal. On `same_event_counts_differ` it appends the article's missing sources to the stored record and resolves the row, in that order, appending only sources the record does not already have so a concurrent writer is not clobbered. On `different_event` it does **not** dismiss: a distinct candidate is an event that was never recorded, so the row stays pending and must be promoted. It never rewrites a casualty figure or an identity field, both tolls are recorded in the disposition note, and every decision is journalled to `decisions.jsonl` as the pass runs. It is currently out of the scan loop while the reviews below are addressed; run it by hand.

`merge-incidents` writes a unique `run-<timestamp>` artifact directory with before/after snapshots and `summary.json`, merges sources by normalized URL, keeps the highest casualty figure and the evidence text that belongs to it, recomputes the survivor's hash when identity fields change, resolves stored-record pair reviews and retargets held candidates to the survivor, and validates hash uniqueness, active count and date integrity. It refuses a record that appears in two pair entries, and a rerun only skips records already merged into the same survivor. Put pair files and artifacts under `scratch/`, never in `audit-2026/` (tracked) or the repo root.

5. **Held leads are not automatically duplicates.** A queued candidate may be a separate event that was never inserted. If the source describes a different settlement, victim set or date, promote it with `promote-review-lead.ts` instead of dismissing it.
6. **Verify against the real surface.** Absorbed ids must return 404 from `/api/attacks/<id>`; survivors must return 200 with the merged sources. Check the rendered incident page.

## Review queue rules

`sweepIncidentReviews` runs after every scan and applies only deterministic dispositions: captured sources, stale references, exhausted retry budgets, and conclusive content rejections (no Nigerian state, no incident date, not an incident, scope rejection, fact-check). It never dismisses a non-retryable lead just because automation gave up, and it never closes an evidence-grounding failure; those stay pending as leads.

Duplicate rows get a second, separate pass. `adjudicate-duplicate-reviews` runs after a clean scan and may only resolve or dismiss `kind: "duplicate"` rows, only after re-verifying the identity fields itself and only when the model returns a decidable classification. It never touches `extraction`, `fetch` or `late_report` rows, so no evidence-grounding failure is closed by it. A row it leaves pending is a row that needs a person.

If you dismiss a duplicate row, the disposition note must say which case it is: same event already recorded, distinct events, or promoted. Do not dismiss a row whose candidate looks like an unrecorded event. Extra absorption is not evidence: a source URL appearing on one record does not prove every event in that article was captured.

## Changing ingestion

- Every dedup change needs an end-to-end run through the real entry point (`ingestSearchLedAttacks` against a disposable database), not a unit test. Keep the script under `scratch/`.
- Include negative cases: a town-label variant must not merge, a casualty conflict must be held, and the same settlement name in a different LGA must stay separate.
- After changing the identity rules, re-check the active duplicate clusters before and after.

## Field conventions

- `location.precision` must agree with the fields. A settlement the report places the incident in is `exact`, or `surrounding_area` when the report says near it. A settlement named but placed within a wider area, or only an LGA, is `approximate_lga`, and the note must say which. State only is `approximate_state`.
- Open-ended reported minimums use `casualtyMeta.precision: "range"` with `max: null`; the UI renders `N+`.
- `_deleted` records keep their source history. When a survivor adopts the tombstone's identity, the tombstone hash is re-pointed and the original hash is recorded in `_deletedReason`. Soft-delete with a `_deletedReason` that names the surviving record.
- `status`: `confirmed` needs authoritative confirmation, `developing` for a single credible report or a moving toll, `unconfirmed` otherwise.

## Verification before calling work done

`npx tsc --noEmit`, focused ESLint, and `npm run build` (needs `JWT_SECRET`; use a disposable value). Then exercise the real path you changed. Update `HANDOFF.md` for anything another agent would need to continue.
