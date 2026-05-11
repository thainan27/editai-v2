import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft, ArrowRight, CheckCircle2, Loader2,
  Clock, DollarSign, FileText, Link2, Clapperboard,
  Star, Shield, Zap, Calendar, Film, Sparkles, RefreshCw, Calculator
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EDITOR_LEVELS, SPECIALTIES, formatBRL } from "@/lib/constants";
import type { EditorLevel } from "@/lib/constants";
import { toast } from "sonner";

// ── Tipos ──────────────────────────────────────────────────────────────────
interface EditorSummary {
  id: string;
  bio: string | null;
  specialty: string;
  level: EditorLevel;
  base_price: number;
  rating_avg: number;
  rating_count: number;
  profiles: { full_name: string } | null;
}

type Step = "assistente" | "projeto" | "detalhes" | "revisao" | "confirmado";

// ── Perguntas do assistente IA ─────────────────────────────────────────────
const AI_QUESTIONS = [
  {
    id: "objetivo",
    label: "Qual é o objetivo do vídeo?",
    placeholder: "Ex: promover meu produto, crescer no YouTube, divulgar evento...",
    hint: "Pense no resultado que você quer alcançar com esse vídeo.",
  },
  {
    id: "publico",
    label: "Quem vai assistir esse vídeo?",
    placeholder: "Ex: jovens de 18-25 anos, empresários, fãs de games...",
    hint: "Quanto mais específico, mais direcionado será o brief.",
  },
  {
    id: "estilo",
    label: "Tem algum vídeo que você gosta e serve de referência?",
    placeholder: "Ex: link do YouTube, nome de um criador, ou descreva o estilo...",
    hint: "Pode ser um link, um canal ou só descrever o tom: divertido, sério, cinematográfico...",
  },
];

// ── Função: gera brief com Claude API ─────────────────────────────────────
async function gerarBriefIA(
  videoType: string,
  editorSpecialty: string,
  answers: Record<string, string>
): Promise<string> {
  const prompt = `Você é um assistente especializado em briefings para editores de vídeo profissionais.

Com base nas informações abaixo, escreva um briefing claro, objetivo e detalhado para um editor de vídeo.
O briefing deve ser escrito em primeira pessoa, como se o cliente estivesse descrevendo o projeto.
Use linguagem simples e direta. Máximo de 250 palavras.

Tipo de vídeo: ${videoType}
Especialidade do editor: ${editorSpecialty}
Objetivo do vídeo: ${answers.objetivo || "não informado"}
Público-alvo: ${answers.publico || "não informado"}
Referência de estilo: ${answers.estilo || "não informada"}

Escreva o briefing completo incluindo:
- O que será editado
- Objetivo e público
- Tom e estilo desejado
- Plataforma de publicação (inferir pelo tipo)
- O que é importante destacar

Responda APENAS com o texto do briefing, sem títulos ou introduções.`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  const data = await response.json();
  return data.content?.[0]?.text ?? "";
}

interface BriefingForm {
  video_type: string;
  package_name: string;
  briefing: string;
  references_text: string;
  duration_minutes: string;
  deadline: string;
  total_amount: string;
}

const VIDEO_TYPES = [
  "Reels / TikTok / Shorts",
  "Vídeo para YouTube",
  "Comercial / Anúncio",
  "Motion Graphics",
  "Vlog / Lifestyle",
  "Entrevista / Podcast",
  "Casamento / Evento",
  "Documentário",
  "Vídeo Institucional",
  "Gaming / Gameplay",
  "Outro",
];

const PACKAGES = [
  { id: "basico", label: "Básico", desc: "Entrega simples, sem revisões extras", revisoes: 1 },
  { id: "padrao", label: "Padrão", desc: "Inclui 2 rodadas de revisão", revisoes: 2 },
  { id: "premium", label: "Premium", desc: "Até 3 revisões + entrega prioritária", revisoes: 3 },
];

