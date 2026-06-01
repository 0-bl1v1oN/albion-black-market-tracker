# Albion Black Market Tracker

MVP frontend-приложения на React, Vite и TypeScript для локального учета торговли на черном рынке Albion Online.

## Что делать сейчас

Проект уже написан. Его не нужно вручную «собирать» перед обычным просмотром. Для разработки нужно один раз установить зависимости, затем запустить dev-сервер.

```bash
npm install
npm run dev
```

После команды `npm run dev` Vite покажет локальный адрес, обычно `http://localhost:5173/`. Откройте его в браузере.

## Сборка

Сборка нужна позже — чтобы проверить production-версию или выложить проект на хостинг.

```bash
npm run build
```

## Почему раньше была ошибка ENOENT package.json

`package.json` должен лежать в корне проекта, чтобы команды `npm install`, `npm run dev` и `npm run build` запускались прямо из папки `albion-black-market-tracker`.

## Данные

Начальные моковые предметы лежат в `src/data/mockItems.ts`. Пользовательские изменения сохраняются в `localStorage` браузера.

## Как потом заменить localStorage на Google Apps Script API

Сейчас доступ к хранилищу изолирован в `src/utils/storage.ts`. Позже можно заменить функции `loadItems` и `saveItems` на запросы `fetch` к опубликованному Google Apps Script Web App:

- `loadItems()` → `GET` запрос к Apps Script;
`saveItems(items)` → `POST` запрос с JSON-массивом предметов.