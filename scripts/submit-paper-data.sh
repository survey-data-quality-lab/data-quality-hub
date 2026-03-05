#!/bin/bash
# Data Quality Hub — Submit Mission Possible paper data
# Usage: bash scripts/submit-paper-data.sh
#
# Submits 9 entries from "Mission Possible: The Collection of High-Quality Data"
# by Çelebi, Exley, Harrs, Kivimaki, Serra-Garcia & Yusof (2026)
#
# NEW ENTRY IDS (updated March 2026 after form edit)

FORM_URL="https://docs.google.com/forms/d/e/1FAIpQLSfhwduzGfQl-vvU59Jm8R-U8QAGhR7PsE0XApvJLtC1tURObQ/formResponse"

RESEARCHER="Çelebi, Exley, Harrs, Kivimaki, Serra-Garcia & Yusof"
AFFILIATION="University of Vienna, University of Michigan, UC San Diego, University of Stuttgart"
STUDY_TITLE="Mission Possible: The Collection of High-Quality Data"
STUDY_LINK=""
QUALITY_DESC="Combined pass rate for all five data quality checks (classic attention, video attention, typed text, typing speed, unique IP)"
QUALITY_DESC_2ND="Combined pass rate for all five data quality checks after two-stage screening"

submit() {
  local platform="$1"
  local sample_size="$2"
  local study_date="$3"    # YYYY-MM-DD format
  local recruitment="$4"
  local stage="$5"
  local overall_rate="$6"
  local quality_desc="$7"
  local attention_rate="$8"
  local attention_desc="$9"
  local ai_rate="${10}"
  local ai_desc="${11}"
  local fraud_rate="${12}"
  local fraud_desc="${13}"
  local other1_name="${14}"
  local other1_rate="${15}"
  local other1_desc="${16}"
  local other2_name="${17}"
  local other2_rate="${18}"
  local other2_desc="${19}"
  local study_desc="${20}"
  local notes="${21}"

  local result
  result=$(curl -s -o /dev/null -w "%{http_code}" "$FORM_URL" \
    --data-urlencode "entry.1025924398=$RESEARCHER" \
    --data-urlencode "entry.1753712777=$AFFILIATION" \
    --data-urlencode "entry.553660695=$STUDY_TITLE" \
    --data-urlencode "entry.1294449217=$STUDY_LINK" \
    --data-urlencode "entry.1348448374=$platform" \
    --data-urlencode "entry.1709553096=$sample_size" \
    --data-urlencode "entry.479876277=$study_date" \
    --data-urlencode "entry.307649121=$recruitment" \
    --data-urlencode "entry.1221093619=$stage" \
    --data-urlencode "entry.1105656283=$overall_rate" \
    --data-urlencode "entry.1169083885=$quality_desc" \
    --data-urlencode "entry.1693394084=$attention_rate" \
    --data-urlencode "entry.1188972179=$attention_desc" \
    --data-urlencode "entry.1263469340=$ai_rate" \
    --data-urlencode "entry.1439346069=$ai_desc" \
    --data-urlencode "entry.45396690=$fraud_rate" \
    --data-urlencode "entry.2035716411=$fraud_desc" \
    --data-urlencode "entry.1709639059=$other1_name" \
    --data-urlencode "entry.1678687352=$other1_rate" \
    --data-urlencode "entry.118511467=$other1_desc" \
    --data-urlencode "entry.527222764=$other2_name" \
    --data-urlencode "entry.1008897191=$other2_rate" \
    --data-urlencode "entry.2016243872=$other2_desc" \
    --data-urlencode "entry.514324026=$study_desc" \
    --data-urlencode "entry.1071273851=$notes")

  echo "  $platform ($stage): HTTP $result"
}

echo "Submitting Mission Possible paper data..."
echo ""

# 1. AI Agents
submit "AI Agents" "240" "2025-10-01" "Other" "" \
  "0" "$QUALITY_DESC" \
  "99" "Classic multiple-choice attention check" \
  "" "" \
  "" "" \
  "Video Attention Check" "17" "Correctly answered video attention check" \
  "Typed Text (not pasted)" "45" "Typed open-ended responses rather than pasting" \
  "AI agents (GPT-4, Claude, Gemini) completing surveys to benchmark detection methods" \
  "Typing speed pass rate: 8%"

