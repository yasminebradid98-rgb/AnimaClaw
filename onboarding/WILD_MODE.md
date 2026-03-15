# WILD MODE — Behavioral Profile Building

**Engine:** SOLARIS v1.4.0
**Time:** 7 days or 50 interactions (whichever comes first)
**Questions:** None

---

## Overview

WILD mode skips structured questions entirely. ANIMA observes the user's behavior — every task, correction, preference signal, and interaction pattern — and builds the Master Profile silently over time.

---

## How It Works

1. User selects WILD mode
2. ANIMA initializes a blank `MASTER_TEMPLATE.json` in Supabase
3. Sets `onboarding_mode = 'WILD'`, `onboarding_complete = false`
4. Begins behavioral observation immediately
5. Every interaction gets logged to `anima_master_profile.behavioral_log`
6. Profile builds progressively as confidence reaches thresholds

---

## Observed Signals

| Signal Type | What Gets Logged | Maps to |
|-------------|-----------------|---------|
| Task type | "automate posting", "analyze data", "write content" | `first_automation`, `content_topics` |
| Platform mentions | "post to TikTok", "check Instagram" | `primary_platform` |
| Tool references | "use Notion", "connect to Stripe" | `tools_stack` |
| Corrections | "don't do X", "I prefer Y" | `system_prohibitions`, `communication_style` |
| Goals mentioned | "I need to hit 10k followers" | `goal_90_days` |
| Frustrations | "I'm stuck on...", "the problem is..." | `main_obstacles` |
| Identity signals | "I'm a...", "my brand is..." | `master_name`, `brand` |
| Business signals | "my clients pay...", "revenue from..." | `business_model` |
| Time references | "I'm in PST", "it's midnight here" | `timezone` |
| Team signals | "my team member...", "I work alone" | `team_structure` |

---

## Behavioral Log Format

Each interaction appends to `behavioral_log` (JSONB array in Supabase):

```json
{
  "timestamp": "2026-03-15T14:30:00Z",
  "type": "task|correction|preference|mention|frustration",
  "raw_signal": "the user's exact words or action",
  "extracted_field": "primary_platform",
  "extracted_value": "TikTok",
  "confidence": 0.72
}
```

---

## Confidence Scoring

Each field has a confidence score (0.0 to 1.0):

| Range | Level | Meaning |
|-------|-------|---------|
| 0.0 – 0.382 | Critical | Insufficient data |
| 0.382 – 0.618 | Low | Needs more signals |
| 0.618 – 1.0 | High | Field is reliable |

The overall profile completeness is the weighted average of all field confidences, using phi-weighted importance:

| Field | Weight |
|-------|--------|
| `master_name` | 1.000 |
| `mission_dna` | 1.000 |
| `primary_platform` | 0.618 |
| `goal_90_days` | 0.618 |
| `main_obstacles` | 0.382 |
| `system_prohibitions` | 0.618 |
| `tools_stack` | 0.382 |
| `communication_style` | 0.382 |
| `business_model` | 0.382 |
| `content_topics` | 0.236 |
| `first_automation` | 0.382 |
| `team_structure` | 0.236 |
| `timezone` | 0.236 |

---

## Completion Thresholds

| Condition | Result |
|-----------|--------|
| Overall confidence >= 0.618 (phi threshold) | Profile considered complete |
| 50 interactions logged | Profile marked complete regardless of confidence |
| 7 calendar days elapsed since WILD start | Profile marked complete regardless |
| User says "show my profile" or "activate" | Profile marked complete immediately |

When complete:
1. `onboarding_complete` set to `true`
2. ANIMA announces: "I believe I understand you now. Here is your profile."
3. Shows extracted profile summary with confidence per field
4. User confirms or requests adjustments
5. Organism boots with built profile

---

## Checking Profile Progress

### In Conversation
Ask ANIMA: "How well do you know me?" or "Show my profile progress."

ANIMA responds with:
- Number of interactions observed
- Fields filled and their confidence scores
- Estimated completion percentage
- Fields still needed (below 0.382 confidence)

### On Dashboard
The MasterProfile component shows:
- Completeness percentage bar
- WILD mode badge
- Per-field confidence indicators
- Behavioral log count

---

## Switching to ORACLE

At any point during WILD observation, the user can switch:
1. Say "Switch to ORACLE mode" or "Let me do the full interview"
2. ANIMA preserves all behavioral observations
3. Generates the ORACLE prompt with pre-filled context from observations
4. After ORACLE completion, merges ORACLE answers over WILD observations
5. `onboarding_mode` changes to `'ORACLE'`

WILD observations are never lost — they supplement whatever mode completes the profile.

---

## Privacy

- Behavioral logs are stored only in the user's Supabase instance
- No data is sent to external services
- User can clear behavioral logs: "Forget what you've learned about me"
- Logs are subject to Supabase RLS — only the authenticated user can access them

---

*No questions. No setup. I learn by watching. Talk to me.*
*ANIMA OS v1.4.0*
