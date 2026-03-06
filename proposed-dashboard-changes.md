# Proposed Changes for Data Quality Hub Dashboard

1. Keep key dropdown sections expanded by default.
   - The content under `Data Quality Hub` and `Explore Metrics and Studies` should be open at all times (not click-to-expand).

2. Update the `What is data quality?` section to use a general concern plus three specific concerns.
   - General concern: whether an observation represents one attentive human participant.
   - Concern 1: inattention.
   - Concern 2: AI/nonhuman responses (AI/LLM-generated responses or bots).
   - Concern 3: account fraud (duplicate submissions by the same participant).
   - Mention that multiple checks can be used for each concern.
   - Mention that the companion paper proposes a simple set of five main checks.

3. Shorten the `Why Data Quality Hub?` text.
   - Keep the explanation concise and practical.

5. Update references area.
   - Let the reference section span full width.
   - Add a link to the `mission-possible` GitHub repository.

6. Keep figure filters expanded by default.
   - For all main figures, users should immediately see available choices for filtering.

7. Make metric selection for specific data quality metrics more prominent using a 2-level selection structure.
   - Level 1: choose one of the three data-quality concerns.
   - Level 2: choose a specific metric within that concern.

8. Initialize the metric list with current paper measures.
   - Start with measures used in the paper.
   - Keep structure extensible so additional checks can be added later.

9. Expand study metadata shown in `Explore Metrics and Studies`.
   - Add `Data Availability` with these values:
     - Publicly available
     - Available upon request
     - Will be publicly available upon publication
     - Not publicly available
   - Add `Pre-registration` status (available or not).
   - Add `Publication status` with these values:
     - Paper not yet available
     - Working paper available
     - Published

10. Expand per-sample/per-paper quality summaries.
    - Show pass rates for attention checks.
    - Show pass rates for AI/LLM bot checks.
    - Show pass rates for account-fraud checks.

11. Fix clipping of `Attention check` text.
    - Widen the relevant display area so the full text is visible.

12. Fix alignment of `N`.
    - Change `N` from right-aligned to left-aligned or centered.
    - Ensure it is visually separated from the date field.

Everything else can remain unchanged.
