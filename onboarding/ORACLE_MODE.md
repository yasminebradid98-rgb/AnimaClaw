# ORACLE MODE — Deep Profile Interview

**Engine:** SOLARIS v1.4.0
**Time:** 10-15 minutes
**Questions:** 12 (via external LLM)

---

## Overview

ORACLE is the most thorough onboarding path. The user copies a prompt into any major LLM, answers 12 questions in a natural conversation, and pastes the resulting JSON back into ANIMA OS.

---

## Supported LLMs

| LLM | Status | Notes |
|-----|--------|-------|
| Claude (any version) | Fully supported | Best JSON output quality |
| ChatGPT (GPT-4, GPT-4o) | Fully supported | Reliable JSON formatting |
| Gemini (Pro, Ultra) | Supported | May need "output only JSON" reminder |
| Deepseek | Supported | Good JSON compliance |
| Llama (via Ollama/API) | Supported | JSON quality varies by model size |
| Any instruction-following LLM | Should work | Must support multi-turn conversation |

---

## How to Use

### Step 1: Get the Prompt
The prompt is located at: `onboarding/oracle_prompt.txt`

When ORACLE mode is selected in SOLARIS.md, ANIMA outputs the full prompt inline so the user can copy it directly without opening a separate file.

### Step 2: Paste into LLM
Open your preferred LLM and paste the entire prompt. The LLM will begin the interview immediately.

### Step 3: Answer 12 Questions
The LLM asks one question at a time:

| # | Topic | Maps to |
|---|-------|---------|
| 1 | Identity & brand | `master_name`, `brand` |
| 2 | Mission statement | `mission_dna` |
| 3 | Primary platform | `primary_platform` |
| 4 | Tools & stack | `tools_stack` |
| 5 | 90-day goal | `goal_90_days` |
| 6 | Main obstacles | `main_obstacles` |
| 7 | Communication style | `communication_style` |
| 8 | Business model | `business_model` |
| 9 | Content topics | `content_topics` |
| 10 | First automation | `first_automation` |
| 11 | System prohibitions | `system_prohibitions` |
| 12 | Team & timezone | `team_structure`, `timezone` |

### Step 4: Copy the JSON
After Q12, the LLM outputs a complete `MASTER_TEMPLATE.json`. Copy the entire JSON block (no markdown fences).

### Step 5: Paste Back into ANIMA
Paste the JSON into ANIMA OS (either in the SOLARIS.md conversation or the dashboard onboarding wizard).

---

## JSON Validation

When JSON is pasted, ANIMA validates:

| Check | Rule | On Failure |
|-------|------|------------|
| Valid JSON | Must parse without errors | "Invalid JSON. Please check for missing commas or brackets." |
| Required fields | `master_name`, `mission_dna` must be non-empty | "Missing required field: {field}. Please re-run ORACLE." |
| Type checks | Arrays must be arrays, strings must be strings | Auto-coerce where possible (string to single-item array) |
| Schema match | All expected keys present | Missing keys filled with defaults |
| Phi profile | Must contain `primary_focus_weight` | Added with defaults if missing |

### Malformed JSON Recovery
If the JSON is malformed:
1. ANIMA attempts auto-repair (fix trailing commas, add missing brackets, strip markdown fences)
2. If repair fails, prompts: "The JSON couldn't be parsed. Common fixes: check for missing commas, ensure all strings are quoted, remove any text before/after the JSON block."
3. User can re-paste or re-run ORACLE

---

## Re-running ORACLE

To update an existing profile:
1. Dashboard: Click "Refresh Profile (ORACLE)" on the MasterProfile panel
2. SOLARIS.md: Select ORACLE mode again — ANIMA detects existing profile and merges
3. CLI: Re-run the oracle_prompt.txt conversation

On re-run:
- New values overwrite old values
- `oracle_version` increments by 1
- `updated_at` timestamp refreshes
- Previous profile stored in `anima_evolution_log` as mutation record

---

## Post-Validation Actions

1. Parse and validate JSON
2. Write to Supabase `anima_master_profile` with `onboarding_mode = 'ORACLE'`
3. Set `onboarding_complete = true`
4. Set `oracle_version = 1` (or increment on re-run)
5. Generate `SOUL_TEMPLATE.md` from profile
6. Display confirmation with full profile summary
7. Boot organism

---

*The Oracle sees deep. The organism knows you fully.*
*ANIMA OS v1.4.0*
