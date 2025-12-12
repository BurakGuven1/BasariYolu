// Supabase Edge Function: validate-iap-purchase
// Validates In-App Purchase receipts from Google Play and App Store

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ValidationRequest {
  platform: 'ios' | 'android';
  productId: string;
  transactionReceipt: string;
  transactionId: string;
  userId?: string;
}

interface ValidationResponse {
  valid: boolean;
  message: string;
  subscription?: {
    productId: string;
    expiresAt: string;
    level: string;
    duration: string;
  };
}

/**
 * Validate iOS receipt with Apple's verifyReceipt API
 */
async function validateAppleReceipt(
  receipt: string,
  productId: string
): Promise<ValidationResponse> {
  try {
    // Use production URL, fallback to sandbox if needed
    const APPLE_VERIFY_URL = Deno.env.get('APPLE_VERIFY_PRODUCTION_URL') ||
      'https://buy.itunes.apple.com/verifyReceipt';
    const APPLE_VERIFY_SANDBOX_URL = 'https://sandbox.itunes.apple.com/verifyReceipt';
    const APPLE_SHARED_SECRET = Deno.env.get('APPLE_SHARED_SECRET');

    if (!APPLE_SHARED_SECRET) {
      throw new Error('Apple shared secret not configured');
    }

    // Try production first
    let response = await fetch(APPLE_VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        'receipt-data': receipt,
        'password': APPLE_SHARED_SECRET,
        'exclude-old-transactions': true,
      }),
    });

    let data = await response.json();

    // If status 21007, receipt is from sandbox, retry with sandbox URL
    if (data.status === 21007) {
      response = await fetch(APPLE_VERIFY_SANDBOX_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          'receipt-data': receipt,
          'password': APPLE_SHARED_SECRET,
          'exclude-old-transactions': true,
        }),
      });
      data = await response.json();
    }

    // Status 0 means valid receipt
    if (data.status !== 0) {
      return {
        valid: false,
        message: `Apple receipt validation failed with status: ${data.status}`,
      };
    }

    // Find the latest receipt for this product
    const latestReceipt = data.latest_receipt_info?.find(
      (r: any) => r.product_id === productId
    );

    if (!latestReceipt) {
      return {
        valid: false,
        message: 'Product not found in receipt',
      };
    }

    // Extract subscription details
    const expiresAt = new Date(parseInt(latestReceipt.expires_date_ms)).toISOString();
    const [, level, duration] = productId.split('.');

    return {
      valid: true,
      message: 'Receipt validated successfully',
      subscription: {
        productId,
        expiresAt,
        level,
        duration,
      },
    };
  } catch (error: any) {
    console.error('Apple receipt validation error:', error);
    return {
      valid: false,
      message: `Validation error: ${error.message}`,
    };
  }
}

/**
 * Validate Android receipt with Google Play Developer API
 */
async function validateGooglePlayReceipt(
  receipt: string,
  productId: string,
  transactionId: string
): Promise<ValidationResponse> {
  try {
    // Google Play requires OAuth2 token or service account
    const GOOGLE_SERVICE_ACCOUNT_EMAIL = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_EMAIL');
    const GOOGLE_PRIVATE_KEY = Deno.env.get('GOOGLE_PRIVATE_KEY');
    const GOOGLE_PACKAGE_NAME = Deno.env.get('GOOGLE_PACKAGE_NAME') || 'com.basariyolu';

    if (!GOOGLE_SERVICE_ACCOUNT_EMAIL || !GOOGLE_PRIVATE_KEY) {
      throw new Error('Google service account credentials not configured');
    }

    // Get OAuth2 token
    const token = await getGoogleOAuth2Token(
      GOOGLE_SERVICE_ACCOUNT_EMAIL,
      GOOGLE_PRIVATE_KEY
    );

    // Call Google Play Developer API
    const url = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${GOOGLE_PACKAGE_NAME}/purchases/subscriptions/${productId}/tokens/${transactionId}`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Google Play API error: ${response.status}`);
    }

    const data = await response.json();

    // Check if subscription is valid
    // purchaseState: 0 = purchased, 1 = canceled, 2 = pending
    if (data.purchaseState !== 0) {
      return {
        valid: false,
        message: 'Subscription not active',
      };
    }

    // Check if not expired
    const expiryTimeMillis = parseInt(data.expiryTimeMillis);
    const now = Date.now();

    if (expiryTimeMillis < now) {
      return {
        valid: false,
        message: 'Subscription expired',
      };
    }

    const expiresAt = new Date(expiryTimeMillis).toISOString();
    const [, level, duration] = productId.split('.');

    return {
      valid: true,
      message: 'Receipt validated successfully',
      subscription: {
        productId,
        expiresAt,
        level,
        duration,
      },
    };
  } catch (error: any) {
    console.error('Google Play receipt validation error:', error);
    return {
      valid: false,
      message: `Validation error: ${error.message}`,
    };
  }
}

/**
 * Get OAuth2 token for Google Play API
 */
async function getGoogleOAuth2Token(
  serviceAccountEmail: string,
  privateKey: string
): Promise<string> {
  // This is a simplified version. In production, you'd use a proper JWT library
  // For now, we'll return a placeholder
  // TODO: Implement proper JWT signing with Google service account
  throw new Error('Google OAuth2 token generation not yet implemented. Please set up service account authentication.');
}

/**
 * Update user subscription in database
 */
async function updateUserSubscription(
  supabaseClient: any,
  userId: string,
  subscription: {
    productId: string;
    expiresAt: string;
    level: string;
    duration: string;
  }
): Promise<void> {
  try {
    // Update profiles table with subscription info
    const { error: profileError } = await supabaseClient
      .from('profiles')
      .update({
        package_type: subscription.level,
        billing_cycle: subscription.duration,
        subscription_expires_at: subscription.expiresAt,
        subscription_status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (profileError) {
      throw profileError;
    }

    // Record transaction in subscriptions table (if exists)
    const { error: subError } = await supabaseClient
      .from('subscriptions')
      .upsert({
        user_id: userId,
        product_id: subscription.productId,
        expires_at: subscription.expiresAt,
        status: 'active',
        created_at: new Date().toISOString(),
      });

    // Don't throw if subscriptions table doesn't exist yet
    if (subError && !subError.message.includes('does not exist')) {
      console.warn('Subscription table insert warning:', subError);
    }

  } catch (error: any) {
    console.error('Error updating subscription:', error);
    throw error;
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get auth token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authorization token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const {
      platform,
      productId,
      transactionReceipt,
      transactionId,
    }: ValidationRequest = await req.json();

    // Validate inputs
    if (!platform || !productId || !transactionReceipt || !transactionId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate receipt based on platform
    let validationResult: ValidationResponse;

    if (platform === 'ios') {
      validationResult = await validateAppleReceipt(transactionReceipt, productId);
    } else if (platform === 'android') {
      validationResult = await validateGooglePlayReceipt(
        transactionReceipt,
        productId,
        transactionId
      );
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid platform' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If valid, update user subscription
    if (validationResult.valid && validationResult.subscription) {
      await updateUserSubscription(
        supabaseClient,
        user.id,
        validationResult.subscription
      );
    }

    // Return result
    return new Response(
      JSON.stringify(validationResult),
      {
        status: validationResult.valid ? 200 : 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
