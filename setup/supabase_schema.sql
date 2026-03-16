-- ============================================================
-- ANIMA OS — Supabase Database Schema
-- Version: 1.5.0
-- Engine: SOLARIS
-- Author: Riyad Ketami <riyad@ketami.net>
--
-- Run this once to create all tables, indexes, RLS policies,
-- helper functions, and enable realtime.
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- TABLE 1: anima_agent_logs
-- Records every agent action, routing decision, and output
-- ============================================================

CREATE TABLE IF NOT EXISTS anima_agent_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_name TEXT NOT NULL,
  fractal_depth INTEGER NOT NULL DEFAULT 0 CHECK (fractal_depth >= 0 AND fractal_depth <= 5),
  phi_weight NUMERIC(10, 6) NOT NULL DEFAULT 1.0 CHECK (phi_weight >= 0 AND phi_weight <= 1),
  task_description TEXT NOT NULL DEFAULT '',
  mission_alignment NUMERIC(6, 4) DEFAULT 0.0 CHECK (mission_alignment >= 0 AND mission_alignment <= 1),
  model_used TEXT DEFAULT 'unknown',
  tokens_used INTEGER DEFAULT 0 CHECK (tokens_used >= 0),
  cost_usd NUMERIC(12, 6) DEFAULT 0.0 CHECK (cost_usd >= 0),
  cycle_number INTEGER DEFAULT 0 CHECK (cycle_number >= 0),
  vitality_score NUMERIC(10, 6) DEFAULT 0.0,
  pi_pulse_timestamp TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID NOT NULL,
  archived_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  -- Immune scan results
  immune_scan_result JSONB DEFAULT NULL,
  threat_detected BOOLEAN DEFAULT FALSE,
  threat_severity TEXT DEFAULT NULL CHECK (threat_severity IN (null, 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'))
);

CREATE INDEX idx_agent_logs_user_id ON anima_agent_logs(user_id);
CREATE INDEX idx_agent_logs_agent_name ON anima_agent_logs(agent_name);
CREATE INDEX idx_agent_logs_cycle ON anima_agent_logs(cycle_number);
CREATE INDEX idx_agent_logs_timestamp ON anima_agent_logs(pi_pulse_timestamp DESC);
CREATE INDEX idx_agent_logs_alignment ON anima_agent_logs(mission_alignment);
CREATE INDEX idx_agent_logs_archived ON anima_agent_logs(archived_at) WHERE archived_at IS NULL;
CREATE INDEX idx_agent_logs_threat ON anima_agent_logs(threat_detected, threat_severity) WHERE threat_detected = true;

-- ============================================================
-- TABLE 2: anima_fractal_state
-- Tracks the live state of every agent in the fractal tree
-- ============================================================

CREATE TYPE agent_status AS ENUM ('ALIVE', 'HEALING', 'PRUNED', 'SPAWNING', 'EVOLVING', 'DORMANT', 'QUARANTINED');

CREATE TABLE IF NOT EXISTS anima_fractal_state (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  branch_id TEXT UNIQUE NOT NULL,
  parent_branch TEXT,
  depth_level INTEGER NOT NULL DEFAULT 0 CHECK (depth_level >= 0 AND depth_level <= 5),
  vitality_score NUMERIC(10, 6) DEFAULT 0.0,
  status agent_status DEFAULT 'ALIVE',
  personal_best NUMERIC(10, 6) DEFAULT 0.0,
  global_best NUMERIC(10, 6) DEFAULT 0.0,
  spawn_count INTEGER DEFAULT 0 CHECK (spawn_count >= 0),
  last_heartbeat TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_fractal_user_id ON anima_fractal_state(user_id);
CREATE INDEX idx_fractal_branch ON anima_fractal_state(branch_id);
CREATE INDEX idx_fractal_parent ON anima_fractal_state(parent_branch);
CREATE INDEX idx_fractal_status ON anima_fractal_state(status);
CREATE INDEX idx_fractal_depth ON anima_fractal_state(depth_level);

-- ============================================================
-- TABLE 3: anima_evolution_log
-- Records every evolution cycle, mutations, and structural changes
-- ============================================================

CREATE TABLE IF NOT EXISTS anima_evolution_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cycle_number INTEGER NOT NULL CHECK (cycle_number >= 0),
  global_alignment NUMERIC(6, 4) DEFAULT 0.0 CHECK (global_alignment >= 0 AND global_alignment <= 1),
  personal_best NUMERIC(10, 6) DEFAULT 0.0,
  evolution_triggered BOOLEAN DEFAULT FALSE,
  mutation_description TEXT DEFAULT '',
  branches_pruned INTEGER DEFAULT 0 CHECK (branches_pruned >= 0),
  branches_spawned INTEGER DEFAULT 0 CHECK (branches_spawned >= 0),
  phi_adjustments JSONB DEFAULT '{}'::jsonb, -- Track phi_weight changes per agent
  evolution_timestamp TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_evolution_user_id ON anima_evolution_log(user_id);
CREATE INDEX idx_evolution_cycle ON anima_evolution_log(cycle_number DESC);
CREATE INDEX idx_evolution_timestamp ON anima_evolution_log(evolution_timestamp DESC);

-- ============================================================
-- TABLE 4: anima_cost_tracker
-- Tracks API spend per agent, model, and time period
-- ============================================================

CREATE TABLE IF NOT EXISTS anima_cost_tracker (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_name TEXT NOT NULL,
  model TEXT NOT NULL DEFAULT 'unknown',
  tokens_input INTEGER DEFAULT 0 CHECK (tokens_input >= 0),
  tokens_output INTEGER DEFAULT 0 CHECK (tokens_output >= 0),
  cost_usd NUMERIC(12, 6) DEFAULT 0.0 CHECK (cost_usd >= 0),
  task_type TEXT DEFAULT 'general',
  phi_weight NUMERIC(10, 6) DEFAULT 1.0,
  date DATE DEFAULT CURRENT_DATE,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cost_user_id ON anima_cost_tracker(user_id);
CREATE INDEX idx_cost_agent ON anima_cost_tracker(agent_name);
CREATE INDEX idx_cost_date ON anima_cost_tracker(date DESC);
CREATE INDEX idx_cost_model ON anima_cost_tracker(model);

-- ============================================================
-- TABLE 5: anima_master_profile
-- Stores the master's complete profile (one per user)
-- ============================================================

CREATE TABLE IF NOT EXISTS anima_master_profile (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL,
  profile_json JSONB NOT NULL DEFAULT '{}',
  onboarding_mode TEXT DEFAULT 'SPARK' CHECK (onboarding_mode IN ('SPARK', 'ORACLE', 'WILD')),
  version TEXT DEFAULT '1.0.0',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_master_user_id ON anima_master_profile(user_id);

-- ============================================================
-- TABLE 6: anima_task_queue (NEW v1.5)
-- Task queue for LLM execution pipeline
-- ============================================================

CREATE TYPE task_status AS ENUM ('QUEUED', 'RUNNING', 'DONE', 'FAILED', 'CANCELLED');
CREATE TYPE task_type AS ENUM ('LLM_CALL', 'IMMUNE_SCAN', 'EVOLUTION', 'COMPACTION', 'CUSTOM');

CREATE TABLE IF NOT EXISTS anima_task_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_name TEXT NOT NULL,
  task_type task_type NOT NULL DEFAULT 'LLM_CALL',
  task_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status task_status NOT NULL DEFAULT 'QUEUED',
  priority INTEGER DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
  
  -- Result fields
  result_json JSONB DEFAULT NULL,
  error_message TEXT DEFAULT NULL,
  tokens_used INTEGER DEFAULT 0 CHECK (tokens_used >= 0),
  cost_usd NUMERIC(12, 6) DEFAULT 0.0,
  
  -- Timing
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ DEFAULT NULL,
  completed_at TIMESTAMPTZ DEFAULT NULL,
  
  -- Foreign keys
  user_id UUID NOT NULL,
  agent_log_id UUID REFERENCES anima_agent_logs(id) ON DELETE SET NULL,
  
  -- Immune scan reference
  immune_scan_id UUID DEFAULT NULL
);

CREATE INDEX idx_task_queue_user_id ON anima_task_queue(user_id);
CREATE INDEX idx_task_queue_status ON anima_task_queue(status) WHERE status IN ('QUEUED', 'RUNNING');
CREATE INDEX idx_task_queue_agent ON anima_task_queue(agent_name);
CREATE INDEX idx_task_queue_priority ON anima_task_queue(priority DESC, created_at ASC);
CREATE INDEX idx_task_queue_created ON anima_task_queue(created_at ASC);

-- Function to get next task (atomic claim)
CREATE OR REPLACE FUNCTION claim_next_task(p_user_id UUID)
RETURNS anima_task_queue AS $$
DECLARE
  v_task anima_task_queue;
BEGIN
  SELECT * INTO v_task
  FROM anima_task_queue
  WHERE user_id = p_user_id
    AND status = 'QUEUED'
  ORDER BY priority DESC, created_at ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;
  
  IF FOUND THEN
    UPDATE anima_task_queue
    SET status = 'RUNNING',
        started_at = NOW()
    WHERE id = v_task.id;
    
    v_task.status := 'RUNNING';
    v_task.started_at := NOW();
  END IF;
  
  RETURN v_task;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- HELPER FUNCTION: calculate_vitality
-- Formula: (φ^depth × e^alignment) / (π^cycle_age) × fractal_score
-- ============================================================

CREATE OR REPLACE FUNCTION calculate_vitality(
  p_depth INTEGER,
  p_alignment NUMERIC,
  p_cycle_age INTEGER,
  p_fractal_score NUMERIC
)
RETURNS NUMERIC AS $$
DECLARE
  phi CONSTANT NUMERIC := 1.6180339887;
  pi CONSTANT NUMERIC := 3.1415926535;
  e CONSTANT NUMERIC := 2.7182818284;
  v_result NUMERIC;
BEGIN
  -- Guard against division by zero and overflow
  IF p_cycle_age <= 0 THEN
    p_cycle_age := 1;
  END IF;

  IF p_fractal_score <= 0 THEN
    p_fractal_score := 0.001;
  END IF;

  -- Clamp alignment to valid range
  p_alignment := GREATEST(0.0, LEAST(1.0, p_alignment));

  -- Calculate: (φ^depth × e^alignment) / (π^cycle_age) × fractal_score
  v_result := (POWER(phi, p_depth) * EXP(p_alignment)) / (POWER(pi, LEAST(p_cycle_age, 10))) * p_fractal_score;

  -- Clamp result to reasonable range
  v_result := GREATEST(0.0, LEAST(100.0, v_result));

  RETURN ROUND(v_result, 6);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================
-- HELPER FUNCTION: get_daily_cost_by_agent
-- Returns cost breakdown per agent for a given date
-- ============================================================

CREATE OR REPLACE FUNCTION get_daily_cost_by_agent(
  p_user_id UUID,
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  agent_name TEXT,
  model TEXT,
  total_tokens_input BIGINT,
  total_tokens_output BIGINT,
  total_cost_usd NUMERIC,
  task_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ct.agent_name,
    ct.model,
    SUM(ct.tokens_input)::BIGINT AS total_tokens_input,
    SUM(ct.tokens_output)::BIGINT AS total_tokens_output,
    SUM(ct.cost_usd) AS total_cost_usd,
    COUNT(*)::BIGINT AS task_count
  FROM anima_cost_tracker ct
  WHERE ct.user_id = p_user_id
    AND ct.date = p_date
  GROUP BY ct.agent_name, ct.model
  ORDER BY total_cost_usd DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================
-- HELPER FUNCTION: get_alignment_trend
-- Returns alignment scores over the last N cycles
-- ============================================================

CREATE OR REPLACE FUNCTION get_alignment_trend(
  p_user_id UUID,
  p_last_n INTEGER DEFAULT 20
)
RETURNS TABLE (
  cycle_number INTEGER,
  avg_alignment NUMERIC,
  agent_count BIGINT,
  evolution_timestamp TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    al.cycle_number,
    ROUND(AVG(al.mission_alignment), 4) AS avg_alignment,
    COUNT(DISTINCT al.agent_name)::BIGINT AS agent_count,
    MAX(al.pi_pulse_timestamp) AS evolution_timestamp
  FROM anima_agent_logs al
  WHERE al.user_id = p_user_id
    AND al.archived_at IS NULL
  GROUP BY al.cycle_number
  ORDER BY al.cycle_number DESC
  LIMIT p_last_n;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Every table is scoped to the authenticated user
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE anima_agent_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE anima_fractal_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE anima_evolution_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE anima_cost_tracker ENABLE ROW LEVEL SECURITY;
ALTER TABLE anima_master_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE anima_task_queue ENABLE ROW LEVEL SECURITY;

-- anima_agent_logs policies
CREATE POLICY "Users can view own agent logs"
  ON anima_agent_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own agent logs"
  ON anima_agent_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own agent logs"
  ON anima_agent_logs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own agent logs"
  ON anima_agent_logs FOR DELETE
  USING (auth.uid() = user_id);

-- anima_fractal_state policies
CREATE POLICY "Users can view own fractal state"
  ON anima_fractal_state FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own fractal state"
  ON anima_fractal_state FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own fractal state"
  ON anima_fractal_state FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own fractal state"
  ON anima_fractal_state FOR DELETE
  USING (auth.uid() = user_id);

-- anima_evolution_log policies
CREATE POLICY "Users can view own evolution logs"
  ON anima_evolution_log FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own evolution logs"
  ON anima_evolution_log FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- anima_cost_tracker policies
CREATE POLICY "Users can view own cost data"
  ON anima_cost_tracker FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cost data"
  ON anima_cost_tracker FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- anima_master_profile policies
CREATE POLICY "Users can view own profile"
  ON anima_master_profile FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON anima_master_profile FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON anima_master_profile FOR UPDATE
  USING (auth.uid() = user_id);

-- anima_task_queue policies
CREATE POLICY "Users can view own tasks"
  ON anima_task_queue FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tasks"
  ON anima_task_queue FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks"
  ON anima_task_queue FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tasks"
  ON anima_task_queue FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- ENABLE REALTIME SUBSCRIPTIONS
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE anima_agent_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE anima_fractal_state;
ALTER PUBLICATION supabase_realtime ADD TABLE anima_evolution_log;
ALTER PUBLICATION supabase_realtime ADD TABLE anima_cost_tracker;
ALTER PUBLICATION supabase_realtime ADD TABLE anima_master_profile;
ALTER PUBLICATION supabase_realtime ADD TABLE anima_task_queue;

-- ============================================================
-- AUTO-UPDATE updated_at TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_fractal
  BEFORE UPDATE ON anima_fractal_state
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_master
  BEFORE UPDATE ON anima_master_profile
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- v1.4 ADDITIONS: Onboarding columns for anima_master_profile
-- ============================================================

-- Add onboarding tracking columns (safe to re-run — IF NOT EXISTS equivalent)
DO $$
BEGIN
  -- onboarding_complete column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'anima_master_profile' AND column_name = 'onboarding_complete'
  ) THEN
    ALTER TABLE anima_master_profile ADD COLUMN onboarding_complete BOOLEAN DEFAULT false;
  END IF;

  -- behavioral_log column (WILD mode observation log)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'anima_master_profile' AND column_name = 'behavioral_log'
  ) THEN
    ALTER TABLE anima_master_profile ADD COLUMN behavioral_log JSONB DEFAULT '[]'::jsonb;
  END IF;

  -- oracle_version column (tracks ORACLE re-runs)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'anima_master_profile' AND column_name = 'oracle_version'
  ) THEN
    ALTER TABLE anima_master_profile ADD COLUMN oracle_version INTEGER DEFAULT 1;
  END IF;
END $$;

-- Create index on onboarding_complete for dashboard queries
CREATE INDEX IF NOT EXISTS idx_master_onboarding
  ON anima_master_profile(onboarding_complete);

-- ============================================================
-- DONE
-- Schema version: 1.5.0
-- Tables: 6 (NEW: anima_task_queue)
-- Functions: 4 (NEW: claim_next_task)
-- Policies: 17
-- Realtime: enabled on all tables
-- v1.4: onboarding_complete, behavioral_log, oracle_version
-- v1.5: anima_task_queue with task_status, task_type enums
-- Fix: renamed reserved keyword 'timestamp' → 'evolution_timestamp'
-- ============================================================
