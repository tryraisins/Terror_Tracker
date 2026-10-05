# NATracker design direction

Updated: 5 October 2026. Current direction: improve the existing production interface. The user rejected the replacement direction and asked to clear it from Pen. The native canvas now contains a focused production-theme proposal; previous exports are historical only. See `design/README.md` for current view IDs and previews.

## Visual authority

Use the current production interface at `https://terrortracker.tryraisins.dev/` and its source styles. Preserve the dark canvas, red/orange signals, logo, floating header, gradient controls, rounded cards and mobile bottom navigation. Use Newsreader for headings and Geist for interface and supporting text. Keep existing layouts recognizable. Do not introduce the earlier teal/light palette or rebuild the dashboard around a new shell.

Existing tokens: canvas `#0b0c0f`, surface `#17181c`, ink `#f4efe9`, body `#c4bdb8`, red `#e53620`, lighter red `#ff7066`, orange `#ff922b`. Prefer an existing role/token before introducing a new one.

## Improvement thesis

Make the current product easier to read, filter and interpret through small, evidence-backed changes. Prioritize responsive defects and truthful chart/status context before adding analytics. Keep the current incident/human-impact chart switch and map/state index.

See `design/production-improvements.md` for ranked findings and acceptance criteria. The first implementation slice applies the selected fonts and addresses detail metric fit, chart period context/data access, and small-link contrast. Later priorities include filter URL persistence, state-index search and server-backed reporting context.

## Preserved behavior

Keep public routes, real queries, all filters, pagination, state links, source links, record history and native/social sharing. Preserve admin permissions, page-scoped selection, review reason, typed confirmation and soft-deletion history. No fixed snapshot values in production.

## Analytics boundaries

Label partial periods and units. Stored status is not accuracy. Unknown, not reported and absent metadata remain distinct. Do not show displacement as zero from missing data, invent trend deltas or normalize actor aliases without source review. `design/metrics.md` remains useful as a definition reference; its alternative visual layout is not approved. Common date/state scope and reporting-quality aggregation require backend work and real end-to-end verification.
