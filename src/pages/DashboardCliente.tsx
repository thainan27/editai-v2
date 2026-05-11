import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Clock, CheckCircle2, AlertCircle, MessageSquare, CreditCard, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { formatBRL } from "@/lib/constants";

interface OrderRow {
  id: string;
  video_type: string;
  status: string;
  total_amount: number;
  created_at: string;
}

const DashboardCliente = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("orders")
        .select("id, video_type, status, total_amount, created_at")
        .eq("client_id", user.id)
        .order("created_at", { ascending: false });
      setOrders(data ?? []);
      setLoading(false);
    })();
  }, [user]);

  if (authLoading) return null;
  if (!user) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Você precisa entrar para acessar.</p>
          <Button variant="hero" asChild><Link to="/login">Entrar</Link></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="container py-12 flex-1">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold">Meus pedidos</h1>
            <p className="text-muted-foreground">Acompanhe o status dos seus projetos</p>
          </div>
          <Button variant="hero" asChild>
            <Link to="/editores"><Plus className="w-4 h-4" /> Novo pedido</Link>
          </Button>
        </div>

        {loading ? (
          <div className="text-center text-muted-foreground py-16">Carregando...</div>
        ) : orders.length === 0 ? (
          <div className="bg-gradient-card border border-border/50 rounded-2xl p-12 text-center">
            <p className="text-muted-foreground mb-4">Você ainda não tem pedidos.</p>
            <Button variant="hero" asChild><Link to="/editores">Encontrar editor</Link></Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {orders.map((o) => (
              <div key={o.id} className="bg-gradient-card border border-border/50 rounded-xl p-5 flex items-center justify-between">
                <div>
                  <div className="font-semibold">{o.video_type}</div>
                  <div className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString("pt-BR")}</div>
                </div>
                <StatusBadge status={o.status} />
                <div className="flex items-center gap-3">
                  <div className="font-bold text-gradient">{formatBRL(o.total_amount)}</div>
                  {o.status === "aguardando_aceite" && (
                    <Button size="sm" variant="hero" className="gap-1"
                      onClick={() => navigate(`/pagamento/${o.id}`)}>
                      <CreditCard className="w-3.5 h-3.5" /> Pagar
                    </Button>
                  )}
                  {o.status === "concluido" && (
                    <Button size="sm" variant="outline" className="gap-1 text-accent border-accent/30"
                      onClick={() => navigate(`/avaliar/editor/${o.id}`)}>
                      <Star className="w-3.5 h-3.5" /> Avaliar
                    </Button>
                  )}
                  <Button size="sm" variant="outline" className="gap-1"
                    onClick={() => navigate(`/chat/${o.id}`)}>
                    <MessageSquare className="w-3.5 h-3.5" /> Chat
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, { label: string; icon: typeof Clock; color: string }> = {
    aguardando_aceite: { label: "Aguardando", icon: Clock, color: "text-yellow-400 bg-yellow-400/10" },
    aceito: { label: "Aceito", icon: CheckCircle2, color: "text-accent bg-accent/10" },
    em_andamento: { label: "Em andamento", icon: Clock, color: "text-primary bg-primary/10" },
    em_revisao: { label: "Em revisão", icon: AlertCircle, color: "text-yellow-400 bg-yellow-400/10" },
    concluido: { label: "Concluído", icon: CheckCircle2, color: "text-accent bg-accent/10" },
  };
  const info = map[status] ?? { label: status, icon: Clock, color: "text-muted-foreground bg-secondary" };
  const Icon = info.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${info.color}`}>
      <Icon className="w-3 h-3" /> {info.label}
    </span>
  );
};

export default DashboardCliente;
