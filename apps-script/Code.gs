const SPREADSHEET_ID = "1GJbVNuZZqqVha010GZNQbEmN9BEEsr6gtRntqYpRLJw";
const ITEMS_SHEET_NAME = "Items";
const RUNS_SHEET_NAME = "Runs";
const RUN_ITEMS_SHEET_NAME = "RunItems";
const SECRET_KEY = "albion_bm_tracker_8xQ2mP_2026_private";

const HEADERS = [
  "id",
  "name",
  "category",
  "tier",
  "enchant",
  "buyPrice",
  "sellPrice",
  "profit",
  "roi",
  "updatedBy",
  "updatedAt",
  "comment",
];

const RUN_HEADERS = [
  "id",
  "createdAt",
  "createdBy",
  "totalItems",
  "totalBuy",
  "totalSell",
  "totalProfit",
  "roi",
  "comment",
];

const RUN_ITEM_HEADERS = [
  "id",
  "runId",
  "itemId",
  "name",
  "category",
  "tier",
  "enchant",
  "quantity",
  "buyPrice",
  "sellPrice",
  "profitPerItem",
  "totalBuy",
  "totalSell",
  "totalProfit",
];

function doPost(e) {
  try {
    const request = parseRequest(e);

    if (request.secret !== SECRET_KEY) {
      return jsonResponse({ ok: false, error: "Unauthorized" });
    }

    switch (request.action) {
      case "list":
        return jsonResponse({ ok: true, items: listItems() });
      case "create":
        return jsonResponse({ ok: true, item: createItem(request.payload || {}) });
      case "update":
        return jsonResponse({ ok: true, item: updateItem(request.payload || {}) });
      case "delete":
        deleteItem((request.payload || {}).id);
        return jsonResponse({ ok: true });
      case "createRun":
        return jsonResponse({ ok: true, run: createRun(request.payload || {}) });
      case "listRuns":
        return jsonResponse({ ok: true, runs: listRuns() });
      case "getRunDetails":
        return jsonResponse({ ok: true, details: getRunDetails((request.payload || {}).runId) });
      case "deleteRun":
        deleteRun((request.payload || {}).runId);
        return jsonResponse({ ok: true });
      default:
        return jsonResponse({ ok: false, error: "Unknown action" });
    }
  } catch (error) {
    return jsonResponse({ ok: false, error: error.message || String(error) });
  }
}

function setupSheet() {
  setupSheets();
  return getSheet(ITEMS_SHEET_NAME, HEADERS);
}

function setupSheets() {
  getSheet(ITEMS_SHEET_NAME, HEADERS);
  getSheet(RUNS_SHEET_NAME, RUN_HEADERS);
  getSheet(RUN_ITEMS_SHEET_NAME, RUN_ITEM_HEADERS);
}

function getSheet(sheetName, headers) {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = spreadsheet.getSheetByName(sheetName);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
  }

  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  const currentHeaders = headerRange.getValues()[0].map(String);
  const headersAreEmpty = currentHeaders.every((header) => header.trim() === "");
  const headersAreDifferent = headers.some((header, index) => currentHeaders[index] !== header);

  if (headersAreEmpty || headersAreDifferent) {
    headerRange.setValues([headers]);
    sheet.setFrozenRows(1);
  }

  return sheet;
}

function listItems() {
  const sheet = getSheet(ITEMS_SHEET_NAME, HEADERS);
  const lastRow = sheet.getLastRow();

  if (lastRow < 2) {
    return [];
  }

  const values = sheet.getRange(2, 1, lastRow - 1, HEADERS.length).getValues();

  return values
    .filter((row) => String(row[0]).trim() !== "")
    .map(rowToItem);
}

function createItem(payload) {
  const sheet = getSheet(ITEMS_SHEET_NAME, HEADERS);
  const buyPrice = Number(payload.buyPrice) || 0;
  const sellPrice = Number(payload.sellPrice) || 0;
  const profit = calculateProfit(buyPrice, sellPrice);
  const roi = calculateRoi(buyPrice, profit);
  const item = {
    id: Utilities.getUuid(),
    name: String(payload.name || "").trim(),
    category: String(payload.category || "").trim(),
    tier: Number(payload.tier) || 0,
    enchant: Number(payload.enchant) || 0,
    buyPrice,
    sellPrice,
    profit,
    roi,
    updatedBy: String(payload.updatedBy || "").trim(),
    updatedAt: new Date().toISOString(),
    comment: String(payload.comment || "").trim(),
  };

  sheet.appendRow(itemToRow(item));
  return item;
}

