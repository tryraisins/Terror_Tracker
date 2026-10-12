# NATracker design direction

Updated 12 October 2026. The current direction is the "V2 editorial" redesign. The user rejected the deployed "Public Ledger" look as generic and overloaded ("too much content on the home page"; geography must not be on the home page), redesigned it in Pen (`redesign.pen`, frames prefixed "V2", desktop and mobile for every page), and asked for it to be implemented. Dark is the only theme; do not add a light mode or light palette.

## Thesis

A sober public record, not a dashboard. Each page leads with one clear statement or title, then the evidence. Hierarchy comes from a serif/sans pairing, generous space and hairline rules. There are no stat-card rows, uppercase monospace labels or decorative boxes. Colour carries meaning only: red for deaths, ochre for abductions, blue-grey for injuries. Reporting status is shown with neutral marks so it never competes with those colours.

## Pages

- **Home:** period line, the year's reported death toll as one large figure, a single sentence, and one context paragraph (abductions, record count, most recent attack). Then "year so far": monthly chart (Attacks, Deaths, Abductions), a people-harmed proportion bar, and the top five attributed groups. Then the seven latest records. No map, no state ranking, no stat boxes.
- **Record (`/incidents`):** title, underlined search line, filter bar (state, status, impact, dates with quick ranges), sort tabs, result totals, record rows with place, group and status, pagination. On phones the filters collapse behind a "Filters" button.
- **Incident:** back link, date and place, headline, status mark with its definition, four impact figures, account (what, where, when, attributed to, tags), sources, history, sharing, and other records from the same state.
- **Map:** measure toggle (attacks, deaths, abductions) and status filter, the state map with a selected-state panel, the state ranking (top 12, expandable to all 37; the keyboard route into the map), and attributed groups.
- **Method:** a readable article with an "On this page" index (a "Jump to a section" control on phones).

## Tokens (src/app/globals.css)

Canvas `#0d0c0b`, field `#151311`, raised `#1c1a17`, ink `#ece6dc`, secondary ink `#a69e92`, muted ink `#8a8278` (lighter than the Pen value `#746d63` so small text passes WCAG AA), rule `#25221e`, strong rule `#3d3833`. Deaths `#e2553e`, abductions `#cfa05a`, injuries `#8597aa`, neutral bars `#57514a` with the peak month in secondary ink. Map bands `#171513` (none) through `#2c211d`, `#5a2a20`, `#9a3526` to `#e2553e`. Corners are square except 2px on controls. Status marks: confirmed is a solid dot, developing a filled ring, unconfirmed a hollow ring. Older variable names (`--surface`, `--signal`, `--ochre` and so on) remain as aliases for react-select and admin styles.

## Typography

Noto Serif for headings, headlines and large figures; Noto Sans for text, labels and data. Both are self-hosted through `next/font` with `latin`, `latin-ext` and `vietnamese` subsets because the Yoruba dot-below letters live in the Vietnamese range. A 12 October 2026 glyph test showed Noto covers every Yoruba (ẹ ọ ṣ ǹ), Hausa (ɓ ɗ ƙ ƴ) and Igbo (ị ụ ṅ) letter where most other families fall back mid-word; the E2E check re-tests the sample in both faces. Noto Sans Mono was dropped.

## Map

Real state boundaries from `src/lib/mapData.ts` via `src/components/NigeriaMap.tsx`. `labels="auto"` shows state names above counts when the rendered map is at least 600px wide and counts only below that, so names are never too small to read. Label nudges for the crowded south were tuned with names visible. `design/nigeria-map-v2.js` is the matching Pen script node.

## Preserved behaviour and data rules

Public routes, API contracts, archive filters, pagination, `?state=` and `?search=` deep links, sharing, source links, record history, admin screens and the typed soft-deletion flow are unchanged. Unknown, zero/not-reported and absent figures stay distinct exactly as `displayValue` and `casualtyDetail` define them. The chart marks the partial month and keeps a data table. Actor spelling variants are shown separately and tagged, never merged. `/api/stats` returns seven latest records (was five). The header search icon opens `/incidents?focus=search`, which focuses the search field. Scan freshness from `/api/scan-health` moved from the removed utility strip to the footer.

## Verification

`scratch/v2-redesign-e2e/v2-e2e.mjs` is the rerunnable end-to-end check (`node scratch/v2-redesign-e2e/v2-e2e.mjs [baseUrl]`). Its header lists the failure modes it targets; it writes screenshots and `results.json` beside itself and performs no writes. `scratch/v2-redesign-e2e/map-labels.mjs` captures the desktop map for label-collision review.
