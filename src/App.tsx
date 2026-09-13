import { useEffect, useState } from "react";
import shopsData from "./data/shops.json";
import type { Shop } from "./types/shop";
import { useAuth } from "./hooks/useAuth";
import { useShopStatuses } from "./hooks/useShopStatuses";
import { useFilteredShops, DEFAULT_FILTERS, type ShopFilters } from "./hooks/useFilteredShops";
import { useBackButton } from "./lib/telegram";
import { useTelegramTheme } from "./hooks/useTelegramTheme";
import { LoginScreen } from "./components/LoginScreen";
import { ViewSwitcher, type View } from "./components/ViewSwitcher";
import { FilterBar } from "./components/FilterBar";
import { ShopMap } from "./components/ShopMap";
import { ShopList } from "./components/ShopList";
import { ShopDetailsSheet } from "./components/ShopDetailsSheet";

const shops = shopsData as Shop[];

function MainApp() {
  const { statuses, updateStatus } = useShopStatuses();
  const [view, setView] = useState<View>("map");
  const [filters, setFilters] = useState<ShopFilters>(DEFAULT_FILTERS);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);

  const filteredShops = useFilteredShops(shops, statuses, filters);

  useEffect(() => {
    if (!selectedShop) return;
    return useBackButton(() => setSelectedShop(null));
  }, [selectedShop]);

  return (
    <div className="app">
      <ViewSwitcher view={view} onChange={setView} />
      <FilterBar filters={filters} onChange={setFilters} />
      <div className="app__content">
        {view === "map" ? (
          <ShopMap shops={filteredShops} statuses={statuses} onSelect={setSelectedShop} />
        ) : (
          <ShopList shops={filteredShops} statuses={statuses} onSelect={setSelectedShop} />
        )}
      </div>
      {selectedShop && (
        <ShopDetailsSheet
          shop={selectedShop}
          status={statuses[selectedShop.id]}
          onClose={() => setSelectedShop(null)}
          onUpdate={(patch) => updateStatus(selectedShop.id, patch)}
        />
      )}
    </div>
  );
}

export default function App() {
  useTelegramTheme();
  const { status, error, signIn } = useAuth();

  if (status === "loading") {
    return (
      <div className="centered-screen">
        <div className="spinner" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return <LoginScreen onSubmit={signIn} error={error} />;
  }

  return <MainApp />;
}