function updateItem(payload) {
  const sheet = getSheet(ITEMS_SHEET_NAME, HEADERS);
  const id = String(payload.id || "").trim();
  const rowIndex = findRowById(sheet, id);

  if (rowIndex === -1) {
    throw new Error("Item not found");
  }

  const buyPrice = Number(payload.buyPrice) || 0;
  const sellPrice = Number(payload.sellPrice) || 0;
  const profit = calculateProfit(buyPrice, sellPrice);
  const roi = calculateRoi(buyPrice, profit);
  const item = {
    id,
    name: String(payload.name || "").trim(),
    category: String(payload.category || "").trim(),
    tier: Number(payload.tier) || 0,
    enchant: Number(payload.enchant) || 0,
    buyPrice,
    sellPrice,
    profit,
    roi,
    updatedBy: String(payload.updatedBy || "").trim(),
    updatedAt: new Date().toISOString(),
    comment: String(payload.comment || "").trim(),
  };

  sheet.getRange(rowIndex, 1, 1, HEADERS.length).setValues([itemToRow(item)]);
  return item;
}

function deleteItem(id) {
  const sheet = getSheet(ITEMS_SHEET_NAME, HEADERS);
  const rowIndex = findRowById(sheet, String(id || "").trim());

  if (rowIndex === -1) {
    throw new Error("Item not found");
  }

  sheet.deleteRow(rowIndex);
}

function createRun(payload) {
  const payloadItems = Array.isArray(payload.items) ? payload.items : [];

  if (payloadItems.length === 0) {
    throw new Error("Run items are required");
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    setupSheets();
    const runSheet = getSheet(RUNS_SHEET_NAME, RUN_HEADERS);
    const runItemSheet = getSheet(RUN_ITEMS_SHEET_NAME, RUN_ITEM_HEADERS);
    const runId = Utilities.getUuid();
    const createdAt = new Date().toISOString();
    const runItems = payloadItems.map((payloadItem) => normalizeRunItem(payloadItem, runId));
    const totalItems = runItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalBuy = runItems.reduce((sum, item) => sum + item.totalBuy, 0);
    const totalSell = runItems.reduce((sum, item) => sum + item.totalSell, 0);
    const totalProfit = totalSell - totalBuy;
    const roi = calculateRoi(totalBuy, totalProfit);
    const run = {
      id: runId,
      createdAt,
      createdBy: String(payload.createdBy || "").trim() || "Не указано",
      totalItems,
      totalBuy,
      totalSell,
      totalProfit,
      roi,
      comment: String(payload.comment || "").trim(),
    };

    runSheet.appendRow(runToRow(run));
    runItemSheet.getRange(runItemSheet.getLastRow() + 1, 1, runItems.length, RUN_ITEM_HEADERS.length).setValues(runItems.map(runItemToRow));

    return run;
  } finally {
    lock.releaseLock();
  }
}

function listRuns() {
  const sheet = getSheet(RUNS_SHEET_NAME, RUN_HEADERS);
  const lastRow = sheet.getLastRow();

  if (lastRow < 2) {
    return [];
  }

  const values = sheet.getRange(2, 1, lastRow - 1, RUN_HEADERS.length).getValues();

  return values
    .filter((row) => String(row[0]).trim() !== "")
    .map(rowToRun)
    .sort((first, second) => new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime());
}

function getRunDetails(runId) {
  const id = String(runId || "").trim();
  const runsSheet = getSheet(RUNS_SHEET_NAME, RUN_HEADERS);
  const runItemsSheet = getSheet(RUN_ITEMS_SHEET_NAME, RUN_ITEM_HEADERS);
  const runRowIndex = findRowById(runsSheet, id);

  if (runRowIndex === -1) {
    throw new Error("Run not found");
  }

  const run = rowToRun(runsSheet.getRange(runRowIndex, 1, 1, RUN_HEADERS.length).getValues()[0]);
  const lastRow = runItemsSheet.getLastRow();
  const items = lastRow < 2
    ? []
    : runItemsSheet.getRange(2, 1, lastRow - 1, RUN_ITEM_HEADERS.length).getValues()
      .filter((row) => String(row[1]) === id)
      .map(rowToRunItem);

  return { run, items };
}

function deleteRun(runId) {
  const id = String(runId || "").trim();
  const runsSheet = getSheet(RUNS_SHEET_NAME, RUN_HEADERS);
  const runItemsSheet = getSheet(RUN_ITEMS_SHEET_NAME, RUN_ITEM_HEADERS);
  const runRowIndex = findRowById(runsSheet, id);

  if (runRowIndex === -1) {
    throw new Error("Run not found");
  }

  runsSheet.deleteRow(runRowIndex);
  deleteRowsByColumnValue(runItemsSheet, 2, id);
}

