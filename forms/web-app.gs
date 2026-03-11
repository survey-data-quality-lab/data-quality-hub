/**
 * Data Quality Hub — Production Web App
 *
 * Google Apps Script that receives form submissions and writes to a Google Sheet.
 * One form submission can contain multiple platform-stage combinations — each becomes its own row.
 *
 * SETUP:
 * 1. Go to https://script.google.com → New Project
 * 2. Paste this entire file into Code.gs
 * 3. Replace SHEET_ID below with your Google Sheet ID
 * 4. Deploy → New deployment → Web app → Execute as: Me, Access: Anyone
 * 5. Copy the Web App URL → paste into js/submit-form.js (APPS_SCRIPT_URL)
 */

var SHEET_ID = '1sq7-MgBhqNzv4SbTINljUEBg_Xi9JWV-1QNd9WR1-Cw';

var HEADERS = [
  'Approved',                                                          // 0  (A)
  'Timestamp',                                                         // 1  (B)
  'Contact Email',                                                     // 2  (C)
  'Researcher Name',                                                   // 3  (D)
  'Researcher Affiliation',                                            // 4  (E)
  'Study Title',                                                       // 5  (F)
  'Recruitment Method',                                                // 6  (G)
  'Stage',                                                             // 7  (H)
  'Platform',                                                          // 8  (I)
  'If Other, please specify',                                          // 9  (J)
  'Sample Size',                                                       // 10 (K)
  'Study Start Month',                                                 // 11 (L)
  'Study Start Year',                                                  // 12 (M)
  'Country',                                                           // 13 (N)
  'Participant quality/approval score',                                // 14 (O)
  'Minimum number of completed studies/HITs',                          // 15 (P)
  'Selection criteria for Stage 2',                                    // 16 (Q)
  'Did you measure: Passed Classic Checks?',                           // 17 (R)
  'Passed Classic Checks — Rate (%)',                                  // 18 (S)
  'Passed Classic Checks — Description',                               // 19 (T)
  'Did you measure: Passed Video Check?',                              // 20 (U)
  'Passed Video Check — Rate (%)',                                     // 21 (V)
  'Passed Video Check — Description',                                  // 22 (W)
  'Did you measure: Typed Text?',                                      // 23 (X)
  'Typed Text — Rate (%)',                                             // 24 (Y)
  'Typed Text — Description',                                         // 25 (Z)
  'Did you measure: Typed w/ Typical Speed?',                          // 26 (AA)
  'Typed w/ Typical Speed — Rate (%)',                                 // 27 (AB)
  'Typed w/ Typical Speed — Description',                              // 28 (AC)
  'Did you measure: reCAPTCHA Score?',                                 // 29 (AD)
  'reCAPTCHA Score — Rate (%)',                                        // 30 (AE)
  'reCAPTCHA Score — Description',                                     // 31 (AF)
  'Did you measure: Pangram AI Likelihood?',                           // 32 (AG)
  'Pangram AI Likelihood — Rate (%)',                                  // 33 (AH)
  'Pangram AI Likelihood — Description',                               // 34 (AI)
  'Did you measure: Unique IP Address?',                               // 35 (AJ)
  'Unique IP Address — Rate (%)',                                      // 36 (AK)
  'Unique IP Address — Description',                                   // 37 (AL)
  'Did you use an additional data quality metric?',                    // 38 (AM)
  'Additional Metric 1 — Name',                                       // 39 (AN)
  'Additional Metric 1 — Category',                                   // 40 (AO)
  'Additional Metric 1 — Rate (%)',                                    // 41 (AP)
  'Additional Metric 1 — Description',                                // 42 (AQ)
  'Did you use any further data quality metric?',                      // 43 (AR)
  'Additional Metric 2 — Name',                                       // 44 (AS)
  'Additional Metric 2 — Category',                                   // 45 (AT)
  'Additional Metric 2 — Rate (%)',                                    // 46 (AU)
  'Additional Metric 2 — Description',                                // 47 (AV)
  'Did you use yet another data quality metric? (3)',                   // 48
  'Additional Metric 3 — Name',                                       // 49
  'Additional Metric 3 — Category',                                   // 50
  'Additional Metric 3 — Rate (%)',                                    // 51
  'Additional Metric 3 — Description',                                // 52
  'Additional metric? (4)',                                            // 53
  'Additional Metric 4 — Name',                                       // 54
  'Additional Metric 4 — Category',                                   // 55
  'Additional Metric 4 — Rate (%)',                                    // 56
  'Additional Metric 4 — Description',                                // 57
  'Additional metric? (5)',                                            // 58
  'Additional Metric 5 — Name',                                       // 59
  'Additional Metric 5 — Category',                                   // 60
  'Additional Metric 5 — Rate (%)',                                    // 61
  'Additional Metric 5 — Description',                                // 62
  'Additional metric? (6)',                                            // 63
  'Additional Metric 6 — Name',                                       // 64
  'Additional Metric 6 — Category',                                   // 65
  'Additional Metric 6 — Rate (%)',                                    // 66
  'Additional Metric 6 — Description',                                // 67
  'Additional metric? (7)',                                            // 68
  'Additional Metric 7 — Name',                                       // 69
  'Additional Metric 7 — Category',                                   // 70
  'Additional Metric 7 — Rate (%)',                                    // 71
  'Additional Metric 7 — Description',                                // 72
  'Additional metric? (8)',                                            // 73
  'Additional Metric 8 — Name',                                       // 74
  'Additional Metric 8 — Category',                                   // 75
  'Additional Metric 8 — Rate (%)',                                    // 76
  'Additional Metric 8 — Description',                                // 77
  'Additional metric? (9)',                                            // 78
  'Additional Metric 9 — Name',                                       // 79
  'Additional Metric 9 — Category',                                   // 80
  'Additional Metric 9 — Rate (%)',                                    // 81
  'Additional Metric 9 — Description',                                // 82
  'Additional metric? (10)',                                           // 83
  'Additional Metric 10 — Name',                                      // 84
  'Additional Metric 10 — Category',                                  // 85
  'Additional Metric 10 — Rate (%)',                                   // 86
  'Additional Metric 10 — Description',                               // 87
  'Overall data quality pass rate (%)',                                // 88
  'Description of overall quality measure',                            // 89
  'Is this study pre-registered?',                                     // 90
  'Pre-registration link',                                             // 91
  'Paper or study link',                                               // 92
  'Data Availability',                                                 // 93
  'Publication Status',                                                // 94
  'Submission ID'                                                      // 95
];

