// ═══════════════════════════════════════════════════════════════════════════
// FLOORSTOCK PULL CARDS - BACKEND v2 (Hardened)
// A Floorstock Systems tool - floorstocksystems.com
// Paste this entire file over the old Code.gs, then deploy a NEW VERSION
// of the EXISTING deployment (Deploy > Manage deployments > pencil icon >
// Version: New version > Deploy). This keeps your URL the same.
//
// FIRST-TIME SETUP (or new customer install):
//   1. Run initializeSheets() once from the editor (Run button).
//   2. Run backupNow() once to authorize Drive access.
//   3. Add a trigger: Triggers (clock icon) > Add Trigger >
//      weeklyBackup > Time-driven > Week timer > pick a day/time.
// ═══════════════════════════════════════════════════════════════════════════

const CARDS_SHEET    = 'Cards';
const ORDERS_SHEET   = 'Orders';
const CATS_SHEET     = 'Categories';
const SETTINGS_SHEET = 'Settings';

const CARD_HEADERS  = ['id','sku','desc','bin','supplier','qty','orderat','orderunit','notes','image','created','category','printed'];
const ORDER_HEADERS = ['orderId','cardId','sku','desc','supplier','qtyOrdered','date','loggedAt','submittedBy','unitCost','po'];
const CAT_HEADERS   = ['id','name','prefix','created'];

const BACKUP_FOLDER_NAME = 'Pull Card Backups';
const BACKUPS_TO_KEEP    = 8;

// ═══ SETUP ══════════════════════════════════════════════════════════════════
// Run this once from the editor. Safe to run again any time; it only creates
// what is missing and never touches existing data.
function initializeSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ensureSheet(ss, CARDS_SHEET, CARD_HEADERS);
  ensureSheet(ss, ORDERS_SHEET, ORDER_HEADERS);
  ensureSheet(ss, CATS_SHEET, CAT_HEADERS);
  ensureSheet(ss, SETTINGS_SHEET, ['key','value']);
  Logger.log('All sheets present and headers verified.');
}

function ensureSheet(ss, name, headers) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    return sheet;
  }
  // Sheet exists: make sure every expected header is present (append missing).
  const lastCol = Math.max(sheet.getLastColumn(), 1);
  const existing = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(String);
  headers.forEach(h => {
    if (existing.indexOf(h) === -1) {
      sheet.getRange(1, sheet.getLastColumn() + 1).setValue(h);
      existing.push(h);
    }
  });
  return sheet;
}

// ═══ READ ═══════════════════════════════════════════════════════════════════
function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) || 'getAll';
    if (action === 'getCards')      return ok(readSheet(CARDS_SHEET));
    if (action === 'getOrders')     return ok(readSheet(ORDERS_SHEET));
    if (action === 'getCategories') return ok(readSheet(CATS_SHEET));
    return ok({
      cards: readSheet(CARDS_SHEET),
      orders: readSheet(ORDERS_SHEET),
      categories: readSheet(CATS_SHEET),
      settings: readSettings()
    });
  } catch (err) { return error(err.toString()); }
}

function readSheet(name) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
  if (!sheet) return [];
  const rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return [];
  const headers = rows[0];
  return rows.slice(1)
    .filter(row => row.some(cell => cell !== '' && cell !== null))
    .map(row => {
      const obj = {};
      headers.forEach((h, i) => { if (h) obj[h] = row[i]; });
      return obj;
    });
}

function readSettings() {
  const rows = readSheet(SETTINGS_SHEET);
  const out = {};
  rows.forEach(r => { if (r.key) out[r.key] = r.value; });
  return out;
}

// ═══ WRITE ROUTER ═══════════════════════════════════════════════════════════
// Every write acquires a script lock so two users saving at the same moment
// cannot interleave reads and writes and corrupt rows.
function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
  } catch (err) {
    return error('Server is busy, please try again in a moment.');
  }
  try {
    const data = JSON.parse(e.postData.contents);
    let result;
    if      (data.action === 'saveCard')       { saveOneCard(data.card);                        result = ok('saved');   }
    else if (data.action === 'deleteCard')     { deleteOneCard(data.cardId);                    result = ok('deleted'); }
    else if (data.action === 'logOrder')       { logOrder(data.order);                          result = ok('logged');  }
    else if (data.action === 'updateOrder')    { updateOrder(data.order);                       result = ok('updated'); }
    else if (data.action === 'deleteOrder')    { deleteOrder(data.orderId);                     result = ok('deleted'); }
    else if (data.action === 'togglePrinted')  { setPrinted([data.cardId], data.printed);       result = ok('updated'); }
    else if (data.action === 'markPrinted')    { setPrinted(data.cardIds, true);                result = ok('updated'); }
    else if (data.action === 'saveCategory')   { saveOneCategory(data.category);                result = ok('saved');   }
    else if (data.action === 'deleteCategory') { deleteCategorySurgical(data.categoryId);       result = ok('deleted'); }
    else if (data.action === 'saveSetting')    { saveSetting(data.key, data.value);             result = ok('saved');   }
    // Legacy bulk endpoints, kept so the current frontend keeps working.
    // Rewritten to write in a single atomic setValues call instead of a
    // destructive clear + row-by-row loop.
    else if (data.action === 'saveCards')      { bulkWrite(CARDS_SHEET, CARD_HEADERS, data.cards, cardToRow);     result = ok('saved'); }
    else if (data.action === 'saveCategories') { bulkWrite(CATS_SHEET, CAT_HEADERS, data.categories, catToRow);   result = ok('saved'); }
    else result = error('Unknown action');
    return result;
  } catch (err) {
    return error(err.toString());
  } finally {
    lock.releaseLock();
  }
}

