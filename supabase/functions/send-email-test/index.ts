// Simple test function to verify Edge Functions work
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  console.log('🔥 Test function invoked!');
  console.log('📝 Request body:', await req.text());

  return new Response(
    JSON.stringify({
      success: true,
      message: 'Test function works!',
      timestamp: new Date().toISOString()
    }),
    {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );
});
