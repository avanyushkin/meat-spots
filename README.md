# Мясные точки — Минск (Telegram Mini App)

Трекер посещений магазинов: карта + список, группы (4 цвета), статус
посещения и заметка на магазин, синхронизация в реальном времени через
Supabase. Реализовано по [shop-tracker-roadmap.md](shop-tracker-roadmap.md).

## Что уже сделано

- Vite + React + TypeScript, `react-leaflet` карта, список с поиском и
  фильтрами (группа + статус посещения).
- `src/data/shops.json` — 74 точки, сгенерированы из `minsk_meat_shops.json`
  скриптами `scripts/build-shops.mjs` / `scripts/retry-geocode.mjs`
  (геокодирование через Nominatim/OSM).
- Auth-обёртка (`useAuth`), realtime-синхронизация статусов (`useShopStatuses`),
  сохранение сессии в `Telegram.WebApp.CloudStorage` (с фолбэком на
  `localStorage` вне Telegram — удобно для разработки в обычном браузере).
- SQL-миграция для Supabase: [supabase/migration.sql](supabase/migration.sql).

## Точность координат

19 из 74 адресов Nominatim не смог найти на уровне дома — им проставлены
координаты улицы или (в крайнем случае) центра Минска, и помечены полем
`"needsReview": true` в `src/data/shops.json`. Список:

```
node -e "console.log(require('./src/data/shops.json').filter(s=>s.needsReview).map(s=>s.name+' — '+s.address))"
```

Перед реальным использованием стоит вручную поправить координаты этих точек
(2ГИС/Яндекс.Карты) — правьте `lat`/`lng` прямо в JSON и снимите флаг.

## Что нужно сделать вам, чтобы приложение заработало (я не могу это сделать за вас)

### 1. Supabase

1. Создайте проект на [supabase.com](https://supabase.com).
2. В SQL Editor выполните [supabase/migration.sql](supabase/migration.sql).
3. В **Authentication → Providers** включите Email, отключите подтверждение
   почты (Confirm email = off), чтобы можно было создать пользователя без
   почтового ящика.
4. В **Authentication → Users** создайте одного пользователя (email + пароль)
   — это единственный логин для клиента.
5. Скопируйте `Project URL` и `anon public` ключ (Project Settings → API).

### 2. Переменные окружения

Скопируйте `.env.local.example` в `.env.local` и заполните:

```
VITE_SUPABASE_URL=<Project URL>
VITE_SUPABASE_ANON_KEY=<anon public key>
VITE_CLIENT_AUTH_EMAIL=<email пользователя из шага 1.4>
```

(Сейчас в `.env.local` лежат заглушки — приложение с ними откроет экран
логина, но вход не сработает, пока не подставите реальные значения.)

### 3. Локальный запуск

```
npm install
npm run dev
```

Откройте `http://localhost:5173` в браузере — карта, список, фильтры и
логин-форма работают и вне Telegram (CloudStorage подменяется на
localStorage). Realtime и вход заработают после подключения реального
Supabase-проекта (шаги 1-2).

### 4. Деплой на Vercel

```
npm i -g vercel   # если ещё не установлен
vercel
```

Добавьте те же три переменные окружения в настройках проекта на Vercel
(Project Settings → Environment Variables), передеплойте.

### 5. Регистрация Mini App в Telegram

1. Откройте [@BotFather](https://t.me/BotFather), если бота ещё нет — `/newbot`.
2. `/newapp`, выберите бота, укажите HTTPS-URL с Vercel.
3. Откройте приложение через кнопку/меню бота в реальном Telegram-клиенте
   (не в браузере) и проверьте: CloudStorage (сессия не слетает при
   повторном открытии), тему (светлая/тёмная), кнопку "Назад" в деталях
   магазина.

## Структура

См. дерево в [shop-tracker-roadmap.md](shop-tracker-roadmap.md) — реализовано
без отклонений: `src/{components,hooks,lib,types,data}`.

## Не реализовано / оставлено как есть по роадмапу

- Административного CRUD для магазинов нет (сознательно — по роадмапу
  `shops.json` правится вручную при пересборке).
- Истории версий заметок нет (сознательно — одна перезаписываемая заметка).
