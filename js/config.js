/**
 * Data Quality Hub — Configuration
 */
window.DQH = window.DQH || {};

window.DQH.config = {
  csvUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRWy5xL3bLyzoFIDJxavSNs_x5rE9Cxn3pUmH0cyMv35n47xyYwH0_KAFg9jyk0WiyyEUTySIAVmUv7/pub?output=csv',
  formUrl: 'https://forms.gle/4hRy2EfM5vVDjEA59',
  githubUrl: 'https://github.com/survey-data-quality-lab/data-quality-hub',

  // Exact Google Sheet column headers → internal field names
  // (matched from the published CSV output)
  columnMap: {
    'Approved': 'approved',
    'Timestamp': 'timestamp',
    'Researcher Name': 'researcherName',
    'Researcher Affiliation': 'affiliation',
    'Study Title': 'paperReference',
    'Paper or Study Reference': 'paperReference', // legacy
    'Study link': 'studyLink',
    'Contact Email': 'contactEmail',
    'Platform': 'platform',
    'Country': 'country',
    'If Other, please specify': 'platformOther',
    'Sample Size': 'sampleSize',
    'Approximate Study Date': 'studyDate',
    'Recruitment Method': 'recruitmentMethod',
    'If two-stage, which stage are these results from?': 'stage',
    'Overall data quality pass rate (%)': 'overallPassRate',
    'Description of your main quality measure': 'qualityDescription',
    'Attention Check Pass Rate (%)': 'attentionCheckRate',
    'Attention Check Description': 'attentionCheckDescription',
    'AI/LLM Detection Rate (%)': 'aiDetectionRate',
    'AI/LLM Detection Description': 'aiDetectionDescription',
    'Account Fraud Detection Rate (%)': 'accountFraudRate',
    'Account Fraud Description': 'accountFraudDescription',
    'Data Availability': 'dataAvailability',
    'Pre-registration': 'preregistration',
    'Publication Status': 'publicationStatus',
    'Other Metric 1 Name': 'otherMetric1Name',
    'Other Metric 1 Rate (%)': 'otherMetric1Rate',
    'Other Metric 1 Description': 'otherMetric1Description',
    'Other Metric 2 Name': 'otherMetric2Name',
    'Other Metric 2 Rate (%)': 'otherMetric2Rate',
    'Other Metric 2 Description': 'otherMetric2Description',
    'Study Description': 'studyDescription',
    'Additional Notes': 'additionalNotes'
  },

  // Columns that are section headers in the form (skip these)
  sectionHeaders: [
    'SECTION 1',
    'SECTION 2',
    'SECTION 3',
    'SECTION 4',
    'SECTION 5'
  ],

  // Fields that should be parsed as numbers
  numericFields: [
    'sampleSize',
    'overallPassRate',
    'attentionCheckRate',
    'aiDetectionRate',
    'accountFraudRate',
    'otherMetric1Rate',
    'otherMetric2Rate'
  ],

  // Two-level metric selection: concerns → specific metrics
  metricConcerns: [
    {
      id: 'inattention',
      label: 'Attention',
      metrics: [
        { field: 'attentionCheckRate', label: 'Attention Check Rate' }
      ]
    },
    {
      id: 'ai',
      label: 'AI and Bots',
      metrics: [
        { field: 'aiDetectionRate', label: 'AI/LLM Detection Rate' }
      ]
    },
    {
      id: 'fraud',
      label: 'Account Fraud',
      metrics: [
        { field: 'accountFraudRate', label: 'Account Fraud Rate' }
      ]
    }
  ],

  // Flat metric list (for CSV download and other uses)
  metricOptions: [
    { field: 'attentionCheckRate', label: 'Attention Check Rate' },
    { field: 'aiDetectionRate', label: 'AI/LLM Detection Rate' },
    { field: 'accountFraudRate', label: 'Account Fraud Rate' },
    { field: 'otherMetric1Rate', label: 'Other Metric 1' },
    { field: 'otherMetric2Rate', label: 'Other Metric 2' }
  ],

  // Platform display colors (brightened for dark background)
  platformColors: {
    'Prolific': '#60A5FA',
    'Bilendi': '#A78BFA',
    'MTurk': '#F87171',
    'Moblab': '#FBBF24',
    'Lab': '#34D399',
    'Other': '#6B7185'
  },

  defaultColor: '#6B7185',

  // Platform URLs for linking platform tags
  platformUrls: {
    'Prolific': 'https://www.prolific.com',
    'MTurk': 'https://www.mturk.com',
    'Bilendi': 'https://www.bilendi.com',
    'Moblab': 'https://www.moblab.com'
  }
};
