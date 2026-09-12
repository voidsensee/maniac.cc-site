export const CURRENCY = {
  code: "MANI",
  symbol: "Ɱ",
  name: "Mani",
  plural: "Mani",
};

export function formatMani(amount: number | undefined | null): string {
  const n = typeof amount === "number" && !isNaN(amount) ? amount : 0;
  return `${n.toLocaleString("ru-RU")} ${CURRENCY.symbol}`;
}

export const MANI_TO_DAYS: Record<number, { days: number; label: string }> = {
  100: { days: 7, label: "7 days subscription" },
  350: { days: 30, label: "30 days subscription" },
  1500: { days: -1, label: "Lifetime subscription" },
};
