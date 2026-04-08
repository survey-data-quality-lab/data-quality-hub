# Pre-Launch Checklist

*Generated: April 2026*

---

## Before Going Live (Blocking)

These are gaps that will cause immediate problems once real researchers submit:

1. **Email verification flow audit** — `web-app.gs` has the `doGet?action=verify` handler, but check whether the current `submit-form.js` flow actually matches what's in `web-app.gs` — they may have drifted.

2. **Delete test submissions** — `forms/README.md` explicitly flags that test data is in the response sheet and must be removed before going live.

3. **Disable "Edit Existing Entry"** — if it's still exposed, researchers can overwrite approved entries.

4. **Consent checkbox** — required for GDPR. Without it there is no legal basis for processing and displaying researcher names.

5. **`TOKEN_SECRET = 'missionpossible'`** in `web-app.gs` — committed to the repo in plaintext. Anyone who finds it can forge verification tokens. Move it to Apps Script's `PropertiesService` before going live.

---

## Legal / Compliance (Should Do Before Launch)

6. **Privacy policy page** — covers what's collected, why, who sees it, how to request deletion. Link it from the footer and from near the email field in the form. Also resolves the Google-as-data-processor DPA gap if Google's terms are referenced.

7. **Accuracy + non-affiliation disclaimer** — a footer statement: self-reported data, not independently verified, not affiliated with any listed platform. Needed to limit defamation/disparagement exposure.

8. **Move Google Sheet + Apps Script to an institutional Google Workspace account** — a personal Google account has no DPA with Google, which is a GDPR compliance problem.

---

## For Smooth Long-Term Operation

These are the things that will quietly cause pain once data accumulates:

9. **Minimum study threshold for platform aggregates** — suppress platform-level trend lines with fewer than ~3 studies, replacing them with "Insufficient data". Without this, one outlier submission shapes the entire platform average and creates disparagement risk.

10. **Internal approver review guide** — `submission-review-policy.md` (Part B) serves this purpose. No separate file needed.

11. **Researcher notification emails on approval/disapproval** — on approval: "Your submission is approved" email with dashboard link; on disapproval: reason + email to researcher. Partially implemented in `web-app.gs` but not yet connected to the review screen UI.

12. **Retraction/withdrawal flag** — add a `retracted` flag that shows a tombstone notice rather than silently deleting entries. Once studies get cited or screenshotted, silent deletion misrepresents the record.

13. **Metric provenance field** — a "Introduced by study" citation field for each custom metric. As the metric list grows, this becomes essential for users to evaluate unfamiliar metrics. Adding it later means a schema change (new columns in the sheet and `HEADERS`/`columnMap`).

14. **Publication consent checkbox** — confirms the researcher's data (not just personal info) may be published on the dashboard.

---

## Automated Review Workflow (Admin Screen Overhaul)

The current admin review screen (`handleAdminReview` in `forms/web-app.gs`) only has two buttons: Approve and Revoke Approval. The full review workflow defined in `submission-review-policy.md` cannot be executed without the following changes. All items below are changes to `web-app.gs` only — no frontend or sheet schema changes required except where noted.

### 15. Add a Status column to the Data Sheet

Add a new column `Status` to the Data Sheet HEADERS (after column DO, making it column DP, index 119). Values: `Pending` / `Approved` / `Rejected` / `Query`.

- Set to `Pending` when a row is first written by `buildRow()`.
- Updated by the admin review screen actions below.
- `csv-parser.js` columnMap needs a new entry: `'Status': 'status'` (display only, not used for filtering).
- The dashboard filter in `csv-parser.js` already uses `approved === '1'` and `emailConfirmed === '1'` — this new column is for admin tracking only and does not change the visibility logic.

### 16. Extend the admin review screen with three action buttons

Replace the current single Approve / Revoke Approval button with three buttons rendered for every submission regardless of current approval state:

**Approve button** (green)
- Sets column A = `1`, column Status = `Approved`.
- Sends the approval email to the researcher (column E) using the template from `submission-review-policy.md`.
- Already partially implemented via `handleAdminApprove` — add the outgoing researcher email and Status column write.

**Reject button** (red)
- Renders a dropdown of rejection reason codes R1–R10 (from `submission-review-policy.md`) and a free-text field for a one-sentence specific explanation.
- On submit: sets column A = `''`, column Status = `Rejected`, writes `REJECTED: [code] — [text]` to column O (Feedback).
- Sends the rejection email to the researcher using the template from `submission-review-policy.md`.
- Currently the disapprove handler clears column A but sends no email and writes no reason. This replaces and extends it.

**Send Query button** (amber)
- Renders a text area for the reviewer to type numbered questions.
- On submit: sets column Status = `Query`, writes `QUERY: [date] — [questions]` to column O (Feedback), leaves column A blank.
- Sends the Under Query email to the researcher using the template from `submission-review-policy.md`, with the questions inserted.
- **Not currently implemented at all** — new action required (`action=query` in `doGet`, new `handleAdminQuery` function).

### 17. Fix: delay admin notification until after email verification

Currently `handleSubmit()` calls `sendAdminNotification()` immediately at line 289, before the researcher has verified their email. Move `sendAdminNotification()` into `handleVerify()`, called only after `emailConfirmed` is successfully set to `1`. This ensures admins are only notified for verified submissions.

### 18. Fix: send re-verification email on submission update

`handleUpdate()` currently clears `emailConfirmed` to `''` (line 331) but never sends a new verification email. After clearing, generate a new token and call `sendVerificationEmail()`. Also reset Status to `Pending` so the updated entry re-enters the review queue visibly.

### 19. Add admin notification for updated submissions (post-query)

When `handleUpdate()` is called for a submission that has Status = `Query` (i.e., a researcher responding to a query), send a new admin notification email after re-verification. Subject: `DQH: Updated submission from [email] — was Under Query`. Without this, admins have no signal that the researcher has responded.

### 20. Show submission status badge on the admin review screen

The review screen currently shows only "Approved" / "Not Approved" and "Email Verified" / "Email Not Verified" badges. Add a third badge for Status: Pending (grey) / Approved (green) / Rejected (red) / Query (amber). This gives the reviewer immediate context on where a submission stands before taking any action.

---

## Priority Order

| Priority | Item |
|---|---|
| Blocking | Token secret out of repo (#5), delete test data (#2), consent checkbox (#4) |
| Before launch | Privacy policy (#6), disclaimer (#7), email flow audit (#1), disable edit (#3) |
| First week | Institutional Google account (#8), approval emails (#11), fix admin notification timing (#17) |
| Before first real submissions | Full admin screen overhaul (#15, #16, #18, #19, #20) |
| Before data accumulates | Min study threshold (#9), retraction flag (#12), metric provenance (#13), re-verification on update (#18) |
