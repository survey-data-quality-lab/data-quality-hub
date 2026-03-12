# Proposed Changes for Data Quality Hub Dashboard

## B. Submit / Contribute Your Own Study Results — Multi-Step Form

The submission form is a multi-step wizard. The changes below are organized by page. The revised page order is also specified.

### B1. Page Order

Change the page order so that **Platforms** comes before **Recruitment Method**. Recruitment details are then collected as a sub-section within each platform's data-entry page (see B4). The standalone "Recruitment Method" page is removed. New page sequence:

1. Start / Entry selection
2. Researcher Information
3. Platforms (one data-entry sub-page per selected platform, each containing a Recruitment sub-section)
4. Study Metadata

---

### B2. Page: Researcher Information

**2a. Introductory text**
- Remove the final sentence: *"If your study uses multiple platforms, you provide data for each platform separately."*
- This sentence is confusing and should be deleted entirely.

**2b. Contact Email field**
- Directly below the "Contact Email" field label (and/or the asterisk indicating it is required), add the following sentence in **red text**:
  > *Please provide your institutional email address so we can verify your identity.*

**2c. "Edit Existing Entry" section**
- Remove the "Edit Existing Entry" section from the Researcher Information page.
- This section should only be shown when the user explicitly clicks an "Edit Existing Entry" button on the very first page (the start/entry-selection screen).

**2d. Back button**
- Remove the back button that navigates all the way back to the main start page (i.e., the one that returns to the "would you like to submit?" entry screen).
- Keep only the standard survey "Previous" back button that navigates to the preceding survey page.

---

### B3. Recruitment Options (used in B4 sub-section)

These two options replace the current recruitment method choices. Use these exact labels and descriptions:

**Option 1**
- **Label:** Platform with Standard Screening Criteria
- **Description:** Participants are recruited from the platform using standard criteria, for example country, socio-demographics, study experience, and so on. (Phrasing should make clear that many other similar standard screeners may be used.)

**Option 2**
- **Label:** Two-Stage Recruitment *(title unchanged)*
- **Description:** Recruitment is limited to the subset of high-quality subjects from a screening study.

---

### B4. Per-Platform Data Entry (sub-page for each selected platform)

Each platform selected on the Platforms page gets a dedicated data-entry form. The structure for each platform's form is:

1. **Sample size** — as currently implemented.
2. **Study start date** — as currently implemented.
3. **Recruitment sub-section**
   - The user selects one of the two recruitment options defined in B3.
   - **If "Platform with Standard Screening Criteria" is selected:**
     - Show: Country selection field.
     - Show: Additional screening criteria (free-text field) — for any supplementary screeners applied beyond country.
   - **If "Two-Stage Recruitment" is selected:**
     - Show: Country selection field.
     - Show: Additional screening criteria (free-text field) — in this context, the user should enter what data quality checks were applied to the screening study to determine which participants from that study were eligible for the second-stage study.

---

### B5. Quality Metrics Section

**5a. Metric titles**
- The title of each quality metric in the form must match the metric name as it appears in the Data Quality Metrics list on the dashboard.

**5b. Metric descriptions**
- The description shown when a metric input field is revealed must be taken directly from the corresponding entry in the Data Quality Metrics list. Ensure parity between the two.

**5c. Expand the list of available metrics**
- The list of selectable quality metrics in the form must be expanded to match the full list of metrics shown in the Data Quality Metrics section of the dashboard. Add any metrics that are currently missing.

**5d. Rename "Description" → "Additional Information"**
- For each metric's free-text note field, change the field label from "Description" to "Additional Information".
- Update the placeholder/helper text inside the field to:
  > *Enter any additional information about your measurement approach that may be relevant for interpreting this result. For example, if you deviate from the thresholds that are currently suggested.*

**5e. Overall data quality field**
- Keep the overall data quality field as an optional, always-available metric that sits alongside the other selectable metrics.
- Update the field description text to:
  > *If you have a composite pass rate for your main data quality checks, enter it here.*
- Make the **Additional Information field mandatory** whenever the user enters a numeric value in this field (i.e., if a number is provided, an explanation of how the composite metric is constructed must also be provided).

---

### B6. Page: Study Metadata (last page)

**6a. Section header / introductory text**
- Change the section header or introductory sentence to:
  > *Details about your study that may provide context for your results.*

**6b. Replace "Additional Credibility Information" with a Feedback box**
- Remove the "Additional Credibility Information" field entirely.
- In its place, add a **Feedback** section with the following:
  - **Field label:** Feedback
  - **Question text:**
    > *Please provide us with feedback about your experience submitting your study data.*
    >
    > *Was there anything that you found unclear or confusing? Is there anything we can improve?*
  - **Placeholder text:** *(none — leave the input box empty so we can observe whether people fill it in spontaneously)*