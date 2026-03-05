#!/bin/bash
# Data Quality Hub — Generate k test studies
# Usage: bash scripts/generate-test-data.sh [k]
#   k = number of studies to generate (default: 6)
#
# Submits fake papers with varied platforms, quality levels, and stages.
# Remember to approve rows in the Google Sheet (set Approved column = 1).
#
# Updated March 2026 with current form entry IDs.

set -e

K="${1:-6}"

FORM_URL="https://docs.google.com/forms/d/e/1FAIpQLSfhwduzGfQl-vvU59Jm8R-U8QAGhR7PsE0XApvJLtC1tURObQ/formResponse"

# --- Pools for randomization ---

RESEARCHERS=(
  "Kim & Park"
  "Rodriguez & Chen"
  "Nakamura, Singh & Weber"
  "Thompson & Okafor"
  "Liu, Müller & Santos"
  "Andersson & Patel"
  "García & Williams"
  "Yamamoto & Fischer"
  "Petrov, Okonkwo & Li"
  "Johansson & Kapoor"
  "Schmidt, Alonso & Nguyen"
  "Ivanova & Tanaka"
  "Hassan & O'Brien"
  "Kowalski & Fernandez"
  "Björk, Chandra & Lee"
)

AFFILIATIONS=(
  "Seoul National University"
  "University of Michigan"
  "University of Tokyo, London School of Economics"
  "Stanford University, University of Lagos"
  "ETH Zürich, Universidade de São Paulo"
  "Uppsala University, Indian Institute of Management"
  "Universidad de Buenos Aires, MIT"
  "Kyoto University, Max Planck Institute"
  "Moscow State University, Peking University"
  "Stockholm School of Economics"
  "University of Mannheim, INSEAD"
  "St. Petersburg State University"
  "American University of Beirut, Trinity College Dublin"
  "University of Warsaw, Universitat de Barcelona"
  "KTH Royal Institute of Technology"
)

TITLES=(
  "Screening Effectiveness in Online Surveys"
  "Attention Patterns in Longitudinal Web Surveys"
  "Participant Engagement Across Survey Formats"
  "Data Quality on Mechanical Turk: A 2026 Reassessment"
  "Cross-Platform Survey Quality Benchmarks"
  "Panel Recruitment and Response Quality"
  "Bot Detection in Economic Experiments"
  "The Effect of Incentives on Survey Attention"
  "AI-Generated Responses in Social Science Surveys"
  "Comparing Data Quality Across European Panels"
  "Respondent Authenticity in Online Labor Markets"
  "Two-Stage Screening: When Does It Help?"
  "Survey Satisficing and AI Detection"
  "Platform Differences in Participant Attention"
  "Response Quality in Mobile vs Desktop Surveys"
)

PLATFORMS=("Prolific" "MTurk" "Bilendi" "Moblab" "Lab")

ATTENTION_DESCS=(
  "Classic multiple-choice attention check"
  "Instructed response item embedded mid-survey"
  "Trap question requiring specific response to verify reading"
  "Instructed manipulation check with free-text justification"
  "Multiple-choice comprehension check after instructions"
  "Two instructed response items (one at beginning, one at end)"
)

AI_DESCS=(
  "GPT-detector classifier on open-ended responses"
  "Binoculars AI text classifier applied to open-ended responses"
  "Ensemble classifier (perplexity + stylometric features) on open-ended text"
  "Log-likelihood ratio test for LLM-generated text"
  "Perplexity-based detector on free-text responses"
)

VIDEO_DESCS=(
  "Correctly identified content from embedded video clip"
  "Multiple-choice question about a 30-second video stimulus"
  "Free-text description of short video clip content"
  "Recall question about video shown during survey"
)

# Random integer in range [min, max]
rand_range() {
  local min=$1 max=$2
  echo $(( RANDOM % (max - min + 1) + min ))
}

