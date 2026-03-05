#!/bin/bash
# Data Quality Hub — Submit test data (made-up papers)
# Usage: bash scripts/submit-test-data.sh
#
# Batch 1: 3 Prolific-only papers (1 two-stage, 2 single-stage)
#   - All have attention check + video attention question data
# Batch 2: Varied platforms, quality levels, stages, and metrics

FORM_URL="https://docs.google.com/forms/d/e/1FAIpQLSfhwduzGfQl-vvU59Jm8R-U8QAGhR7PsE0XApvJLtC1tURObQ/formResponse"

submit() {
  local researcher="$1"
  local affiliation="$2"
  local paper_ref="$3"
  local platform="$4"
  local sample_size="$5"
  local study_date="$6"
  local recruitment="$7"
  local stage="$8"
  local overall_rate="$9"
  local quality_desc="${10}"
  local attention_rate="${11}"
  local attention_desc="${12}"
  local ai_rate="${13}"
  local ai_desc="${14}"
  local fraud_rate="${15}"
  local fraud_desc="${16}"
  local other1_name="${17}"
  local other1_rate="${18}"
  local other1_desc="${19}"
  local study_desc="${20}"
  local notes="${21}"

  local result
  result=$(curl -s -o /dev/null -w "%{http_code}" "$FORM_URL" \
    --data-urlencode "entry.1963181326=$researcher" \
    --data-urlencode "entry.85079298=$affiliation" \
    --data-urlencode "entry.922883871=$paper_ref" \
    --data-urlencode "entry.1430705517=$platform" \
    --data-urlencode "entry.1278581784=$sample_size" \
    --data-urlencode "entry.917548678=$study_date" \
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
    --data-urlencode "entry.1833475543=$study_desc" \
    --data-urlencode "entry.1146672378=$notes")

  echo "  $platform ($stage): HTTP $result"
}

echo "=== BATCH 1: Prolific-only papers ==="
echo ""

# --- Paper 1: Two-stage on Prolific ---
PAPER1_REF="Screening Effectiveness in Online Surveys"
PAPER1_AUTH="Kim & Park"
PAPER1_AFF="Seoul National University"
PAPER1_QDESC="Combined pass rate for attention check, video attention, and AI detection"
PAPER1_QDESC_2ND="Combined pass rate after two-stage screening"

echo "Paper 1: $PAPER1_REF ($PAPER1_AUTH)"

# 1a. Prolific 1st stage
submit "$PAPER1_AUTH" "$PAPER1_AFF" "$PAPER1_REF" \
  "Prolific" "700" "2026-01-01" "Two-stage recruitment" "First stage (baseline)" \
  "87" "$PAPER1_QDESC" \
  "96" "Classic multiple-choice attention check (3 items)" \
  "92" "GPT-detector classifier on open-ended responses" \
  "" "" \
  "Video Attention Check" "94" "Correctly identified content from embedded video clip" \
  "First-stage survey on Prolific testing screening effectiveness" \
  ""

# 1b. Prolific 2nd stage
submit "$PAPER1_AUTH" "$PAPER1_AFF" "$PAPER1_REF" \
  "Prolific" "220" "2026-01-01" "Two-stage recruitment" "Second stage (main study)" \
  "95" "$PAPER1_QDESC_2ND" \
  "99" "Classic multiple-choice attention check (3 items)" \
  "97" "GPT-detector classifier on open-ended responses" \
  "" "" \
  "Video Attention Check" "98" "Correctly identified content from embedded video clip" \
  "Second-stage survey on Prolific after screening low-quality respondents" \
  ""

echo ""

# --- Paper 2: Single-stage on Prolific ---
PAPER2_REF="Attention Patterns in Longitudinal Web Surveys"
PAPER2_AUTH="Rodriguez & Chen"
PAPER2_AFF="University of Michigan"

echo "Paper 2: $PAPER2_REF ($PAPER2_AUTH)"

submit "$PAPER2_AUTH" "$PAPER2_AFF" "$PAPER2_REF" \
  "Prolific" "520" "2026-02-01" "Other" "" \
  "83" "Combined pass rate for attention check and video attention question" \
  "93" "Instructed response item embedded mid-survey" \
  "" "" \
  "" "" \
  "Video Attention Check" "89" "Multiple-choice question about a 30-second video stimulus" \
  "Single-stage longitudinal survey on Prolific examining attention decay over time" \
  ""

echo ""

# --- Paper 3: Single-stage on Prolific ---
PAPER3_REF="Participant Engagement Across Survey Formats"
PAPER3_AUTH="Nakamura, Singh & Weber"
PAPER3_AFF="University of Tokyo, London School of Economics"

echo "Paper 3: $PAPER3_REF ($PAPER3_AUTH)"

submit "$PAPER3_AUTH" "$PAPER3_AFF" "$PAPER3_REF" \
  "Prolific" "640" "2026-03-01" "Other" "" \
  "91" "Combined pass rate for attention check and video comprehension" \
  "97" "Two instructed response items (one at beginning, one at end)" \
  "" "" \
  "" "" \
  "Video Attention Check" "95" "Free-text description of short video clip content" \
  "Single-stage experiment comparing text-only vs. multimedia survey formats on Prolific" \
  ""

