import React from "react";

export default function ShennongLogo({ size = "md" }: { size?: "sm" | "md" }) {
  const box = size === "sm" ? 38 : 48;
  return (
    <span className="shennong-logo-mark" style={{ width: box, height: box }} aria-hidden="true">
      <svg viewBox="0 0 48 48" width="100%" height="100%" fill="none">
        <path d="M11 34C11.8 22.7 18.4 12.8 32.8 8.5C31.2 20.2 25.1 31.7 11 34Z" fill="#1E5B38" />
        <path d="M11 34C15.8 26.8 22.8 20.6 31.2 15.8" stroke="#F8FAF4" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M11.2 34.1C8.7 35.7 7.1 37.6 6.3 40" stroke="#1E5B38" strokeWidth="2.3" strokeLinecap="round" />
      </svg>
    </span>
  );
}
