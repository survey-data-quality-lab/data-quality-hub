/**
 * Data Quality Hub — Charts
 * Chart.js 4.x rendering functions.
 */
window.DQH = window.DQH || {};

// Theme-aware Chart.js defaults
function isLightTheme() {
  return document.documentElement.getAttribute('data-theme') === 'light';
}

function applyChartTheme() {
  var light = isLightTheme();
  Chart.defaults.color = light ? '#4A5068' : '#9BA1B5';
  Chart.defaults.borderColor = light ? '#D8DAE5' : '#2E3348';
  Chart.defaults.plugins.tooltip.backgroundColor = light ? '#FFFFFF' : '#242836';
  Chart.defaults.plugins.tooltip.titleColor = light ? '#1A1D27' : '#E8EAF0';
  Chart.defaults.plugins.tooltip.bodyColor = light ? '#4A5068' : '#9BA1B5';
  Chart.defaults.plugins.tooltip.borderColor = light ? '#D8DAE5' : '#2E3348';
  Chart.defaults.plugins.tooltip.borderWidth = 1;
}

function chartGridColor() {
  return isLightTheme() ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.06)';
}

function chartHoleFill() {
  return isLightTheme() ? '#FFFFFF' : '#1A1D27';
}

function isMobile() {
  return window.innerWidth < 600;
}

/**
 * Wrap text into lines of at most maxLen characters (word-boundary split).
 * Returns an array of strings.
 */
