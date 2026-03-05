#!/bin/bash
# Data Quality Hub — Submit paper data to Google Form
# Usage: bash scripts/submit-data.sh
#
# This submits the 9 entries from the paper's Table 2.
# Dates are approximate based on the paper's description:
#   Lab: Summer 2025 (UCSD)
#   AI Agents: Aug 2025 – Jan 2026
#   Prolific: ~Aug 2025 (pre-reg #242081)
#   MTurk: ~Sep 2025 (pre-reg #247939)
#   Bilendi: ~Oct 2025 (pre-reg #268364)
#   Moblab: ~Oct 2025 (pre-reg #268364)

FORM_URL="https://docs.google.com/forms/d/e/1FAIpQLSfhwduzGfQl-vvU59Jm8R-U8QAGhR7PsE0XApvJLtC1tURObQ/formResponse"

RESEARCHER="Çelebi, Exley, Harrs, Kivimaki, Serra-Garcia & Yusof"
AFFILIATION="University of Vienna, University of Michigan, UC San Diego, University of Stuttgart"
PAPER_REF="Mission Possible: The Collection of High-Quality Data"
QUALITY_DESC_BASE="Combined pass rate for all five data quality checks (classic attention, video attention, typed text, typing speed, unique IP)"
QUALITY_DESC_2ND="Combined pass rate for all five data quality checks after two-stage screening"

submit_entry() {
  local platform="$1"
  local sample_size="$2"
  local study_date="$3"
  local recruitment="$4"
  local stage="$5"
  local overall_rate="$6"
  local quality_desc="$7"
  local attention_rate="$8"
  local other1_name="$9"
  local other1_rate="${10}"
  local other1_desc="${11}"
  local other2_name="${12}"
  local other2_rate="${13}"
  local other2_desc="${14}"
  local study_desc="${15}"
  local notes="${16}"

  local result
  result=$(curl -s -o /dev/null -w "%{http_code}" "$FORM_URL" \
    --data-urlencode "entry.1963181326=$RESEARCHER" \
    --data-urlencode "entry.85079298=$AFFILIATION" \
    --data-urlencode "entry.922883871=$PAPER_REF" \
    --data-urlencode "entry.1430705517=$platform" \
    --data-urlencode "entry.1278581784=$sample_size" \
    --data-urlencode "entry.917548678=$study_date" \
    --data-urlencode "entry.1585946288=$recruitment" \
    --data-urlencode "entry.1287529605=$stage" \
    --data-urlencode "entry.1080494118=$overall_rate" \
    --data-urlencode "entry.1519438551=$quality_desc" \
    --data-urlencode "entry.1469448153=$attention_rate" \
    --data-urlencode "entry.613334208=Classic multiple-choice attention check" \
    --data-urlencode "entry.1982864965=$other1_name" \
    --data-urlencode "entry.140697627=$other1_rate" \
    --data-urlencode "entry.1729103723=$other1_desc" \
    --data-urlencode "entry.1508874603=$other2_name" \
    --data-urlencode "entry.1585493516=$other2_rate" \
    --data-urlencode "entry.1692023885=$other2_desc" \
    --data-urlencode "entry.1833475543=$study_desc" \
    --data-urlencode "entry.1146672378=$notes")

  echo "  $platform ($stage): HTTP $result"
}

echo "Submitting paper data to Google Form..."
echo ""

# 1. AI Agents
submit_entry "AI Agents" "240" "2025-10-01" "Other" "" \
  "0" "$QUALITY_DESC_BASE" "99" \
  "Video Attention Check" "17" "Correctly answered video attention check" \
  "Typed Text (not pasted)" "45" "Typed open-ended responses rather than pasting" \
  "AI agents (GPT-4, Claude, Gemini) completing surveys to benchmark detection methods" \
  "Typing speed pass rate: 8%"

