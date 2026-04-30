/**
 * Data Quality Hub — Production Web App (v2)
 *
 * Google Apps Script that receives form submissions and writes to TWO Google Sheets:
 *   - Users sheet: email, passwordHash, submissionId, emailConfirmed, submittedAt
 *   - Data sheet:  119 columns (Approved, Email Confirmed, Timestamp, ...)
 *
 * Also handles:
 *   - Email verification (doGet with action=verify)
 *   - Admin notification emails on new submissions
 *   - Deferred login (password collected now, no login page yet)
 *
 * SETUP:
 * 1. Go to https://script.google.com → New Project
 * 2. Paste this entire file into Code.gs
 * 3. Fill in USERS_SHEET_ID, DATA_SHEET_ID, ADMIN_EMAILS, TOKEN_SECRET, DEPLOYED_SCRIPT_URL
 * 4. Deploy → New deployment → Web app → Execute as: Me, Access: Anyone
 * 5. Copy the Web App URL → paste into js/submit-form.js (APPS_SCRIPT_URL)
 *    AND into DEPLOYED_SCRIPT_URL below
 */

// ── Configuration ──────────────────────────────────────────────────
var USERS_SHEET_ID = '1cWsbiNHjN44mXF8Io0agXOClqEoOGgBlbyO-L8fkGyA';
var DATA_SHEET_ID  = '1sq7-MgBhqNzv4SbTINljUEBg_Xi9JWV-1QNd9WR1-Cw';

var ADMIN_EMAILS = [
  'cnelebi@gmail.com',
  'soeren.harrs@univie.ac.at'
];

// Secrets are stored in Script Properties (Project Settings → Script Properties).
// Never commit the values themselves to this file.
var TOKEN_SECRET = PropertiesService.getScriptProperties().getProperty('TOKEN_SECRET');
var ADMIN_TOKEN_SECRET = PropertiesService.getScriptProperties().getProperty('ADMIN_TOKEN_SECRET');

var DEPLOYED_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz_WSkv2bqLmKJxgtrYGS98WZCMp-AT-gHSibipbdv4UOEa9DUzRH5OMO7QdRpANGZuug/exec';
var GITHUB_PAGES_URL    = 'https://survey-data-quality-lab.github.io/data-quality-hub';

