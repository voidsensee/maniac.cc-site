export type SubscriptionType =
  | "none"
  | "gta_v_altv_7d"
  | "gta_v_altv_30d"
  | "gta_v_altv_lifetime";

export interface SubscriptionInfo {
  days: number;          // -1 = lifetime
  label: string;         // для UI
  product: string;       // "gta_v_altv"
}

export const SUBSCRIPTIONS: Record<SubscriptionType, SubscriptionInfo> = {
  none: {
    days: 0,
    label: "Нет подписки",
    product: "none",
  },
  gta_v_altv_7d: {
    days: 7,
    label: "GTA V / alt:V — 7 дней",
    product: "gta_v_altv",
  },
  gta_v_altv_30d: {
    days: 30,
    label: "GTA V / alt:V — 30 дней",
    product: "gta_v_altv",
  },
  gta_v_altv_lifetime: {
    days: -1,
    label: "GTA V / alt:V — Lifetime",
    product: "gta_v_altv",
  },
};

export function isLifetime(type: string): boolean {
  return type.endsWith("_lifetime");
}

export function getSubscriptionInfo(type: string): SubscriptionInfo {
  return SUBSCRIPTIONS[type as SubscriptionType] ?? SUBSCRIPTIONS.none;
}

/**
 * Считает дату окончания подписки от текущего момента.
 * Возвращает null для lifetime или none.
 */
export function calculateSubscriptionUntil(type: string): Date | null {
  const info = getSubscriptionInfo(type);
  if (info.days <= 0) return null; // none или lifetime
  const d = new Date();
  d.setDate(d.getDate() + info.days);
  return d;
}
