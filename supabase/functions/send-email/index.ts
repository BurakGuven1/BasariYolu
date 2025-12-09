// Supabase Edge Function: send-email
// Sends emails using SMTP configuration

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

interface EmailRequest {
  to: string;
  subject: string;
  html?: string;
  text?: string;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { to, subject, html } = await req.json();

    // Validate inputs
    if (!to || !subject) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: to, subject' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get SMTP credentials from environment variables
    const SMTP_HOST = Deno.env.get('SMTP_HOST') || 'smtp.gmail.com';
    const SMTP_PORT = parseInt(Deno.env.get('SMTP_PORT') || '587');
    const SMTP_USER = Deno.env.get('SMTP_USER');
    const SMTP_PASS = Deno.env.get('SMTP_PASS');
    const SMTP_FROM = Deno.env.get('SMTP_FROM') || 'destek@basariyolum.com';

    if (!SMTP_USER || !SMTP_PASS) {
      return new Response(
        JSON.stringify({ error: 'SMTP credentials not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create SMTP client
    const client = new SMTPClient({
      connection: {
        hostname: SMTP_HOST,
        port: SMTP_PORT,
        tls: true,
        auth: {
          username: SMTP_USER,
          password: SMTP_PASS,
        },
      },
    });

    // Send email (denomailer format)
    const emailConfig: any = {
    from: SMTP_FROM,
    to,
    subject
    };

    if (html) {
    emailConfig.html = html;
    emailConfig.content = html.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '');
    }


    await client.send(emailConfig);

    await client.close();

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Email sent successfully',
        messageId: `${Date.now()}_${to}`
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('Error sending email:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to send email',
        details: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
