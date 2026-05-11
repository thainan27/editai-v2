import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Clock, CheckCircle2, AlertCircle, Star,
  TrendingUp, DollarSign, Package, Award, ArrowRight,
  FileText, MessageSquare, XCircle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { formatBRL, EDITOR_LEVELS } from "@/lib/constants";
import { toast } from "sonner";

interface EditorProfile {
  id: string; bio: string | null; specialty: string;
  level: "basico" | "intermediario" | "avancado";
  base_price: number; status: "pendente" | "aprovado" | "rejeitado";
  rating_avg: number; rating_count: number; portfolio_links: string[];
}

interface Order {
  id: string; video_type: string; status: string;
  total_amount: number; editor_amount: number;
  created_at: string; deadline: string | null;
  briefing: string; client_id: string;
}

const STATUS_MAP: Record<string, { label: string; icon: typeof Clock; color: string }> = {
  aguardando_aceite: { label: "Aguardando",   icon: Clock,         color: "text-yellow-400 bg-yellow-400/10" },
  aceito:            { label: "Aceito",        icon: CheckCircle2,  color: "text-accent bg-accent/10" },
  em_andamento:      { label: "Em andamento",  icon: Clock,         color: "text-primary bg-primary/10" },
  em_revisao:        { label: "Em revisão",    icon: AlertCircle,   color: "text-yellow-400 bg-yellow-400/10" },
  concluido:         { label: "Concluído",     icon: CheckCircle2,  color: "text-accent bg-accent/10" },
  cancelado:         { label: "Cancelado",     icon: XCircle,       color: "text-destructive bg-destructive/10" },
  recusado:          { label: "Recusado",      icon: XCircle,       color: "text-destructive bg-destructive/10" },
};

