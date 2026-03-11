# Data Quality Hub — Form v2: Technical Handoff

*Prepared by Can's AI assistant for Dear Human Overlord Dr. Sören Harrs (and his AI assistant)*

---

## Live Links

- **Form (public):** https://docs.google.com/forms/d/e/1FAIpQLSeM6jem75hqylsprdyew3nkXDVswuvT5zTvtw0JrM5uXoakyg/viewform?usp=header
- **Response sheet:** https://docs.google.com/spreadsheets/d/1BqRU3NNfeiZP4zrzYgFJdtHWryAjIJAcLzG1GB4qpK8/edit?usp=sharing

Both are currently open-access via link. We can restrict later.

---

## How to Rebuild or Modify the Form

The form is generated programmatically using Google Apps Script. The source code is in `create-data-quality-form.gs` (in this same directory).

### To generate a new form from the script:

1. Go to https://script.google.com and create a **New Project**
2. Delete whatever is in `Code.gs` and paste the entire contents of `create-data-quality-form.gs`
3. Click **Run** (play button) → select `createForm`
4. Authorize when prompted (first run only — it needs permission to create forms)
5. Open **Execution Log** (View → Execution log) to find the new form's Edit URL and Public URL

### To modify the existing form manually:

You can also edit the live form directly in the Google Forms editor. However, be careful with branching — if you add/remove/reorder sections, the navigation wiring may break. For structural changes, it's safer to edit the `.gs` script and regenerate.

### To connect responses to a spreadsheet:

1. Open the form in edit mode
2. Go to the **Responses** tab
3. Click the green Google Sheets icon → "Create a new spreadsheet" (or link to an existing one)
4. In the spreadsheet, manually insert an **"Approved" column as Column A** — set to `1` for rows that should appear on the dashboard
5. To publish as CSV: **File → Share → Publish to web** → select the sheet tab → format: **CSV** → Publish
6. Use the resulting CSV URL in `js/config.js`

---

## Google Forms Branching — What Works and What Doesn't

These are the lessons learned from building and testing this form. Important context for anyone modifying it.

### What CAN branch:

**Radio buttons and dropdowns** can send the respondent to a specific page based on their selection. This is the only reliable branching mechanism in Google Forms. We use `createChoice('Yes', targetPage)` in the script. This powers:

- The recruitment A/B split (two-stage vs. platform screening)
- Every metric's Yes/No question (Yes → detail page, No → skip to next metric)
- "Other" metric chaining (No → skip all remaining "Other" slots)

### What CANNOT branch:

1. **Checkboxes cannot branch.** No conditional navigation based on checkbox selections. That's why each metric gets its own dedicated Yes/No radio-button page rather than a single checkbox list where you tick which metrics you measured.

2. **You cannot conditionally show/hide individual questions within a page.** Google Forms only supports page-level branching, not question-level visibility.

3. **`PageBreakItem.setGoToPage()` is unreliable.** This API method is supposed to set default navigation after completing a section, but in our testing it sometimes caused pages to be skipped unexpectedly. We avoid relying on it where possible. The one place we still use it (`pageTwoStage.setGoToPage(...)`) has a sequential-order fallback — even if it fails, the page order handles it.

### Design decisions driven by these limitations:

- **Screening criteria (approval score, country, min studies) are on the Recruitment page itself**, before the branching question. We originally had them on a separate page that both recruitment paths were supposed to route through, but `setGoToPage` caused Path B to skip it entirely. Putting them on the same page as the branch guarantees everyone sees them.

- **Path B (platform screening) goes directly to the first metric.** Since the screening criteria are already captured on the Recruitment page, there's no need for a separate "Platform Screening Details" page.

- **Each metric is a separate Yes/No page** rather than a checkbox list, because checkboxes can't branch to detail pages.

---

## Current Form Flow

1. **Page 1 — Researcher Info:** email, name, affiliation, study title
2. **Page 2 — Sample Details:** platform, sample size, study start month/year
3. **Page 3 — Recruitment & Eligibility:** approval score, country, min studies, then A/B branch:
   - **Path A (two-stage):** → Two-Stage Details (which quality checks used + describe first-stage recruitment) → first metric
   - **Path B (platform):** → first metric directly
4. **7 standard metrics** (each: Yes/No page → if Yes, detail page with Rate % and Description):
   - Passed Classic Checks (Attention)
   - Passed Video Check (AI/Bot)
   - Typed Text (AI/Bot)
   - Typed w/ Typical Speed (AI/Bot)
   - reCAPTCHA Score (AI/Bot)
   - Pangram AI Likelihood (AI/Bot)
   - Unique IP Address (Fraud)
5. **3 "Other" metric slots** — chained: answering "No" on any slot skips all remaining slots
6. **Overall Data Quality** — optional composite pass rate with description
7. **Study Metadata** — pre-registration, paper link, data availability, publication status

Each standard metric's "ask" page includes a detailed description adapted from Table 1 of the paper (Celebi et al., 2026), worded generally enough that researchers with variations of these measures can still report "Yes."

