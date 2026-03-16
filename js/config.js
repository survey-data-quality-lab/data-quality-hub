/**
 * Data Quality Hub — Configuration
 * Column mapping matches web-app.gs HEADERS (118 columns, A–DN).
 */
window.DQH = window.DQH || {};

window.DQH.config = {
  csvUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQHe5UBU0HfXIs8e_UtSATKCUWnzi2XcPrVizJ6zSQa_G_Zob8JJF3EaMc-G7PxsJ894XVCSy718DgR/pub?output=csv',
  formUrl: 'https://docs.google.com/forms/d/e/1FAIpQLSeM6jem75hqylsprdyew3nkXDVswuvT5zTvtw0JrM5uXoakyg/viewform?usp=header',
  githubUrl: 'https://github.com/survey-data-quality-lab/data-quality-hub',

  // Exact Google Sheet column headers → internal field names
  // Matched from web-app.gs HEADERS array (118 columns)
  columnMap: {
    // Base metadata (columns 0–6)
    'Approved':               'approved',
    'Timestamp':              'timestamp',
    'Submission ID':          'submissionId',
    'Contact Email':          'contactEmail',
    'Researcher Name':        'researcherName',
    'Researcher Affiliation': 'affiliation',
    'Study Title':            'paperReference',

    // Study metadata (columns 7–13)
    'Is this study pre-registered?': 'preregistration',
    'Pre-registration link':         'preRegLink',
    'Paper or study link':           'studyLink',
    'Data Availability':             'dataAvailability',
    'Data Repository Link':          'dataLink',
    'Publication Status':            'publicationStatus',
    'Feedback':                      'feedback',

    // Platform & sample details (columns 14–26)
    'Platform':                                 'platform',
    'If Other, please specify':                 'platformOther',
    'Sample':                                   'sample',
    'Sample Size':                              'sampleSize',
    'Study Start Month':                        'studyMonth',
    'Study Start Year':                         'studyYear',
    'Recruitment Strategy':                     'recruitmentMethod',
    'Country':                                  'country',
    'Participant quality/approval score':       'approvalScore',
    'Minimum number of completed studies/HITs': 'minStudies',
    'Representative Sample':                    'representativeSample',
    'Additional Screening Conditions':          'additionalCriteria',
    'Screener Study':                           'screenerStudy',

    // Standard metric 1: Attention Check — Attention (columns 27–29)
    'Did you measure: Attention Check?':        'classicChecksAsked',
    'Attention Check — Rate (%)':               'classicChecksRate',
    'Attention Check — Additional Information': 'classicChecksDescription',

    // Standard metric 2: Video Check — AI/Bot (columns 30–32)
    'Did you measure: Video Check?':            'videoCheckAsked',
    'Video Check — Rate (%)':                   'videoCheckRate',
    'Video Check — Additional Information':     'videoCheckDescription',

    // Standard metric 3: Typed Text — AI/Bot (columns 33–35)
    'Did you measure: Typed Text?':             'typedTextAsked',
    'Typed Text — Rate (%)':                    'typedTextRate',
    'Typed Text — Additional Information':      'typedTextDescription',

    // Standard metric 4: Typed with Typical Speed — AI/Bot (columns 36–38)
    'Did you measure: Typed with Typical Speed?':        'typicalSpeedAsked',
    'Typed with Typical Speed — Rate (%)':               'typicalSpeedRate',
    'Typed with Typical Speed — Additional Information': 'typicalSpeedDescription',

    // Standard metric 5: ReCAPTCHA Score — AI/Bot (columns 39–41)
    'Did you measure: ReCAPTCHA Score?':        'recaptchaAsked',
    'ReCAPTCHA Score — Rate (%)':               'recaptchaRate',
    'ReCAPTCHA Score — Additional Information': 'recaptchaDescription',

    // Standard metric 6: Pangram AI Detector — AI/Bot (columns 42–44)
    'Did you measure: Pangram AI Detector?':          'pangramAsked',
    'Pangram AI Detector — Rate (%)':                 'pangramRate',
    'Pangram AI Detector — Additional Information':   'pangramDescription',

    // Standard metric 7: Mouse Clicks — AI/Bot (columns 45–47)
    'Did you measure: Mouse Clicks?':           'mouseClicksAsked',
    'Mouse Clicks — Rate (%)':                  'mouseClicksRate',
    'Mouse Clicks — Additional Information':    'mouseClicksDescription',

    // Standard metric 8: Mouse Movements — AI/Bot (columns 48–50)
    'Did you measure: Mouse Movements?':        'mouseMovementsAsked',
    'Mouse Movements — Rate (%)':               'mouseMovementsRate',
    'Mouse Movements — Additional Information': 'mouseMovementsDescription',

    // Standard metric 9: Unique IP Address — Fraud (columns 51–53)
    'Did you measure: Unique IP Address?':      'uniqueIpAsked',
    'Unique IP Address — Rate (%)':             'uniqueIpRate',
    'Unique IP Address — Additional Information': 'uniqueIpDescription',

    // Standard metric 10: No Foreign IP Address — Fraud (columns 54–56)
    'Did you measure: No Foreign IP Address?':        'noForeignIpAsked',
    'No Foreign IP Address — Rate (%)':               'noForeignIpRate',
    'No Foreign IP Address — Additional Information': 'noForeignIpDescription',

    // Standard metric 11: Not in a Geolocation Cluster — Fraud (columns 57–59)
    'Did you measure: Not in a Geolocation Cluster?':        'noGeoClusterAsked',
    'Not in a Geolocation Cluster — Rate (%)':               'noGeoClusterRate',
    'Not in a Geolocation Cluster — Additional Information': 'noGeoClusterDescription',

    // Standard metric 12: No Duplicate Submission — Fraud (columns 60–62)
    'Did you measure: No Duplicate Submission?':        'noDuplicateSubmissionAsked',
    'No Duplicate Submission — Rate (%)':               'noDuplicateSubmissionRate',
    'No Duplicate Submission — Additional Information': 'noDuplicateSubmissionDescription',

    // Standard metric 13: No Duplicate Device Fingerprint — Fraud (columns 63–65)
    'Did you measure: No Duplicate Device Fingerprint?':        'noDuplicateFingerprintAsked',
    'No Duplicate Device Fingerprint — Rate (%)':               'noDuplicateFingerprintRate',
    'No Duplicate Device Fingerprint — Additional Information': 'noDuplicateFingerprintDescription',

    // Overall quality (columns 66–67)
    'Overall data quality pass rate (%)':     'overallPassRate',
    'Description of overall quality measure': 'qualityDescription',

    // Custom metric 1 (columns 68–72)
    'Additional metric? (1)':            'customMetric1Asked',
    'Additional Metric 1 — Name':        'customMetric1Name',
    'Additional Metric 1 — Category':    'customMetric1Category',
    'Additional Metric 1 — Rate (%)':    'customMetric1Rate',
    'Additional Metric 1 — Description': 'customMetric1Description',

    // Custom metric 2 (columns 73–77)
    'Additional metric? (2)':            'customMetric2Asked',
    'Additional Metric 2 — Name':        'customMetric2Name',
    'Additional Metric 2 — Category':    'customMetric2Category',
    'Additional Metric 2 — Rate (%)':    'customMetric2Rate',
    'Additional Metric 2 — Description': 'customMetric2Description',

    // Custom metric 3 (columns 78–82)
    'Additional metric? (3)':            'customMetric3Asked',
    'Additional Metric 3 — Name':        'customMetric3Name',
    'Additional Metric 3 — Category':    'customMetric3Category',
    'Additional Metric 3 — Rate (%)':    'customMetric3Rate',
    'Additional Metric 3 — Description': 'customMetric3Description',

    // Custom metric 4 (columns 83–87)
    'Additional metric? (4)':            'customMetric4Asked',
    'Additional Metric 4 — Name':        'customMetric4Name',
    'Additional Metric 4 — Category':    'customMetric4Category',
    'Additional Metric 4 — Rate (%)':    'customMetric4Rate',
    'Additional Metric 4 — Description': 'customMetric4Description',

    // Custom metric 5 (columns 88–92)
    'Additional metric? (5)':            'customMetric5Asked',
    'Additional Metric 5 — Name':        'customMetric5Name',
    'Additional Metric 5 — Category':    'customMetric5Category',
    'Additional Metric 5 — Rate (%)':    'customMetric5Rate',
    'Additional Metric 5 — Description': 'customMetric5Description',

    // Custom metric 6 (columns 93–97)
    'Additional metric? (6)':            'customMetric6Asked',
    'Additional Metric 6 — Name':        'customMetric6Name',
    'Additional Metric 6 — Category':    'customMetric6Category',
    'Additional Metric 6 — Rate (%)':    'customMetric6Rate',
    'Additional Metric 6 — Description': 'customMetric6Description',

    // Custom metric 7 (columns 98–102)
    'Additional metric? (7)':            'customMetric7Asked',
    'Additional Metric 7 — Name':        'customMetric7Name',
    'Additional Metric 7 — Category':    'customMetric7Category',
    'Additional Metric 7 — Rate (%)':    'customMetric7Rate',
    'Additional Metric 7 — Description': 'customMetric7Description',

    // Custom metric 8 (columns 103–107)
    'Additional metric? (8)':            'customMetric8Asked',
    'Additional Metric 8 — Name':        'customMetric8Name',
    'Additional Metric 8 — Category':    'customMetric8Category',
    'Additional Metric 8 — Rate (%)':    'customMetric8Rate',
    'Additional Metric 8 — Description': 'customMetric8Description',

    // Custom metric 9 (columns 108–112)
    'Additional metric? (9)':            'customMetric9Asked',
    'Additional Metric 9 — Name':        'customMetric9Name',
    'Additional Metric 9 — Category':    'customMetric9Category',
    'Additional Metric 9 — Rate (%)':    'customMetric9Rate',
    'Additional Metric 9 — Description': 'customMetric9Description',

    // Custom metric 10 (columns 113–117)
    'Additional metric? (10)':            'customMetric10Asked',
    'Additional Metric 10 — Name':        'customMetric10Name',
    'Additional Metric 10 — Category':    'customMetric10Category',
    'Additional Metric 10 — Rate (%)':    'customMetric10Rate',
    'Additional Metric 10 — Description': 'customMetric10Description'
  },

  // Number of custom metric slots in the form
  customMetricSlots: 10,

  // Fields that should be parsed as numbers
  numericFields: [
    'sampleSize',
    'approvalScore',
    'minStudies',
    'overallPassRate',
    'classicChecksRate',
    'videoCheckRate',
    'typedTextRate',
    'typicalSpeedRate',
    'recaptchaRate',
    'pangramRate',
    'mouseClicksRate',
    'mouseMovementsRate',
    'uniqueIpRate',
    'noForeignIpRate',
    'noGeoClusterRate',
    'noDuplicateSubmissionRate',
    'noDuplicateFingerprintRate',
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
        { field: 'classicChecksRate', label: 'Attention Check' }
      ]
    },
    {
      id: 'ai',
      label: 'AI and Bots',
      metrics: [
        { field: 'videoCheckRate',     label: 'Video Check' },
        { field: 'typedTextRate',      label: 'Typed Text' },
        { field: 'typicalSpeedRate',   label: 'Typed with Typical Speed' },
        { field: 'recaptchaRate',      label: 'ReCAPTCHA Score' },
        { field: 'pangramRate',        label: 'Pangram AI Detector' },
        { field: 'mouseClicksRate',    label: 'Mouse Clicks' },
        { field: 'mouseMovementsRate', label: 'Mouse Movements' }
      ]
    },
    {
      id: 'fraud',
      label: 'Account Fraud',
      metrics: [
        { field: 'uniqueIpRate',               label: 'Unique IP Address' },
        { field: 'noForeignIpRate',            label: 'No Foreign IP Address' },
        { field: 'noGeoClusterRate',           label: 'Not in a Geolocation Cluster' },
        { field: 'noDuplicateSubmissionRate',  label: 'No Duplicate Submission' },
        { field: 'noDuplicateFingerprintRate', label: 'No Duplicate Device Fingerprint' }
      ]
    }
  ],

  // Flat metric list (for CSV download and availability checks)
  metricOptions: [
    { field: 'classicChecksRate',          label: 'Attention Check' },
    { field: 'videoCheckRate',             label: 'Video Check' },
    { field: 'typedTextRate',              label: 'Typed Text' },
    { field: 'typicalSpeedRate',           label: 'Typed with Typical Speed' },
    { field: 'recaptchaRate',              label: 'ReCAPTCHA Score' },
    { field: 'pangramRate',                label: 'Pangram AI Detector' },
    { field: 'mouseClicksRate',            label: 'Mouse Clicks' },
    { field: 'mouseMovementsRate',         label: 'Mouse Movements' },
    { field: 'uniqueIpRate',               label: 'Unique IP Address' },
    { field: 'noForeignIpRate',            label: 'No Foreign IP Address' },
    { field: 'noGeoClusterRate',           label: 'Not in a Geolocation Cluster' },
    { field: 'noDuplicateSubmissionRate',  label: 'No Duplicate Submission' },
    { field: 'noDuplicateFingerprintRate', label: 'No Duplicate Device Fingerprint' }
  ],

  // Category IDs for custom metric → concern mapping
  categoryToConcernId: {
    'attention':     'inattention',
    'inattention':   'inattention',
    'ai/bot':        'ai',
    'ai/bots':       'ai',
    'ai and bots':   'ai',
    'ai & bots':     'ai',
    'ai':            'ai',
    'bot':           'ai',
    'fraud':         'fraud',
    'account fraud': 'fraud'
  },

  // Platform display colors (brightened for dark background)
  platformColors: {
    'Prolific':       '#60A5FA',
    'Bilendi':        '#A78BFA',
    'MTurk':          '#F87171',
    'Moblab':         '#FBBF24',
    'CloudResearch':  '#FB923C',
    'Lab':            '#34D399',
    'Other':          '#6B7185'
  },

  defaultColor: '#6B7185',

  // Platform URLs for linking platform tags
  platformUrls: {
    'Prolific':      'https://www.prolific.com',
    'MTurk':         'https://www.mturk.com',
    'Bilendi':       'https://www.bilendi.com',
    'Moblab':        'https://www.moblab.com',
    'CloudResearch': 'https://www.cloudresearch.com'
  }
};