var METRIC_COLUMNS = {
  'classicChecks': { ask: 17, rate: 18, desc: 19 },
  'videoCheck':    { ask: 20, rate: 21, desc: 22 },
  'typedText':     { ask: 23, rate: 24, desc: 25 },
  'typicalSpeed':  { ask: 26, rate: 27, desc: 28 },
  'recaptcha':     { ask: 29, rate: 30, desc: 31 },
  'pangram':       { ask: 32, rate: 33, desc: 34 },
  'uniqueIp':      { ask: 35, rate: 36, desc: 37 }
};

var CUSTOM_METRIC_COLUMNS = [
  { ask: 38, name: 39, cat: 40, rate: 41, desc: 42 },
  { ask: 43, name: 44, cat: 45, rate: 46, desc: 47 },
  { ask: 48, name: 49, cat: 50, rate: 51, desc: 52 },
  { ask: 53, name: 54, cat: 55, rate: 56, desc: 57 },
  { ask: 58, name: 59, cat: 60, rate: 61, desc: 62 },
  { ask: 63, name: 64, cat: 65, rate: 66, desc: 67 },
  { ask: 68, name: 69, cat: 70, rate: 71, desc: 72 },
  { ask: 73, name: 74, cat: 75, rate: 76, desc: 77 },
  { ask: 78, name: 79, cat: 80, rate: 81, desc: 82 },
  { ask: 83, name: 84, cat: 85, rate: 86, desc: 87 }
];

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName('Sheet1');

    if (sheet.getLastRow() === 0) {
      sheet.appendRow(HEADERS);
    }

    // Route by action
    var action = data.action || 'submit';
    if (action === 'update') {
      return handleUpdate(sheet, data);
    }

    // Default: new submission
    var researcher = data.researcher || {};
    var metadata = data.metadata || {};
    var recruitmentMethod = data.recruitmentMethod || '';
    var submissionId = data.submissionId || '';
    var entries = data.entries || [];

    for (var i = 0; i < entries.length; i++) {
      var row = buildRow(researcher, metadata, recruitmentMethod, entries[i], submissionId);
      sheet.appendRow(row);
    }

    return ContentService.createTextOutput(JSON.stringify({ status: 'ok', rows: entries.length }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Handle update: find rows by Submission ID, delete them, append new rows from uploaded CSV.
 * data.submissionId — the ID to match
 * data.rows — array of arrays (each inner array = one row of cell values, matching HEADERS order)
 */
function handleUpdate(sheet, data) {
  var submissionId = data.submissionId;
  if (!submissionId) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'No submissionId provided' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  var newRows = data.rows || [];
  var allData = sheet.getDataRange().getValues();

  // Find Submission ID column index from header row
  var headerRow = allData[0];
  var sidCol = headerRow.indexOf('Submission ID');
  if (sidCol === -1) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Submission ID column not found in sheet' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // Delete matching rows from bottom to top (to avoid index shifting)
  var deleted = 0;
  for (var r = allData.length - 1; r >= 1; r--) {
    if (String(allData[r][sidCol]) === String(submissionId)) {
      sheet.deleteRow(r + 1); // sheet rows are 1-indexed
      deleted++;
    }
  }

  // Append new rows (preserve the submission ID in each row)
  for (var i = 0; i < newRows.length; i++) {
    var row = newRows[i];
    // Ensure submission ID is set in the last column
    while (row.length < HEADERS.length) row.push('');
    row[HEADERS.length - 1] = submissionId;
    // Update timestamp to now
    row[1] = new Date();
    // Clear Approved (must be re-approved after edit)
    row[0] = '';
    sheet.appendRow(row);
  }

  return ContentService.createTextOutput(JSON.stringify({ status: 'ok', deleted: deleted, added: newRows.length }))
    .setMimeType(ContentService.MimeType.JSON);
}

function buildRow(researcher, metadata, recruitmentMethod, entry, submissionId) {
  var row = [];
  for (var i = 0; i < HEADERS.length; i++) row.push('');

  row[1] = new Date();

  // Researcher
  row[2] = researcher.email || '';
  row[3] = researcher.name || '';
  row[4] = researcher.affiliation || '';
  row[5] = researcher.studyTitle || '';

  // Recruitment method
  if (recruitmentMethod === 'two-stage') row[6] = 'Two-stage recruitment';
  else if (recruitmentMethod === 'platform') row[6] = 'Platform with screening criteria';

  // Stage
  var stg = entry.stage;
  if (stg === 1) row[7] = '1st stage';
  else if (stg === 2) row[7] = '2nd stage';

  // Platform
  var isKnown = ['Prolific', 'MTurk', 'Bilendi', 'Moblab', 'CloudResearch'].indexOf(entry.platform) !== -1;
  row[8] = isKnown ? entry.platform : 'Other';
  row[9] = isKnown ? '' : entry.platform;

  // Sample details
  row[10] = entry.sampleSize || '';
  row[11] = entry.month || '';
  row[12] = entry.year || '';
  row[13] = entry.country || '';
  row[14] = entry.approvalScore || '';
  row[15] = entry.minStudies || '';

  // Selection criteria (stage 2 only)
  row[16] = entry.selectionCriteria || '';

  // Standard metrics
  var metrics = entry.metrics || {};
  var metricIds = Object.keys(METRIC_COLUMNS);
  for (var mi = 0; mi < metricIds.length; mi++) {
    var mid = metricIds[mi];
    var cols = METRIC_COLUMNS[mid];
    if (metrics[mid]) {
      row[cols.ask] = 'Yes';
      row[cols.rate] = metrics[mid].rate || '';
      row[cols.desc] = metrics[mid].description || '';
    } else {
      row[cols.ask] = 'No';
    }
  }

  // Custom metrics (up to 3)
  var customs = entry.customMetrics || [];
  for (var ci = 0; ci < CUSTOM_METRIC_COLUMNS.length; ci++) {
    var cc = CUSTOM_METRIC_COLUMNS[ci];
    if (ci < customs.length) {
      row[cc.ask] = 'Yes';
      row[cc.name] = customs[ci].name || '';
      row[cc.cat] = customs[ci].category || '';
      row[cc.rate] = customs[ci].rate || '';
      row[cc.desc] = customs[ci].description || '';
    } else {
      row[cc.ask] = 'No';
    }
  }

  // Overall quality
  row[88] = entry.overallRate || '';
  row[89] = entry.overallDescription || '';

  // Metadata
  row[90] = metadata.preRegistered || '';
  row[91] = metadata.preRegLink || '';
  row[92] = metadata.paperLink || '';
  row[93] = metadata.dataAvailability || '';
  row[94] = metadata.publicationStatus || '';
  row[95] = submissionId || '';

  return row;
}
