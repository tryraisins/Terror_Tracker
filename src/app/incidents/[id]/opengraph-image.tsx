import { ImageResponse } from "next/og";
import { getPublicIncident } from "@/lib/incident-public";
import { NIGERIA_MAP_DATA } from "@/lib/mapData";
import { dayLabel, placeLine, placeName, toSummaryRow } from "@/lib/summary";

export const runtime = "nodejs";
export const alt = "NATracker incident record";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const STATES = Object.values(NIGERIA_MAP_DATA);

/** The link preview: place, where, date and the toll, with the state lit on a map of Nigeria. Matches the in-page preview. */
export default async function OpenGraphImage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let incident = null;
  try {
    incident = await getPublicIncident(id);
  } catch (error) {
    console.error("Unable to render incident preview image:", error);
  }
  const row = incident ? toSummaryRow(incident) : null;
  const place = row ? placeName(row) : "Attacks across Nigeria";
  const lit = row ? (row.s === "FCT" ? "Federal Capital Territory" : row.s) : "";
  const killed = row?.k ? `${row.k.toLocaleString("en-NG")}${row.ko ? "+" : ""} killed` : "";
  const abducted = row?.ab ? `${row.ab.toLocaleString("en-NG")}${row.abo ? "+" : ""} abducted` : "";
  const pill = (text: string, background: string, color: string) => <span style={{ display: "flex", padding: "10px 24px", borderRadius: 999, background, color, fontSize: 30, fontWeight: 700 }}>{text}</span>;

  return new ImageResponse(
    <div style={{ display: "flex", width: "100%", height: "100%", background: "#151817", color: "#edf0ee", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", flexDirection: "column", width: 744, padding: "72px 0 64px 72px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 28, fontWeight: 800 }}>
          <svg width="52" height="42" viewBox="0 0 1000 812">{STATES.map((item) => <path key={item.id} d={item.path} fill="#e5484d" stroke="#e5484d" strokeWidth={2} />)}</svg>
          NATracker
        </div>
        <div style={{ display: "flex", marginTop: "auto", color: "#b1b8b4", fontSize: 28 }}>{row ? dayLabel(row, true) : "Reported attacks with cited sources"}</div>
        <div style={{ display: "flex", marginTop: 10, fontSize: place.length > 22 ? 56 : 72, fontWeight: 800, letterSpacing: -2, lineHeight: 1.05 }}>{place.length > 60 ? `${place.slice(0, 57)}...` : place}</div>
        <div style={{ display: "flex", marginTop: 10, color: "#b1b8b4", fontSize: 30 }}>{row ? placeLine(row) : "terrortracker.tryraisins.dev"}</div>
        <div style={{ display: "flex", gap: 16, marginTop: 36 }}>
          {killed ? pill(killed, "#2e1718", "#f59a9c") : null}
          {abducted ? pill(abducted, "#182230", "#93c0f2") : null}
          {row && !killed && !abducted ? pill("Toll not reported yet", "#202423", "#b1b8b4") : null}
        </div>
      </div>
      <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "center", padding: 36, background: "#1d2120" }}>
        <svg width="384" height="312" viewBox="0 0 1000 812">{STATES.map((item) => <path key={item.id} d={item.path} fill={item.name === lit ? "#edf0ee" : "#2e3432"} stroke="#1d2120" strokeWidth={4} />)}</svg>
      </div>
    </div>,
    { ...size },
  );
}