# Pick random element from array
pick() {
  local arr=("$@")
  local idx=$(( RANDOM % ${#arr[@]} ))
  echo "${arr[$idx]}"
}

submit() {
  local researcher="$1"
  local affiliation="$2"
  local title="$3"
  local study_link="$4"
  local platform="$5"
  local sample_size="$6"
  local study_date="$7"
  local recruitment="$8"
  local stage="$9"
  local overall_rate="${10}"
  local quality_desc="${11}"
  local attention_rate="${12}"
  local attention_desc="${13}"
  local ai_rate="${14}"
  local ai_desc="${15}"
  local fraud_rate="${16}"
  local fraud_desc="${17}"
  local other1_name="${18}"
  local other1_rate="${19}"
  local other1_desc="${20}"
  local other2_name="${21}"
  local other2_rate="${22}"
  local other2_desc="${23}"
  local study_desc="${24}"
  local notes="${25}"

  local result
  result=$(curl -s -o /dev/null -w "%{http_code}" "$FORM_URL" \
    --data-urlencode "entry.1025924398=$researcher" \
    --data-urlencode "entry.1753712777=$affiliation" \
    --data-urlencode "entry.553660695=$title" \
    --data-urlencode "entry.1294449217=$study_link" \
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

  echo "  [$platform] $stage: HTTP $result"
}

echo "Generating $K test studies..."
echo ""

ENTRY_COUNT=0

for (( i=1; i<=K; i++ )); do
  # Pick random metadata
  idx=$(( (i - 1) % ${#RESEARCHERS[@]} ))
  researcher="${RESEARCHERS[$idx]}"
  affiliation="${AFFILIATIONS[$idx]}"
  title="${TITLES[$idx]}"

  # Random date in 2025-2026
  year=$(pick "2025" "2026")
  month=$(printf "%02d" $(rand_range 1 12))
  study_date="${year}-${month}-01"

  # Decide: two-stage (40% chance) or single (60%)
  is_two_stage=0
  if (( RANDOM % 5 < 2 )); then
    is_two_stage=1
  fi

  # Pick 1-3 platforms
  num_platforms=$(rand_range 1 3)
  # Shuffle platforms
  shuffled_platforms=($(printf '%s\n' "${PLATFORMS[@]}" | shuf))
  selected_platforms=("${shuffled_platforms[@]:0:$num_platforms}")

  echo "Study $i: $title ($researcher)"
  echo "  Platforms: ${selected_platforms[*]} | Two-stage: $is_two_stage"

  for platform in "${selected_platforms[@]}"; do
    # Base quality depends on platform
    case "$platform" in
      Prolific) base_quality=$(rand_range 80 95) ;;
      Lab)      base_quality=$(rand_range 75 95) ;;
      Bilendi)  base_quality=$(rand_range 65 85) ;;
      Moblab)   base_quality=$(rand_range 50 75) ;;
      MTurk)    base_quality=$(rand_range 5 35) ;;
      *)        base_quality=$(rand_range 40 70) ;;
    esac

    attention_rate=$(rand_range $((base_quality)) 99)
    if (( attention_rate > 99 )); then attention_rate=99; fi

    # Maybe have AI detection (60% chance)
    ai_rate=""
    ai_desc=""
    if (( RANDOM % 5 < 3 )); then
      ai_rate=$(rand_range $((base_quality - 10)) 99)
      if (( ai_rate < 0 )); then ai_rate=5; fi
      if (( ai_rate > 99 )); then ai_rate=99; fi
      ai_desc=$(pick "${AI_DESCS[@]}")
    fi

    # Maybe have fraud detection (30% chance)
    fraud_rate=""
    fraud_desc=""
    if (( RANDOM % 10 < 3 )); then
      fraud_rate=$(rand_range 60 100)
      fraud_desc="IP deduplication and VPN detection"
    fi

    # Video attention check as other metric 1 (50% chance)
    other1_name=""
    other1_rate=""
    other1_desc=""
    if (( RANDOM % 2 == 0 )); then
      other1_name="Video Attention Check"
      other1_rate=$(rand_range $((base_quality - 5)) 99)
      if (( other1_rate > 99 )); then other1_rate=99; fi
      if (( other1_rate < 5 )); then other1_rate=5; fi
      other1_desc=$(pick "${VIDEO_DESCS[@]}")
    fi

    sample_size=$(rand_range 150 900)
    attention_desc=$(pick "${ATTENTION_DESCS[@]}")
    quality_desc="Combined pass rate for all data quality checks"

    if (( is_two_stage == 1 )); then
      # 1st stage
      submit "$researcher" "$affiliation" "$title" "" \
        "$platform" "$sample_size" "$study_date" \
        "Two-stage recruitment" "First stage (baseline)" \
        "$base_quality" "$quality_desc" \
        "$attention_rate" "$attention_desc" \
        "$ai_rate" "$ai_desc" \
        "$fraud_rate" "$fraud_desc" \
        "$other1_name" "$other1_rate" "$other1_desc" \
        "" "" "" \
        "First-stage data collection on $platform" \
        ""
      ENTRY_COUNT=$((ENTRY_COUNT + 1))

      # 2nd stage — better quality, smaller N
      second_n=$(rand_range 80 $(( sample_size / 2 )))
      second_overall=$(rand_range $((base_quality + 5)) 99)
      if (( second_overall > 99 )); then second_overall=99; fi
      second_attention=$(rand_range $((attention_rate + 2)) 99)
      if (( second_attention > 99 )); then second_attention=99; fi

      second_ai_rate=""
      if [[ -n "$ai_rate" ]]; then
        second_ai_rate=$(rand_range $((ai_rate + 3)) 99)
        if (( second_ai_rate > 99 )); then second_ai_rate=99; fi
      fi

      second_other1_rate=""
      if [[ -n "$other1_rate" ]]; then
        second_other1_rate=$(rand_range $((other1_rate + 2)) 99)
        if (( second_other1_rate > 99 )); then second_other1_rate=99; fi
      fi

      submit "$researcher" "$affiliation" "$title" "" \
        "$platform" "$second_n" "$study_date" \
        "Two-stage recruitment" "Second stage (main study)" \
        "$second_overall" "Combined pass rate after two-stage screening" \
        "$second_attention" "$attention_desc" \
        "$second_ai_rate" "$ai_desc" \
        "$fraud_rate" "$fraud_desc" \
        "$other1_name" "$second_other1_rate" "$other1_desc" \
        "" "" "" \
        "Second-stage data collection on $platform after screening" \
        ""
      ENTRY_COUNT=$((ENTRY_COUNT + 1))
    else
      # Single stage
      submit "$researcher" "$affiliation" "$title" "" \
        "$platform" "$sample_size" "$study_date" \
        "Other" "" \
        "$base_quality" "$quality_desc" \
        "$attention_rate" "$attention_desc" \
        "$ai_rate" "$ai_desc" \
        "$fraud_rate" "$fraud_desc" \
        "$other1_name" "$other1_rate" "$other1_desc" \
        "" "" "" \
        "Single-stage survey on $platform" \
        ""
      ENTRY_COUNT=$((ENTRY_COUNT + 1))
    fi
  done
  echo ""
done

echo "Done! $ENTRY_COUNT entries submitted across $K studies."
echo "Now go to your Google Sheet and type '1' in the Approved column for the new entries."
