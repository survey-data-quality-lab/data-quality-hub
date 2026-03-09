/**
 * Data Quality Hub — App Orchestrator
 */
window.DQH = window.DQH || {};

// Selected metric state for 2-level selector
var _selectedConcernId = null;
var _selectedMetricField = null;

document.addEventListener('DOMContentLoaded', async function() {
  var loading = document.getElementById('loading');
  var dashboard = document.getElementById('dashboard');

  try {
    var csvData = await window.DQH.csvParser.fetchAndParse();
    window.DQH.dataStore.init(csvData);
    renderStats();
    populateFilterPanels();
    renderTrendChart();
    renderMetricSection();
    window.DQH.table.render();
  } catch (err) {
    console.error('Dashboard init error:', err);
    window.DQH.dataStore.init([]);
    renderStats();
  }

  if (loading) loading.style.display = 'none';
  if (dashboard) dashboard.style.display = 'block';

  initThemeToggle();
  initFilterToggles();
  initFilterEvents();
  initDownloadCSV();
});

// --- Stats (inline in header) ---
function renderStats() {
  var stats = window.DQH.dataStore.getSummaryStats();
  setText('stat-platforms', stats.platforms);
  setText('stat-studies', stats.studies);
  setText('stat-participants', stats.totalParticipants.toLocaleString());
}

// --- Filter state ---
function getFilterState(prefix) {
  var radios = document.querySelectorAll('input[name="' + prefix + '-stage"]');
  var stage = '1st';
  for (var i = 0; i < radios.length; i++) {
    if (radios[i].checked) { stage = radios[i].value; break; }
  }

  var container = document.getElementById(prefix + '-platform-checks');
  var checks = container ? container.querySelectorAll('input[type="checkbox"]') : [];
  if (checks.length === 0) return { stage: stage, platforms: null };

  var allChecked = true;
  var platforms = [];
  for (var j = 0; j < checks.length; j++) {
    if (checks[j].checked) {
      platforms.push(checks[j].value);
    } else {
      allChecked = false;
    }
  }

  return { stage: stage, platforms: allChecked ? null : platforms };
}

// --- Populate platform checkboxes ---
function populateFilterPanels() {
  var platforms = [];
  var seen = {};
  var studies = window.DQH.dataStore.studies;
  for (var i = 0; i < studies.length; i++) {
    var p = studies[i].platform;
    if (!seen[p]) { seen[p] = true; platforms.push(p); }
  }
  platforms.sort();

  populateCheckboxes('trend-platform-checks', platforms);
  populateCheckboxes('metric-platform-checks', platforms);
}

function populateCheckboxes(containerId, platforms) {
  var container = document.getElementById(containerId);
  if (!container) return;
  var html = '';
  for (var i = 0; i < platforms.length; i++) {
    var p = platforms[i];
    var color = window.DQH.dataStore.getColor(p);
    html += '<label class="filter-checkbox">';
    html += '<input type="checkbox" value="' + esc(p) + '" checked>';
    html += '<span style="color:' + color + '">' + esc(p) + '</span>';
    html += '</label>';
  }
  container.innerHTML = html;
}

// --- Trend chart ---
function renderTrendChart() {
  var filter = getFilterState('trend');
  window.DQH.charts.renderTrendChart('chart-trend', 'overallPassRate', filter.stage, filter.platforms);
}

// --- Metric section ---
function renderMetricSection() {
  var concerns = window.DQH.config.metricConcerns;
  if (!concerns || !concerns.length) return;

  // Default to first concern and its first metric
  if (!_selectedConcernId) {
    _selectedConcernId = concerns[0].id;
    _selectedMetricField = concerns[0].metrics[0].field;
  }

  renderConcernSelector();
  renderMetricSelector();
  renderMetricCharts();
}

function renderConcernSelector() {
  var container = document.getElementById('metric-selector-l1');
  if (!container) return;
  var concerns = window.DQH.config.metricConcerns;
  var icons = {
    'inattention': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',
    'ai': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M12 2v3m-3 0h6"/><circle cx="9" cy="16" r="1" fill="currentColor"/><circle cx="15" cy="16" r="1" fill="currentColor"/></svg>',
    'fraud': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>'
  };
  var html = '';
  for (var i = 0; i < concerns.length; i++) {
    var c = concerns[i];
    var active = (c.id === _selectedConcernId) ? ' active' : '';
    var icon = icons[c.id] || '';
    html += '<button class="concern-btn' + active + '" data-concern="' + esc(c.id) + '" type="button">' + icon + esc(c.label) + '</button>';
  }
  container.innerHTML = html;

  var btns = container.querySelectorAll('.concern-btn');
  for (var j = 0; j < btns.length; j++) {
    btns[j].addEventListener('click', function() {
      _selectedConcernId = this.getAttribute('data-concern');
      var concerns = window.DQH.config.metricConcerns;
      for (var k = 0; k < concerns.length; k++) {
        if (concerns[k].id === _selectedConcernId) {
          _selectedMetricField = concerns[k].metrics[0].field;
          break;
        }
      }
      renderConcernSelector();
      renderMetricSelector();
      renderMetricCharts();
    });
  }
}