// ═══ ROW MAPPERS ════════════════════════════════════════════════════════════
function cardToRow(c) {
  return [
    c.id||'', c.sku||'', c.desc||'', c.bin||'', c.supplier||'',
    c.qty||'', c.orderat||'', c.orderunit||'', c.notes||'',
    c.image||'', c.created||'', c.category||'', c.printed||''
  ];
}
function catToRow(c) {
  return [c.id||'', c.name||'', c.prefix||'', c.created||''];
}

// ═══ CARDS ══════════════════════════════════════════════════════════════════
function saveOneCard(card) {
  const sheet = ensureSheet(SpreadsheetApp.getActiveSpreadsheet(), CARDS_SHEET, CARD_HEADERS);
  const rows = sheet.getDataRange().getValues();
  const idCol = rows[0].indexOf('id');
  const rowData = cardToRow(card);
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][idCol]) === String(card.id)) {
      sheet.getRange(i + 1, 1, 1, rowData.length).setValues([rowData]);
      return;
    }
  }
  sheet.appendRow(rowData);
}

function deleteOneCard(cardId) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CARDS_SHEET);
  if (!sheet) return;
  const rows = sheet.getDataRange().getValues();
  const idCol = rows[0].indexOf('id');
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][idCol]) === String(cardId)) {
      sheet.deleteRow(i + 1);
      return;
    }
  }
}

// Handles both the single toggle (legacy) and the new batch mark-as-printed.
// One read, targeted writes, no per-card HTTP round trips needed.
function setPrinted(cardIds, printed) {
  if (!cardIds || !cardIds.length) return;
  const sheet = ensureSheet(SpreadsheetApp.getActiveSpreadsheet(), CARDS_SHEET, CARD_HEADERS);
  const rows = sheet.getDataRange().getValues();
  const headers = rows[0];
  const idCol = headers.indexOf('id');
  const printedCol = headers.indexOf('printed');
  const wanted = {};
  cardIds.forEach(id => wanted[String(id)] = true);
  const value = printed ? 'true' : '';
  for (let i = 1; i < rows.length; i++) {
    if (wanted[String(rows[i][idCol])]) {
      sheet.getRange(i + 1, printedCol + 1).setValue(value);
    }
  }
}

// ═══ ORDERS ═════════════════════════════════════════════════════════════════
function logOrder(order) {
  const sheet = ensureSheet(SpreadsheetApp.getActiveSpreadsheet(), ORDERS_SHEET, ORDER_HEADERS);
  sheet.appendRow([
    order.orderId||'', order.cardId||'', order.sku||'', order.desc||'',
    order.supplier||'', order.qtyOrdered||'', order.date||'', order.loggedAt||'',
    order.submittedBy||'', order.unitCost||'', order.po||''
  ]);
}

// Update an existing order row by orderId. Writes only the fields present on
// the order object, matched by header name, so custom columns are preserved.
function updateOrder(order) {
  const sheet = ensureSheet(SpreadsheetApp.getActiveSpreadsheet(), ORDERS_SHEET, ORDER_HEADERS);
  const rows = sheet.getDataRange().getValues();
  const headers = rows[0];
  const idCol = headers.indexOf('orderId');
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][idCol]) === String(order.orderId)) {
      const row = rows[i].slice();
      headers.forEach(function(h, col) {
        if (h && Object.prototype.hasOwnProperty.call(order, h)) {
          row[col] = order[h] == null ? '' : order[h];
        }
      });
      sheet.getRange(i + 1, 1, 1, row.length).setValues([row]);
      return;
    }
  }
  throw new Error('Order not found: ' + order.orderId);
}

