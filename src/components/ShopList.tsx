import type { Shop, ShopStatus } from "../types/shop";
import { GROUP_COLORS, VISITED_COLOR } from "../types/shop";

interface ShopListProps {
  shops: Shop[];
  statuses: Record<string, ShopStatus>;
  onSelect: (shop: Shop) => void;
}

export function ShopList({ shops, statuses, onSelect }: ShopListProps) {
  if (shops.length === 0) {
    return <div className="empty-state">Ничего не найдено по текущим фильтрам</div>;
  }

  return (
    <div className="shop-list">
      {shops.map((shop) => {
        const status = statuses[shop.id];
        const visited = status?.visited ?? false;
        const color = visited ? VISITED_COLOR : GROUP_COLORS[shop.group];
        return (
          <button
            key={shop.id}
            className={`shop-card ${visited ? "visited" : ""}`}
            onClick={() => onSelect(shop)}
          >
            <span className="shop-card__dot" style={{ background: color }} />
            <span className="shop-card__body">
              <p className="shop-card__name">{shop.name}</p>
              <p className="shop-card__address">{shop.address}</p>
              {status?.note && <p className="shop-card__note">{status.note}</p>}
            </span>
          </button>
        );
      })}
    </div>
  );
}
