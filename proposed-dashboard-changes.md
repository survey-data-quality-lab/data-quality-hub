# Proposed Changes for Data Quality Hub Dashboard

Reviewed: March 2026

## 1) Submission Form and User Flow

### 1.1 Add explicit publication consent in the survey form
- Add a required consent checkbox before submission:
	- "I confirm that the submitted data may be reviewed and, if approved, published on the Data Quality Hub dashboard."
- Add short privacy text near the email field:
	- "Your email will not be displayed publicly. It is used only for identity verification and communication about your submission."

### 1.2 Update first-page navigation
- Add a Back button on the first submission page (researcher details page) so users can return to the main page.

### 1.3 Disable edit submission for now
- Temporarily disable the Edit Existing Entry / Edit Survey function in the public workflow.
- Keep this feature out of the currently published flow and re-enable only when the updated version is ready.

### 1.4 Clarify when to submit one sample vs multiple samples
- Add guidance text in the form (near sample entry section):
	- Submit separate samples when:
		- Different screeners were used for different samples on the same platform.
		- Different metrics were used.
		- Samples were collected at clearly different time points.
	- Submitting one combined sample is acceptable when these differences are minor or not central to the analysis.

## 2) Email Verification and Authentication Workflow

### 2.1 Change notification timing
- Current behavior: maintainers receive an email immediately after form submission.
- New behavior: maintainers should receive a notification only after the submitter confirms their email address.

### 2.2 Confirmation-based submission flow
- On initial submit:
	- Send confirmation email to submitter.
	- Do not trigger maintainer notification yet.
- After submitter clicks confirmation link:
	- Mark email as confirmed.
	- Trigger maintainer notification email (in the maintainer notification email, there ll be a link as before where we go and can see the entry and there we approve).
 	- During the approve screen reached via email link by the maintainers, if the submission is not approved there should be a text field below where we should provide a reason for not approving it and when we click disapprove an email should be sent to the researcher who submitted it. So the maintainer screen for approavel needs to be slightly modified in terms of UI and also we need to add a new interaction to it that triggers an email sent back to the researcher who submitted it. And also when the data is submitted, an the maintainer approves it an email again should be sent to the researcher who submitted with a predefined text like "Your submission is approved." and then provive the link to the page (main github page) 

### 2.3 Automatic password generation
- Remove user-selected password from the submission process.
- Generate a temporary password automatically as exactly 5 random digits.
- Include this generated password in the confirmation email.
- Storage rules:
	- Do not store this password in the main dashboard data sheet.
	- Store only in the private password/account information sheet.

## 3) Review and Publication Policy (Publicly Stated)

### 3.1 Identity and affiliation verification policy
- Publish a clear policy that entries are reviewed before publication.
- State that submitters must be academic researchers and that affiliation is verified using the institutional/university email domain provided.

### 3.2 Metric acceptance policy
- Publish a policy that accepted metrics must include a rationale showing the metric addresses one or more specific data quality concerns.
- Preferred standard:
	- Metric has prior validation in published work.
	- Submission includes a citation or link to the validating study when available.

### 3.3 Add metric provenance field
- For each metric, add a short metadata field:
	- "Introduced by study" (citation and/or URL).
- Show this in metric details so users can trace the origin of each metric.

## 4) Dashboard and Legal Risk Content Updates

These updates should be aligned with the Legal Risk Review document.

### 4.1 Privacy and data-use transparency
- Add or link a privacy notice/policy covering:
	- What personal data is collected.
	- Why it is collected.
	- What is displayed publicly vs stored privately.
	- How deletion/correction requests can be made.

### 4.2 Accuracy and non-endorsement disclaimers
- Add a visible statement that dashboard data is self-reported by researchers and reviewed before publication, but not independently audited.
- Add non-affiliation language clarifying the hub is an independent academic initiative and not endorsed by listed platforms.

### 4.3 Publication safeguards for aggregated metrics
- Where aggregated platform metrics are shown, include context such as study count/sample size and caution on interpretation when evidence is limited.

## 5) Discussion Forum Onboarding

### 5.1 Add welcome and usage guidance post
- Create a pinned welcome message in the forum.
- Include a short introduction explaining:
	- Purpose of the forum.
	- What kinds of questions/discussion are encouraged.
	- Basic posting expectations and constructive tone.
- Content can be adapted from the old dashboard test GitHub repository.

## 6) Suggested Rollout Order

1. Implement confirmation-based email workflow and automatic password generation.
2. Update submission form (consent checkbox, first-page Back button, sample guidance text) (I have added some extras here such as email sent back to the research on approval or disapproval).
3. Disable Edit Existing Entry in the public flow.
4. Publish review and metric acceptance policies.
5. Add dashboard legal/disclaimer content and privacy links.
6. Publish forum welcome and guidance post.
