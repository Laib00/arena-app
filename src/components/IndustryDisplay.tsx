import { useState } from "react";
import { NAVY, GOLD } from "../theme";
import { ENABLE_FINANCIAL_PLANNING } from "../data/personas";
import type { Industry } from "../types/domain";

type IndustryDisplayProps = {
  industry: Industry;
  switchIndustry: (industry: Industry) => void;
};

export default function IndustryDisplay({ industry, switchIndustry }: IndustryDisplayProps) {
  const [editing, setEditing] = useState(false);

  if (!ENABLE_FINANCIAL_PLANNING) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 32, fontSize: 13, color: "#6B7280" }}>
        <span>Industry:</span>
        <span style={{ fontWeight: 700, color: NAVY }}>Property</span>
      </div>
    );
  }

  if (editing) {
    return (
      <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 32 }}>
        {(["Property", "FP"] as const).map((ind) => (
          <button
            key={ind}
            onClick={() => { switchIndustry(ind); setEditing(false); }}
            style={{
              padding: "10px 18px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600,
              border: industry === ind ? `2px solid ${NAVY}` : "1px solid #E2DFD6",
              background: industry === ind ? NAVY : "#fff",
              color: industry === ind ? "#fff" : NAVY,
            }}
          >
            {ind === "Property" ? "Property" : "Financial Planning"}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 32, fontSize: 13, color: "#6B7280" }}>
      <span>Industry:</span>
      <span style={{ fontWeight: 700, color: NAVY }}>{industry === "Property" ? "Property" : "Financial Planning"}</span>
      <button
        onClick={() => setEditing(true)}
        style={{ background: "none", border: "none", cursor: "pointer", color: GOLD, fontWeight: 600, fontSize: 13, textDecoration: "underline" }}
      >
        change
      </button>
    </div>
  );
}