# 2. Lab
submit_entry "Lab" "314" "2025-08-01" "Other" "" \
  "80" "$QUALITY_DESC_BASE" "84" \
  "Video Attention Check" "97" "Correctly answered video attention check" \
  "Typed Text (not pasted)" "100" "Typed open-ended responses rather than pasting" \
  "In-person laboratory sessions at UC San Diego (Summer/Fall 2025)" \
  "Typing speed pass rate: 97%"

# 3. MTurk 1st stage
submit_entry "MTurk" "881" "2025-09-01" "Two-stage recruitment" "First stage (baseline)" \
  "9" "$QUALITY_DESC_BASE" "56" \
  "Video Attention Check" "20" "Correctly answered video attention check" \
  "Unique IP Address" "79" "No duplicate IP addresses detected" \
  "First-stage data collection on Amazon Mechanical Turk" \
  "Typed text pass rate: 19%. Typing speed pass rate: 79%"

# 4. Moblab 1st stage
submit_entry "Moblab" "313" "2025-10-01" "Two-stage recruitment" "First stage (baseline)" \
  "55" "$QUALITY_DESC_BASE" "85" \
  "Video Attention Check" "98" "Correctly answered video attention check" \
  "Unique IP Address" "78" "No duplicate IP addresses detected" \
  "First-stage data collection on Moblab platform" \
  "Typed text pass rate: 79%. Typing speed pass rate: 77%"

# 5. Moblab 2nd stage
submit_entry "Moblab" "100" "2025-11-01" "Two-stage recruitment" "Second stage (main study)" \
  "95" "$QUALITY_DESC_2ND" "99" \
  "Video Attention Check" "99" "Correctly answered video attention check" \
  "Unique IP Address" "98" "No duplicate IP addresses detected" \
  "Second-stage data collection on Moblab after screening" \
  "Typed text pass rate: 99%. Typing speed pass rate: 99%"

# 6. Bilendi 1st stage
submit_entry "Bilendi" "366" "2025-10-01" "Two-stage recruitment" "First stage (baseline)" \
  "73" "$QUALITY_DESC_BASE" "91" \
  "Video Attention Check" "90" "Correctly answered video attention check" \
  "Unique IP Address" "99" "No duplicate IP addresses detected" \
  "First-stage data collection on Bilendi platform" \
  "Typed text pass rate: 92%. Typing speed pass rate: 90%"

# 7. Bilendi 2nd stage
submit_entry "Bilendi" "144" "2025-11-01" "Two-stage recruitment" "Second stage (main study)" \
  "93" "$QUALITY_DESC_2ND" "95" \
  "Video Attention Check" "97" "Correctly answered video attention check" \
  "Unique IP Address" "100" "No duplicate IP addresses detected" \
  "Second-stage data collection on Bilendi after screening" \
  "Typed text pass rate: 100%. Typing speed pass rate: 99%"

# 8. Prolific 1st stage
submit_entry "Prolific" "900" "2025-08-01" "Two-stage recruitment" "First stage (baseline)" \
  "90" "$QUALITY_DESC_BASE" "98" \
  "Video Attention Check" "98" "Correctly answered video attention check" \
  "Unique IP Address" "100" "No duplicate IP addresses detected" \
  "First-stage data collection on Prolific Academic" \
  "Typed text pass rate: 95%. Typing speed pass rate: 94%"

# 9. Prolific 2nd stage
submit_entry "Prolific" "300" "2025-09-01" "Two-stage recruitment" "Second stage (main study)" \
  "93" "$QUALITY_DESC_2ND" "97" \
  "Video Attention Check" "98" "Correctly answered video attention check" \
  "Unique IP Address" "100" "No duplicate IP addresses detected" \
  "Second-stage data collection on Prolific after screening" \
  "Typed text pass rate: 98%. Typing speed pass rate: 98%"

echo ""
echo "Done! Now go to your Google Sheet and:"
echo "  1. Delete the old entries with date 2024-01-01"
echo "  2. Type '1' in the Approved column for the new entries"
