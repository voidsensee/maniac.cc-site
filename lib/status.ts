export type StatusState =
  | "undetected"
  | "updating"
  | "maintenance"
  | "detected"
  | "offline"
  | "testing"
  | "fixing"
  | "patch_day";

export const STATUS_LIST: {
  value: StatusState;
  label: string;
  color: string;
  pulse: boolean;
  hint: string;
}[] = [
  {
    value: "undetected",
    label: "Undetected",
    color: "text-emerald-400 border-emerald-400/30 bg-emerald-400/10",
    pulse: true,
    hint: "Everything works. Safe to use.",
  },
  {
    value: "updating",
    label: "Updating",
    color: "text-yellow-400 border-yellow-400/30 bg-yellow-400/10",
    pulse: true,
    hint: "Update in progress. Please wait.",
  },
  {
    value: "maintenance",
    label: "Maintenance",
    color: "text-orange-400 border-orange-400/30 bg-orange-400/10",
    pulse: true,
    hint: "Server maintenance. Temporary downtime.",
  },
  {
    value: "detected",
    label: "Detected",
    color: "text-red-400 border-red-400/30 bg-red-400/10",
    pulse: true,
    hint: "Detected by anticheat. DO NOT USE.",
  },
  {
    value: "offline",
    label: "Offline",
    color: "text-white/50 border-white/10 bg-white/5",
    pulse: false,
    hint: "Service is offline. Subscriptions frozen.",
  },
  {
    value: "testing",
    label: "Testing",
    color: "text-blue-400 border-blue-400/30 bg-blue-400/10",
    pulse: true,
    hint: "Beta version. Testers only.",
  },
  {
    value: "fixing",
    label: "Fixing",
    color: "text-purple-400 border-purple-400/30 bg-purple-400/10",
    pulse: true,
    hint: "Bugfix in progress. May be unstable.",
  },
  {
    value: "patch_day",
    label: "Patch Day",
    color: "text-amber-400 border-amber-400/30 bg-amber-400/10",
    pulse: true,
    hint: "Game updated. Status unknown. Wait for announcement.",
  },
];

export function getStatusInfo(state: string) {
  return (
    STATUS_LIST.find((s) => s.value === state) ?? STATUS_LIST[4] // fallback: offline
  );
}