---

## CSV Column Mapping

This is the column structure produced by form submissions. The "Approved" column (A) is manually inserted and is not part of the form itself.

| Column | Header | Notes |
|--------|--------|-------|
| A | Approved | Manual; `1` = show on dashboard |
| B | Timestamp | Auto-generated by Google Forms |
| C | Contact Email | |
| D | Researcher Name | |
| E | Researcher Affiliation | |
| F | Study Title | |
| G | How many different samples do you plan to contribute? | Informational only |
| H | Platform | Prolific, MTurk, Bilendi, Moblab, CloudResearch, Other |
| I | If Other, please specify | |
| J | Sample Size | |
| K | Study Start Month | January–December |
| L | Study Start Year | 2020–2030 |
| M | Participant quality/approval score | |
| N | Country | |
| O | Minimum number of completed studies/HITs | |
| P | Who was eligible to participate in this study? | Two-stage or Platform |
| Q | What type of data quality checks did you use for screening? | Checkboxes; only filled if two-stage |
| R | Please describe how you recruited participants in the first stage | Only filled if two-stage |
| S | Did you measure: Passed Classic Checks? | Yes / No |
| T | Passed Classic Checks — Rate (%) | Empty if answered No |
| U | Passed Classic Checks — Description | Empty if answered No |
| V | Did you measure: Passed Video Check? | Yes / No |
| W | Passed Video Check — Rate (%) | |
| X | Passed Video Check — Description | |
| Y | Did you measure: Typed Text? | Yes / No |
| Z | Typed Text — Rate (%) | |
| AA | Typed Text — Description | |
| AB | Did you measure: Typed w/ Typical Speed? | Yes / No |
| AC | Typed w/ Typical Speed — Rate (%) | |
| AD | Typed w/ Typical Speed — Description | |
| AE | Did you measure: reCAPTCHA Score? | Yes / No |
| AF | reCAPTCHA Score — Rate (%) | |
| AG | reCAPTCHA Score — Description | |
| AH | Did you measure: Pangram AI Likelihood? | Yes / No |
| AI | Pangram AI Likelihood — Rate (%) | |
| AJ | Pangram AI Likelihood — Description | |
| AK | Did you measure: Unique IP Address? | Yes / No |
| AL | Unique IP Address — Rate (%) | |
| AM | Unique IP Address — Description | |
| AN | Did you use an additional data quality metric not listed in the previous sections? | Yes / No |
| AO | Additional Metric 1 — Name | |
| AP | Additional Metric 1 — Category | Attention, AI/Bot, or Fraud |
| AQ | Additional Metric 1 — Rate (%) | |
| AR | Additional Metric 1 — Description | |
| AS | Did you use any further data quality metric not yet mentioned? | Yes / No |
| AT | Additional Metric 2 — Name | |
| AU | Additional Metric 2 — Category | |
| AV | Additional Metric 2 — Rate (%) | |
| AW | Additional Metric 2 — Description | |
| AX | Did you use yet another data quality metric? | Yes / No |
| AY | Additional Metric 3 — Name | |
| AZ | Additional Metric 3 — Category | |
| BA | Additional Metric 3 — Rate (%) | |
| BB | Additional Metric 3 — Description | |
| BC | Overall data quality pass rate (%) | Optional |
| BD | Description of overall quality measure | Optional |
| BE | Is this study pre-registered? | Yes / No |
| BF | Pre-registration link | |
| BG | Paper or study link | |
| BH | Data Availability | Publicly available / Available upon request / Will be publicly available upon publication / Not publicly available |
| BI | Publication Status | Published / Working paper available / Paper not yet available |

### Column patterns:

- **Each standard metric** produces 3 columns: Yes/No, Rate (%), Description
- **Each "Other" metric** produces 5 columns: Yes/No, Name, Category, Rate (%), Description
- **Cells are empty** when the respondent skipped that metric (answered "No") or took a different recruitment path

### Sample row:

There is a test submission in the sheet — feel free to inspect it. The test data is junk and should be deleted before going live.

---

## Script Architecture (for AI assistants)

The script (`create-data-quality-form.gs`) follows a two-phase pattern required by the Google Forms API:

**Phase 1 — Create all pages:** Every page break, question, and validation is created in sequential order. No branching is set up yet because `createChoice(label, targetPage)` requires the target page to already exist.

**Phase 2 — Wire up branching:** After all pages exist, the script loops through and sets navigation choices on radio-button questions. The key patterns:

```javascript
// Radio button branching (RELIABLE — this is what we use)
askQ.setChoices([
  askQ.createChoice('Yes', detailPage),   // → goes to detail page
  askQ.createChoice('No', nextAskPage)    // → skips to next metric
]);

// Page-level default navigation (UNRELIABLE — avoid where possible)
pageBreakItem.setGoToPage(targetPage);
```

The metric definitions (names, categories, descriptions) are in the `standardMetrics` array at the top of the script. To add/remove/reorder metrics, modify that array and the form structure will adjust automatically.
