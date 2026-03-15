# SKILL: Discord Nerve — Channel Communication

**Skill Name:** discord_nerve
**Version:** 1.0.0
**Used by:** All agents
**Purpose:** Post messages to the correct Discord channel based on agent identity

---

## Description

The Discord Nerve skill is the organism's communication backbone. It routes messages to the correct Discord channel based on the sending agent's name, supports plain text, rich embeds, alerts, and daily reports. All vitality scores are formatted as visual bars for quick scanning.

---

## Input Parameters

```yaml
agent_name:
  type: string
  required: true
  description: "Name of the agent sending the message"
message_type:
  type: string
  required: true
  enum: ["text", "embed", "alert", "heartbeat", "daily_report"]
  description: "Type of message to send"
content:
  type: string
  required: true
  description: "Message text content"
channel_override:
  type: string
  required: false
  description: "Override default channel routing (must be valid channel name)"
embed_data:
  type: object
  required: false
  description: "Rich embed data (for embed type messages)"
  properties:
    title:
      type: string
    description:
      type: string
    color:
      type: string
      description: "Hex color code"
    fields:
      type: array
      items:
        type: object
        properties:
          name:
            type: string
          value:
            type: string
          inline:
            type: boolean
    footer:
      type: string
vitality_data:
  type: object
  required: false
  description: "Vitality information to format as visual bar"
  properties:
    score:
      type: number
    label:
      type: string
```

---

## Channel Routing

```
CHANNEL_MAP = {
  "ROOT_ORCHESTRATOR":  "root-orchestrator",
  "PRIMARY_CELL":       "primary-cell",
  "SUPPORT_CELL":       "support-cell",
  "MEMORY_NODE":        "memory-node",
  "EVOLUTION_NODE":     "evolution-node",
  "IMMUNE_AGENT":       "immune-system",
  "pi_pulse":           "genesis-heartbeat",
  "cost_tracker":       "cost-tracker",
  "master_profile":     "master-profile",
  "system":             "anima-mission-control"
}

resolve_channel(agent_name, channel_override):
  IF channel_override AND channel_override IN CHANNEL_MAP.values():
    return channel_override
  IF agent_name IN CHANNEL_MAP:
    return CHANNEL_MAP[agent_name]
  return "anima-mission-control"  # Default fallback
```

---

## Processing Logic

