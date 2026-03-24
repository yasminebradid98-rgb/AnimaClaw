-- ═══════════════════════════════════════════════════════════════════
-- migration_v1.7_tenant_secrets.sql
-- BYOLLM: Per-tenant API key storage
--
-- Purpose:
--   Stores each tenant's own LLM provider API keys so the runtime
--   can call OpenAI / Kimi / Groq / etc. directly on behalf of that
--   tenant, without routing through the system's own credentials.
--
-- One row per (tenant_id, provider). Upsert on conflict to update key.
-- Access: service_role only (runtime uses SUPABASE_SERVICE_KEY).
--
-- Run in: Supabase SQL Editor (AnimaClaw project)
-- ═══════════════════════════════════════════════════════════════════

-- ── 1. Table ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS tenant_secrets (
  id             UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id      TEXT        NOT NULL,
  provider       TEXT        NOT NULL,   -- openai | anthropic | kimi | openrouter | gemini | groq | ollama
  api_key        TEXT        NOT NULL,
  model_override TEXT,                   -- optional: tenant's preferred model for this provider
  is_active      BOOLEAN     DEFAULT TRUE NOT NULL,
  created_at     TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at     TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  CONSTRAINT uq_tenant_provider UNIQUE (tenant_id, provider),
  CONSTRAINT chk_provider CHECK (
    provider IN ('openai', 'anthropic', 'kimi', 'openrouter', 'gemini', 'groq', 'ollama')
  )
);

COMMENT ON TABLE tenant_secrets IS
  'BYOLLM: per-tenant LLM API keys. One row per (tenant_id, provider). Service role only.';

COMMENT ON COLUMN tenant_secrets.provider IS
  'Supported: openai | anthropic | kimi | openrouter | gemini | groq | ollama';

COMMENT ON COLUMN tenant_secrets.model_override IS
  'Optional preferred model. If NULL, runtime uses provider default (e.g. gpt-4o for openai).';

-- ── 2. Index ──────────────────────────────────────────────────────

-- Fast lookup by tenant for active keys only
CREATE INDEX IF NOT EXISTS idx_tenant_secrets_active
  ON tenant_secrets(tenant_id, is_active)
  WHERE is_active = TRUE;

-- ── 3. Auto-update updated_at ─────────────────────────────────────

CREATE OR REPLACE FUNCTION _update_tenant_secrets_timestamp()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_tenant_secrets_updated_at ON tenant_secrets;

CREATE TRIGGER trg_tenant_secrets_updated_at
  BEFORE UPDATE ON tenant_secrets
  FOR EACH ROW EXECUTE FUNCTION _update_tenant_secrets_timestamp();

-- ── 4. Row-Level Security ─────────────────────────────────────────
-- Only the service role (runtime) can read or write secrets.
-- Anon / authenticated roles have zero access.

ALTER TABLE tenant_secrets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_full_access" ON tenant_secrets;

CREATE POLICY "service_role_full_access" ON tenant_secrets
  AS PERMISSIVE
  FOR ALL
  TO service_role
  USING (TRUE)
  WITH CHECK (TRUE);

-- ── 5. Helper: upsert a tenant secret ────────────────────────────
-- Usage: SELECT upsert_tenant_secret('tenant-123', 'openai', 'sk-...', 'gpt-4o');

CREATE OR REPLACE FUNCTION upsert_tenant_secret(
  p_tenant_id     TEXT,
  p_provider      TEXT,
  p_api_key       TEXT,
  p_model_override TEXT DEFAULT NULL
)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO tenant_secrets (tenant_id, provider, api_key, model_override, is_active)
  VALUES (p_tenant_id, p_provider, p_api_key, p_model_override, TRUE)
  ON CONFLICT (tenant_id, provider) DO UPDATE
    SET api_key        = EXCLUDED.api_key,
        model_override = COALESCE(EXCLUDED.model_override, tenant_secrets.model_override),
        is_active      = TRUE,
        updated_at     = NOW()
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

COMMENT ON FUNCTION upsert_tenant_secret IS
  'Insert or update a tenant LLM secret. Called from the BYOLLM onboarding API.';
