-- Migration: Add subscription system for In-App Purchases
-- Date: 2025-12-03
-- Description: Adds subscription tracking fields to profiles and creates subscriptions table
-- IDEMPOTENT: Can be run multiple times safely

-- ==============================================================================
-- 1. Add subscription fields to profiles table
-- ==============================================================================

-- Add subscription tracking columns to profiles
DO $$
BEGIN
  -- Add subscription_expires_at column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'subscription_expires_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN subscription_expires_at TIMESTAMPTZ;
    RAISE NOTICE 'Added subscription_expires_at to profiles';
  END IF;

  -- Add subscription_status column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'subscription_status'
  ) THEN
    ALTER TABLE profiles ADD COLUMN subscription_status TEXT DEFAULT 'inactive';
    RAISE NOTICE 'Added subscription_status to profiles';
  END IF;
END $$;

-- Add constraint if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_subscription_status_check'
  ) THEN
    ALTER TABLE profiles
    ADD CONSTRAINT profiles_subscription_status_check
    CHECK (subscription_status IN ('active', 'inactive', 'expired', 'canceled', 'pending'));
    RAISE NOTICE 'Added subscription_status check constraint';
  END IF;
END $$;

-- Add indexes for faster subscription queries
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_status ON profiles(subscription_status);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_expires_at ON profiles(subscription_expires_at);

-- Add comments for documentation
COMMENT ON COLUMN profiles.subscription_expires_at IS 'Timestamp when the current subscription expires';
COMMENT ON COLUMN profiles.subscription_status IS 'Current subscription status: active, inactive, expired, canceled, pending';

-- ==============================================================================
-- 2. Create or update subscriptions table
-- ==============================================================================

-- Create subscriptions table if not exists
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add all required columns if they don't exist
DO $$
BEGIN
  -- product_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscriptions' AND column_name = 'product_id'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN product_id TEXT NOT NULL DEFAULT 'unknown';
    ALTER TABLE subscriptions ALTER COLUMN product_id DROP DEFAULT;
    RAISE NOTICE 'Added product_id to subscriptions';
  END IF;

  -- platform
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscriptions' AND column_name = 'platform'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN platform TEXT NOT NULL DEFAULT 'web';
    RAISE NOTICE 'Added platform to subscriptions';
  END IF;

  -- transaction_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscriptions' AND column_name = 'transaction_id'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN transaction_id TEXT;
    RAISE NOTICE 'Added transaction_id to subscriptions';
  END IF;

  -- transaction_receipt
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscriptions' AND column_name = 'transaction_receipt'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN transaction_receipt TEXT;
    RAISE NOTICE 'Added transaction_receipt to subscriptions';
  END IF;

  -- status
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscriptions' AND column_name = 'status'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN status TEXT NOT NULL DEFAULT 'active';
    RAISE NOTICE 'Added status to subscriptions';
  END IF;

  -- purchased_at
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscriptions' AND column_name = 'purchased_at'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN purchased_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
    RAISE NOTICE 'Added purchased_at to subscriptions';
  END IF;

  -- expires_at (THIS WAS MISSING!)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscriptions' AND column_name = 'expires_at'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '1 month');
    ALTER TABLE subscriptions ALTER COLUMN expires_at DROP DEFAULT;
    RAISE NOTICE 'Added expires_at to subscriptions';
  END IF;

  -- canceled_at
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscriptions' AND column_name = 'canceled_at'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN canceled_at TIMESTAMPTZ;
    RAISE NOTICE 'Added canceled_at to subscriptions';
  END IF;

  -- refunded_at
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscriptions' AND column_name = 'refunded_at'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN refunded_at TIMESTAMPTZ;
    RAISE NOTICE 'Added refunded_at to subscriptions';
  END IF;
END $$;

-- Add constraints if they don't exist
DO $$
BEGIN
  -- Platform check constraint
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'subscriptions_platform_check'
  ) THEN
    ALTER TABLE subscriptions
    ADD CONSTRAINT subscriptions_platform_check
    CHECK (platform IN ('ios', 'android', 'web'));
    RAISE NOTICE 'Added platform check constraint';
  END IF;

  -- Status check constraint
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'subscriptions_status_check'
  ) THEN
    ALTER TABLE subscriptions
    ADD CONSTRAINT subscriptions_status_check
    CHECK (status IN ('active', 'expired', 'canceled', 'refunded', 'pending'));
    RAISE NOTICE 'Added status check constraint';
  END IF;
