-- =============================================
-- BACKTESTING JOURNAL - Supabase Schema
-- Run this in your Supabase SQL Editor
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- TABLE: backtests
-- =============================================
CREATE TABLE IF NOT EXISTS public.backtests (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Asset & Strategy
  asset           TEXT NOT NULL,
  strategy_name   TEXT NOT NULL,
  strategy_description TEXT,
  timeframe       TEXT NOT NULL,

  -- Period
  start_date      DATE NOT NULL,
  end_date        DATE NOT NULL,

  -- Capital
  initial_capital NUMERIC(18, 2) NOT NULL,

  -- Results
  total_return    NUMERIC(10, 4),   -- percentage, e.g. 15.32
  max_drawdown    NUMERIC(10, 4),   -- percentage, e.g. -8.50
  win_rate        NUMERIC(10, 4),   -- percentage, e.g. 62.5
  profit_factor   NUMERIC(10, 4),
  total_trades    INT,
  sharpe_ratio    NUMERIC(10, 4),

  -- Notes & Metadata
  notes           TEXT,
  tags            TEXT[] DEFAULT '{}',

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- ROW LEVEL SECURITY (multi-user isolation)
-- Each user only sees/modifies their own rows
-- =============================================
ALTER TABLE public.backtests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own backtests"
  ON public.backtests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own backtests"
  ON public.backtests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own backtests"
  ON public.backtests FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own backtests"
  ON public.backtests FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================
-- AUTO-UPDATE updated_at on row change
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_backtests_updated
  BEFORE UPDATE ON public.backtests
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =============================================
-- INDEXES for common filter patterns
-- =============================================
CREATE INDEX idx_backtests_user_id   ON public.backtests(user_id);
CREATE INDEX idx_backtests_asset     ON public.backtests(user_id, asset);
CREATE INDEX idx_backtests_created   ON public.backtests(user_id, created_at DESC);
