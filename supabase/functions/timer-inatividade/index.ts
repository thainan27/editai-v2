import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  const now = new Date();
  let liberados = 0;
  let expirados = 0;

  // 1. Liberar pagamento: pedidos em_revisao há mais de 7 dias sem resposta
  const sete_dias = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: pendentes } = await supabase
    .from("orders")
    .select("id, total_amount, editor_amount, platform_fee")
    .eq("status", "em_revisao")
    .lt("updated_at", sete_dias);

  for (const order of (pendentes ?? [])) {
    await supabase.from("orders").update({ status: "concluido" }).eq("id", order.id);
    await supabase.from("payments").upsert({
      order_id: order.id, status: "pago",
      amount: order.total_amount,
      platform_fee: order.platform_fee,
      editor_amount: order.editor_amount,
    }, { onConflict: "order_id" });
    liberados++;
  }

  // 2. Expirar pedidos aguardando aceite há mais de 48h
  const quarenta_oito = new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString();
  const { data: expirar } = await supabase
    .from("orders").select("id")
    .eq("status", "aguardando_aceite")
    .lt("created_at", quarenta_oito);

  for (const order of (expirar ?? [])) {
    await supabase.from("orders").update({ status: "cancelado" }).eq("id", order.id);
    expirados++;
  }

  return new Response(JSON.stringify({ ok: true, liberados, expirados }), {
    headers: { "Content-Type": "application/json" },
  });
});
