export type View = "map" | "list";

interface ViewSwitcherProps {
  view: View;
  onChange: (view: View) => void;
}

export function ViewSwitcher({ view, onChange }: ViewSwitcherProps) {
  return (
    <div className="view-switcher">
      <button className={view === "map" ? "active" : ""} onClick={() => onChange("map")}>
        Карта
      </button>
      <button className={view === "list" ? "active" : ""} onClick={() => onChange("list")}>
        Список
      </button>
    </div>
  );
}
