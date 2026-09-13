// Одноразовый скрипт: превращает raw-shops.json (справочник по категориям)
// в плоский src/data/shops.json (Shop[]) с координатами.
// Геокодирование через Nominatim (OSM), с диск-кэшем и троттлингом 1 req/sec.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const raw = JSON.parse(readFileSync(path.join(__dirname, "raw-shops.json"), "utf-8"));
const cachePath = path.join(__dirname, "geocode-cache.json");
const cache = existsSync(cachePath) ? JSON.parse(readFileSync(cachePath, "utf-8")) : {};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Убираем уточнения в скобках/после тире и служебные префиксы — так Nominatim
// находит адрес надёжнее. Оригинальный адрес всё равно сохраняется в Shop.address.
function cleanAddress(addr) {
  return addr
    .replace(/\s*[—-]\s*status_notes:.*$/i, "")
    .replace(/\s*[—-]\s*(флагманский|открыт|переезд).*$/i, "")
    .replace(/\([^)]*\)/g, "")
    .replace(/оптовый склад:\s*/i, "")
    .replace(/д\.\s*/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function geocode(address) {
  const key = address;
  if (cache[key]) return cache[key];

  const query = `${address}, Минск, Беларусь`;
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&accept-language=ru&q=${encodeURIComponent(query)}`;

  const res = await fetch(url, {
    headers: { "User-Agent": "meat-shops-tracker-miniapp/1.0 (one-off geocoding script)" },
  });
  if (!res.ok) throw new Error(`Nominatim HTTP ${res.status} for "${query}"`);
  const data = await res.json();
  await sleep(1100); // уважаем rate limit Nominatim (1 req/sec)

  if (!data.length) {
    console.warn(`  no geocode result for: ${query}`);
    cache[key] = null;
    writeFileSync(cachePath, JSON.stringify(cache, null, 2), "utf-8");
    return null;
  }
  const result = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  cache[key] = result;
  writeFileSync(cachePath, JSON.stringify(cache, null, 2), "utf-8");
  return result;
}

// Минск, координаты центра — используются как фолбэк, если геокодер не нашёл адрес,
// чтобы точка не терялась молча, а помечалась needsReview.
const MINSK_CENTER = { lat: 53.9006, lng: 27.5590 };

let idCounter = 0;
const shops = [];

for (const category of raw.categories) {
  for (const entry of category.shops) {
    const addresses = entry.addresses ?? [];
    for (const addr of addresses) {
      idCounter += 1;
      const id = `s${idCounter}`;
      const cleaned = cleanAddress(addr);
      console.log(`[${id}] ${entry.name} — ${cleaned}`);
      let coords;
      try {
        coords = await geocode(cleaned);
      } catch (err) {
        console.warn(`  geocode error: ${err.message}`);
        coords = null;
      }
      const needsReview = !coords;
      shops.push({
        id,
        name: entry.name,
        address: addr,
        lat: coords ? coords.lat : MINSK_CENTER.lat,
        lng: coords ? coords.lng : MINSK_CENTER.lng,
        group: category.category_id,
        ...(needsReview ? { needsReview: true } : {}),
      });
    }
  }
}

const outPath = path.join(__dirname, "..", "src", "data", "shops.json");
writeFileSync(outPath, JSON.stringify(shops, null, 2), "utf-8");
console.log(`\nDone. ${shops.length} shops written to ${outPath}`);
const missing = shops.filter((s) => s.needsReview).length;
if (missing) console.log(`${missing} shops need manual coordinate review (needsReview: true).`);
