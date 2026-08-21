import type { ReactNode } from "react";

type FieldProps = {
  label: string;
  children: ReactNode;
};

export default function Field({ label, children }: FieldProps) {
  return (
    <label style={{ display: "block" }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: "#6B7280", marginBottom: 4 }}>{label}</div>
      {children}
    </label>
  );
}
