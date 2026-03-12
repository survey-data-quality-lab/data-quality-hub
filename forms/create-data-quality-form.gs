/**
 * Data Quality Hub — Multi-Page Google Form Generator (v2)
 *
 * Creates a structured, multi-page form with conditional branching:
 *   - Recruitment A/B path (two-stage vs. platform screening)
 *   - Per-metric Yes/No branching (7 standard + 3 "Other" slots)
 *   - Aligned with paper metrics (Tables 1 & 2) and three-concern
 *     framework (Attention, AI/Bot, Fraud)
 *
 * Metric descriptions are adapted from:
 *   Celebi, Exley, Harrs, Kivimaki, Serra-Garcia, Yusof (2026)
 *   "Mission Possible: The Collection of High-Quality Data"
 *
 * HOW TO USE:
 *   1. Go to https://script.google.com -> New Project
 *   2. Paste this entire file into Code.gs
 *   3. Run the createForm() function
 *   4. Authorize when prompted (first run only)
 *   5. Check the Execution Log for the form URLs
 *
 * The form responses will go to a NEW Google Sheet.
 * You can re-link it to your existing sheet afterwards if you prefer.
 *
 * IMPORTANT: All page-break items are created first, then branching is
 * wired up afterwards, because createChoice() needs references to pages
 * that already exist.
 */