function wrapText(text, maxLen) {
  if (!text) return [];
  if (text.length <= maxLen) return [text];
  var words = text.split(' ');
  var lines = [];
  var current = '';
  for (var i = 0; i < words.length; i++) {
    var word = words[i];
    if (!current) {
      current = word;
    } else if (current.length + 1 + word.length <= maxLen) {
      current += ' ' + word;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/**
 * Format a researcher name + year into a short citation.
 * If more than 2 authors (split by comma/&), abbreviates to "LastName et al. (year)".
 */
function formatCitation(researcher, timestamp) {
  if (!researcher) return '';
  var year = timestamp ? new Date(timestamp).getFullYear() : '';
  // Normalize & as delimiter, then split
  var normalized = researcher.replace(/\s*&\s*/g, ', ').replace(/\s*;\s*/g, ', ');
  var authors = normalized.split(',').map(function(s) { return s.trim(); }).filter(Boolean);
  var nameStr;
  if (authors.length > 2) {
    // Use last word of first author's name as their surname
    var first = authors[0];
    var parts = first.trim().split(/\s+/);
    nameStr = parts[parts.length - 1] + ' et al.';
  } else {
    nameStr = researcher;
  }
  return year ? nameStr + ' (' + year + ')' : nameStr;
}

applyChartTheme();

function escHtml(str) {
  var div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

// Canonical platform order for the legend
var LEGEND_PLATFORM_ORDER = ['Lab', 'MTurk', 'Moblab', 'Bilendi', 'Prolific'];

window.DQH.charts = {
  instances: {},

  destroy(id) {
    if (this.instances[id]) {
      this.instances[id].destroy();
      delete this.instances[id];
    }
    // Remove custom legend — use closest so it works for deeply-nested canvases too
    var canvas = document.getElementById(id);
    if (canvas) {
      var card = canvas.closest('.chart-card') || canvas.parentElement.parentElement;
      var old = card.querySelector('.chart-custom-legend');
      if (old) old.parentNode.removeChild(old);
    }
    // Hide external tooltips on chart change
    if (this._meansTooltipEl) {
      clearTimeout(this._meansTooltipHideTimer);
      this._meansTooltipEl.style.display = 'none';
    }
    if (this._trendTooltipEl) {
      clearTimeout(this._trendTooltipHideTimer);
      this._trendTooltipEl.style.display = 'none';
    }
  },

  /** Build x-scale options, mobile-aware */
  _xScale(dateRange) {
    var mobile = isMobile();
    var opts = {
      type: 'time',
      time: {
        unit: 'month',
        displayFormats: { month: mobile ? 'MMM yy' : 'MMM yyyy' }
      },
      title: { display: !mobile, text: 'Study Date', font: { size: mobile ? 11 : 13 } },
      ticks: { maxRotation: mobile ? 45 : 0, font: { size: mobile ? 10 : 12 } },
      grid: { color: chartGridColor() }
    };
    if (dateRange) {
      opts.min = dateRange.min;
      opts.max = dateRange.max;
    }
    return opts;
  },

  /** Build y-scale options — extends to 110 but only shows ticks up to 100 */
  _yScale() {
    var mobile = isMobile();
    return {
      min: 0, max: 110,
      ticks: {
        stepSize: 20,
        callback: function(v) { return v <= 100 ? v : ''; },
        font: { size: mobile ? 10 : 12 }
      },
      title: { display: !mobile, text: 'Pass Rate (%)', font: { size: mobile ? 11 : 13 } },
      grid: { color: chartGridColor() }
    };
  },

  /** Common layout options — built-in legend disabled; custom legend rendered separately */
  _layout() {
    var self = this;
    var mobile = isMobile();
    return {
      responsive: true,
      maintainAspectRatio: false,
      layout: { padding: { top: mobile ? 4 : 8 } },
      onClick: function(event, elements) {
        if (!elements || !elements.length) return;
        var el = elements[0];
        var ds = event.chart.data.datasets[el.datasetIndex];
        var point = ds && ds.data[el.index];
        if (point && point._meta && point._meta.paperReference) {
          self._navigateToStudy(point._meta.paperReference);
        }
      },
      onHover: function(event, elements) {
        if (event.native) {
          event.native.target.style.cursor = elements.length ? 'pointer' : 'default';
        }
      },
      plugins: {
        legend: { display: false }
      }
    };
  },

  /** Navigate to and expand a study row in the studies tree */
  _navigateToStudy(paperRef) {
    if (!paperRef) return;
    var tree = document.getElementById('studies-tree');
    if (!tree) return;
    var rows = tree.querySelectorAll('.study-l1[data-paper-ref]');
    for (var i = 0; i < rows.length; i++) {
      if (rows[i].getAttribute('data-paper-ref') === paperRef) {
        var row = rows[i];
        var idx = row.getAttribute('data-index');
        // Expand if collapsed
        var children = tree.querySelector('.l1-children[data-parent="' + idx + '"]');
        if (children && !children.classList.contains('expanded')) {
          children.classList.add('expanded');
          row.classList.add('expanded');
        }
        // Scroll into view
        row.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Highlight pulse
        row.classList.remove('highlight-pulse');
        // Force reflow so re-adding the class restarts the animation
        void row.offsetWidth;
        row.classList.add('highlight-pulse');
        return;
      }
    }
  },

  /**
   * Render a custom two-section HTML legend below the chart canvas.
   * Section 1 — Platform: colored filled circles, ordered by LEGEND_PLATFORM_ORDER.
   * Section 2 — Recruitment: neutral shapes (circle = Standard, triangle = 2-Stage).
   * Section 3 — Reference (optional): dashed line for overall pass rate context.
   *
   * Expects datasets to carry:
   *   _platformName {string}  — canonical platform name
   *   _is2Stage     {boolean} — true for 2nd-stage points (triangle)
   *   _isDashed     {boolean} — true for screening connector lines (hidden)
   *   _isOverall    {boolean} — true for overall-pass-rate reference lines
   */
  _renderCustomLegend(canvasId, datasets, isMeansChart) {
    var canvas = document.getElementById(canvasId);
    if (!canvas) return;
    var card = canvas.closest('.chart-card') || canvas.parentElement.parentElement;

    // Remove any stale legend (it lives as a sibling of .chart-wrap)
    var old = card.querySelector('.chart-custom-legend');
    if (old) old.parentNode.removeChild(old);

    var light = isLightTheme();
    var markerColor = light ? '#4A5068' : '#9BA1B5';

    // Collect unique platforms in canonical order
    var platformMap = {};
    var hasStandard = false;
    var has2Stage   = false;
    var hasOverall  = false;

    for (var i = 0; i < datasets.length; i++) {
      var ds = datasets[i];
      if (ds._isDashed) continue;
      if (ds._isOverall) { hasOverall = true; continue; }
      if (ds._platformName && !platformMap[ds._platformName]) {
        platformMap[ds._platformName] = ds.borderColor;
      }
      if (!ds._skipRecruit) {
        if (ds._is2Stage) has2Stage = true;
        else hasStandard = true;
      }
    }

    // Build ordered platform list
    var platforms = [];
    for (var k = 0; k < LEGEND_PLATFORM_ORDER.length; k++) {
      var pn = LEGEND_PLATFORM_ORDER[k];
      if (platformMap[pn]) platforms.push({ name: pn, color: platformMap[pn] });
    }
    var orderedNames = platforms.map(function(p) { return p.name; });
    Object.keys(platformMap).forEach(function(p) {
      if (orderedNames.indexOf(p) === -1) platforms.push({ name: p, color: platformMap[p] });
    });

    if (!platforms.length && !hasOverall && !hasStandard && !has2Stage) return;

    var el = document.createElement('div');
    el.className = 'chart-custom-legend';

    // — Platform section —
    if (platforms.length) {
      var pSec = document.createElement('div');
      pSec.className = 'legend-section';
      var pLabel = document.createElement('span');
      pLabel.className = 'legend-section-label';
      pLabel.textContent = 'Platform';
      pSec.appendChild(pLabel);

      for (var pi = 0; pi < platforms.length; pi++) {
        var item = document.createElement('span');
        item.className = 'legend-item';
        item.innerHTML =
          '<svg width="12" height="12" viewBox="0 0 10 10" aria-hidden="true">' +
          '<circle cx="5" cy="5" r="4.5" fill="' + platforms[pi].color + '"/></svg>' +
          '<span class="legend-item-text">' + platforms[pi].name + '</span>';
        pSec.appendChild(item);
      }
      el.appendChild(pSec);
    }

    // — Recruitment section —
    if (hasStandard || has2Stage) {
      var sSec = document.createElement('div');
      sSec.className = 'legend-section';
      var sLabel = document.createElement('span');
      sLabel.className = 'legend-section-label';
      sLabel.textContent = 'Recruitment';
      sSec.appendChild(sLabel);

      if (hasStandard) {
        var stdItem = document.createElement('span');
        stdItem.className = 'legend-item';
        if (isMeansChart) {
          stdItem.innerHTML =
            '<span style="display:inline-block;width:14px;height:10px;background:' + markerColor + 'CC;border:1px solid ' + markerColor + ';border-radius:2px;vertical-align:middle;" aria-hidden="true"></span>' +
            '<span class="legend-item-text">Standard</span>';
        } else {
          stdItem.innerHTML =
            '<svg width="12" height="12" viewBox="0 0 10 10" aria-hidden="true">' +
            '<circle cx="5" cy="5" r="4.5" fill="' + markerColor + '"/></svg>' +
            '<span class="legend-item-text">Standard</span>';
        }
        sSec.appendChild(stdItem);
      }

      if (has2Stage) {
        var tsItem = document.createElement('span');
        tsItem.className = 'legend-item';
        if (isMeansChart) {
          tsItem.innerHTML =
            '<span style="display:inline-block;width:14px;height:10px;background:repeating-linear-gradient(45deg,' + markerColor + 'CC,' + markerColor + 'CC 3px,rgba(255,255,255,0.45) 3px,rgba(255,255,255,0.45) 6px);border:1px solid ' + markerColor + ';border-radius:2px;vertical-align:middle;" aria-hidden="true"></span>' +
            '<span class="legend-item-text">2-Stage</span>';
        } else {
          tsItem.innerHTML =
            '<svg width="12" height="13" viewBox="0 0 10 11" aria-hidden="true">' +
            '<polygon points="5,1 9.5,10.5 0.5,10.5" fill="none" stroke="' + markerColor + '" stroke-width="1.5"/></svg>' +
            '<span class="legend-item-text">2-Stage</span>';
        }
        sSec.appendChild(tsItem);
      }
      el.appendChild(sSec);
    }

    // — Reference section (overall pass rate) —
    if (hasOverall) {
      var rSec = document.createElement('div');
      rSec.className = 'legend-section';
      var rLabel = document.createElement('span');
      rLabel.className = 'legend-section-label';
      rLabel.textContent = 'Reference';
      rSec.appendChild(rLabel);

      var refItem = document.createElement('span');
      refItem.className = 'legend-item';
      refItem.innerHTML =
        '<svg width="16" height="4" viewBox="0 0 16 4" aria-hidden="true">' +
        '<line x1="0" y1="2" x2="16" y2="2" stroke="' + markerColor + '" stroke-width="1.5" stroke-dasharray="4,3"/></svg>' +
        '<span class="legend-item-text legend-item-italic">Overall Pass Rate</span>';
      rSec.appendChild(refItem);
      el.appendChild(rSec);
    }

    card.appendChild(el);
  },

  /**
   * Trend line chart: rate over time, one line per platform.
   */
  renderTrendChart(canvasId, field, stageFilter, platforms) {
    this.destroy(canvasId);
    applyChartTheme();
    if (stageFilter === 'both') {
      return this.renderBothStagesTrend(canvasId, field, platforms);
    }
    var store = window.DQH.dataStore;
    var trendData = store.getTrendData(field, stageFilter || '1st', platforms);
    if (!trendData.length) return this.showEmpty(canvasId);

    this.clearEmpty(canvasId);
    var dateRange = store.getDateRange(field, stageFilter || '1st', platforms);
    var mobile = isMobile();
    var is2nd = (stageFilter === '2nd');

    var datasets = trendData.map(function(d) {
      return {
        label: d.platform,
        _platformName: d.platform,
        _is2Stage: is2nd,
        _isDashed: false,
        _isOverall: false,
        data: d.points.map(function(p) {
          return { x: p.date.getTime(), y: p.rate, _meta: p };
        }),
        borderColor: d.color,
        backgroundColor: is2nd ? chartHoleFill() : d.color,
        pointBackgroundColor: is2nd ? chartHoleFill() : d.color,
        pointBorderColor: d.color,
        pointBorderWidth: is2nd ? 2 : 1,
        pointRadius: mobile ? 5 : 6,
        pointHoverRadius: mobile ? 7 : 9,
        pointStyle: is2nd ? 'triangle' : 'circle',
        borderWidth: 2,
        fill: false,
        tension: 0,
        showLine: true
      };
    });

    var opts = this._layout();
    opts.scales = { x: this._xScale(dateRange), y: this._yScale() };
    opts.plugins.tooltip = this._getTrendTooltipConfig(store);

    var ctx = document.getElementById(canvasId).getContext('2d');
    this.instances[canvasId] = new Chart(ctx, {
      type: 'scatter',
      data: { datasets: datasets },
      options: opts
    });
    this._renderCustomLegend(canvasId, datasets);
  },

  /**
   * Both-stages trend: solid lines per platform+stage, dashed connectors within studies.
   */
  renderBothStagesTrend(canvasId, field, platforms) {
    applyChartTheme();
    var store = window.DQH.dataStore;
    var bothData = store.getBothStagesTrendData(field, platforms);

    if (!bothData.solid.length) return this.showEmpty(canvasId);
    this.clearEmpty(canvasId);

    var dateRange = store.getDateRange(field, 'both', platforms);
    var datasets = [];
    var holeFill = chartHoleFill();
    var mobile = isMobile();

    for (var i = 0; i < bothData.solid.length; i++) {
      var d = bothData.solid[i];
      var is2nd = d.stage === '2nd';

      datasets.push({
        label: is2nd ? d.platform + ' (2-Stage)' : d.platform,
        _platformName: d.platform,
        _is2Stage: is2nd,
        _isDashed: false,
        _isOverall: false,
        data: d.points.map(function(p) {
          return { x: p.date.getTime(), y: p.rate, _meta: p };
        }),
        borderColor: d.color,
        backgroundColor: is2nd ? holeFill : d.color,
        pointBackgroundColor: is2nd ? holeFill : d.color,
        pointBorderColor: d.color,
        pointBorderWidth: is2nd ? 2 : 1,
        pointRadius: mobile ? 5 : 6,
        pointHoverRadius: mobile ? 7 : 9,
        pointStyle: is2nd ? 'triangle' : 'circle',
        borderWidth: 2,
        fill: false,
        tension: 0,
        showLine: true
      });
    }

    for (var j = 0; j < bothData.dashed.length; j++) {
      var c = bothData.dashed[j];
      datasets.push({
        label: c.platform + ' screening',
        _platformName: c.platform,
        _is2Stage: false,
        _isDashed: true,
        _isOverall: false,
        data: c.points.map(function(p) {
          return { x: p.date.getTime(), y: p.rate, _meta: p };
        }),
        borderColor: c.color + '80',
        backgroundColor: 'transparent',
        pointRadius: 0,
        pointHoverRadius: 0,
        borderWidth: 1.5,
        borderDash: [6, 4],
        fill: false,
        tension: 0,
        showLine: true
      });
    }

    var opts = this._layout();
    opts.plugins.tooltip = this._getTrendTooltipConfig(store);
    opts.scales = { x: this._xScale(dateRange), y: this._yScale() };

    var ctx = document.getElementById(canvasId).getContext('2d');
    this.instances[canvasId] = new Chart(ctx, {
      type: 'scatter',
      data: { datasets: datasets },
      options: opts
    });
    this._renderCustomLegend(canvasId, datasets);
  },

  /**
   * External HTML tooltip config for trend charts (scatter/line).
   * Creates/reuses a persistent DOM element so the tooltip floats above the canvas,
   * supports clickable author links, and shows a colored dot in the title row.
   */
  _getTrendTooltipConfig(store) {
    var self = this;
    if (!self._trendTooltipEl) {
      var ttEl = document.createElement('div');
      ttEl.className = 'dqh-means-tt'; // reuses the same CSS
      document.body.appendChild(ttEl);
      self._trendTooltipEl = ttEl;
      self._trendTooltipHideTimer = null;
      ttEl.addEventListener('mouseenter', function() {
        clearTimeout(self._trendTooltipHideTimer);
        self._trendTooltipHideTimer = null;
      });
      ttEl.addEventListener('mouseleave', function() {
        ttEl.style.display = 'none';
      });
      ttEl.addEventListener('click', function(e) {
        var a = e.target.closest('[data-paper-ref]');
        if (a) {
          e.preventDefault();
          self._navigateToStudy(a.getAttribute('data-paper-ref'));
          ttEl.style.display = 'none';
        }
      });
    }
    var tooltipEl = self._trendTooltipEl;

    return {
      enabled: false,
      external: function(context) {
        var tooltip = context.tooltip;
        if (tooltip.opacity === 0) {
          self._trendTooltipHideTimer = setTimeout(function() {
            tooltipEl.style.display = 'none';
          }, 120);
          return;
        }
        clearTimeout(self._trendTooltipHideTimer);
        self._trendTooltipHideTimer = null;

        var dataPoints = tooltip.dataPoints;
        if (!dataPoints || !dataPoints.length) return;

        // Pick the first non-dashed, non-overall data point
        var item = null;
        for (var k = 0; k < dataPoints.length; k++) {
          if (!dataPoints[k].dataset._isDashed && !dataPoints[k].dataset._isOverall) {
            item = dataPoints[k]; break;
          }
        }
        if (!item || item.raw == null) { tooltipEl.style.display = 'none'; return; }

        var m = item.raw._meta;
        if (!m) return;

        var platform = item.dataset._platformName || '';
        var baseColor = store.getColor(platform);
        var dateStr = m.date
          ? m.date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
          : '';
        var citation = m.researcher
          ? formatCitation(m.researcher, m.date ? m.date.getTime() : null)
          : '';
        var stageDisplay = '';
        if (m.stage) {
          var sl = m.stage.toLowerCase();
          if (sl.indexOf('second') !== -1) stageDisplay = '2-Stage';
          else if (sl.indexOf('first') !== -1) stageDisplay = 'Standard';
          else stageDisplay = m.stage;
        }

        var authorHtml = citation
          ? '<span class="dqh-means-tt-sep">\u2022</span>' +
            (m.paperReference
              ? '<a href="#studies" data-paper-ref="' + escHtml(m.paperReference) + '">' + escHtml(citation) + '</a>'
              : '<span style="font-weight:400">' + escHtml(citation) + '</span>')
          : '';

        var measureHtml = '';
        if (m.description) {
          var descLines = wrapText(m.description, 42);
          measureHtml =
            '<div style="height:4px"></div>' +
            '<div class="dqh-means-tt-measure-lbl">Measure:</div>' +
            '<div>' + descLines.map(function(l) { return escHtml(l); }).join('<br>') + '</div>';
        }

        tooltipEl.innerHTML =
          '<div class="dqh-means-tt-title">' +
            '<span class="dqh-means-tt-dot" style="background:' + baseColor + '"></span>' +
            '<span>' + escHtml(platform) + '</span>' +
            authorHtml +
          '</div>' +
          '<div class="dqh-means-tt-passrate">Pass Rate: ' + item.raw.y + '%</div>' +
          (dateStr ? '<div>Date: ' + escHtml(dateStr) + '</div>' : '') +
          (m.sampleSize ? '<div>Sample Size: N\u00A0=\u00A0' + m.sampleSize + '</div>' : '') +
          '<div>Screening: ' + escHtml(stageDisplay) + '</div>' +
          measureHtml;

        // Position: above the caret, shift left if near right viewport edge
        var canvas = context.chart.canvas;
        var rect = canvas.getBoundingClientRect();
        tooltipEl.style.display = 'block';
        var ttW = tooltipEl.offsetWidth;
        var ttH = tooltipEl.offsetHeight;
        var absX = rect.left + window.scrollX + tooltip.caretX;
        var absY = rect.top + window.scrollY + tooltip.caretY;
        var left = absX + 12;
        var top  = absY - ttH - 10;
        if (left + ttW > window.scrollX + window.innerWidth - 10) left = absX - ttW - 12;
        if (top < window.scrollY + 10) top = absY + 20;
        tooltipEl.style.left = left + 'px';
        tooltipEl.style.top  = top  + 'px';
      }
    };
  },

  /**
   * Metric trend with overall pass rate as a reference.
   */
  renderMetricWithOverall(canvasId, field, stageFilter, platforms) {
    this.destroy(canvasId);
    applyChartTheme();
    if (stageFilter === 'both') {
      return this.renderBothStagesTrend(canvasId, field, platforms);
    }

    var store = window.DQH.dataStore;
    var stage = stageFilter || '1st';
    var is2nd = (stage === '2nd');
    var metricData = store.getTrendData(field, stage, platforms);
    var overallData = store.getTrendData('overallPassRate', stage, platforms);

    if (!metricData.length && !overallData.length) return this.showEmpty(canvasId);
    this.clearEmpty(canvasId);

    var dateRange = store.getDateRange(field, stage, platforms);
    var mobile = isMobile();
    var datasets = [];

    // Primary metric datasets — solid lines
    for (var i = 0; i < metricData.length; i++) {
      var d = metricData[i];
      datasets.push({
        label: d.platform,
        _platformName: d.platform,
        _is2Stage: is2nd,
        _isDashed: false,
        _isOverall: false,
        data: d.points.map(function(p) {
          return { x: p.date.getTime(), y: p.rate, _meta: p };
        }),
        borderColor: d.color,
        backgroundColor: is2nd ? chartHoleFill() : d.color,
        pointBackgroundColor: is2nd ? chartHoleFill() : d.color,
        pointBorderColor: d.color,
        pointBorderWidth: is2nd ? 2 : 1,
        pointRadius: mobile ? 5 : 6,
        pointHoverRadius: mobile ? 7 : 9,
        pointStyle: is2nd ? 'triangle' : 'circle',
        borderWidth: 2,
        fill: false,
        tension: 0,
        showLine: true
      });
    }

    // Overall pass rate — dashed reference lines per platform
    for (var j = 0; j < overallData.length; j++) {
      var od = overallData[j];
      var refColor = od.color + '70';
      datasets.push({
        label: od.platform + ' (Overall)',
        _platformName: od.platform,
        _is2Stage: false,
        _isDashed: false,
        _isOverall: true,
        data: od.points.map(function(p) {
          return { x: p.date.getTime(), y: p.rate, _meta: p };
        }),
        borderColor: refColor,
        backgroundColor: refColor,
        pointRadius: mobile ? 3 : 4,
        pointHoverRadius: mobile ? 5 : 6,
        borderWidth: 1.5,
        borderDash: [5, 4],
        fill: false,
        tension: 0,
        showLine: true
      });
    }

    var opts = this._layout();
    opts.scales = { x: this._xScale(dateRange), y: this._yScale() };
    opts.plugins.tooltip = this._getTrendTooltipConfig(store);

    var ctx = document.getElementById(canvasId).getContext('2d');
    this.instances[canvasId] = new Chart(ctx, {
      type: 'scatter',
      data: { datasets: datasets },
      options: opts
    });
    this._renderCustomLegend(canvasId, datasets);
  },

  /**
   * Means by Platform bar chart: one bar per study row, grouped by platform.
   * 2-stage bars use a diagonal stripe pattern; standard bars are solid.
   * Platform names are centered over each group; value % labels appear above each bar.
   */
  renderStudyMeansChart(canvasId, field, stageFilter, platforms) {
    this.destroy(canvasId);
    applyChartTheme();

    var store = window.DQH.dataStore;
    var studyData = store.getStudyMeansData(field, stageFilter, platforms);
    if (!studyData.length) return this.showEmpty(canvasId);
    this.clearEmpty(canvasId);

    var mobile = isMobile();
    var labels = [];
    var values = [];
    var bgColors = [];
    var borderColors = [];
    var metaArr = [];
    var lastPlatform = null;
    var hasStandard = false;
    var has2Stage = false;

    // Get canvas context early — needed for CanvasPattern creation
    var canvasEl = document.getElementById(canvasId);
    var ctx = canvasEl.getContext('2d');

    // Create diagonal-stripe CanvasPattern for a given hex color (cached per color)
    var stripeCache = {};
    function makeStripePattern(hexColor) {
      if (stripeCache[hexColor]) return stripeCache[hexColor];
      var sz = 8;
      var pc = document.createElement('canvas');
      pc.width = sz; pc.height = sz;
      var pctx = pc.getContext('2d');
      pctx.fillStyle = hexColor + 'CC';
      pctx.fillRect(0, 0, sz, sz);
      pctx.strokeStyle = 'rgba(255,255,255,0.38)';
      pctx.lineWidth = 2.5;
      pctx.beginPath();
      pctx.moveTo(-sz, 0); pctx.lineTo(0, sz);
      pctx.moveTo(0, 0);   pctx.lineTo(sz, sz);
      pctx.moveTo(sz, 0);  pctx.lineTo(sz * 2, sz);
      pctx.stroke();
      var pat = ctx.createPattern(pc, 'repeat');
      stripeCache[hexColor] = pat;
      return pat;
    }

    for (var i = 0; i < studyData.length; i++) {
      var s = studyData[i];

      // Insert a blank gap between platform groups
      if (lastPlatform !== null && s.platform !== lastPlatform) {
        labels.push('');
        values.push(null);
        bgColors.push('transparent');
        borderColors.push('transparent');
        metaArr.push(null);
      }

      // Short x-axis label: "Aug '25"
      var shortLabel = '';
      if (s.studyDate) {
        shortLabel = s.studyDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      } else {
        shortLabel = (s.studyId || '').slice(0, 10);
      }
      labels.push(shortLabel);
      values.push(s.rate);

      var baseColor = store.getColor(s.platform);
      var barIs2Stage = s.stage && s.stage.toLowerCase().indexOf('second') !== -1;
      if (barIs2Stage) {
        has2Stage = true;
        bgColors.push(makeStripePattern(baseColor));
      } else {
        hasStandard = true;
        bgColors.push(baseColor + 'CC');
      }
      borderColors.push(baseColor);
      metaArr.push(s);
      lastPlatform = s.platform;
    }

    var datasets = [{
      data: values,
      backgroundColor: bgColors,
      borderColor: borderColors,
      borderWidth: 1.5,
      borderRadius: 3,
      _metaArr: metaArr
    }];

    // Canvas height: derived from CSS breakpoints (avoids clientHeight = 0 when parent is hidden on first render)
    // Matches .chart-wrap-means-outer heights: 420px (desktop), 350px (@768), 310px (@480)
    var vw = window.innerWidth;
    var CHART_HEIGHT = (vw <= 480 ? 310 : vw <= 768 ? 350 : 420) - 40;
    var barWidth = mobile ? 40 : 60;
    var chartWidth = Math.max(labels.length * barWidth + 80, mobile ? 340 : 460);
    var scrollEl = document.getElementById('chart-means-scroll');
    if (scrollEl) scrollEl.style.minWidth = chartWidth + 'px';
    if (canvasEl) {
      canvasEl.width = chartWidth;
      canvasEl.height = CHART_HEIGHT;
    }

    var self = this;
    var opts = this._layout();
    opts.responsive = false;
    // Top padding: room for platform name label (above chart area) + value labels (just below)
    opts.layout = { padding: { top: mobile ? 36 : 42 } };

    // Override onClick for bar chart
    opts.onClick = function(event, elements) {
      if (!elements || !elements.length) return;
      var el = elements[0];
      var ds = event.chart.data.datasets[el.datasetIndex];
      var m = ds._metaArr && ds._metaArr[el.index];
      if (m && m.paperReference) {
        self._navigateToStudy(m.paperReference);
      }
    };

    opts.scales = {
      x: {
        grid: { color: chartGridColor(), drawOnChartArea: false },
        ticks: {
          maxRotation: 45,
          minRotation: 45,
          font: { size: mobile ? 10 : 12 },
          autoSkip: false,
          color: function(ctx) {
            return (ctx.tick && ctx.tick.label === '') ? 'transparent' : undefined;
          }
        }
      },
      y: this._yScale()
    };

    // External HTML tooltip — renders as a DOM element so it's always above canvas content
    // and supports clickable author links and a colored dot in the title row.
    if (!self._meansTooltipEl) {
      var ttEl = document.createElement('div');
      ttEl.className = 'dqh-means-tt';
      document.body.appendChild(ttEl);
      self._meansTooltipEl = ttEl;
      self._meansTooltipHideTimer = null;
      ttEl.addEventListener('mouseenter', function() {
        clearTimeout(self._meansTooltipHideTimer);
        self._meansTooltipHideTimer = null;
      });
      ttEl.addEventListener('mouseleave', function() {
        ttEl.style.display = 'none';
      });
      // Clicking an author link navigates to the study
      ttEl.addEventListener('click', function(e) {
        var a = e.target.closest('[data-paper-ref]');
        if (a) {
          e.preventDefault();
          self._navigateToStudy(a.getAttribute('data-paper-ref'));
          ttEl.style.display = 'none';
        }
      });
    }
    var meansTooltipEl = self._meansTooltipEl;

    opts.plugins.tooltip = {
      enabled: false,
      external: function(context) {
        var tooltip = context.tooltip;
        if (tooltip.opacity === 0) {
          self._meansTooltipHideTimer = setTimeout(function() {
            meansTooltipEl.style.display = 'none';
          }, 120);
          return;
        }
        clearTimeout(self._meansTooltipHideTimer);
        self._meansTooltipHideTimer = null;

        var dataPoints = tooltip.dataPoints;
        if (!dataPoints || !dataPoints.length) return;
        var item = dataPoints[0];
        if (item.raw === null || item.raw === undefined) return;
        var m = item.dataset._metaArr && item.dataset._metaArr[item.dataIndex];
        if (!m) return;

        var baseColor = store.getColor(m.platform);
        var dateStr = m.studyDate
          ? m.studyDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
          : (m.studyDateStr || '');
        var citation = m.researcher
          ? formatCitation(m.researcher, m.studyDate ? m.studyDate.getTime() : null)
          : '';
        var stageDisplay = '';
        if (m.stage) {
          var sl = m.stage.toLowerCase();
          if (sl.indexOf('second') !== -1) stageDisplay = '2-Stage';
          else if (sl.indexOf('first') !== -1) stageDisplay = 'Standard';
          else stageDisplay = m.stage;
        }

        var authorHtml = citation
          ? '<span class="dqh-means-tt-sep">\u2022</span>' +
            (m.paperReference
              ? '<a href="#studies" data-paper-ref="' + escHtml(m.paperReference) + '">' + escHtml(citation) + '</a>'
              : '<span style="font-weight:400">' + escHtml(citation) + '</span>')
          : '';

        var measureHtml = '';
        if (m.description) {
          var descLines = wrapText(m.description, 42);
          measureHtml =
            '<div style="height:4px"></div>' +
            '<div class="dqh-means-tt-measure-lbl">Measure:</div>' +
            '<div>' + descLines.map(function(l) { return escHtml(l); }).join('<br>') + '</div>';
        }

        meansTooltipEl.innerHTML =
          '<div class="dqh-means-tt-title">' +
            '<span class="dqh-means-tt-dot" style="background:' + baseColor + '"></span>' +
            '<span>' + escHtml(m.platform) + '</span>' +
            authorHtml +
          '</div>' +
          '<div class="dqh-means-tt-passrate">Pass Rate: ' + item.raw + '%</div>' +
          (dateStr ? '<div>Date: ' + escHtml(dateStr) + '</div>' : '') +
          (m.sampleSize ? '<div>Sample Size: N\u00A0=\u00A0' + m.sampleSize + '</div>' : '') +
          '<div>Screening: ' + escHtml(stageDisplay) + '</div>' +
          measureHtml;

        // Position: above the caret, shift left if near right viewport edge
        var canvas = context.chart.canvas;
        var rect = canvas.getBoundingClientRect();
        meansTooltipEl.style.display = 'block';
        var ttW = meansTooltipEl.offsetWidth;
        var ttH = meansTooltipEl.offsetHeight;
        var absX = rect.left + window.scrollX + tooltip.caretX;
        var absY = rect.top + window.scrollY + tooltip.caretY;
        var left = absX + 12;
        var top  = absY - ttH - 10;
        if (left + ttW > window.scrollX + window.innerWidth - 10) left = absX - ttW - 12;
        if (top < window.scrollY + 10) top = absY + 20;
        meansTooltipEl.style.left = left + 'px';
        meansTooltipEl.style.top  = top  + 'px';
      }
    };

    // Inline plugin: draw platform name centered over each group + value % above each bar
    var platformLabelPlugin = {
      id: 'platformLabels',
      afterDraw: function(chart) {
        var cctx = chart.ctx;
        var ds = chart.data.datasets[0];
        var chartMeta = chart.getDatasetMeta(0);
        var light = isLightTheme();
        var chartTop = chart.chartArea ? chart.chartArea.top : 0;

        // Build per-platform: track first and last bar index for centering
        var groups = {};
        for (var gi = 0; gi < ds._metaArr.length; gi++) {
          var gm = ds._metaArr[gi];
          if (!gm) continue;
          var gp = gm.platform;
          if (!groups[gp]) groups[gp] = { minIdx: gi, maxIdx: gi };
          else if (gi > groups[gp].maxIdx) groups[gp].maxIdx = gi;
        }

        // Platform name labels: centered above each group, in top-padding area
        cctx.save();
        cctx.textAlign = 'center';
        cctx.textBaseline = 'middle';
        cctx.font = (mobile ? 12 : 14) + 'px Inter, sans-serif';
        cctx.fillStyle = light ? '#1A1D27' : '#E8EAF0';

        var groupKeys = Object.keys(groups);
        for (var gi2 = 0; gi2 < groupKeys.length; gi2++) {
          var gName = groupKeys[gi2];
          var g = groups[gName];
          var firstEl = chartMeta.data[g.minIdx];
          var lastEl  = chartMeta.data[g.maxIdx];
          if (!firstEl || !lastEl) continue;
          var centerX = (firstEl.x + lastEl.x) / 2;
          var nameY = chartTop - (mobile ? 14 : 16);
          cctx.fillText(gName, centerX, nameY);
        }
        cctx.restore();

        // Value % labels: just above each individual bar
        cctx.save();
        cctx.textAlign = 'center';
        cctx.textBaseline = 'bottom';
        cctx.font = 'bold ' + (mobile ? 11 : 13) + 'px Inter, sans-serif';
        cctx.fillStyle = light ? '#4A5068' : '#9BA1B5';

        for (var vi = 0; vi < ds._metaArr.length; vi++) {
          var vm = ds._metaArr[vi];
          if (!vm) continue;
          var val = ds.data[vi];
          if (val === null || val === undefined) continue;
          var vEl = chartMeta.data[vi];
          if (!vEl) continue;
          // Clamp so value label doesn't overlap the platform name
          var valY = Math.max(vEl.y - 3, chartTop + (mobile ? 14 : 16));
          cctx.fillText(val + '%', vEl.x, valY);
        }
        cctx.restore();
      }
    };

    // Build legend datasets: platforms (with _skipRecruit) + explicit recruitment entries
    var legendDatasets = [];
    var seenPlatforms = {};
    for (var j = 0; j < studyData.length; j++) {
      var p = studyData[j].platform;
      if (!seenPlatforms[p]) {
        seenPlatforms[p] = true;
        legendDatasets.push({
          _platformName: p,
          _is2Stage: false,
          _isDashed: false,
          _isOverall: false,
          _skipRecruit: true,
          borderColor: store.getColor(p)
        });
      }
    }
    if (hasStandard) legendDatasets.push({ _platformName: null, _is2Stage: false, _isDashed: false, _isOverall: false, borderColor: '' });
    if (has2Stage)   legendDatasets.push({ _platformName: null, _is2Stage: true,  _isDashed: false, _isOverall: false, borderColor: '' });

    this.instances[canvasId] = new Chart(ctx, {
      type: 'bar',
      data: { labels: labels, datasets: datasets },
      options: opts,
      plugins: [platformLabelPlugin]
    });
    this._renderCustomLegend(canvasId, legendDatasets, true);
  },

  showEmpty(canvasId) {
    var canvas = document.getElementById(canvasId);
    if (!canvas) return;
    canvas.style.display = 'none';
    var container = canvas.parentElement;
    var msg = container.querySelector('.chart-empty');
    if (!msg) {
      msg = document.createElement('div');
      msg.className = 'chart-empty';
      msg.textContent = 'No data available for this selection.';
      container.appendChild(msg);
    }
    msg.style.display = 'flex';
  },

  clearEmpty(canvasId) {
    var canvas = document.getElementById(canvasId);
    if (!canvas) return;
    canvas.style.display = 'block';
    var msg = canvas.parentElement.querySelector('.chart-empty');
    if (msg) msg.style.display = 'none';
  }
};
