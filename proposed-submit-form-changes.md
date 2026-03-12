# Submit Form — Text for Review

Copy of all user-facing text in the submit form, in order. Edit here to propose changes.

---

## Landing Card

**Title:** Contribute your study results

**Description:** Help expand the dataset and improve comparisons across platforms.

**"What to include" chips:**
- Platform
- Sample size
- Study date
- Basic study information
- Your name & affiliation
- At least one data quality metric

**Edit note:** Want to update a previously submitted entry? Click "Edit Existing Entry" below.

**Time estimate:** Takes about 5 minutes

**Buttons:**
- Submit New Study
- Edit Existing Entry

---

## Step 1 — Researcher Information

**Step title:** Researcher Information

**Step description:** Please note that only academic researchers can submit study results. Please submit one response per study.

### Fields

**Contact Email** *(required)*
> Warning text: Please provide your institutional email address so we can verify your identity.
> Placeholder: `researcher@university.edu`

**Researcher Name** *(required)*
> Placeholder: `Jane Doe`

**Affiliation** *(required)*
> Placeholder: `University of Example`

**Study Title** *(required)*
> Placeholder: `My Survey Study`

---

## Step 2 — Select Platforms

**Step title:** Select Platforms

**Step description:** Which platforms did you collect data from? Select all that apply, or add custom platforms.

**Known platforms (chips):**
- Prolific
- MTurk
- Bilendi
- Moblab
- CloudResearch

**Custom platform input placeholder:** `Custom platform name…`

**Add button label:** + Add

---

## Step 3 — Platform Detail (one step per platform)

### Subsection: Basic Info

**Sample Size** *(required)*
> Placeholder: *(none)*

**Study Start Date** *(required)*
> Month… / Year… dropdowns

---

### Subsection: Recruitment

**Section label:** Recruitment

**Option 1 — Standard Screening Criteria**
> Participants are recruited from the platform using standard screening criteria (e.g. country, socio-demographics, study experience).

**Option 2 — Two-Stage Recruitment**
> Participation is limited to a subset of high-quality subjects from a screening study.

**Country** *(optional)*
> Placeholder: *(none)*

**Screening Criteria** *(optional; label is the same for both options)*

- When "Standard Screening Criteria" selected:
  - Label: `Screening Criteria`
  - Placeholder: `Describe any screeners applied (e.g., socio-demographics, prior study experience, ...).`

- When "Two-Stage Recruitment" selected:
  - Label: `Screening Criteria`
  - Placeholder: `Describe the data quality checks applied to the screening study to determine which participants were eligible for this two-stage study.`

---

### Subsection: Quality Metrics

**Section label:** Quality Metrics

**Section hint:** Select all metrics you measured. A detail panel appears for each.

**Standard metrics (checkboxes):**

| Metric Name | Category |
|---|---|
| Attention Check | Attention |
| Video Check | AI/Bot |
| Typed Text | AI/Bot |
| Typed with Typical Speed | AI/Bot |
| ReCAPTCHA Score | AI/Bot |
| Pangram AI Detector | AI/Bot |
| Mouse Clicks | AI/Bot |
| Mouse Movements | AI/Bot |
| Unique IP Address | Fraud |
| No Foreign IP Address | Fraud |
| Not in a Geolocation Cluster | Fraud |
| No Duplicate Submission | Fraud |
| No Duplicate Device Fingerprint | Fraud |

**Custom metric input placeholder:** `Custom metric name…`

**Add button label:** + Add

---

### Metric Detail Panel (appears for each selected metric)

**Pass Rate (%)** *(required)*
> Placeholder: `0–100`

**Additional Information** *(optional for standard metrics)*
> Placeholder: `Please enter any additional information relevant for interpreting this result.`

*Note: For custom metrics, "Additional Information" is required (*), and a "Category" dropdown (Attention / AI/Bot / Fraud) also appears.*
*Custom metric Additional Information placeholder: `As you propose a new metric, please explain why this metric can address the selected data quality concern. If there is a validation study for this metric or an academic reference, please provide it.`*

---

### Subsection: Overall Data Quality

**Section label:** Overall Data Quality

**Section hint:** If you have a composite pass rate for a set of main data quality checks, please enter it here.

**Overall Pass Rate (%)** *(optional)*
> Placeholder: `e.g., 78`

**Additional Information** *(required only when Overall Pass Rate is filled)*
> Placeholder: `Please describe how the composite pass rate was constructed. Which individual data quality checks are included?`

---

## Step 4 — Study Metadata

**Step title:** Study Metadata

**Step description:** Details about your study that may provide context for your results.

### Fields

**Is this study pre-registered?** *(required)*
> Options: Yes / No

**Pre-registration Link** *(shown if Yes)*
> Placeholder: `https://osf.io/...`

**Data Availability** *(required)*
> Options:
> - Publicly available
> - Available upon request
> - Will be publicly available upon publication
> - Not publicly available

**Data Repository Link** *(shown if "Publicly available")*
> Placeholder: `https://osf.io/... or https://dataverse.harvard.edu/...`

**Publication Status** *(required)*
> Options:
> - Published
> - Working paper available
> - Paper not yet available

**Paper or Study Link** *(shown if "Published" or "Working paper available")*
> Placeholder: `https://doi.org/...`

---

### Feedback Section

**Label:** Feedback

**Description line 1:** Please provide us with feedback about your experience submitting your study data.

**Description line 2:** Was there anything that you found unclear or confusing? Is there anything we can improve?

*(No placeholder text; free-text area)*

---

## Navigation Buttons

- Back ←
- Next →
- Submit *(last step only)*
