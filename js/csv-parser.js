/**
 * Data Quality Hub — CSV Parser
 * Fetches and parses the published Google Sheet CSV.
 * RFC 4180 compliant (handles quoted fields with commas/newlines).
 */
window.DQH = window.DQH || {};

window.DQH.csvParser = {
  /**
   * Fetch and parse CSV from Google Sheets.
   * Returns array of study objects, or [] on failure.
   */
  async fetchAndParse() {
    try {
      console.log('[DQH] Fetching CSV from:', window.DQH.config.csvUrl);
      const response = await fetch(window.DQH.config.csvUrl);
      if (!response.ok) throw new Error('HTTP ' + response.status);
      const text = await response.text();
      console.log('[DQH] CSV fetched successfully, raw length:', text.length, 'chars');

      // Log the raw CSV as a table
      const rawRows = this.tokenize(text);
      console.log('[DQH] Raw CSV: ' + rawRows.length + ' rows (including header)');
      if (rawRows.length > 0) {
        var headers = rawRows[0].map(function(h) { return h.trim(); });
        console.log('[DQH] CSV Headers:', headers);
      }
      if (rawRows.length > 1) {
        console.log('[DQH] --- Raw CSV Data (all rows, before filtering) ---');
        var tableData = [];
        for (var r = 1; r < rawRows.length; r++) {
          var rowObj = {};
          var isEmpty = true;
          for (var c = 0; c < headers.length; c++) {
            var val = (c < rawRows[r].length) ? rawRows[r][c].trim() : '';
            if (val) isEmpty = false;
            rowObj[headers[c]] = val;
          }
          if (!isEmpty) tableData.push(rowObj);
        }
        if (tableData.length > 0) {
          console.table(tableData);
        } else {
          console.log('[DQH] All CSV rows are empty — no submissions yet.');
        }
      }

      // Parse and filter
      const studies = this.parse(text);
      console.log('[DQH] --- Approved & Parsed: ' + studies.length + ' row(s) ---');
      if (studies.length > 0) {
        console.table(studies);
        studies.forEach(function(s, i) {
          console.log('[DQH] Row ' + (i + 1) + ': ' + s.platform +
            ' | Researcher: ' + s.researcherName +
            ' | Affiliation: ' + (s.affiliation || '—') +
            ' | N=' + s.sampleSize +
            ' | Date: ' + (s.studyDate || '—') +
            ' | Overall Pass Rate: ' + s.overallPassRate + '%' +
            ' | Attention: ' + (s.attentionCheckRate !== null ? s.attentionCheckRate + '%' : '—') +
            ' | AI Detection: ' + (s.aiDetectionRate !== null ? s.aiDetectionRate + '%' : '—') +
            ' | Account Fraud: ' + (s.accountFraudRate !== null ? s.accountFraudRate + '%' : '—') +
            ' | Recruitment: ' + (s.recruitmentMethod || '—') +
            ' | Stage: ' + (s.stage || '—'));
        });
      } else {
        console.log('[DQH] No approved rows found. Make sure the Approved column has value "1" for rows you want to show.');
      }

      return studies;
    } catch (err) {
      console.warn('[DQH] CSV fetch failed:', err.message);
      return [];
    }
  },

  /**
   * Parse CSV text into array of objects.
   */
  parse(csvText) {
    const rows = this.tokenize(csvText);
    if (rows.length < 2) return [];

    const rawHeaders = rows[0];
    const config = window.DQH.config;

    // Build header mapping, skipping section headers
    const headerMap = [];
    for (let i = 0; i < rawHeaders.length; i++) {
      const raw = rawHeaders[i].trim();
      if (config.sectionHeaders.some(s => raw.toUpperCase().startsWith(s))) {
        headerMap.push(null); // skip this column
        continue;
      }
      // Try exact match first, then try without asterisks (required field markers)
      let field = config.columnMap[raw];
      if (!field) {
        const cleaned = raw.replace(/\*/g, '').trim();
        field = config.columnMap[cleaned];
      }
      headerMap.push(field || null);
    }

    const studies = [];
    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      if (row.length === 0 || (row.length === 1 && row[0].trim() === '')) continue;

      const obj = {};
      for (let c = 0; c < headerMap.length; c++) {
        const field = headerMap[c];
        if (!field) continue;
        obj[field] = (c < row.length) ? row[c].trim() : '';
      }

      // Filter: only approved rows
      if (obj.approved !== '1') continue;

      // Parse numeric fields
      for (const nf of config.numericFields) {
        if (obj[nf] !== undefined && obj[nf] !== '') {
          obj[nf] = parseFloat(obj[nf]);
          if (isNaN(obj[nf])) obj[nf] = null;
        } else {
          obj[nf] = null;
        }
      }

      // Resolve "Other" platform
      if (obj.platform && obj.platform.toLowerCase() === 'other' && obj.platformOther) {
        obj.platform = obj.platformOther.trim();
      }

      studies.push(obj);
    }

    return studies;
  },

  /**
   * RFC 4180 CSV tokenizer.
   * Returns array of arrays (rows of fields).
   */
  tokenize(text) {
    const rows = [];
    let current = [];
    let field = '';
    let inQuotes = false;
    let i = 0;

    while (i < text.length) {
      const ch = text[i];

      if (inQuotes) {
        if (ch === '"') {
          if (i + 1 < text.length && text[i + 1] === '"') {
            field += '"';
            i += 2;
          } else {
            inQuotes = false;
            i++;
          }
        } else {
          field += ch;
          i++;
        }
      } else {
        if (ch === '"') {
          inQuotes = true;
          i++;
        } else if (ch === ',') {
          current.push(field);
          field = '';
          i++;
        } else if (ch === '\r') {
          current.push(field);
          field = '';
          rows.push(current);
          current = [];
          i++;
          if (i < text.length && text[i] === '\n') i++;
        } else if (ch === '\n') {
          current.push(field);
          field = '';
          rows.push(current);
          current = [];
          i++;
        } else {
          field += ch;
          i++;
        }
      }
    }

    // Last field/row
    if (field || current.length > 0) {
      current.push(field);
      rows.push(current);
    }

    return rows;
  }
};
