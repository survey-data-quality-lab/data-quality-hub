/**
 * Data Quality Hub — App Orchestrator
 */
window.DQH = window.DQH || {};

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
  initAboutToggle();
  initMoreToggle();
  initFilterToggles();
  initFilterEvents();
  bindChange('metric-select', renderMetricCharts);
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
  var select = document.getElementById('metric-select');
  if (!select) return;

  if (select.options.length === 0) {
    var allOptions = window.DQH.config.metricOptions;
    var available = window.DQH.dataStore.getAvailableMetrics();
    for (var i = 0; i < allOptions.length; i++) {
      var opt = document.createElement('option');
      opt.value = allOptions[i].field;
      opt.textContent = allOptions[i].label;
      var hasData = available.some(function(a) { return a.field === allOptions[i].field; });
      if (!hasData) {
        opt.disabled = true;
        opt.textContent += ' (no data)';
      }
      select.appendChild(opt);
    }
    select.value = 'aiDetectionRate';
    if (select.selectedIndex === -1 || select.options[select.selectedIndex].disabled) {
      for (var j = 0; j < select.options.length; j++) {
        if (!select.options[j].disabled) { select.selectedIndex = j; break; }
      }
    }
  }

  renderMetricCharts();
}

function renderMetricCharts() {
  var select = document.getElementById('metric-select');
  if (!select) return;
  var field = select.value;
  var filter = getFilterState('metric');

  window.DQH.charts.renderTrendChart('chart-metric-trend', field, filter.stage, filter.platforms);
  renderDefinitionsPanel();
}

// --- Theme toggle ---
function initThemeToggle() {
  // Restore saved preference
  var saved = localStorage.getItem('dqh-theme');
  if (saved === 'light') {
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
    var moreBody = document.getElementById('more-body');
    if (moreBody && moreBody.classList.contains('expanded')) {
      renderMetricCharts();
    }
  });
}

// --- About "Read more" toggle ---
function initAboutToggle() {
  var btn = document.getElementById('about-more-btn');
  if (!btn) return;
  btn.addEventListener('click', function() {
    var expanded = document.getElementById('about-expanded');
    if (!expanded) return;
    if (expanded.classList.contains('collapsed')) {
      expanded.classList.remove('collapsed');
      expanded.classList.add('expanded');
      btn.textContent = 'Show less';
    } else {
      expanded.classList.remove('expanded');
      expanded.classList.add('collapsed');
      btn.textContent = 'Read more';
    }
  });
}

// --- "More" toggle ---
function initMoreToggle() {
  bindToggleBtn('more-toggle', 'more-body', function() {
    // Resize charts after expand
    setTimeout(function() {
      window.dispatchEvent(new Event('resize'));
    }, 450);
  });
}

// --- Filter panel toggles ---
function initFilterToggles() {
  bindToggleBtn('trend-filter-toggle', 'trend-filter-body');
  bindToggleBtn('metric-filter-toggle', 'metric-filter-body');
  bindToggleBtn('chart-info-btn', 'chart-info-popup');
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

  var select = document.getElementById('metric-select');
  if (!select) return;
  var field = select.value;

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

// --- Helpers ---
function setText(id, val) {
  var el = document.getElementById(id);
  if (el) el.textContent = val;
}

function bindChange(id, fn) {
  var el = document.getElementById(id);
  if (el) el.addEventListener('change', fn);
}

function esc(str) {
  var div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
