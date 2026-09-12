export type ShopItem = {
  id: string;
  slug: string;
  name: { ru: string; en: string };
  short: { ru: string; en: string };
  price: number;
  available: boolean;
  icon: string;
};

export const SHOP_ITEMS: ShopItem[] = [
  {
    id: "spoofer_majestic",
    slug: "spoofer",
    name: {
      ru: "Spoofer для Majestic RP",
      en: "Spoofer for Majestic RP",
    },
    short: {
      ru: "Полный обход HWID-банов на Majestic RP",
      en: "Full bypass of HWID bans on Majestic RP",
    },
    price: 500,
    available: true,
    icon: "shield",
  },
];

export function getShopItem(slug: string): ShopItem | undefined {
  return SHOP_ITEMS.find((i) => i.slug === slug);
}
