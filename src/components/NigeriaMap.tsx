"use client";

import { NIGERIA_MAP_DATA } from "@/lib/mapData";

export type MapLabelMode = "none" | "counts" | "names";
export type MapTier = 0 | 1 | 2 | 3 | 4;

const STATES = Object.values(NIGERIA_MAP_DATA);

// Label nudges (viewBox units) where small southern states would collide.
const LABEL_OFFSET: Record<string, [number, number]> = {
  Lagos: [-6, 26], Ogun: [0, -16], Imo: [-12, -4], Abia: [16, -10], Rivers: [-10, 12],
  "Cross River": [14, -46], "Akwa Ibom": [8, 6], Anambra: [-10, -4], Ebonyi: [6, -6],
};

/** Band thresholds derived from the current maximum so the legend always matches the data shown. */
export function mapThresholds(max: number): [number, number, number] {
  if (max <= 3) return [2, 3, Math.max(max, 4)];
  return [Math.max(2, Math.ceil(max * 0.2)), Math.max(3, Math.ceil(max * 0.4)), Math.max(4, Math.ceil(max * 0.67))];
}

export function mapTier(count: number, thresholds: [number, number, number]): MapTier {
  if (!count) return 0;
  if (count >= thresholds[2]) return 4;
  if (count >= thresholds[1]) return 3;
  if (count >= thresholds[0]) return 2;
  return 1;
}

export function MapLegend({ thresholds, selectedLabel }: { thresholds: [number, number, number]; selectedLabel?: boolean }) {
  const [a, b, c] = thresholds;
  const bands: [MapTier, string][] = [[0, "None"], [1, a > 2 ? `1–${a - 1}` : "1"], [2, b - 1 > a ? `${a}–${b - 1}` : String(a)], [3, c - 1 > b ? `${b}–${c - 1}` : String(b)], [4, `${c}+`]];
  return <div className="map-legend" aria-label="Map key: records filed per state">
    <span className="map-legend__title">Records filed</span>
    {bands.map(([tier, label]) => <span key={tier}><i className={`map-swatch map-swatch--${tier}`} />{label}</span>)}
    {selectedLabel ? <span><i className="map-swatch map-swatch--selected" />Selected</span> : null}
  </div>;
}

export default function NigeriaMap({ counts, labels = "counts", selected, onSelect, thresholds }: {
  counts: Record<string, number>;
  labels?: MapLabelMode;
  selected?: string;
  onSelect?: (name: string) => void;
  thresholds: [number, number, number];
}) {
  const active = STATES.find((item) => item.name === selected);
  return <svg className={`nigeria-map ${onSelect ? "nigeria-map--interactive" : ""}`} viewBox="0 0 1000 812" aria-hidden="true" focusable="false">
    {STATES.map((item) => {
      const count = counts[item.name] ?? 0;
      return <path key={item.id} className={`nigeria-map__state map-tier--${mapTier(count, thresholds)}`} d={item.path} onClick={onSelect ? () => onSelect(item.name) : undefined}><title>{`${item.name}: ${count} ${count === 1 ? "record" : "records"}`}</title></path>;
    })}
    {active ? <path className="nigeria-map__selected" d={active.path} /> : null}
    {labels !== "none" ? STATES.map((item) => {
      const count = counts[item.name] ?? 0;
      const tier = mapTier(count, thresholds);
      const [dx, dy] = LABEL_OFFSET[item.name] ?? [0, 0];
      const x = item.x + dx;
      const y = item.y + dy;
      const name = item.name === "Federal Capital Territory" ? "FCT" : item.name;
      return <g key={`${item.id}-label`} className={`nigeria-map__label map-label--${tier}`} onClick={onSelect ? () => onSelect(item.name) : undefined}>
        {labels === "names" ? <text className="nigeria-map__name" x={x} y={y - 6} textAnchor="middle">{name}</text> : null}
        <text className="nigeria-map__count" x={x} y={labels === "names" ? y + 20 : y + 9} textAnchor="middle">{count}</text>
      </g>;
    }) : null}
  </svg>;
}
