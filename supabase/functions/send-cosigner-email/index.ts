import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { cosignerEmail, cosignerName, tenantId } = await req.json();

    // For now, log the email that would be sent
    // In production, integrate with an email service
    console.log(`Co-signer email would be sent to: ${cosignerEmail}`);
    console.log(`Co-signer name: ${cosignerName}`);
    console.log(`Tenant ID: ${tenantId}`);

    return new Response(
      JSON.stringify({ success: true, message: "Co-signer notification logged" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
