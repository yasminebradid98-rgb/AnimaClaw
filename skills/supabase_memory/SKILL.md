# SKILL: Supabase Memory Operations

**Skill Name:** supabase_memory
**Version:** 1.0.0
**Used by:** MEMORY_NODE (primary), all agents (via MEMORY_NODE)
**Purpose:** CRUD operations for all anima_ Supabase tables

---

## Description

The Supabase Memory skill provides complete read/write/update/delete operations for all five `anima_*` tables. It handles error recovery with φ-based exponential backoff, batch writes for performance, and ensures all operations are scoped to the authenticated user_id (multi-tenant).

---

## Input Parameters

```yaml
operation:
  type: string
  required: true
  enum: ["read", "write", "update", "delete", "batch_write", "rpc"]
  description: "The database operation to perform"
table:
  type: string
  required: true
  enum: [
    "anima_agent_logs",
    "anima_fractal_state",
    "anima_evolution_log",
    "anima_cost_tracker",
    "anima_master_profile"
  ]
  description: "Target table"
data:
  type: object
  required: false
  description: "Data payload for write/update operations"
filters:
  type: object
  required: false
  description: "Filter conditions for read/update/delete operations"
  properties:
    eq:
      type: object
      description: "Equality filters {column: value}"
    gte:
      type: object
      description: "Greater-than-or-equal filters"
    lte:
      type: object
      description: "Less-than-or-equal filters"
    order:
      type: object
      description: "{column: 'asc' | 'desc'}"
    limit:
      type: integer
      description: "Max rows to return"
batch:
  type: array
  required: false
  description: "Array of data objects for batch_write operation"
rpc_name:
  type: string
  required: false
  description: "Name of Supabase RPC function for rpc operation"
rpc_params:
  type: object
  required: false
  description: "Parameters for RPC function call"
```

---

## Processing Logic

```
supabase_memory(operation, table, data, filters, batch, rpc_name, rpc_params):

  # Authentication: Always scope to current user
  user_id = get_authenticated_user_id()
  IF NOT user_id:
    return error("AUTH_REQUIRED", "No authenticated user — cannot access Supabase")

  SWITCH operation:

    CASE "read":
      query = supabase.from(table).select("*").eq("user_id", user_id)

      IF filters:
        IF filters.eq:
          for col, val in filters.eq:
            query = query.eq(col, val)
        IF filters.gte:
          for col, val in filters.gte:
            query = query.gte(col, val)
        IF filters.lte:
          for col, val in filters.lte:
            query = query.lte(col, val)
        IF filters.order:
          for col, direction in filters.order:
            query = query.order(col, ascending=(direction == "asc"))
        IF filters.limit:
          query = query.limit(filters.limit)

      result = await query
      return handle_result(result)

    CASE "write":
      data.user_id = user_id
      data.created_at = data.created_at OR now()

      result = await supabase.from(table).insert(data)
      return handle_result(result)

    CASE "update":
      IF NOT filters OR NOT filters.eq:
        return error("UNSAFE_UPDATE", "Update requires at least one equality filter")

      query = supabase.from(table).update(data).eq("user_id", user_id)
      for col, val in filters.eq:
        query = query.eq(col, val)

      result = await query
      return handle_result(result)

    CASE "delete":
      IF NOT filters OR NOT filters.eq:
        return error("UNSAFE_DELETE", "Delete requires at least one equality filter")

      query = supabase.from(table).delete().eq("user_id", user_id)
      for col, val in filters.eq:
        query = query.eq(col, val)

      result = await query
      return handle_result(result)

    CASE "batch_write":
      IF NOT batch OR len(batch) == 0:
        return error("EMPTY_BATCH", "Batch array is empty")

      for item in batch:
        item.user_id = user_id

      # Split into φ-sized chunks for reliability
      chunk_size = max(floor(len(batch) * 0.618), 1)
      chunks = split_into_chunks(batch, chunk_size)

      results = []
      for chunk in chunks:
        result = await supabase.from(table).insert(chunk)
        IF result.error:
          # Retry individual items on chunk failure
          for item in chunk:
            item_result = await retry_single(table, item)
            results.append(item_result)
        ELSE:
          results.append(result)

      return {
        success: count(r for r in results if not r.error),
        failed: count(r for r in results if r.error),
        total: len(batch)
      }

    CASE "rpc":
      IF NOT rpc_name:
        return error("NO_RPC", "rpc_name is required for rpc operation")

      params = rpc_params OR {}
      params.p_user_id = user_id

      result = await supabase.rpc(rpc_name, params)
      return handle_result(result)


handle_result(result):
  IF result.error:
    error_info = {
      code: result.error.code,
      message: result.error.message,
      details: result.error.details
    }

    # Retry with φ-based backoff
    IF is_retriable(result.error):
      return retry_with_backoff(original_operation, {
        max_retries: 3,
        base_delay_ms: 1618,  # φ * 1000
        multiplier: 1.618     # φ
      })

    return {success: false, error: error_info}

  return {success: true, data: result.data, count: result.count}


retry_with_backoff(operation, config):
  for attempt in range(config.max_retries):
    delay = config.base_delay_ms * (config.multiplier ^ attempt)
    wait(delay)

    result = execute(operation)
    IF NOT result.error:
      return {success: true, data: result.data, retried: attempt + 1}

  return {success: false, error: "max_retries_exceeded", attempts: config.max_retries}


retry_single(table, item):
  result = await supabase.from(table).insert(item)
  IF result.error:
    return retry_with_backoff(
      lambda: supabase.from(table).insert(item),
      {max_retries: 2, base_delay_ms: 1618, multiplier: 1.618}
    )
  return result
```

