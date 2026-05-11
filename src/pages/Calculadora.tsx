import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calculator, ArrowRight, ArrowLeft, CheckCircle2,
  Clock, Zap, Film, Star, DollarSign, Info, TrendingUp
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { formatBRL, EDITOR_LEVELS } from "@/lib/constants";

// ── Dados da calculadora ───────────────────────────────────────────────────

const VIDEO_TYPES = [
  { id: "reels",        label: "Reels / Shorts / TikTok", icon: "📱", base: 80,  level: "basico" },
  { id: "youtube",      label: "Vídeo YouTube",            icon: "▶️", base: 150, level: "basico" },
  { id: "comercial",    label: "Comercial / Anúncio",      icon: "📢", base: 250, level: "intermediario" },
  { id: "motion",       label: "Motion Graphics",          icon: "✨", base: 300, level: "intermediario" },
  { id: "institucional",label: "Vídeo Institucional",      icon: "🏢", base: 350, level: "intermediario" },
  { id: "casamento",    label: "Casamento / Evento",       icon: "💍", base: 400, level: "intermediario" },
  { id: "documentario", label: "Documentário",             icon: "🎬", base: 600, level: "avancado" },
  { id: "outro",        label: "Outro",                    icon: "🎥", base: 150, level: "basico" },
] as const;

const DURATIONS = [
  { id: "curto",  label: "Curto (até 1 min)",      mult: 1.0 },
  { id: "medio",  label: "Médio (1 a 5 min)",      mult: 1.5 },
  { id: "longo",  label: "Longo (5 a 15 min)",     mult: 2.2 },
  { id: "extra",  label: "Extra-longo (15+ min)",  mult: 3.5 },
] as const;

const COMPLEXITIES = [
  { id: "simples",    label: "Simples",           desc: "Cortes básicos, trilha, legendas",             mult: 1.0 },
  { id: "moderado",   label: "Moderado",          desc: "Transições, color grading, efeitos simples",   mult: 1.5 },
  { id: "complexo",   label: "Complexo",          desc: "Motion graphics, VFX, multicâmera",            mult: 2.2 },
  { id: "avancado",   label: "Muito complexo",    desc: "Animações, composição avançada, 3D",           mult: 3.0 },
] as const;

const URGENCIES = [
  { id: "normal",   label: "Normal",              desc: "5+ dias úteis",      mult: 1.0 },
  { id: "rapido",   label: "Rápido",              desc: "3 a 5 dias úteis",   mult: 1.3 },
  { id: "urgente",  label: "Urgente",             desc: "1 a 2 dias úteis",   mult: 1.75 },
] as const;

type StepId = "tipo" | "duracao" | "complexidade" | "urgencia" | "resultado";

interface Selections {
  tipo:         typeof VIDEO_TYPES[number]["id"] | null;
  duracao:      typeof DURATIONS[number]["id"] | null;
  complexidade: typeof COMPLEXITIES[number]["id"] | null;
  urgencia:     typeof URGENCIES[number]["id"] | null;
}

