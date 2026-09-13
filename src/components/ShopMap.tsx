import { useMemo } from "react";
import { MapContainer, Marker, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import type { Shop, ShopStatus } from "../types/shop";
import { GROUP_COLORS, VISITED_COLOR } from "../types/shop";

const MINSK_CENTER: [number, number] = [53.9006, 27.559];

function markerIcon(color: string): L.DivIcon {
  return L.divIcon({
    className: "",
    html: `<div class="marker-pin" style="background:${color}"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 18],
    popupAnchor: [0, -18],
  });
}

interface ShopMapProps {
  shops: Shop[];
  statuses: Record<string, ShopStatus>;
  onSelect: (shop: Shop) => void;
}

// Держит карту отцентрованной по Минску при первом рендере, без ре-центровки
// при последующих изменениях фильтров (чтобы не сбивать зум пользователя).
function FitOnce() {
  const map = useMap();
  useMemo(() => {
    map.setView(MINSK_CENTER, 12);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

export function ShopMap({ shops, statuses, onSelect }: ShopMapProps) {
  const icons = useMemo(() => {
    const map = new Map<string, L.DivIcon>();
    for (const color of [...Object.values(GROUP_COLORS), VISITED_COLOR]) {
      map.set(color, markerIcon(color));
    }
    return map;
  }, []);

  return (
    <MapContainer center={MINSK_CENTER} zoom={12} className="shop-map" zoomControl={false}>
      <FitOnce />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {shops.map((shop) => {
        const visited = statuses[shop.id]?.visited ?? false;
        const color = visited ? VISITED_COLOR : GROUP_COLORS[shop.group];
        return (
          <Marker
            key={shop.id}
            position={[shop.lat, shop.lng]}
            icon={icons.get(color)}
            eventHandlers={{ click: () => onSelect(shop) }}
          />
        );
      })}
    </MapContainer>
  );
}