---

## Output Format

### Successful Read
```json
{
  "success": true,
  "data": [
    {"id": "uuid", "agent_name": "PRIMARY_CELL", "...": "..."}
  ],
  "count": 1
}
```

### Successful Write
```json
{
  "success": true,
  "data": [
    {"id": "uuid", "created_at": "2026-03-15T12:00:00Z"}
  ]
}
```

### Batch Write Result
```json
{
  "success": 15,
  "failed": 1,
  "total": 16
}
```

### Error
```json
{
  "success": false,
  "error": {
    "code": "23505",
    "message": "duplicate key value violates unique constraint",
    "details": "Key (branch_id)=(uuid) already exists"
  }
}
```

---

## Error Handling

```
Retriable errors (auto-retry with φ backoff):
  - Connection timeout
  - 429 Too Many Requests
  - 500 Internal Server Error
  - 503 Service Unavailable

Non-retriable errors (fail immediately):
  - 400 Bad Request (schema violation)
  - 401 Unauthorized (auth issue)
  - 403 Forbidden (RLS policy violation)
  - 404 Not Found (table/function missing)
  - 409 Conflict (unique constraint)

On persistent failure after all retries:
  - Log failure to local queue (temporary)
  - Alert SUPPORT_CELL
  - Post to Discord #memory-node
  - Continue organism operation (don't crash)
```

---

## Supabase Logging

Meta-logging: the memory skill logs its own operations for observability:

```json
{
  "agent_name": "supabase_memory",
  "fractal_depth": 2,
  "phi_weight": 0.382,
  "task_description": "{operation} on {table}: {summary}",
  "mission_alignment": 1.0,
  "model_used": "supabase_client",
  "tokens_used": 0,
  "cost_usd": 0.0,
  "cycle_number": 0,
  "vitality_score": 0.0,
  "pi_pulse_timestamp": "ISO-8601"
}
```

Meta-logs are batched and written every π × φ minutes to avoid infinite recursion.

---

*Memory is identity. Without memory, there is no organism.*
*ANIMA OS v1.0.0*
