export type ShopGroup = 1 | 2 | 3 | 4;

export interface Shop {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  group: ShopGroup;
  /** true если координаты не удалось геокодировать точно и стоит проверить вручную */
  needsReview?: boolean;
}

export interface ShopStatus {
  shopId: string;
  visited: boolean;
  note: string;
  updatedAt: string;
}

export const GROUP_LABELS: Record<ShopGroup, string> = {
  1: "Небольшие частные магазины",
  2: "Крупный формат (единично)",
  3: "Небольшие сети",
  4: "Крупные сети / мясокомбинаты",
};

export const GROUP_COLORS: Record<ShopGroup, string> = {
  1: "#e0475f",
  2: "#f2a541",
  3: "#3fa76a",
  4: "#3d7ddb",
};

export const VISITED_COLOR = "#9aa1ab";
