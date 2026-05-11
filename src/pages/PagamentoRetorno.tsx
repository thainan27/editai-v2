import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle2, XCircle, Clock, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";

type PaymentStatus = "sucesso" | "falha" | "pendente";

const STATUS_CONFIG = {
  sucesso: {
    icon: CheckCircle2,
    color: "text-accent",
    bg: "bg-accent/10",
    title: "Pagamento aprovado! 🎉",
    desc: "Seu pagamento foi confirmado. O editor já foi notificado e o projeto está em andamento!",
    btn: "Ver meu pedido",
    btnVariant: "hero" as const,
  },
  falha: {
    icon: XCircle,
    color: "text-destructive",
    bg: "bg-destructive/10",
    title: "Pagamento não aprovado",
    desc: "Houve um problema com seu pagamento. Você pode tentar novamente com outro método.",
    btn: "Tentar novamente",
    btnVariant: "hero" as const,
  },
  pendente: {
    icon: Clock,
    color: "text-yellow-400",
    bg: "bg-yellow-400/10",
    title: "Pagamento pendente",
    desc: "Seu pagamento está sendo processado. Pode levar alguns minutos para ser confirmado.",
    btn: "Ver meu pedido",
    btnVariant: "outline" as const,
  },
};

const PagamentoRetorno = () => {
  const [params]   = useSearchParams();
  const navigate   = useNavigate();
  const [loading, setLoading] = useState(true);

  const status  = (params.get("status") ?? "falha") as PaymentStatus;
  const orderId = params.get("order_id");
  const config  = STATUS_CONFIG[status] ?? STATUS_CONFIG.falha;
  const Icon    = config.icon;

  useEffect(() => {
    if (!orderId || status !== "sucesso") { setLoading(false); return; }

    // Atualiza o pagamento no banco se aprovado
    (async () => {
      await supabase.from("payments").upsert({
        order_id: orderId,
        status: "pago",
        amount: 0, // será atualizado pelo webhook
        platform_fee: 0,
        editor_amount: 0,
      }, { onConflict: "order_id" });
      setLoading(false);
    })();
  }, [orderId, status]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="container flex-1 grid place-items-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="container flex-1 grid place-items-center py-12">
        <div className="max-w-md w-full text-center space-y-6">

          {/* Ícone de status */}
          <div className={`w-24 h-24 rounded-full ${config.bg} grid place-items-center mx-auto`}>
            <Icon className={`w-12 h-12 ${config.color}`} />
          </div>

          {/* Texto */}
          <div>
            <h1 className="text-2xl font-bold mb-2">{config.title}</h1>
            <p className="text-muted-foreground text-sm">{config.desc}</p>
          </div>

          {/* ID do pedido */}
          {orderId && (
            <div className="bg-secondary/50 rounded-xl p-4 text-sm">
              <p className="text-muted-foreground text-xs mb-1">ID do pedido</p>
              <p className="font-mono font-medium text-xs">{orderId}</p>
            </div>
          )}

          {/* Próximos passos para sucesso */}
          {status === "sucesso" && (
            <div className="bg-gradient-card border border-border/50 rounded-2xl p-5 text-left space-y-3 text-sm">
              <p className="font-semibold">O que acontece agora:</p>
              {[
                "Editor recebeu notificação do projeto",
                "Ele iniciará a edição dentro do prazo combinado",
                "Você poderá acompanhar tudo no chat do pedido",
                "Ao receber o vídeo, aprove para liberar o pagamento",
              ].map((s, i) => (
                <div key={i} className="flex items-center gap-2 text-muted-foreground">
                  <span className="w-5 h-5 rounded-full bg-accent/10 text-accent text-xs font-bold grid place-items-center flex-shrink-0">
                    {i + 1}
                  </span>
                  {s}
                </div>
              ))}
            </div>
          )}

          {/* Botões */}
          <div className="flex flex-col gap-3">
            <Button
              variant={config.btnVariant}
              className="w-full"
              onClick={() => {
                if (status === "falha") {
                  navigate(`/pagamento/${orderId}`);
                } else {
                  navigate(orderId ? `/chat/${orderId}` : "/dashboard/cliente");
                }
              }}
            >
              {config.btn}
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate("/dashboard/cliente")}
            >
              Ir para meus pedidos
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PagamentoRetorno;
