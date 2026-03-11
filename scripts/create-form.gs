/**
 * Data Quality Hub — Google Form Generator
 *
 * Creates the "Submit Your Study Results" form programmatically.
 * Run createForm() from the Apps Script editor to generate a new form.
 *
 * HOW TO USE:
 *   1. Go to https://script.google.com → New Project
 *   2. Paste this entire file into Code.gs
 *   3. Run the createForm() function
 *   4. Authorize when prompted (first run only)
 *   5. Check the Execution Log for the form URL
 *
 * The form responses will go to a NEW Google Sheet.
 * You can re-link it to your existing sheet afterwards if you prefer.
 */

function createForm() {
  var form = FormApp.create('Data Quality Hub — Submit Your Study Results');
  form.setDescription(
    'Share your online survey data quality metrics to help the research community ' +
    'track quality across platforms.\n\n' +
    'Fields marked with * are required. All metric fields are optional — fill in what you have.'
  );
  form.setConfirmationMessage('Thank you for your submission! Your data will be reviewed and added to the dashboard.');
  form.setAllowResponseEdits(false);
  form.setCollectEmail(false);
  form.setLimitOneResponsePerUser(false);

  // ═══════════════════════════════════════════
  // SECTION 1: Study & Researcher Information
  // ═══════════════════════════════════════════

  form.addSectionHeaderItem()
    .setTitle('Study & Researcher Information')
    .setHelpText('Basic information about you and your study.');

  form.addTextItem()
    .setTitle('Researcher Name')
    .setRequired(true);

  form.addTextItem()
    .setTitle('Researcher Affiliation')
    .setRequired(true);

  form.addTextItem()
    .setTitle('Study Title')
    .setRequired(true);

  form.addTextItem()
    .setTitle('Study link')
    .setHelpText('Link to the paper, preprint, or working paper (if available)')
    .setRequired(false);

  form.addTextItem()
    .setTitle('Contact Email')
    .setRequired(false);

  // ═══════════════════════════════════════════
  // SECTION 2: Study Design
  // ═══════════════════════════════════════════

  var sectionDesign = form.addPageBreakItem()
    .setTitle('Study Design')
    .setHelpText('Details about how the study was conducted.');

  var platformQ = form.addMultipleChoiceItem()
    .setTitle('Platform')
    .setRequired(true);

  // We'll set up choices with navigation after creating all sections.
  // For now, just list them without branching.
  platformQ.setChoiceValues(['Prolific', 'MTurk', 'Bilendi', 'Moblab', 'Lab', 'AI Agents', 'Other']);

  form.addTextItem()
    .setTitle('If Other, please specify')
    .setRequired(false);

  form.addTextItem()
    .setTitle('Sample Size')
    .setHelpText('Total number of participants/responses')
    .setRequired(true)
    .setValidation(FormApp.createTextValidation()
      .setHelpText('Please enter a whole number')
      .requireWholeNumber()
      .build());

  form.addDateItem()
    .setTitle('Approximate Study Date')
    .setHelpText('When was the data collected?')
    .setRequired(true);

  var recruitmentQ = form.addMultipleChoiceItem()
    .setTitle('Recruitment Method')
    .setRequired(false);
  recruitmentQ.setChoiceValues(['Standard (single stage)', 'Two-stage recruitment', 'Other']);

  form.addListItem()
    .setTitle('If two-stage, which stage are these results from?')
    .setRequired(false)
    .setChoiceValues(['First stage (baseline)', 'Second stage (main study)']);

  // ═══════════════════════════════════════════
  // SECTION 3: Overall Quality
  // ═══════════════════════════════════════════

  var sectionQuality = form.addPageBreakItem()
    .setTitle('Overall Data Quality')
    .setHelpText('Your main quality measure. This is the primary metric shown on the dashboard.');

  form.addTextItem()
    .setTitle('Overall data quality pass rate (%)')
    .setHelpText('Percentage of responses that passed your main quality filter (0–100)')
    .setRequired(true)
    .setValidation(FormApp.createTextValidation()
      .setHelpText('Enter a number between 0 and 100')
      .requireNumberBetween(0, 100)
      .build());

  form.addParagraphTextItem()
    .setTitle('Description of your main quality measure')
    .setHelpText('Briefly describe how you defined "passing" quality (e.g., "passed 2 of 3 attention checks and not flagged by AI detector")')
    .setRequired(false);

  // ═══════════════════════════════════════════
  // SECTION 4: Specific Metrics — Inattention
  // ═══════════════════════════════════════════

  var sectionAttention = form.addPageBreakItem()
    .setTitle('Specific Metrics — Inattention')
    .setHelpText('Attention check results. Skip if not measured.');

  form.addTextItem()
    .setTitle('Attention Check Pass Rate (%)')
    .setHelpText('Percentage that passed attention checks (0–100)')
    .setRequired(false)
    .setValidation(FormApp.createTextValidation()
      .setHelpText('Enter a number between 0 and 100')
      .requireNumberBetween(0, 100)
      .build());

  form.addTextItem()
    .setTitle('Attention Check Description')
    .setHelpText('e.g., "Instructed response item asking to select option 3"')
    .setRequired(false);

  // ═══════════════════════════════════════════
  // SECTION 5: Specific Metrics — AI / Nonhuman
  // ═══════════════════════════════════════════

  var sectionAI = form.addPageBreakItem()
    .setTitle('Specific Metrics — AI / Nonhuman Responses')
    .setHelpText('AI/LLM and bot detection results. Skip if not measured.');

  form.addTextItem()
    .setTitle('AI/LLM Detection Rate (%)')
    .setHelpText('Percentage flagged as AI/LLM-generated or bot responses (0–100)')
    .setRequired(false)
    .setValidation(FormApp.createTextValidation()
      .setHelpText('Enter a number between 0 and 100')
      .requireNumberBetween(0, 100)
      .build());

  form.addTextItem()
    .setTitle('AI/LLM Detection Description')
    .setHelpText('e.g., "GPTZero classifier on open-ended responses"')
    .setRequired(false);

  // ═══════════════════════════════════════════
  // SECTION 6: Specific Metrics — Account Fraud
  // ═══════════════════════════════════════════

  var sectionFraud = form.addPageBreakItem()
    .setTitle('Specific Metrics — Account Fraud')
    .setHelpText('Duplicate/fraudulent account detection results. Skip if not measured.');

  form.addTextItem()
    .setTitle('Account Fraud Detection Rate (%)')
    .setHelpText('Percentage flagged for account fraud (0–100)')
    .setRequired(false)
    .setValidation(FormApp.createTextValidation()
      .setHelpText('Enter a number between 0 and 100')
      .requireNumberBetween(0, 100)
      .build());

  form.addTextItem()
    .setTitle('Account Fraud Description')
    .setHelpText('e.g., "Duplicate IP detection + suspicious sign-up pattern flagging"')
    .setRequired(false);

  // ═══════════════════════════════════════════
  // SECTION 7: Other Metrics
  // ═══════════════════════════════════════════

  var sectionOther = form.addPageBreakItem()
    .setTitle('Other Metrics')
    .setHelpText('Any additional quality metrics you tracked. Completely optional.');

  form.addTextItem()
    .setTitle('Other Metric 1 Name')
    .setRequired(false);

  form.addTextItem()
    .setTitle('Other Metric 1 Rate (%)')
    .setRequired(false)
    .setValidation(FormApp.createTextValidation()
      .setHelpText('Enter a number between 0 and 100')
      .requireNumberBetween(0, 100)
      .build());

  form.addTextItem()
    .setTitle('Other Metric 1 Description')
    .setRequired(false);

  form.addTextItem()
    .setTitle('Other Metric 2 Name')
    .setRequired(false);

  form.addTextItem()
    .setTitle('Other Metric 2 Rate (%)')
    .setRequired(false)
    .setValidation(FormApp.createTextValidation()
      .setHelpText('Enter a number between 0 and 100')
      .requireNumberBetween(0, 100)
      .build());

  form.addTextItem()
    .setTitle('Other Metric 2 Description')
    .setRequired(false);

  // ═══════════════════════════════════════════
  // SECTION 8: Study Metadata (NEW — from Sören's changes)
  // ═══════════════════════════════════════════

  var sectionMeta = form.addPageBreakItem()
    .setTitle('Study Metadata')
    .setHelpText('Additional information about your study\'s availability and status.');

  form.addMultipleChoiceItem()
    .setTitle('Data Availability')
    .setRequired(false)
    .setChoiceValues([
      'Publicly available',
      'Available upon request',
      'Will be publicly available upon publication',
      'Not publicly available'
    ]);

  form.addMultipleChoiceItem()
    .setTitle('Pre-registration')
    .setRequired(false)
    .setChoiceValues([
      'Pre-registered',
      'Not pre-registered'
    ]);

  form.addMultipleChoiceItem()
    .setTitle('Publication Status')
    .setRequired(false)
    .setChoiceValues([
      'Published',
      'Working paper available',
      'Paper not yet available'
    ]);

  // ═══════════════════════════════════════════
  // SECTION 9: Final Notes
  // ═══════════════════════════════════════════

  var sectionFinal = form.addPageBreakItem()
    .setTitle('Additional Information');

  form.addParagraphTextItem()
    .setTitle('Study Description')
    .setHelpText('Brief description of what the study was about')
    .setRequired(false);

  form.addParagraphTextItem()
    .setTitle('Additional Notes')
    .setHelpText('Anything else you\'d like to share about your data quality experience')
    .setRequired(false);

  // ═══════════════════════════════════════════
  // LOG RESULTS
  // ═══════════════════════════════════════════

  Logger.log('══════════════════════════════════════════');
  Logger.log('Form created successfully!');
  Logger.log('Edit URL:    ' + form.getEditUrl());
  Logger.log('Public URL:  ' + form.getPublishedUrl());
  Logger.log('Form ID:     ' + form.getId());
  Logger.log('══════════════════════════════════════════');
  Logger.log('');
  Logger.log('NEXT STEPS:');
  Logger.log('1. Open the Edit URL above to review the form');
  Logger.log('2. Go to Responses tab → Link to Sheets to connect a spreadsheet');
  Logger.log('3. In the spreadsheet, add an "Approved" column (Column A) for moderation');
  Logger.log('4. Publish the sheet: File → Share → Publish to web → CSV');
  Logger.log('5. Update the csvUrl in js/config.js with the new published CSV URL');
}


