import { useMemo } from "react";
import type { Shop, ShopGroup, ShopStatus } from "../types/shop";

export type VisitedFilter = "all" | "visited" | "unvisited";

export interface ShopFilters {
  groups: ShopGroup[]; // пусто = все группы
  visited: VisitedFilter;
  search: string;
}

export const DEFAULT_FILTERS: ShopFilters = {
  groups: [],
  visited: "all",
  search: "",
};

export function useFilteredShops(
  shops: Shop[],
  statuses: Record<string, ShopStatus>,
  filters: ShopFilters
): Shop[] {
  return useMemo(() => {
    const query = filters.search.trim().toLowerCase();

    return shops.filter((shop) => {
      if (filters.groups.length > 0 && !filters.groups.includes(shop.group)) return false;

      const visited = statuses[shop.id]?.visited ?? false;
      if (filters.visited === "visited" && !visited) return false;
      if (filters.visited === "unvisited" && visited) return false;

      if (query) {
        const haystack = `${shop.name} ${shop.address}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }

      return true;
    });
  }, [shops, statuses, filters]);
}
