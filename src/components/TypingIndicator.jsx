import { GOLD } from "../theme";

export default function TypingIndicator({ name }) {
  return (
    <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 14 }}>
      <div>
        <div style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 3 }}>{name}</div>
        <div style={{ padding: "12px 16px", borderRadius: 14, borderBottomLeftRadius: 4, background: "#fff", border: "1px solid #E2DFD6", display: "flex", gap: 4 }}>
          {[0, 1, 2].map((i) => (
            <span key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: GOLD, animation: `arenaPulse 1.2s ${i * 0.15}s infinite ease-in-out` }} />
          ))}
        </div>
      </div>
      <style>{`@keyframes arenaPulse { 0%, 80%, 100% { opacity: 0.25; transform: scale(0.85); } 40% { opacity: 1; transform: scale(1); } }`}</style>
    </div>
  );
}
