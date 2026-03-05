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
    return {
      responsive: true,
      maintainAspectRatio: false,
      layout: { padding: { top: mobile ? 4 : 8 } },
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
      var stageLabel = d.stage === '2nd' ? '2nd stage' : 'Single';
      var is2nd = d.stage === '2nd';

      datasets.push({
        label: d.platform + ' (' + stageLabel + ')',
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
        return ctx.dataset.label + ': ' + ctx.raw.y + '% (' + dateStr + ')';
      },
      afterLabel: function(ctx) {
        var m = ctx.raw._meta;
        var lines = [];
        if (m.sampleSize) lines.push('N = ' + m.sampleSize);
        if (m.stage) lines.push('Stage: ' + m.stage);
        if (m.paperReference) lines.push('Study: ' + m.paperReference);
        if (m.researcher) lines.push('By: ' + m.researcher);
        if (m.description) {
          var desc = m.description.length > 80 ? m.description.substring(0, 77) + '...' : m.description;
          lines.push('Measure: ' + desc);
        }
        return lines;
      }
    };
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