function deleteOrder(orderId) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ORDERS_SHEET);
  if (!sheet) return;
  const rows = sheet.getDataRange().getValues();
  const idCol = rows[0].indexOf('orderId');
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][idCol]) === String(orderId)) {
      sheet.deleteRow(i + 1);
      return;
    }
  }
  throw new Error('Order not found: ' + orderId);
}

// ═══ CATEGORIES ═════════════════════════════════════════════════════════════
function saveOneCategory(cat) {
  const sheet = ensureSheet(SpreadsheetApp.getActiveSpreadsheet(), CATS_SHEET, CAT_HEADERS);
  const rows = sheet.getDataRange().getValues();
  const idCol = rows[0].indexOf('id');
  const rowData = catToRow(cat);
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][idCol]) === String(cat.id)) {
      sheet.getRange(i + 1, 1, 1, rowData.length).setValues([rowData]);
      return;
    }
  }
  sheet.appendRow(rowData);
}

// Surgical category delete: removes the one category row, then clears the
// category cell on matching cards only. The Cards sheet is never rewritten,
// and card images are never re-transmitted or re-saved.
function deleteCategorySurgical(categoryId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const catSheet = ss.getSheetByName(CATS_SHEET);
  if (catSheet) {
    const catRows = catSheet.getDataRange().getValues();
    const catIdCol = catRows[0].indexOf('id');
    for (let i = 1; i < catRows.length; i++) {
      if (String(catRows[i][catIdCol]) === String(categoryId)) {
        catSheet.deleteRow(i + 1);
        break;
      }
    }
  }

  const cardSheet = ss.getSheetByName(CARDS_SHEET);
  if (cardSheet) {
    const rows = cardSheet.getDataRange().getValues();
    const headers = rows[0];
    const catCol = headers.indexOf('category');
    if (catCol !== -1) {
      for (let i = 1; i < rows.length; i++) {
        if (String(rows[i][catCol]) === String(categoryId)) {
          cardSheet.getRange(i + 1, catCol + 1).setValue('');
        }
      }
    }
  }
}

// ═══ SETTINGS ═══════════════════════════════════════════════════════════════
function saveSetting(key, value) {
  if (!key) return;
  const sheet = ensureSheet(SpreadsheetApp.getActiveSpreadsheet(), SETTINGS_SHEET, ['key','value']);
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(key)) {
      sheet.getRange(i + 1, 2).setValue(value);
      return;
    }
  }
  sheet.appendRow([key, value]);
}

// ═══ LEGACY BULK WRITE (kept for compatibility, made safe) ══════════════════
// Old version cleared the sheet then appended row by row; a failure mid-loop
// could leave the sheet half-written. This version builds the full data block
// and writes it in ONE setValues call, then trims leftover rows. A failure
// before the write leaves existing data untouched.
function bulkWrite(sheetName, headers, items, toRow) {
  const sheet = ensureSheet(SpreadsheetApp.getActiveSpreadsheet(), sheetName, headers);
  const data = (items || []).map(toRow);
  if (data.length) {
    sheet.getRange(2, 1, data.length, headers.length).setValues(data);
  }
  const lastRow = sheet.getLastRow();
  const usedRows = data.length + 1; // + header row
  if (lastRow > usedRows) {
    sheet.getRange(usedRows + 1, 1, lastRow - usedRows, sheet.getLastColumn()).clearContent();
  }
}

// ═══ BACKUPS ════════════════════════════════════════════════════════════════
// Run backupNow() once manually to authorize. Then add a weekly time-driven
// trigger pointed at weeklyBackup. Keeps the most recent BACKUPS_TO_KEEP
// copies in a Drive folder and deletes older ones.
function weeklyBackup() { backupNow(); }

function backupNow() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const file = DriveApp.getFileById(ss.getId());
  const folder = getOrCreateFolder(BACKUP_FOLDER_NAME);
  const stamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm');
  file.makeCopy(ss.getName() + ' backup ' + stamp, folder);
  pruneOldBackups(folder);
  Logger.log('Backup created: ' + stamp);
}

function getOrCreateFolder(name) {
  const it = DriveApp.getFoldersByName(name);
  return it.hasNext() ? it.next() : DriveApp.createFolder(name);
}

function pruneOldBackups(folder) {
  const files = [];
  const it = folder.getFiles();
  while (it.hasNext()) files.push(it.next());
  files.sort((a, b) => b.getDateCreated() - a.getDateCreated());
  for (let i = BACKUPS_TO_KEEP; i < files.length; i++) {
    files[i].setTrashed(true);
  }
}

// ═══ RESPONSE HELPERS ═══════════════════════════════════════════════════════
function ok(data) {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, data: data }))
    .setMimeType(ContentService.MimeType.JSON);
}

function error(msg) {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: false, error: msg }))
    .setMimeType(ContentService.MimeType.JSON);
}
