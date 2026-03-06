/**
 * Data Quality Hub — Studies Tree
 * Hierarchical 3-level view: Study → Platform → 2nd Stage.
 */
window.DQH = window.DQH || {};

window.DQH.table = {
  filterPlatform: 'all',

  render() {
    this.renderFilter();
    this.renderTree();
  },

  renderFilter() {
    var select = document.getElementById('platform-filter');
    if (!select) return;

    var platforms = [];
    var seen = {};
    var studies = window.DQH.dataStore.studies;
    for (var i = 0; i < studies.length; i++) {
      var p = studies[i].platform;
      if (!seen[p]) { seen[p] = true; platforms.push(p); }
    }
    platforms.sort();

    select.innerHTML = '<option value="all">All Platforms</option>';
    for (var j = 0; j < platforms.length; j++) {
      var opt = document.createElement('option');
      opt.value = platforms[j];
      opt.textContent = platforms[j];
      select.appendChild(opt);
    }
    select.value = this.filterPlatform;

    var self = this;
    select.onchange = function() {
      self.filterPlatform = select.value;
      self.renderTree();
    };
  },

  /**
   * Build 3-level hierarchy from flat studies array.
   */
  buildHierarchy(studies) {
    var store = window.DQH.dataStore;
    var groups = {};

    for (var i = 0; i < studies.length; i++) {
      var s = studies[i];
      var key = s.paperReference || s.researcherName || 'Unknown';

      if (!groups[key]) {
        groups[key] = {
          label: s.paperReference || s.researcherName || 'Unknown Study',
          researcher: s.researcherName || '',
          platforms: {},
          totalN: 0,
          latestDate: null,
          allEntries: []
        };
      }

      var g = groups[key];
      g.totalN += (s.sampleSize || 0);
      g.allEntries.push(s);

      var d = store.parseDate(s.studyDate);
      if (d && (!g.latestDate || d > g.latestDate)) {
        g.latestDate = d;
      }

      var p = s.platform;
      if (!g.platforms[p]) {
        g.platforms[p] = { primary: [], secondary: [] };
      }

      var stage = store.normalizeStage(s.stage);
      if (stage === '2nd') {
        g.platforms[p].secondary.push(s);
      } else {
        g.platforms[p].primary.push(s);
      }
    }

    var result = Object.keys(groups).map(function(key) {
      var g = groups[key];
      return {
        label: g.label,
        researcher: g.researcher,
        platformCount: Object.keys(g.platforms).length,
        totalN: g.totalN,
        latestDate: g.latestDate,
        platforms: g.platforms,
        allEntries: g.allEntries
      };
    });

    result.sort(function(a, b) {
      var da = a.latestDate ? a.latestDate.getTime() : 0;
      var db = b.latestDate ? b.latestDate.getTime() : 0;
      return db - da;
    });

    return result;
  },

  renderTree() {
    var container = document.getElementById('studies-tree');
    if (!container) return;

    var studies = window.DQH.dataStore.studies.slice();

    if (this.filterPlatform !== 'all') {
      studies = studies.filter(function(s) { return s.platform === this.filterPlatform; }.bind(this));
    }

    var hierarchy = this.buildHierarchy(studies);

    if (!hierarchy.length) {
      container.innerHTML = '<div class="table-empty">No studies match the selected filter.</div>';
      return;
    }

    var html = '';
    for (var i = 0; i < hierarchy.length; i++) {
      html += this.renderL1(hierarchy[i], i);
    }
    container.innerHTML = html;
    this.bindTreeEvents(container);
  },

  renderColumnHeader() {
    var html = '<div class="study-col-header">';
    html += '<div class="col-chevron"></div>';
    html += '<div class="col-platform">Platform</div>';
    html += '<div class="col-n">N</div>';
    html += '<div class="col-date">Date</div>';
    html += '<div class="col-rate">Pass Rate</div>';
    html += '<div class="col-attention">Attention</div>';
    html += '<div class="col-ai">AI Detect</div>';
    html += '<div class="col-design">Design</div>';
    html += '</div>';
    return html;
  },

  renderL1(study, index) {
    var html = '<div class="study-l1" data-index="' + index + '">';
    html += '<svg class="toggle-chevron" width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 8 10 12 14 8"></polyline></svg>';
    html += '<div class="l1-paper">' + this.esc(study.label) + '</div>';
    html += '<div class="l1-researcher">' + this.esc(study.researcher) + '</div>';
    html += '<div class="l1-meta">' + study.platformCount + ' platform' + (study.platformCount !== 1 ? 's' : '') + '</div>';
    html += '<div class="l1-n">N = ' + this.fmtNum(study.totalN) + '</div>';
    // Info button
    html += '<button class="l1-info-btn" data-study-index="' + index + '" type="button" onclick="event.stopPropagation()">';
    html += '<svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="8" cy="8" r="6.5"/><line x1="8" y1="7" x2="8" y2="11"/><circle cx="8" cy="5" r="0.5" fill="currentColor"/></svg>';
    html += '</button>';
    html += '</div>';

    // Info popup (hidden by default)
    html += '<div class="l1-info-popup collapsed" data-info-for="' + index + '">';
    html += this.buildStudyInfo(study);
    html += '</div>';

    html += '<div class="l1-children" data-parent="' + index + '">';
    html += this.renderColumnHeader();

    var platformNames = Object.keys(study.platforms);
    for (var j = 0; j < platformNames.length; j++) {
      var pName = platformNames[j];
      var pData = study.platforms[pName];

      for (var k = 0; k < pData.primary.length; k++) {
        var isLast = (k === pData.primary.length - 1);
        var hasSecondary = pData.secondary.length > 0;
        var showExpand = isLast && hasSecondary;
        var l2Id = index + '-' + j + '-' + k;
        html += this.renderL2(pData.primary[k], showExpand, l2Id);

        if (showExpand) {
          html += '<div class="l2-children" data-l2-parent="' + l2Id + '">';
          for (var m = 0; m < pData.secondary.length; m++) {
            html += this.renderL3(pData.secondary[m]);
          }
          html += '</div>';
        }
      }

      if (pData.primary.length === 0) {
        for (var n = 0; n < pData.secondary.length; n++) {
          html += this.renderL2(pData.secondary[n], false, index + '-' + j + '-2nd-' + n);
        }
      }
    }

    html += '</div>';
    return html;
  },

  buildStudyInfo(study) {
    var entries = study.allEntries;
    var html = '<div class="study-info-content">';

    // Collect unique descriptions, quality measures, and notes across all entries
    var desc = '';
    var qualDesc = '';
    var notesList = [];
    var notesSeen = {};
    for (var i = 0; i < entries.length; i++) {
      if (!desc && entries[i].studyDescription) desc = entries[i].studyDescription;
      if (!qualDesc && entries[i].qualityDescription) qualDesc = entries[i].qualityDescription;
      var n = entries[i].additionalNotes;
      if (n && !notesSeen[n]) { notesSeen[n] = true; notesList.push(n); }
    }

    // Study link (from first entry that has one)
    var studyLink = '';
    for (var j = 0; j < entries.length; j++) {
      if (!studyLink && entries[j].studyLink) { studyLink = entries[j].studyLink; break; }
    }

    if (desc) {
      html += '<div class="study-info-row"><strong>Study:</strong> ' + this.esc(desc) + '</div>';
    }
    if (studyLink) {
      html += '<div class="study-info-row"><a href="' + this.esc(studyLink) + '" target="_blank" rel="noopener">View paper / study details &rarr;</a></div>';
    }
    if (qualDesc) {
      html += '<div class="study-info-row"><strong>Pass rate measure:</strong> ' + this.esc(qualDesc) + '</div>';
    }
    if (notesList.length) {
      html += '<div class="study-info-row"><strong>Details:</strong> ' + this.esc(notesList.join(' | ')) + '</div>';
    }

    if (!desc && !qualDesc && !studyLink) {
      html += '<div class="study-info-row" style="color:var(--text-tertiary);font-style:italic">No additional details available for this study.</div>';
    }

    html += '</div>';
    return html;
  },

  renderL2(s, hasChild, id) {
    var design = '';
    if (s.recruitmentMethod && s.recruitmentMethod.toLowerCase().indexOf('two-stage') !== -1) {
      design = 'Two-stage';
    } else {
      design = 'Single';
    }

    var html = '<div class="study-l2' + (hasChild ? ' has-child' : '') + '" data-l2="' + id + '">';
    if (hasChild) {
      html += '<svg class="toggle-chevron l2-chevron" width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 8 10 12 14 8"></polyline></svg>';
    } else {
      html += '<span class="l2-spacer"></span>';
    }
    html += '<div class="l2-platform">' + this.platformTag(s.platform) + '</div>';
    html += '<div class="l2-n">' + this.fmtNum(s.sampleSize) + '</div>';
    html += '<div class="l2-date">' + this.esc(s.studyDate || '') + '</div>';
    html += '<div class="l2-rate">' + this.rateCell(s.overallPassRate) + '</div>';
    html += '<div class="l2-attention">' + this.rateCell(s.attentionCheckRate) + '</div>';
    html += '<div class="l2-ai">' + this.rateCell(s.aiDetectionRate) + '</div>';
    html += '<div class="l2-design">' + this.esc(design) + '</div>';
    html += '</div>';
    return html;
  },

  renderL3(s) {
    var html = '<div class="study-l3">';
    html += '<div class="l3-label">2nd Stage</div>';
    html += '<div class="l3-label"></div>';
    html += '<div class="l3-n">' + this.fmtNum(s.sampleSize) + '</div>';
    html += '<div class="l3-date">' + this.esc(s.studyDate || '') + '</div>';
    html += '<div class="l3-rate">' + this.rateCell(s.overallPassRate) + '</div>';
    html += '<div class="l3-attention">' + this.rateCell(s.attentionCheckRate) + '</div>';
    html += '<div class="l3-ai">' + this.rateCell(s.aiDetectionRate) + '</div>';
    html += '<div class="l3-design"></div>';
    html += '</div>';
    return html;
  },

  bindTreeEvents(container) {
    // L1 click to expand/collapse
    var l1s = container.querySelectorAll('.study-l1');
    for (var i = 0; i < l1s.length; i++) {
      l1s[i].addEventListener('click', function() {
        var idx = this.getAttribute('data-index');
        var children = container.querySelector('.l1-children[data-parent="' + idx + '"]');
        if (children) {
          children.classList.toggle('expanded');
          this.classList.toggle('expanded');
        }
      });
    }

    // L1 info button
    var infoBtns = container.querySelectorAll('.l1-info-btn');
    for (var k = 0; k < infoBtns.length; k++) {
      infoBtns[k].addEventListener('click', function(e) {
        e.stopPropagation();
        var idx = this.getAttribute('data-study-index');
        var popup = container.querySelector('.l1-info-popup[data-info-for="' + idx + '"]');
        if (popup) {
          if (popup.classList.contains('expanded')) {
            popup.classList.remove('expanded');
            popup.classList.add('collapsed');
          } else {
            popup.classList.remove('collapsed');
            popup.classList.add('expanded');
          }
        }
      });
    }

    // L2 click to expand L3
    var l2s = container.querySelectorAll('.study-l2.has-child');
    for (var j = 0; j < l2s.length; j++) {
      l2s[j].addEventListener('click', function(e) {
        e.stopPropagation();
        var l2Id = this.getAttribute('data-l2');
        var children = container.querySelector('.l2-children[data-l2-parent="' + l2Id + '"]');
        if (children) {
          children.classList.toggle('expanded');
          this.classList.toggle('expanded');
        }
      });
    }
  },

  // --- Helpers ---

  platformTag(platform) {
    var color = window.DQH.dataStore.getColor(platform);
    var style = 'background:' + color + '20;color:' + color + ';border:1px solid ' + color + '40';
    var urls = window.DQH.config.platformUrls || {};
    var url = urls[platform];
    if (url) {
      return '<a href="' + this.esc(url) + '" target="_blank" rel="noopener" class="platform-tag" style="' + style + '">' + this.esc(platform) + '</a>';
    }
    return '<span class="platform-tag" style="' + style + '">' + this.esc(platform) + '</span>';
  },

  rateCell(val) {
    if (val === null || val === undefined) return '<span class="rate-na">\u2014</span>';
    var cls = 'rate-red';
    if (val >= 80) cls = 'rate-green';
    else if (val >= 50) cls = 'rate-amber';
    return '<span class="' + cls + '">' + val + '%</span>';
  },

  fmtNum(val) {
    if (val === null || val === undefined) return '\u2014';
    return val.toLocaleString();
  },

  esc(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
};