function createForm() {

  // ═══════════════════════════════════════════════════════════════════
  // CREATE FORM
  // ═══════════════════════════════════════════════════════════════════

  var form = FormApp.create('Data Quality Hub — Submit Your Study Results');
  form.setDescription(
    'This form is designed for academic researchers who want to share ' +
    'data quality metrics from online survey studies.\n\n' +
    'Please submit one response per sample (e.g., one submission for your ' +
    'Prolific sample, another for your MTurk sample).\n\n' +
    'The metrics in this form are based on the framework proposed in ' +
    'Celebi, Exley, Harrs, Kivimaki, Serra-Garcia, and Yusof (2026), ' +
    '"Mission Possible: The Collection of High-Quality Data." ' +
    'Your measures do not need to match those definitions exactly — ' +
    'variations and similar approaches are welcome.\n\n' +
    'Fields marked with * are required.'
  );
  form.setConfirmationMessage(
    'Thank you for your submission! Your data will be reviewed and added to the dashboard.'
  );
  form.setAllowResponseEdits(false);
  form.setCollectEmail(false);
  form.setLimitOneResponsePerUser(false);

  // Reusable validations
  var percentValidation = FormApp.createTextValidation()
    .setHelpText('Enter a number between 0 and 100')
    .requireNumberBetween(0, 100)
    .build();

  var wholeNumberValidation = FormApp.createTextValidation()
    .setHelpText('Please enter a whole number')
    .requireWholeNumber()
    .build();

  var emailValidation = FormApp.createTextValidation()
    .setHelpText('Please enter a valid email address')
    .requireTextIsEmail()
    .build();

  // ═══════════════════════════════════════════════════════════════════
  // STANDARD METRICS DEFINITION
  // ═══════════════════════════════════════════════════════════════════
  //
  // Each metric has:
  //   name      — short label shown in form titles
  //   category  — one of three concerns: Attention, AI/Bot, Fraud
  //   askDesc   — description shown on the "Did you measure?" page,
  //               adapted from Table 1 of the paper but generalized
  //   detailHint — help text for the rate/description detail page

  var standardMetrics = [
    {
      name: 'Passed Classic Checks',
      category: 'Attention',
      askDesc:
        'Classic attention checks test whether respondents read and follow ' +
        'instructions carefully. A common implementation embeds instructed-response ' +
        'items in survey questions — for example, asking respondents to select a ' +
        'specific option (e.g., "select the option furthest to the left") within ' +
        'Likert-scale or multiple-choice questions.\n\n' +
        'These checks primarily capture human inattention. ' +
        'Report "Yes" if your study included any form of classic attention or ' +
        'instructed-response check.',
      detailHint:
        'What percentage of respondents passed your classic attention check(s)? ' +
        'In the Description field, briefly note what the check involved ' +
        '(e.g., "instructed response item in a 5-point Likert scale", ' +
        '"trap question asking to select option C").'
    },
    {
      name: 'Passed Video Check',
      category: 'AI/Bot',
      askDesc:
        'A video attention check requires respondents to watch a short video or ' +
        'animation and then provide information that can only be obtained by ' +
        'viewing it — for example, typing numbers that appear sequentially on screen. ' +
        'This check is particularly effective at screening out AI agents, which ' +
        'currently have difficulty processing dynamic visual content in real time.\n\n' +
        'Report "Yes" if your study included any video- or animation-based ' +
        'attention check.',
      detailHint:
        'What percentage of respondents passed the video check? ' +
        'In the Description field, briefly describe the task ' +
        '(e.g., "type four numbers shown sequentially in a short animation", ' +
        '"identify an object that appears in a video clip").'
    },
    {
      name: 'Typed Text',
      category: 'AI/Bot',
      askDesc:
        'This check captures whether an open-ended text response was entered ' +
        'through genuine manual typing rather than pasted or auto-inserted. ' +
        'It typically uses keystroke logging or input-event tracking to detect ' +
        'copy-paste actions, large sudden jumps in text length without ' +
        'corresponding keystrokes, drag-and-drop, or fully automated text insertion.\n\n' +
        'Report "Yes" if your study tracked whether respondents typed their ' +
        'open-ended responses manually (as opposed to pasting or using automated tools).',
      detailHint:
        'What percentage of respondents appear to have typed their text manually? ' +
        'In the Description field, briefly note how this was measured ' +
        '(e.g., "JavaScript keystroke logger flagging paste events and input jumps >50 characters", ' +
        '"Qualtrics recaptured-text comparison").'
    },
    {
      name: 'Typed w/ Typical Speed',
      category: 'AI/Bot',
      askDesc:
        'This check examines whether the respondent\'s typing speed in an open-ended ' +
        'text field falls within a plausible human range. Automated or LLM-assisted ' +
        'responses often exhibit unusually fast or suspiciously uniform typing speeds. ' +
        'A common threshold is a median inter-keystroke interval of at least 75 ' +
        'milliseconds per keystroke.\n\n' +
        'Report "Yes" if your study measured typing speed or inter-keystroke timing ' +
        'to flag abnormally fast text entry.',
      detailHint:
        'What percentage of respondents typed at a speed consistent with human input? ' +
        'In the Description field, note the threshold or method used ' +
        '(e.g., "median typing speed > 75 ms per keystroke", ' +
        '"flagged responses entered faster than 30 WPM as suspicious").'
    },
    {
      name: 'reCAPTCHA Score',
      category: 'AI/Bot',
      askDesc:
        'Google\'s reCAPTCHA v3 assigns a score between 0 and 1 based on behavioral ' +
        'and contextual signals during interaction with the survey interface. Lower ' +
        'values indicate a higher likelihood of bot activity. Common thresholds ' +
        'include scores of 0.5, 0.9, or 1.0.\n\n' +
        'Report "Yes" if your study collected reCAPTCHA scores (or a similar ' +
        'automated bot-detection score) for respondents.',
      detailHint:
        'What percentage of respondents met or exceeded your reCAPTCHA threshold? ' +
        'In the Description field, note the threshold used ' +
        '(e.g., "reCAPTCHA v3 score >= 0.5", "reCAPTCHA score == 1").'
    },
    {
      name: 'Pangram AI Likelihood',
      category: 'AI/Bot',
      askDesc:
        'Pangram (or similar AI-text-detection services) analyzes open-ended text ' +
        'responses and estimates the probability that the text was generated by a ' +
        'large language model (LLM). A lower AI-likelihood score suggests the ' +
        'response is more likely human-written. Common thresholds include scores ' +
        'below 0.5 or below 1.0 (on a 0–1 scale).\n\n' +
        'Report "Yes" if your study used any AI-text-detection tool (Pangram, ' +
        'GPTZero, Originality.ai, or similar) to assess open-ended responses.',
      detailHint:
        'What percentage of respondents were classified as likely human (not AI-generated)? ' +
        'In the Description field, note the tool and threshold ' +
        '(e.g., "Pangram AI likelihood < 0.5", "GPTZero human probability > 80%").'
    },
    {
      name: 'Unique IP Address',
      category: 'Fraud',
      askDesc:
        'This check identifies potential account fraud by verifying that each ' +
        'respondent\'s IP address is unique within the study sample. Duplicate ' +
        'IP addresses may indicate that the same individual (or bot network) ' +
        'submitted multiple responses using different accounts.\n\n' +
        'Note: This measure may be less appropriate in settings where respondents ' +
        'legitimately share a network (e.g., students at the same university). ' +
        'Report "Yes" if your study checked for duplicate IP addresses or used ' +
        'similar network-level fraud detection.',
      detailHint:
        'What percentage of respondents had a unique IP address within your sample? ' +
        'In the Description field, note any additional fraud detection used ' +
        '(e.g., "unique IP within sample", "IP + geolocation cluster check", ' +
        '"device fingerprinting via Fingerprint.com").'
    }
  ];

  // ═══════════════════════════════════════════════════════════════════
  // PHASE 1: CREATE ALL PAGES (no branching yet)
  // ═══════════════════════════════════════════════════════════════════
  //
  // Google Forms requires that target pages exist before you can
  // reference them in createChoice(). So we create every page first,
  // then wire up the branching in Phase 2.

  // -----------------------------------------------------------------
  // PAGE 1: Introduction & Researcher Info (first page, no page break)
  // -----------------------------------------------------------------

  var emailQ = form.addTextItem()
    .setTitle('Contact Email')
    .setHelpText('We may contact you to verify or clarify your submission.')
    .setRequired(true)
    .setValidation(emailValidation);

  var nameQ = form.addTextItem()
    .setTitle('Researcher Name')
    .setRequired(true);

  var affiliationQ = form.addTextItem()
    .setTitle('Researcher Affiliation')
    .setRequired(true);

  var studyTitleQ = form.addTextItem()
    .setTitle('Study Title')
    .setRequired(true);

  var numSamplesQ = form.addTextItem()
    .setTitle('How many different samples do you plan to contribute?')
    .setHelpText('Informational only — submit one form per sample.')
    .setRequired(false)
    .setValidation(wholeNumberValidation);

  // -----------------------------------------------------------------
  // PAGE 2: Sample Details
  // -----------------------------------------------------------------

  var pageSampleDetails = form.addPageBreakItem()
    .setTitle('Sample Details');

  var platformQ = form.addMultipleChoiceItem()
    .setTitle('Platform')
    .setHelpText('Which platform was the sample recruited from?')
    .setRequired(true);
  // Choices set without branching — platform doesn't branch
  platformQ.setChoiceValues([
    'Prolific', 'MTurk', 'Bilendi', 'Moblab', 'CloudResearch', 'Other'
  ]);

  var platformOtherQ = form.addTextItem()
    .setTitle('If Other, please specify')
    .setRequired(false);

  var sampleSizeQ = form.addTextItem()
    .setTitle('Sample Size')
    .setHelpText('Total number of participants/responses')
    .setRequired(true)
    .setValidation(wholeNumberValidation);

  // Month dropdown
  var months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  var studyMonthQ = form.addListItem()
    .setTitle('Study Start Month')
    .setRequired(false)
    .setChoiceValues(months);

  // Year dropdown
  var years = [];
  for (var y = 2020; y <= 2030; y++) {
    years.push(String(y));
  }
  var studyYearQ = form.addListItem()
    .setTitle('Study Start Year')
    .setRequired(false)
    .setChoiceValues(years);

  // -----------------------------------------------------------------
  // PAGE 3: Recruitment & Eligibility
  // -----------------------------------------------------------------
  // Screening criteria (approval score, country, min studies) are
  // placed HERE — on the same page, BEFORE the branching question —
  // so they are always shown regardless of which recruitment path
  // the user takes. The branching question must be last on the page.

  var pageRecruitment = form.addPageBreakItem()
    .setTitle('Recruitment & Eligibility')
    .setHelpText('How were participants recruited for this study?');

  var approvalScoreQ = form.addTextItem()
    .setTitle('Participant quality/approval score')
    .setHelpText('e.g., "95% approval rating", "99% on Prolific"')
    .setRequired(false);

  var countryQ = form.addTextItem()
    .setTitle('Country')
    .setHelpText('e.g., "US only", "UK and Germany"')
    .setRequired(false);

  var minStudiesQ = form.addTextItem()
    .setTitle('Minimum number of completed studies/HITs')
    .setHelpText('e.g., "100 approved HITs"')
    .setRequired(false);

  // Branching question — must be LAST on this page
  var recruitmentQ = form.addMultipleChoiceItem()
    .setTitle('Who was eligible to participate in this study?')
    .setRequired(true);
  // Choices with branching wired in Phase 2

  // -----------------------------------------------------------------
  // PAGE 3A: Two-Stage Screening Details
  // -----------------------------------------------------------------

  var pageTwoStage = form.addPageBreakItem()
    .setTitle('Two-Stage Screening Details')
    .setHelpText(
      'You indicated participants were recruited from a previous study. ' +
      'In a two-stage recruitment method, a short baseline survey with data ' +
      'quality checks is used to identify high-quality respondents, who are ' +
      'then invited to the main study. Please provide details about your ' +
      'screening process.'
    );

  var screeningChecksQ = form.addCheckboxItem()
    .setTitle('What type of data quality checks did you use for screening?')
    .setHelpText('Select all that apply.')
    .setRequired(false)
    .setChoiceValues([
      'Passed classic checks',
      'Passed video check',
      'Typed text',
      'Typed w/ typical speed',
      'reCAPTCHA score',
      'Pangram AI likelihood',
      'Unique IP address',
      'Other'
    ]);

  var screeningDescQ = form.addParagraphTextItem()
    .setTitle('Please describe how you recruited participants in the first stage')
    .setRequired(true);

  // -----------------------------------------------------------------
  // METRIC PAGES: 7 standard metrics (Ask + Detail for each)
  // -----------------------------------------------------------------
  // Each metric gets two pages:
  //   askPage:    "Did you measure [metric]?" Yes/No — with description
  //   detailPage: Rate (%) + Description
  //
  // We store references so we can wire branching in Phase 2.

  var metricPages = []; // { askPage, askQ, detailPage, rateQ, descQ }

  for (var i = 0; i < standardMetrics.length; i++) {
    var m = standardMetrics[i];
    var label = m.name + ' (' + m.category + ')';

    // Ask page
    var askPage = form.addPageBreakItem()
      .setTitle('Metric: ' + label)
      .setHelpText(m.askDesc);

    var askQ = form.addMultipleChoiceItem()
      .setTitle('Did you measure: ' + m.name + '?')
      .setRequired(true);
    // Choices wired in Phase 2

    // Detail page
    var detailPage = form.addPageBreakItem()
      .setTitle(m.name + ' — Details');

    var rateQ = form.addTextItem()
      .setTitle(m.name + ' — Rate (%)')
      .setHelpText(m.detailHint)
      .setRequired(true)
      .setValidation(percentValidation);

    var descQ = form.addTextItem()
      .setTitle(m.name + ' — Description')
      .setHelpText(
        'Briefly describe how you implemented this metric. ' +
        'Your approach does not need to match the reference definition exactly.'
      )
      .setRequired(false);

    metricPages.push({
      askPage: askPage,
      askQ: askQ,
      detailPage: detailPage,
      rateQ: rateQ,
      descQ: descQ
    });
  }

  // -----------------------------------------------------------------
  // OTHER METRIC PAGES: 3 slots for custom metrics
  // -----------------------------------------------------------------
  //
  // Branching logic: If "No" on Other 1 → skip 2 & 3 → Overall.
  // If "No" on Other 2 → skip 3 → Overall.
  // This way the user is only asked about a next "other" metric if
  // they said "Yes" to the previous one.

  var NUM_OTHER_SLOTS = 3;
  var otherMetricPages = []; // { askPage, askQ, detailPage, ... }

  // Question text varies per slot for natural phrasing
  var otherAskTitles = [
    'Did you use an additional data quality metric not listed in the previous sections?',
    'Did you use any further data quality metric not yet mentioned?',
    'Did you use yet another data quality metric?'
  ];

  for (var j = 0; j < NUM_OTHER_SLOTS; j++) {
    var slotNum = j + 1;

    // Ask page
    var otherAskPage = form.addPageBreakItem()
      .setTitle('Additional Metric ' + slotNum)
      .setHelpText(
        'If you tracked a data quality metric that does not fit any of the ' +
        'standard categories above (classic checks, video check, typed text, ' +
        'typing speed, reCAPTCHA, Pangram, unique IP), you can report it here.'
      );

    var otherAskQ = form.addMultipleChoiceItem()
      .setTitle(otherAskTitles[j])
      .setRequired(true);
    // Choices wired in Phase 2

    // Detail page
    var otherDetailPage = form.addPageBreakItem()
      .setTitle('Additional Metric ' + slotNum + ' — Details');

    var otherNameQ = form.addTextItem()
      .setTitle('Additional Metric ' + slotNum + ' — Name')
      .setHelpText('What is this metric called?')
      .setRequired(true);

    var otherCategoryQ = form.addMultipleChoiceItem()
      .setTitle('Additional Metric ' + slotNum + ' — Category')
      .setHelpText(
        'Which data quality concern does this metric address?\n' +
        '- Attention: captures human inattention or carelessness\n' +
        '- AI/Bot: detects AI agents, LLM-generated responses, or automated submissions\n' +
        '- Fraud: identifies duplicate accounts, fake identities, or fraudulent participation'
      )
      .setRequired(true)
      .setChoiceValues(['Attention', 'AI/Bot', 'Fraud']);

    var otherRateQ = form.addTextItem()
      .setTitle('Additional Metric ' + slotNum + ' — Rate (%)')
      .setHelpText('Percentage of respondents who passed this check (0–100)')
      .setRequired(true)
      .setValidation(percentValidation);

    var otherDescQ = form.addParagraphTextItem()
      .setTitle('Additional Metric ' + slotNum + ' — Description')
      .setHelpText(
        'Please describe the exact measurement, the threshold you used, and ' +
        'any validation (e.g., "text similarity score > 0.2 comparing keystroke-reconstructed ' +
        'text to final submission", "no duplicate device fingerprint via Fingerprint.com").'
      )
      .setRequired(true);

    otherMetricPages.push({
      askPage: otherAskPage,
      askQ: otherAskQ,
      detailPage: otherDetailPage,
      nameQ: otherNameQ,
      categoryQ: otherCategoryQ,
      rateQ: otherRateQ,
      descQ: otherDescQ
    });
  }

  // -----------------------------------------------------------------
  // PAGE: Overall Data Quality (Optional)
  // -----------------------------------------------------------------

  var pageOverallQuality = form.addPageBreakItem()
    .setTitle('Overall Data Quality')
    .setHelpText(
      'This section asks for your overall composite data quality pass rate — ' +
      'the percentage of respondents who passed all of your combined quality ' +
      'criteria.\n\n' +
      'For example, in Celebi et al. (2026), "all main checks passed" is defined ' +
      'as the share of respondents who simultaneously satisfy all five main data ' +
      'quality checks: passed classic checks, passed video check, typed text, ' +
      'typed with typical speed, and unique IP address.\n\n' +
      'Your overall measure may combine a different set of checks. Please describe ' +
      'which checks you combined and how a respondent qualifies as "passing" overall.\n\n' +
      'This field is optional.'
    );

  var overallRateQ = form.addTextItem()
    .setTitle('Overall data quality pass rate (%)')
    .setHelpText(
      'The percentage of respondents who passed your combined quality criteria (0–100). ' +
      'For example, if you required respondents to pass all attention checks AND have ' +
      'a unique IP AND not be flagged by an AI detector, what share satisfied all conditions?'
    )
    .setRequired(false)
    .setValidation(percentValidation);

  var overallDescQ = form.addParagraphTextItem()
    .setTitle('Description of overall quality measure')
    .setHelpText(
      'Describe which checks were combined and what "passing" means. For example:\n' +
      '- "Passed all 5 main checks: classic attention, video check, typed text, ' +
      'typed with typical speed, and unique IP"\n' +
      '- "Passed 2 of 3 attention checks and reCAPTCHA score >= 0.9"\n' +
      '- "Not flagged by GPTZero and passed instructed-response item"'
    )
    .setRequired(false);

  // -----------------------------------------------------------------
  // PAGE: Study Metadata
  // -----------------------------------------------------------------

  var pageMetadata = form.addPageBreakItem()
    .setTitle('Study Metadata')
    .setHelpText('Additional information about your study\'s availability and status.');

  var preRegQ = form.addMultipleChoiceItem()
    .setTitle('Is this study pre-registered?')
    .setRequired(false)
    .setChoiceValues(['Yes', 'No']);

  var preRegLinkQ = form.addTextItem()
    .setTitle('Pre-registration link')
    .setHelpText('Provide if pre-registered')
    .setRequired(false);

  var paperLinkQ = form.addTextItem()
    .setTitle('Paper or study link')
    .setRequired(false);

  var dataAvailQ = form.addMultipleChoiceItem()
    .setTitle('Data Availability')
    .setRequired(false)
    .setChoiceValues([
      'Publicly available',
      'Available upon request',
      'Will be publicly available upon publication',
      'Not publicly available'
    ]);

  var pubStatusQ = form.addMultipleChoiceItem()
    .setTitle('Publication Status')
    .setRequired(false)
    .setChoiceValues([
      'Published',
      'Working paper available',
      'Paper not yet available'
    ]);


  // ═══════════════════════════════════════════════════════════════════
  // PHASE 2: WIRE UP BRANCHING
  // ═══════════════════════════════════════════════════════════════════
  //
  // Now that all pages exist, we can set up navigation choices.

  // -----------------------------------------------------------------
  // Recruitment branching: A → Two-Stage, B → Platform Screening
  // -----------------------------------------------------------------

  recruitmentQ.setChoices([
    recruitmentQ.createChoice(
      'Participants from a previous study who passed certain data quality checks (two-stage recruitment)',
      pageTwoStage
    ),
    recruitmentQ.createChoice(
      'Participants recruited from the platform with certain screening criteria',
      metricPages[0].askPage
    )
  ]);

  // After Two-Stage details → go to first metric
  // (relies on sequential flow since Two-Stage is followed by the first metric page)
  // If setGoToPage works: explicit skip. If not: sequential order handles it.
  pageTwoStage.setGoToPage(metricPages[0].askPage);

  // -----------------------------------------------------------------
  // Standard metric branching: Yes → Detail, No → Next Ask
  // -----------------------------------------------------------------

  for (var k = 0; k < metricPages.length; k++) {
    var mp = metricPages[k];

    // Determine the "next" page after this metric
    var nextPage;
    if (k < metricPages.length - 1) {
      // Next standard metric's ask page
      nextPage = metricPages[k + 1].askPage;
    } else {
      // After last standard metric → first "Other" slot ask page
      nextPage = otherMetricPages[0].askPage;
    }

    // Wire the Yes/No choices
    mp.askQ.setChoices([
      mp.askQ.createChoice('Yes', mp.detailPage),
      mp.askQ.createChoice('No', nextPage)
    ]);

    // After filling in details → go to next metric
    mp.detailPage.setGoToPage(nextPage);
  }

  // -----------------------------------------------------------------
  // Other metric branching:
  //   "No" on any Other slot → skip ALL remaining Other slots → Overall
  //   "Yes" → Detail → next Other slot's Ask page (or Overall if last)
  // -----------------------------------------------------------------

  for (var n = 0; n < otherMetricPages.length; n++) {
    var omp = otherMetricPages[n];

    // "Yes" detail → goes to the next Other ask (or Overall if last)
    var nextAfterDetail;
    if (n < otherMetricPages.length - 1) {
      nextAfterDetail = otherMetricPages[n + 1].askPage;
    } else {
      nextAfterDetail = pageOverallQuality;
    }

    // "No" → skip all remaining Other slots → go straight to Overall
    var noTarget = pageOverallQuality;

    omp.askQ.setChoices([
      omp.askQ.createChoice('Yes', omp.detailPage),
      omp.askQ.createChoice('No', noTarget)
    ]);

    // After filling in details → go to next Other slot (or Overall)
    omp.detailPage.setGoToPage(nextAfterDetail);
  }


  // ═══════════════════════════════════════════════════════════════════
  // LOG RESULTS
  // ═══════════════════════════════════════════════════════════════════

  var totalPages = 2 + 3 + (standardMetrics.length * 2) + (NUM_OTHER_SLOTS * 2) + 2;
  // Page 1 (intro) + Page 2 (sample) + Page 3/3A/3B/3C (recruitment) +
  // 7 * 2 (standard metrics) + 3 * 2 (other metrics) + Overall + Metadata

  Logger.log('══════════════════════════════════════════');
  Logger.log('Form created successfully!');
  Logger.log('');
  Logger.log('Edit URL:    ' + form.getEditUrl());
  Logger.log('Public URL:  ' + form.getPublishedUrl());
  Logger.log('Form ID:     ' + form.getId());
  Logger.log('');
  Logger.log('Total sections created: ~' + totalPages);
  Logger.log('Standard metrics: ' + standardMetrics.length);
  Logger.log('Other metric slots: ' + NUM_OTHER_SLOTS);
  Logger.log('══════════════════════════════════════════');
  Logger.log('');
  Logger.log('BRANCHING SUMMARY:');
  Logger.log('  Screening criteria (approval, country, min studies) on Recruitment page — always shown');
  Logger.log('  Recruitment A (two-stage) → Two-Stage Details → First metric');
  Logger.log('  Recruitment B (platform)  → First metric directly');
  Logger.log('  Each standard metric: Yes → Detail page → Next metric');
  Logger.log('  Each standard metric: No  → Next metric directly');
  Logger.log('  Other metric 1: No → skip Other 2 & 3 → Overall Quality');
  Logger.log('  Other metric 2: No → skip Other 3 → Overall Quality');
  Logger.log('  Other metric 3: No → Overall Quality');
  Logger.log('  Overall Quality → Study Metadata → Submit');
  Logger.log('');
  Logger.log('NEXT STEPS:');
  Logger.log('1. Open the Edit URL above to review the form');
  Logger.log('2. Preview the form and test all branching paths');
  Logger.log('3. Go to Responses tab → Link to Sheets to connect a spreadsheet');
  Logger.log('4. In the spreadsheet, add an "Approved" column (Column A) for moderation');
  Logger.log('5. Publish the sheet: File → Share → Publish to web → CSV');
  Logger.log('6. Update the csvUrl in js/config.js with the new published CSV URL');
}
