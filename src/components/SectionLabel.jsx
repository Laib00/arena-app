import { NAVY } from "../theme";

export default function SectionLabel({ n, title }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
      <div style={{ width: 24, height: 24, borderRadius: "50%", background: NAVY, color: "#fff", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{n}</div>
      <h2 style={{ fontFamily: "Georgia, serif", fontSize: 18, margin: 0 }}>{title}</h2>
    </div>
  );
}
