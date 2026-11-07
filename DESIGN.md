# NATracker design direction

Updated 4 November 2026. The current direction is "V5": a calm, panel-based reading room for the 2026 record. The user rejected V3 (the giant-numeral daily record) and a sparse V4 comp ("too minimalistic", "red and yellow too loud", "charts confusing"), then approved V5 from the comps in `design/v5-comps/` (local, gitignored). Dark is the only theme; do not add a light mode or light palette.

## Thesis

A public record people can read at a glance and share. An app shell (sidebar on desktop, bottom tab bar on phones) holds content in panels. Every chart uses a standard form from the dataviz skill: stat tiles with sparklines, one-series column charts whose title states the finding, a binned sequential choropleth, a state-by-month heatmap, sorted bar lists. Colour carries meaning only and stays muted. Most of a page is neutral grey; red means attacks, killed figures stay neutral, blue means people abducted.

Respect attention: the Overview holds only what answers "how bad, how recent, where". Everything deeper lives on its own page, and phones show less again.

Rules kept from the design skills: no arrow glyphs on or after links, no underlined links in any state, no middle-dot metadata, no tracked-caps eyebrows on public pages, no light theme, no dual axes, no number on every point of a line or column chart, a table view or text equivalent for every chart.

## Pages

- **Overview (`/`):** title, lede, one control row (measure: attacks, killed, abducted; period: 2026, 90 days, 30 days) that scopes every panel. Stat tiles (attacks, killed, abducted with sparkline and change on the previous equal period; states with attacks). Trend column chart with a Chart/Table switch beside "The last 7 days". Map panel beside the top 10 states. One link card to Patterns. Phones drop the map panel, sparklines and the fourth tile, and shorten the lists.
- **Map (`/map`):** measure and period controls, large choropleth, a side panel that lists all states or, for a selected state, its tiles, monthly chart, worst-hit LGAs, latest incidents and a link to its State page. `?s=` selects a state and `?m=` a measure.
- **Incidents (`/incidents`):** search, sort, filters (state, status, impact, dates with quick ranges), result totals, incident cards in a grid, pagination. Keeps `?state=`, `?search=` and `?focus=search`.
- **Incident (`/incidents/[id]`):** status, place, date, headline, four impact figures, "What the report says" with quoted evidence, sources, record history, and a share panel (link-preview card, WhatsApp, X, Facebook, Telegram, LinkedIn, copy text, save image, copy link). Phones get a fixed share bar.
- **Patterns (`/patterns`):** state-by-month heatmap (12 most affected states), attributed perpetrators, deadliest attacks.
- **States (`/states`, `/states/[state]`):** every state as a card; each state page has its locator, ranked tiles, monthly chart, worst-hit LGAs, attributed perpetrators and every incident.
- **Method (`/about`):** process, reporting status, record contents, limits, corrections, in panels.

## Tokens (src/app/globals.css)

Canvas `#111312`, sidebar `#0c0e0d`, surface `#181b1a`, raised `#202423`, hover `#282d2b`, border `#2a2f2d`, strong border `#3a403d`. Text `#edf0ee`, secondary `#b1b8b4`, muted `#8a938e`. Attacks `#e5484d`, killed neutral `#c4cbc7`, abducted `#3e8ee6`. Red means attacks and, as `--danger`, destructive or failed states; a death toll is never red. Killed figures read as plain text on the surface (about 9:1), so the measures stay separable by hue: one red, one neutral, one blue. Map and heatmap use five bins per measure mixed from `#222625` toward the measure colour; attacks bins are 1, 10, 20, 40, 60, people bins 1, 20, 50, 100, 200. Cards have a 14px radius, controls 10px. Older variable names (`--ink`, `--rule`, `--field`, `--signal` and so on) remain as aliases for react-select, the date picker and the admin workspace.

## Typography

Plus Jakarta Sans only, weights 400 to 800, self-hosted through `next/font` with `latin`, `latin-ext` and `vietnamese` subsets. It is the one face in the skill catalogue (`yeknal-ui-quality-baseline/references/typeface-options.md`) whose served file was verified to carry the Yoruba and Igbo dot-below letters and the combining marks. Hierarchy comes from weight and size, not a second family.

## Data

`/api/summary` returns one slim row per active record for the current Nigeria calendar year (id, Lagos day, title, town, LGA, normalised state, group, killed, abducted, injured, status, open-minimum flags) plus the Lagos "today". Overview, Map, Patterns and States aggregate it on the client, so every panel follows the same filters. `/api/attacks` and `/api/stats` keep their contracts.

## Preserved behaviour and data rules

API contracts, archive filters, pagination, deep links, sharing, source links, record history, admin screens and the typed soft-deletion flow are unchanged. Unknown, zero/not-reported and absent figures stay distinct as `displayValue` and `casualtyDetail` define them. Actor spelling variants are shown separately, never merged. Scan freshness from `/api/scan-health` is in the sidebar.

## Verification

`scratch/v5-redesign-e2e/v5-e2e.mjs` is the rerunnable end-to-end check (`node scratch/v5-redesign-e2e/v5-e2e.mjs [baseUrl]`). It writes screenshots and `results.json` beside itself and performs no writes.
