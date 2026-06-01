# Albion Black Market Tracker

MVP frontend-приложения на React, Vite и TypeScript для учета торговли на черном рынке Albion Online.

Основной режим хранения данных — Google Таблица через Google Apps Script Web App. Если `VITE_APPS_SCRIPT_URL` не задан, приложение не падает и временно работает на локальном fallback с моковыми данными/localStorage.

## Быстрый старт

```bash
npm install
npm run dev
```

После команды `npm run dev` Vite покажет локальный адрес, обычно `http://localhost:5173/`. Откройте его в браузере.

## Сборка
```bash
npm run build
```

## Подключение Google Таблицы

1. Создать Google Таблицу.
2. Назвать лист `Items`.
3. В первую строку добавить заголовки:
   ```text
   id
   name
   category
   tier
   enchant
   buyPrice
   sellPrice
   profit
   roi
   updatedBy
   updatedAt
   comment
   ```
4. Открыть **Расширения → Apps Script**.
5. Вставить код из `apps-script/Code.gs`.
6. Вставить `SPREADSHEET_ID` в константу `SPREADSHEET_ID` в начале `apps-script/Code.gs` вместо `PASTE_SPREADSHEET_ID_HERE`.
7. Проверить `SECRET_KEY`:
   ```text
   albion_bm_tracker_8xQ2mP_2026_private
   ```
8. Запустить `setupSheet()` в редакторе Apps Script и выдать нужные разрешения.
9. Нажать **Deploy / Начать развертывание**.
10. Выбрать **New deployment / Новое развертывание**.
11. Выбрать тип **Web app**.
12. Установить **Execute as: Me**.
13. Установить **Who has access: Anyone with the link**.
14. Получить **Web App URL**.
15. Создать `.env` в корне проекта:
    ```env
    VITE_APPS_SCRIPT_URL=ваш_web_app_url
    VITE_SECRET_KEY=albion_bm_tracker_8xQ2mP_2026_private
    VITE_POLLING_INTERVAL_MS=5000
    ```
16. Запустить проект:
    ```bash
    npm install
    npm run dev
    ```

## Как проверить синхронизацию

- Открыть сайт в двух вкладках.
- Добавить предмет в одной вкладке.
- Через 5 секунд он должен появиться во второй вкладке.
- Изменить цену в одной вкладке.
- Через 5 секунд обновление должно появиться во второй.

## Как работает API

Frontend отправляет только `POST`-запросы в Google Apps Script Web App. Формат тела запроса:

```json
{
  "secret": "albion_bm_tracker_8xQ2mP_2026_private",
  "action": "list",
  "payload": {}
}
```

Поддерживаемые actions:

- `list` — получить предметы из Google Таблицы.
- `create` — создать строку; `id`, `profit`, `roi` и `updatedAt` считаются на стороне Apps Script.
- `update` — найти строку по `id` и обновить ее без создания дубля.
- `delete` — найти строку по `id` и удалить ее.

## Данные

Начальные моковые предметы лежат в `src/data/mockItems.ts`. Они используются только как fallback, если не настроен `VITE_APPS_SCRIPT_URL`.