// ── 119 columns (0–118) ───────────────────────────────────────────
var HEADERS = [
  'Approved',                                                          // 0  (A)
  'Email Confirmed',                                                   // 1  (B)  ← NEW
  'Timestamp',                                                         // 2  (C)
  'Submission ID',                                                     // 3  (D)
  'Contact Email',                                                     // 4  (E)
  'Researcher Name',                                                   // 5  (F)
  'Researcher Affiliation',                                            // 6  (G)
  'Study Title',                                                       // 7  (H)
  'Is this study pre-registered?',                                     // 8  (I)
  'Pre-registration link',                                             // 9  (J)
  'Paper or study link',                                               // 10 (K)
  'Data Availability',                                                 // 11 (L)
  'Data Repository Link',                                              // 12 (M)
  'Publication Status',                                                // 13 (N)
  'Feedback',                                                          // 14 (O)
  'Platform',                                                          // 15 (P)
  'If Other, please specify',                                          // 16 (Q)
  'Sample',                                                            // 17 (R)
  'Sample Size',                                                       // 18 (S)
  'Study Start Month',                                                 // 19 (T)
  'Study Start Year',                                                  // 20 (U)
  'Recruitment Strategy',                                              // 21 (V)
  'Country',                                                           // 22 (W)
  'Participant quality/approval score',                                // 23 (X)
  'Minimum number of completed studies/HITs',                          // 24 (Y)
  'Representative Sample',                                             // 25 (Z)
  'Additional Screening Conditions',                                   // 26 (AA)
  'Screener Study',                                                    // 27 (AB)
  // Standard metric 1: Attention Check — Attention
  'Did you measure: Attention Check?',                                 // 28 (AC)
  'Attention Check — Rate (%)',                                        // 29 (AD)
  'Attention Check — Additional Information',                          // 30 (AE)
  // Standard metric 2: Video Check — AI/Bot
  'Did you measure: Video Check?',                                     // 31 (AF)
  'Video Check — Rate (%)',                                            // 32 (AG)
  'Video Check — Additional Information',                              // 33 (AH)
  // Standard metric 3: Typed Text — AI/Bot
  'Did you measure: Typed Text?',                                      // 34 (AI)
  'Typed Text — Rate (%)',                                             // 35 (AJ)
  'Typed Text — Additional Information',                               // 36 (AK)
  // Standard metric 4: Typed with Typical Speed — AI/Bot
  'Did you measure: Typed with Typical Speed?',                        // 37 (AL)
  'Typed with Typical Speed — Rate (%)',                               // 38 (AM)
  'Typed with Typical Speed — Additional Information',                 // 39 (AN)
  // Standard metric 5: ReCAPTCHA Score — AI/Bot
  'Did you measure: ReCAPTCHA Score?',                                 // 40 (AO)
  'ReCAPTCHA Score — Rate (%)',                                        // 41 (AP)
  'ReCAPTCHA Score — Additional Information',                          // 42 (AQ)
  // Standard metric 6: Pangram AI Detector — AI/Bot
  'Did you measure: Pangram AI Detector?',                             // 43 (AR)
  'Pangram AI Detector — Rate (%)',                                    // 44 (AS)
  'Pangram AI Detector — Additional Information',                      // 45 (AT)
  // Standard metric 7: Mouse Clicks — AI/Bot
  'Did you measure: Mouse Clicks?',                                    // 46 (AU)
  'Mouse Clicks — Rate (%)',                                           // 47 (AV)
  'Mouse Clicks — Additional Information',                             // 48 (AW)
  // Standard metric 8: Mouse Movements — AI/Bot
  'Did you measure: Mouse Movements?',                                 // 49 (AX)
  'Mouse Movements — Rate (%)',                                        // 50 (AY)
  'Mouse Movements — Additional Information',                          // 51 (AZ)
  // Standard metric 9: Unique IP Address — Fraud
  'Did you measure: Unique IP Address?',                               // 52 (BA)
  'Unique IP Address — Rate (%)',                                      // 53 (BB)
  'Unique IP Address — Additional Information',                        // 54 (BC)
  // Standard metric 10: No Foreign IP Address — Fraud
  'Did you measure: No Foreign IP Address?',                           // 55 (BD)
  'No Foreign IP Address — Rate (%)',                                  // 56 (BE)
  'No Foreign IP Address — Additional Information',                    // 57 (BF)
  // Standard metric 11: Not in a Geolocation Cluster — Fraud
  'Did you measure: Not in a Geolocation Cluster?',                   // 58 (BG)
  'Not in a Geolocation Cluster — Rate (%)',                           // 59 (BH)
  'Not in a Geolocation Cluster — Additional Information',             // 60 (BI)
  // Standard metric 12: No Duplicate Submission — Fraud
  'Did you measure: No Duplicate Submission?',                         // 61 (BJ)
  'No Duplicate Submission — Rate (%)',                                // 62 (BK)
  'No Duplicate Submission — Additional Information',                  // 63 (BL)
  // Standard metric 13: No Duplicate Device Fingerprint — Fraud
  'Did you measure: No Duplicate Device Fingerprint?',                 // 64 (BM)
  'No Duplicate Device Fingerprint — Rate (%)',                        // 65 (BN)
  'No Duplicate Device Fingerprint — Additional Information',          // 66 (BO)
  // Overall quality
  'Overall data quality pass rate (%)',                                // 67 (BP)
  'Description of overall quality measure',                            // 68 (BQ)
  // Custom metric 1
  'Additional metric? (1)',                                            // 69 (BR)
  'Additional Metric 1 — Name',                                        // 70 (BS)
  'Additional Metric 1 — Category',                                    // 71 (BT)
  'Additional Metric 1 — Rate (%)',                                    // 72 (BU)
  'Additional Metric 1 — Description',                                 // 73 (BV)
  // Custom metric 2
  'Additional metric? (2)',                                            // 74 (BW)
  'Additional Metric 2 — Name',                                        // 75 (BX)
  'Additional Metric 2 — Category',                                    // 76 (BY)
  'Additional Metric 2 — Rate (%)',                                    // 77 (BZ)
  'Additional Metric 2 — Description',                                 // 78 (CA)
  // Custom metric 3
  'Additional metric? (3)',                                            // 79 (CB)
  'Additional Metric 3 — Name',                                        // 80 (CC)
  'Additional Metric 3 — Category',                                    // 81 (CD)
  'Additional Metric 3 — Rate (%)',                                    // 82 (CE)
  'Additional Metric 3 — Description',                                 // 83 (CF)
  // Custom metric 4
  'Additional metric? (4)',                                            // 84 (CG)
  'Additional Metric 4 — Name',                                        // 85 (CH)
  'Additional Metric 4 — Category',                                    // 86 (CI)
  'Additional Metric 4 — Rate (%)',                                    // 87 (CJ)
  'Additional Metric 4 — Description',                                 // 88 (CK)
  // Custom metric 5
  'Additional metric? (5)',                                            // 89 (CL)
  'Additional Metric 5 — Name',                                        // 90 (CM)
  'Additional Metric 5 — Category',                                    // 91 (CN)
  'Additional Metric 5 — Rate (%)',                                    // 92 (CO)
  'Additional Metric 5 — Description',                                 // 93 (CP)
  // Custom metric 6
  'Additional metric? (6)',                                            // 94 (CQ)
  'Additional Metric 6 — Name',                                        // 95 (CR)
  'Additional Metric 6 — Category',                                    // 96 (CS)
  'Additional Metric 6 — Rate (%)',                                    // 97 (CT)
  'Additional Metric 6 — Description',                                 // 98 (CU)
  // Custom metric 7
  'Additional metric? (7)',                                            // 99 (CV)
  'Additional Metric 7 — Name',                                        // 100 (CW)
  'Additional Metric 7 — Category',                                    // 101 (CX)
  'Additional Metric 7 — Rate (%)',                                    // 102 (CY)
  'Additional Metric 7 — Description',                                 // 103 (CZ)
  // Custom metric 8
  'Additional metric? (8)',                                            // 104 (DA)
  'Additional Metric 8 — Name',                                        // 105 (DB)
  'Additional Metric 8 — Category',                                    // 106 (DC)
  'Additional Metric 8 — Rate (%)',                                    // 107 (DD)
  'Additional Metric 8 — Description',                                 // 108 (DE)
  // Custom metric 9
  'Additional metric? (9)',                                            // 109 (DF)
  'Additional Metric 9 — Name',                                        // 110 (DG)
  'Additional Metric 9 — Category',                                    // 111 (DH)
  'Additional Metric 9 — Rate (%)',                                    // 112 (DI)
  'Additional Metric 9 — Description',                                 // 113 (DJ)
  // Custom metric 10
  'Additional metric? (10)',                                           // 114 (DK)
  'Additional Metric 10 — Name',                                       // 115 (DL)
  'Additional Metric 10 — Category',                                   // 116 (DM)
  'Additional Metric 10 — Rate (%)',                                   // 117 (DN)
  'Additional Metric 10 — Description'                                 // 118 (DO)
];

