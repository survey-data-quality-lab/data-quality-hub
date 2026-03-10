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

window.DQH.charts = {
  instances: {},

  destroy(id) {
    if (this.instances[id]) {
      this.instances[id].destroy();
      delete this.instances[id];
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
      title: { display: !mobile, text: 'Study Date' },
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
      title: { display: !mobile, text: 'Pass Rate (%)' },
      grid: { color: chartGridColor() }
    };
  },

  /** Common layout options */
  _layout() {
    var mobile = isMobile();
    var self = this;
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
        legend: {
          position: 'bottom',
          labels: {
            usePointStyle: true,
            padding: mobile ? 10 : 16,
            font: { size: mobile ? 11 : 12 }
          }
        }
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

    var datasets = trendData.map(function(d) {
      return {
        label: d.platform,
        data: d.points.map(function(p) {
          return { x: p.date.getTime(), y: p.rate, _meta: p };
        }),
        borderColor: d.color,
        backgroundColor: d.color,
        pointRadius: mobile ? 5 : 6,
        pointHoverRadius: mobile ? 7 : 9,
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
        showLine: true,
        _isDashed: false
      });
    }

    for (var j = 0; j < bothData.dashed.length; j++) {
      var c = bothData.dashed[j];
      datasets.push({
        label: c.platform + ' screening',
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
        showLine: true,
        _isDashed: true
      });
    }

    var opts = this._layout();
    opts.plugins.legend.labels.filter = function(item, chartData) {
      return !chartData.datasets[item.datasetIndex]._isDashed;
    };
    opts.plugins.tooltip = { callbacks: this._tooltipCallbacks() };
    opts.scales = { x: this._xScale(dateRange), y: this._yScale() };

    var ctx = document.getElementById(canvasId).getContext('2d');
    this.instances[canvasId] = new Chart(ctx, {
      type: 'scatter',
      data: { datasets: datasets },
      options: opts
    });
  },

  /** Shared tooltip callbacks */
  _tooltipCallbacks() {
    return {
      label: function(ctx) {
        var date = new Date(ctx.raw.x);
        var dateStr = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
        var m = ctx.raw._meta;
        var nStr = (m && m.sampleSize) ? '  ·  N = ' + m.sampleSize : '';
        return ctx.dataset.label + ': ' + ctx.raw.y + '%  ·  ' + dateStr + nStr;
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
   * Shows the selected metric (solid lines per platform) plus the overall
   * pass rate (dashed, semi-transparent lines) for context.
   * Handles "both" stage filter by delegating to renderBothStagesTrend.
   */
  renderMetricWithOverall(canvasId, field, stageFilter, platforms) {
    this.destroy(canvasId);
    applyChartTheme();
    if (stageFilter === 'both') {
      return this.renderBothStagesTrend(canvasId, field, platforms);
    }

    var store = window.DQH.dataStore;
    var stage = stageFilter || '1st';
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
        data: d.points.map(function(p) {
          return { x: p.date.getTime(), y: p.rate, _meta: p };
        }),
        borderColor: d.color,
        backgroundColor: d.color,
        pointRadius: mobile ? 5 : 6,
        pointHoverRadius: mobile ? 7 : 9,
        borderWidth: 2,
        fill: false,
        tension: 0,
        showLine: true,
        _isOverall: false
      });
    }

    // Overall pass rate — dashed reference lines per platform
    // Append '70' hex suffix (~44% opacity) to visually distinguish from primary metric lines
    for (var j = 0; j < overallData.length; j++) {
      var od = overallData[j];
      var refColor = od.color + '70';
      datasets.push({
        label: od.platform + ' (Overall)',
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
        showLine: true,
        _isOverall: true
      });
    }

    var opts = this._layout();
    opts.scales = { x: this._xScale(dateRange), y: this._yScale() };
    opts.plugins.tooltip = { callbacks: this._tooltipCallbacks() };
    // Show all series in the legend; overall ones are visually distinct via dashes
    opts.plugins.legend.labels.generateLabels = function(chart) {
      return Chart.defaults.plugins.legend.labels.generateLabels(chart).map(function(item) {
        var ds = chart.data.datasets[item.datasetIndex];
        if (ds && ds._isOverall) {
          item.lineDash = [5, 4];
          item.fontStyle = 'italic';
        }
        return item;
      });
    };

    var ctx = document.getElementById(canvasId).getContext('2d');
    this.instances[canvasId] = new Chart(ctx, {
      type: 'scatter',
      data: { datasets: datasets },
      options: opts
    });
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
