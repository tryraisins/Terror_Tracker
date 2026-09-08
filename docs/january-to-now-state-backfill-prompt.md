# New-chat prompt: sequential January-to-now state backfill

Work in `C:\Users\nubiaville\Desktop\Projects 2026\Terror_Tracker-main` and attempt to find qualifying Nigerian incidents from 2026-01-01 through the current Africa/Lagos date that are not already captured. Cover all 36 states plus FCT. This is an evidence audit, not a claim of census completeness.

Run the work in the state batches below, in order. Complete and checkpoint one batch before starting the next. Within each batch, process one state at a time. Do not skip a state because a national search is quiet.

1. Abia, Adamawa, Akwa Ibom, Anambra
2. Bauchi, Bayelsa, Benue, Borno
3. Cross River, Delta, Ebonyi, Edo
4. Ekiti, Enugu, FCT, Gombe
5. Imo, Jigawa, Kaduna, Kano
6. Katsina, Kebbi, Kogi, Kwara
7. Lagos, Nasarawa, Niger, Ogun
8. Ondo, Osun, Oyo, Plateau
9. Rivers, Sokoto, Taraba, Yobe
10. Zamfara

For each state, search month by month from January through the current month. Start with direct publisher RSS, sitemaps, archives, and site searches. Use the repository's provider-neutral discovery tools for gaps: DuckDuckGo first, Brave only for targeted unresolved gaps and within the live quota policy, and Bing only as a best-effort secondary surface. Never use Google Search or Google News. Search results, snippets, social posts, trackers, ACLED, and aggregator pages are leads only, never production evidence.

Keep discovery bounded and resumable:

- Process publisher hosts in batches of at most four and use at most two concurrent hosts.
- Cache fetched pages and do not repeat successful queries or URLs from the run ledger.
- Before any Brave call, read the current local usage ledger and configured monthly limit/reserve; do not infer remaining quota from an old screenshot. Never print or expose API keys or database credentials.
- If a source returns 403/429, honor Retry-After or use the 2/5/10/20-minute retry ladder. After exhaustion, record `FAILED_CHECK` and leave the affected state/month `UNRESOLVED`.
- If a browser challenge/CAPTCHA appears, open the browser in this task when possible and ask me to complete the challenge. Do not bypass it or report the source checked when it was not.

Eligibility contract:

- The direct article must describe one specific completed original event in Nigeria, not merely a warning, allegation, reaction, policy statement, court outcome, rescue update, retrospective roundup, or security operation.
- Eligible events include organized armed attacks, abductions, bombings/IEDs, communal violence, completed political attacks and organized thuggery, and property-only arson/sabotage/destruction when the source supports premeditated or coordinated action by a group of people.
- Political speech, campaign rhetoric, peaceful protest, accidents, isolated vandalism, ordinary individual crime, and attacker-only military/security operations remain excluded.
- Human casualties are not required for a qualifying property-only event. When casualties exist, count victims only: civilians, soldiers, police, vigilantes, and other targeted personnel. Never count attacker deaths or injuries.

Date rules:

- Prefer an exact original event day.
- If sources support only a period of days, use `datePrecision: "date_range"`, store both bounds in `dateRange`, and use the range start as the database `date` anchor.
- If only the event month is supported, use `datePrecision: "month_only"`, store the first and last day of that month in `dateRange`, and use the first day as the database `date` anchor.
- The supported month is mandatory. `datePrecision: "unknown"` is not publishable. Never substitute article publication date for event date.
- Mark range/month-only records `developing` and add `date-uncertainty`.

Location rules:

- A supported canonical Nigerian state is the minimum required location. Town/LGA precision is helpful but not mandatory.
- For an event on or near a border, choose one primary state based on the strongest direct-source description of the attack site. Record the alternative state/border ambiguity in `location.notes`, add `border-location` and `approximate-location`, and create only one incident.
- Use canonical state names, with `FCT` for Abuja/Federal Capital Territory.

Evidence and reconciliation:

- Prefer two independent direct publisher reports, or one official direct statement plus one independent trusted report. A single direct trusted report may remain `unconfirmed` only if the repository's current guarded policy permits it; otherwise retain it as `UNRESOLVED`.
- Each retained source URL must be the canonical direct article/statement and support the event, month/date range, and state. Remove wrappers, search URLs, homepages, tag pages, and unrelated links.
- Before proposing an insert, compare the candidate against active attacks, soft-deleted attacks, unresolved candidates, source-article receipts, and same-run candidates. Treat overlapping date intervals, shared sources, related location, title/event details, actors, and casualty patterns as duplicate evidence. Never duplicate one border event across states.
- Cluster multiple reports and follow-ups into one original event. Preserve conflicting credible casualty figures as ranges/estimates rather than selecting the highest number.

Database safety:

- Discovery and adjudication are read-only first. Use the repository's guarded database apply only after a saved snapshot and dry-run manifest identify exact inserts/merges and target IDs.
- Fail closed on database identity or snapshot drift. Apply only named `READY_INSERT`/`READY_MERGE` items, verify counts and document fingerprints afterward, then run the idempotency pass and require zero additional changes.
- Never edit `.env.local`, print secret values, mass-delete, or weaken direct-source and duplicate protections.

For every state/month, write a ledger row with: queries/sources checked, direct URLs reviewed, candidate hashes, disposition (`READY_INSERT`, `READY_MERGE`, `SKIP_DUPLICATE`, `BLOCKED`, `UNRESOLVED`, or `NO_CANDIDATE_FOUND`), reason codes, and next evidence needed. After each state batch, save a checkpoint with before/after database counts, manifest paths, Brave calls used in that batch, blocked hosts, unresolved state-months, and the next batch to run. Continue sequentially until all ten batches have terminal checkpoints; do not treat blocked or unsearched months as zero incidents.

At the end, provide an ultra-brief summary: states/months completed, new inserts, merges, duplicates, unresolved items, failed checks, Brave calls used, exact artifact paths, and proof that the final apply was idempotent. Clearly distinguish source discovery, local artifacts, database writes, and deployment status.