END $$;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_expires_at ON subscriptions(expires_at);
CREATE INDEX IF NOT EXISTS idx_subscriptions_transaction_id ON subscriptions(transaction_id);

-- Add comments
COMMENT ON TABLE subscriptions IS 'Tracks all subscription purchases and their lifecycle';
COMMENT ON COLUMN subscriptions.product_id IS 'IAP product ID (e.g., com.basariyolu.advanced.yearly)';
COMMENT ON COLUMN subscriptions.platform IS 'Purchase platform: ios, android, or web';
COMMENT ON COLUMN subscriptions.transaction_id IS 'Unique transaction ID from App Store or Google Play';
COMMENT ON COLUMN subscriptions.transaction_receipt IS 'Receipt data for validation';
COMMENT ON COLUMN subscriptions.status IS 'Current subscription status';
COMMENT ON COLUMN subscriptions.expires_at IS 'When this subscription expires';

-- ==============================================================================
-- 3. Enable Row Level Security (RLS)
-- ==============================================================================

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Service role can manage subscriptions" ON subscriptions;

-- Policy: Users can view their own subscriptions
CREATE POLICY "Users can view own subscriptions"
  ON subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Service role can manage all subscriptions (for Edge Functions)
CREATE POLICY "Service role can manage subscriptions"
  ON subscriptions
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- ==============================================================================
-- 4. Create function to automatically update subscription status
-- ==============================================================================

-- Function to update expired subscriptions
CREATE OR REPLACE FUNCTION update_expired_subscriptions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update subscriptions table
  UPDATE subscriptions
  SET status = 'expired',
      updated_at = NOW()
  WHERE status = 'active'
    AND expires_at < NOW();

  -- Update profiles table
  UPDATE profiles
  SET subscription_status = 'expired',
      updated_at = NOW()
  WHERE subscription_status = 'active'
    AND subscription_expires_at < NOW();

  RAISE NOTICE 'Updated expired subscriptions';
END;
$$;

COMMENT ON FUNCTION update_expired_subscriptions() IS 'Updates expired subscriptions to expired status';

-- ==============================================================================
-- 5. Create trigger to auto-update updated_at
-- ==============================================================================

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Add trigger to subscriptions table
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ==============================================================================
-- 6. Create helper function to get active subscription
-- ==============================================================================

-- Function to get user's active subscription
CREATE OR REPLACE FUNCTION get_active_subscription(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  product_id TEXT,
  platform TEXT,
  expires_at TIMESTAMPTZ,
  days_remaining INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id,
    s.product_id,
    s.platform,
    s.expires_at,
    GREATEST(0, EXTRACT(DAY FROM s.expires_at - NOW())::INTEGER) as days_remaining
  FROM subscriptions s
  WHERE s.user_id = p_user_id
    AND s.status = 'active'
    AND s.expires_at > NOW()
  ORDER BY s.expires_at DESC
  LIMIT 1;
END;
$$;

COMMENT ON FUNCTION get_active_subscription(UUID) IS 'Returns the active subscription for a user';

-- ==============================================================================
-- 7. Grant permissions
-- ==============================================================================

-- Grant access to authenticated users
GRANT SELECT ON subscriptions TO authenticated;

-- Grant all access to service role (for Edge Functions)
GRANT ALL ON subscriptions TO service_role;

-- ==============================================================================
-- Migration complete
-- ==============================================================================

-- Log completion
DO $$
BEGIN
  RAISE NOTICE '✅ Subscription system migration completed successfully';
  RAISE NOTICE '📋 Tables: profiles (updated), subscriptions (created/updated)';
  RAISE NOTICE '🔧 Functions: update_expired_subscriptions(), get_active_subscription()';
  RAISE NOTICE '🔒 RLS: Enabled with policies';
END $$;
