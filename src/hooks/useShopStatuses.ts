import { useCallback, useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import type { ShopStatus } from "../types/shop";

interface ShopStatusRow {
  shop_id: string;
  visited: boolean;
  note: string;
  updated_at: string;
}

function rowToStatus(row: ShopStatusRow): ShopStatus {
  return { shopId: row.shop_id, visited: row.visited, note: row.note, updatedAt: row.updated_at };
}

export function useShopStatuses() {
  const [statuses, setStatuses] = useState<Record<string, ShopStatus>>({});
  const [loading, setLoading] = useState(true);
  const statusesRef = useRef(statuses);
  statusesRef.current = statuses;

  useEffect(() => {
    let channel: RealtimeChannel | undefined;
    let cancelled = false;

    (async () => {
      const { data, error } = await supabase.from("shop_status").select("*");
      if (!cancelled && !error && data) {
        setStatuses(Object.fromEntries((data as ShopStatusRow[]).map((row) => [row.shop_id, rowToStatus(row)])));
      }
      if (!cancelled) setLoading(false);

      channel = supabase
        .channel("shop_status_changes")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "shop_status" },
          (payload) => {
            if (payload.eventType === "DELETE") {
              const oldRow = payload.old as Partial<ShopStatusRow>;
              if (!oldRow.shop_id) return;
              setStatuses((prev) => {
                const next = { ...prev };
                delete next[oldRow.shop_id as string];
                return next;
              });
            } else {
              const row = payload.new as ShopStatusRow;
              setStatuses((prev) => ({ ...prev, [row.shop_id]: rowToStatus(row) }));
            }
          }
        )
        .subscribe();
    })();

    return () => {
      cancelled = true;
      if (channel) void supabase.removeChannel(channel);
    };
  }, []);

  const updateStatus = useCallback(
    async (shopId: string, patch: Partial<Pick<ShopStatus, "visited" | "note">>) => {
      const current = statusesRef.current[shopId];
      const next: ShopStatus = {
        shopId,
        visited: patch.visited ?? current?.visited ?? false,
        note: patch.note ?? current?.note ?? "",
        updatedAt: new Date().toISOString(),
      };

      // Оптимистичное обновление — UI отражает изменение сразу, до ответа Supabase.
      setStatuses((prev) => ({ ...prev, [shopId]: next }));

      const { error } = await supabase.from("shop_status").upsert({
        shop_id: shopId,
        visited: next.visited,
        note: next.note,
        updated_at: next.updatedAt,
      });

      if (error) {
        // откатываем оптимистичное обновление при ошибке
        setStatuses((prev) => (current ? { ...prev, [shopId]: current } : prev));
        throw error;
      }
    },
    []
  );

  return { statuses, loading, updateStatus };
}