// ── Componente ─────────────────────────────────────────────────────────────
const Briefing = () => {
  const { editorId } = useParams<{ editorId: string }>();
  const navigate = useNavigate();
  const { user, accountType, loading: authLoading } = useAuth();

  const [editor, setEditor] = useState<EditorSummary | null>(null);
  const [loadingEditor, setLoadingEditor] = useState(true);
  const [step, setStep] = useState<Step>("assistente");
  const [submitting, setSubmitting] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [aiAnswers, setAiAnswers] = useState<Record<string, string>>({});
  const [aiLoading, setAiLoading] = useState(false);
  const [aiGenerated, setAiGenerated] = useState(false);

  const [form, setForm] = useState<BriefingForm>({
    video_type: "",
    package_name: "padrao",
    briefing: "",
    references_text: "",
    duration_minutes: "",
    deadline: "",
    total_amount: "",
  });

  const steps: Step[] = ["assistente", "projeto", "detalhes", "revisao"];
  const stepIndex = steps.indexOf(step);

  // ── Gera brief com IA ──────────────────────────────────────────────────
  const handleGerarBrief = async () => {
    if (!form.video_type) { toast.error("Selecione o tipo de vídeo primeiro"); return; }
    setAiLoading(true);
    try {
      const brief = await gerarBriefIA(form.video_type, editor?.specialty ?? "", aiAnswers);
      if (brief) {
        update("briefing", brief);
        setAiGenerated(true);
        setStep("detalhes");
        toast.success("Brief gerado! Revise e personalize antes de enviar.");
      }
    } catch {
      toast.error("Erro ao gerar brief. Continue preenchendo manualmente.");
      setStep("detalhes");
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => {
    if (!editorId) return;
    (async () => {
      const { data } = await supabase
        .from("editor_profiles")
        .select("id, bio, specialty, level, base_price, rating_avg, rating_count, profiles(full_name)")
        .eq("id", editorId)
        .eq("status", "aprovado")
        .single();
      setEditor(data as unknown as EditorSummary | null);
      if (data) {
        setForm(f => ({ ...f, total_amount: String((data as unknown as EditorSummary).base_price) }));
      }
      setLoadingEditor(false);
    })();
  }, [editorId]);

  const update = (key: keyof BriefingForm, value: string) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const level = editor ? EDITOR_LEVELS[editor.level] : null;
  const platformFee = level?.platformFee ?? 0.15;
  const totalAmount = parseFloat(form.total_amount) || 0;
  const platformAmount = totalAmount * platformFee;
  const editorAmount = totalAmount - platformAmount;

  const minDeadline = new Date();
  minDeadline.setDate(minDeadline.getDate() + 2);
  const minDeadlineStr = minDeadline.toISOString().split("T")[0];

  // ── Validações por step ──────────────────────────────────────────────────
  const validateStep = () => {
    if (step === "projeto") {
      if (!form.video_type) { toast.error("Selecione o tipo de vídeo"); return false; }
      if (!form.package_name) { toast.error("Selecione um pacote"); return false; }
      return true;
    }
    if (step === "detalhes") {
      if (form.briefing.trim().length < 30) { toast.error("Descreva o projeto com pelo menos 30 caracteres"); return false; }
      if (!form.deadline) { toast.error("Informe o prazo desejado"); return false; }
      if (!form.total_amount || totalAmount < (level?.priceRange[0] ?? 0)) {
        toast.error(`Valor mínimo: ${formatBRL(level?.priceRange[0] ?? 0)}`);
        return false;
      }
      return true;
    }
    return true;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    if (step === "assistente") setStep("projeto");
    else if (step === "projeto") {
      // Se respondeu as perguntas da IA, gera o brief automaticamente
      if (Object.values(aiAnswers).some(v => v.trim())) {
        handleGerarBrief();
      } else {
        setStep("detalhes");
      }
    }
    else if (step === "detalhes") setStep("revisao");
    else if (step === "revisao") handleSubmit();
  };

  const handleSubmit = async () => {
    if (!user || !editor) return;
    setSubmitting(true);
    try {
      const { data, error } = await supabase.from("orders").insert({
        client_id: user.id,
        editor_id: editor.id,
        video_type: form.video_type,
        package_name: form.package_name,
        briefing: form.briefing.trim(),
        references_text: form.references_text.trim() || null,
        duration_minutes: form.duration_minutes ? parseInt(form.duration_minutes) : null,
        deadline: form.deadline || null,
        total_amount: totalAmount,
        platform_fee: platformAmount,
        editor_amount: editorAmount,
        status: "aguardando_aceite",
      }).select("id").single();

      if (error) throw error;
      setOrderId(data.id);
      setStep("confirmado");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao criar pedido");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Auth guard ──────────────────────────────────────────────────────────
  if (!authLoading && !user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="container py-24 flex-1 grid place-items-center">
          <div className="text-center space-y-4 max-w-sm">
            <Clapperboard className="w-12 h-12 text-primary mx-auto" />
            <h2 className="text-2xl font-bold">Entre para contratar</h2>
            <p className="text-muted-foreground text-sm">Você precisa ter uma conta de cliente para enviar um briefing.</p>
            <Button variant="hero" className="w-full" asChild>
              <Link to={`/login?redirect=/briefing/${editorId}`}>Entrar</Link>
            </Button>
            <Button variant="outline" className="w-full" asChild>
              <Link to={`/cadastro?tipo=cliente&redirect=/briefing/${editorId}`}>Criar conta grátis</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!authLoading && accountType === "editor") {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="container py-24 flex-1 grid place-items-center">
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">Editores não podem contratar outros editores.</p>
            <Button variant="hero" asChild><Link to="/editores">Ver editores</Link></Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (loadingEditor) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="container py-24 flex-1 grid place-items-center">
          <div className="space-y-3 animate-pulse text-center">
            <div className="w-16 h-16 rounded-xl bg-secondary mx-auto" />
            <div className="h-4 w-40 bg-secondary rounded mx-auto" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!editor) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="container py-24 flex-1 grid place-items-center">
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">Editor não encontrado.</p>
            <Button variant="hero" asChild><Link to="/editores">Ver editores</Link></Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="container py-10 flex-1">
        <button onClick={() => navigate(`/editor/${editor.id}`)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-smooth">
          <ArrowLeft className="w-4 h-4" /> Voltar ao perfil
        </button>

        <div className="flex flex-col lg:flex-row gap-8 items-start">

          {/* ── FORMULÁRIO ── */}
          <div className="flex-1 min-w-0">

            {/* Progress */}
            {step !== "confirmado" && (
              <div className="mb-8">
                <div className="flex justify-between text-xs text-muted-foreground mb-2">
                  {["Assistente", "Projeto", "Detalhes", "Revisão"].map((s, i) => (
                    <span key={s} className={i <= stepIndex ? "text-primary font-medium" : ""}>{s}</span>
                  ))}
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-primary rounded-full transition-all duration-500"
                    style={{ width: `${((stepIndex + 1) / 4) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* ── STEP 0: ASSISTENTE IA ── */}
            {step === "assistente" && (
              <div className="bg-gradient-card border border-border/50 rounded-2xl p-6 md:p-8 space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-accent/10 grid place-items-center flex-shrink-0">
                    <Sparkles className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold mb-1">Assistente de brief</h2>
                    <p className="text-sm text-muted-foreground">
                      Responda 3 perguntas rápidas e a IA escreve um brief profissional para você. Você pode editar depois.
                    </p>
                  </div>
                </div>

                {AI_QUESTIONS.map((q) => (
                  <div key={q.id}>
                    <Label>{q.label}</Label>
                    <Textarea
                      placeholder={q.placeholder}
                      value={aiAnswers[q.id] ?? ""}
                      onChange={e => setAiAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                      rows={2}
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">{q.hint}</p>
                  </div>
                ))}

                <div className="bg-secondary/50 rounded-xl p-4 text-xs text-muted-foreground flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                  O brief gerado é um ponto de partida — você pode editar livremente antes de enviar ao editor.
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setStep("projeto")}
                  >
                    Pular — preencher manualmente
                  </Button>
                  <Button
                    variant="hero"
                    className="flex-1 gap-2"
                    onClick={() => { setStep("projeto"); }}
                    disabled={aiLoading}
                  >
                    Próximo <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* ── STEP 1: PROJETO ── */}
            {step === "projeto" && (
              <div className="bg-gradient-card border border-border/50 rounded-2xl p-6 md:p-8 space-y-6">
                <div>
                  <h2 className="text-2xl font-bold mb-1">Sobre o projeto</h2>
                  <p className="text-sm text-muted-foreground">Conte o que você precisa editar</p>
                </div>

                <div>
                  <Label>Tipo de vídeo *</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                    {VIDEO_TYPES.map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => update("video_type", type)}
                        className={`px-3 py-2.5 rounded-xl border text-sm text-left transition-all ${
                          form.video_type === type
                            ? "border-primary bg-primary/10 text-foreground font-medium"
                            : "border-border/50 hover:border-primary/50 text-muted-foreground"
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Pacote *</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
                    {PACKAGES.map((pkg) => (
                      <button
                        key={pkg.id}
                        type="button"
                        onClick={() => update("package_name", pkg.id)}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${
                          form.package_name === pkg.id
                            ? "border-primary bg-primary/10"
                            : "border-border/50 hover:border-primary/50"
                        }`}
                      >
                        <div className="font-semibold text-sm">{pkg.label}</div>
                        <div className="text-xs text-muted-foreground mt-1">{pkg.desc}</div>
                        <div className="text-xs text-primary mt-2">{pkg.revisoes}x revisão</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Duração estimada do vídeo final</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      type="number"
                      placeholder="Ex: 3"
                      value={form.duration_minutes}
                      onChange={(e) => update("duration_minutes", e.target.value)}
                      min={1}
                      className="max-w-xs"
                    />
                    <span className="text-sm text-muted-foreground">minutos</span>
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 2: DETALHES ── */}
            {step === "detalhes" && (
              <div className="bg-gradient-card border border-border/50 rounded-2xl p-6 md:p-8 space-y-6">
                <div>
                  <h2 className="text-2xl font-bold mb-1">Detalhes do briefing</h2>
                  <p className="text-sm text-muted-foreground">Quanto mais detalhe, melhor o resultado</p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Label>Descrição do projeto *</Label>
                    {!aiGenerated && Object.values(aiAnswers).some(v => v.trim()) && form.video_type && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-1.5 text-xs h-7"
                        onClick={handleGerarBrief}
                        disabled={aiLoading}
                      >
                        {aiLoading
                          ? <><Loader2 className="w-3 h-3 animate-spin" /> Gerando...</>
                          : <><Sparkles className="w-3 h-3 text-accent" /> Gerar com IA</>
                        }
                      </Button>
                    )}
                    {aiGenerated && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-1.5 text-xs h-7"
                        onClick={handleGerarBrief}
                        disabled={aiLoading}
                      >
                        <RefreshCw className="w-3 h-3" /> Regerar
                      </Button>
                    )}
                  </div>
                  {aiGenerated && (
                    <div className="flex items-center gap-1.5 mb-2 text-xs text-accent">
                      <Sparkles className="w-3 h-3" /> Brief gerado pela IA — edite à vontade!
                    </div>
                  )}
                  <Textarea
                    placeholder="Descreva o vídeo: o que você tem de material bruto, qual o objetivo, tom/estilo desejado, público-alvo, plataforma de publicação..."
                    value={form.briefing}
                    onChange={(e) => update("briefing", e.target.value)}
                    rows={6}
                    className="mt-1"
                    maxLength={2000}
                  />
                  <div className="flex justify-between mt-1">
                    <p className="text-xs text-muted-foreground">Mínimo 30 caracteres</p>
                    <p className="text-xs text-muted-foreground">{form.briefing.length}/2000</p>
                  </div>
                </div>

                <div>
                  <Label>Links de referência</Label>
                  <Textarea
                    placeholder="Cole aqui links de vídeos de referência, estilo, moodboard, Drive com material bruto..."
                    value={form.references_text}
                    onChange={(e) => update("references_text", e.target.value)}
                    rows={3}
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Um link por linha</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Prazo desejado *</Label>
                    <Input
                      type="date"
                      value={form.deadline}
                      onChange={(e) => update("deadline", e.target.value)}
                      min={minDeadlineStr}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <Label>Valor do projeto (R$) *</Label>
                      <a href="/calculadora" target="_blank" className="text-xs text-primary hover:underline flex items-center gap-1">
                        <Calculator className="w-3 h-3" /> Calcular valor justo
                      </a>
                    </div>
                    <Input
                      type="number"
                      placeholder={`Mín: ${formatBRL(level?.priceRange[0] ?? 0)}`}
                      value={form.total_amount}
                      onChange={(e) => update("total_amount", e.target.value)}
                      min={level?.priceRange[0]}
                      max={level?.priceRange[1]}
                      className="mt-1"
                    />
                    {totalAmount > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Editor recebe {formatBRL(editorAmount)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-sm text-muted-foreground">
                  <strong className="text-foreground">💡 Como funciona o pagamento:</strong> O valor é retido pela plataforma ao confirmar o pedido. O editor só recebe após sua aprovação final. Você pode solicitar revisões conforme o pacote escolhido.
                </div>
              </div>
            )}

            {/* ── STEP 3: REVISÃO ── */}
            {step === "revisao" && (
              <div className="bg-gradient-card border border-border/50 rounded-2xl p-6 md:p-8 space-y-6">
                <div>
                  <h2 className="text-2xl font-bold mb-1">Revisar pedido</h2>
                  <p className="text-sm text-muted-foreground">Confirme tudo antes de enviar</p>
                </div>

                <div className="space-y-3">
                  {[
                    { icon: Film, label: "Tipo de vídeo", value: form.video_type },
                    { icon: FileText, label: "Pacote", value: PACKAGES.find(p => p.id === form.package_name)?.label ?? form.package_name },
                    { icon: Calendar, label: "Prazo", value: new Date(form.deadline).toLocaleDateString("pt-BR") },
                    { icon: Clock, label: "Duração estimada", value: form.duration_minutes ? `${form.duration_minutes} minutos` : "Não informado" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <item.icon className="w-4 h-4 text-primary" /> {item.label}
                      </div>
                      <span className="text-sm font-medium">{item.value}</span>
                    </div>
                  ))}
                </div>

                <div className="bg-secondary/50 rounded-xl p-4 space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Briefing</p>
                  <p className="text-sm">{form.briefing}</p>
                </div>

                {form.references_text && (
                  <div className="bg-secondary/50 rounded-xl p-4 space-y-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium flex items-center gap-1">
                      <Link2 className="w-3 h-3" /> Referências
                    </p>
                    <p className="text-sm text-primary">{form.references_text}</p>
                  </div>
                )}

                {/* Resumo financeiro */}
                <div className="bg-gradient-card border border-primary/30 rounded-xl p-5 space-y-3">
                  <p className="font-semibold flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-accent" /> Resumo financeiro
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Valor do projeto</span>
                      <span className="font-medium">{formatBRL(totalAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Taxa da plataforma ({Math.round(platformFee * 100)}%)</span>
                      <span className="text-muted-foreground">{formatBRL(platformAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Editor recebe</span>
                      <span className="text-accent font-medium">{formatBRL(editorAmount)}</span>
                    </div>
                    <div className="border-t border-border/50 pt-2 flex justify-between font-bold">
                      <span>Você paga</span>
                      <span className="text-gradient text-lg">{formatBRL(totalAmount)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2 text-xs text-muted-foreground">
                  <Shield className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                  Ao confirmar, o valor será retido pela plataforma. Você só paga definitivamente ao aprovar a entrega final.
                </div>
              </div>
            )}

            {/* ── CONFIRMADO ── */}
            {step === "confirmado" && (
              <div className="bg-gradient-card border border-border/50 rounded-2xl p-8 text-center space-y-6">
                <div className="w-20 h-20 rounded-full bg-accent/10 grid place-items-center mx-auto">
                  <CheckCircle2 className="w-10 h-10 text-accent" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-2">Pedido enviado! 🎉</h2>
                  <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                    Seu briefing foi enviado para <strong>{editor.profiles?.full_name}</strong>.
                    Ele tem <strong>48 horas</strong> para aceitar ou recusar.
                  </p>
                </div>
                <div className="bg-secondary/50 rounded-xl p-4 text-sm text-left space-y-2">
                  <p className="font-medium">O que acontece agora:</p>
                  {[
                    "Editor recebe notificação do seu pedido",
                    "Ele aceita ou propõe ajustes em até 48h",
                    "Ao aceitar, o projeto entra em andamento",
                    "Você aprova a entrega e libera o pagamento",
                  ].map((s, i) => (
                    <div key={i} className="flex items-center gap-2 text-muted-foreground">
                      <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold grid place-items-center flex-shrink-0">{i + 1}</span>
                      {s}
                    </div>
                  ))}
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button variant="hero" className="flex-1" onClick={() => navigate("/dashboard/cliente")}>
                    Ver meus pedidos
                  </Button>
                  <Button variant="outline" className="flex-1" onClick={() => navigate("/editores")}>
                    Ver mais editores
                  </Button>
                </div>
                {orderId && (
                  <p className="text-xs text-muted-foreground">ID do pedido: {orderId}</p>
                )}
              </div>
            )}

            {/* ── NAVEGAÇÃO ── */}
            {step !== "confirmado" && step !== "assistente" && (
              <div className="flex gap-3 mt-6">
                {stepIndex > 0 && (
                  <Button variant="outline" className="flex-1" onClick={() => setStep(steps[stepIndex - 1])} disabled={submitting}>
                    <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
                  </Button>
                )}
                <Button variant="hero" className="flex-1" onClick={handleNext} disabled={submitting}>
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : step === "revisao" ? (
                    <>Confirmar pedido <Zap className="w-4 h-4 ml-2" /></>
                  ) : step === "projeto" && Object.values(aiAnswers).some(v => v.trim()) ? (
                    <>Continuar e gerar brief <Sparkles className="w-4 h-4 ml-2 text-accent" /></>
                  ) : (
                    <>Continuar <ArrowRight className="w-4 h-4 ml-2" /></>
                  )}
                </Button>
              </div>
            )}
          </div>

          {/* ── SIDEBAR: EDITOR ── */}
          <div className="lg:w-72 space-y-4 lg:sticky lg:top-24">
            <div className="bg-gradient-card border border-border/50 rounded-2xl p-5 space-y-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Contratando</p>
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl bg-gradient-primary grid place-items-center text-2xl font-bold text-primary-foreground">
                  {editor.profiles?.full_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold">{editor.profiles?.full_name}</p>
                  <p className="text-xs text-muted-foreground">{editor.specialty}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Star className="w-3 h-3 text-accent fill-accent" />
                    <span className="text-xs font-medium">{editor.rating_avg.toFixed(1)}</span>
                    <span className="text-xs text-muted-foreground">({editor.rating_count})</span>
                  </div>
                </div>
              </div>
              {level && (
                <div className={`inline-block px-2.5 py-1 rounded-full bg-gradient-to-r ${level.color} text-primary-foreground text-xs font-semibold`}>
                  Nível {level.label}
                </div>
              )}
              <div className="border-t border-border/50 pt-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Preço base</span>
                  <span className="font-semibold text-gradient">{formatBRL(editor.base_price)}</span>
                </div>
                {totalAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Seu orçamento</span>
                    <span className="font-semibold">{formatBRL(totalAmount)}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gradient-card border border-border/50 rounded-2xl p-5 space-y-3">
              <p className="font-semibold text-sm">Proteção do comprador</p>
              {[
                { icon: Shield, text: "Pagamento retido até aprovação" },
                { icon: CheckCircle2, text: "Editor verificado pela curadoria" },
                { icon: Clock, text: "Prazo garantido no contrato" },
              ].map((g, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <g.icon className="w-3.5 h-3.5 text-accent flex-shrink-0" /> {g.text}
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Briefing;
