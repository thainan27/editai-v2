import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { order_id, total_amount, video_type, client_email, client_name } = await req.json();

    const MP_ACCESS_TOKEN = Deno.env.get("MP_ACCESS_TOKEN");
    const APP_URL = Deno.env.get("APP_URL") ?? "https://editai-wheat.vercel.app";

    const preference = {
      items: [
        {
          id: order_id,
          title: `Editaí — ${video_type}`,
          description: "Serviço de edição de vídeo profissional",
          quantity: 1,
          currency_id: "BRL",
          unit_price: parseFloat(total_amount),
        },
      ],
      payer: {
        email: client_email,
        name: client_name,
      },
      back_urls: {
        success: `${APP_URL}/pagamento/retorno?status=sucesso&order_id=${order_id}`,
        failure: `${APP_URL}/pagamento/retorno?status=falha&order_id=${order_id}`,
        pending: `${APP_URL}/pagamento/retorno?status=pendente&order_id=${order_id}`,
      },
      auto_return: "approved",
      external_reference: order_id,
      notification_url: `https://dvkafvepsujnehkyfhbp.supabase.co/functions/v1/mp-webhook`,
      statement_descriptor: "EDITAI",
      expires: false,
    };

    const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${MP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": order_id,
      },
      body: JSON.stringify(preference),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message ?? "Erro ao criar preferência MP");
    }

    return new Response(
      JSON.stringify({
        preference_id: data.id,
        init_point: data.init_point,
        sandbox_init_point: data.sandbox_init_point,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
