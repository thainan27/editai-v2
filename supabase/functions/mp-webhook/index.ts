import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const body = await req.json();
    const { type, data } = body;

    // Só processa notificações de pagamento
    if (type !== "payment") {
      return new Response("ok", { status: 200 });
    }

    const paymentId = data?.id;
    if (!paymentId) return new Response("ok", { status: 200 });

    const MP_ACCESS_TOKEN = Deno.env.get("MP_ACCESS_TOKEN");

    // Busca detalhes do pagamento no MP
    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { "Authorization": `Bearer ${MP_ACCESS_TOKEN}` },
    });

    const payment = await mpRes.json();
    const orderId = payment.external_reference;
    const status  = payment.status;

    if (!orderId) return new Response("ok", { status: 200 });

    // Atualiza o banco de dados
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Mapa de status MP → nosso status de pagamento
    const paymentStatusMap: Record<string, string> = {
      approved:    "pago",
      pending:     "pendente",
      in_process:  "pendente",
      rejected:    "pendente",
      refunded:    "reembolsado",
      cancelled:   "pendente",
    };

    const paymentStatus = paymentStatusMap[status] ?? "pendente";

    // Upsert na tabela payments
    await supabase.from("payments").upsert({
      order_id:      orderId,
      mp_payment_id: String(paymentId),
      amount:        payment.transaction_amount,
      platform_fee:  payment.transaction_amount * 0.15, // será recalculado pelo trigger
      editor_amount: payment.transaction_amount * 0.85,
      status:        paymentStatus,
    }, { onConflict: "order_id" });

    // Se aprovado, atualiza o status do pedido
    if (status === "approved") {
      await supabase
        .from("orders")
        .update({ status: "aceito" })
        .eq("id", orderId)
        .eq("status", "aguardando_aceite");
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("Webhook error:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 400 });
  }
});
