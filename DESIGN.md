# NATracker design direction

Updated 12 October 2026. The current direction is the "Public Ledger" redesign, which the user requested as a fresh redesign in Pen (`redesign.pen`, five screens) and then asked to implement. It supersedes the 5 October incremental direction. Dark is the only theme; do not add a light mode or light palette.

## Thesis

NATracker reads as a public-interest ledger rather than an app dashboard. Hierarchy comes from typography, hairline rules and tabular figures instead of cards, gradients and shadows. One signal colour is reserved for deaths, so emphasis always means the same thing.

## Tokens (src/app/globals.css)

Canvas `#0f0e0c`, field `#161512`, raised `#1c1a17`, night (utility strip and footer) `#080706`, ink `#efe9df`, secondary ink `#bdb5a8`, muted ink `#8e867a`, rule `#2e2b26`, strong rule `#5c564c`. Signal (deaths, peak month, developing status) `#e8452d` with small-text variant `#f2705a`. Ochre (abductions) `#d69a3a`, slate (injuries) `#7096b8`. Map bands run from `#1a1815` (no records) through `#2a1d19`, `#5c2619`, `#9e301d` to `#e8452d`. Corners are square; the only radius is 2px on form fields. Older variable names (`--surface`, `--border`, `--ring` and so on) remain as aliases for components that style through inline variables.

## Typography

Noto Sans (variable weight and width) with Noto Sans Mono, self-hosted through `next/font` in `src/app/layout.tsx`. Display text, large figures and headings use the width axis at 72–78 (`font-variation-settings:"wdth"`); body text stays at full width; dates, places, status and labels use the mono cut in uppercase.

The choice was tested, not assumed. In a browser glyph-coverage test (12 October 2026) only Noto Sans and Inter rendered every Yoruba (ẹ ọ ṣ ǹ), Hausa (ɓ ɗ ƙ ƴ) and Igbo (ị ụ ṅ) character; Archivo, IBM Plex, Barlow, Sofia Sans, Roboto Flex, Public Sans, Geist Mono and JetBrains Mono fall back mid-word on at least one of them, and Source Sans/Source Code Pro miss ƙ and ƴ. Of the two passing families only Noto has a condensed width, and Noto Sans Mono is the only tested mono with full coverage. All tested families have tabular figures. The `latin`, `latin-ext` and `vietnamese` subsets are required because the dot-below letters live in the Vietnamese unicode range.

## Map

Maps use the real state boundaries from `src/lib/mapData.ts` through `src/components/NigeriaMap.tsx` (the user rejected a tile cartogram). Shading bands are derived from the current maximum so the legend always matches the data, and labels for crowded southern states are nudged. The alphabetical state index stays as the keyboard and screen-reader route into the map. `design/nigeria-map.js` is the equivalent Pen script node.

## Preserved behaviour and data rules

Public routes, API contracts, all archive filters, pagination, `?state=` deep links, sharing, source links, record history, admin permissions and the typed soft-deletion flow are unchanged. Unknown, zero/not-reported and absent figures stay distinct exactly as `displayValue` and `casualtyDetail` define them. The chart labels the partial month and keeps its data table. Actor spelling variants are shown separately and tagged rather than merged. The dashboard map needs every state, so `/api/stats` now returns all states in `byState` (previously the top 10).

## Verification

`scratch/ledger-redesign-e2e/ledger-e2e.mjs` is the rerunnable end-to-end check (`node scratch/ledger-redesign-e2e/ledger-e2e.mjs [baseUrl]`); it writes screenshots and `results.json` beside itself and performs no writes.
