import { ImageResponse } from "next/og";
import { incidentDateLabel, locationLabel, statusLabel } from "@/lib/incident-view";
import { getPublicIncident } from "@/lib/incident-public";

export const runtime = "nodejs";
export const alt = "NATracker incident record";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let incident = null;
  try {
    incident = await getPublicIncident(id);
  } catch (error) {
    console.error("Unable to render incident preview image:", error);
  }

  const title = incident?.title ?? "Reported incidents across Nigeria";
  const shortTitle = title.length > 160 ? `${title.slice(0, 157)}...` : title;
  const location = incident ? locationLabel(incident.location, true) : "Public record · Cited sources · Visible uncertainty";
  const date = incident ? incidentDateLabel(incident) : "NATracker";
  const stateColor = incident?.status === "confirmed" ? "#53d17c" : incident?.status === "developing" ? "#ffad58" : "#d7b1a4";

  return new ImageResponse(
    <div style={{ display: "flex", width: "100%", height: "100%", padding: 58, background: "#0b0c0f", color: "#f4efe9", fontFamily: "Arial, sans-serif" }}>
      <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", padding: 42, border: "1px solid #353238", borderRadius: 28, background: "linear-gradient(135deg, #17181c 0%, #111216 72%, #1d1213 100%)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ display: "flex", width: 42, height: 42, alignItems: "center", justifyContent: "center", borderRadius: 12, background: "#e53620", fontSize: 25, fontWeight: 800 }}>N</div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: 1 }}>NATracker</span>
            <span style={{ marginTop: 3, color: "#b7a9a3", fontSize: 12, letterSpacing: 2 }}>NIGERIA INCIDENT RECORD</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 9, marginLeft: "auto", padding: "10px 15px", border: "1px solid #514b4b", borderRadius: 22, color: stateColor, fontSize: 15, fontWeight: 700 }}>
            <span style={{ display: "flex", width: 9, height: 9, borderRadius: 9, background: stateColor }} />{incident ? statusLabel(incident.status) : "PUBLIC RECORD"}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", flex: 1, marginTop: 24 }}>
          <div style={{ display: "flex", marginBottom: 15, color: "#ff806f", fontSize: 16, fontWeight: 700, letterSpacing: 2 }}>{location} · {date}</div>
          <div style={{ display: "flex", overflow: "hidden", color: "#f4efe9", fontFamily: "Georgia, serif", fontSize: shortTitle.length > 100 ? 40 : shortTitle.length > 65 ? 46 : 54, fontWeight: 700, lineHeight: 1.15 }}>{shortTitle}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 18, borderTop: "1px solid #353238", color: "#b7a9a3", fontSize: 16 }}>
          <span>Reported information · Cited sources · Visible uncertainty</span>
          <span style={{ color: "#e6cfc5", fontWeight: 700 }}>terrortracker.tryraisins.dev</span>
        </div>
      </div>
    </div>,
    { ...size },
  );
}
