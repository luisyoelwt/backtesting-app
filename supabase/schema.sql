-- =============================================
-- BACKTESTING JOURNAL - Supabase Schema
-- Run this in your Supabase SQL Editor
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- TABLE: models (user strategies catalog)
-- =============================================
CREATE TABLE IF NOT EXISTS public.models (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  description     TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT models_user_name_unique UNIQUE (user_id, name)
);

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
  model_id        UUID REFERENCES public.models(id) ON DELETE SET NULL,
  timeframe       TEXT NOT NULL,

  -- Period (datetime)
  start_date      TIMESTAMPTZ NOT NULL,
  end_date        TIMESTAMPTZ NOT NULL,

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
  no_trade_day    BOOLEAN NOT NULL DEFAULT FALSE,
  no_trade_reason TEXT,
  equity_curve_url TEXT,
  tags            TEXT[] DEFAULT '{}',

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- ROW LEVEL SECURITY (multi-user isolation)
-- Each user only sees/modifies their own rows
-- =============================================
ALTER TABLE public.backtests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.models ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own models" ON public.models;
DROP POLICY IF EXISTS "Users can insert own models" ON public.models;
DROP POLICY IF EXISTS "Users can update own models" ON public.models;
DROP POLICY IF EXISTS "Users can delete own models" ON public.models;

DROP POLICY IF EXISTS "Users can view own backtests" ON public.backtests;
DROP POLICY IF EXISTS "Users can insert own backtests" ON public.backtests;
DROP POLICY IF EXISTS "Users can update own backtests" ON public.backtests;
DROP POLICY IF EXISTS "Users can delete own backtests" ON public.backtests;

CREATE POLICY "Users can view own models"
  ON public.models FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own models"
  ON public.models FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own models"
  ON public.models FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own models"
  ON public.models FOR DELETE
  USING (auth.uid() = user_id);

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

DROP TRIGGER IF EXISTS on_backtests_updated ON public.backtests;
CREATE TRIGGER on_backtests_updated
  BEFORE UPDATE ON public.backtests
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS on_models_updated ON public.models;
CREATE TRIGGER on_models_updated
  BEFORE UPDATE ON public.models
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =============================================
-- INDEXES for common filter patterns
-- =============================================
CREATE INDEX IF NOT EXISTS idx_backtests_user_id   ON public.backtests(user_id);
CREATE INDEX IF NOT EXISTS idx_backtests_asset     ON public.backtests(user_id, asset);
CREATE INDEX IF NOT EXISTS idx_backtests_created   ON public.backtests(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_models_user_id      ON public.models(user_id);
CREATE INDEX IF NOT EXISTS idx_models_name         ON public.models(user_id, name);

-- =============================================
-- If your table already exists with DATE columns,
-- run this once to migrate to datetime support.
-- =============================================
ALTER TABLE public.backtests
  ALTER COLUMN start_date TYPE TIMESTAMPTZ USING start_date::timestamptz,
  ALTER COLUMN end_date TYPE TIMESTAMPTZ USING end_date::timestamptz;

ALTER TABLE public.backtests
  ADD COLUMN IF NOT EXISTS model_id UUID REFERENCES public.models(id) ON DELETE SET NULL;

ALTER TABLE public.backtests
  ADD COLUMN IF NOT EXISTS no_trade_day BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS no_trade_reason TEXT;

ALTER TABLE public.backtests
  ADD COLUMN IF NOT EXISTS equity_curve_url TEXT;

CREATE INDEX IF NOT EXISTS idx_backtests_model_id  ON public.backtests(model_id);

-- =============================================
-- STORAGE: equity curve screenshots
-- =============================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'equity-curves',
  'equity-curves',
  true,
  5242880,
  ARRAY['image/png', 'image/jpeg', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Users can upload own equity curves" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own equity curves" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own equity curves" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own equity curves" ON storage.objects;

CREATE POLICY "Users can upload own equity curves"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'equity-curves'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can view own equity curves"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'equity-curves'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update own equity curves"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'equity-curves'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'equity-curves'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete own equity curves"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'equity-curves'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
