export default function Field({ label, children }) {
  return (
    <label style={{ display: "block" }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: "#6B7280", marginBottom: 4 }}>{label}</div>
      {children}
    </label>
  );
}
