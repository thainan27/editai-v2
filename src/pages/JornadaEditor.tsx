import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  TrendingUp, Star, Clock, CheckCircle2, Award, Target,
  Zap, ArrowRight, BarChart2, ThumbsUp, Package, DollarSign,
  Calendar, ArrowLeft, Lock
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { formatBRL, EDITOR_LEVELS } from "@/lib/constants";
import type { EditorLevel } from "@/lib/constants";

// ── Tipos ──────────────────────────────────────────────────────────────────
interface EditorStats {
  level: EditorLevel;
  rating_avg: number;
  rating_count: number;
  specialty: string;
  base_price: number;
  created_at: string;
}

interface OrderStats {
  total: number;
  concluidos: number;
  cancelados: number;
  no_prazo: number;
  atrasados: number;
  total_ganho: number;
  tempo_medio_resposta: number;
}

interface PlatformAvg {
  rating_avg: number;
  on_time_rate: number;
  completion_rate: number;
}

// ── Componente de métrica com barra comparativa ────────────────────────────
const MetricBar = ({
  label, value, platformValue, unit = "%", color = "bg-primary", higherIsBetter = true
}: {
  label: string;
  value: number;
  platformValue: number;
  unit?: string;
  color?: string;
  higherIsBetter?: boolean;
}) => {
  const isAbove = higherIsBetter ? value >= platformValue : value <= platformValue;
  const pct = Math.min((value / Math.max(value, platformValue, 1)) * 100, 100);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <div className="flex items-center gap-2">
          <span className="font-bold">{typeof value === "number" && unit === "R$" ? formatBRL(value) : `${value}${unit}`}</span>
          <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${isAbove ? "bg-accent/10 text-accent" : "bg-yellow-400/10 text-yellow-400"}`}>
            {isAbove ? "▲" : "▼"} {higherIsBetter ? (value >= platformValue ? "acima" : "abaixo") : (value <= platformValue ? "acima" : "abaixo")} da média
          </span>
        </div>
      </div>
      <div className="relative h-2 bg-secondary rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Você: <strong className="text-foreground">{typeof value === "number" && unit === "R$" ? formatBRL(value) : `${value}${unit}`}</strong></span>
        <span>Média Editaí: <strong className="text-foreground">{typeof platformValue === "number" && unit === "R$" ? formatBRL(platformValue) : `${platformValue}${unit}`}</strong></span>
      </div>
    </div>
  );
};

// ── Componente de conquista ────────────────────────────────────────────────
const Badge = ({ icon: Icon, label, desc, unlocked }: { icon: typeof Star; label: string; desc: string; unlocked: boolean }) => (
  <div className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${unlocked ? "bg-accent/5 border-accent/30" : "bg-secondary/30 border-border/30 opacity-50"}`}>
    <div className={`w-10 h-10 rounded-xl grid place-items-center flex-shrink-0 ${unlocked ? "bg-accent/10" : "bg-secondary"}`}>
      {unlocked ? <Icon className="w-5 h-5 text-accent" /> : <Lock className="w-4 h-4 text-muted-foreground" />}
    </div>
    <div>
      <p className={`text-sm font-semibold ${!unlocked && "text-muted-foreground"}`}>{label}</p>
      <p className="text-xs text-muted-foreground">{desc}</p>
    </div>
  </div>
);