// ── Metric Column Indices (all +1 from v1) ─────────────────────────
var METRIC_COLUMNS = {
  'classicChecks':          { ask: 28, rate: 29, desc: 30 },
  'videoCheck':             { ask: 31, rate: 32, desc: 33 },
  'typedText':              { ask: 34, rate: 35, desc: 36 },
  'typicalSpeed':           { ask: 37, rate: 38, desc: 39 },
  'recaptcha':              { ask: 40, rate: 41, desc: 42 },
  'pangram':                { ask: 43, rate: 44, desc: 45 },
  'mouseClicks':            { ask: 46, rate: 47, desc: 48 },
  'mouseMovements':         { ask: 49, rate: 50, desc: 51 },
  'uniqueIp':               { ask: 52, rate: 53, desc: 54 },
  'noForeignIp':            { ask: 55, rate: 56, desc: 57 },
  'noGeoCluster':           { ask: 58, rate: 59, desc: 60 },
  'noDuplicateSubmission':  { ask: 61, rate: 62, desc: 63 },
  'noDuplicateFingerprint': { ask: 64, rate: 65, desc: 66 }
};

var CUSTOM_METRIC_COLUMNS = [
  { ask: 69,  name: 70,  cat: 71,  rate: 72,  desc: 73  },
  { ask: 74,  name: 75,  cat: 76,  rate: 77,  desc: 78  },
  { ask: 79,  name: 80,  cat: 81,  rate: 82,  desc: 83  },
  { ask: 84,  name: 85,  cat: 86,  rate: 87,  desc: 88  },
  { ask: 89,  name: 90,  cat: 91,  rate: 92,  desc: 93  },
  { ask: 94,  name: 95,  cat: 96,  rate: 97,  desc: 98  },
  { ask: 99,  name: 100, cat: 101, rate: 102, desc: 103 },
  { ask: 104, name: 105, cat: 106, rate: 107, desc: 108 },
  { ask: 109, name: 110, cat: 111, rate: 112, desc: 113 },
  { ask: 114, name: 115, cat: 116, rate: 117, desc: 118 }
];

// ── doPost: Handle form submissions and updates ────────────────────

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var action = data.action || 'submit';

    if (action === 'update') {
      return handleUpdate(data);
    }
    return handleSubmit(data);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ── doGet: Handle email verification ───────────────────────────────

function doGet(e) {
  var action = (e.parameter && e.parameter.action) || '';

  if (action === 'verify') {
    return handleVerify(e.parameter.email, e.parameter.dataId, e.parameter.token);
  }

  if (action === 'review') {
    return handleAdminReview(e.parameter.submissionId, e.parameter.token);
  }

  if (action === 'approve') {
    return handleAdminApprove(e.parameter.submissionId, e.parameter.token);
  }

  if (action === 'disapprove') {
    return handleAdminDisapprove(e.parameter.submissionId, e.parameter.token);
  }

  return HtmlService.createHtmlOutput('<p>Data Quality Hub API</p>');
}

