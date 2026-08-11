import React, { useRef, useEffect } from "react";
import { inputStyle } from "../theme";

export default function AutoResizeTextarea({ value, onChange, onSend, placeholder }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  }, [value]);

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          onSend();
        }
      }}
      placeholder={placeholder}
      rows={1}
      style={{
        ...inputStyle,
        flex: 1,
        padding: "12px 14px",
        resize: "none",
        overflowY: "auto",
        maxHeight: 200,
        lineHeight: 1.4,
        fontFamily: "inherit",
      }}
    />
  );
}