// ── Componente principal ───────────────────────────────────────────────────
const JornadaEditor = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile]         = useState<EditorStats | null>(null);
  const [stats, setStats]             = useState<OrderStats | null>(null);
  const [platformAvg, setPlatformAvg] = useState<PlatformAvg | null>(null);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      // Busca perfil do editor
      const { data: ep } = await supabase
        .from("editor_profiles")
        .select("level, rating_avg, rating_count, specialty, base_price, created_at")
        .eq("id", user.id)
        .single();

      if (!ep) { setLoading(false); return; }
      setProfile(ep as EditorStats);

      // Busca pedidos do editor
      const { data: orders } = await supabase
        .from("orders")
        .select("status, deadline, created_at, editor_amount, updated_at")
        .eq("editor_id", user.id);

      if (orders) {
        const total      = orders.length;
        const concluidos = orders.filter(o => o.status === "concluido").length;
        const cancelados = orders.filter(o => o.status === "cancelado").length;
        const totalGanho = orders.filter(o => o.status === "concluido").reduce((s, o) => s + (o.editor_amount ?? 0), 0);

        // Calcula entregas no prazo
        const comPrazo = orders.filter(o => o.status === "concluido" && o.deadline);
        const noPrazo  = comPrazo.filter(o => new Date(o.updated_at) <= new Date(o.deadline!)).length;

        setStats({
          total,
          concluidos,
          cancelados,
          no_prazo:   noPrazo,
          atrasados:  comPrazo.length - noPrazo,
          total_ganho: totalGanho,
          tempo_medio_resposta: 2, // horas — implementar com dados reais futuramente
        });
      }

      // Médias da plataforma para o mesmo nível (simuladas até ter dados suficientes)
      setPlatformAvg({
        rating_avg:      4.2,
        on_time_rate:    87,
        completion_rate: 82,
      });

      setLoading(false);
    })();
  }, [user]);

  if (!user || loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="container flex-1 grid place-items-center">
          <div className="space-y-3 animate-pulse text-center">
            <div className="w-16 h-16 rounded-2xl bg-secondary mx-auto" />
            <div className="h-4 w-48 bg-secondary rounded mx-auto" />
          </div>
        </main>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="container flex-1 grid place-items-center">
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">Complete seu perfil de editor para ver sua jornada.</p>
            <Button variant="hero" onClick={() => navigate("/candidatura")}>Completar perfil</Button>
          </div>
        </main>
      </div>
    );
  }

  const level      = EDITOR_LEVELS[profile.level];
  const nextLevel  = profile.level === "basico" ? "intermediario" : profile.level === "intermediario" ? "avancado" : null;
  const nextLevelData = nextLevel ? EDITOR_LEVELS[nextLevel] : null;

  // Progresso para próximo nível
  const projectsToNextLevel = nextLevel
    ? Math.max(0, (profile.level === "basico" ? 10 : 20) - (stats?.concluidos ?? 0))
    : 0;
  const progressToNext = nextLevel
    ? Math.min(((stats?.concluidos ?? 0) / (profile.level === "basico" ? 10 : 20)) * 100, 100)
    : 100;

  // Métricas calculadas
  const onTimeRate      = stats && stats.no_prazo + stats.atrasados > 0 ? Math.round((stats.no_prazo / (stats.no_prazo + stats.atrasados)) * 100) : 100;
  const completionRate  = stats && stats.total > 0 ? Math.round((stats.concluidos / stats.total) * 100) : 0;
  const memberSince     = new Date(profile.created_at).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  // Conquistas
  const achievements = [
    { icon: Star,       label: "Primeira estrela",   desc: "Receba sua primeira avaliação 5 estrelas",   unlocked: profile.rating_count >= 1 && profile.rating_avg >= 5 },
    { icon: Package,    label: "Primeiro projeto",   desc: "Conclua seu primeiro projeto",               unlocked: (stats?.concluidos ?? 0) >= 1 },
    { icon: Zap,        label: "Velocidade",          desc: "Entregue 3 projetos antes do prazo",        unlocked: (stats?.no_prazo ?? 0) >= 3 },
    { icon: ThumbsUp,   label: "5 projetos",          desc: "Conclua 5 projetos com sucesso",            unlocked: (stats?.concluidos ?? 0) >= 5 },
    { icon: TrendingUp, label: "Nota 4.5+",           desc: "Mantenha média acima de 4.5 estrelas",      unlocked: profile.rating_avg >= 4.5 && profile.rating_count >= 3 },
    { icon: Award,      label: "10 projetos",         desc: "Conclua 10 projetos — elegível ao próximo nível", unlocked: (stats?.concluidos ?? 0) >= 10 },
    { icon: DollarSign, label: "R$1.000 ganhos",     desc: "Acumule R$1.000 em ganhos na plataforma",   unlocked: (stats?.total_ganho ?? 0) >= 1000 },
    { icon: CheckCircle2,"label": "100% no prazo",   desc: "Entregue 5 projetos seguidos sem atraso",   unlocked: onTimeRate === 100 && (stats?.concluidos ?? 0) >= 5 },
  ] as { icon: typeof Star; label: string; desc: string; unlocked: boolean }[];

  const unlockedCount = achievements.filter(a => a.unlocked).length;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">

        {/* Hero */}
        <div className="relative overflow-hidden border-b border-border/50">
          <div className="absolute inset-0 grid-bg opacity-20 pointer-events-none" />
          <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${level.color}`} />
          <div className="container py-10 relative">
            <button onClick={() => navigate("/dashboard/editor")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-smooth">
              <ArrowLeft className="w-4 h-4" /> Voltar ao painel
            </button>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold">Minha Jornada</h1>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${level.color} text-primary-foreground`}>
                    Nível {level.label}
                  </span>
                </div>
                <p className="text-muted-foreground text-sm">
                  {profile.specialty} · Editor desde {memberSince}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {[1,2,3,4,5].map(i => (
                  <Star key={i} className={`w-5 h-5 ${i <= Math.round(profile.rating_avg) ? "text-accent fill-accent" : "text-muted-foreground"}`} />
                ))}
                <span className="font-bold ml-1">{profile.rating_avg.toFixed(1)}</span>
                <span className="text-muted-foreground text-sm">({profile.rating_count} avaliações)</span>
              </div>
            </div>
          </div>
        </div>

        <div className="container py-10 space-y-8">

          {/* ── CARDS DE RESUMO ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Projetos concluídos", value: stats?.concluidos ?? 0,          icon: Package,    color: "text-primary" },
              { label: "Total ganho",          value: formatBRL(stats?.total_ganho ?? 0), icon: DollarSign, color: "text-accent" },
              { label: "Entregas no prazo",   value: `${onTimeRate}%`,                 icon: Clock,      color: "text-accent" },
              { label: "Conquistas",           value: `${unlockedCount}/${achievements.length}`, icon: Award, color: "text-yellow-400" },
            ].map(s => (
              <div key={s.label} className="bg-gradient-card border border-border/50 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-muted-foreground">{s.label}</span>
                  <s.icon className={`w-4 h-4 ${s.color}`} />
                </div>
                <div className="text-2xl font-bold">{s.value}</div>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-8">

            {/* ── COLUNA ESQUERDA ── */}
            <div className="space-y-6">

              {/* Progressão de nível */}
              {nextLevelData && (
                <div className="bg-gradient-card border border-border/50 rounded-2xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="font-bold flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-primary" /> Progressão de nível
                    </h2>
                    <span className="text-xs text-muted-foreground">
                      {stats?.concluidos ?? 0}/{profile.level === "basico" ? 10 : 20} projetos
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${level.color} grid place-items-center`}>
                        <Award className="w-6 h-6 text-primary-foreground" />
                      </div>
                      <p className="text-xs mt-1 font-medium">{level.label}</p>
                    </div>
                    <div className="flex-1">
                      <div className="h-3 bg-secondary rounded-full overflow-hidden">
                        <div className={`h-full bg-gradient-to-r ${level.color} rounded-full transition-all duration-1000`}
                          style={{ width: `${progressToNext}%` }} />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 text-center">
                        {progressToNext.toFixed(0)}% concluído
                      </p>
                    </div>
                    <div className="text-center opacity-50">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${nextLevelData.color} grid place-items-center`}>
                        <Award className="w-6 h-6 text-primary-foreground" />
                      </div>
                      <p className="text-xs mt-1 font-medium">{nextLevelData.label}</p>
                    </div>
                  </div>

                  {projectsToNextLevel > 0 ? (
                    <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 text-sm">
                      <p className="font-medium mb-1">Para subir de nível:</p>
                      <div className="space-y-1 text-muted-foreground text-xs">
                        <div className="flex items-center gap-2">
                          <Target className="w-3.5 h-3.5 text-primary" />
                          Faltam <strong className="text-foreground">{projectsToNextLevel} projetos</strong> concluídos
                        </div>
                        <div className="flex items-center gap-2">
                          <Star className="w-3.5 h-3.5 text-accent" />
                          Manter nota média <strong className="text-foreground">4.5+</strong>
                        </div>
                        <div className="flex items-center gap-2">
                          <Zap className="w-3.5 h-3.5 text-yellow-400" />
                          Ao subir: taxa cai para <strong className="text-foreground">{Math.round(EDITOR_LEVELS[nextLevel!].platformFee * 100)}%</strong>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-accent/10 border border-accent/30 rounded-xl p-4 text-sm text-center">
                      <p className="font-semibold text-accent">🎉 Você está elegível ao próximo nível!</p>
                      <p className="text-xs text-muted-foreground mt-1">Nossa equipe entrará em contato com o convite.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Desempenho comparativo */}
              {platformAvg && (
                <div className="bg-gradient-card border border-border/50 rounded-2xl p-6 space-y-5">
                  <h2 className="font-bold flex items-center gap-2">
                    <BarChart2 className="w-5 h-5 text-primary" /> Seu desempenho vs. plataforma
                  </h2>
                  <p className="text-xs text-muted-foreground -mt-2">
                    Comparado com editores {level.label} do Editaí
                  </p>
                  <MetricBar
                    label="Avaliação média"
                    value={parseFloat(profile.rating_avg.toFixed(1))}
                    platformValue={platformAvg.rating_avg}
                    unit=" ⭐"
                    color="bg-accent"
                  />
                  <MetricBar
                    label="Entregas no prazo"
                    value={onTimeRate}
                    platformValue={platformAvg.on_time_rate}
                    color="bg-primary"
                  />
                  <MetricBar
                    label="Taxa de conclusão"
                    value={completionRate}
                    platformValue={platformAvg.completion_rate}
                    color="bg-accent"
                  />
                </div>
              )}
            </div>

            {/* ── COLUNA DIREITA ── */}
            <div className="space-y-6">

              {/* Histórico mensal simplificado */}
              <div className="bg-gradient-card border border-border/50 rounded-2xl p-6 space-y-4">
                <h2 className="font-bold flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" /> Resumo geral
                </h2>
                <div className="space-y-3">
                  {[
                    { label: "Total de pedidos recebidos", value: stats?.total ?? 0, icon: Package },
                    { label: "Projetos concluídos",        value: stats?.concluidos ?? 0, icon: CheckCircle2 },
                    { label: "Entregas no prazo",          value: stats?.no_prazo ?? 0, icon: Clock },
                    { label: "Pedidos cancelados",         value: stats?.cancelados ?? 0, icon: TrendingUp },
                    { label: "Total acumulado",            value: formatBRL(stats?.total_ganho ?? 0), icon: DollarSign },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <item.icon className="w-4 h-4 text-primary" />
                        {item.label}
                      </div>
                      <span className="font-semibold text-sm">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Conquistas */}
              <div className="bg-gradient-card border border-border/50 rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-bold flex items-center gap-2">
                    <Award className="w-5 h-5 text-accent" /> Conquistas
                  </h2>
                  <span className="text-xs text-muted-foreground">{unlockedCount}/{achievements.length} desbloqueadas</span>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {achievements.map(a => (
                    <Badge key={a.label} icon={a.icon} label={a.label} desc={a.desc} unlocked={a.unlocked} />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="bg-gradient-card border border-primary/20 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <p className="font-bold text-lg">Continue crescendo!</p>
              <p className="text-sm text-muted-foreground">Cada projeto bem entregue te aproxima do próximo nível e de uma taxa menor.</p>
            </div>
            <Button variant="hero" onClick={() => navigate("/dashboard/editor")}>
              Ver pedidos <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default JornadaEditor;
