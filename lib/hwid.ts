import crypto from "crypto";

export function hashHwid(rawHwid: string): string {
  return crypto.createHash("sha256").update(rawHwid).digest("hex");
}

export function isValidHwid(hwid: string): boolean {
  return typeof hwid === "string" && /^[a-f0-9]{64}$/i.test(hwid);
}