// ── Submit Handler ─────────────────────────────────────────────────

function handleSubmit(data) {
  var researcher = data.researcher || {};
  var metadata = data.metadata || {};
  var submissionId = data.submissionId || '';
  var passwordHash = data.passwordHash || '';
  var entries = data.entries || [];
  var email = researcher.email || '';
  var timestamp = new Date();

  // 1. Write to Users sheet
  var usersSheet = SpreadsheetApp.openById(USERS_SHEET_ID).getSheetByName('Sheet1');
  if (usersSheet.getLastRow() === 0) {
    usersSheet.appendRow(['email', 'passwordHash', 'submissionId', 'emailConfirmed', 'submittedAt']);
  }
  usersSheet.appendRow([email, passwordHash, submissionId, '0', timestamp]);

  // 2. Write to Data sheet
  var dataSheet = SpreadsheetApp.openById(DATA_SHEET_ID).getSheetByName('Sheet1');
  if (dataSheet.getLastRow() === 0) {
    dataSheet.appendRow(HEADERS);
  }

  for (var i = 0; i < entries.length; i++) {
    var row = buildRow(researcher, metadata, entries[i], submissionId);
    dataSheet.appendRow(row);
  }

  // 3. Send verification email
  var token = generateToken(email, submissionId);
  sendVerificationEmail(email, submissionId, token);

  // 4. Send admin notification
  sendAdminNotification(email, submissionId, timestamp);

  return ContentService.createTextOutput(JSON.stringify({ status: 'ok', rows: entries.length, submissionId: submissionId }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── Update Handler ─────────────────────────────────────────────────

function handleUpdate(data) {
  var submissionId = data.submissionId;
  if (!submissionId) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'No submissionId provided' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  var dataSheet = SpreadsheetApp.openById(DATA_SHEET_ID).getSheetByName('Sheet1');
  var newRows = data.rows || [];
  var allData = dataSheet.getDataRange().getValues();

  var headerRow = allData[0];
  var sidCol = headerRow.indexOf('Submission ID');
  if (sidCol === -1) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Submission ID column not found in sheet' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // Delete existing rows for this submission ID
  var deleted = 0;
  for (var r = allData.length - 1; r >= 1; r--) {
    if (String(allData[r][sidCol]) === String(submissionId)) {
      dataSheet.deleteRow(r + 1);
      deleted++;
    }
  }

  // Append new rows
  for (var i = 0; i < newRows.length; i++) {
    var row = newRows[i];
    while (row.length < HEADERS.length) row.push('');
    row[sidCol] = submissionId;
    row[2] = new Date();    // Timestamp at index 2
    row[0] = '';            // Approved = empty
    row[1] = '';            // Email Confirmed = empty (will need re-verification)
    dataSheet.appendRow(row);
  }

  return ContentService.createTextOutput(JSON.stringify({ status: 'ok', deleted: deleted, added: newRows.length }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── Verification Handler ───────────────────────────────────────────

function handleVerify(email, submissionId, token) {
  // Validate token
  var expectedToken = generateToken(email, submissionId);
  if (!token || token !== expectedToken) {
    return HtmlService.createHtmlOutput(verificationPage(false, 'Invalid or expired verification link.'));
  }

  // Update Users sheet
  var usersSheet = SpreadsheetApp.openById(USERS_SHEET_ID).getSheetByName('Sheet1');
  var usersData = usersSheet.getDataRange().getValues();
  for (var u = 1; u < usersData.length; u++) {
    if (String(usersData[u][0]) === String(email) && String(usersData[u][2]) === String(submissionId)) {
      usersSheet.getRange(u + 1, 4).setValue('1');  // emailConfirmed column (1-indexed: col 4)
      break;
    }
  }

  // Update Data sheet — set emailConfirmed=1 for all rows with this submissionId
  var dataSheet = SpreadsheetApp.openById(DATA_SHEET_ID).getSheetByName('Sheet1');
  var dataAll = dataSheet.getDataRange().getValues();
  var sidCol = dataAll[0].indexOf('Submission ID');
  var ecCol  = dataAll[0].indexOf('Email Confirmed');

  if (sidCol !== -1 && ecCol !== -1) {
    for (var d = 1; d < dataAll.length; d++) {
      if (String(dataAll[d][sidCol]) === String(submissionId)) {
        dataSheet.getRange(d + 1, ecCol + 1).setValue('1');  // ecCol is 0-indexed, getRange is 1-indexed
      }
    }
  }

  return HtmlService.createHtmlOutput(verificationPage(true, 'Your email has been verified! Your submission will appear on the dashboard after admin review.'));
}

// ── Build Row (119 columns) ────────────────────────────────────────

function buildRow(researcher, metadata, entry, submissionId) {
  var row = [];
  for (var i = 0; i < HEADERS.length; i++) row.push('');

  // [0] Approved = empty (admin sets manually)
  // [1] Email Confirmed = '0' (set to '1' after email verification; string to avoid Sheets date coercion)
  row[1]  = '0';
  row[2]  = new Date();
  row[3]  = submissionId || '';

  // Researcher
  row[4]  = researcher.email || '';
  row[5]  = researcher.name || '';
  row[6]  = researcher.affiliation || '';
  row[7]  = researcher.studyTitle || '';

  // Study metadata
  row[8]  = metadata.preRegistered || '';
  row[9]  = metadata.preRegLink || '';
  row[10] = metadata.paperLink || '';
  row[11] = metadata.dataAvailability || '';
  row[12] = metadata.dataLink || '';
  row[13] = metadata.publicationStatus || '';
  row[14] = metadata.feedback || '';

  // Platform
  var isKnown = ['Prolific', 'MTurk', 'Bilendi', 'Moblab', 'CloudResearch'].indexOf(entry.platform) !== -1;
  row[15] = isKnown ? entry.platform : 'Other';
  row[16] = isKnown ? '' : entry.platform;

  // Sample / dates
  row[17] = entry.sample || '';
  row[18] = entry.sampleSize || '';
  row[19] = entry.month || '';
  row[20] = entry.year || '';

  // Recruitment strategy
  var rm = entry.recruitmentMethod || '';
  if (rm === 'two-stage')   row[21] = 'Two-Stage';
  else if (rm === 'platform') row[21] = 'Standard';

  // Recruitment details
  row[22] = entry.country || '';
  row[23] = entry.approvalScore || '';
  row[24] = entry.minStudies || '';
  row[25] = entry.representativeSample || '';
  row[26] = entry.additionalCriteria || '';
  row[27] = entry.screenerStudy || '';

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
  row[67] = entry.overallRate || '';
  row[68] = entry.overallDescription || '';

  return row;
}

// ── Token Generation ───────────────────────────────────────────────

function generateToken(email, submissionId) {
  var raw = email + '|' + submissionId + '|' + TOKEN_SECRET;
  var digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, raw);
  return digest.map(function (b) {
    return ('0' + ((b < 0 ? b + 256 : b).toString(16))).slice(-2);
  }).join('');
}

function generateAdminToken(submissionId) {
  var raw = 'admin-review|' + submissionId + '|' + ADMIN_TOKEN_SECRET;
  var digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, raw);
  return digest.map(function (b) {
    return ('0' + ((b < 0 ? b + 256 : b).toString(16))).slice(-2);
  }).join('');
}

// ── Email: Verification ────────────────────────────────────────────

function sendVerificationEmail(email, submissionId, token) {
  var verifyUrl = DEPLOYED_SCRIPT_URL +
    '?action=verify' +
    '&email=' + encodeURIComponent(email) +
    '&dataId=' + encodeURIComponent(submissionId) +
    '&token=' + encodeURIComponent(token);

  var subject = 'Data Quality Hub — Please Verify Your Email';
  var body = 'Thank you for submitting to the Data Quality Hub!\n\n' +
    'Please verify your email by clicking the link below:\n\n' +
    verifyUrl + '\n\n' +
    'Submission ID: ' + submissionId + '\n\n' +
    'After verification, your submission will be reviewed by an admin before appearing on the dashboard.\n\n' +
    '— Data Quality Hub Team\n' +
    GITHUB_PAGES_URL;

  GmailApp.sendEmail(email, subject, body);
}

// ── Email: Admin Notification ──────────────────────────────────────

function sendAdminNotification(email, submissionId, timestamp) {
  var sheetUrl = 'https://docs.google.com/spreadsheets/d/' + DATA_SHEET_ID;
  var adminToken = generateAdminToken(submissionId);
  var reviewUrl = DEPLOYED_SCRIPT_URL +
    '?action=review' +
    '&submissionId=' + encodeURIComponent(submissionId) +
    '&token=' + encodeURIComponent(adminToken);

  var subject = 'DQH: New Submission from ' + email;
  var body = 'A new submission has been received.\n\n' +
    'Researcher email: ' + email + '\n' +
    'Submission ID: ' + submissionId + '\n' +
    'Time: ' + timestamp.toISOString() + '\n\n' +
    'Review and approve this submission:\n' + reviewUrl + '\n\n' +
    'View the Data sheet:\n' + sheetUrl + '\n\n' +
    'The submission requires email verification before it becomes visible. ' +
    'Once verified, set Approved=1 to show it on the dashboard.';

  var adminList = ADMIN_EMAILS.join(',');
  GmailApp.sendEmail(adminList, subject, body);
}

// ── HTML Helpers ───────────────────────────────────────────────────

function escHtml(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function field(label, value) {
  if (!value && value !== 0) return '';
  return '<div class="field"><span class="label">' + escHtml(label) + ':</span> ' + escHtml(value) + '</div>';
}

function fieldHtml(label, html) {
  if (!html) return '';
  return '<div class="field"><span class="label">' + escHtml(label) + ':</span> ' + html + '</div>';
}

function linkify(url) {
  if (!url) return '';
  var safe = escHtml(url);
  return '<a href="' + safe + '" target="_blank">' + safe + '</a>';
}

function metricRow(name, rate, desc) {
  return '<tr><td>' + escHtml(name) + '</td><td>' + escHtml(rate) + '%</td><td>' + escHtml(desc || '\u2014') + '</td></tr>';
}

function sectionCard(title, content) {
  return '<div class="card"><h2>' + escHtml(title) + '</h2>' + content + '</div>';
}

function adminPage(title, bodyContent) {
  return '<!DOCTYPE html><html><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<title>' + escHtml(title) + ' \u2014 Data Quality Hub</title>' +
    '<style>' +
    'body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;margin:0;padding:2rem;background:#0f172a;color:#e2e8f0;}' +
    '.container{max-width:720px;margin:0 auto;}' +
    'h1{color:#f8fafc;margin-bottom:1.5rem;font-size:1.5rem;}' +
    'h2{color:#94a3b8;font-size:1.1rem;margin:0 0 1rem 0;border-bottom:1px solid #334155;padding-bottom:0.5rem;}' +
    'h3{color:#94a3b8;font-size:0.95rem;margin:1rem 0 0.5rem 0;}' +
    '.card{background:#1e293b;border-radius:12px;padding:1.5rem;margin-bottom:1rem;box-shadow:0 2px 12px rgba(0,0,0,0.2);}' +
    '.badges{display:flex;gap:0.5rem;margin-bottom:1.5rem;flex-wrap:wrap;}' +
    '.badge{padding:0.35rem 0.75rem;border-radius:6px;font-size:0.85rem;font-weight:600;}' +
    '.badge-green{background:#166534;color:#bbf7d0;}' +
    '.badge-amber{background:#92400e;color:#fde68a;}' +
    '.badge-red{background:#991b1b;color:#fecaca;}' +
    '.field{margin-bottom:0.5rem;font-size:0.95rem;}' +
    '.label{color:#94a3b8;font-weight:600;}' +
    '.metrics{width:100%;border-collapse:collapse;margin-top:0.5rem;}' +
    '.metrics th,.metrics td{text-align:left;padding:0.4rem 0.75rem;border-bottom:1px solid #334155;font-size:0.9rem;}' +
    '.metrics th{color:#94a3b8;font-weight:600;}' +
    '.btn-approve{display:inline-block;background:#16a34a;color:#fff;padding:0.75rem 2rem;border-radius:8px;font-size:1rem;font-weight:600;text-decoration:none;}' +
    '.btn-approve:hover{background:#15803d;}' +
    '.btn-disapprove{display:inline-block;background:#dc2626;color:#fff;padding:0.75rem 2rem;border-radius:8px;font-size:1rem;font-weight:600;text-decoration:none;}' +
    '.btn-disapprove:hover{background:#b91c1c;}' +
    'a{color:#60a5fa;text-decoration:none;}a:hover{text-decoration:underline;}' +
    'p{margin:0.5rem 0;}' +
    '</style></head><body>' +
    '<div class="container">' +
    '<h1>' + escHtml(title) + '</h1>' +
    bodyContent +
    '</div></body></html>';
}

// ── Admin Review Handler ──────────────────────────────────────────

function handleAdminReview(submissionId, token) {
  if (!submissionId || !token || token !== generateAdminToken(submissionId)) {
    return HtmlService.createHtmlOutput(adminPage('Access Denied', '<div class="card"><p>Invalid or expired admin link.</p></div>'));
  }

  var dataSheet = SpreadsheetApp.openById(DATA_SHEET_ID).getSheetByName('Sheet1');
  var allData = dataSheet.getDataRange().getValues();
  var rows = [];
  for (var i = 1; i < allData.length; i++) {
    if (String(allData[i][3]) === String(submissionId)) {
      rows.push(allData[i]);
    }
  }

  if (rows.length === 0) {
    return HtmlService.createHtmlOutput(adminPage('Not Found', '<div class="card"><p>No data found for submission ID: ' + escHtml(submissionId) + '</p></div>'));
  }

  var r = rows[0];
  var approved = String(r[0]) === '1';
  var emailVerified = String(r[1]) === '1';

  var html = '<div class="badges">' +
    '<span class="badge ' + (approved ? 'badge-green' : 'badge-amber') + '">' + (approved ? 'Approved' : 'Not Approved') + '</span>' +
    '<span class="badge ' + (emailVerified ? 'badge-green' : 'badge-red') + '">' + (emailVerified ? 'Email Verified' : 'Email Not Verified') + '</span>' +
    '</div>';

  // Researcher card
  var resHtml = field('Name', r[5]) + field('Email', r[4]) + field('Affiliation', r[6]) + field('Study Title', r[7]);
  html += sectionCard('Researcher', resHtml);

  // Metadata card
  var metaHtml = field('Pre-registered', r[8]) +
    fieldHtml('Pre-registration Link', linkify(r[9])) +
    fieldHtml('Paper/Study Link', linkify(r[10])) +
    field('Data Availability', r[11]) +
    fieldHtml('Data Repository Link', linkify(r[12])) +
    field('Publication Status', r[13]);
  html += sectionCard('Study Metadata', metaHtml);

  // Feedback
  if (r[14]) {
    html += sectionCard('Feedback', '<p>' + escHtml(r[14]) + '</p>');
  }

  // Entry cards
  for (var e = 0; e < rows.length; e++) {
    var row = rows[e];
    var platform = String(row[15]);
    if (platform === 'Other' && row[16]) platform = String(row[16]);
    var sample = String(row[17] || '');
    var cardTitle = 'Entry ' + (e + 1) + ': ' + platform + (sample ? ' \u2014 ' + sample : '');

    var entryHtml = field('Platform', platform) +
      field('Sample', row[17]) +
      field('Sample Size', row[18]);

    var dateStr = '';
    if (row[19]) dateStr += row[19];
    if (row[19] && row[20]) dateStr += ' / ';
    if (row[20]) dateStr += row[20];
    entryHtml += field('Study Date', dateStr);

    entryHtml += field('Recruitment Strategy', row[21]) +
      field('Country', row[22]) +
      field('Approval Score', row[23]) +
      field('Min. Completed Studies', row[24]) +
      field('Representative Sample', row[25]) +
      field('Additional Screening', row[26]) +
      field('Screener Study', row[27]);

    // Standard metrics table
    var metricIds = Object.keys(METRIC_COLUMNS);
    var metricsHtml = '';
    for (var mi = 0; mi < metricIds.length; mi++) {
      var mid = metricIds[mi];
      var cols = METRIC_COLUMNS[mid];
      if (String(row[cols.ask]) === 'Yes') {
        var metricName = HEADERS[cols.rate].replace(' \u2014 Rate (%)', '');
        metricsHtml += metricRow(metricName, row[cols.rate], row[cols.desc]);
      }
    }

    // Custom metrics
    for (var ci = 0; ci < CUSTOM_METRIC_COLUMNS.length; ci++) {
      var cc = CUSTOM_METRIC_COLUMNS[ci];
      if (String(row[cc.ask]) === 'Yes') {
        var customName = String(row[cc.name] || '') + ' (' + String(row[cc.cat] || '') + ')';
        metricsHtml += metricRow(customName, row[cc.rate], row[cc.desc]);
      }
    }

    if (metricsHtml) {
      entryHtml += '<h3>Metrics</h3>' +
        '<table class="metrics"><thead><tr><th>Metric</th><th>Rate</th><th>Details</th></tr></thead>' +
        '<tbody>' + metricsHtml + '</tbody></table>';
    }

    // Overall quality
    if (row[67]) {
      entryHtml += field('Overall Quality Rate', row[67] + '%');
      entryHtml += field('Overall Quality Description', row[68]);
    }

    html += sectionCard(cardTitle, entryHtml);
  }

  // Approve / Disapprove button
  if (!approved) {
    var approveUrl = DEPLOYED_SCRIPT_URL +
      '?action=approve' +
      '&submissionId=' + encodeURIComponent(submissionId) +
      '&token=' + encodeURIComponent(token);
    html += '<div style="text-align:center;margin:2rem 0;">' +
      '<a href="' + approveUrl + '" class="btn-approve" target="_top">\u2713 Approve This Submission</a>' +
      '</div>';
  } else {
    var disapproveUrl = DEPLOYED_SCRIPT_URL +
      '?action=disapprove' +
      '&submissionId=' + encodeURIComponent(submissionId) +
      '&token=' + encodeURIComponent(token);
    html += '<div style="text-align:center;margin:2rem 0;">' +
      '<a href="' + disapproveUrl + '" class="btn-disapprove" target="_top">\u2717 Revoke Approval</a>' +
      '</div>';
  }

  // Sheet link
  var sheetUrl = 'https://docs.google.com/spreadsheets/d/' + DATA_SHEET_ID;
  html += '<p style="text-align:center;margin-top:1rem;"><a href="' + sheetUrl + '" target="_blank">Open Google Sheet</a></p>';

  return HtmlService.createHtmlOutput(adminPage('Submission Review: ' + submissionId, html));
}

// ── Admin Approve Handler ─────────────────────────────────────────

function handleAdminApprove(submissionId, token) {
  if (!submissionId || !token || token !== generateAdminToken(submissionId)) {
    return HtmlService.createHtmlOutput(adminPage('Access Denied', '<div class="card"><p>Invalid or expired admin link.</p></div>'));
  }

  var dataSheet = SpreadsheetApp.openById(DATA_SHEET_ID).getSheetByName('Sheet1');
  var allData = dataSheet.getDataRange().getValues();
  var updated = 0;

  for (var i = 1; i < allData.length; i++) {
    if (String(allData[i][3]) === String(submissionId)) {
      dataSheet.getRange(i + 1, 1).setValue('1');  // Column A = Approved (1-indexed)
      updated++;
    }
  }

  if (updated === 0) {
    return HtmlService.createHtmlOutput(adminPage('Not Found', '<div class="card"><p>No data found for submission ID: ' + escHtml(submissionId) + '</p></div>'));
  }

  var reviewUrl = DEPLOYED_SCRIPT_URL +
    '?action=review' +
    '&submissionId=' + encodeURIComponent(submissionId) +
    '&token=' + encodeURIComponent(token);

  var successHtml = '<div class="card" style="text-align:center;">' +
    '<div style="font-size:3rem;color:#22c55e;margin-bottom:1rem;">&#10003;</div>' +
    '<p style="font-size:1.1rem;">Submission <strong>' + escHtml(submissionId) + '</strong> has been approved.</p>' +
    '<p>' + updated + ' row(s) updated.</p>' +
    '<p style="margin-top:1.5rem;"><a href="' + reviewUrl + '" target="_top">Back to Review</a></p>' +
    '</div>';

  return HtmlService.createHtmlOutput(adminPage('Approved', successHtml));
}

// ── Admin Disapprove Handler ──────────────────────────────────────

function handleAdminDisapprove(submissionId, token) {
  if (!submissionId || !token || token !== generateAdminToken(submissionId)) {
    return HtmlService.createHtmlOutput(adminPage('Access Denied', '<div class="card"><p>Invalid or expired admin link.</p></div>'));
  }

  var dataSheet = SpreadsheetApp.openById(DATA_SHEET_ID).getSheetByName('Sheet1');
  var allData = dataSheet.getDataRange().getValues();
  var updated = 0;

  for (var i = 1; i < allData.length; i++) {
    if (String(allData[i][3]) === String(submissionId)) {
      dataSheet.getRange(i + 1, 1).setValue('');  // Column A = Approved → clear
      updated++;
    }
  }

  if (updated === 0) {
    return HtmlService.createHtmlOutput(adminPage('Not Found', '<div class="card"><p>No data found for submission ID: ' + escHtml(submissionId) + '</p></div>'));
  }

  var reviewUrl = DEPLOYED_SCRIPT_URL +
    '?action=review' +
    '&submissionId=' + encodeURIComponent(submissionId) +
    '&token=' + encodeURIComponent(token);

  var successHtml = '<div class="card" style="text-align:center;">' +
    '<div style="font-size:3rem;color:#f59e0b;margin-bottom:1rem;">&#10007;</div>' +
    '<p style="font-size:1.1rem;">Approval revoked for submission <strong>' + escHtml(submissionId) + '</strong>.</p>' +
    '<p>' + updated + ' row(s) updated.</p>' +
    '<p style="margin-top:1.5rem;"><a href="' + reviewUrl + '" target="_top">Back to Review</a></p>' +
    '</div>';

  return HtmlService.createHtmlOutput(adminPage('Approval Revoked', successHtml));
}

// ── Verification HTML Page ─────────────────────────────────────────

function verificationPage(success, message) {
  var color = success ? '#22c55e' : '#ef4444';
  var icon  = success ? '&#10003;' : '&#10007;';
  return '<!DOCTYPE html><html><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<title>Email Verification — Data Quality Hub</title>' +
    '<style>' +
    'body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;background:#0f172a;color:#e2e8f0;}' +
    '.card{background:#1e293b;border-radius:12px;padding:2rem 2.5rem;max-width:480px;text-align:center;box-shadow:0 4px 24px rgba(0,0,0,0.3);}' +
    '.icon{font-size:3rem;color:' + color + ';margin-bottom:1rem;}' +
    '.msg{font-size:1.1rem;line-height:1.6;}' +
    'a{color:#60a5fa;text-decoration:none;}a:hover{text-decoration:underline;}' +
    '</style></head><body>' +
    '<div class="card">' +
    '<div class="icon">' + icon + '</div>' +
    '<div class="msg">' + message + '</div>' +
    '<p style="margin-top:1.5rem;"><a href="' + GITHUB_PAGES_URL + '">Back to Data Quality Hub</a></p>' +
    '</div></body></html>';
}