const DashboardEditor = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<EditorProfile | null>(null);
  const [orders,  setOrders]  = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: profileData }, { data: ordersData }] = await Promise.all([
        supabase.from("editor_profiles").select("*").eq("id", user.id).single(),
        supabase.from("orders")
          .select("id,video_type,status,total_amount,editor_amount,created_at,deadline,briefing,client_id")
          .eq("editor_id", user.id).order("created_at", { ascending: false }),
      ]);
      setProfile(profileData as EditorProfile | null);
      setOrders((ordersData as Order[]) ?? []);
      setLoading(false);
    })();
  }, [user]);

  const handleOrderAction = async (orderId: string, action: "aceito" | "recusado") => {
    const { error } = await supabase.from("orders").update({ status: action }).eq("id", orderId);
    if (error) { toast.error("Erro ao atualizar pedido"); return; }
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: action } : o));
    toast.success(action === "aceito" ? "Projeto aceito! 🎉" : "Projeto recusado.");
  };

  if (authLoading) return null;

  if (!user) return (
    <div className="min-h-screen grid place-items-center">
      <div className="text-center space-y-4">
        <p className="text-muted-foreground">Você precisa entrar para acessar.</p>
        <Button variant="hero" asChild><Link to="/login">Entrar</Link></Button>
      </div>
    </div>
  );

  if (!loading && !profile) return (
    <div className="min-h-screen flex flex-col"><Navbar />
      <main className="container py-12 flex-1 grid place-items-center">
        <div className="text-center space-y-6 max-w-md">
          <div className="w-20 h-20 rounded-full bg-primary/10 grid place-items-center mx-auto">
            <Award className="w-10 h-10 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold mb-2">Seja um editor verificado</h1>
            <p className="text-muted-foreground">Complete seu perfil e passe pela curadoria para receber pedidos.</p>
          </div>
          <Button variant="hero" className="w-full" onClick={() => navigate("/candidatura")}>
            Iniciar candidatura <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </main>
    <Footer /></div>
  );

  if (!loading && profile?.status === "pendente") return (
    <div className="min-h-screen flex flex-col"><Navbar />
      <main className="container py-12 flex-1 grid place-items-center">
        <div className="text-center space-y-6 max-w-md">
          <div className="w-20 h-20 rounded-full bg-yellow-400/10 grid place-items-center mx-auto">
            <Clock className="w-10 h-10 text-yellow-400" />
          </div>
          <h1 className="text-3xl font-bold">Candidatura em análise</h1>
          <p className="text-muted-foreground">Nossa equipe avalia em até <strong>7 dias úteis</strong>. Você receberá um email com o resultado.</p>
          <p className="text-xs text-muted-foreground">Dúvidas? suporte@editai.app</p>
        </div>
      </main>
    <Footer /></div>
  );

  if (!loading && profile?.status === "rejeitado") return (
    <div className="min-h-screen flex flex-col"><Navbar />
      <main className="container py-12 flex-1 grid place-items-center">
        <div className="text-center space-y-6 max-w-md">
          <div className="w-20 h-20 rounded-full bg-destructive/10 grid place-items-center mx-auto">
            <XCircle className="w-10 h-10 text-destructive" />
          </div>
          <h1 className="text-3xl font-bold">Candidatura não aprovada</h1>
          <p className="text-muted-foreground">Você pode tentar novamente em <strong>30 dias</strong>. Veja o feedback no seu email.</p>
          <Button variant="outline" className="w-full" onClick={() => navigate("/candidatura")}>Tentar novamente</Button>
        </div>
      </main>
    <Footer /></div>
  );

  const totalGanhos      = orders.filter(o => o.status === "concluido").reduce((s, o) => s + o.editor_amount, 0);
  const pedidosAtivos    = orders.filter(o => ["aceito","em_andamento","em_revisao"].includes(o.status)).length;
  const pedidosConcluidos = orders.filter(o => o.status === "concluido").length;
  const pedidosPendentes = orders.filter(o => o.status === "aguardando_aceite").length;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="container py-12 flex-1">

        {/* Header */}
        <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-3xl md:text-4xl font-bold">Painel do editor</h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent/10 text-accent text-xs font-medium border border-accent/30">
                <CheckCircle2 className="w-3 h-3" /> Verificado
              </span>
            </div>
            <p className="text-muted-foreground">
              Nível <strong>{EDITOR_LEVELS[profile?.level ?? "basico"].label}</strong> · {profile?.specialty}
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <Button variant="outline" size="sm" className="gap-2" onClick={() => navigate("/jornada")}>
              <TrendingUp className="w-4 h-4" /> Minha jornada
            </Button>
            <div className="flex items-center gap-2">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={`w-4 h-4 ${i < Math.round(profile?.rating_avg ?? 0) ? "text-accent fill-accent" : "text-muted-foreground"}`} />
              ))}
              <span className="text-sm text-muted-foreground">
                {profile?.rating_avg?.toFixed(1) ?? "–"} ({profile?.rating_count ?? 0})
              </span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total ganho",    value: formatBRL(totalGanhos),  icon: DollarSign, color: "text-accent" },
            { label: "Ativos",         value: pedidosAtivos,           icon: Package,    color: "text-primary" },
            { label: "Concluídos",     value: pedidosConcluidos,       icon: TrendingUp, color: "text-accent" },
            { label: "Aguardando",     value: pedidosPendentes,        icon: Clock,      color: "text-yellow-400" },
          ].map(s => (
            <div key={s.label} className="bg-gradient-card border border-border/50 rounded-xl p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">{s.label}</span>
                <s.icon className={`w-4 h-4 ${s.color}`} />
              </div>
              <div className="text-2xl font-bold">{s.value}</div>
            </div>
          ))}
        </div>

        <h2 className="text-xl font-semibold mb-4">Pedidos recebidos</h2>

        {loading ? (
          <div className="text-center text-muted-foreground py-16">Carregando...</div>
        ) : orders.length === 0 ? (
          <div className="bg-gradient-card border border-border/50 rounded-2xl p-12 text-center">
            <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhum pedido ainda. Seu perfil está visível para clientes!</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {orders.map(o => {
              const status = STATUS_MAP[o.status] ?? { label: o.status, icon: Clock, color: "text-muted-foreground bg-secondary" };
              const StatusIcon = status.icon;
              return (
                <div key={o.id} className="bg-gradient-card border border-border/50 rounded-xl p-5 flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">{o.video_type}</span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                        <StatusIcon className="w-3 h-3" /> {status.label}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1">{o.briefing}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>{new Date(o.created_at).toLocaleDateString("pt-BR")}</span>
                      {o.deadline && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(o.deadline).toLocaleDateString("pt-BR")}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-bold text-gradient">{formatBRL(o.editor_amount)}</div>
                      <div className="text-xs text-muted-foreground">seu valor</div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {o.status === "aguardando_aceite" && (
                        <>
                          <Button size="sm" variant="hero" onClick={() => handleOrderAction(o.id, "aceito")}>Aceitar</Button>
                          <Button size="sm" variant="outline" className="text-destructive border-destructive/30"
                            onClick={() => handleOrderAction(o.id, "recusado")}>Recusar</Button>
                        </>
                      )}
                      {o.status === "concluido" && (
                        <Button size="sm" variant="outline" className="gap-1 text-accent border-accent/30"
                          onClick={() => navigate(`/avaliar/cliente/${o.id}`)}>
                          <Star className="w-3.5 h-3.5" /> Avaliar cliente
                        </Button>
                      )}
                      <Button size="sm" variant="outline" className="gap-1" onClick={() => navigate(`/chat/${o.id}`)}>
                        <MessageSquare className="w-3.5 h-3.5" /> Chat
                      </Button>
                      <Button size="sm" variant="outline" className="gap-1" onClick={() => navigate(`/chat/${o.id}`)}>
                        <FileText className="w-3.5 h-3.5" /> Ver
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default DashboardEditor;
