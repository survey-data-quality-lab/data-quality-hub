#!/bin/bash
# Data Quality Hub — Submit Mission Possible paper data
# Usage: bash scripts/submit-paper-data.sh
#
# Submits 9 entries from "Mission Possible: The Collection of High-Quality Data"
# by Çelebi, Exley, Harrs, Kivimaki, Serra-Garcia & Yusof (2026)
#
# ANSWER IDs (the inner IDs used for POST, not the question IDs)
# Date field uses _year/_month/_day suffixes (Google Forms date picker)

FORM_URL="https://docs.google.com/forms/d/e/1FAIpQLSfhwduzGfQl-vvU59Jm8R-U8QAGhR7PsE0XApvJLtC1tURObQ/formResponse"

RESEARCHER="Çelebi, Exley, Harrs, Kivimaki, Serra-Garcia & Yusof"
AFFILIATION="University of Vienna, University of Michigan, UC San Diego, University of Stuttgart"
STUDY_TITLE="Mission Possible: The Collection of High-Quality Data"
STUDY_LINK=""
STUDY_DESC="Evidence-based assessment of data quality across five online survey platforms and laboratory benchmarks, comparing attention checks, video comprehension, typed text analysis, typing speed, and unique IP detection."
QUALITY_DESC="Combined pass rate for all five data quality checks (classic attention, video attention, typed text, typing speed, unique IP)"
QUALITY_DESC_2ND="Combined pass rate for all five data quality checks after two-stage screening"

