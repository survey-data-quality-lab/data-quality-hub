/**
 * Data Quality Hub — Submit Form
 * Multi-step wizard for submitting study data.
 * Supports single-stage (platform screening) and two-stage recruitment.
 * Everything under window.DQH.submitForm namespace.
 */
window.DQH = window.DQH || {};

window.DQH.submitForm = (function () {
  'use strict';

  // ── Configuration ──────────────────────────────────────────────
  var APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxuZNMDrk2H0SUqNJIz9GspUlkc9KVi7EtExb8VgO3UUtynk22yJUrPSlxyn9jxsW7VXA/exec';

  var KNOWN_PLATFORMS = ['Prolific', 'MTurk', 'Bilendi', 'Moblab', 'CloudResearch'];

  var MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  var STANDARD_METRICS = [
    { id: 'classicChecks', name: 'Passed Classic Checks', category: 'Attention',
      description: 'Participants correctly answered attention-check questions embedded in the survey (e.g., "Select Strongly Agree for this item").' },
    { id: 'videoCheck', name: 'Passed Video Check', category: 'AI/Bot',
      description: 'Participants passed a video-based verification confirming they are a real human (e.g., Verificare, webcam challenge).' },
    { id: 'typedText', name: 'Typed Text', category: 'AI/Bot',
      description: 'Participants provided typed open-ended responses that appear to be genuinely human-written (not copy-pasted or AI-generated).' },
    { id: 'typicalSpeed', name: 'Typed w/ Typical Speed', category: 'AI/Bot',
      description: 'Participants typed at a speed consistent with human typing patterns (not suspiciously fast, suggesting automated input).' },
    { id: 'recaptcha', name: 'reCAPTCHA Score', category: 'AI/Bot',
      description: 'Participants received a reCAPTCHA v3 score above the bot-detection threshold (typically \u2265 0.5).' },
    { id: 'pangram', name: 'Pangram AI Likelihood', category: 'AI/Bot',
      description: 'Participants were classified as likely human by Pangram\'s AI-detection model (AI likelihood below threshold).' },
    { id: 'uniqueIp', name: 'Unique IP Address', category: 'Fraud',
      description: 'Each participant connected from a unique IP address (no duplicate IPs suggesting multiple accounts from one person).' }
  ];

  var CATEGORIES = ['Attention', 'AI/Bot', 'Fraud'];

  // ── State ──────────────────────────────────────────────────────
  var state = {
    currentStep: 0,
    // Researcher info
    email: '', researcherName: '', affiliation: '', studyTitle: '',
    // Recruitment method — asked globally before platforms
    recruitmentMethod: '', // 'platform' or 'two-stage'
    // Selected platforms
    platforms: [],
    customPlatformInput: '',
    // Per-platform-stage data, keyed by dataKey(platformName, stage)
    // stage: 0 = platform screening (no stage), 1 = stage 1, 2 = stage 2
    platformData: {},
    // Metadata
    preRegistered: '', preRegLink: '', paperLink: '',
    dataAvailability: '', dataLink: '', publicationStatus: '',
    credibilityInfo: ''
  };

  // ── Helpers ────────────────────────────────────────────────────

  function esc(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str || ''));
    return div.innerHTML;
  }

  function getYearOptions() {
    var y0 = new Date().getFullYear() + 4, years = [];
    for (var y = y0; y >= 2015; y--) years.push(y);
    return years;
  }

  /** Composite key for platformData */
  function dataKey(platformName, stage) {
    return platformName + '|' + stage;
  }

  function ensurePlatformData(platformName, stage) {
    var key = dataKey(platformName, stage);
    if (!state.platformData[key]) {
      state.platformData[key] = {
        sampleSize: '', month: '', year: '',
        country: '', approvalScore: '', minStudies: '',
        selectionCriteria: '',     // stage 2: how selected from stage 1
        metrics: {},               // { metricId: { rate, description } }
        customMetrics: [],         // [{ name, category, rate, description }]
        overallRate: '', overallDescription: ''
      };
    }
    return state.platformData[key];
  }

  function isPlatformSelected(name) {
    return state.platforms.some(function (p) { return p.name === name; });
  }

  function getCustomPlatforms() {
    return state.platforms.filter(function (p) { return p.isCustom; });
  }

  // ── Step Definitions ───────────────────────────────────────────

  function getSteps() {
    var steps = [
      { id: 'researcher', label: 'Researcher Info' },
      { id: 'recruitment', label: 'Recruitment' },
      { id: 'platforms', label: 'Platforms' }
    ];

    if (state.recruitmentMethod === 'two-stage') {
      // Stage 1: full details per platform
      for (var i = 0; i < state.platforms.length; i++) {
        steps.push({
          id: 'plat-s1-' + i, label: state.platforms[i].name + ' (Stage 1)',
          platformIndex: i, stage: 1
        });
      }
      // Stage 2: reduced details per platform
      for (var j = 0; j < state.platforms.length; j++) {
        steps.push({
          id: 'plat-s2-' + j, label: state.platforms[j].name + ' (Stage 2)',
          platformIndex: j, stage: 2
        });
      }
    } else if (state.recruitmentMethod === 'platform') {
      for (var k = 0; k < state.platforms.length; k++) {
        steps.push({
          id: 'plat-' + k, label: state.platforms[k].name,
          platformIndex: k, stage: 0
        });
      }
    }

    steps.push({ id: 'metadata', label: 'Metadata' });
    return steps;
  }

  // ── Progress Bar ───────────────────────────────────────────────

  function renderProgress(steps) {
    var html = '<div class="sf-progress">';
    for (var i = 0; i < steps.length; i++) {
      var cls = i === state.currentStep ? ' active' : (i < state.currentStep ? ' completed' : '');
      html += '<div class="sf-progress-step' + cls + '">';
      html += '<span class="sf-progress-dot"></span>';
      html += '<span>' + esc(steps[i].label) + '</span>';
      html += '</div>';
      if (i < steps.length - 1) html += '<div class="sf-progress-line"></div>';
    }
    return html + '</div>';
  }

  // ── Navigation ─────────────────────────────────────────────────

  function renderNav(stepIndex, totalSteps) {
    var html = '<div class="sf-nav">';
    if (stepIndex > 0) html += '<button type="button" class="sf-btn-back" data-action="back">&#8592; Back</button>';
    if (stepIndex < totalSteps - 1)
      html += '<button type="button" class="sf-btn-next' + (stepIndex === 0 ? ' sf-nav-right' : '') + '" data-action="next">Next &#8594;</button>';
    else
      html += '<button type="button" class="sf-btn-submit" data-action="submit">Submit</button>';
    return html + '</div>';
  }

  // ── Step 1: Researcher Info ────────────────────────────────────

  function renderResearcherStep() {
    return '<h3 class="sf-step-title">Researcher Information</h3>' +
      '<p class="sf-step-desc">This form is designed for academic researchers. Please submit one response per study. If your study uses multiple platforms, you\'ll provide data for each platform separately.</p>' +
      textField('sf-email', 'Contact Email', state.email, true, 'researcher@university.edu', 'email') +
      textField('sf-name', 'Researcher Name', state.researcherName, true, 'Jane Doe') +
      textField('sf-affiliation', 'Affiliation', state.affiliation, true, 'University of Example') +
      textField('sf-studyTitle', 'Study Title', state.studyTitle, true, 'My Survey Study');
  }

  // ── Step 2: Recruitment Method ─────────────────────────────────

  function renderRecruitmentStep() {
    var html = '<h3 class="sf-step-title">Recruitment Method</h3>';
    html += '<p class="sf-step-desc">How were participants recruited for this study?</p>';
    html += '<div class="sf-field">';
    html += '<div class="sf-radio-group">';

    var opts = [
      { value: 'platform', label: 'Platform with screening criteria',
        desc: 'Participants recruited directly from the platform (single stage)' },
      { value: 'two-stage', label: 'Two-stage recruitment',
        desc: 'Participants from a previous study who passed certain quality checks were re-invited for a second stage' }
    ];
    for (var i = 0; i < opts.length; i++) {
      var ch = state.recruitmentMethod === opts[i].value ? ' checked' : '';
      html += '<label class="sf-radio-option">';
      html += '<input type="radio" name="sf-recruitMethod" value="' + opts[i].value + '"' + ch + '>';
      html += '<div><span class="sf-option-label">' + esc(opts[i].label) + '</span>';
      html += '<div class="sf-hint">' + esc(opts[i].desc) + '</div></div>';
      html += '</label>';
    }
    html += '</div>';
    html += '<div class="sf-error-msg" id="sf-recruitMethod-error"></div>';
    html += '</div>';
    return html;
  }

  // ── Step 3: Platform Selection ─────────────────────────────────

  function renderPlatformsStep() {
    var html = '<h3 class="sf-step-title">Select Platforms</h3>';
    html += '<p class="sf-step-desc">Which platforms did you collect data from? Select all that apply, or add custom platforms.</p>';

    // Known platform chips
    html += '<div class="sf-chips">';
    for (var i = 0; i < KNOWN_PLATFORMS.length; i++) {
      var p = KNOWN_PLATFORMS[i];
      var sel = isPlatformSelected(p) ? ' selected' : '';
      html += '<div class="sf-chip' + sel + '" data-platform="' + esc(p) + '">';
      html += '<span class="sf-chip-check"></span><span>' + esc(p) + '</span></div>';
    }
    html += '</div>';

    // Custom platforms
    var customs = getCustomPlatforms();
    if (customs.length) {
      html += '<div class="sf-custom-platforms">';
      for (var j = 0; j < customs.length; j++) {
        html += '<span class="sf-custom-tag">' + esc(customs[j].name);
        html += '<button type="button" class="sf-custom-tag-remove" data-remove-platform="' + esc(customs[j].name) + '">&times;</button></span>';
      }
      html += '</div>';
    }

    html += '<div class="sf-add-row">';
    html += '<input class="sf-input" type="text" id="sf-custom-platform" placeholder="Custom platform name\u2026" value="' + esc(state.customPlatformInput) + '">';
    html += '<button type="button" class="sf-btn-add" data-action="add-platform">+ Add</button>';
    html += '</div>';
    html += '<div class="sf-error-msg" id="sf-platforms-error"></div>';
    return html;
  }

  // ── Platform Detail Step ───────────────────────────────────────

  function renderPlatformDetailStep(platformIndex, stage) {
    var platform = state.platforms[platformIndex];
    var pName = platform.name;
    var pd = ensurePlatformData(pName, stage);
    var pfx = platformIndex + '-s' + stage; // unique prefix for IDs
    var html = '';

    // Header
    html += '<div class="sf-platform-header">';
    html += '<span class="sf-platform-badge">' + esc(pName) + '</span>';
    if (stage === 1) html += '<span class="sf-platform-counter">Stage 1 — Platform ' + (platformIndex + 1) + ' of ' + state.platforms.length + '</span>';
    else if (stage === 2) html += '<span class="sf-platform-counter">Stage 2 — Platform ' + (platformIndex + 1) + ' of ' + state.platforms.length + '</span>';
    else html += '<span class="sf-platform-counter">Platform ' + (platformIndex + 1) + ' of ' + state.platforms.length + '</span>';
    html += '</div>';

    // ── Stage 2: selection criteria (at the top) ──
    if (stage === 2) {
      html += '<div class="sf-field">';
      html += '<label class="sf-label" for="sf-selCriteria-' + pfx + '">Selection Criteria for Stage 2 <span class="sf-required">*</span></label>';
      html += '<textarea class="sf-textarea" id="sf-selCriteria-' + pfx + '" placeholder="Describe how you selected participants from Stage 1 for Stage 2 (e.g., which quality checks they had to pass).">' + esc(pd.selectionCriteria) + '</textarea>';
      html += '<div class="sf-error-msg" id="sf-selCriteria-' + pfx + '-error"></div>';
      html += '</div>';
    }

    // Sample size
    html += textField('sf-sampleSize-' + pfx, 'Sample Size', pd.sampleSize, true, '200', 'number');

    // Study date
    html += '<div class="sf-field"><label class="sf-label">Study Start Date <span class="sf-required">*</span></label><div class="sf-inline-group">';
    html += '<select class="sf-select" id="sf-month-' + pfx + '"><option value="">Month\u2026</option>';
    for (var m = 0; m < MONTHS.length; m++) {
      html += '<option value="' + MONTHS[m] + '"' + (pd.month === MONTHS[m] ? ' selected' : '') + '>' + MONTHS[m] + '</option>';
    }
    html += '</select><select class="sf-select" id="sf-year-' + pfx + '"><option value="">Year\u2026</option>';
    var years = getYearOptions();
    for (var y = 0; y < years.length; y++) {
      html += '<option value="' + years[y] + '"' + (pd.year === String(years[y]) ? ' selected' : '') + '>' + years[y] + '</option>';
    }
    html += '</select></div>';
    html += '<div class="sf-error-msg" id="sf-month-' + pfx + '-error"></div>';
    html += '<div class="sf-error-msg" id="sf-year-' + pfx + '-error"></div>';
    html += '</div>';

    // Country, approval, min studies — only for stage 0 and stage 1 (NOT stage 2)
    if (stage !== 2) {
      html += textField('sf-country-' + pfx, 'Country', pd.country, false, 'e.g., United States');
      html += textField('sf-approval-' + pfx, 'Participant Quality / Approval Score', pd.approvalScore, false, 'e.g., 95% approval rate');
      html += '<div class="sf-hint" style="margin-top:-0.5rem;margin-bottom:1rem;">For MTurk: HIT approval rate. For Prolific: approval rate. Open text \u2014 describe as applicable.</div>';
      html += textField('sf-minStudies-' + pfx, 'Other Screening Criteria', pd.minStudies, false, 'e.g., filtered for age > 18, required specific country, etc.');
      html += '<div class="sf-hint" style="margin-top:-0.5rem;margin-bottom:1rem;">Please describe in detail your method of initial filtering of the subject pool.</div>';
    }

    // ── Metrics ──
    html += '<hr class="sf-section-divider">';
    html += '<div class="sf-section-label">Quality Metrics</div>';
    html += '<p class="sf-section-hint">Select all metrics you measured. A detail panel appears for each.</p>';

    html += '<div class="sf-checkbox-group" id="sf-metrics-cb-' + pfx + '">';
    for (var mi = 0; mi < STANDARD_METRICS.length; mi++) {
      var met = STANDARD_METRICS[mi];
      var metCh = pd.metrics[met.id] ? ' checked' : '';
      html += '<label class="sf-checkbox-option">';
      html += '<input type="checkbox" data-metric="' + met.id + '"' + metCh + '>';
      html += '<span class="sf-option-label">' + esc(met.name) + '</span>';
      html += '<span class="sf-option-category">(' + esc(met.category) + ')</span>';
      html += '</label>';
    }
    // Existing custom metrics
    for (var ci = 0; ci < pd.customMetrics.length; ci++) {
      var cm = pd.customMetrics[ci];
      html += '<label class="sf-checkbox-option">';
      html += '<input type="checkbox" data-custom-metric="' + ci + '" checked>';
      html += '<span class="sf-option-label">' + esc(cm.name) + '</span>';
      if (cm.category) html += '<span class="sf-option-category">(' + esc(cm.category) + ')</span>';
      html += '<button type="button" class="sf-custom-tag-remove" data-remove-custom-metric="' + ci + '" style="margin-left:auto;">&times;</button>';
      html += '</label>';
    }
    html += '</div>';

    // Add custom metric
    html += '<div class="sf-add-metric-row">';
    html += '<input class="sf-input" type="text" id="sf-custom-metric-name-' + pfx + '" placeholder="Custom metric name\u2026">';
    html += '<button type="button" class="sf-btn-add" data-action="add-custom-metric" data-pfx="' + pfx + '">+ Add</button>';
    html += '</div>';

    // Metric detail panels
    html += '<div class="sf-metric-details" id="sf-metric-details-' + pfx + '">';
    for (var di = 0; di < STANDARD_METRICS.length; di++) {
      var dm = STANDARD_METRICS[di];
      if (pd.metrics[dm.id]) {
        html += renderMetricPanel(pfx, dm.id, dm.name, dm.category, dm.description, pd.metrics[dm.id]);
      }
    }
    for (var dci = 0; dci < pd.customMetrics.length; dci++) {
      html += renderCustomMetricPanel(pfx, dci, pd.customMetrics[dci]);
    }
    html += '</div>';

    // Overall quality
    html += '<hr class="sf-section-divider">';
    html += '<div class="sf-section-label">Overall Data Quality</div>';
    html += '<p class="sf-section-hint">Optional. If you have a composite pass rate combining multiple checks, provide it here.</p>';
    html += '<div class="sf-field"><label class="sf-label" for="sf-overallRate-' + pfx + '">Overall Pass Rate (%)</label>';
    html += '<input class="sf-input" type="number" id="sf-overallRate-' + pfx + '" min="0" max="100" value="' + esc(pd.overallRate) + '" placeholder="e.g., 78">';
    html += '<div class="sf-error-msg" id="sf-overallRate-' + pfx + '-error"></div></div>';
    html += '<div class="sf-field"><label class="sf-label" for="sf-overallDesc-' + pfx + '">Description</label>';
    html += '<textarea class="sf-textarea" id="sf-overallDesc-' + pfx + '" placeholder="How do you define \'passing\' overall data quality?">' + esc(pd.overallDescription) + '</textarea></div>';

    return html;
  }

  function renderMetricPanel(pfx, metricId, name, category, description, data) {
    var id = 'sf-mp-' + pfx + '-' + metricId;
    var html = '<div class="sf-metric-panel" data-metric-panel="' + metricId + '">';
    html += '<div class="sf-metric-panel-title">' + esc(name) + '</div>';
    html += '<div class="sf-metric-panel-category">' + esc(category) + '</div>';
    if (description) html += '<div class="sf-hint" style="margin-bottom:0.75rem;">' + esc(description) + '</div>';
    html += '<div class="sf-field"><label class="sf-label" for="' + id + '-rate">Rate (%) <span class="sf-required">*</span></label>';
    html += '<input class="sf-input" type="number" id="' + id + '-rate" min="0" max="100" value="' + esc(data.rate) + '" placeholder="0\u2013100">';
    html += '<div class="sf-error-msg" id="' + id + '-rate-error"></div></div>';
    html += '<div class="sf-field"><label class="sf-label" for="' + id + '-desc">Description</label>';
    html += '<textarea class="sf-textarea" id="' + id + '-desc" placeholder="Optional \u2014 describe your measurement approach">' + esc(data.description) + '</textarea></div>';
    return html + '</div>';
  }

  function renderCustomMetricPanel(pfx, customIndex, cm) {
    var id = 'sf-cmp-' + pfx + '-' + customIndex;
    var html = '<div class="sf-metric-panel" data-custom-metric-panel="' + customIndex + '">';
    html += '<div class="sf-metric-panel-title">' + esc(cm.name) + '</div>';
    html += '<div class="sf-field"><label class="sf-label" for="' + id + '-cat">Category <span class="sf-required">*</span></label>';
    html += '<select class="sf-select" id="' + id + '-cat"><option value="">Select category\u2026</option>';
    for (var c = 0; c < CATEGORIES.length; c++) {
      html += '<option value="' + CATEGORIES[c] + '"' + (cm.category === CATEGORIES[c] ? ' selected' : '') + '>' + CATEGORIES[c] + '</option>';
    }
    html += '</select><div class="sf-error-msg" id="' + id + '-cat-error"></div></div>';
    html += '<div class="sf-field"><label class="sf-label" for="' + id + '-rate">Rate (%) <span class="sf-required">*</span></label>';
    html += '<input class="sf-input" type="number" id="' + id + '-rate" min="0" max="100" value="' + esc(cm.rate) + '" placeholder="0\u2013100">';
    html += '<div class="sf-error-msg" id="' + id + '-rate-error"></div></div>';
    html += '<div class="sf-field"><label class="sf-label" for="' + id + '-desc">Description <span class="sf-required">*</span></label>';
    html += '<textarea class="sf-textarea" id="' + id + '-desc" placeholder="Describe this metric and how it was measured">' + esc(cm.description) + '</textarea>';
    html += '<div class="sf-error-msg" id="' + id + '-desc-error"></div></div>';
    return html + '</div>';
  }

  // ── Metadata Step ──────────────────────────────────────────────

  function renderMetadataStep() {
    var html = '<h3 class="sf-step-title">Study Metadata</h3>';
    html += '<p class="sf-step-desc">Details about your study\'s publication and data availability.</p>';

    // Pre-registered (required)
    html += '<div class="sf-field"><label class="sf-label">Is this study pre-registered? <span class="sf-required">*</span></label><div class="sf-radio-group" id="sf-prereg-group">';
    ['Yes', 'No'].forEach(function (v) {
      html += '<label class="sf-radio-option"><input type="radio" name="sf-prereg" value="' + v + '"' + (state.preRegistered === v ? ' checked' : '') + '>';
      html += '<span class="sf-option-label">' + v + '</span></label>';
    });
    html += '</div><div class="sf-error-msg" id="sf-prereg-error"></div></div>';

    var preVis = state.preRegistered === 'Yes' ? ' visible' : '';
    html += '<div class="sf-conditional' + preVis + '" id="sf-prereg-link-section">';
    html += textField('sf-preRegLink', 'Pre-registration Link', state.preRegLink, false, 'https://osf.io/...');
    html += '</div>';

    // Data availability (required)
    html += '<div class="sf-field"><label class="sf-label">Data Availability <span class="sf-required">*</span></label><div class="sf-radio-group" id="sf-dataAvail-group">';
    ['Publicly available', 'Available upon request', 'Will be publicly available upon publication', 'Not publicly available'].forEach(function (v) {
      html += '<label class="sf-radio-option"><input type="radio" name="sf-dataAvail" value="' + esc(v) + '"' + (state.dataAvailability === v ? ' checked' : '') + '>';
      html += '<span class="sf-option-label">' + esc(v) + '</span></label>';
    });
    html += '</div><div class="sf-error-msg" id="sf-dataAvail-error"></div></div>';

    // Data link — shown only when "Publicly available" is selected
    var dataLinkVis = state.dataAvailability === 'Publicly available' ? ' visible' : '';
    html += '<div class="sf-conditional' + dataLinkVis + '" id="sf-dataLink-section">';
    html += textField('sf-dataLink', 'Data Repository Link', state.dataLink, false, 'https://osf.io/... or https://dataverse.harvard.edu/...');
    html += '</div>';

    // Publication status (required)
    html += '<div class="sf-field"><label class="sf-label">Publication Status <span class="sf-required">*</span></label><div class="sf-radio-group" id="sf-pubStatus-group">';
    ['Published', 'Working paper available', 'Paper not yet available'].forEach(function (v) {
      html += '<label class="sf-radio-option"><input type="radio" name="sf-pubStatus" value="' + esc(v) + '"' + (state.publicationStatus === v ? ' checked' : '') + '>';
      html += '<span class="sf-option-label">' + esc(v) + '</span></label>';
    });
    html += '</div><div class="sf-error-msg" id="sf-pubStatus-error"></div></div>';

    // Paper link — shown only when "Published" or "Working paper available" is selected
    var paperLinkVis = (state.publicationStatus === 'Published' || state.publicationStatus === 'Working paper available') ? ' visible' : '';
    html += '<div class="sf-conditional' + paperLinkVis + '" id="sf-paperLink-section">';
    html += textField('sf-paperLink', 'Paper or Study Link', state.paperLink, false, 'https://doi.org/...');
    html += '</div>';

    // Credibility justification
    html += '<hr class="sf-section-divider">';
    html += '<div class="sf-field">';
    html += '<label class="sf-label" for="sf-credibility">Additional Credibility Information</label>';
    html += '<div class="sf-hint" style="margin-bottom:0.4rem;">Please provide any additional information that increases the credibility of your results (e.g., data quality procedures, verification methods, replication details).</div>';
    html += '<textarea id="sf-credibility" class="sf-textarea" rows="4" placeholder="e.g., We used Qualtrics fraud detection, verified responses with Fingerprint.com, pre-registered our analysis plan...">' + esc(state.credibilityInfo) + '</textarea>';
    html += '</div>';

    return html;
  }

  // ── Generic Field Helper ───────────────────────────────────────

  function textField(id, label, value, required, placeholder, type) {
    var html = '<div class="sf-field"><label class="sf-label" for="' + id + '">' + esc(label);
    if (required) html += ' <span class="sf-required">*</span>';
    html += '</label><input class="sf-input" type="' + (type || 'text') + '" id="' + id + '" value="' + esc(value) + '"';
    if (placeholder) html += ' placeholder="' + esc(placeholder) + '"';
    html += '><div class="sf-error-msg" id="' + id + '-error"></div></div>';
    return html;
  }

  // ── Save Current Step Into State ───────────────────────────────

  function saveCurrentStep() {
    var steps = getSteps();
    var step = steps[state.currentStep];
    if (!step) return;

    if (step.id === 'researcher') {
      state.email = gv('sf-email');
      state.researcherName = gv('sf-name');
      state.affiliation = gv('sf-affiliation');
      state.studyTitle = gv('sf-studyTitle');
    } else if (step.id === 'recruitment') {
      var r = document.querySelector('input[name="sf-recruitMethod"]:checked');
      state.recruitmentMethod = r ? r.value : '';
    } else if (step.id === 'metadata') {
      var pre = document.querySelector('input[name="sf-prereg"]:checked');
      state.preRegistered = pre ? pre.value : '';
      state.preRegLink = gv('sf-preRegLink');
      state.paperLink = gv('sf-paperLink');
      var da = document.querySelector('input[name="sf-dataAvail"]:checked');
      state.dataAvailability = da ? da.value : '';
      state.dataLink = gv('sf-dataLink');
      var ps = document.querySelector('input[name="sf-pubStatus"]:checked');
      state.publicationStatus = ps ? ps.value : '';
      var credEl = document.getElementById('sf-credibility');
      state.credibilityInfo = credEl ? credEl.value.trim() : '';
    } else if (step.platformIndex !== undefined) {
      savePlatformStep(step.platformIndex, step.stage);
    }
  }

  function savePlatformStep(idx, stage) {
    var pName = state.platforms[idx].name;
    var pd = ensurePlatformData(pName, stage);
    var pfx = idx + '-s' + stage;

    pd.sampleSize = gv('sf-sampleSize-' + pfx);
    pd.month = gv('sf-month-' + pfx);
    pd.year = gv('sf-year-' + pfx);

    if (stage !== 2) {
      pd.country = gv('sf-country-' + pfx);
      pd.approvalScore = gv('sf-approval-' + pfx);
      pd.minStudies = gv('sf-minStudies-' + pfx);
    } else {
      pd.selectionCriteria = gv('sf-selCriteria-' + pfx);
    }

    // Standard metrics
    var cbContainer = document.getElementById('sf-metrics-cb-' + pfx);
    if (cbContainer) {
      cbContainer.querySelectorAll('input[data-metric]').forEach(function (cb) {
        var mid = cb.getAttribute('data-metric');
        if (cb.checked) {
          if (!pd.metrics[mid]) pd.metrics[mid] = { rate: '', description: '' };
          var rateEl = document.getElementById('sf-mp-' + pfx + '-' + mid + '-rate');
          var descEl = document.getElementById('sf-mp-' + pfx + '-' + mid + '-desc');
          if (rateEl) pd.metrics[mid].rate = rateEl.value.trim();
          if (descEl) pd.metrics[mid].description = descEl.value.trim();
        } else {
          delete pd.metrics[mid];
        }
      });
    }

    // Custom metrics
    for (var ci = 0; ci < pd.customMetrics.length; ci++) {
      var catEl = document.getElementById('sf-cmp-' + pfx + '-' + ci + '-cat');
      var rateEl = document.getElementById('sf-cmp-' + pfx + '-' + ci + '-rate');
      var descEl = document.getElementById('sf-cmp-' + pfx + '-' + ci + '-desc');
      if (catEl) pd.customMetrics[ci].category = catEl.value.trim();
      if (rateEl) pd.customMetrics[ci].rate = rateEl.value.trim();
      if (descEl) pd.customMetrics[ci].description = descEl.value.trim();
    }

    pd.overallRate = gv('sf-overallRate-' + pfx);
    pd.overallDescription = gv('sf-overallDesc-' + pfx);
  }

  function gv(id) { var el = document.getElementById(id); return el ? el.value.trim() : ''; }

  // ── Validation ─────────────────────────────────────────────────

  function validateCurrentStep() {
    var steps = getSteps();
    var step = steps[state.currentStep];
    if (!step) return true;
    clearErrors();

    if (step.id === 'researcher') return validateResearcher();
    if (step.id === 'recruitment') return validateRecruitment();
    if (step.id === 'platforms') return validatePlatforms();
    if (step.id === 'metadata') return validateMetadata();
    if (step.platformIndex !== undefined) return validatePlatformDetail(step.platformIndex, step.stage);
    return true;
  }

  function validateResearcher() {
    var ok = true;
    if (!gv('sf-email') || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(gv('sf-email'))) { showError('sf-email', 'Please enter a valid email address'); ok = false; }
    if (!gv('sf-name')) { showError('sf-name', 'Name is required'); ok = false; }
    if (!gv('sf-affiliation')) { showError('sf-affiliation', 'Affiliation is required'); ok = false; }
    if (!gv('sf-studyTitle')) { showError('sf-studyTitle', 'Study title is required'); ok = false; }
    if (!ok) scrollToFirstError();
    return ok;
  }

  function validateRecruitment() {
    if (!state.recruitmentMethod) {
      showError('sf-recruitMethod', 'Please select a recruitment method');
      scrollToFirstError();
      return false;
    }
    return true;
  }

  function validateMetadata() {
    var ok = true;
    if (!document.querySelector('input[name="sf-prereg"]:checked')) {
      showError('sf-prereg', 'Please indicate whether the study is pre-registered');
      ok = false;
    }
    if (!document.querySelector('input[name="sf-dataAvail"]:checked')) {
      showError('sf-dataAvail', 'Please select a data availability option');
      ok = false;
    }
    if (!document.querySelector('input[name="sf-pubStatus"]:checked')) {
      showError('sf-pubStatus', 'Please select a publication status');
      ok = false;
    }
    if (!ok) scrollToFirstError();
    return ok;
  }

  function validatePlatforms() {
    if (state.platforms.length === 0) {
      showError('sf-platforms', 'Please select at least one platform');
      scrollToFirstError();
      return false;
    }
    return true;
  }

  function validatePlatformDetail(idx, stage) {
    var pName = state.platforms[idx].name;
    var pd = ensurePlatformData(pName, stage);
    var pfx = idx + '-s' + stage;
    var ok = true;

    // Stage 2: selection criteria required
    if (stage === 2) {
      if (!gv('sf-selCriteria-' + pfx)) { showError('sf-selCriteria-' + pfx, 'Please describe your selection criteria'); ok = false; }
    }

    // Sample size
    var ss = gv('sf-sampleSize-' + pfx);
    if (!ss || isNaN(parseInt(ss, 10)) || parseInt(ss, 10) < 1) {
      showError('sf-sampleSize-' + pfx, 'Please enter a valid sample size'); ok = false;
    }

    // Study start date (required for all stages)
    if (!gv('sf-month-' + pfx)) { showError('sf-month-' + pfx, 'Month is required'); ok = false; }
    if (!gv('sf-year-' + pfx)) { showError('sf-year-' + pfx, 'Year is required'); ok = false; }

    // Country and Approval Score are optional — no validation needed

    // Metric rates
    var mKeys = Object.keys(pd.metrics);
    for (var i = 0; i < mKeys.length; i++) {
      var rateEl = document.getElementById('sf-mp-' + pfx + '-' + mKeys[i] + '-rate');
      if (rateEl) {
        var rv = rateEl.value.trim();
        if (!rv || isNaN(parseFloat(rv)) || parseFloat(rv) < 0 || parseFloat(rv) > 100) {
          showError('sf-mp-' + pfx + '-' + mKeys[i] + '-rate', 'Rate must be 0\u2013100'); ok = false;
        }
      }
    }

    // Custom metrics
    for (var ci = 0; ci < pd.customMetrics.length; ci++) {
      var pre = 'sf-cmp-' + pfx + '-' + ci;
      if (!gv(pre + '-cat')) { showError(pre + '-cat', 'Category is required'); ok = false; }
      var cr = gv(pre + '-rate');
      if (!cr || isNaN(parseFloat(cr)) || parseFloat(cr) < 0 || parseFloat(cr) > 100) {
        showError(pre + '-rate', 'Rate must be 0\u2013100'); ok = false;
      }
      if (!gv(pre + '-desc')) { showError(pre + '-desc', 'Description is required for custom metrics'); ok = false; }
    }

    // Overall rate
    var or2 = gv('sf-overallRate-' + pfx);
    if (or2 && (isNaN(parseFloat(or2)) || parseFloat(or2) < 0 || parseFloat(or2) > 100)) {
      showError('sf-overallRate-' + pfx, 'Rate must be 0\u2013100'); ok = false;
    }

    if (!ok) scrollToFirstError();
    return ok;
  }

  function showError(id, msg) {
    var errEl = document.getElementById(id + '-error');
    if (errEl) { errEl.textContent = msg; errEl.classList.add('visible'); }
    var inputEl = document.getElementById(id);
    if (inputEl) inputEl.classList.add('sf-has-error');
  }

  function clearErrors() {
    document.querySelectorAll('.sf-error-msg').forEach(function (el) { el.classList.remove('visible'); el.textContent = ''; });
    document.querySelectorAll('.sf-has-error').forEach(function (el) { el.classList.remove('sf-has-error'); });
  }

  /** Scroll to the first visible error */
  function scrollToFirstError() {
    setTimeout(function () {
      var first = document.querySelector('.sf-error-msg.visible');
      if (first) {
        var field = first.closest('.sf-field') || first;
        field.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 50);
  }

  // ── Event Binding ──────────────────────────────────────────────

  function bindEvents() {
    var root = document.getElementById('sf-root');
    if (!root) return;

    // Nav buttons
    root.querySelectorAll('[data-action="next"]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        saveCurrentStep();
        if (validateCurrentStep()) { state.currentStep++; render(); scrollToForm(); }
      });
    });
    root.querySelectorAll('[data-action="back"]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        saveCurrentStep(); state.currentStep--; render(); scrollToForm();
      });
    });
    root.querySelectorAll('[data-action="submit"]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        saveCurrentStep();
        if (validateCurrentStep()) submitForm();
      });
    });

    // Platform chips
    root.querySelectorAll('.sf-chip[data-platform]').forEach(function (chip) {
      chip.addEventListener('click', function () { togglePlatform(chip.getAttribute('data-platform'), false); });
    });

    // Remove custom platform
    root.querySelectorAll('[data-remove-platform]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var name = btn.getAttribute('data-remove-platform');
        state.platforms = state.platforms.filter(function (p) { return p.name !== name; });
        // Clean up platform data for all stages
        delete state.platformData[dataKey(name, 0)];
        delete state.platformData[dataKey(name, 1)];
        delete state.platformData[dataKey(name, 2)];
        adjustCurrentStep(); render();
      });
    });

    // Add custom platform
    root.querySelectorAll('[data-action="add-platform"]').forEach(function (btn) {
      btn.addEventListener('click', addCustomPlatform);
    });
    var cpInput = document.getElementById('sf-custom-platform');
    if (cpInput) cpInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); addCustomPlatform(); } });

    // Add custom metric
    root.querySelectorAll('[data-action="add-custom-metric"]').forEach(function (btn) {
      btn.addEventListener('click', function () { addCustomMetric(btn.getAttribute('data-pfx')); });
    });
    root.querySelectorAll('[id^="sf-custom-metric-name-"]').forEach(function (input) {
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); var pfx = input.id.replace('sf-custom-metric-name-', ''); addCustomMetric(pfx); }
      });
    });

    // Remove custom metric
    root.querySelectorAll('[data-remove-custom-metric]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        var steps = getSteps(); var step = steps[state.currentStep];
        if (step && step.platformIndex !== undefined) {
          savePlatformStep(step.platformIndex, step.stage);
          var pd = ensurePlatformData(state.platforms[step.platformIndex].name, step.stage);
          pd.customMetrics.splice(parseInt(btn.getAttribute('data-remove-custom-metric'), 10), 1);
          render();
        }
      });
    });

    // Metric checkbox changes
    bindMetricCheckboxes();

    // Pre-registration conditional
    root.querySelectorAll('input[name="sf-prereg"]').forEach(function (radio) {
      radio.addEventListener('change', function () {
        var sec = document.getElementById('sf-prereg-link-section');
        if (sec) sec.classList.toggle('visible', radio.value === 'Yes' && radio.checked);
        // Clear validation error
        var errEl = document.getElementById('sf-prereg-error');
        if (errEl) { errEl.classList.remove('visible'); errEl.textContent = ''; }
      });
    });

    // Publication status conditional — show paper link when Published or Working paper
    root.querySelectorAll('input[name="sf-pubStatus"]').forEach(function (radio) {
      radio.addEventListener('change', function () {
        var sec = document.getElementById('sf-paperLink-section');
        var show = (radio.value === 'Published' || radio.value === 'Working paper available') && radio.checked;
        if (sec) sec.classList.toggle('visible', show);
        var errEl = document.getElementById('sf-pubStatus-error');
        if (errEl) { errEl.classList.remove('visible'); errEl.textContent = ''; }
      });
    });

    // Data availability conditional — show data link when Publicly available
    root.querySelectorAll('input[name="sf-dataAvail"]').forEach(function (radio) {
      radio.addEventListener('change', function () {
        var sec = document.getElementById('sf-dataLink-section');
        var show = radio.value === 'Publicly available' && radio.checked;
        if (sec) sec.classList.toggle('visible', show);
        var errEl = document.getElementById('sf-dataAvail-error');
        if (errEl) { errEl.classList.remove('visible'); errEl.textContent = ''; }
      });
    });

    // Clear errors on input
    root.querySelectorAll('.sf-input, .sf-select, .sf-textarea').forEach(function (el) {
      el.addEventListener('input', function () {
        el.classList.remove('sf-has-error');
        var errEl = document.getElementById(el.id + '-error');
        if (errEl) { errEl.classList.remove('visible'); errEl.textContent = ''; }
      });
    });
  }

  function bindMetricCheckboxes() {
    var steps = getSteps(); var step = steps[state.currentStep];
    if (!step || step.platformIndex === undefined) return;
    var idx = step.platformIndex, stage = step.stage;
    var pfx = idx + '-s' + stage;
    var pName = state.platforms[idx].name;
    var pd = ensurePlatformData(pName, stage);

    document.querySelectorAll('#sf-metrics-cb-' + pfx + ' input[data-metric]').forEach(function (cb) {
      cb.addEventListener('change', function () {
        var mid = cb.getAttribute('data-metric');
        if (cb.checked) pd.metrics[mid] = pd.metrics[mid] || { rate: '', description: '' };
        else delete pd.metrics[mid];
        savePlatformStep(idx, stage); render();
      });
    });
  }

  function togglePlatform(name, isCustom) {
    var i = state.platforms.findIndex(function (p) { return p.name === name; });
    if (i !== -1) {
      state.platforms.splice(i, 1);
      delete state.platformData[dataKey(name, 0)];
      delete state.platformData[dataKey(name, 1)];
      delete state.platformData[dataKey(name, 2)];
    } else {
      state.platforms.push({ name: name, isCustom: isCustom });
    }
    adjustCurrentStep(); render();
  }

  function addCustomPlatform() {
    var input = document.getElementById('sf-custom-platform');
    if (!input) return;
    var name = input.value.trim();
    if (!name || isPlatformSelected(name)) return;
    state.platforms.push({ name: name, isCustom: true });
    state.customPlatformInput = '';
    render();
  }

  function addCustomMetric(pfx) {
    var input = document.getElementById('sf-custom-metric-name-' + pfx);
    if (!input) return;
    var name = input.value.trim();
    if (!name) return;
    var steps = getSteps(); var step = steps[state.currentStep];
    if (step && step.platformIndex !== undefined) {
      savePlatformStep(step.platformIndex, step.stage);
      var pd = ensurePlatformData(state.platforms[step.platformIndex].name, step.stage);
      pd.customMetrics.push({ name: name, category: '', rate: '', description: '' });
      render();
    }
  }

  function adjustCurrentStep() {
    var steps = getSteps();
    if (state.currentStep >= steps.length) state.currentStep = steps.length - 1;
    if (state.currentStep < 0) state.currentStep = 0;
  }

  function scrollToForm() {
    var el = document.getElementById('sf-root');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ── Submission ID ────────────────────────────────────────────────

  function generateSubmissionId() {
    var chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    var rand = '';
    for (var i = 0; i < 8; i++) rand += chars.charAt(Math.floor(Math.random() * chars.length));
    return 'DQH-' + Date.now() + '-' + rand;
  }

  // ── CSV Building (mirrors sheet column structure) ──────────────

  var METRIC_IDS = ['classicChecks', 'videoCheck', 'typedText', 'typicalSpeed', 'recaptcha', 'pangram', 'uniqueIp'];
  var MAX_CUSTOM = 10;

  /** Build a CSV row array matching the sheet HEADERS for one entry */
  function buildCSVRow(researcher, metadata, recruitmentMethod, entry, submissionId, timestamp) {
    var row = [];
    // 0: Approved (empty)
    row.push('');
    // 1: Timestamp
    row.push(timestamp);
    // 2-5: Researcher
    row.push(researcher.email || '');
    row.push(researcher.name || '');
    row.push(researcher.affiliation || '');
    row.push(researcher.studyTitle || '');
    // 6: Recruitment method
    if (recruitmentMethod === 'two-stage') row.push('Two-stage recruitment');
    else if (recruitmentMethod === 'platform') row.push('Platform with screening criteria');
    else row.push('');
    // 7: Stage
    if (entry.stage === 1) row.push('1st stage');
    else if (entry.stage === 2) row.push('2nd stage');
    else row.push('');
    // 8-9: Platform
    var isKnown = KNOWN_PLATFORMS.indexOf(entry.platform) !== -1;
    row.push(isKnown ? entry.platform : 'Other');
    row.push(isKnown ? '' : entry.platform);
    // 10-15: Sample details
    row.push(entry.sampleSize || '');
    row.push(entry.month || '');
    row.push(entry.year || '');
    row.push(entry.country || '');
    row.push(entry.approvalScore || '');
    row.push(entry.minStudies || '');
    // 16: Selection criteria
    row.push(entry.selectionCriteria || '');
    // 17-37: Standard metrics (3 cols each: Yes/No, Rate, Desc)
    var metrics = entry.metrics || {};
    for (var mi = 0; mi < METRIC_IDS.length; mi++) {
      var mid = METRIC_IDS[mi];
      if (metrics[mid]) {
        row.push('Yes');
        row.push(metrics[mid].rate || '');
        row.push(metrics[mid].description || '');
      } else {
        row.push('No'); row.push(''); row.push('');
      }
    }
    // 38-87: Custom metrics (5 cols each: Yes/No, Name, Category, Rate, Desc) x 10
    var customs = entry.customMetrics || [];
    for (var ci = 0; ci < MAX_CUSTOM; ci++) {
      if (ci < customs.length) {
        row.push('Yes');
        row.push(customs[ci].name || '');
        row.push(customs[ci].category || '');
        row.push(customs[ci].rate || '');
        row.push(customs[ci].description || '');
      } else {
        row.push('No'); row.push(''); row.push(''); row.push(''); row.push('');
      }
    }
    // 88-89: Overall quality
    row.push(entry.overallRate || '');
    row.push(entry.overallDescription || '');
    // 90-96: Metadata
    row.push(metadata.preRegistered || '');
    row.push(metadata.preRegLink || '');
    row.push(metadata.paperLink || '');
    row.push(metadata.dataAvailability || '');
    row.push(metadata.dataLink || '');
    row.push(metadata.publicationStatus || '');
    row.push(metadata.credibilityInfo || '');
    // 97: Submission ID
    row.push(submissionId);
    return row;
  }

  var CSV_HEADERS = [
    'Approved','Timestamp','Contact Email','Researcher Name','Researcher Affiliation','Study Title',
    'Recruitment Method','Stage','Platform','If Other, please specify','Sample Size',
    'Study Start Month','Study Start Year','Country','Participant quality/approval score',
    'Minimum number of completed studies/HITs','Selection criteria for Stage 2',
    'Did you measure: Passed Classic Checks?','Passed Classic Checks — Rate (%)','Passed Classic Checks — Description',
    'Did you measure: Passed Video Check?','Passed Video Check — Rate (%)','Passed Video Check — Description',
    'Did you measure: Typed Text?','Typed Text — Rate (%)','Typed Text — Description',
    'Did you measure: Typed w/ Typical Speed?','Typed w/ Typical Speed — Rate (%)','Typed w/ Typical Speed — Description',
    'Did you measure: reCAPTCHA Score?','reCAPTCHA Score — Rate (%)','reCAPTCHA Score — Description',
    'Did you measure: Pangram AI Likelihood?','Pangram AI Likelihood — Rate (%)','Pangram AI Likelihood — Description',
    'Did you measure: Unique IP Address?','Unique IP Address — Rate (%)','Unique IP Address — Description'
  ];
  // Add custom metric headers
  (function () {
    for (var i = 1; i <= MAX_CUSTOM; i++) {
      CSV_HEADERS.push('Additional metric? (' + i + ')');
      CSV_HEADERS.push('Additional Metric ' + i + ' — Name');
      CSV_HEADERS.push('Additional Metric ' + i + ' — Category');
      CSV_HEADERS.push('Additional Metric ' + i + ' — Rate (%)');
      CSV_HEADERS.push('Additional Metric ' + i + ' — Description');
    }
    CSV_HEADERS.push('Overall data quality pass rate (%)');
    CSV_HEADERS.push('Description of overall quality measure');
    CSV_HEADERS.push('Is this study pre-registered?');
    CSV_HEADERS.push('Pre-registration link');
    CSV_HEADERS.push('Paper or study link');
    CSV_HEADERS.push('Data Availability');
    CSV_HEADERS.push('Data Repository Link');
    CSV_HEADERS.push('Publication Status');
    CSV_HEADERS.push('Additional Credibility Information');
    CSV_HEADERS.push('Submission ID');
  })();

  function csvEscape(val) {
    var s = String(val == null ? '' : val);
    if (s.indexOf(',') !== -1 || s.indexOf('"') !== -1 || s.indexOf('\n') !== -1) {
      return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  }

  function rowToCSVLine(arr) {
    return arr.map(csvEscape).join(',');
  }

  function buildFullCSV(payload, submissionId, timestamp) {
    var lines = [rowToCSVLine(CSV_HEADERS)];
    var entries = payload.entries || [];
    for (var i = 0; i < entries.length; i++) {
      var row = buildCSVRow(payload.researcher, payload.metadata, payload.recruitmentMethod, entries[i], submissionId, timestamp);
      lines.push(rowToCSVLine(row));
    }
    return lines.join('\n');
  }

  function downloadFile(content, filename, mimeType) {
    var blob = new Blob([content], { type: mimeType || 'text/csv' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ── Submit ─────────────────────────────────────────────────────

  function submitForm() {
    var statusEl = document.getElementById('sf-status');
    if (statusEl) { statusEl.className = 'sf-status sf-status-loading'; statusEl.textContent = 'Submitting\u2026'; }
    var submitBtn = document.querySelector('.sf-btn-submit');
    if (submitBtn) submitBtn.disabled = true;

    var submissionId = generateSubmissionId();
    var timestamp = new Date().toISOString();

    var payload = {
      researcher: {
        email: state.email, name: state.researcherName,
        affiliation: state.affiliation, studyTitle: state.studyTitle
      },
      metadata: {
        preRegistered: state.preRegistered, preRegLink: state.preRegLink,
        paperLink: state.paperLink, dataAvailability: state.dataAvailability,
        dataLink: state.dataLink, publicationStatus: state.publicationStatus,
        credibilityInfo: state.credibilityInfo
      },
      recruitmentMethod: state.recruitmentMethod,
      submissionId: submissionId,
      entries: []
    };

    if (state.recruitmentMethod === 'two-stage') {
      for (var i = 0; i < state.platforms.length; i++) {
        payload.entries.push(buildEntry(i, 1));
        payload.entries.push(buildEntry(i, 2));
      }
    } else {
      for (var j = 0; j < state.platforms.length; j++) {
        payload.entries.push(buildEntry(j, 0));
      }
    }

    // Build CSV before sending (so we have it regardless of response)
    var csvContent = buildFullCSV(payload, submissionId, timestamp);

    fetch(APPS_SCRIPT_URL, {
      method: 'POST', mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    .then(function () {
      // Show success with download button
      var container = document.getElementById('sf-root');
      if (container) {
        container.innerHTML = '<div class="sf-container">' +
          '<div class="sf-status sf-status-success" style="display:block;">' +
          '<strong>Thank you!</strong> Your study data has been submitted. It will appear on the dashboard after review.' +
          '<div style="margin-top:1rem;">' +
          '<p style="margin-bottom:0.75rem;color:var(--text-secondary);font-size:0.82rem;">Please download and keep this CSV file. You can use it later to update your submission via the "Edit Existing Entry" section below.</p>' +
          '<button type="button" class="sf-btn-next" id="sf-download-csv">Download Submission CSV</button>' +
          '</div></div>' +
          '<div style="margin-top:1.5rem;text-align:center;">' +
          '<button type="button" class="sf-btn-back" id="sf-new-submission">Submit Another Study</button>' +
          '</div></div>';

        document.getElementById('sf-download-csv').addEventListener('click', function () {
          downloadFile(csvContent, 'dqh-submission-' + submissionId + '.csv');
        });
        document.getElementById('sf-new-submission').addEventListener('click', function () {
          resetState(); render();
        });
      }
    })
    .catch(function (err) {
      if (statusEl) { statusEl.className = 'sf-status sf-status-error'; statusEl.textContent = 'Submission failed: ' + err.message; }
      if (submitBtn) submitBtn.disabled = false;
    });
  }

  function buildEntry(platformIndex, stage) {
    var p = state.platforms[platformIndex];
    var pd = state.platformData[dataKey(p.name, stage)] || {};
    return {
      platform: p.name, isCustom: p.isCustom || false, stage: stage,
      sampleSize: pd.sampleSize || '', month: pd.month || '', year: pd.year || '',
      country: pd.country || '', approvalScore: pd.approvalScore || '',
      minStudies: pd.minStudies || '',
      selectionCriteria: pd.selectionCriteria || '',
      metrics: pd.metrics || {}, customMetrics: pd.customMetrics || [],
      overallRate: pd.overallRate || '', overallDescription: pd.overallDescription || ''
    };
  }

  function resetState() {
    state.currentStep = 0;
    state.email = ''; state.researcherName = ''; state.affiliation = ''; state.studyTitle = '';
    state.recruitmentMethod = '';
    state.platforms = []; state.customPlatformInput = ''; state.platformData = {};
    state.preRegistered = ''; state.preRegLink = ''; state.paperLink = '';
    state.dataAvailability = ''; state.dataLink = ''; state.publicationStatus = '';
    state.credibilityInfo = '';
  }

  // ── Edit Existing Entry ────────────────────────────────────────

  function renderEditSection() {
    var html = '<div class="sf-container" style="margin-top:2rem;">';
    html += '<hr class="sf-section-divider">';
    html += '<h3 class="sf-step-title">Edit Existing Entry</h3>';
    html += '<p class="sf-step-desc">Upload the CSV you received when you first submitted. Edit the CSV file (in Excel, Google Sheets, etc.) before uploading, then click Update to replace your previous submission.</p>';
    html += '<div class="sf-field">';
    html += '<label class="sf-label" for="sf-edit-csv">Upload your submission CSV</label>';
    html += '<input class="sf-input" type="file" id="sf-edit-csv" accept=".csv">';
    html += '</div>';
    html += '<div id="sf-edit-preview" style="display:none;">';
    html += '<div class="sf-hint" id="sf-edit-info" style="margin-bottom:0.75rem;"></div>';
    html += '<button type="button" class="sf-btn-submit" id="sf-edit-update">Update Submission</button>';
    html += '</div>';
    html += '<div class="sf-status" id="sf-edit-status"></div>';
    html += '</div>';
    return html;
  }

  function bindEditEvents() {
    var fileInput = document.getElementById('sf-edit-csv');
    if (!fileInput) return;

    fileInput.addEventListener('change', function () {
      var file = fileInput.files[0];
      if (!file) return;

      var reader = new FileReader();
      reader.onload = function (e) {
        var csvText = e.target.result;
        var parsed = parseCSV(csvText);
        if (!parsed || parsed.rows.length === 0) {
          setEditStatus('error', 'Could not parse CSV or no data rows found.');
          return;
        }

        // Find submission ID from last column of first data row
        var sidIdx = parsed.headers.indexOf('Submission ID');
        if (sidIdx === -1) {
          setEditStatus('error', 'CSV does not contain a "Submission ID" column. Make sure you upload the original submission CSV.');
          return;
        }

        var submissionId = parsed.rows[0][sidIdx];
        if (!submissionId) {
          setEditStatus('error', 'Submission ID is empty in the CSV.');
          return;
        }

        var preview = document.getElementById('sf-edit-preview');
        var info = document.getElementById('sf-edit-info');
        if (preview) preview.style.display = 'block';
        if (info) info.textContent = 'Submission ID: ' + submissionId + ' \u2014 ' + parsed.rows.length + ' row(s) will be updated.';

        // Bind update button
        var updateBtn = document.getElementById('sf-edit-update');
        if (updateBtn) {
          // Clone to remove old listeners
          var newBtn = updateBtn.cloneNode(true);
          updateBtn.parentNode.replaceChild(newBtn, updateBtn);
          newBtn.addEventListener('click', function () {
            submitUpdate(submissionId, parsed.rows);
          });
        }
      };
      reader.readAsText(file);
    });
  }

  function submitUpdate(submissionId, rows) {
    setEditStatus('loading', 'Updating\u2026');
    var updateBtn = document.getElementById('sf-edit-update');
    if (updateBtn) updateBtn.disabled = true;

    var payload = {
      action: 'update',
      submissionId: submissionId,
      rows: rows
    };

    fetch(APPS_SCRIPT_URL, {
      method: 'POST', mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    .then(function () {
      setEditStatus('success', 'Submission updated! The rows have been replaced. Note: updated entries will need re-approval before appearing on the dashboard.');
    })
    .catch(function (err) {
      setEditStatus('error', 'Update failed: ' + err.message);
      if (updateBtn) updateBtn.disabled = false;
    });
  }

  function setEditStatus(type, msg) {
    var el = document.getElementById('sf-edit-status');
    if (el) { el.className = 'sf-status sf-status-' + type; el.textContent = msg; }
  }

  /** Simple CSV parser — handles quoted fields */
  function parseCSV(text) {
    // Split into lines, keeping quotes intact (only split on \n outside quotes)
    var lines = [];
    var current = '';
    var inQuotes = false;
    for (var i = 0; i < text.length; i++) {
      var ch = text[i];
      if (ch === '"') {
        inQuotes = !inQuotes;
        current += ch;
      } else if (ch === '\n' && !inQuotes) {
        lines.push(current); current = '';
      } else if (ch === '\r' && !inQuotes) {
        // skip \r
      } else {
        current += ch;
      }
    }
    if (current) lines.push(current);

    if (lines.length < 2) return null;

    // Split a single CSV line into fields, stripping quotes here
    function splitLine(line) {
      var fields = []; var field = ''; var q = false;
      for (var j = 0; j < line.length; j++) {
        var c = line[j];
        if (c === '"') { if (q && line[j + 1] === '"') { field += '"'; j++; } else q = !q; }
        else if (c === ',' && !q) { fields.push(field); field = ''; }
        else field += c;
      }
      fields.push(field);
      return fields;
    }

    var headers = splitLine(lines[0]);
    var rows = [];
    for (var r = 1; r < lines.length; r++) {
      var trimmed = lines[r].trim();
      if (!trimmed) continue;
      rows.push(splitLine(lines[r]));
    }
    return { headers: headers, rows: rows };
  }

  // ── Init ───────────────────────────────────────────────────────

  function render() {
    var container = document.getElementById('sf-root');
    if (!container) return;

    var steps = getSteps();
    var html = renderProgress(steps);

    for (var i = 0; i < steps.length; i++) {
      var active = i === state.currentStep ? ' active' : '';
      html += '<div class="sf-step' + active + '" data-step="' + i + '">';

      var s = steps[i];
      if (s.id === 'researcher')       html += renderResearcherStep();
      else if (s.id === 'recruitment') html += renderRecruitmentStep();
      else if (s.id === 'platforms')   html += renderPlatformsStep();
      else if (s.id === 'metadata')    html += renderMetadataStep();
      else if (s.platformIndex !== undefined) html += renderPlatformDetailStep(s.platformIndex, s.stage);

      html += renderNav(i, steps.length);
      html += '</div>';
    }

    html += '<div class="sf-status" id="sf-status"></div>';

    // Edit existing entry section
    html += renderEditSection();

    container.innerHTML = '<div class="sf-container">' + html + '</div>';
    bindEvents();
    bindEditEvents();
  }

  function showForm() {
    var landing = document.getElementById('sf-landing');
    var wrapper = document.getElementById('sf-form-wrapper');
    if (landing) landing.style.display = 'none';
    if (wrapper) wrapper.style.display = '';
    render();
  }

  function showLanding() {
    var landing = document.getElementById('sf-landing');
    var wrapper = document.getElementById('sf-form-wrapper');
    if (wrapper) wrapper.style.display = 'none';
    if (landing) landing.style.display = '';
  }

  function init() {
    var openNewBtn = document.getElementById('sf-open-new');
    var openEditBtn = document.getElementById('sf-open-edit');
    var backBtn = document.getElementById('sf-back-to-landing');

    if (openNewBtn) openNewBtn.addEventListener('click', function() { showForm(); });
    if (openEditBtn) openEditBtn.addEventListener('click', function() { showForm(); });
    if (backBtn) backBtn.addEventListener('click', function() { showLanding(); });
  }

  return { init: init };
})();
