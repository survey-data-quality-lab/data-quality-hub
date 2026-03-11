/**
 * Data Quality Hub — Configuration
 * Column mapping matches web-app.gs HEADERS (96 columns, A–CR).
 */
window.DQH = window.DQH || {};

window.DQH.config = {
  csvUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vScIrVKhgm8atUKIJON51ZMw-8jPFqUlF39WOubwG2cW6r936exZi5G8A9z0lEUt3JhoYLU_nDHHQQV/pub?output=csv',
  formUrl: 'https://docs.google.com/forms/d/e/1FAIpQLSeM6jem75hqylsprdyew3nkXDVswuvT5zTvtw0JrM5uXoakyg/viewform?usp=header',
  githubUrl: 'https://github.com/survey-data-quality-lab/data-quality-hub',

  // Exact Google Sheet column headers → internal field names
  // Matched from web-app.gs HEADERS array (96 columns)
  columnMap: {
    // Base metadata (columns 0–5)
    'Approved': 'approved',
    'Timestamp': 'timestamp',
    'Contact Email': 'contactEmail',
    'Researcher Name': 'researcherName',
    'Researcher Affiliation': 'affiliation',
    'Study Title': 'paperReference',

    // Recruitment & stage (columns 6–7)
    'Recruitment Method': 'recruitmentMethod',
    'Stage': 'stage',

    // Platform & sample details (columns 8–16)
    'Platform': 'platform',
    'If Other, please specify': 'platformOther',
    'Sample Size': 'sampleSize',
    'Study Start Month': 'studyMonth',
    'Study Start Year': 'studyYear',
    'Country': 'country',
    'Participant quality/approval score': 'approvalScore',
    'Minimum number of completed studies/HITs': 'minStudies',
    'Selection criteria for Stage 2': 'selectionCriteria',

    // Standard metric 1: Passed Classic Checks — Attention (columns 17–19)
    'Did you measure: Passed Classic Checks?': 'classicChecksAsked',
    'Passed Classic Checks — Rate (%)': 'classicChecksRate',
    'Passed Classic Checks — Description': 'classicChecksDescription',

    // Standard metric 2: Passed Video Check — AI/Bot (columns 20–22)
    'Did you measure: Passed Video Check?': 'videoCheckAsked',
    'Passed Video Check — Rate (%)': 'videoCheckRate',
    'Passed Video Check — Description': 'videoCheckDescription',

    // Standard metric 3: Typed Text — AI/Bot (columns 23–25)
    'Did you measure: Typed Text?': 'typedTextAsked',
    'Typed Text — Rate (%)': 'typedTextRate',
    'Typed Text — Description': 'typedTextDescription',

    // Standard metric 4: Typed w/ Typical Speed — AI/Bot (columns 26–28)
    'Did you measure: Typed w/ Typical Speed?': 'typicalSpeedAsked',
    'Typed w/ Typical Speed — Rate (%)': 'typicalSpeedRate',
    'Typed w/ Typical Speed — Description': 'typicalSpeedDescription',

    // Standard metric 5: reCAPTCHA Score — AI/Bot (columns 29–31)
    'Did you measure: reCAPTCHA Score?': 'recaptchaAsked',
    'reCAPTCHA Score — Rate (%)': 'recaptchaRate',
    'reCAPTCHA Score — Description': 'recaptchaDescription',

    // Standard metric 6: Pangram AI Likelihood — AI/Bot (columns 32–34)
    'Did you measure: Pangram AI Likelihood?': 'pangramAsked',
    'Pangram AI Likelihood — Rate (%)': 'pangramRate',
    'Pangram AI Likelihood — Description': 'pangramDescription',

    // Standard metric 7: Unique IP Address — Fraud (columns 35–37)
    'Did you measure: Unique IP Address?': 'uniqueIpAsked',
    'Unique IP Address — Rate (%)': 'uniqueIpRate',
    'Unique IP Address — Description': 'uniqueIpDescription',

    // Custom metric 1 (columns 38–42)
    'Did you use an additional data quality metric?': 'customMetric1Asked',
    'Additional Metric 1 — Name': 'customMetric1Name',
    'Additional Metric 1 — Category': 'customMetric1Category',
    'Additional Metric 1 — Rate (%)': 'customMetric1Rate',
    'Additional Metric 1 — Description': 'customMetric1Description',

    // Custom metric 2 (columns 43–47)
    'Did you use any further data quality metric?': 'customMetric2Asked',
    'Additional Metric 2 — Name': 'customMetric2Name',
    'Additional Metric 2 — Category': 'customMetric2Category',
    'Additional Metric 2 — Rate (%)': 'customMetric2Rate',
    'Additional Metric 2 — Description': 'customMetric2Description',

    // Custom metric 3 (columns 48–52)
    'Did you use yet another data quality metric? (3)': 'customMetric3Asked',
    'Additional Metric 3 — Name': 'customMetric3Name',
    'Additional Metric 3 — Category': 'customMetric3Category',
    'Additional Metric 3 — Rate (%)': 'customMetric3Rate',
    'Additional Metric 3 — Description': 'customMetric3Description',

    // Custom metric 4 (columns 53–57)
    'Additional metric? (4)': 'customMetric4Asked',
    'Additional Metric 4 — Name': 'customMetric4Name',
    'Additional Metric 4 — Category': 'customMetric4Category',
    'Additional Metric 4 — Rate (%)': 'customMetric4Rate',
    'Additional Metric 4 — Description': 'customMetric4Description',

    // Custom metric 5 (columns 58–62)
    'Additional metric? (5)': 'customMetric5Asked',
    'Additional Metric 5 — Name': 'customMetric5Name',
    'Additional Metric 5 — Category': 'customMetric5Category',
    'Additional Metric 5 — Rate (%)': 'customMetric5Rate',
    'Additional Metric 5 — Description': 'customMetric5Description',

    // Custom metric 6 (columns 63–67)
    'Additional metric? (6)': 'customMetric6Asked',
    'Additional Metric 6 — Name': 'customMetric6Name',
    'Additional Metric 6 — Category': 'customMetric6Category',
    'Additional Metric 6 — Rate (%)': 'customMetric6Rate',
    'Additional Metric 6 — Description': 'customMetric6Description',

    // Custom metric 7 (columns 68–72)
    'Additional metric? (7)': 'customMetric7Asked',
    'Additional Metric 7 — Name': 'customMetric7Name',
    'Additional Metric 7 — Category': 'customMetric7Category',
    'Additional Metric 7 — Rate (%)': 'customMetric7Rate',
    'Additional Metric 7 — Description': 'customMetric7Description',

    // Custom metric 8 (columns 73–77)
    'Additional metric? (8)': 'customMetric8Asked',
    'Additional Metric 8 — Name': 'customMetric8Name',
    'Additional Metric 8 — Category': 'customMetric8Category',
    'Additional Metric 8 — Rate (%)': 'customMetric8Rate',
    'Additional Metric 8 — Description': 'customMetric8Description',

    // Custom metric 9 (columns 78–82)
    'Additional metric? (9)': 'customMetric9Asked',
    'Additional Metric 9 — Name': 'customMetric9Name',
    'Additional Metric 9 — Category': 'customMetric9Category',
    'Additional Metric 9 — Rate (%)': 'customMetric9Rate',
    'Additional Metric 9 — Description': 'customMetric9Description',

    // Custom metric 10 (columns 83–87)
    'Additional metric? (10)': 'customMetric10Asked',
    'Additional Metric 10 — Name': 'customMetric10Name',
    'Additional Metric 10 — Category': 'customMetric10Category',
    'Additional Metric 10 — Rate (%)': 'customMetric10Rate',
    'Additional Metric 10 — Description': 'customMetric10Description',

    // Overall quality (columns 88–89)
    'Overall data quality pass rate (%)': 'overallPassRate',
    'Description of overall quality measure': 'qualityDescription',

    // Study metadata (columns 90–95)
    'Is this study pre-registered?': 'preregistration',
    'Pre-registration link': 'preRegLink',
    'Paper or study link': 'studyLink',
    'Data Availability': 'dataAvailability',
    'Publication Status': 'publicationStatus',
    'Submission ID': 'submissionId'
  },

  // Number of custom metric slots in the form
  customMetricSlots: 10,

  // Fields that should be parsed as numbers
  numericFields: [
    'sampleSize',
    'overallPassRate',
    'classicChecksRate',
    'videoCheckRate',
    'typedTextRate',
    'typicalSpeedRate',
    'recaptchaRate',
    'pangramRate',
    'uniqueIpRate',
    'customMetric1Rate',
    'customMetric2Rate',
    'customMetric3Rate',
    'customMetric4Rate',
    'customMetric5Rate',
    'customMetric6Rate',
    'customMetric7Rate',
    'customMetric8Rate',
    'customMetric9Rate',
    'customMetric10Rate'
  ],

  // Two-level metric selection: concerns → specific metrics
  metricConcerns: [
    {
      id: 'inattention',
      label: 'Attention',
      metrics: [
        { field: 'classicChecksRate', label: 'Passed Classic Checks' }
      ]
    },
    {
      id: 'ai',
      label: 'AI and Bots',
      metrics: [
        { field: 'videoCheckRate', label: 'Passed Video Check' },
        { field: 'typedTextRate', label: 'Typed Text' },
        { field: 'typicalSpeedRate', label: 'Typed w/ Typical Speed' },
        { field: 'recaptchaRate', label: 'reCAPTCHA Score' },
        { field: 'pangramRate', label: 'Pangram AI Likelihood' }
      ]
    },
    {
      id: 'fraud',
      label: 'Account Fraud',
      metrics: [
        { field: 'uniqueIpRate', label: 'Unique IP Address' }
      ]
    }
  ],

  // Flat metric list (for CSV download and availability checks)
  // Custom metrics are added dynamically at runtime by data-store.init()
  metricOptions: [
    { field: 'classicChecksRate', label: 'Passed Classic Checks' },
    { field: 'videoCheckRate', label: 'Passed Video Check' },
    { field: 'typedTextRate', label: 'Typed Text' },
    { field: 'typicalSpeedRate', label: 'Typed w/ Typical Speed' },
    { field: 'recaptchaRate', label: 'reCAPTCHA Score' },
    { field: 'pangramRate', label: 'Pangram AI Likelihood' },
    { field: 'uniqueIpRate', label: 'Unique IP Address' }
  ],

  // Category IDs for custom metric → concern mapping
  categoryToConcernId: {
    'Attention': 'inattention',
    'AI/Bot': 'ai',
    'Fraud': 'fraud'
  },

  // Platform display colors (brightened for dark background)
  platformColors: {
    'Prolific': '#60A5FA',
    'Bilendi': '#A78BFA',
    'MTurk': '#F87171',
    'Moblab': '#FBBF24',
    'CloudResearch': '#FB923C',
    'Lab': '#34D399',
    'Other': '#6B7185'
  },

  defaultColor: '#6B7185',

  // Platform URLs for linking platform tags
  platformUrls: {
    'Prolific': 'https://www.prolific.com',
    'MTurk': 'https://www.mturk.com',
    'Bilendi': 'https://www.bilendi.com',
    'Moblab': 'https://www.moblab.com',
    'CloudResearch': 'https://www.cloudresearch.com'
  }
};
