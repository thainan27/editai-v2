import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Users, Package, DollarSign, TrendingUp, CheckCircle2,
  XCircle, Clock, AlertCircle, Eye, MessageSquare,
  Award, Shield, BarChart2, Search, Filter,
  ChevronDown, Loader2, Star, ThumbsUp, ThumbsDown, AlertTriangle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatBRL, EDITOR_LEVELS } from "@/lib/constants";
import { toast } from "sonner";

// ── Tipos ──────────────────────────────────────────────────────────────────
interface EditorCandidate {
  id: string;
  bio: string | null;
  specialty: string;
  level: "basico" | "intermediario" | "avancado";
  base_price: number;
  status: "pendente" | "aprovado" | "rejeitado";
  rating_avg: number;
  rating_count: number;
  portfolio_links: string[];
  created_at: string;
  profiles: { full_name: string; email?: string } | null;
}

interface OrderRow {
  id: string;
  video_type: string;
  status: string;
  total_amount: number;
  platform_fee: number;
  editor_amount: number;
  created_at: string;
  client: { full_name: string } | null;
  editor: { full_name: string } | null;
}

interface Stats {
  totalEditors: number;
  pendingEditors: number;
  approvedEditors: number;
  totalOrders: number;
  activeOrders: number;
  completedOrders: number;
  totalRevenue: number;
  pendingRevenue: number;
}

interface DisputaRow {
  id: string;
  order_id: string;
  reason: string;
  q1_type: string | null;
  q2_type: string | null;
  status: string;
  admin_note: string | null;
  created_at: string;
  orders: { video_type: string; total_amount: number } | null;
}

type Tab = "visao_geral" | "curadoria" | "pedidos" | "editores" | "disputas";

