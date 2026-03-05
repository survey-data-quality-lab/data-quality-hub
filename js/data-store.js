/**
 * Data Quality Hub — Data Store
 * All data comes from Google Sheet CSV.
 */
window.DQH = window.DQH || {};

window.DQH.dataStore = {
  studies: [],

  // Platforms to exclude (non-human data pools)
  excludedPlatforms: ['AI Agents'],

  init(csvData) {
    var excluded = this.excludedPlatforms;
    this.studies = (csvData || []).filter(function(s) {
      return excluded.indexOf(s.platform) === -1;
    });
  },

  /**
   * Filter studies by stage.
   * '1st' includes rows with no stage (single-stage = 1st stage).
   */
  filterByStage(stageFilter) {
    if (stageFilter === 'both') return this.studies;
    return this.studies.filter(function(s) {
      var stage = (s.stage || '').toLowerCase();
      if (stageFilter === '1st') {
        return stage === '' || stage.indexOf('first') !== -1;
      }
      if (stageFilter === '2nd') {
        return stage.indexOf('second') !== -1;
      }
      return true;
    });
  },

  /**
   * Summary stats — "Studies" counts unique paper references (not rows).
   */
  getSummaryStats() {
    var studies = this.studies;
    var platforms = new Set(studies.map(function(s) { return s.platform; }));
    var contributors = new Set(studies.map(function(s) { return s.researcherName; }));
    var totalParticipants = studies.reduce(function(sum, s) { return sum + (s.sampleSize || 0); }, 0);

    // Count unique studies by paper reference (or researcher+platform as fallback)
    var studyKeys = new Set();
    for (var i = 0; i < studies.length; i++) {
      var s = studies[i];
      var key = s.paperReference || (s.researcherName + '||' + s.platform);
      studyKeys.add(key);
    }

    return {
      platforms: platforms.size,
      studies: studyKeys.size,
      totalParticipants: totalParticipants,
      contributors: contributors.size
    };
  },

  /**
   * Aggregate by platform with stage filter.
   */
  aggregateByPlatform(stageFilter) {
    var studies = this.filterByStage(stageFilter || '1st');
    var groups = {};
    for (var i = 0; i < studies.length; i++) {
      var s = studies[i];
      if (s.overallPassRate === null || s.overallPassRate === undefined) continue;
      var p = s.platform;
      if (!groups[p]) groups[p] = { rates: [], descriptions: [] };
      groups[p].rates.push(s.overallPassRate);
      if (s.qualityDescription) groups[p].descriptions.push(s.qualityDescription);
    }

    return Object.keys(groups).map(function(platform) {
      var d = groups[platform];
      var avg = d.rates.reduce(function(a, b) { return a + b; }, 0) / d.rates.length;
      return {
        platform: platform,
        avgRate: avg,
        studyCount: d.rates.length,
        description: d.descriptions[0] || ''
      };
    }).sort(function(a, b) { return b.avgRate - a.avgRate; });
  },

  /**
   * Aggregate a specific metric by platform with stage filter.
   */
  aggregateMetric(field, stageFilter) {
    var studies = this.filterByStage(stageFilter || 'both');
    // Find the description field name for this metric
    var descField = field.replace('Rate', 'Description');
    var groups = {};
    for (var i = 0; i < studies.length; i++) {
      var s = studies[i];
      var val = s[field];
      if (val === null || val === undefined) continue;
      var p = s.platform;
      if (!groups[p]) groups[p] = { rates: [], descriptions: [] };
      groups[p].rates.push(val);
      var desc = s[descField];
      if (desc) groups[p].descriptions.push(desc);
    }

    return Object.keys(groups).map(function(platform) {
      var d = groups[platform];
      var avg = d.rates.reduce(function(a, b) { return a + b; }, 0) / d.rates.length;
      return {
        platform: platform,
        avgRate: avg,
        count: d.rates.length,
        description: d.descriptions[0] || ''
      };
    }).sort(function(a, b) { return b.avgRate - a.avgRate; });
  },

  /**
   * Get trend data grouped by platform.
   * Each point includes rich metadata for tooltips.
   */
  getTrendData(field, stageFilter, platforms) {
    var studies = this.filterByStage(stageFilter || '1st');
    if (platforms) {
      studies = studies.filter(function(s) { return platforms.indexOf(s.platform) !== -1; });
    }
    var descField = field === 'overallPassRate' ? 'qualityDescription' : field.replace('Rate', 'Description');
    var groups = {};
    var self = this;

    for (var i = 0; i < studies.length; i++) {
      var s = studies[i];
      var val = s[field];
      if (val === null || val === undefined) continue;
      var date = this.parseDate(s.studyDate);
      if (!date) continue;

      var p = s.platform;
      if (!groups[p]) groups[p] = [];
      groups[p].push({
        date: date,
        rate: val,
        researcher: s.researcherName,
        sampleSize: s.sampleSize,
        stage: s.stage || '',
        paperReference: s.paperReference || '',
        description: s[descField] || ''
      });
    }

    return Object.keys(groups).map(function(platform) {
      var points = groups[platform].sort(function(a, b) { return a.date - b.date; });
      return {
        platform: platform,
        color: self.getColor(platform),
        points: points
      };
    });
  },

  /**
   * Get trend data for "Both Stages" view.
   * Returns solid-line datasets (per platform+stage) and dashed connectors (within-study).
   */
  getBothStagesTrendData(field, platforms) {
    var studies = this.studies;
    if (platforms) {
      studies = studies.filter(function(s) { return platforms.indexOf(s.platform) !== -1; });
    }
    var descField = field === 'overallPassRate' ? 'qualityDescription' : field.replace('Rate', 'Description');
    var self = this;
    var solidGroups = {};
    var studyGroups = {};

    for (var i = 0; i < studies.length; i++) {
      var s = studies[i];
      var val = s[field];
      if (val === null || val === undefined) continue;
      var date = this.parseDate(s.studyDate);
      if (!date) continue;

      var platform = s.platform;
      var stage = this.normalizeStage(s.stage);
      var point = {
        date: date,
        rate: val,
        researcher: s.researcherName,
        sampleSize: s.sampleSize,
        stage: s.stage || '',
        normalizedStage: stage,
        paperReference: s.paperReference || '',
        description: s[descField] || ''
      };

      // Solid trajectory: group by platform + normalized stage
      var solidKey = platform + '||' + stage;
      if (!solidGroups[solidKey]) {
        solidGroups[solidKey] = { platform: platform, stage: stage, points: [] };
      }
      solidGroups[solidKey].points.push(point);

      // Study group: for dashed within-study connectors
      var paperRef = s.paperReference || '';
      if (paperRef) {
        var studyKey = paperRef + '||' + platform;
        if (!studyGroups[studyKey]) {
          studyGroups[studyKey] = { platform: platform, paperReference: paperRef, stages: {} };
        }
        studyGroups[studyKey].stages[stage] = point;
      }
    }

    // Solid datasets sorted by date
    var solid = Object.keys(solidGroups).map(function(key) {
      var g = solidGroups[key];
      g.points.sort(function(a, b) { return a.date - b.date; });
      return {
        platform: g.platform,
        stage: g.stage,
        color: self.getColor(g.platform),
        points: g.points
      };
    });

    // Dashed connectors: only where both stages exist for same platform + study
    var dashed = [];
    var studyKeys = Object.keys(studyGroups);
    for (var j = 0; j < studyKeys.length; j++) {
      var g = studyGroups[studyKeys[j]];
      if (g.stages['1st'] && g.stages['2nd']) {
        dashed.push({
          platform: g.platform,
          paperReference: g.paperReference,
          color: self.getColor(g.platform),
          points: [g.stages['1st'], g.stages['2nd']]
        });
      }
    }

    return { solid: solid, dashed: dashed };
  },

  /**
   * Get min/max dates for axis padding. Extends 3 months before earliest
   * and goes up to current month.
   */
  getDateRange(field, stageFilter, platforms) {
    var studies = this.filterByStage(stageFilter || '1st');
    if (platforms) {
      studies = studies.filter(function(s) { return platforms.indexOf(s.platform) !== -1; });
    }
    var dates = [];
    for (var i = 0; i < studies.length; i++) {
      var d = this.parseDate(studies[i].studyDate);
      if (d) dates.push(d.getTime());
    }
    if (!dates.length) return null;

    var minDate = new Date(Math.min.apply(null, dates));
    var now = new Date();

    // 3 months before earliest
    var padMin = new Date(minDate);
    padMin.setMonth(padMin.getMonth() - 3);

    // Current month end (or 3 months after latest, whichever is later)
    var maxDate = new Date(Math.max.apply(null, dates));
    var padMax = new Date(maxDate);
    padMax.setMonth(padMax.getMonth() + 3);
    var currentEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    if (currentEnd > padMax) padMax = currentEnd;

    return { min: padMin.getTime(), max: padMax.getTime() };
  },

  parseDate(dateStr) {
    if (!dateStr) return null;
    dateStr = dateStr.trim();
    if (/^\d{4}$/.test(dateStr)) return new Date(parseInt(dateStr), 0, 1);
    var d = new Date(dateStr);
    if (!isNaN(d.getTime())) return d;
    return null;
  },

  normalizeStage(stageStr) {
    var stage = (stageStr || '').toLowerCase();
    if (stage.indexOf('second') !== -1) return '2nd';
    return '1st';
  },

  getAvailableMetrics() {
    var options = window.DQH.config.metricOptions;
    var available = [];
    for (var i = 0; i < options.length; i++) {
      var field = options[i].field;
      var hasData = this.studies.some(function(s) {
        return s[field] !== null && s[field] !== undefined;
      });
      if (hasData) available.push(options[i]);
    }
    return available;
  },

  /**
   * Get metric definitions: one per unique study that has a description
   * for the given metric's description field.
   */
  getMetricDefinitions(field) {
    var descField = field.replace('Rate', 'Description');
    var seen = {};
    var results = [];
    for (var i = 0; i < this.studies.length; i++) {
      var s = this.studies[i];
      var desc = s[descField];
      if (!desc) continue;
      var key = s.paperReference || (s.researcherName + '||' + s.platform);
      if (seen[key]) continue;
      seen[key] = true;
      results.push({
        paperReference: s.paperReference || '',
        researcher: s.researcherName || '',
        description: desc,
        platform: s.platform,
        studyDate: s.studyDate || ''
      });
    }
    return results;
  },

  getColor(platform) {
    return window.DQH.config.platformColors[platform] || window.DQH.config.defaultColor;
  }
};
