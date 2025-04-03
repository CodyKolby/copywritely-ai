
-- Create table for payment logs
CREATE TABLE IF NOT EXISTS public.payment_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL,
  subscription_id TEXT,
  customer TEXT,
  customer_email TEXT,
  timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create table for unprocessed payments
CREATE TABLE IF NOT EXISTS public.unprocessed_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  session_data JSONB NOT NULL,
  processed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS payment_logs_session_id_idx ON public.payment_logs(session_id);
CREATE INDEX IF NOT EXISTS payment_logs_user_id_idx ON public.payment_logs(user_id);
CREATE INDEX IF NOT EXISTS unprocessed_payments_session_id_idx ON public.unprocessed_payments(session_id);
