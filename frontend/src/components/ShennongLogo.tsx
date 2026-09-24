import React from "react";

export default function ShennongLogo({ size = "md" }: { size?: "sm" | "md" }) {
  const box = size === "sm" ? 38 : 48;

  return (
    <span
      className="shennong-logo-mark inline-flex shrink-0"
      style={{ width: box, height: box }}
    >
      <img
        src="/farm-icon.svg"
        alt="Shennong logo"
        width={box}
        height={box}
        className="h-full w-full object-contain"
      />
    </span>
  );
}
