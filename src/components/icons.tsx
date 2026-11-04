import type { SVGProps } from "react";
import { NIGERIA_MAP_DATA } from "@/lib/mapData";

type IconProps = SVGProps<SVGSVGElement>;
const stroke = { fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round" } as const;

export const OverviewIcon = (p: IconProps) => <svg viewBox="0 0 20 20" aria-hidden="true" {...stroke} {...p}><rect x="3" y="3" width="6" height="6" rx="1.5" /><rect x="11" y="3" width="6" height="6" rx="1.5" /><rect x="3" y="11" width="6" height="6" rx="1.5" /><rect x="11" y="11" width="6" height="6" rx="1.5" /></svg>;
export const MapIcon = (p: IconProps) => <svg viewBox="0 0 20 20" aria-hidden="true" {...stroke} {...p}><path d="m2.5 5 5-2 5 2 5-2v12l-5 2-5-2-5 2V5Z" /><path d="M7.5 3v12M12.5 5v12" /></svg>;
export const ListIcon = (p: IconProps) => <svg viewBox="0 0 20 20" aria-hidden="true" {...stroke} {...p}><path d="M7 5h10M7 10h10M7 15h10" /><circle cx="3.5" cy="5" r=".9" fill="currentColor" /><circle cx="3.5" cy="10" r=".9" fill="currentColor" /><circle cx="3.5" cy="15" r=".9" fill="currentColor" /></svg>;
export const PatternsIcon = (p: IconProps) => <svg viewBox="0 0 20 20" aria-hidden="true" {...stroke} {...p}><path d="M3 17V3M3 17h14M6.5 13.5v-3M10 13.5V6M13.5 13.5V9" /></svg>;
export const StatesIcon = (p: IconProps) => <svg viewBox="0 0 20 20" aria-hidden="true" {...stroke} {...p}><path d="M10 2.5 17.5 6 10 9.5 2.5 6 10 2.5Z" /><path d="m2.5 10 7.5 3.5 7.5-3.5M2.5 14l7.5 3.5 7.5-3.5" /></svg>;
export const MethodIcon = (p: IconProps) => <svg viewBox="0 0 20 20" aria-hidden="true" {...stroke} {...p}><circle cx="10" cy="10" r="7.5" /><path d="M10 9v5M10 6.2v.1" /></svg>;
export const SearchIcon = (p: IconProps) => <svg viewBox="0 0 20 20" aria-hidden="true" {...stroke} strokeWidth={1.7} {...p}><circle cx="9" cy="9" r="5.5" /><path d="m13.2 13.2 3.3 3.3" /></svg>;
export const ShareIcon = (p: IconProps) => <svg viewBox="0 0 20 20" aria-hidden="true" {...stroke} strokeWidth={1.7} {...p}><path d="M10 12.5V3m0 0L6.5 6.5M10 3l3.5 3.5M5 10H4a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-5a1 1 0 0 0-1-1h-1" /></svg>;
export const CloseIcon = (p: IconProps) => <svg viewBox="0 0 20 20" aria-hidden="true" {...stroke} strokeWidth={1.7} {...p}><path d="m5 5 10 10M15 5 5 15" /></svg>;
export const UpIcon = (p: IconProps) => <svg viewBox="0 0 16 16" aria-hidden="true" {...stroke} strokeWidth={1.8} {...p}><path d="M8 13V3m0 0L4 7m4-4 4 4" /></svg>;
export const DownIcon = (p: IconProps) => <svg viewBox="0 0 16 16" aria-hidden="true" {...stroke} strokeWidth={1.8} {...p}><path d="M8 3v10m0 0 4-4m-4 4L4 9" /></svg>;
export const TableIcon = (p: IconProps) => <svg viewBox="0 0 20 20" aria-hidden="true" {...stroke} {...p}><rect x="3" y="4" width="14" height="12" rx="2" /><path d="M3 8h14M3 12h14M8 4v12" /></svg>;
export const FilterIcon = (p: IconProps) => <svg viewBox="0 0 20 20" aria-hidden="true" {...stroke} {...p}><path d="M3 5h14M6 10h8M8.5 15h3" /></svg>;
export const LinkIcon = (p: IconProps) => <svg viewBox="0 0 24 24" aria-hidden="true" {...stroke} strokeWidth={1.8} {...p}><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></svg>;
export const DownloadIcon = (p: IconProps) => <svg viewBox="0 0 24 24" aria-hidden="true" {...stroke} strokeWidth={1.8} {...p}><path d="M12 4v10m0 0-4-4m4 4 4-4M5 19h14" /></svg>;
export const TextIcon = (p: IconProps) => <svg viewBox="0 0 24 24" aria-hidden="true" {...stroke} strokeWidth={1.8} {...p}><path d="M5 6h14M5 10h14M5 14h9M5 18h6" /></svg>;
export const WhatsAppIcon = (p: IconProps) => <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...p}><path d="M12 2.5a9.5 9.5 0 0 0-8.2 14.3L2.5 21.5l4.8-1.3A9.5 9.5 0 1 0 12 2.5Zm0 17.3a7.8 7.8 0 0 1-4-1.1l-.3-.2-2.8.8.8-2.8-.2-.3A7.8 7.8 0 1 1 12 19.8Zm4.3-5.8c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.5.1l-.7.9c-.1.2-.3.2-.5.1a6.4 6.4 0 0 1-3.2-2.8c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.7-1.7c-.2-.5-.4-.4-.5-.4h-.5a.9.9 0 0 0-.7.3 2.8 2.8 0 0 0-.9 2.1 4.9 4.9 0 0 0 1 2.6 11.2 11.2 0 0 0 4.3 3.8c1.6.7 2.2.7 3 .6.5-.1 1.4-.6 1.6-1.1.2-.6.2-1 .1-1.1l-.4-.3Z" /></svg>;
export const XIcon = (p: IconProps) => <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...p}><path d="M17.8 3h3.1l-6.8 7.7 8 10.3h-6.3l-4.9-6.4L5.3 21H2.2l7.3-8.3L1.8 3h6.4l4.4 5.8L17.8 3Zm-1.1 16.2h1.7L7.4 4.7H5.6l11.1 14.5Z" /></svg>;
export const FacebookIcon = (p: IconProps) => <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...p}><path d="M13.5 21v-7.5h2.6l.4-3h-3V8.6c0-.9.3-1.5 1.5-1.5h1.6V4.4a21 21 0 0 0-2.3-.1c-2.3 0-3.9 1.4-3.9 4v2.2H7.8v3h2.6V21h3.1Z" /></svg>;
export const TelegramIcon = (p: IconProps) => <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...p}><path d="M21.4 4.2 2.9 11.3c-1.3.5-1.2 1.2-.2 1.5l4.7 1.5 1.8 5.6c.2.6.4.8.9.8.4 0 .6-.2.9-.4l2.3-2.2 4.7 3.5c.9.5 1.5.2 1.7-.8l3.1-14.6c.3-1.3-.5-1.9-1.4-1.5Zm-3.3 3.2-8.8 7.9-.3 3.7-1.6-5 10.2-6.4c.5-.3.9 0 .5.3v-.5Z" /></svg>;
export const LinkedInIcon = (p: IconProps) => <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...p}><path d="M5.2 8.7h3.2V19H5.2V8.7Zm1.6-5.1a1.9 1.9 0 1 1 0 3.7 1.9 1.9 0 0 1 0-3.7ZM10.4 8.7h3v1.4c.5-.8 1.5-1.7 3.2-1.7 3.4 0 4 2.2 4 5.1V19h-3.2v-5c0-1.2 0-2.7-1.7-2.7s-1.9 1.3-1.9 2.6V19h-3.2V8.7Z" /></svg>;

const STATES = Object.values(NIGERIA_MAP_DATA);
/** Canonical state names use "FCT"; the map data uses the full name. */
export const mapStateName = (state: string) => state === "FCT" ? "Federal Capital Territory" : state;

/** The state outlines, defined once per page; marks and locators reference them with <use>. */
export function MapDefs() {
  return <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true" focusable="false"><defs><g id="ng-states">{STATES.map((item) => <path key={item.id} d={item.path} />)}</g></defs></svg>;
}

/** Nigeria's outline in one colour: the brand mark. */
export function Silhouette({ color = "#e5484d", ...props }: IconProps & { color?: string }) {
  return <svg viewBox="0 0 1000 812" aria-hidden="true" {...props}><use href="#ng-states" fill={color} stroke={color} strokeWidth={2} /></svg>;
}

/** Nigeria with one state lit, so a place is recognisable before its name is read. */
export function Locator({ state, className = "loc" }: { state: string; className?: string }) {
  const lit = STATES.find((item) => item.name === mapStateName(state));
  return <svg className={className} viewBox="0 0 1000 812" aria-hidden="true"><use href="#ng-states" />{lit ? <path d={lit.path} className="on" /> : null}</svg>;
}
