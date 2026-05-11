import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Shield, CreditCard, Loader2, ArrowLeft,
  CheckCircle2, Clock, DollarSign, Film, Calendar
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { formatBRL } from "@/lib/constants";
import { toast } from "sonner";

interface OrderDetail {
  id: string;
  video_type: string;
  total_amount: number;
  platform_fee: number;
  editor_amount: number;
  deadline: string | null;
  status: string;
  package_name: string;
  editor: { full_name: string } | null;
}

const Pagamento = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate    = useNavigate();
  const { user }    = useAuth();

  const [order,     setOrder]     = useState<OrderDetail | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [paying,    setPaying]    = useState(false);

  useEffect(() => {
    if (!orderId || !user) return;
    (async () => {
      const { data } = await supabase
        .from("orders")
        .select("id, video_type, total_amount, platform_fee, editor_amount, deadline, status, package_name, editor:profiles!orders_editor_id_fkey(full_name)")
        .eq("id", orderId)
        .eq("client_id", user.id)
        .single();
      setOrder(data as unknown as OrderDetail | null);
      setLoading(false);
    })();
  }, [orderId, user]);

  const handlePagar = async () => {
    if (!order || !user) return;
    setPaying(true);

    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();

      const { data, error } = await supabase.functions.invoke("criar-preferencia", {
        body: {
          order_id:     order.id,
          total_amount: order.total_amount,
          video_type:   order.video_type,
          client_email: user.email,
          client_name:  profile?.full_name ?? "Cliente",
        },
      });

      if (error) throw error;

      // Redireciona pro checkout do Mercado Pago
      window.location.href = data.init_point;

    } catch (err: unknown) {
      toast.error("Erro ao iniciar pagamento. Tente novamente.");
      console.error(err);
    } finally {
      setPaying(false);
    }
  };

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

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="container flex-1 grid place-items-center">
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">Pedido não encontrado.</p>
            <Button variant="hero" onClick={() => navigate("/dashboard/cliente")}>
              Meus pedidos
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="container py-10 flex-1 max-w-lg mx-auto">

        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-smooth"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>

        <div className="space-y-5">
          {/* Header */}
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-primary grid place-items-center mx-auto mb-4">
              <CreditCard className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold">Confirmar pagamento</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Você será redirecionado para o Mercado Pago
            </p>
          </div>

          {/* Resumo do pedido */}
          <div className="bg-gradient-card border border-border/50 rounded-2xl p-6 space-y-4">
            <h2 className="font-semibold">Resumo do pedido</h2>

            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Film className="w-4 h-4 text-primary" /> Tipo
                </div>
                <span className="font-medium">{order.video_type}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-primary" /> Editor
                </div>
                <span className="font-medium">{order.editor?.full_name ?? "–"}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="w-4 h-4 text-primary" /> Pacote
                </div>
                <span className="font-medium capitalize">{order.package_name}</span>
              </div>

              {order.deadline && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-4 h-4 text-primary" /> Prazo
                  </div>
                  <span className="font-medium">
                    {new Date(order.deadline).toLocaleDateString("pt-BR")}
                  </span>
                </div>
              )}
            </div>

            {/* Split financeiro */}
            <div className="border-t border-border/50 pt-4 space-y-2 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Serviço de edição</span>
                <span>{formatBRL(order.editor_amount)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Taxa da plataforma</span>
                <span>{formatBRL(order.platform_fee)}</span>
              </div>
              <div className="flex justify-between font-bold text-base border-t border-border/50 pt-2">
                <span>Total</span>
                <span className="text-gradient">{formatBRL(order.total_amount)}</span>
              </div>
            </div>
          </div>

          {/* Métodos de pagamento */}
          <div className="bg-gradient-card border border-border/50 rounded-2xl p-5 space-y-3">
            <p className="font-semibold text-sm">Formas de pagamento aceitas</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "PIX", emoji: "⚡" },
                { label: "Cartão", emoji: "💳" },
                { label: "Boleto", emoji: "📄" },
              ].map(m => (
                <div key={m.label} className="bg-secondary/50 rounded-xl p-3 text-center">
                  <div className="text-xl mb-1">{m.emoji}</div>
                  <div className="text-xs font-medium">{m.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Garantia */}
          <div className="flex items-start gap-3 bg-accent/10 border border-accent/30 rounded-xl p-4">
            <Shield className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-foreground">Pagamento 100% seguro</p>
              <p className="text-muted-foreground text-xs mt-0.5">
                O valor fica retido na plataforma. O editor só recebe após você aprovar a entrega final.
              </p>
            </div>
          </div>

          {/* Botão pagar */}
          <Button
            variant="hero"
            className="w-full h-14 text-base"
            onClick={handlePagar}
            disabled={paying}
          >
            {paying ? (
              <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Preparando pagamento...</>
            ) : (
              <><DollarSign className="w-5 h-5 mr-2" /> Pagar {formatBRL(order.total_amount)} com Mercado Pago</>
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            Ao pagar você concorda com os termos de uso da plataforma Editaí e do Mercado Pago.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Pagamento;