function renderMetricSelector() {
  var container = document.getElementById('metric-selector-l2');
  if (!container) return;
  var concerns = window.DQH.config.metricConcerns;
  var concern = null;
  for (var i = 0; i < concerns.length; i++) {
    if (concerns[i].id === _selectedConcernId) { concern = concerns[i]; break; }
  }
  if (!concern) return;

  var available = window.DQH.dataStore.getAvailableMetrics();
  var html = '';
  for (var j = 0; j < concern.metrics.length; j++) {
    var m = concern.metrics[j];
    var active = (m.field === _selectedMetricField) ? ' active' : '';
    var hasData = available.some(function(a) { return a.field === m.field; });
    var label = hasData ? esc(m.label) : esc(m.label) + ' <span class="metric-no-data">(no data)</span>';
    html += '<button class="metric-btn' + active + '" data-field="' + esc(m.field) + '" type="button"' + (hasData ? '' : ' disabled') + '>' + label + '</button>';
  }
  container.innerHTML = html;

  var btns = container.querySelectorAll('.metric-btn:not([disabled])');
  for (var k = 0; k < btns.length; k++) {
    btns[k].addEventListener('click', function() {
      _selectedMetricField = this.getAttribute('data-field');
      renderMetricSelector();
      renderMetricCharts();
    });
  }
}

function renderMetricCharts() {
  if (!_selectedMetricField) return;
  var filter = getFilterState('metric');
  window.DQH.charts.renderMetricWithOverall('chart-metric-trend', _selectedMetricField, filter.stage, filter.platforms);
  renderDefinitionsPanel();
}

