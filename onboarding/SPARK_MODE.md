# SPARK MODE — 60-Second Onboarding

**Engine:** SOLARIS v1.4.0
**Time:** ~60 seconds
**Questions:** 5

---

## Overview

SPARK is the fastest path to activation. Five questions, asked one at a time. ANIMA generates your Master Profile immediately after the fifth answer.

---

## Question Flow

### Q1: Identity
**Prompt:** "Your name and brand?"
**Validation:** Must contain at least 2 characters.
**Maps to:** `master_name`, `brand`
**Parsing:** If answer contains "—", ",", or "at/from/of", split into name (before) and brand (after). If single value, use for both fields.
**If skipped:** `master_name` = "Unnamed", `brand` = "Unnamed Project"

### Q2: Mission
**Prompt:** "Your mission in one sentence?"
**Validation:** Must be between 10 and 500 characters.
**Maps to:** `mission_dna`
**If skipped:** `mission_dna` = "Build and grow with ANIMA OS"

### Q3: Platform
**Prompt:** "Primary platform? (TikTok / Instagram / YouTube / Content / Ecommerce / SaaS / Agency / Other)"
**Validation:** Must match one of the known platforms or be free text.
**Maps to:** `primary_platform`
**Known values:** TikTok, Instagram, YouTube, Twitter, LinkedIn, Shopify, SaaS, Agency, Content, Ecommerce
**If skipped:** `primary_platform` = "General"

### Q4: Challenge
**Prompt:** "Biggest current challenge?"
**Validation:** Must be at least 5 characters.
**Maps to:** `main_obstacles` (wrapped in array as single item)
**If skipped:** `main_obstacles` = ["Not specified"]

### Q5: Prohibition
**Prompt:** "One thing I must NEVER do?"
**Validation:** Any non-empty string.
**Maps to:** `system_prohibitions` (wrapped in array as single item)
**If skipped:** `system_prohibitions` = ["Post or publish without explicit approval"]

---

## MASTER.json Field Mapping

| Question | Fields Populated |
|----------|-----------------|
| Q1 | `master_name`, `brand` |
| Q2 | `mission_dna` |
| Q3 | `primary_platform` |
| Q4 | `main_obstacles` |
| Q5 | `system_prohibitions` |

### Auto-generated fields (not asked):
| Field | Default Value | Source |
|-------|---------------|--------|
| `tools_stack` | `[]` | Empty — populated as tools are used |
| `goal_90_days` | Inferred from mission | Derived from Q2 |
| `communication_style` | `"direct"` | Default |
| `business_model` | `"not_specified"` | Default |
| `content_topics` | `[]` | Populated via behavioral observation |
| `first_automation` | `null` | Asked post-onboarding |
| `team_structure` | `"solo"` | Default |
| `timezone` | System timezone | Auto-detected |
| `phi_profile.primary_focus_weight` | `0.618` | Golden Ratio |
| `phi_profile.support_focus_weight` | `0.382` | Golden Ratio |
| `phi_profile.evolution_frequency` | `"every_pi_squared_cycles"` | Pi constant |
| `oracle_version` | `0` | Not ORACLE mode |

---

## Post-Q5 Actions

1. Generate `MASTER_TEMPLATE.json` from answers + defaults
2. Write to Supabase `anima_master_profile` with `onboarding_mode = 'SPARK'`
3. Set `onboarding_complete = true`
4. Display confirmation:
   ```
   ━━━ PROFILE ACTIVATED ━━━
   Name:     {master_name}
   Brand:    {brand}
   Mission:  {mission_dna}
   Platform: {primary_platform}
   Mode:     SPARK
   ━━━━━━━━━━━━━━━━━━━━━━━━
   Your organism is now alive. What shall we build first?
   ```

---

## Upgrading from SPARK

SPARK profiles can be enriched later:
- Run ORACLE mode to fill in remaining fields
- Behavioral observation (WILD-style) fills gaps over time
- Manual edits via dashboard MasterProfile panel

---

*5 questions. 60 seconds. An organism built around you.*
*ANIMA OS v1.4.0*
