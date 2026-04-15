-- =============================================
-- TRADE JOURNAL - Supabase Schema
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
-- TABLE: trades
-- =============================================
DO $$
BEGIN
  IF to_regclass('public.backtests') IS NOT NULL AND to_regclass('public.trades') IS NULL THEN
    ALTER TABLE public.backtests RENAME TO trades;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.trades (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Asset & Strategy
  asset           TEXT NOT NULL,
  strategy_name   TEXT NOT NULL,
  strategy_description TEXT,
  model_id        UUID REFERENCES public.models(id) ON DELETE SET NULL,
  timeframe       TEXT NOT NULL,
  direction       TEXT NOT NULL DEFAULT 'long' CHECK (direction IN ('long', 'short')),
  trade_status    TEXT NOT NULL DEFAULT 'closed' CHECK (trade_status IN ('closed', 'manual_close', 'cancelled')),

  -- Period (datetime)
  start_date      TIMESTAMPTZ NOT NULL,
  end_date        TIMESTAMPTZ NOT NULL,

  -- Capital
  initial_capital NUMERIC(18, 2) NOT NULL,

  -- Trade accounting
  gross_pnl       NUMERIC(18, 2),
  fee_amount      NUMERIC(18, 2) NOT NULL DEFAULT 0,
  net_pnl         NUMERIC(18, 2),
  close_reason    TEXT,

  -- Legacy summary metrics kept for compatibility
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
  equity_curve_urls TEXT[] NOT NULL DEFAULT '{}',
  tags            TEXT[] DEFAULT '{}',

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- ROW LEVEL SECURITY (multi-user isolation)
-- Each user only sees/modifies their own rows
-- =============================================
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.models ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own models" ON public.models;
DROP POLICY IF EXISTS "Users can insert own models" ON public.models;
DROP POLICY IF EXISTS "Users can update own models" ON public.models;
DROP POLICY IF EXISTS "Users can delete own models" ON public.models;

DROP POLICY IF EXISTS "Users can view own trades" ON public.trades;
DROP POLICY IF EXISTS "Users can insert own trades" ON public.trades;
DROP POLICY IF EXISTS "Users can update own trades" ON public.trades;
DROP POLICY IF EXISTS "Users can delete own trades" ON public.trades;

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

CREATE POLICY "Users can view own trades"
  ON public.trades FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own trades"
  ON public.trades FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own trades"
  ON public.trades FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own trades"
  ON public.trades FOR DELETE
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

DROP TRIGGER IF EXISTS on_trades_updated ON public.trades;
CREATE TRIGGER on_trades_updated
  BEFORE UPDATE ON public.trades
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS on_models_updated ON public.models;
CREATE TRIGGER on_models_updated
  BEFORE UPDATE ON public.models
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =============================================
-- INDEXES for common filter patterns
-- =============================================
CREATE INDEX IF NOT EXISTS idx_trades_user_id      ON public.trades(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_asset        ON public.trades(user_id, asset);
CREATE INDEX IF NOT EXISTS idx_trades_created      ON public.trades(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_models_user_id      ON public.models(user_id);
CREATE INDEX IF NOT EXISTS idx_models_name         ON public.models(user_id, name);

-- =============================================
-- If your table already exists with DATE columns,
-- run this once to migrate to datetime support.
-- =============================================
ALTER TABLE public.trades
  ALTER COLUMN start_date TYPE TIMESTAMPTZ USING start_date::timestamptz,
  ALTER COLUMN end_date TYPE TIMESTAMPTZ USING end_date::timestamptz;

ALTER TABLE public.trades
  ADD COLUMN IF NOT EXISTS model_id UUID REFERENCES public.models(id) ON DELETE SET NULL;

ALTER TABLE public.trades
  ADD COLUMN IF NOT EXISTS direction TEXT NOT NULL DEFAULT 'long',
  ADD COLUMN IF NOT EXISTS trade_status TEXT NOT NULL DEFAULT 'closed',
  ADD COLUMN IF NOT EXISTS gross_pnl NUMERIC(18, 2),
  ADD COLUMN IF NOT EXISTS fee_amount NUMERIC(18, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS net_pnl NUMERIC(18, 2),
  ADD COLUMN IF NOT EXISTS close_reason TEXT;

ALTER TABLE public.trades
  DROP CONSTRAINT IF EXISTS trades_direction_check;
ALTER TABLE public.trades
  DROP CONSTRAINT IF EXISTS backtests_direction_check;

ALTER TABLE public.trades
  ADD CONSTRAINT trades_direction_check
  CHECK (direction IN ('long', 'short'));

ALTER TABLE public.trades
  DROP CONSTRAINT IF EXISTS trades_trade_status_check;
ALTER TABLE public.trades
  DROP CONSTRAINT IF EXISTS backtests_trade_status_check;

ALTER TABLE public.trades
  ADD CONSTRAINT trades_trade_status_check
  CHECK (trade_status IN ('closed', 'manual_close', 'cancelled'));

ALTER TABLE public.trades
  ADD COLUMN IF NOT EXISTS no_trade_day BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS no_trade_reason TEXT;

ALTER TABLE public.trades
  ADD COLUMN IF NOT EXISTS equity_curve_url TEXT;

ALTER TABLE public.trades
  ADD COLUMN IF NOT EXISTS equity_curve_urls TEXT[] NOT NULL DEFAULT '{}';

UPDATE public.trades
SET equity_curve_urls = ARRAY[equity_curve_url]
WHERE equity_curve_url IS NOT NULL
  AND (equity_curve_urls IS NULL OR cardinality(equity_curve_urls) = 0);

UPDATE public.trades
SET trade_status = CASE WHEN no_trade_day THEN 'cancelled' ELSE 'closed' END,
    close_reason = COALESCE(close_reason, no_trade_reason)
WHERE no_trade_day = TRUE;

UPDATE public.trades
SET fee_amount = 0
WHERE fee_amount IS NULL;

UPDATE public.trades
SET net_pnl = ROUND((initial_capital * total_return / 100.0)::numeric, 2)
WHERE net_pnl IS NULL
  AND total_return IS NOT NULL
  AND initial_capital IS NOT NULL;

UPDATE public.trades
SET gross_pnl = COALESCE(gross_pnl, net_pnl + fee_amount)
WHERE net_pnl IS NOT NULL;

ALTER TABLE public.trades
  DROP CONSTRAINT IF EXISTS trades_equity_curve_urls_max_3;
ALTER TABLE public.trades
  DROP CONSTRAINT IF EXISTS backtests_equity_curve_urls_max_3;

ALTER TABLE public.trades
  ADD CONSTRAINT trades_equity_curve_urls_max_3
  CHECK (cardinality(equity_curve_urls) <= 3);

ALTER TABLE public.trades
  DROP CONSTRAINT IF EXISTS trades_model_id_fkey;

ALTER TABLE public.trades
  DROP CONSTRAINT IF EXISTS backtests_model_id_fkey;

ALTER TABLE public.trades
  ADD CONSTRAINT trades_model_id_fkey
  FOREIGN KEY (model_id) REFERENCES public.models(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_trades_model_id     ON public.trades(model_id);
CREATE INDEX IF NOT EXISTS idx_trades_status       ON public.trades(user_id, trade_status);
CREATE INDEX IF NOT EXISTS idx_trades_direction    ON public.trades(user_id, direction);

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
