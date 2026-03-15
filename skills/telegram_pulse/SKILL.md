# SKILL: Telegram Pulse — Daily Health Reports

**Skill Name:** telegram_pulse
**Version:** 1.0.0
**Used by:** ROOT_ORCHESTRATOR, IMMUNE_AGENT
**Purpose:** Send daily organism health reports and critical alerts via Telegram

---

## Description

The Telegram Pulse skill sends a formatted daily health report to the master's Telegram chat. It includes system vitality, mission alignment percentage, top-performing agent, daily cost, and evolution events. Critical alerts are sent immediately regardless of schedule.

---

## Input Parameters

```yaml
report_type:
  type: string
  required: true
  enum: ["daily_report", "critical_alert", "evolution_summary", "cost_alert"]
  description: "Type of Telegram message to send"
data:
  type: object
  required: true
  description: "Report data payload"
  properties:
    system_vitality:
      type: number
      description: "Current system vitality score (0-1+)"
    mission_alignment:
      type: number
      description: "System-wide mission alignment (0-1)"
    top_agent:
      type: object
      properties:
        name:
          type: string
        alignment:
          type: number
        vitality:
          type: number
    cost_today_usd:
      type: number
      description: "Total API spend today in USD"
    evolution_events:
      type: array
      description: "List of evolution events since last report"
      items:
        type: object
        properties:
          cycle:
            type: integer
          description:
            type: string
          timestamp:
            type: string
    agent_count:
      type: integer
    cycle_count:
      type: integer
    uptime_hours:
      type: number
    alert_message:
      type: string
      description: "For critical_alert type"
    alert_severity:
      type: string
      enum: ["HIGH", "CRITICAL"]
```

---

## Processing Logic

```
telegram_pulse(report_type, data):

  bot_token = env.TELEGRAM_BOT_TOKEN
  chat_id = env.TELEGRAM_CHAT_ID

  IF NOT bot_token OR NOT chat_id:
    return error("NOT_CONFIGURED", "Telegram bot token or chat ID not set")

  SWITCH report_type:

    CASE "daily_report":
      message = format_daily_report(data)

    CASE "critical_alert":
      message = format_critical_alert(data)

    CASE "evolution_summary":
      message = format_evolution_summary(data)

    CASE "cost_alert":
      message = format_cost_alert(data)

  # Send via Telegram Bot API
  result = await http_post(
    "https://api.telegram.org/bot{bot_token}/sendMessage",
    {
      chat_id: chat_id,
      text: message,
      parse_mode: "MarkdownV2",
      disable_web_page_preview: true
    }
  )

  return handle_result(result)


format_daily_report(data):
  vitality_bar = make_bar(data.system_vitality, 10)
  alignment_bar = make_bar(data.mission_alignment, 10)
  status = "HEALTHY" IF data.system_vitality >= 0.618 ELSE "HEALING" IF data.system_vitality >= 0.382 ELSE "CRITICAL"

  lines = [
    "🧬 *ANIMA OS Daily Report*",
    "━━━━━━━━━━━━━━━━━━━━━",
    "",
    "📊 *System Status:* `{status}`",
    "",
    "💛 *Vitality:* {vitality_bar} `{data.system_vitality:.3f}`",
    "🎯 *Alignment:* {alignment_bar} `{format_percent(data.mission_alignment)}`",
    "",
    "🏆 *Top Agent:* `{data.top_agent.name}`",
    "   Alignment: `{format_percent(data.top_agent.alignment)}`",
    "   Vitality: `{data.top_agent.vitality:.3f}`",
    "",
    "💰 *Cost Today:* `${data.cost_today_usd:.4f}`",
    "🤖 *Active Agents:* `{data.agent_count}`",
    "🔄 *Total Cycles:* `{data.cycle_count}`",
    "⏱ *Uptime:* `{data.uptime_hours:.1f}h`",
    ""
  ]

  IF data.evolution_events AND len(data.evolution_events) > 0:
    lines.append("🧪 *Evolution Events:*")
    for event in data.evolution_events[:5]:  # Max 5 events
      lines.append("  • Cycle #{event.cycle}: {escape_md(event.description)}")
    lines.append("")

  lines.append("━━━━━━━━━━━━━━━━━━━━━")
  lines.append("_ANIMA OS v1\\.0\\.0 \\| SOLARIS Engine_")

  return "\n".join(lines)


format_critical_alert(data):
  return "\n".join([
    "🚨 *CRITICAL ALERT \\- ANIMA OS*",
    "━━━━━━━━━━━━━━━━━━━━━",
    "",
    "⚠️ *Severity:* `{data.alert_severity}`",
    "📝 *Details:* {escape_md(data.alert_message)}",
    "",
    "💛 *System Vitality:* `{data.system_vitality:.3f}`",
    "🎯 *Alignment:* `{format_percent(data.mission_alignment)}`",
    "",
    "🔧 *Action Required:* Manual intervention may be needed\\.",
    "Run SOLARIS\\.md to restart if system is frozen\\.",
    "",
    "━━━━━━━━━━━━━━━━━━━━━",
    "_Sent by IMMUNE\\_AGENT \\| {format_time(now())}_"
  ])


format_evolution_summary(data):
  lines = [
    "🧪 *Evolution Cycle Complete*",
    "━━━━━━━━━━━━━━━━━━━━━",
    "",
    "🔄 *Cycle:* `#{data.cycle_count}`",
    "🎯 *Global Alignment:* `{format_percent(data.mission_alignment)}`",
    "💛 *System Vitality:* `{data.system_vitality:.3f}`",
    ""
  ]

  IF data.evolution_events:
    lines.append("📋 *Mutations Applied:*")
    for event in data.evolution_events:
      lines.append("  • {escape_md(event.description)}")

  lines.append("")
  lines.append("━━━━━━━━━━━━━━━━━━━━━")
  lines.append("_EVOLUTION\\_NODE \\| {format_time(now())}_")

  return "\n".join(lines)