function normalizeRunItem(payloadItem, runId) {
  const quantity = Math.max(1, Math.floor(Number(payloadItem.quantity) || 1));
  const buyPrice = Math.max(0, Number(payloadItem.buyPrice) || 0);
  const sellPrice = Math.max(0, Number(payloadItem.sellPrice) || 0);
  const profitPerItem = calculateProfit(buyPrice, sellPrice);
  const totalBuy = buyPrice * quantity;
  const totalSell = sellPrice * quantity;
  const totalProfit = profitPerItem * quantity;

  return {
    id: Utilities.getUuid(),
    runId,
    itemId: String(payloadItem.itemId || payloadItem.id || "").trim(),
    name: String(payloadItem.name || "").trim(),
    category: String(payloadItem.category || "").trim(),
    tier: Number(payloadItem.tier) || 0,
    enchant: Number(payloadItem.enchant) || 0,
    quantity,
    buyPrice,
    sellPrice,
    profitPerItem,
    totalBuy,
    totalSell,
    totalProfit,
  };
}

function calculateProfit(buyPrice, sellPrice) {
  return Number(sellPrice) - Number(buyPrice);
}

function calculateRoi(buyPrice, profit) {
  const numericBuyPrice = Number(buyPrice);

  if (numericBuyPrice === 0) {
    return 0;
  }

  return (Number(profit) / numericBuyPrice) * 100;
}

function parseRequest(e) {
  if (!e || !e.postData || !e.postData.contents) {
    throw new Error("Empty request body");
  }

  return JSON.parse(e.postData.contents);
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function findRowById(sheet, id) {
  if (!id) {
    return -1;
  }

  const lastRow = sheet.getLastRow();

  if (lastRow < 2) {
    return -1;
  }

  const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  const rowOffset = ids.findIndex((row) => String(row[0]) === id);

  return rowOffset === -1 ? -1 : rowOffset + 2;
}

function deleteRowsByColumnValue(sheet, columnIndex, expectedValue) {
  const lastRow = sheet.getLastRow();

  if (lastRow < 2) {
    return;
  }

  const values = sheet.getRange(2, columnIndex, lastRow - 1, 1).getValues();

  for (let index = values.length - 1; index >= 0; index -= 1) {
    if (String(values[index][0]) === expectedValue) {
      sheet.deleteRow(index + 2);
    }
  }
}

function rowToItem(row) {
  return {
    id: String(row[0]),
    name: String(row[1]),
    category: String(row[2]),
    tier: Number(row[3]) || 0,
    enchant: Number(row[4]) || 0,
    buyPrice: Number(row[5]) || 0,
    sellPrice: Number(row[6]) || 0,
    profit: Number(row[7]) || 0,
    roi: Number(row[8]) || 0,
    updatedBy: String(row[9]),
    updatedAt: row[10] instanceof Date ? row[10].toISOString() : String(row[10]),
    comment: String(row[11] || ""),
  };
}

function rowToRun(row) {
  return {
    id: String(row[0]),
    createdAt: row[1] instanceof Date ? row[1].toISOString() : String(row[1]),
    createdBy: String(row[2] || ""),
    totalItems: Number(row[3]) || 0,
    totalBuy: Number(row[4]) || 0,
    totalSell: Number(row[5]) || 0,
    totalProfit: Number(row[6]) || 0,
    roi: Number(row[7]) || 0,
    comment: String(row[8] || ""),
  };
}

function rowToRunItem(row) {
  return {
    id: String(row[0]),
    runId: String(row[1]),
    itemId: String(row[2]),
    name: String(row[3]),
    category: String(row[4]),
    tier: Number(row[5]) || 0,
    enchant: Number(row[6]) || 0,
    quantity: Number(row[7]) || 0,
    buyPrice: Number(row[8]) || 0,
    sellPrice: Number(row[9]) || 0,
    profitPerItem: Number(row[10]) || 0,
    totalBuy: Number(row[11]) || 0,
    totalSell: Number(row[12]) || 0,
    totalProfit: Number(row[13]) || 0,
  };
}

function itemToRow(item) {
  return HEADERS.map((header) => item[header]);
}

function runToRow(run) {
  return RUN_HEADERS.map((header) => run[header]);
}

function runItemToRow(item) {
  return RUN_ITEM_HEADERS.map((header) => item[header]);
}