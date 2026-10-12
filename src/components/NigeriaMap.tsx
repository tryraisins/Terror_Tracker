"use client";

import { useEffect, useRef, useState } from "react";
import { NIGERIA_MAP_DATA } from "@/lib/mapData";

/** "auto" shows names with counts when the map is wide enough to read them, otherwise counts only. */
export type MapLabelMode = "none" | "counts" | "names" | "auto";
const NAMES_MIN_WIDTH = 600;
export type MapTier = 0 | 1 | 2 | 3 | 4;

const STATES = Object.values(NIGERIA_MAP_DATA);

// Label nudges (viewBox units) where small southern states would collide; tuned with names shown.
const LABEL_OFFSET: Record<string, [number, number]> = {
  Lagos: [-6, 26], Ogun: [0, -16], Imo: [-14, 6], Abia: [22, -4], Rivers: [-2, 12], Bayelsa: [-12, 0],
  "Cross River": [24, -8], "Akwa Ibom": [8, 6], Anambra: [-24, 6], Ebonyi: [12, -2], Enugu: [-8, 2],
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

export function MapLegend({ thresholds, selectedLabel, title = "Records filed" }: { thresholds: [number, number, number]; selectedLabel?: boolean; title?: string }) {
  const [a, b, c] = thresholds;
  const bands: [MapTier, string][] = [[0, "None"], [1, a > 2 ? `1–${a - 1}` : "1"], [2, b - 1 > a ? `${a}–${b - 1}` : String(a)], [3, c - 1 > b ? `${b}–${c - 1}` : String(b)], [4, `${c}+`]];
  return <div className="map-legend" aria-label={`Map key: ${title.toLowerCase()}`}>
    <span className="map-legend__title">{title}</span>
    {bands.map(([tier, label]) => <span key={tier}><i className={`map-swatch map-swatch--${tier}`} />{label}</span>)}
    {selectedLabel ? <span><i className="map-swatch map-swatch--selected" />Selected</span> : null}
  </div>;
}

export default function NigeriaMap({ counts, labels: labelMode = "counts", selected, onSelect, thresholds, unit = ["record", "records"] }: {
  counts: Record<string, number>;
  labels?: MapLabelMode;
  selected?: string;
  onSelect?: (name: string) => void;
  thresholds: [number, number, number];
  unit?: [singular: string, plural: string];
}) {
  const ref = useRef<SVGSVGElement>(null);
  const [wide, setWide] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (labelMode !== "auto" || !node) return;
    const observer = new ResizeObserver(([entry]) => setWide(entry.contentRect.width >= NAMES_MIN_WIDTH));
    observer.observe(node);
    return () => observer.disconnect();
  }, [labelMode]);
  const labels = labelMode === "auto" ? (wide ? "names" : "counts") : labelMode;
  const active = STATES.find((item) => item.name === selected);
  return <svg ref={ref} className={`nigeria-map nigeria-map--${labels} ${onSelect ? "nigeria-map--interactive" : ""}`} viewBox="0 0 1000 812" aria-hidden="true" focusable="false">
    {STATES.map((item) => {
      const count = counts[item.name] ?? 0;
      return <path key={item.id} className={`nigeria-map__state map-tier--${mapTier(count, thresholds)}`} d={item.path} onClick={onSelect ? () => onSelect(item.name) : undefined}><title>{`${item.name}: ${count.toLocaleString("en-NG")} ${count === 1 ? unit[0] : unit[1]}`}</title></path>;
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
        <text className="nigeria-map__count" x={x} y={labels === "names" ? y + 20 : y + 9} textAnchor="middle">{count.toLocaleString("en-NG")}</text>
      </g>;
    }) : null}
  </svg>;
}
