-- ============================================================
-- ANIMA OS — Migration v1.6: tenant_id columns
-- Engine: SOLARIS
--
-- Adds tenant_id to anima_task_queue and anima_agent_logs.
-- Safe to re-run: all operations are guarded by IF NOT EXISTS.
--
-- Apply in Supabase SQL Editor or via psql:
--   psql $DATABASE_URL -f setup/migration_v1.6_tenant_id.sql
-- ============================================================

-- ============================================================
-- STEP 1 — Add tenant_id columns
-- TEXT chosen over UUID for forward compatibility:
-- the dashboard currently uses integer tenant IDs (mission-control
-- base); TEXT accepts both integers and UUID strings without
-- requiring a cast or a second migration later.
-- NULL allowed: existing rows have no tenant, NULL = system/default.
-- ============================================================

DO $$
BEGIN

  -- anima_task_queue.tenant_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'anima_task_queue'
      AND column_name = 'tenant_id'
  ) THEN
    ALTER TABLE anima_task_queue
      ADD COLUMN tenant_id TEXT DEFAULT NULL;

    COMMENT ON COLUMN anima_task_queue.tenant_id IS
      'Tenant identifier for multi-tenant isolation. '
      'NULL = system task or single-tenant deployment. '
      'Set from task_payload.tenant_id by the execution engine.';
  END IF;

  -- anima_agent_logs.tenant_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'anima_agent_logs'
      AND column_name = 'tenant_id'
  ) THEN
    ALTER TABLE anima_agent_logs
      ADD COLUMN tenant_id TEXT DEFAULT NULL;

    COMMENT ON COLUMN anima_agent_logs.tenant_id IS
      'Tenant identifier propagated from the originating task. '
      'Enables per-tenant log filtering and cost attribution.';
  END IF;

END $$;

-- ============================================================
-- STEP 2 — Indexes
--
-- Index strategy:
--   • Simple index on tenant_id alone → fast tenant dashboards
--     (SELECT * FROM logs WHERE tenant_id = ?)
--
--   • Composite index (tenant_id, status) on task_queue →
--     the claim_next_task query filters on both simultaneously
--
--   • Composite index (tenant_id, agent_name) on agent_logs →
--     common pattern: "show all logs for agent X of tenant Y"
--
--   • Composite index (tenant_id, created_at DESC) on agent_logs →
--     timeline queries scoped per tenant
--
-- All created with IF NOT EXISTS — safe to re-run.
-- ============================================================

-- anima_task_queue indexes
CREATE INDEX IF NOT EXISTS idx_task_queue_tenant_id
  ON anima_task_queue(tenant_id);

CREATE INDEX IF NOT EXISTS idx_task_queue_tenant_status
  ON anima_task_queue(tenant_id, status)
  WHERE status IN ('QUEUED', 'RUNNING');

-- anima_agent_logs indexes
CREATE INDEX IF NOT EXISTS idx_agent_logs_tenant_id
  ON anima_agent_logs(tenant_id);

CREATE INDEX IF NOT EXISTS idx_agent_logs_tenant_agent
  ON anima_agent_logs(tenant_id, agent_name);

CREATE INDEX IF NOT EXISTS idx_agent_logs_tenant_created
  ON anima_agent_logs(tenant_id, created_at DESC)
  WHERE archived_at IS NULL;

-- ============================================================
-- STEP 3 — Replace claim_next_task to support tenant filtering
--
-- New signature:
--   claim_next_task(p_user_id UUID, p_tenant_id TEXT DEFAULT NULL)
--
-- Behavior:
--   • p_tenant_id IS NULL  → claims any task for this user
--     (backward-compatible with existing callers)
--   • p_tenant_id = 'X'   → claims only tasks from tenant X
-- ============================================================

CREATE OR REPLACE FUNCTION claim_next_task(
  p_user_id  UUID,
  p_tenant_id TEXT DEFAULT NULL
)
RETURNS anima_task_queue AS $$
DECLARE
  v_task anima_task_queue;
BEGIN
  SELECT * INTO v_task
  FROM anima_task_queue
  WHERE user_id = p_user_id
    AND status  = 'QUEUED'
    -- When p_tenant_id is provided, match exactly.
    -- When NULL, accept all rows (tenant_id = NULL or any value).
    AND (p_tenant_id IS NULL OR tenant_id = p_tenant_id)
  ORDER BY priority DESC, created_at ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  IF FOUND THEN
    UPDATE anima_task_queue
       SET status     = 'RUNNING',
           started_at = NOW()
     WHERE id = v_task.id;

    v_task.status     := 'RUNNING';
    v_task.started_at := NOW();
  END IF;

  RETURN v_task;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- STEP 4 — RLS: extend existing policies to allow tenant reads
--
-- The current policy "auth.uid() = user_id" already isolates
-- rows at the user level.  No structural change is needed for
-- basic multi-tenancy.
--
-- IF you want a super-admin role that can query across tenants
-- without matching user_id, uncomment and adapt the blocks below.
-- ============================================================

-- Example: service-role bypass (only if you use a service key)
-- CREATE POLICY "Service role bypasses tenant RLS on task_queue"
--   ON anima_task_queue FOR ALL
--   USING (auth.role() = 'service_role');

-- Example: service-role bypass on agent logs
-- CREATE POLICY "Service role bypasses tenant RLS on agent_logs"
--   ON anima_agent_logs FOR ALL
--   USING (auth.role() = 'service_role');

-- ============================================================
-- STEP 5 — Verification query (run manually to confirm)
-- ============================================================

-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name IN ('anima_task_queue', 'anima_agent_logs')
--   AND column_name = 'tenant_id'
-- ORDER BY table_name;

-- SELECT indexname, indexdef
-- FROM pg_indexes
-- WHERE tablename IN ('anima_task_queue', 'anima_agent_logs')
--   AND indexname LIKE '%tenant%'
-- ORDER BY tablename, indexname;

-- ============================================================
-- DONE
-- Schema version: 1.6.0
-- Changes:
--   + anima_task_queue.tenant_id   TEXT NULL
--   + anima_agent_logs.tenant_id   TEXT NULL
--   + 5 new indexes (simple + composite + partial)
--   ~ claim_next_task() updated (backward-compatible)
-- ============================================================
