-- ═══════════════════════════════════════════════════════════════════
-- migration_v1.8_metadata_column.sql
-- Semantic memory foundation: metadata JSONB on anima_agent_logs
--
-- Purpose:
--   Adds a structured metadata column to store arbitrary context
--   alongside each log entry. This is the bridge column before
--   pgvector is enabled — embeddings will be stored here as a
--   float[] array until the vector extension is activated.
--
-- Metadata schema (convention, not enforced):
--   {
--     "tags":       ["research", "ai"],   -- searchable labels
--     "source":     "web_search",         -- origin of knowledge
--     "confidence": 0.92,                 -- reliability score
--     "embedding":  [0.12, -0.34, ...],   -- future: pgvector float[]
--     "references": ["url1", "url2"]      -- external sources
--   }
--
-- Run in: Supabase SQL Editor (AnimaClaw project)
-- ═══════════════════════════════════════════════════════════════════

-- ── 1. Add metadata column ────────────────────────────────────────

ALTER TABLE anima_agent_logs
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}' NOT NULL;

COMMENT ON COLUMN anima_agent_logs.metadata IS
  'Structured context: tags, source, confidence, references. '
  'Future: embedding float[] for pgvector semantic search.';

-- ── 2. GIN index for fast JSONB key/value queries ─────────────────
-- Enables: WHERE metadata @> '{"tags": ["research"]}'
-- and:     WHERE metadata ? 'embedding'

CREATE INDEX IF NOT EXISTS idx_agent_logs_metadata
  ON anima_agent_logs USING GIN (metadata);

-- ── 3. Partial index: rows that already have embeddings ───────────
-- Ready for the day pgvector is activated — zero migration needed then.

CREATE INDEX IF NOT EXISTS idx_agent_logs_has_embedding
  ON anima_agent_logs ((metadata ? 'embedding'))
  WHERE metadata ? 'embedding';
