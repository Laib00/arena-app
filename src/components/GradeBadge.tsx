import { GRADE_COLOR } from "../theme";
import type { Grade } from "../types/domain";

type GradeBadgeProps = {
  grade: Grade | string;
  size?: "sm" | "md";
};

export default function GradeBadge({ grade, size = "sm" }: GradeBadgeProps) {
  const color = GRADE_COLOR[grade as Grade] || "#6B7280";
  return (
    <span
      style={{
        display: "inline-block",
        padding: size === "sm" ? "2px 9px" : "4px 12px",
        borderRadius: 999,
        fontSize: size === "sm" ? 11 : 12,
        fontWeight: 600,
        letterSpacing: 0.3,
        color: "#fff",
        background: color,
      }}
    >
      {grade}
    </span>
  );
}
