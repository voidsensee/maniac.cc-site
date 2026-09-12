"use client";

import { getStatusInfo } from "@/lib/status";

export function StatusBadge({
  state,
  size = "md",
}: {
  state: string;
  size?: "sm" | "md" | "lg";
}) {
  const s = getStatusInfo(state);
  const padding =
    size === "sm" ? "px-2 py-0.5 text-[10px]" : size === "lg" ? "px-4 py-2 text-sm" : "px-3 py-1.5 text-xs";
  const dot = size === "sm" ? "h-1.5 w-1.5" : size === "lg" ? "h-3 w-3" : "h-2 w-2";

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border font-medium ${s.color} ${padding}`}
    >
      {s.pulse && (
        <span className="relative flex" style={{ width: "auto", height: "auto" }}>
          <span className={`absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-75 ${dot}`} />
          <span className={`relative inline-flex rounded-full bg-current ${dot}`} />
        </span>
      )}
      {s.label}
    </div>
  );
}