echo ""
echo "=== BATCH 2: Varied platforms, quality, stages ==="
echo ""

# --- Paper 4: MTurk two-stage (low quality) ---
PAPER4_REF="Data Quality on Mechanical Turk: A 2026 Reassessment"
PAPER4_AUTH="Thompson & Okafor"
PAPER4_AFF="Stanford University, University of Lagos"

echo "Paper 4: $PAPER4_REF ($PAPER4_AUTH)"

# 4a. MTurk 1st stage
submit "$PAPER4_AUTH" "$PAPER4_AFF" "$PAPER4_REF" \
  "MTurk" "800" "2025-12-01" "Two-stage recruitment" "First stage (baseline)" \
  "12" "Combined pass rate for attention, AI detection, and account fraud checks" \
  "51" "Trap question requiring specific response to verify reading" \
  "18" "Binoculars AI text classifier applied to open-ended responses" \
  "72" "IP deduplication and VPN detection via third-party service" \
  "" "" "" \
  "Baseline assessment of MTurk data quality in late 2025" \
  "Typing speed pass rate: 38%"

# 4b. MTurk 2nd stage
submit "$PAPER4_AUTH" "$PAPER4_AFF" "$PAPER4_REF" \
  "MTurk" "180" "2025-12-01" "Two-stage recruitment" "Second stage (main study)" \
  "68" "Combined pass rate after two-stage screening on MTurk" \
  "88" "Trap question requiring specific response to verify reading" \
  "75" "Binoculars AI text classifier applied to open-ended responses" \
  "95" "IP deduplication and VPN detection via third-party service" \
  "" "" "" \
  "Second-stage MTurk study after removing flagged respondents" \
  "Typing speed pass rate: 82%"

echo ""

# --- Paper 5: Cross-platform single-stage (Prolific, MTurk, Bilendi) ---
PAPER5_REF="Cross-Platform Survey Quality Benchmarks"
PAPER5_AUTH="Liu, Müller & Santos"
PAPER5_AFF="ETH Zürich, Universidade de São Paulo"

echo "Paper 5: $PAPER5_REF ($PAPER5_AUTH)"

# 5a. Prolific
submit "$PAPER5_AUTH" "$PAPER5_AFF" "$PAPER5_REF" \
  "Prolific" "450" "2026-01-15" "Other" "" \
  "86" "Combined pass rate across all quality checks" \
  "95" "Instructed manipulation check with free-text justification" \
  "90" "Ensemble classifier (perplexity + stylometric features) on open-ended text" \
  "99" "Duplicate account detection via device fingerprinting" \
  "" "" "" \
  "Identical survey deployed across three platforms simultaneously" \
  ""

# 5b. MTurk
submit "$PAPER5_AUTH" "$PAPER5_AFF" "$PAPER5_REF" \
  "MTurk" "450" "2026-01-15" "Other" "" \
  "22" "Combined pass rate across all quality checks" \
  "58" "Instructed manipulation check with free-text justification" \
  "28" "Ensemble classifier (perplexity + stylometric features) on open-ended text" \
  "65" "Duplicate account detection via device fingerprinting" \
  "" "" "" \
  "Identical survey deployed across three platforms simultaneously" \
  ""

# 5c. Bilendi
submit "$PAPER5_AUTH" "$PAPER5_AFF" "$PAPER5_REF" \
  "Bilendi" "450" "2026-01-15" "Other" "" \
  "76" "Combined pass rate across all quality checks" \
  "91" "Instructed manipulation check with free-text justification" \
  "88" "Ensemble classifier (perplexity + stylometric features) on open-ended text" \
  "98" "Duplicate account detection via device fingerprinting" \
  "" "" "" \
  "Identical survey deployed across three platforms simultaneously" \
  ""

echo ""

# --- Paper 6: Moblab + Bilendi single-stage ---
PAPER6_REF="Panel Recruitment and Response Quality"
PAPER6_AUTH="Andersson & Patel"
PAPER6_AFF="Uppsala University, Indian Institute of Management"

echo "Paper 6: $PAPER6_REF ($PAPER6_AUTH)"

# 6a. Moblab
submit "$PAPER6_AUTH" "$PAPER6_AFF" "$PAPER6_REF" \
  "Moblab" "380" "2026-02-15" "Other" "" \
  "60" "Combined pass rate for attention and AI detection" \
  "86" "Multiple-choice comprehension check after instructions" \
  "78" "Log-likelihood ratio test for LLM-generated text" \
  "" "" \
  "Video Attention Check" "82" "Recall question about video shown during survey" \
  "Single-stage comparison of recruitment panels on economic games" \
  ""

# 6b. Bilendi
submit "$PAPER6_AUTH" "$PAPER6_AFF" "$PAPER6_REF" \
  "Bilendi" "380" "2026-02-15" "Other" "" \
  "79" "Combined pass rate for attention and AI detection" \
  "93" "Multiple-choice comprehension check after instructions" \
  "90" "Log-likelihood ratio test for LLM-generated text" \
  "" "" \
  "Video Attention Check" "91" "Recall question about video shown during survey" \
  "Single-stage comparison of recruitment panels on economic games" \
  ""

echo ""
echo "Done! 14 entries submitted."
echo "Now go to your Google Sheet and type '1' in the Approved column for the new entries."
