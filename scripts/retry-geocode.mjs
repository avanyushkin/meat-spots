// Повторная попытка геокодирования для точек needsReview: пробуем найти хотя бы
// улицу (без номера дома), чтобы точка не залипала в центре города.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const shopsPath = path.join(__dirname, "..", "src", "data", "shops.json");
const shops = JSON.parse(readFileSync(shopsPath, "utf-8"));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function streetOnly(address) {
  const cleaned = address
    .replace(/\s*—\s*status_notes:.*$/i, "")
    .replace(/\s*—\s*(флагманский|открыт|переезд).*$/i, "")
    .replace(/\([^)]*\)/g, "")
    .replace(/оптовый склад:\s*/i, "")
    .replace(/д\.\s*/i, "")
    .replace(/\s+/g, " ")
    .trim();

  // Nominatim плохо понимает сокращения ("пр-т", "ул.") — \b не работает с
  // кириллицей в JS-регэкспах (Cyrillic буквы не входят в \w), поэтому
  // разворачиваем в полные слова через посимвольное сравнение токенов.
  const EXPAND = {
    "пр-т": "проспект",
    "пр-т.": "проспект",
    "просп.": "проспект",
    "ул.": "улица",
    "бул.": "бульвар",
    "пер.": "переулок",
  };
  const expanded = cleaned
    .split(" ")
    .map((token) => EXPAND[token.toLowerCase()] ?? token)
    .join(" ");

  // Отбрасываем хвостовые сегменты через запятую, которые содержат номер дома
  // или дублируют "Минск" — оставляем только название улицы/района.
  // ВАЖНО: не резать по одиночному дефису — он часть "пр-т", "5-6" и т.п.
  const parts = expanded.split(",").map((p) => p.trim()).filter(Boolean);
  while (parts.length > 1) {
    const last = parts[parts.length - 1];
    if (/\d/.test(last) || /^минск$/i.test(last)) parts.pop();
    else break;
  }
  return parts.join(", ");
}

async function geocode(query) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&accept-language=ru&q=${encodeURIComponent(query)}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "meat-shops-tracker-miniapp/1.0 (one-off geocoding retry)" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  await sleep(1100);
  if (!data.length) return null;
  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
}

const MINSK_CENTER = { lat: 53.9006, lng: 27.559 };

for (const shop of shops) {
  if (!shop.needsReview) continue;
  const street = streetOnly(shop.address);
  const query = `${street}, Минск, Беларусь`;
  console.log(`retry [${shop.id}] ${query}`);
  try {
    const coords = await geocode(query);
    if (coords) {
      shop.lat = coords.lat;
      shop.lng = coords.lng;
      console.log(`  -> ${coords.lat}, ${coords.lng} (street-level, still flagged for review)`);
    } else {
      shop.lat = MINSK_CENTER.lat;
      shop.lng = MINSK_CENTER.lng;
      console.log("  -> still not found, reset to city-center fallback");
    }
  } catch (err) {
    console.log(`  -> error: ${err.message}`);
  }
}

writeFileSync(shopsPath, JSON.stringify(shops, null, 2), "utf-8");
console.log("done");
