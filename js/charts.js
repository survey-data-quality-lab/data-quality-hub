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

// Canonical platform order for the legend
var LEGEND_PLATFORM_ORDER = ['Lab', 'MTurk', 'Moblab', 'Bilendi', 'Prolific'];

window.DQH.charts = {
  instances: {},

  destroy(id) {
    if (this.instances[id]) {
      this.instances[id].destroy();
      delete this.instances[id];
    }
    // Remove custom legend (lives as sibling of .chart-wrap, inside .chart-card)
    var canvas = document.getElementById(id);
    if (canvas) {
      var old = canvas.parentElement.parentElement.querySelector('.chart-custom-legend');
      if (old) old.parentNode.removeChild(old);
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
  _renderCustomLegend(canvasId, datasets) {
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
      if (ds._is2Stage) has2Stage = true;
      else hasStandard = true;
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

    if (!platforms.length && !hasOverall) return;

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
        stdItem.innerHTML =
          '<svg width="12" height="12" viewBox="0 0 10 10" aria-hidden="true">' +
          '<circle cx="5" cy="5" r="4.5" fill="' + markerColor + '"/></svg>' +
          '<span class="legend-item-text">Standard</span>';
        sSec.appendChild(stdItem);
      }

      if (has2Stage) {
        var tsItem = document.createElement('span');
        tsItem.className = 'legend-item';
        tsItem.innerHTML =
          '<svg width="12" height="13" viewBox="0 0 10 11" aria-hidden="true">' +
          '<polygon points="5,1 9.5,10.5 0.5,10.5" fill="none" stroke="' + markerColor + '" stroke-width="1.5"/></svg>' +
          '<span class="legend-item-text">2-Stage</span>';
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
    opts.plugins.tooltip = { callbacks: this._tooltipCallbacks() };

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
    opts.plugins.tooltip = { callbacks: this._tooltipCallbacks() };
    opts.scales = { x: this._xScale(dateRange), y: this._yScale() };

    var ctx = document.getElementById(canvasId).getContext('2d');
    this.instances[canvasId] = new Chart(ctx, {
      type: 'scatter',
      data: { datasets: datasets },
      options: opts
    });
    this._renderCustomLegend(canvasId, datasets);
  },

  /** Shared tooltip callbacks */
  _tooltipCallbacks() {
    return {
      label: function(ctx) {
        var date = new Date(ctx.raw.x);
        var dateStr = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
        var m = ctx.raw._meta;
        var nStr = (m && m.sampleSize) ? '  ·  N = ' + m.sampleSize : '';
        var pName = ctx.dataset._platformName || ctx.dataset.label;
        return pName + ': ' + ctx.raw.y + '%  ·  ' + dateStr + nStr;
      },
      afterLabel: function(ctx) {
        var m = ctx.raw._meta;
        if (!m) return [];
        var lines = [];
        // Description first — word-wrapped to ~45 chars per line
        if (m.description) {
          var descLines = wrapText('Measure: ' + m.description, 45);
          for (var i = 0; i < descLines.length; i++) lines.push(descLines[i]);
          lines.push('');
        }
        if (m.stage) lines.push('Stage: ' + m.stage);
        // Citation: format as "LastName et al. (year)" if >2 authors
        if (m.researcher) {
          lines.push(formatCitation(m.researcher, ctx.raw.x));
        }
        return lines;
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
    opts.plugins.tooltip = { callbacks: this._tooltipCallbacks() };

    var ctx = document.getElementById(canvasId).getContext('2d');
    this.instances[canvasId] = new Chart(ctx, {
      type: 'scatter',
      data: { datasets: datasets },
      options: opts
    });
    this._renderCustomLegend(canvasId, datasets);
  },

  /**
   * Means by Study bar chart: one bar per study row, grouped by platform.
   */
  renderStudyMeansChart(canvasId, field, stageFilter, platforms) {
    this.destroy(canvasId);
    applyChartTheme();

    var store = window.DQH.dataStore;
    var studyData = store.getStudyMeansData(field, stageFilter, platforms);
    if (!studyData.length) return this.showEmpty(canvasId);
    this.clearEmpty(canvasId);

    var mobile = isMobile();
    var is2nd = (stageFilter === '2nd');
    var labels = [];
    var values = [];
    var bgColors = [];
    var borderColors = [];
    var metaArr = [];
    var lastPlatform = null;

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
      bgColors.push(baseColor + (is2nd ? '99' : 'CC'));
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

    // Explicit canvas dimensions for horizontal scroll chart
    var CHART_HEIGHT = 340;
    var chartWidth = Math.max(labels.length * 54 + 60, 400);
    var scrollEl = document.getElementById('chart-means-scroll');
    if (scrollEl) scrollEl.style.minWidth = chartWidth + 'px';
    var canvasEl = document.getElementById(canvasId);
    if (canvasEl) {
      canvasEl.width = chartWidth;
      canvasEl.height = CHART_HEIGHT;
    }

    var self = this;
    var opts = this._layout();
    opts.responsive = false;

    // Override onClick for bar chart (data points are plain values, metadata in _metaArr)
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
          font: { size: mobile ? 9 : 10 },
          autoSkip: false,
          color: function(ctx) {
            // Dim the empty gap labels
            return (ctx.tick && ctx.tick.label === '') ? 'transparent' : undefined;
          }
        }
      },
      y: this._yScale()
    };

    opts.plugins.tooltip = {
      filter: function(item) { return item.raw !== null; },
      callbacks: {
        title: function(items) {
          if (!items.length) return '';
          var m = items[0].dataset._metaArr && items[0].dataset._metaArr[items[0].dataIndex];
          return m ? m.platform : '';
        },
        label: function(ctx) {
          var m = ctx.dataset._metaArr && ctx.dataset._metaArr[ctx.dataIndex];
          if (!m) return '';
          var dateStr = m.studyDate
            ? m.studyDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
            : m.studyDateStr;
          var nStr = m.sampleSize ? '  ·  N = ' + m.sampleSize : '';
          return m.platform + ': ' + ctx.raw + '%  ·  ' + dateStr + nStr;
        },
        afterLabel: function(ctx) {
          var m = ctx.dataset._metaArr && ctx.dataset._metaArr[ctx.dataIndex];
          if (!m) return [];
          var lines = [];
          if (m.description) {
            var descLines = wrapText('Measure: ' + m.description, 45);
            for (var i = 0; i < descLines.length; i++) lines.push(descLines[i]);
            lines.push('');
          }
          if (m.stage) lines.push('Stage: ' + m.stage);
          if (m.researcher) {
            lines.push(formatCitation(m.researcher, m.studyDate ? m.studyDate.getTime() : null));
          }
          return lines;
        }
      }
    };

    // Build legend pseudo-datasets (one per visible platform)
    var legendDatasets = [];
    var seenPlatforms = {};
    for (var j = 0; j < studyData.length; j++) {
      var p = studyData[j].platform;
      if (!seenPlatforms[p]) {
        seenPlatforms[p] = true;
        legendDatasets.push({
          _platformName: p,
          _is2Stage: is2nd,
          _isDashed: false,
          _isOverall: false,
          borderColor: store.getColor(p)
        });
      }
    }

    var ctx = document.getElementById(canvasId).getContext('2d');
    this.instances[canvasId] = new Chart(ctx, {
      type: 'bar',
      data: { labels: labels, datasets: datasets },
      options: opts
    });
    this._renderCustomLegend(canvasId, legendDatasets);
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
