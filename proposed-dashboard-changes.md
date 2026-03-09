# Proposed Changes for Data Quality Hub Dashboard

1. Integrate data quality Figure 1 (overall) into the second figure.
   - In the second figure, incorporate the overall data quality summary at the level of the three concern areas:
     - Account Fraud
     - AI and Bots
     - Attention

2. Move the contribution opportunity higher and make it more prominent.
   - Place the contribution opportunity directly below the top-line numbers (e.g., number of studies tracked, etc.).
   - Make the call-to-action more visually prominent than it is currently.

3. Update the header/intro section of the dashboard.
   - Integrate the “why” into the first 2–4 sentences introducing the dashboard.
   - Add icons to the section headers to make the page more lively:
     - Attention: eyes icon
     - AI and Bots: robot icon
     - Account Fraud: a fitting fraud/identity icon (e.g., ID card / user-shield).

4. Update the `What is data quality?` section to use a general concern plus three specific concerns.
   - General concern: whether an observation represents one attentive human participant.
   - Concern 1: Attention / inattention.
   - Concern 2: AI and Bots (AI/LLM-generated responses or other nonhuman/bot responses).
   - Concern 3: Account Fraud (duplicate or ineligible submissions by the same participant).
   - Remove the repeated “many checks can…” language after each item; instead, end the section with one sentence noting that, in principle, many checks can be used to address each concern, and that in the companion paper we propose and validate a set of five simple checks plus a new method for improving data quality called the two-stage approach.

5. Expand study metadata shown in `Explore Metrics and Studies` (credibility fields).
   - When showing study details, add credibility-related metadata:
     - `Data Availability` with one of these values:
       - Publicly available
       - Available upon request
       - Not publicly available
     - `Pre-registration` (available or not).
     - `Paper Status` with these values:
       - Paper not yet available
       - Working paper available
       - Published

Everything else can remain unchanged.