// ── Componente de opção selecionável ──────────────────────────────────────
const OptionCard = ({
  label, desc, emoji, selected, onClick
}: { label: string; desc?: string; emoji?: string; selected: boolean; onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-start gap-3 ${
      selected
        ? "border-primary bg-primary/10"
        : "border-border/50 hover:border-primary/50 text-muted-foreground"
    }`}
  >
    {emoji && <span className="text-xl flex-shrink-0 mt-0.5">{emoji}</span>}
    <div>
      <p className={`font-medium text-sm ${selected ? "text-foreground" : ""}`}>{label}</p>
      {desc && <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>}
    </div>
    {selected && <CheckCircle2 className="w-4 h-4 text-primary ml-auto flex-shrink-0 mt-0.5" />}
  </button>
);

// ── Componente principal ───────────────────────────────────────────────────
const Calculadora = () => {
  const navigate = useNavigate();
  const [step, setStep]           = useState<StepId>("tipo");
  const [sel, setSel]             = useState<Selections>({ tipo: null, duracao: null, complexidade: null, urgencia: null });

  const STEPS: StepId[] = ["tipo", "duracao", "complexidade", "urgencia", "resultado"];
  const stepIndex = STEPS.indexOf(step);
  const stepLabels = ["Tipo", "Duração", "Complexidade", "Urgência", "Resultado"];

  const updateSel = (key: keyof Selections, value: string) =>
    setSel(prev => ({ ...prev, [key]: value }));

  // ── Cálculo ─────────────────────────────────────────────────────────────
  const calcular = () => {
    const tipo        = VIDEO_TYPES.find(v => v.id === sel.tipo);
    const duracao     = DURATIONS.find(d => d.id === sel.duracao);
    const complexidade= COMPLEXITIES.find(c => c.id === sel.complexidade);
    const urgencia    = URGENCIES.find(u => u.id === sel.urgencia);
    if (!tipo || !duracao || !complexidade || !urgencia) return null;

    const base = tipo.base * duracao.mult * complexidade.mult * urgencia.mult;
    const min  = Math.round(base * 0.85 / 10) * 10;
    const max  = Math.round(base * 1.35 / 10) * 10;
    return { min, max, nivel: tipo.level, tipo, duracao, complexidade, urgencia };
  };

  const resultado = step === "resultado" ? calcular() : null;

  const canNext = () => {
    if (step === "tipo")         return !!sel.tipo;
    if (step === "duracao")      return !!sel.duracao;
    if (step === "complexidade") return !!sel.complexidade;
    if (step === "urgencia")     return !!sel.urgencia;
    return false;
  };

  const handleNext = () => {
    const next = STEPS[stepIndex + 1];
    if (next) setStep(next);
  };

  const handleBack = () => {
    const prev = STEPS[stepIndex - 1];
    if (prev) setStep(prev);
  };

  const nivel = resultado ? EDITOR_LEVELS[resultado.nivel] : null;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="container py-12 flex-1">
        <div className="max-w-xl mx-auto">

          {/* Header */}
          <div className="text-center mb-10">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 grid place-items-center mx-auto mb-4">
              <Calculator className="w-7 h-7 text-primary" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Calculadora de Valor Justo</h1>
            <p className="text-muted-foreground text-sm">
              Descubra quanto custa um projeto como o seu — baseado em dados reais da plataforma.
            </p>
          </div>

          {/* Progress */}
          {step !== "resultado" && (
            <div className="mb-8">
              <div className="flex justify-between text-xs text-muted-foreground mb-2">
                {stepLabels.map((s, i) => (
                  <span key={s} className={i <= stepIndex ? "text-primary font-medium" : ""}>{s}</span>
                ))}
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-primary rounded-full transition-all duration-500"
                  style={{ width: `${((stepIndex + 1) / STEPS.length) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* ── STEP 1: Tipo ── */}
          {step === "tipo" && (
            <div className="bg-gradient-card border border-border/50 rounded-2xl p-6 space-y-4">
              <h2 className="font-bold text-lg">Qual tipo de vídeo você precisa?</h2>
              <div className="grid grid-cols-1 gap-2">
                {VIDEO_TYPES.map(v => (
                  <OptionCard key={v.id} label={v.label} emoji={v.icon}
                    selected={sel.tipo === v.id} onClick={() => updateSel("tipo", v.id)} />
                ))}
              </div>
            </div>
          )}

          {/* ── STEP 2: Duração ── */}
          {step === "duracao" && (
            <div className="bg-gradient-card border border-border/50 rounded-2xl p-6 space-y-4">
              <h2 className="font-bold text-lg">Qual será a duração do vídeo final?</h2>
              <div className="grid grid-cols-1 gap-2">
                {DURATIONS.map(d => (
                  <OptionCard key={d.id} label={d.label}
                    selected={sel.duracao === d.id} onClick={() => updateSel("duracao", d.id)} />
                ))}
              </div>
            </div>
          )}

          {/* ── STEP 3: Complexidade ── */}
          {step === "complexidade" && (
            <div className="bg-gradient-card border border-border/50 rounded-2xl p-6 space-y-4">
              <h2 className="font-bold text-lg">Qual a complexidade da edição?</h2>
              <p className="text-sm text-muted-foreground">Se tiver dúvida, escolha "Moderado" — é o mais comum.</p>
              <div className="grid grid-cols-1 gap-2">
                {COMPLEXITIES.map(c => (
                  <OptionCard key={c.id} label={c.label} desc={c.desc}
                    selected={sel.complexidade === c.id} onClick={() => updateSel("complexidade", c.id)} />
                ))}
              </div>
            </div>
          )}

          {/* ── STEP 4: Urgência ── */}
          {step === "urgencia" && (
            <div className="bg-gradient-card border border-border/50 rounded-2xl p-6 space-y-4">
              <h2 className="font-bold text-lg">Qual é o prazo?</h2>
              <p className="text-sm text-muted-foreground">Prazos mais curtos aumentam o valor — o editor precisa priorizar seu projeto.</p>
              <div className="grid grid-cols-1 gap-2">
                {URGENCIES.map(u => (
                  <OptionCard key={u.id} label={u.label} desc={u.desc}
                    selected={sel.urgencia === u.id} onClick={() => updateSel("urgencia", u.id)} />
                ))}
              </div>
            </div>
          )}

          {/* ── RESULTADO ── */}
          {step === "resultado" && resultado && nivel && (
            <div className="space-y-5">

              {/* Faixa de preço */}
              <div className="bg-gradient-card border border-primary/30 rounded-2xl p-8 text-center space-y-4">
                <p className="text-sm text-muted-foreground">Estimativa de valor justo</p>
                <div className="flex items-center justify-center gap-3">
                  <span className="text-4xl font-bold text-gradient">{formatBRL(resultado.min)}</span>
                  <span className="text-muted-foreground">–</span>
                  <span className="text-4xl font-bold text-gradient">{formatBRL(resultado.max)}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Baseado em projetos similares na plataforma Editaí
                </p>

                {/* Nível recomendado */}
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r ${nivel.color} text-primary-foreground text-sm font-semibold`}>
                  <Star className="w-4 h-4" /> Editor {nivel.label} recomendado
                </div>
              </div>

              {/* Resumo da escolha */}
              <div className="bg-gradient-card border border-border/50 rounded-2xl p-5 space-y-3">
                <p className="font-semibold text-sm">Seu projeto:</p>
                {[
                  { icon: Film,       label: VIDEO_TYPES.find(v => v.id === sel.tipo)?.label ?? "" },
                  { icon: Clock,      label: DURATIONS.find(d => d.id === sel.duracao)?.label ?? "" },
                  { icon: TrendingUp, label: COMPLEXITIES.find(c => c.id === sel.complexidade)?.label ?? "" },
                  { icon: Zap,        label: URGENCIES.find(u => u.id === sel.urgencia)?.label ?? "" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <item.icon className="w-4 h-4 text-primary" /> {item.label}
                  </div>
                ))}
              </div>

              {/* Dica sobre preço */}
              <div className="bg-accent/10 border border-accent/30 rounded-xl p-4 flex items-start gap-3 text-sm">
                <Info className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-foreground">Valores são estimativas</p>
                  <p className="text-muted-foreground text-xs mt-1">
                    Cada editor tem sua precificação. Use essa faixa como referência ao definir o orçamento do briefing — abaixo disso pode afastar bons editores.
                  </p>
                </div>
              </div>

              {/* CTAs */}
              <div className="flex flex-col gap-3">
                <Button variant="hero" className="w-full gap-2" onClick={() => navigate("/editores")}>
                  <DollarSign className="w-4 h-4" /> Encontrar editores nessa faixa
                  <ArrowRight className="w-4 h-4" />
                </Button>
                <Button variant="outline" className="w-full" onClick={() => { setSel({ tipo: null, duracao: null, complexidade: null, urgencia: null }); setStep("tipo"); }}>
                  Calcular outro projeto
                </Button>
              </div>
            </div>
          )}

          {/* Navegação */}
          {step !== "resultado" && (
            <div className="flex gap-3 mt-6">
              {stepIndex > 0 && (
                <Button variant="outline" className="flex-1" onClick={handleBack}>
                  <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
                </Button>
              )}
              <Button
                variant="hero"
                className="flex-1"
                onClick={handleNext}
                disabled={!canNext()}
              >
                {step === "urgencia" ? "Ver estimativa" : "Próximo"}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Calculadora;