// ── Componente ─────────────────────────────────────────────────────────────
const DashboardAdmin = () => {
  const { user, accountType, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab]                     = useState<Tab>("visao_geral");
  const [stats, setStats]                 = useState<Stats | null>(null);
  const [candidates, setCandidates]       = useState<EditorCandidate[]>([]);
  const [orders, setOrders]               = useState<OrderRow[]>([]);
  const [editors, setEditors]             = useState<EditorCandidate[]>([]);
  const [disputas, setDisputas]           = useState<DisputaRow[]>([]);
  const [loading, setLoading]             = useState(true);
  const [searchQuery, setSearchQuery]     = useState("");
  const [statusFilter, setStatusFilter]   = useState("todos");
  const [processingId, setProcessingId]   = useState<string | null>(null);
  const [adminNote, setAdminNote]         = useState<Record<string, string>>({});

  // ── Carregar dados ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!user || accountType !== "admin") return;
    loadAll();
  }, [user, accountType]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [
        { data: editorData },
        { data: orderData },
        { data: disputaData },
      ] = await Promise.all([
        supabase.from("editor_profiles").select("*, profiles(full_name)").order("created_at", { ascending: false }),
        supabase.from("orders").select("id, video_type, status, total_amount, platform_fee, editor_amount, created_at, client:profiles!orders_client_id_fkey(full_name), editor:profiles!orders_editor_id_fkey(full_name)").order("created_at", { ascending: false }).limit(100),
        supabase.from("disputes").select("id, order_id, reason, q1_type, q2_type, status, admin_note, created_at, orders(video_type, total_amount)").order("created_at", { ascending: false }),
      ]);

      const allEditors = (editorData as EditorCandidate[]) ?? [];
      const allOrders  = (orderData as unknown as OrderRow[]) ?? [];

      setCandidates(allEditors.filter(e => e.status === "pendente"));
      setEditors(allEditors.filter(e => e.status !== "pendente"));
      setOrders(allOrders);
      setDisputas((disputaData as unknown as DisputaRow[]) ?? []);

      // Calcular stats
      const completedOrders = allOrders.filter(o => o.status === "concluido");
      const activeOrders    = allOrders.filter(o => ["aceito", "em_andamento", "em_revisao"].includes(o.status));

      setStats({
        totalEditors:    allEditors.length,
        pendingEditors:  allEditors.filter(e => e.status === "pendente").length,
        approvedEditors: allEditors.filter(e => e.status === "aprovado").length,
        totalOrders:     allOrders.length,
        activeOrders:    activeOrders.length,
        completedOrders: completedOrders.length,
        totalRevenue:    completedOrders.reduce((s, o) => s + o.platform_fee, 0),
        pendingRevenue:  activeOrders.reduce((s, o) => s + o.platform_fee, 0),
      });
    } finally {
      setLoading(false);
    }
  };

  // ── Aprovar / Reprovar editor ───────────────────────────────────────────
  const handleEditorDecision = async (editorId: string, decision: "aprovado" | "rejeitado") => {
    setProcessingId(editorId);
    const { error } = await supabase
      .from("editor_profiles")
      .update({ status: decision })
      .eq("id", editorId);

    if (error) {
      toast.error("Erro ao processar decisão");
    } else {
      toast.success(decision === "aprovado" ? "Editor aprovado! 🎉" : "Editor reprovado.");
      setCandidates(prev => prev.filter(c => c.id !== editorId));
      if (decision === "aprovado") {
        setStats(prev => prev ? {
          ...prev,
          pendingEditors:  prev.pendingEditors - 1,
          approvedEditors: prev.approvedEditors + 1,
        } : null);
      }
    }
    setProcessingId(null);
  };

  // ── Guards ──────────────────────────────────────────────────────────────
  if (authLoading) return null;

  if (!user || accountType !== "admin") {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="container flex-1 grid place-items-center py-24">
          <div className="text-center space-y-4">
            <Shield className="w-12 h-12 text-destructive mx-auto" />
            <h2 className="text-2xl font-bold">Acesso restrito</h2>
            <p className="text-muted-foreground">Esta área é exclusiva para administradores.</p>
            <Button variant="hero" asChild><Link to="/">Voltar ao início</Link></Button>
          </div>
        </main>
      </div>
    );
  }

  // ── Filtros ─────────────────────────────────────────────────────────────
  const filteredOrders = orders.filter(o => {
    const matchSearch = !searchQuery ||
      o.video_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.client?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.editor?.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === "todos" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const filteredEditors = editors.filter(e => {
    const matchSearch = !searchQuery ||
      e.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.specialty.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === "todos" || e.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // ── Resolver disputa ────────────────────────────────────────────────────
  const handleResolveDisputa = async (disputaId: string, resolution: "resolvida_editor" | "resolvida_cliente") => {
    setProcessingId(disputaId);
    const note = adminNote[disputaId] ?? "";
    const { error } = await supabase.from("disputes").update({
      status:      resolution,
      admin_note:  note,
      resolved_at: new Date().toISOString(),
    }).eq("id", disputaId);

    if (error) { toast.error("Erro ao resolver disputa"); }
    else {
      toast.success(resolution === "resolvida_editor" ? "Resolvido a favor do editor!" : "Resolvido a favor do cliente!");
      setDisputas(prev => prev.map(d => d.id === disputaId ? { ...d, status: resolution } : d));
    }
    setProcessingId(null);
  };

  const TABS: { id: Tab; label: string; icon: typeof BarChart2; badge?: number }[] = [
    { id: "visao_geral", label: "Visão Geral",  icon: BarChart2 },
    { id: "curadoria",   label: "Curadoria",    icon: Award,          badge: stats?.pendingEditors },
    { id: "pedidos",     label: "Pedidos",       icon: Package,        badge: stats?.activeOrders },
    { id: "editores",    label: "Editores",      icon: Users },
    { id: "disputas",    label: "Disputas",      icon: AlertTriangle,  badge: disputas.filter(d => d.status === "aberta").length || undefined },
  ];

  const ORDER_STATUS_MAP: Record<string, { label: string; color: string }> = {
    aguardando_aceite: { label: "Aguardando",   color: "text-yellow-400 bg-yellow-400/10" },
    aceito:            { label: "Aceito",        color: "text-accent bg-accent/10" },
    em_andamento:      { label: "Em andamento",  color: "text-primary bg-primary/10" },
    em_revisao:        { label: "Em revisão",    color: "text-yellow-400 bg-yellow-400/10" },
    concluido:         { label: "Concluído",     color: "text-accent bg-accent/10" },
    cancelado:         { label: "Cancelado",     color: "text-destructive bg-destructive/10" },
    recusado:          { label: "Recusado",      color: "text-destructive bg-destructive/10" },
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      {/* Banner admin */}
      <div className="bg-primary/10 border-b border-primary/20 px-4 py-2 flex items-center justify-center gap-2 text-sm text-primary">
        <Shield className="w-4 h-4" />
        <span><strong>Painel Administrativo</strong> — Acesso restrito à equipe EDITAÍ</span>
      </div>

      <main className="container py-8 flex-1">

        {/* Header */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold">Central de gestão</h1>
            <p className="text-muted-foreground">Visão completa da plataforma</p>
          </div>
          <Button variant="outline" onClick={loadAll} className="gap-2">
            <TrendingUp className="w-4 h-4" /> Atualizar dados
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-secondary rounded-xl mb-8 w-fit flex-wrap">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); setSearchQuery(""); setStatusFilter("todos"); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-smooth ${
                tab === t.id ? "bg-gradient-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
              {t.badge ? (
                <span className="w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-xs grid place-items-center">
                  {t.badge}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid place-items-center py-24">
            <div className="text-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
              <p className="text-muted-foreground">Carregando dados...</p>
            </div>
          </div>
        ) : (
          <>
            {/* ── TAB: VISÃO GERAL ── */}
            {tab === "visao_geral" && stats && (
              <div className="space-y-8">

                {/* Stats principais */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: "Receita gerada",    value: formatBRL(stats.totalRevenue),   icon: DollarSign, color: "text-accent",   sub: `+ ${formatBRL(stats.pendingRevenue)} pendente` },
                    { label: "Pedidos ativos",     value: stats.activeOrders,              icon: Package,    color: "text-primary",  sub: `${stats.completedOrders} concluídos` },
                    { label: "Editores aprovados", value: stats.approvedEditors,           icon: Users,      color: "text-accent",   sub: `${stats.pendingEditors} aguardando curadoria` },
                    { label: "Total de pedidos",   value: stats.totalOrders,               icon: TrendingUp, color: "text-primary",  sub: "todos os tempos" },
                  ].map((s) => (
                    <div key={s.label} className="bg-gradient-card border border-border/50 rounded-2xl p-5">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs text-muted-foreground">{s.label}</span>
                        <s.icon className={`w-4 h-4 ${s.color}`} />
                      </div>
                      <div className="text-2xl font-bold mb-1">{s.value}</div>
                      <div className="text-xs text-muted-foreground">{s.sub}</div>
                    </div>
                  ))}
                </div>

                {/* Alertas rápidos */}
                {stats.pendingEditors > 0 && (
                  <div className="bg-yellow-400/10 border border-yellow-400/30 rounded-2xl p-5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Award className="w-8 h-8 text-yellow-400 flex-shrink-0" />
                      <div>
                        <p className="font-semibold">
                          {stats.pendingEditors} editor{stats.pendingEditors > 1 ? "es" : ""} aguardando curadoria
                        </p>
                        <p className="text-sm text-muted-foreground">Avalie os candidatos para liberar acesso à plataforma</p>
                      </div>
                    </div>
                    <Button variant="hero" onClick={() => setTab("curadoria")}>
                      Avaliar agora
                    </Button>
                  </div>
                )}

                {/* Pedidos recentes */}
                <div>
                  <h2 className="text-xl font-semibold mb-4">Pedidos recentes</h2>
                  <div className="grid gap-3">
                    {orders.slice(0, 5).map(o => {
                      const st = ORDER_STATUS_MAP[o.status] ?? { label: o.status, color: "text-muted-foreground bg-secondary" };
                      return (
                        <div key={o.id} className="bg-gradient-card border border-border/50 rounded-xl p-4 flex items-center justify-between gap-4 flex-wrap">
                          <div>
                            <div className="font-medium text-sm">{o.video_type}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {o.client?.full_name} → {o.editor?.full_name}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${st.color}`}>{st.label}</span>
                            <span className="text-sm font-bold">{formatBRL(o.total_amount)}</span>
                            <Button size="sm" variant="outline" className="gap-1"
                              onClick={() => navigate(`/chat/${o.id}`)}>
                              <Eye className="w-3.5 h-3.5" /> Ver chat
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ── TAB: CURADORIA ── */}
            {tab === "curadoria" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold">Candidatos aguardando avaliação</h2>
                    <p className="text-sm text-muted-foreground">{candidates.length} candidato{candidates.length !== 1 ? "s" : ""} na fila</p>
                  </div>
                </div>

                {candidates.length === 0 ? (
                  <div className="bg-gradient-card border border-border/50 rounded-2xl p-12 text-center">
                    <CheckCircle2 className="w-12 h-12 text-accent mx-auto mb-3" />
                    <p className="font-semibold">Nenhum candidato pendente!</p>
                    <p className="text-sm text-muted-foreground mt-1">Todos os editores foram avaliados.</p>
                  </div>
                ) : (
                  <div className="grid gap-5">
                    {candidates.map(c => {
                      const level = EDITOR_LEVELS[c.level];
                      const links = Array.isArray(c.portfolio_links) ? c.portfolio_links as string[] : [];
                      return (
                        <div key={c.id} className="bg-gradient-card border border-border/50 rounded-2xl p-6 space-y-5">

                          {/* Header candidato */}
                          <div className="flex items-start justify-between gap-4 flex-wrap">
                            <div className="flex items-center gap-4">
                              <div className="w-14 h-14 rounded-xl bg-gradient-primary grid place-items-center text-2xl font-bold text-primary-foreground">
                                {c.profiles?.full_name?.charAt(0).toUpperCase() ?? "?"}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="font-bold text-lg">{c.profiles?.full_name}</h3>
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold bg-gradient-to-r ${level.color} text-primary-foreground`}>
                                    {level.label}
                                  </span>
                                </div>
                                <p className="text-sm text-muted-foreground">{c.specialty}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  Candidatura: {new Date(c.created_at).toLocaleDateString("pt-BR")} ·
                                  Preço base: {formatBRL(c.base_price)}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-2 flex-shrink-0">
                              <Button
                                variant="hero"
                                className="gap-2 bg-accent hover:bg-accent/90"
                                onClick={() => handleEditorDecision(c.id, "aprovado")}
                                disabled={processingId === c.id}
                              >
                                {processingId === c.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <ThumbsUp className="w-4 h-4" />}
                                Aprovar
                              </Button>
                              <Button
                                variant="outline"
                                className="gap-2 text-destructive border-destructive/30 hover:bg-destructive/10"
                                onClick={() => handleEditorDecision(c.id, "rejeitado")}
                                disabled={processingId === c.id}
                              >
                                {processingId === c.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <ThumbsDown className="w-4 h-4" />}
                                Reprovar
                              </Button>
                            </div>
                          </div>

                          {/* Bio */}
                          {c.bio && (
                            <div className="bg-secondary/50 rounded-xl p-4">
                              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Bio</p>
                              <p className="text-sm">{c.bio}</p>
                            </div>
                          )}

                          {/* Portfólio */}
                          {links.length > 0 && (
                            <div>
                              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Portfólio</p>
                              <div className="flex flex-wrap gap-2">
                                {links.map((link, i) => (
                                  <a key={i} href={link} target="_blank" rel="noopener noreferrer">
                                    <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                                      <Eye className="w-3.5 h-3.5" /> Vídeo {i + 1}
                                    </Button>
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Scorecard */}
                          <div className="bg-secondary/30 rounded-xl p-4">
                            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3">Scorecard de avaliação</p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              {[
                                { label: "Técnica (40%)", key: "tecnica" },
                                { label: "Criatividade (25%)", key: "criatividade" },
                                { label: "Prazo (20%)", key: "prazo" },
                                { label: "Qualidade (15%)", key: "qualidade" },
                              ].map(criterion => (
                                <div key={criterion.key} className="text-center">
                                  <p className="text-xs text-muted-foreground mb-1">{criterion.label}</p>
                                  <div className="flex justify-center gap-1">
                                    {[1,2,3,4,5].map(star => (
                                      <Star key={star} className="w-4 h-4 text-muted-foreground hover:text-accent cursor-pointer transition-smooth" />
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                            <p className="text-xs text-muted-foreground text-center mt-3">
                              Nota mínima: {level.label === "Básico" ? "60" : level.label === "Intermediário" ? "70" : "80"} pontos
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── TAB: PEDIDOS ── */}
            {tab === "pedidos" && (
              <div className="space-y-5">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por tipo, cliente ou editor..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <div className="relative">
                    <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    <select
                      value={statusFilter}
                      onChange={e => setStatusFilter(e.target.value)}
                      className="pl-9 pr-8 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary appearance-none"
                    >
                      <option value="todos">Todos os status</option>
                      <option value="aguardando_aceite">Aguardando</option>
                      <option value="em_andamento">Em andamento</option>
                      <option value="em_revisao">Em revisão</option>
                      <option value="concluido">Concluído</option>
                      <option value="cancelado">Cancelado</option>
                    </select>
                    <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">{filteredOrders.length} pedido{filteredOrders.length !== 1 ? "s" : ""} encontrado{filteredOrders.length !== 1 ? "s" : ""}</p>

                <div className="grid gap-3">
                  {filteredOrders.map(o => {
                    const st = ORDER_STATUS_MAP[o.status] ?? { label: o.status, color: "text-muted-foreground bg-secondary" };
                    return (
                      <div key={o.id} className="bg-gradient-card border border-border/50 rounded-xl p-5 flex flex-col md:flex-row md:items-center gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold">{o.video_type}</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${st.color}`}>{st.label}</span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Cliente: <strong>{o.client?.full_name ?? "–"}</strong> ·
                            Editor: <strong>{o.editor?.full_name ?? "–"}</strong>
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {new Date(o.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right text-sm">
                            <div className="font-bold">{formatBRL(o.total_amount)}</div>
                            <div className="text-xs text-accent">+{formatBRL(o.platform_fee)} plataforma</div>
                          </div>
                          <Button size="sm" variant="outline" className="gap-1.5"
                            onClick={() => navigate(`/chat/${o.id}`)}>
                            <MessageSquare className="w-3.5 h-3.5" /> Ver chat
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── TAB: EDITORES ── */}
            {tab === "editores" && (
              <div className="space-y-5">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por nome ou especialidade..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <div className="relative">
                    <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    <select
                      value={statusFilter}
                      onChange={e => setStatusFilter(e.target.value)}
                      className="pl-9 pr-8 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary appearance-none"
                    >
                      <option value="todos">Todos</option>
                      <option value="aprovado">Aprovados</option>
                      <option value="rejeitado">Reprovados</option>
                    </select>
                    <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">{filteredEditors.length} editor{filteredEditors.length !== 1 ? "es" : ""} encontrado{filteredEditors.length !== 1 ? "s" : ""}</p>

                <div className="grid gap-3">
                  {filteredEditors.map(e => {
                    const level = EDITOR_LEVELS[e.level];
                    const isApproved = e.status === "aprovado";
                    return (
                      <div key={e.id} className="bg-gradient-card border border-border/50 rounded-xl p-5 flex flex-col md:flex-row md:items-center gap-4">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="w-12 h-12 rounded-xl bg-gradient-primary grid place-items-center text-xl font-bold text-primary-foreground flex-shrink-0">
                            {e.profiles?.full_name?.charAt(0).toUpperCase() ?? "?"}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold">{e.profiles?.full_name}</span>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold bg-gradient-to-r ${level.color} text-primary-foreground`}>
                                {level.label}
                              </span>
                              {isApproved ? (
                                <span className="px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/30 text-xs flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" /> Aprovado
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full bg-destructive/10 text-destructive border border-destructive/30 text-xs flex items-center gap-1">
                                  <XCircle className="w-3 h-3" /> Reprovado
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {e.specialty} · {formatBRL(e.base_price)}
                            </div>
                            <div className="flex items-center gap-1 mt-0.5">
                              <Star className="w-3 h-3 text-accent fill-accent" />
                              <span className="text-xs">{e.rating_avg.toFixed(1)} ({e.rating_count} avaliações)</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="gap-1"
                            onClick={() => navigate(`/editor/${e.id}`)}>
                            <Eye className="w-3.5 h-3.5" /> Perfil
                          </Button>
                          {isApproved && (
                            <Button size="sm" variant="outline"
                              className="text-destructive border-destructive/30 hover:bg-destructive/10"
                              onClick={() => handleEditorDecision(e.id, "rejeitado")}
                              disabled={processingId === e.id}>
                              {processingId === e.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                            </Button>
                          )}
                          {!isApproved && (
                            <Button size="sm" variant="outline"
                              className="text-accent border-accent/30 hover:bg-accent/10"
                              onClick={() => handleEditorDecision(e.id, "aprovado")}
                              disabled={processingId === e.id}>
                              {processingId === e.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {/* ── TAB: DISPUTAS ── */}
            {tab === "disputas" && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-xl font-semibold">Gestão de disputas</h2>
                  <p className="text-sm text-muted-foreground">
                    {disputas.filter(d => d.status === "aberta").length} disputa{disputas.filter(d => d.status === "aberta").length !== 1 ? "s" : ""} abertas
                  </p>
                </div>

                {disputas.length === 0 ? (
                  <div className="bg-gradient-card border border-border/50 rounded-2xl p-12 text-center">
                    <CheckCircle2 className="w-12 h-12 text-accent mx-auto mb-3" />
                    <p className="font-semibold">Nenhuma disputa aberta!</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {disputas.map(d => {
                      const isAberta = d.status === "aberta";
                      return (
                        <div key={d.id} className={`bg-gradient-card border rounded-2xl p-6 space-y-4 ${isAberta ? "border-yellow-400/30" : "border-border/50 opacity-70"}`}>
                          <div className="flex items-start justify-between gap-4 flex-wrap">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <AlertTriangle className={`w-4 h-4 ${isAberta ? "text-yellow-400" : "text-muted-foreground"}`} />
                                <span className="font-semibold">{d.orders?.video_type ?? "Pedido"}</span>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                  isAberta ? "bg-yellow-400/10 text-yellow-400" :
                                  d.status === "resolvida_editor" ? "bg-accent/10 text-accent" :
                                  "bg-primary/10 text-primary"
                                }`}>
                                  {isAberta ? "Aberta" : d.status === "resolvida_editor" ? "Favorável ao editor" : "Favorável ao cliente"}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {new Date(d.created_at).toLocaleDateString("pt-BR")} · Pedido: {d.order_id.slice(0, 8)}...
                              </p>
                            </div>
                            <Button size="sm" variant="outline" className="gap-1"
                              onClick={() => navigate(`/chat/${d.order_id}`)}>
                              <Eye className="w-3.5 h-3.5" /> Ver chat
                            </Button>
                          </div>

                          <div className="bg-secondary/50 rounded-xl p-4 text-sm">
                            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Motivo</p>
                            <p>{d.reason}</p>
                            {d.q1_type && (
                              <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
                                <span>Tipo Q1: <strong>{d.q1_type}</strong></span>
                                {d.q2_type && <span>Tipo Q2: <strong>{d.q2_type}</strong></span>}
                              </div>
                            )}
                          </div>

                          {isAberta && (
                            <div className="space-y-3">
                              <div>
                                <p className="text-xs font-medium mb-1.5">Nota da decisão (opcional)</p>
                                <textarea
                                  className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                                  rows={2}
                                  placeholder="Descreva o motivo da decisão para o histórico..."
                                  value={adminNote[d.id] ?? ""}
                                  onChange={e => setAdminNote(prev => ({ ...prev, [d.id]: e.target.value }))}
                                />
                              </div>
                              <div className="flex gap-3">
                                <Button
                                  variant="hero"
                                  className="flex-1 bg-accent hover:bg-accent/90 gap-2"
                                  onClick={() => handleResolveDisputa(d.id, "resolvida_editor")}
                                  disabled={processingId === d.id}
                                >
                                  {processingId === d.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <ThumbsUp className="w-4 h-4" />}
                                  Favor do editor
                                </Button>
                                <Button
                                  variant="outline"
                                  className="flex-1 gap-2"
                                  onClick={() => handleResolveDisputa(d.id, "resolvida_cliente")}
                                  disabled={processingId === d.id}
                                >
                                  {processingId === d.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <ThumbsDown className="w-4 h-4" />}
                                  Favor do cliente
                                </Button>
                              </div>
                            </div>
                          )}

                          {d.admin_note && !isAberta && (
                            <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 text-xs text-muted-foreground">
                              <strong className="text-foreground">Nota admin:</strong> {d.admin_note}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default DashboardAdmin;
