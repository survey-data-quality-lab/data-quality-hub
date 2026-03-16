/**
 * Data Quality Hub — Production Web App
 *
 * Google Apps Script that receives form submissions and writes to a Google Sheet.
 * One form submission can contain multiple platform-sample combinations — each becomes its own row.
 *
 * SETUP:
 * 1. Go to https://script.google.com → New Project
 * 2. Paste this entire file into Code.gs
 * 3. Replace SHEET_ID below with your Google Sheet ID
 * 4. Deploy → New deployment → Web app → Execute as: Me, Access: Anyone
 * 5. Copy the Web App URL → paste into js/submit-form.js (APPS_SCRIPT_URL)
 */

var SHEET_ID = '1Nc7GDFv--TY0sSlRtGBP734fxOGgaSVllO9XExy8MJA';

// 118 columns (0–117)
var HEADERS = [
  'Approved',                                                          // 0  (A)
  'Timestamp',                                                         // 1  (B)
  'Submission ID',                                                     // 2  (C)
  'Contact Email',                                                     // 3  (D)
  'Researcher Name',                                                   // 4  (E)
  'Researcher Affiliation',                                            // 5  (F)
  'Study Title',                                                       // 6  (G)
  'Is this study pre-registered?',                                     // 7  (H)
  'Pre-registration link',                                             // 8  (I)
  'Paper or study link',                                               // 9  (J)
  'Data Availability',                                                 // 10 (K)
  'Data Repository Link',                                              // 11 (L)
  'Publication Status',                                                // 12 (M)
  'Feedback',                                                          // 13 (N)
  'Platform',                                                          // 14 (O)
  'If Other, please specify',                                          // 15 (P)
  'Sample',                                                            // 16 (Q)
  'Sample Size',                                                       // 17 (R)
  'Study Start Month',                                                 // 18 (S)
  'Study Start Year',                                                  // 19 (T)
  'Recruitment Strategy',                                              // 20 (U)
  'Country',                                                           // 21 (V)
  'Participant quality/approval score',                                // 22 (W)
  'Minimum number of completed studies/HITs',                          // 23 (X)
  'Representative Sample',                                             // 24 (Y)
  'Additional Screening Conditions',                                   // 25 (Z)
  'Screener Study',                                                    // 26 (AA)
  // Standard metric 1: Attention Check — Attention
  'Did you measure: Attention Check?',                                 // 27 (AB)
  'Attention Check — Rate (%)',                                        // 28 (AC)
  'Attention Check — Additional Information',                          // 29 (AD)
  // Standard metric 2: Video Check — AI/Bot
  'Did you measure: Video Check?',                                     // 30 (AE)
  'Video Check — Rate (%)',                                            // 31 (AF)
  'Video Check — Additional Information',                              // 32 (AG)
  // Standard metric 3: Typed Text — AI/Bot
  'Did you measure: Typed Text?',                                      // 33 (AH)
  'Typed Text — Rate (%)',                                             // 34 (AI)
  'Typed Text — Additional Information',                               // 35 (AJ)
  // Standard metric 4: Typed with Typical Speed — AI/Bot
  'Did you measure: Typed with Typical Speed?',                        // 36 (AK)
  'Typed with Typical Speed — Rate (%)',                               // 37 (AL)
  'Typed with Typical Speed — Additional Information',                 // 38 (AM)
  // Standard metric 5: ReCAPTCHA Score — AI/Bot
  'Did you measure: ReCAPTCHA Score?',                                 // 39 (AN)
  'ReCAPTCHA Score — Rate (%)',                                        // 40 (AO)
  'ReCAPTCHA Score — Additional Information',                          // 41 (AP)
  // Standard metric 6: Pangram AI Detector — AI/Bot
  'Did you measure: Pangram AI Detector?',                             // 42 (AQ)
  'Pangram AI Detector — Rate (%)',                                    // 43 (AR)
  'Pangram AI Detector — Additional Information',                      // 44 (AS)
  // Standard metric 7: Mouse Clicks — AI/Bot
  'Did you measure: Mouse Clicks?',                                    // 45 (AT)
  'Mouse Clicks — Rate (%)',                                           // 46 (AU)
  'Mouse Clicks — Additional Information',                             // 47 (AV)
  // Standard metric 8: Mouse Movements — AI/Bot
  'Did you measure: Mouse Movements?',                                 // 48 (AW)
  'Mouse Movements — Rate (%)',                                        // 49 (AX)
  'Mouse Movements — Additional Information',                          // 50 (AY)
  // Standard metric 9: Unique IP Address — Fraud
  'Did you measure: Unique IP Address?',                               // 51 (AZ)
  'Unique IP Address — Rate (%)',                                      // 52 (BA)
  'Unique IP Address — Additional Information',                        // 53 (BB)
  // Standard metric 10: No Foreign IP Address — Fraud
  'Did you measure: No Foreign IP Address?',                           // 54 (BC)
  'No Foreign IP Address — Rate (%)',                                  // 55 (BD)
  'No Foreign IP Address — Additional Information',                    // 56 (BE)
  // Standard metric 11: Not in a Geolocation Cluster — Fraud
  'Did you measure: Not in a Geolocation Cluster?',                   // 57 (BF)
  'Not in a Geolocation Cluster — Rate (%)',                           // 58 (BG)
  'Not in a Geolocation Cluster — Additional Information',             // 59 (BH)
  // Standard metric 12: No Duplicate Submission — Fraud
  'Did you measure: No Duplicate Submission?',                         // 60 (BI)
  'No Duplicate Submission — Rate (%)',                                // 61 (BJ)
  'No Duplicate Submission — Additional Information',                  // 62 (BK)
  // Standard metric 13: No Duplicate Device Fingerprint — Fraud
  'Did you measure: No Duplicate Device Fingerprint?',                 // 63 (BL)
  'No Duplicate Device Fingerprint — Rate (%)',                        // 64 (BM)
  'No Duplicate Device Fingerprint — Additional Information',          // 65 (BN)
  // Overall quality
  'Overall data quality pass rate (%)',                                // 66 (BO)
  'Description of overall quality measure',                            // 67 (BP)
  // Custom metric 1
  'Additional metric? (1)',                                            // 68 (BQ)
  'Additional Metric 1 — Name',                                        // 69 (BR)
  'Additional Metric 1 — Category',                                    // 70 (BS)
  'Additional Metric 1 — Rate (%)',                                    // 71 (BT)
  'Additional Metric 1 — Description',                                 // 72 (BU)
  // Custom metric 2
  'Additional metric? (2)',                                            // 73 (BV)
  'Additional Metric 2 — Name',                                        // 74 (BW)
  'Additional Metric 2 — Category',                                    // 75 (BX)
  'Additional Metric 2 — Rate (%)',                                    // 76 (BY)
  'Additional Metric 2 — Description',                                 // 77 (BZ)
  // Custom metric 3
  'Additional metric? (3)',                                            // 78 (CA)
  'Additional Metric 3 — Name',                                        // 79 (CB)
  'Additional Metric 3 — Category',                                    // 80 (CC)
  'Additional Metric 3 — Rate (%)',                                    // 81 (CD)
  'Additional Metric 3 — Description',                                 // 82 (CE)
  // Custom metric 4
  'Additional metric? (4)',                                            // 83 (CF)
  'Additional Metric 4 — Name',                                        // 84 (CG)
  'Additional Metric 4 — Category',                                    // 85 (CH)
  'Additional Metric 4 — Rate (%)',                                    // 86 (CI)
  'Additional Metric 4 — Description',                                 // 87 (CJ)
  // Custom metric 5
  'Additional metric? (5)',                                            // 88 (CK)
  'Additional Metric 5 — Name',                                        // 89 (CL)
  'Additional Metric 5 — Category',                                    // 90 (CM)
  'Additional Metric 5 — Rate (%)',                                    // 91 (CN)
  'Additional Metric 5 — Description',                                 // 92 (CO)
  // Custom metric 6
  'Additional metric? (6)',                                            // 93 (CP)
  'Additional Metric 6 — Name',                                        // 94 (CQ)
  'Additional Metric 6 — Category',                                    // 95 (CR)
  'Additional Metric 6 — Rate (%)',                                    // 96 (CS)
  'Additional Metric 6 — Description',                                 // 97 (CT)
  // Custom metric 7
  'Additional metric? (7)',                                            // 98 (CU)
  'Additional Metric 7 — Name',                                        // 99 (CV)
  'Additional Metric 7 — Category',                                    // 100 (CW)
  'Additional Metric 7 — Rate (%)',                                    // 101 (CX)
  'Additional Metric 7 — Description',                                 // 102 (CY)
  // Custom metric 8
  'Additional metric? (8)',                                            // 103 (CZ)
  'Additional Metric 8 — Name',                                        // 104 (DA)
  'Additional Metric 8 — Category',                                    // 105 (DB)
  'Additional Metric 8 — Rate (%)',                                    // 106 (DC)
  'Additional Metric 8 — Description',                                 // 107 (DD)
  // Custom metric 9
  'Additional metric? (9)',                                            // 108 (DE)
  'Additional Metric 9 — Name',                                        // 109 (DF)
  'Additional Metric 9 — Category',                                    // 110 (DG)
  'Additional Metric 9 — Rate (%)',                                    // 111 (DH)
  'Additional Metric 9 — Description',                                 // 112 (DI)
  // Custom metric 10
  'Additional metric? (10)',                                           // 113 (DJ)
  'Additional Metric 10 — Name',                                       // 114 (DK)
  'Additional Metric 10 — Category',                                   // 115 (DL)
  'Additional Metric 10 — Rate (%)',                                   // 116 (DM)
  'Additional Metric 10 — Description'                                 // 117 (DN)
];

