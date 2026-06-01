const SPREADSHEET_ID = "1GJbVNuZZqqVha010GZNQbEmN9BEEsr6gtRntqYpRLJw";
const SHEET_NAME = "Items";
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
      default:
        return jsonResponse({ ok: false, error: "Unknown action" });
    }
  } catch (error) {
    return jsonResponse({ ok: false, error: error.message || String(error) });
  }
}

function setupSheet() {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME);
  }

  const headerRange = sheet.getRange(1, 1, 1, HEADERS.length);
  const currentHeaders = headerRange.getValues()[0].map(String);
  const headersAreEmpty = currentHeaders.every((header) => header.trim() === "");
  const headersAreDifferent = HEADERS.some((header, index) => currentHeaders[index] !== header);

  if (headersAreEmpty || headersAreDifferent) {
    headerRange.setValues([HEADERS]);
    sheet.setFrozenRows(1);
  }

  return sheet;
}

function listItems() {
  const sheet = setupSheet();
  const lastRow = sheet.getLastRow();

  if (lastRow < 2) {
    return [];
  }

  const values = sheet.getRange(2, 1, lastRow - 1, HEADERS.length).getValues();

  return values
    .filter((row) => String(row[0]).trim() !== "")
    .map((row) => ({
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
    }));
}

function createItem(payload) {
  const sheet = setupSheet();
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
  const sheet = setupSheet();
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
  const sheet = setupSheet();
  const rowIndex = findRowById(sheet, String(id || "").trim());

  if (rowIndex === -1) {
    throw new Error("Item not found");
  }

  sheet.deleteRow(rowIndex);
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

function itemToRow(item) {
  return HEADERS.map((header) => item[header]);
}