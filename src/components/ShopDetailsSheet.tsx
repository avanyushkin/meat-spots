import { useEffect, useState } from "react";
import type { Shop, ShopStatus } from "../types/shop";
import { GROUP_LABELS } from "../types/shop";

interface ShopDetailsSheetProps {
  shop: Shop;
  status: ShopStatus | undefined;
  onClose: () => void;
  onUpdate: (patch: Partial<Pick<ShopStatus, "visited" | "note">>) => Promise<void>;
}

// Заметка сохраняется по кнопке "Сохранить" (не debounce) — так пользователь
// явно видит момент сохранения и не рискует потерять правки при быстром закрытии.
export function ShopDetailsSheet({ shop, status, onClose, onUpdate }: ShopDetailsSheetProps) {
  const [note, setNote] = useState(status?.note ?? "");
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [togglingVisited, setTogglingVisited] = useState(false);

  useEffect(() => {
    setNote(status?.note ?? "");
    setJustSaved(false);
  }, [shop.id, status?.note]);

  const visited = status?.visited ?? false;
  const noteDirty = note !== (status?.note ?? "");

  async function handleToggleVisited() {
    setTogglingVisited(true);
    try {
      await onUpdate({ visited: !visited });
    } finally {
      setTogglingVisited(false);
    }
  }

  async function handleSaveNote() {
    setSaving(true);
    try {
      await onUpdate({ note });
      setJustSaved(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet__handle" />
        <div className="sheet__header">
          <h2>{shop.name}</h2>
          <p>{shop.address}</p>
          <p>{GROUP_LABELS[shop.group]}</p>
        </div>

        <textarea
          placeholder="Заметка о магазине…"
          value={note}
          onChange={(e) => {
            setNote(e.target.value);
            setJustSaved(false);
          }}
        />

        <div className="sheet__actions">
          <button
            className={`btn-toggle ${visited ? "active" : ""}`}
            onClick={handleToggleVisited}
            disabled={togglingVisited}
          >
            {visited ? "Посещён ✓" : "Отметить посещённым"}
          </button>
          <button className="btn-primary" onClick={handleSaveNote} disabled={saving || !noteDirty}>
            {saving ? "Сохраняем…" : "Сохранить заметку"}
          </button>
        </div>

        {justSaved && !noteDirty && <div className="sheet__saved">Заметка сохранена</div>}

        <button className="sheet__close" onClick={onClose}>
          Закрыть
        </button>
      </div>
    </div>
  );
}