```
discord_nerve(agent_name, message_type, content, channel_override, embed_data, vitality_data):

  channel = resolve_channel(agent_name, channel_override)
  channel_id = get_channel_id(channel)

  IF NOT channel_id:
    return error("CHANNEL_NOT_FOUND", "Discord channel '{channel}' not found")

  SWITCH message_type:

    CASE "text":
      message = format_text_message(agent_name, content)
      result = await discord.send(channel_id, message)

    CASE "embed":
      embed = build_embed(agent_name, content, embed_data, vitality_data)
      result = await discord.send(channel_id, embed=embed)

    CASE "alert":
      alert = build_alert(agent_name, content, vitality_data)
      result = await discord.send(channel_id, alert)
      # Critical alerts also go to mission control
      IF "CRITICAL" in content:
        await discord.send(
          get_channel_id("anima-mission-control"),
          alert
        )

    CASE "heartbeat":
      heartbeat = format_heartbeat(content, vitality_data)
      result = await discord.send(
        get_channel_id("genesis-heartbeat"),
        heartbeat
      )

    CASE "daily_report":
      report = build_daily_report(content, embed_data)
      result = await discord.send(channel_id, embed=report)

  return handle_result(result)


format_text_message(agent_name, content):
  timestamp = format_time(now(), "HH:mm:ss")
  return "[{timestamp}] **{agent_name}**: {content}"


build_embed(agent_name, content, embed_data, vitality_data):
  color_map = {
    "ALIVE": 0x4cc97b,     # Green
    "HEALING": 0xc9a84c,   # Gold
    "EVOLVING": 0x4c7bc9,  # Blue
    "DORMANT": 0x8a8780,   # Gray
    "CRITICAL": 0xc94c4c   # Red
  }

  embed = {
    title: embed_data.title OR agent_name,
    description: content,
    color: embed_data.color OR determine_color(vitality_data),
    timestamp: now(),
    footer: {text: embed_data.footer OR "ANIMA OS v1.0.0"},
    fields: []
  }

  IF vitality_data:
    bar = format_vitality_bar(vitality_data.score)
    embed.fields.append({
      name: vitality_data.label OR "Vitality",
      value: "{bar} `{vitality_data.score:.3f}`",
      inline: true
    })

  IF embed_data AND embed_data.fields:
    embed.fields.extend(embed_data.fields)

  return embed


build_alert(agent_name, content, vitality_data):
  severity = extract_severity(content)

  prefix_map = {
    "LOW": "ℹ️",
    "MEDIUM": "⚠️",
    "HIGH": "🔶",
    "CRITICAL": "🚨"
  }

  prefix = prefix_map.get(severity, "📋")
  bar = format_vitality_bar(vitality_data.score) IF vitality_data ELSE ""

  return "{prefix} **[{severity}] {agent_name}**\n{content}\n{bar}"


format_heartbeat(content, vitality_data):
  IF vitality_data:
    bar = format_vitality_bar(vitality_data.score)
    status = "🟢" IF vitality_data.score >= 0.618 ELSE "🟡" IF vitality_data.score >= 0.382 ELSE "🔴"
    return "{status} {bar} `{vitality_data.score:.3f}` | {content}"
  return "💓 {content}"


build_daily_report(content, embed_data):
  return {
    title: "📊 ANIMA OS Daily Report",
    description: content,
    color: 0xc9a84c,  # Gold
    timestamp: now(),
    fields: embed_data.fields IF embed_data ELSE [],
    footer: {text: "Generated by ANIMA OS | {format_date(now())}"}
  }


format_vitality_bar(score):
  # 10-segment bar visualization
  filled = round(score * 10)
  empty = 10 - filled

  IF score >= 0.618:
    return "🟩" * filled + "⬜" * empty
  ELIF score >= 0.382:
    return "🟨" * filled + "⬜" * empty
  ELSE:
    return "🟥" * filled + "⬜" * empty


determine_color(vitality_data):
  IF NOT vitality_data:
    return 0xc9a84c  # Default gold

  IF vitality_data.score >= 0.618:
    return 0x4cc97b  # Green
  ELIF vitality_data.score >= 0.382:
    return 0xc9a84c  # Gold/warning
  ELSE:
    return 0xc94c4c  # Red/critical
```

---

## Output Format

```json
{
  "success": true,
  "channel": "primary-cell",
  "message_id": "discord-message-id",
  "message_type": "embed",
  "timestamp": "2026-03-15T12:00:00.000Z"
}
```

---

## Error Handling

```
IF discord_token is not set:
  return error("NO_TOKEN", "DISCORD_BOT_TOKEN not configured in .env")

IF channel not found:
  # Try to create channel via discord_setup
  attempt_channel_creation(channel)
  IF still not found:
    fallback to "anima-mission-control"

IF rate limited (429):
  wait(retry_after_ms)
  retry_send()

IF message too long (> 2000 chars for text, > 4096 for embed):
  split_message(content, max_length=1900)
  send_parts_sequentially()

IF discord API down:
  queue_message_for_retry()
  log_warning("discord_unavailable")
  # Don't block organism operation
```

---

## Supabase Logging

Discord messages are not individually logged (too verbose). Instead, message counts are aggregated in the daily cost tracker:

```json
{
  "agent_name": "discord_nerve",
  "task_type": "communication",
  "cost_usd": 0.0,
  "tokens_used": 0,
  "date": "2026-03-15"
}
```

---

*The nerve carries signals. The organism speaks through me.*
*ANIMA OS v1.0.0*