# 2. Lab
submit "Lab" "314" "2025-08-01" "Other" "" \
  "80" "$QUALITY_DESC" \
  "84" "Classic multiple-choice attention check" \
  "" "" \
  "" "" \
  "Video Attention Check" "97" "Correctly answered video attention check" \
  "Typed Text (not pasted)" "100" "Typed open-ended responses rather than pasting" \
  "In-person laboratory sessions at UC San Diego (Summer/Fall 2025)" \
  "Typing speed pass rate: 97%"

# 3. MTurk 1st stage
submit "MTurk" "881" "2025-09-01" "Two-stage recruitment" "First stage (baseline)" \
  "9" "$QUALITY_DESC" \
  "56" "Classic multiple-choice attention check" \
  "" "" \
  "" "" \
  "Video Attention Check" "20" "Correctly answered video attention check" \
  "Unique IP Address" "79" "No duplicate IP addresses detected" \
  "First-stage data collection on Amazon Mechanical Turk" \
  "Typed text pass rate: 19%. Typing speed pass rate: 79%"

# 4. Moblab 1st stage
submit "Moblab" "313" "2025-10-01" "Two-stage recruitment" "First stage (baseline)" \
  "55" "$QUALITY_DESC" \
  "85" "Classic multiple-choice attention check" \
  "" "" \
  "" "" \
  "Video Attention Check" "98" "Correctly answered video attention check" \
  "Unique IP Address" "78" "No duplicate IP addresses detected" \
  "First-stage data collection on Moblab platform" \
  "Typed text pass rate: 79%. Typing speed pass rate: 77%"

# 5. Moblab 2nd stage
submit "Moblab" "100" "2025-11-01" "Two-stage recruitment" "Second stage (main study)" \
  "95" "$QUALITY_DESC_2ND" \
  "99" "Classic multiple-choice attention check" \
  "" "" \
  "" "" \
  "Video Attention Check" "99" "Correctly answered video attention check" \
  "Unique IP Address" "98" "No duplicate IP addresses detected" \
  "Second-stage data collection on Moblab after screening" \
  "Typed text pass rate: 99%. Typing speed pass rate: 99%"

# 6. Bilendi 1st stage
submit "Bilendi" "366" "2025-10-01" "Two-stage recruitment" "First stage (baseline)" \
  "73" "$QUALITY_DESC" \
  "91" "Classic multiple-choice attention check" \
  "" "" \
  "" "" \
  "Video Attention Check" "90" "Correctly answered video attention check" \
  "Unique IP Address" "99" "No duplicate IP addresses detected" \
  "First-stage data collection on Bilendi platform" \
  "Typed text pass rate: 92%. Typing speed pass rate: 90%"

# 7. Bilendi 2nd stage
submit "Bilendi" "144" "2025-11-01" "Two-stage recruitment" "Second stage (main study)" \
  "93" "$QUALITY_DESC_2ND" \
  "95" "Classic multiple-choice attention check" \
  "" "" \
  "" "" \
  "Video Attention Check" "97" "Correctly answered video attention check" \
  "Unique IP Address" "100" "No duplicate IP addresses detected" \
  "Second-stage data collection on Bilendi after screening" \
  "Typed text pass rate: 100%. Typing speed pass rate: 99%"

# 8. Prolific 1st stage
submit "Prolific" "900" "2025-08-01" "Two-stage recruitment" "First stage (baseline)" \
  "90" "$QUALITY_DESC" \
  "98" "Classic multiple-choice attention check" \
  "" "" \
  "" "" \
  "Video Attention Check" "98" "Correctly answered video attention check" \
  "Unique IP Address" "100" "No duplicate IP addresses detected" \
  "First-stage data collection on Prolific Academic" \
  "Typed text pass rate: 95%. Typing speed pass rate: 94%"

# 9. Prolific 2nd stage
submit "Prolific" "300" "2025-09-01" "Two-stage recruitment" "Second stage (main study)" \
  "93" "$QUALITY_DESC_2ND" \
  "97" "Classic multiple-choice attention check" \
  "" "" \
  "" "" \
  "Video Attention Check" "98" "Correctly answered video attention check" \
  "Unique IP Address" "100" "No duplicate IP addresses detected" \
  "Second-stage data collection on Prolific after screening" \
  "Typed text pass rate: 98%. Typing speed pass rate: 98%"

echo ""
echo "Done! 9 entries submitted."
echo "Now go to your Google Sheet and type '1' in the Approved column for the new entries."