var METRIC_COLUMNS = {
  'classicChecks':          { ask: 27, rate: 28, desc: 29 },
  'videoCheck':             { ask: 30, rate: 31, desc: 32 },
  'typedText':              { ask: 33, rate: 34, desc: 35 },
  'typicalSpeed':           { ask: 36, rate: 37, desc: 38 },
  'recaptcha':              { ask: 39, rate: 40, desc: 41 },
  'pangram':                { ask: 42, rate: 43, desc: 44 },
  'mouseClicks':            { ask: 45, rate: 46, desc: 47 },
  'mouseMovements':         { ask: 48, rate: 49, desc: 50 },
  'uniqueIp':               { ask: 51, rate: 52, desc: 53 },
  'noForeignIp':            { ask: 54, rate: 55, desc: 56 },
  'noGeoCluster':           { ask: 57, rate: 58, desc: 59 },
  'noDuplicateSubmission':  { ask: 60, rate: 61, desc: 62 },
  'noDuplicateFingerprint': { ask: 63, rate: 64, desc: 65 }
};

var CUSTOM_METRIC_COLUMNS = [
  { ask: 68,  name: 69,  cat: 70,  rate: 71,  desc: 72  },
  { ask: 73,  name: 74,  cat: 75,  rate: 76,  desc: 77  },
  { ask: 78,  name: 79,  cat: 80,  rate: 81,  desc: 82  },
  { ask: 83,  name: 84,  cat: 85,  rate: 86,  desc: 87  },
  { ask: 88,  name: 89,  cat: 90,  rate: 91,  desc: 92  },
  { ask: 93,  name: 94,  cat: 95,  rate: 96,  desc: 97  },
  { ask: 98,  name: 99,  cat: 100, rate: 101, desc: 102 },
  { ask: 103, name: 104, cat: 105, rate: 106, desc: 107 },
  { ask: 108, name: 109, cat: 110, rate: 111, desc: 112 },
  { ask: 113, name: 114, cat: 115, rate: 116, desc: 117 }
];

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName('Sheet1');

    if (sheet.getLastRow() === 0) {
      sheet.appendRow(HEADERS);
    }

    var action = data.action || 'submit';
    if (action === 'update') {
      return handleUpdate(sheet, data);
    }

    var researcher = data.researcher || {};
    var metadata = data.metadata || {};
    var submissionId = data.submissionId || '';
    var entries = data.entries || [];

    for (var i = 0; i < entries.length; i++) {
      var row = buildRow(researcher, metadata, entries[i], submissionId);
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
 */
function handleUpdate(sheet, data) {
  var submissionId = data.submissionId;
  if (!submissionId) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'No submissionId provided' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  var newRows = data.rows || [];
  var allData = sheet.getDataRange().getValues();

  var headerRow = allData[0];
  var sidCol = headerRow.indexOf('Submission ID');
  if (sidCol === -1) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Submission ID column not found in sheet' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  var deleted = 0;
  for (var r = allData.length - 1; r >= 1; r--) {
    if (String(allData[r][sidCol]) === String(submissionId)) {
      sheet.deleteRow(r + 1);
      deleted++;
    }
  }

  for (var i = 0; i < newRows.length; i++) {
    var row = newRows[i];
    while (row.length < HEADERS.length) row.push('');
    row[sidCol] = submissionId;
    row[1] = new Date();
    row[0] = '';
    sheet.appendRow(row);
  }

  return ContentService.createTextOutput(JSON.stringify({ status: 'ok', deleted: deleted, added: newRows.length }))
    .setMimeType(ContentService.MimeType.JSON);
}

function buildRow(researcher, metadata, entry, submissionId) {
  var row = [];
  for (var i = 0; i < HEADERS.length; i++) row.push('');

  row[1]  = new Date();
  row[2]  = submissionId || '';

  // Researcher
  row[3]  = researcher.email || '';
  row[4]  = researcher.name || '';
  row[5]  = researcher.affiliation || '';
  row[6]  = researcher.studyTitle || '';

  // Study metadata
  row[7]  = metadata.preRegistered || '';
  row[8]  = metadata.preRegLink || '';
  row[9]  = metadata.paperLink || '';
  row[10] = metadata.dataAvailability || '';
  row[11] = metadata.dataLink || '';
  row[12] = metadata.publicationStatus || '';
  row[13] = metadata.feedback || '';

  // Platform
  var isKnown = ['Prolific', 'MTurk', 'Bilendi', 'Moblab', 'CloudResearch'].indexOf(entry.platform) !== -1;
  row[14] = isKnown ? entry.platform : 'Other';
  row[15] = isKnown ? '' : entry.platform;

  // Sample / dates
  row[16] = entry.sample || '';
  row[17] = entry.sampleSize || '';
  row[18] = entry.month || '';
  row[19] = entry.year || '';

  // Recruitment strategy
  var rm = entry.recruitmentMethod || '';
  if (rm === 'two-stage')   row[20] = 'Two-Stage';
  else if (rm === 'platform') row[20] = 'Standard';

  // Recruitment details
  row[21] = entry.country || '';
  row[22] = entry.approvalScore || '';
  row[23] = entry.minStudies || '';
  row[24] = entry.representativeSample || '';
  row[25] = entry.additionalCriteria || '';
  row[26] = entry.screenerStudy || '';

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

  // Custom metrics (up to 10)
  var customs = entry.customMetrics || [];
  for (var ci = 0; ci < CUSTOM_METRIC_COLUMNS.length; ci++) {
    var cc = CUSTOM_METRIC_COLUMNS[ci];
    if (ci < customs.length) {
      row[cc.ask]  = 'Yes';
      row[cc.name] = customs[ci].name || '';
      row[cc.cat]  = customs[ci].category || '';
      row[cc.rate] = customs[ci].rate || '';
      row[cc.desc] = customs[ci].description || '';
    } else {
      row[cc.ask] = 'No';
    }
  }

  // Overall quality
  row[66] = entry.overallRate || '';
  row[67] = entry.overallDescription || '';

  return row;
}