// --- Theme toggle ---
function initThemeToggle() {
  // Restore saved preference (light is default)
  var saved = localStorage.getItem('dqh-theme');
  if (saved !== 'dark') {
    document.documentElement.setAttribute('data-theme', 'light');
  }

  var btn = document.getElementById('theme-toggle');
  if (!btn) return;
  btn.addEventListener('click', function() {
    var isLight = document.documentElement.getAttribute('data-theme') === 'light';
    if (isLight) {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('dqh-theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('dqh-theme', 'light');
    }
    // Re-render charts with new theme colors
    renderTrendChart();
    if (_selectedMetricField) renderMetricCharts();
  });
}

// --- Filter panel toggles ---
function initFilterToggles() {
  bindToggleBtn('trend-filter-toggle', 'trend-filter-body');
  bindToggleBtn('metric-filter-toggle', 'metric-filter-body');
  bindToggleBtn('chart-info-btn', 'chart-info-popup');
  bindToggleBtn('submit-info-btn', 'submit-info-popup');
  bindToggleBtn('trend-info-btn', 'trend-info-popup');
  bindToggleBtn('metric-info-btn', 'metric-info-popup');
  bindToggleBtn('definitions-toggle', 'definitions-body');
}

function bindToggleBtn(btnId, bodyId, onExpand) {
  var btn = document.getElementById(btnId);
  var body = document.getElementById(bodyId);
  if (!btn || !body) return;
  btn.addEventListener('click', function() {
    if (body.classList.contains('expanded')) {
      body.classList.remove('expanded');
      body.classList.add('collapsed');
      btn.classList.remove('expanded');
    } else {
      body.classList.remove('collapsed');
      body.classList.add('expanded');
      btn.classList.add('expanded');
      if (onExpand) onExpand();
    }
  });
}

// --- Filter change events ---
function initFilterEvents() {
  bindRadioGroup('trend-stage', renderTrendChart);
  bindCheckboxGroup('trend-platform-checks', renderTrendChart);
  bindRadioGroup('metric-stage', renderMetricCharts);
  bindCheckboxGroup('metric-platform-checks', renderMetricCharts);
}

function bindRadioGroup(name, fn) {
  var radios = document.querySelectorAll('input[name="' + name + '"]');
  for (var i = 0; i < radios.length; i++) {
    radios[i].addEventListener('change', fn);
  }
}

function bindCheckboxGroup(containerId, fn) {
  var container = document.getElementById(containerId);
  if (!container) return;
  var checks = container.querySelectorAll('input[type="checkbox"]');
  for (var i = 0; i < checks.length; i++) {
    checks[i].addEventListener('change', fn);
  }
}

// --- Definitions panel ---
function renderDefinitionsPanel() {
  var list = document.getElementById('definitions-list');
  if (!list) return;

  var field = _selectedMetricField;
  if (!field) return;

  var definitions = window.DQH.dataStore.getMetricDefinitions(field);

  if (!definitions.length) {
    list.innerHTML = '<p class="definitions-empty">No definitions available for this metric.</p>';
    return;
  }

  var html = '';
  for (var i = 0; i < definitions.length; i++) {
    var d = definitions[i];
    html += '<div class="definition-item">';
    html += '<div class="definition-header">';
    html += '<span class="definition-paper" data-platform="' + esc(d.platform) + '" data-date="' + esc(d.studyDate) + '">' + esc(d.paperReference || d.researcher) + '</span>';
    html += '<span class="definition-meta">' + esc(d.platform) + (d.studyDate ? ' \u00B7 ' + esc(d.studyDate) : '') + '</span>';
    html += '</div>';
    html += '<p class="definition-text">' + esc(d.description) + '</p>';
    html += '</div>';
  }
  list.innerHTML = html;

  var papers = list.querySelectorAll('.definition-paper');
  for (var j = 0; j < papers.length; j++) {
    papers[j].addEventListener('click', function() {
      var platform = this.getAttribute('data-platform');
      var studyDate = this.getAttribute('data-date');
      highlightDataPoint('chart-metric-trend', platform, studyDate);
    });
  }
}

// --- Highlight data point on chart ---
function highlightDataPoint(canvasId, platform, studyDate) {
  var chart = window.DQH.charts.instances[canvasId];
  if (!chart) return;

  var targetDate = window.DQH.dataStore.parseDate(studyDate);
  if (!targetDate) return;
  var targetTime = targetDate.getTime();

  var activeElements = [];

  for (var di = 0; di < chart.data.datasets.length; di++) {
    var ds = chart.data.datasets[di];
    if (!ds.label) continue;
    if (ds.label.indexOf(platform) === -1) continue;
    if (ds._isDashed) continue;

    for (var pi = 0; pi < ds.data.length; pi++) {
      var point = ds.data[pi];
      if (Math.abs(point.x - targetTime) < 86400000) {
        activeElements.push({ datasetIndex: di, index: pi });
      }
    }
  }

  if (activeElements.length > 0) {
    chart.setActiveElements(activeElements);
    var meta = chart.getDatasetMeta(activeElements[0].datasetIndex);
    var element = meta.data[activeElements[0].index];
    chart.tooltip.setActiveElements(activeElements, { x: element.x, y: element.y });
    chart.update();
  }
}

// --- CSV Download ---
function initDownloadCSV() {
  var btn = document.getElementById('download-csv');
  if (!btn) return;
  btn.addEventListener('click', function() {
    var studies = window.DQH.dataStore.studies;
    if (!studies.length) return;

    var cols = [
      { key: 'paperReference', label: 'Study Title' },
      { key: 'researcherName', label: 'Researcher' },
      { key: 'affiliation', label: 'Affiliation' },
      { key: 'platform', label: 'Platform' },
      { key: 'sampleSize', label: 'Sample Size' },
      { key: 'studyDate', label: 'Study Date' },
      { key: 'recruitmentMethod', label: 'Recruitment Method' },
      { key: 'stage', label: 'Stage' },
      { key: 'overallPassRate', label: 'Overall Pass Rate (%)' },
      { key: 'qualityDescription', label: 'Quality Measure Description' },
      { key: 'attentionCheckRate', label: 'Attention Check Rate (%)' },
      { key: 'attentionCheckDescription', label: 'Attention Check Description' },
      { key: 'aiDetectionRate', label: 'AI Detection Rate (%)' },
      { key: 'aiDetectionDescription', label: 'AI Detection Description' },
      { key: 'accountFraudRate', label: 'Account Fraud Rate (%)' },
      { key: 'accountFraudDescription', label: 'Account Fraud Description' },
      { key: 'otherMetric1Name', label: 'Other Metric 1 Name' },
      { key: 'otherMetric1Rate', label: 'Other Metric 1 Rate (%)' },
      { key: 'otherMetric1Description', label: 'Other Metric 1 Description' },
      { key: 'otherMetric2Name', label: 'Other Metric 2 Name' },
      { key: 'otherMetric2Rate', label: 'Other Metric 2 Rate (%)' },
      { key: 'otherMetric2Description', label: 'Other Metric 2 Description' },
      { key: 'studyDescription', label: 'Study Description' },
      { key: 'studyLink', label: 'Study Link' },
      { key: 'additionalNotes', label: 'Notes' }
    ];

    var csvVal = function(v) {
      if (v === null || v === undefined) return '';
      var s = String(v);
      if (s.indexOf(',') !== -1 || s.indexOf('"') !== -1 || s.indexOf('\n') !== -1) {
        return '"' + s.replace(/"/g, '""') + '"';
      }
      return s;
    };

    var rows = [cols.map(function(c) { return c.label; }).join(',')];
    for (var i = 0; i < studies.length; i++) {
      var s = studies[i];
      rows.push(cols.map(function(c) { return csvVal(s[c.key]); }).join(','));
    }

    var blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'data-quality-hub.csv';
    a.click();
    URL.revokeObjectURL(url);
  });
}

// --- Helpers ---
function setText(id, val) {
  var el = document.getElementById(id);
  if (el) el.textContent = val;
}

function esc(str) {
  var div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
