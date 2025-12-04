-- Migration: Add subscription system for In-App Purchases
-- Date: 2025-12-03
-- Description: Adds subscription tracking fields to profiles and creates subscriptions table

-- ==============================================================================
-- 1. Add subscription fields to profiles table
-- ==============================================================================

-- Add subscription tracking columns to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive' CHECK (subscription_status IN ('active', 'inactive', 'expired', 'canceled', 'pending'));

-- Add index for faster subscription queries
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_status ON profiles(subscription_status);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_expires_at ON profiles(subscription_expires_at);

-- Add comment for documentation
COMMENT ON COLUMN profiles.subscription_expires_at IS 'Timestamp when the current subscription expires';
COMMENT ON COLUMN profiles.subscription_status IS 'Current subscription status: active, inactive, expired, canceled, pending';

-- ==============================================================================
-- 2. Create subscriptions table for transaction history
-- ==============================================================================

-- Create subscriptions table to track all subscription transactions
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
  transaction_id TEXT,
  transaction_receipt TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'canceled', 'refunded', 'pending')),
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  canceled_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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

-- ==============================================================================
-- 3. Enable Row Level Security (RLS)
-- ==============================================================================

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

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
  RAISE NOTICE 'Subscription system migration completed successfully';
END $$;
