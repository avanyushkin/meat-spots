import { GROUP_COLORS, GROUP_LABELS, type ShopGroup } from "../types/shop";
import type { ShopFilters, VisitedFilter } from "../hooks/useFilteredShops";

interface FilterBarProps {
  filters: ShopFilters;
  onChange: (filters: ShopFilters) => void;
}

const GROUPS: ShopGroup[] = [1, 2, 3, 4];
const VISITED_OPTIONS: { value: VisitedFilter; label: string }[] = [
  { value: "all", label: "Все" },
  { value: "unvisited", label: "Не посещённые" },
  { value: "visited", label: "Посещённые" },
];

export function FilterBar({ filters, onChange }: FilterBarProps) {
  function toggleGroup(group: ShopGroup) {
    const groups = filters.groups.includes(group)
      ? filters.groups.filter((g) => g !== group)
      : [...filters.groups, group];
    onChange({ ...filters, groups });
  }

  return (
    <div className="filter-bar">
      <input
        className="filter-bar__search"
        type="text"
        placeholder="Поиск по названию или адресу"
        value={filters.search}
        onChange={(e) => onChange({ ...filters, search: e.target.value })}
      />
      <div className="filter-bar__row">
        {GROUPS.map((group) => (
          <button
            key={group}
            className={`chip ${filters.groups.includes(group) ? "active" : ""}`}
            style={{ "--chip-color": GROUP_COLORS[group] } as React.CSSProperties}
            onClick={() => toggleGroup(group)}
          >
            <span className="chip-dot" />
            {GROUP_LABELS[group]}
          </button>
        ))}
      </div>
      <div className="filter-bar__row">
        {VISITED_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            className={`chip ${filters.visited === opt.value ? "active" : ""}`}
            onClick={() => onChange({ ...filters, visited: opt.value })}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
