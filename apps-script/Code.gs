/**
 * Stepwise feedback collector (Google Apps Script web app).
 *
 * Receives reports from the Stepwise site and adds each one as a row in a
 * Google Sheet called "Stepwise feedback" in the owner's Drive. Senders need no account.
 * Setup steps are in apps-script/README.md.
 */

const SHEET_NAME = 'Feedback';
const TYPES = ['bug', 'feature', 'other'];
const MAX_MESSAGE = 4000;
const MAX_FIELD = 400;
const HEADERS = [
  'Received', 'Type', 'Message', 'Email', 'Lesson', 'Question', 'App version',
  'Browser', 'Platform', 'Screen', 'Window', 'Language', 'Time zone', 'Theme',
  'Reduced motion', 'User agent', 'Sent (client)',
];

/** Run once from the editor: creates the sheet and prints its link. */
function setup() {
  const ss = getSpreadsheet_();
  Logger.log('Feedback sheet: ' + ss.getUrl());
}

function doGet() {
  return json_({ ok: true, service: 'stepwise-feedback' });
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const d = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (d.website) return json_({ ok: true }); // honeypot filled in: a bot, drop it quietly
    const message = clip_(d.message, MAX_MESSAGE).trim();
    if (message.length < 3) return json_({ ok: false, error: 'empty' });
    const t = d.tech || {};
    getSpreadsheet_().getSheetByName(SHEET_NAME).appendRow([
      new Date(),
      TYPES.indexOf(d.type) >= 0 ? d.type : 'other',
      message,
      clip_(d.email, 200),
      clip_(t.lesson), clip_(t.question), clip_(t.version),
      clip_(t.browser), clip_(t.platform), clip_(t.screen), clip_(t.viewport),
      clip_(t.language), clip_(t.timeZone), clip_(t.theme), clip_(t.reducedMotion),
      clip_(t.userAgent), clip_(d.sentAt, 40),
    ].map(safe_));
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: 'bad request' });
  } finally {
    lock.releaseLock();
  }
}

function getSpreadsheet_() {
  const props = PropertiesService.getScriptProperties();
  const id = props.getProperty('SHEET_ID');
  if (id) {
    try {
      return SpreadsheetApp.openById(id);
    } catch (err) {
      /* sheet was deleted: make a new one */
    }
  }
  const ss = SpreadsheetApp.create('Stepwise feedback');
  const sh = ss.getSheets()[0];
  sh.setName(SHEET_NAME);
  sh.appendRow(HEADERS);
  sh.setFrozenRows(1);
  sh.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
  sh.setColumnWidth(3, 420);
  props.setProperty('SHEET_ID', ss.getId());
  return ss;
}

function clip_(v, max) {
  return String(v == null ? '' : v).slice(0, max || MAX_FIELD);
}

/** Stops text like "=IMPORTXML(...)" from being run as a spreadsheet formula. */
function safe_(v) {
  return typeof v === 'string' && /^[=+\-@]/.test(v) ? "'" + v : v;
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
