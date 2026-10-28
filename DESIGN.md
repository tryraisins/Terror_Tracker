# NATracker design direction

Updated 28 October 2026. The current direction is the "V3" redesign: the year as a daily record. The user rejected the V2 editorial look ("don't like the current design at all"), redesigned every page in Pen (`redesign new.pen`, frames prefixed "V3"), and asked for it to be implemented and pushed to `main`. Dark is the only theme; do not add a light mode or light palette. The home page stays restrained: no map, no state ranking, no stat-card rows.

## Thesis

A sober public record, not a dashboard. Each page leads with one enormous figure or title in tight, heavy type, then the evidence in plain rows. Structure comes from type scale and rows with a large day numeral, not cards, hairline-grid dashboards or serif editorial devices. Colour carries meaning only: red for people killed, amber for people abducted, neutral grey for injuries. Reporting status is plain text so it never competes with those colours.

Rules from the design skills that this system keeps: no arrow glyphs on or after links, no underlined links in any state, no middle-dot metadata, no tracked-caps eyebrows, no decorative status dots, no light theme.

## Pages

- **Home:** period line, the year's reported death toll as one huge white numeral, one sentence, one context paragraph. Then "Every day of {year}": one tick per day grouped by month (height is the chosen measure that day; the last seven days are amber on Attacks; tabs switch Attacks, Deaths, Abductions; partial month marked; data table behind a text button). On phones (below 1024px) the ticks become one bar per month. Then people harmed (proportion bar and totals) beside the top five attributed groups, then the seven latest records and a link to all records.
- **Records (`/incidents`):** 120px title, search field, sort tabs, filter bar (state, status, impact, dates with quick ranges), result totals, record rows, pagination ("Previous page" / "Next page"). On phones the filters collapse behind a "Filters" button.
- **Record row:** large day numeral and month, place (town, LGA, state) as the heading, report headline beneath, impact on the right. The list view adds attribution and plain-text status.
- **Incident:** back link, place as a very large title (steps down in size for names over 10 characters), state and date, report headline, status sentence, four large impact figures, account (what, where, when, attributed to, tags), sources, history, sharing, and other records from the same state.
- **Map:** 120px title, measure toggle (attacks, deaths, abductions) and status filter, the real state map with a selected-state panel, the state ranking (top 12, expandable to all 37; the keyboard route into the map), and attributed groups. State ranking lives here only.
- **Method:** 120px title, a lead paragraph, then sections as a heading column beside a text column (process steps, reporting status, what a record contains, known limits, corrections).

## Tokens (src/app/globals.css)

Background `#0b0b0c`, field `#151516`, raised `#1c1c1e`, hover `#26262a`, rule `#252527`, strong rule `#3a3a3d`. Text `#ffffff`, secondary `#b3b3b6`, muted `#8e8e92` (about 6:1 on the background, so small text passes WCAG AA). Killed `#f0524f`, abducted `#f2b24a`, injured and displaced neutral. The big Home death-toll numeral is deliberately white even though it counts people killed. Map bands, none to most: `#151516`, `#303033`, `#6b6b6f`, `#b3b3b6`, `#ffffff`; the selected state is outlined amber; labels on the two lightest bands are dark. Controls and buttons use an 8px radius; nothing else is rounded. Older variable names (`--surface`, `--signal`, `--ochre` and so on) remain as aliases for react-select and admin styles; `--serif` now aliases the display face.

## Typography

Inter Tight (titles, large figures, record place names, weights 600 to 800, negative tracking) and Inter (text, labels, data). Both are self-hosted through `next/font` with `latin`, `latin-ext` and `vietnamese` subsets because the Yoruba dot-below letters live in the Vietnamese range. The 12 October 2026 glyph test found Inter and Noto cover every Yoruba, Hausa and Igbo letter where other families fall back mid-word; the E2E check re-tests the sample. The Home numeral is `clamp(5rem, 24vw, 20rem)` so a six-character figure still fits at 320px.

## Map

Real state boundaries from `src/lib/mapData.ts` via `src/components/NigeriaMap.tsx`. `labels="auto"` shows state names above counts when the rendered map is at least 600px wide and counts only below that. `design/map-v3.js` is the matching Pen script node (local, gitignored).

## Data

`/api/stats` returns `byDay` (Nigeria calendar day, count, killed, kidnapped) for the year chart in addition to the monthly and overall figures; days without records are filled in by the client.

## Preserved behaviour and data rules

Public routes, API contracts, archive filters, pagination, `?state=` and `?search=` deep links, `?focus=search`, sharing, source links, record history, admin screens and the typed soft-deletion flow are unchanged. Unknown, zero/not-reported and absent figures stay distinct exactly as `displayValue` and `casualtyDetail` define them. Actor spelling variants are shown separately and tagged, never merged. Scan freshness from `/api/scan-health` is in the footer.

## Verification

`scratch/v3-redesign-e2e/v3-e2e.mjs` is the rerunnable end-to-end check (`node scratch/v3-redesign-e2e/v3-e2e.mjs [baseUrl]`). Its header lists the failure modes it targets; it writes screenshots and `results.json` beside itself and performs no writes. The earlier `scratch/v2-redesign-e2e/` suite targets the V2 markup and no longer applies.