/**
 * OPTIONAL: Modify an existing form instead of creating a new one.
 * Uncomment and set your form ID to use this.
 *
 * This clears all items and rebuilds — use with caution on a live form.
 */
// function rebuildExistingForm() {
//   var FORM_ID = '1a9cSKbLDhUbsjTkunScqlUTW3yIZJzX4T-tTg4NiC0o';
//   var form = FormApp.openById(FORM_ID);
//
//   // Remove all existing items
//   var items = form.getItems();
//   for (var i = items.length - 1; i >= 0; i--) {
//     form.deleteItem(items[i]);
//   }
//
//   // Now add items the same way as createForm()...
//   // (copy the item-creation code from above)
// }


/**
 * EXAMPLE: Adding branching logic.
 *
 * If you later want page 2 to differ based on platform choice, you would:
 *   1. Create separate page-break sections for each platform
 *   2. Use createChoice(label, pageBreakItem) to route each option
 *
 * Example:
 *
 *   var sectionProlific = form.addPageBreakItem().setTitle('Prolific Details');
 *   var sectionMTurk    = form.addPageBreakItem().setTitle('MTurk Details');
 *   var sectionCommon   = form.addPageBreakItem().setTitle('Common Questions');
 *
 *   platformQ.setChoices([
 *     platformQ.createChoice('Prolific', sectionProlific),
 *     platformQ.createChoice('MTurk', sectionMTurk),
 *     platformQ.createChoice('Other', sectionCommon)
 *   ]);
 *
 *   // After platform-specific sections, converge:
 *   sectionProlific.setGoToPage(sectionCommon);
 *   sectionMTurk.setGoToPage(sectionCommon);
 */
