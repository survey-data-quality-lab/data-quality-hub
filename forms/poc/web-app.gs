/**
 * Data Quality Hub — POC Web App
 *
 * Minimal Google Apps Script to receive form data via POST and write to a Google Sheet.
 *
 * SETUP:
 * 1. Go to https://script.google.com → New Project
 * 2. Paste this entire file into Code.gs
 * 3. Replace SHEET_ID below with your Google Sheet ID
 *    (the long string in the sheet URL between /d/ and /edit)
 * 4. Click Deploy → New deployment
 *    - Type: Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 5. Copy the Web App URL → paste into poc/index.html (APPS_SCRIPT_URL)
 * 6. In your Google Sheet, make sure the first tab is named "Sheet1"
 *    (or change the name below)
 *
 * HOW IT WORKS:
 * - The HTML form collects answers and sends them as a JSON POST request
 * - This script receives the JSON, parses it, and calls appendRow()
 * - appendRow() adds one new row at the bottom of the Google Sheet
 * - The Google Sheet is already published as CSV (File → Share → Publish to web)
 * - The dashboard reads that CSV URL — no conversion needed, Sheets does it natively
 *
 * SECURITY NOTE:
 * - Anyone with the Web App URL can POST data (we show a success message optimistically)
 * - The "Approved" column stays empty — you manually set it to 1 to show on dashboard
 * - This is the same moderation workflow as the Google Form
 */

// ── Replace with your Google Sheet ID ──────────────────────────────
var SHEET_ID = '1sq7-MgBhqNzv4SbTINljUEBg_Xi9JWV-1QNd9WR1-Cw';
// ───────────────────────────────────────────────────────────────────

var HEADERS = [
  'Approved',          // A
  'Timestamp',         // B
  'Contact Email',     // C
  'Researcher Name',   // D
  'Affiliation',       // E
  'Study Title',       // F
  'Platform',          // G
  'Sample Size',       // H
  'Example Metric Rate (%)', // I
  'Notes'              // J
];

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName('Sheet1');

    // Write header row if sheet is empty
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(HEADERS);
    }

    sheet.appendRow([
      '',                         // A: Approved (empty — set manually)
      new Date(),                 // B: Timestamp
      data.email       || '',     // C: Contact Email
      data.name        || '',     // D: Researcher Name
      data.affiliation || '',     // E: Affiliation
      data.studyTitle  || '',     // F: Study Title
      data.platform    || '',     // G: Platform
      data.sampleSize  || '',     // H: Sample Size
      data.metric1Rate || '',     // I: Example metric rate
      data.notes       || ''      // J: Notes
    ]);

    // Return success (only visible if caller uses mode:'cors')
    return ContentService.createTextOutput(JSON.stringify({ status: 'ok' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Handle CORS preflight (OPTIONS request)
function doOptions(e) {
  return ContentService.createTextOutput('')
    .setMimeType(ContentService.MimeType.TEXT);
}