format_cost_alert(data):
  return "\n".join([
    "💰 *Cost Alert \\- ANIMA OS*",
    "━━━━━━━━━━━━━━━━━━━━━",
    "",
    "📈 *Daily spend:* `${data.cost_today_usd:.4f}`",
    "⚠️ {escape_md(data.alert_message)}",
    "",
    "━━━━━━━━━━━━━━━━━━━━━",
    "_Cost Tracker \\| {format_time(now())}_"
  ])


make_bar(value, length):
  filled = round(min(value, 1.0) * length)
  empty = length - filled
  IF value >= 0.618:
    return "🟩" * filled + "⬜" * empty
  ELIF value >= 0.382:
    return "🟨" * filled + "⬜" * empty
  ELSE:
    return "🟥" * filled + "⬜" * empty


escape_md(text):
  # Escape MarkdownV2 special characters
  special = ['_', '*', '[', ']', '(', ')', '~', '`', '>', '#', '+', '-', '=', '|', '{', '}', '.', '!']
  for char in special:
    text = text.replace(char, "\\" + char)
  return text


format_percent(value):
  return "{:.1f}%".format(value * 100)
```

---

## Output Format

```json
{
  "success": true,
  "message_id": 12345,
  "chat_id": "-100123456789",
  "report_type": "daily_report",
  "timestamp": "2026-03-15T06:00:00.000Z"
}
```

---

## Error Handling

```
IF bot_token not set:
  return error("NO_TOKEN", "TELEGRAM_BOT_TOKEN not configured — add to .env")

IF chat_id not set:
  return error("NO_CHAT", "TELEGRAM_CHAT_ID not configured — add to .env")

IF Telegram API returns 429 (rate limit):
  wait(retry_after_seconds)
  retry_send()

IF Telegram API returns 400 (bad request):
  # Usually markdown formatting issue
  retry_with_plain_text(strip_markdown(message))

IF Telegram API unreachable:
  queue_message_for_retry()
  fallback_to_discord("#anima-mission-control", message)

IF message too long (> 4096 chars):
  split_at = 4000
  send_part_1(message[:split_at])
  send_part_2(message[split_at:])
```

---

## Supabase Logging

Telegram sends are logged to `anima_agent_logs`:

```json
{
  "agent_name": "telegram_pulse",
  "fractal_depth": 0,
  "phi_weight": 1.0,
  "task_description": "TELEGRAM: {report_type} sent",
  "mission_alignment": 1.0,
  "model_used": "telegram_bot_api",
  "tokens_used": 0,
  "cost_usd": 0.0,
  "cycle_number": 0,
  "vitality_score": 0.0,
  "pi_pulse_timestamp": "ISO-8601"
}
```

---

*The pulse reaches the master. Distance is irrelevant.*
*ANIMA OS v1.0.0*