submit() {
  local platform="$1"
  local sample_size="$2"
  local study_year="$3"
  local study_month="$4"
  local study_day="$5"
  local recruitment="$6"
  local stage="$7"
  local overall_rate="$8"
  local quality_desc="$9"
  local attention_rate="${10}"
  local attention_desc="${11}"
  local ai_rate="${12}"
  local ai_desc="${13}"
  local fraud_rate="${14}"
  local fraud_desc="${15}"
  local other1_name="${16}"
  local other1_rate="${17}"
  local other1_desc="${18}"
  local other2_name="${19}"
  local other2_rate="${20}"
  local other2_desc="${21}"
  local study_desc="${22}"
  local notes="${23}"

  local result
  result=$(curl -s -o /dev/null -w "%{http_code}" "$FORM_URL" \
    --data-urlencode "entry.1963181326=$RESEARCHER" \
    --data-urlencode "entry.85079298=$AFFILIATION" \
    --data-urlencode "entry.922883871=$STUDY_TITLE" \
    --data-urlencode "entry.1524998877=$STUDY_LINK" \
    --data-urlencode "entry.1430705517=$platform" \
    --data-urlencode "entry.1278581784=$sample_size" \
    --data-urlencode "entry.917548678_year=$study_year" \
    --data-urlencode "entry.917548678_month=$study_month" \
    --data-urlencode "entry.917548678_day=$study_day" \
    --data-urlencode "entry.1585946288=$recruitment" \
    --data-urlencode "entry.1287529605=$stage" \
    --data-urlencode "entry.1080494118=$overall_rate" \
    --data-urlencode "entry.1519438551=$quality_desc" \
    --data-urlencode "entry.1469448153=$attention_rate" \
    --data-urlencode "entry.613334208=$attention_desc" \
    --data-urlencode "entry.1247420935=$ai_rate" \
    --data-urlencode "entry.1231155518=$ai_desc" \
    --data-urlencode "entry.1224298642=$fraud_rate" \
    --data-urlencode "entry.1389589153=$fraud_desc" \
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

echo "Submitting Mission Possible paper data..."
echo ""

# 1. Lab
submit "Lab" "314" "2025" "8" "1" "Other" "" \
  "80" "$QUALITY_DESC" \
  "84" "Classic multiple-choice attention check" \
  "" "" \
  "" "" \
  "Video Attention Check" "97" "Correctly answered video attention check" \
  "Typed Text (not pasted)" "100" "Typed open-ended responses rather than pasting" \
  "$STUDY_DESC" \
  "Lab: typed text 100%, typing speed 97%"

# 2. MTurk 1st stage
submit "MTurk" "881" "2025" "9" "1" "Two-stage recruitment" "First stage (baseline)" \
  "9" "$QUALITY_DESC" \
  "56" "Classic multiple-choice attention check" \
  "" "" \
  "" "" \
  "Video Attention Check" "20" "Correctly answered video attention check" \
  "Unique IP Address" "79" "No duplicate IP addresses detected" \
  "$STUDY_DESC" \
  "MTurk 1st stage: typed text 19%, typing speed 79%"

# 3. Moblab 1st stage
submit "Moblab" "313" "2025" "10" "1" "Two-stage recruitment" "First stage (baseline)" \
  "55" "$QUALITY_DESC" \
  "85" "Classic multiple-choice attention check" \
  "" "" \
  "" "" \
  "Video Attention Check" "98" "Correctly answered video attention check" \
  "Unique IP Address" "78" "No duplicate IP addresses detected" \
  "$STUDY_DESC" \
  "Moblab 1st stage: typed text 79%, typing speed 77%"

# 4. Moblab 2nd stage
submit "Moblab" "100" "2025" "11" "1" "Two-stage recruitment" "Second stage (main study)" \
  "95" "$QUALITY_DESC_2ND" \
  "99" "Classic multiple-choice attention check" \
  "" "" \
  "" "" \
  "Video Attention Check" "99" "Correctly answered video attention check" \
  "Unique IP Address" "98" "No duplicate IP addresses detected" \
  "$STUDY_DESC" \
  "Moblab 2nd stage: typed text 99%, typing speed 99%"

# 5. Bilendi 1st stage
submit "Bilendi" "366" "2025" "10" "1" "Two-stage recruitment" "First stage (baseline)" \
  "73" "$QUALITY_DESC" \
  "91" "Classic multiple-choice attention check" \
  "" "" \
  "" "" \
  "Video Attention Check" "90" "Correctly answered video attention check" \
  "Unique IP Address" "99" "No duplicate IP addresses detected" \
  "$STUDY_DESC" \
  "Bilendi 1st stage: typed text 92%, typing speed 90%"

# 6. Bilendi 2nd stage
submit "Bilendi" "144" "2025" "11" "1" "Two-stage recruitment" "Second stage (main study)" \
  "93" "$QUALITY_DESC_2ND" \
  "95" "Classic multiple-choice attention check" \
  "" "" \
  "" "" \
  "Video Attention Check" "97" "Correctly answered video attention check" \
  "Unique IP Address" "100" "No duplicate IP addresses detected" \
  "$STUDY_DESC" \
  "Bilendi 2nd stage: typed text 100%, typing speed 99%"

# 7. Prolific 1st stage
submit "Prolific" "900" "2025" "8" "1" "Two-stage recruitment" "First stage (baseline)" \
  "90" "$QUALITY_DESC" \
  "98" "Classic multiple-choice attention check" \
  "" "" \
  "" "" \
  "Video Attention Check" "98" "Correctly answered video attention check" \
  "Unique IP Address" "100" "No duplicate IP addresses detected" \
  "$STUDY_DESC" \
  "Prolific 1st stage: typed text 95%, typing speed 94%"

# 8. Prolific 2nd stage
submit "Prolific" "300" "2025" "9" "1" "Two-stage recruitment" "Second stage (main study)" \
  "93" "$QUALITY_DESC_2ND" \
  "97" "Classic multiple-choice attention check" \
  "" "" \
  "" "" \
  "Video Attention Check" "98" "Correctly answered video attention check" \
  "Unique IP Address" "100" "No duplicate IP addresses detected" \
  "$STUDY_DESC" \
  "Prolific 2nd stage: typed text 98%, typing speed 98%"

echo ""
echo "Done! 8 entries submitted."
echo "Now go to your Google Sheet and type '1' in the Approved column for the new entries."
