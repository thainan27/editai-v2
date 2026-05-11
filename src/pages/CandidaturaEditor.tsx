import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  ArrowRight, ArrowLeft, CheckCircle2, Upload, Clock,
  Star, Zap, Award, Loader2, ExternalLink, Shield,
  Video, TrendingUp, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { EDITOR_LEVELS, SPECIALTIES, getPlatformFee, formatBRL } from "@/lib/constants";
import { toast } from "sonner";
import iconeEditai from "@/assets/icone-definitivo.png";

// ── Banco de desafios ──────────────────────────────────────────────────────
const CHALLENGES = {
  basico: [
    { id: "b1", title: "Reel Fitness 30s", description: "Edite um reel de 30 segundos para um perfil fitness no Instagram. Use cortes no beat, energia alta e mostre resultado/transformação.", footage_url: "https://www.pexels.com/search/videos/fitness%20workout/", duration: "30 segundos", format: "9:16 vertical", deadline_days: 5 },
    { id: "b2", title: "Vídeo de Produto 60s", description: "Crie um vídeo de apresentação de produto para e-commerce. Destaque detalhes, transmita qualidade e inclua texto de chamada para ação.", footage_url: "https://www.pexels.com/search/videos/product/", duration: "60 segundos", format: "16:9 ou 1:1", deadline_days: 5 },
    { id: "b3", title: "Corte de Entrevista", description: "Edite uma entrevista longa para um corte de 2 minutos com os melhores momentos. Remova vícios de linguagem e pausas longas.", footage_url: "https://www.pexels.com/search/videos/interview/", duration: "2 minutos", format: "16:9", deadline_days: 5 },
    { id: "b4", title: "YouTube Short", description: "Transforme um vlog casual em um YouTube Short de 60s com legendas animadas, trilha de fundo e ritmo dinâmico.", footage_url: "https://www.pexels.com/search/videos/vlog/", duration: "60 segundos", format: "9:16 vertical", deadline_days: 5 },
    { id: "b5", title: "Highlight de Evento", description: "Edite um highlight de evento corporativo com 90 segundos, trilha inspiracional, cortes limpos e texto com nome do evento.", footage_url: "https://www.pexels.com/search/videos/corporate%20event/", duration: "90 segundos", format: "16:9", deadline_days: 5 },
  ],
  intermediario: [
    { id: "i1", title: "Comercial com Motion Graphics", description: "Crie um comercial de 45s para uma marca fictícia com motion graphics, color grading profissional e transições criativas.", footage_url: "https://www.mixkit.co/free-stock-video/", duration: "45 segundos", format: "16:9", deadline_days: 5 },
    { id: "i2", title: "Color Grading Cinematográfico", description: "Aplique color grading cinema em footage bruto. Entregue versão original + graded com justificativa das escolhas.", footage_url: "https://www.dareful.com/", duration: "60-90 segundos", format: "16:9 4K ou 1080p", deadline_days: 5 },
    { id: "i3", title: "Vídeo Educacional", description: "Monte um vídeo educacional de 3 minutos com lower thirds animados, b-roll, trilha sutil e estrutura: intro → conteúdo → CTA.", footage_url: "https://www.pexels.com/search/videos/education/", duration: "3 minutos", format: "16:9", deadline_days: 5 },
  ],
  avancado: [
    { id: "a1", title: "Comercial Narrativo", description: "Crie um comercial narrativo de 60s com VFX simples, color grading avançado, trilha sincronizada e storytelling emocional.", footage_url: "https://www.videvo.net/free-stock-footage/", duration: "60 segundos", format: "16:9 4K", deadline_days: 5 },
    { id: "a2", title: "Mini Documentário", description: "Edite um mini-documentário de 5 minutos com multicâmera, entrevista intercalada com b-roll, arco narrativo claro e trilha dinâmica.", footage_url: "https://www.videvo.net/free-stock-footage/", duration: "5 minutos", format: "16:9", deadline_days: 5 },
  ],
};

const QUIZ = [
  { id: "q1", question: "Qual software você usa como principal ferramenta de edição?", options: ["Adobe Premiere Pro", "DaVinci Resolve", "Final Cut Pro", "CapCut / outro"] },
  { id: "q2", question: "Como você lida com footage de baixa qualidade de áudio?", options: ["Uso equalização e noise reduction (Audition, Fairlight)", "Substituo por narração ou trilha", "Entrego como está e aviso o cliente", "Ainda não tenho experiência com isso"] },
  { id: "q3", question: "O que é LUT e como você utiliza?", options: ["Tabela de cores para color grading — uso regularmente", "Conheço mas uso pouco", "Já ouvi falar mas não sei usar", "Não conheço"] },
  { id: "q4", question: "Qual formato você entrega por padrão para redes sociais?", options: ["H.264 ou H.265 conforme a plataforma", "ProRes para máxima qualidade", "Entrego no formato original do projeto", "Não sei ao certo"] },
  { id: "q5", question: "Como você organiza um projeto de edição complexo?", options: ["Pastas organizadas, bins e sequências nomeadas", "Coloco tudo numa timeline e vou editando", "Uso apenas o painel de projeto padrão", "Ainda estou desenvolvendo minha organização"] },
];

function getRandomChallenge(level: "basico" | "intermediario" | "avancado") {
  const pool = CHALLENGES[level];
  return pool[Math.floor(Math.random() * pool.length)];
}

type Path   = "escolha" | "livre" | "verificado";
type Step   = "perfil" | "portfolio" | "quiz" | "desafio" | "confirmacao";

interface FormData {
  bio: string;
  specialty: string;
  level: "basico" | "intermediario" | "avancado";
  base_price: string;
  portfolio_links: string[];
  quiz_answers: Record<string, string>;
}

const CandidaturaEditor = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [path,      setPath]      = useState<Path>("escolha");
  const [step,      setStep]      = useState<Step>("perfil");
  const [loading,   setLoading]   = useState(false);
  const [challenge, setChallenge] = useState<typeof CHALLENGES.basico[0] | null>(null);

  const [form, setForm] = useState<FormData>({
    bio: "", specialty: "", level: "basico", base_price: "",
    portfolio_links: ["", "", ""], quiz_answers: {},
  });

  const updateForm = (key: keyof FormData, value: FormData[keyof FormData]) =>
    setForm(prev => ({ ...prev, [key]: value }));

  // Steps por caminho
  const stepsLivre:      Step[] = ["perfil", "portfolio", "confirmacao"];
  const stepsVerificado: Step[] = ["perfil", "portfolio", "quiz", "desafio", "confirmacao"];
  const steps     = path === "livre" ? stepsLivre : stepsVerificado;
  const stepIndex = steps.indexOf(step);

  const stepLabels = path === "livre"
    ? ["Perfil", "Portfólio"]
    : ["Perfil", "Portfólio", "Questionário", "Desafio"];

  const handleNext = () => {
    if (step === "perfil") {
      if (!form.bio.trim() || !form.specialty || !form.base_price) {
        toast.error("Preencha todos os campos obrigatórios"); return;
      }
      setStep("portfolio");
    } else if (step === "portfolio") {
      const valid = form.portfolio_links.filter(l => l.trim());
      if (valid.length === 0) { toast.error("Adicione pelo menos um link de portfólio"); return; }
      if (path === "livre") {
        handleSubmit("livre");
      } else {
        setStep("quiz");
      }
    } else if (step === "quiz") {
      if (Object.keys(form.quiz_answers).length < QUIZ.length) {
        toast.error("Responda todas as perguntas"); return;
      }
      setChallenge(getRandomChallenge(form.level));
      setStep("desafio");
    } else if (step === "desafio") {
      handleSubmit("verificado");
    }
  };

  const handleSubmit = async (tipo: "livre" | "verificado") => {
    if (!user) { navigate("/login"); return; }
    setLoading(true);
    try {
      const validLinks = form.portfolio_links.filter(l => l.trim());
      const { error } = await supabase.from("editor_profiles").upsert({
        id:              user.id,
        bio:             form.bio.trim(),
        specialty:       form.specialty,
        level:           form.level,
        base_price:      parseFloat(form.base_price),
        portfolio_links: validLinks,
        status:          tipo === "livre" ? "aprovado" : "pendente",
      });
      if (error) throw error;
      setStep("confirmacao");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao enviar");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return (
    <div className="min-h-screen grid place-items-center">
      <div className="text-center space-y-4">
        <p className="text-muted-foreground">Você precisa estar logado.</p>
        <Button variant="hero" asChild><Link to="/login">Entrar</Link></Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 py-12">

      {/* Logo */}
      <Link to="/" className="flex items-center gap-2 mb-8">
        <img src={iconeEditai} alt="Editaí" className="w-9 h-9 rounded-lg" />
        <span className="font-display text-xl font-bold">Edit<span className="text-gradient">aí</span></span>
      </Link>

      {/* Progress bar */}
      {path !== "escolha" && step !== "confirmacao" && (
        <div className="w-full max-w-xl mb-8">
          <div className="flex justify-between text-xs text-muted-foreground mb-2">
            {stepLabels.map((s, i) => (
              <span key={s} className={i <= stepIndex ? "text-primary font-medium" : ""}>{s}</span>
            ))}
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-primary rounded-full transition-all duration-500"
              style={{ width: `${((stepIndex) / (stepLabels.length - 1)) * 100}%` }}
            />
          </div>
        </div>
      )}

      <div className="w-full max-w-xl bg-gradient-card border border-border/50 rounded-2xl p-8 shadow-elegant">

        {/* ── ESCOLHA DO CAMINHO ── */}
        {path === "escolha" && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Como você quer começar?</h2>
              <p className="text-sm text-muted-foreground">Escolha o caminho que melhor se encaixa no seu momento</p>
            </div>

            {/* Card Editor Livre */}
            <button
              onClick={() => setPath("livre")}
              className="w-full text-left bg-secondary/30 hover:bg-secondary/50 border-2 border-border/50 hover:border-primary/50 rounded-2xl p-5 transition-all space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 grid place-items-center">
                    <Video className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold">Editor Livre</h3>
                    <p className="text-xs text-muted-foreground">Acesso imediato ao marketplace</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground" />
              </div>
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-accent" /> Só portfólio obrigatório</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-accent" /> Aparece no marketplace imediatamente</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-accent" /> Avaliado pela comunidade de clientes</li>
                <li className="flex items-center gap-2"><AlertCircle className="w-3.5 h-3.5 text-yellow-400" /> Taxa da plataforma maior (20–25%)</li>
                <li className="flex items-center gap-2"><AlertCircle className="w-3.5 h-3.5 text-yellow-400" /> Aparece após editores verificados</li>
              </ul>
              <div className="text-xs text-muted-foreground pt-1 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-primary" />
                Pode solicitar verificação a qualquer momento após 5 projetos
              </div>
            </button>

            {/* Card Editor Verificado */}
            <button
              onClick={() => setPath("verificado")}
              className="w-full text-left bg-accent/5 hover:bg-accent/10 border-2 border-accent/30 hover:border-accent/60 rounded-2xl p-5 transition-all space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 grid place-items-center">
                    <Award className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold">Editor Verificado</h3>
                      <span className="px-1.5 py-0.5 rounded-full bg-accent/20 text-accent text-xs font-medium">Recomendado</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Badge de qualidade + destaque no marketplace</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-accent" />
              </div>
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-accent" /> Badge ✅ visível no perfil</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-accent" /> Aparece primeiro nas buscas</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-accent" /> Taxa menor (10–15%)</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-accent" /> Mais confiança dos clientes</li>
                <li className="flex items-center gap-2"><AlertCircle className="w-3.5 h-3.5 text-yellow-400" /> Processo de curadoria (7 dias)</li>
              </ul>
              <div className="text-xs text-accent pt-1 flex items-center gap-1">
                <Shield className="w-3.5 h-3.5" />
                Questionário técnico + desafio prático avaliado
              </div>
            </button>
          </div>
        )}

        {/* ── PERFIL ── */}
        {step === "perfil" && path !== "escolha" && (
          <div className="space-y-5">
            <div className="flex items-center gap-3 mb-2">
              <button onClick={() => { setPath("escolha"); setStep("perfil"); }} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                <ArrowLeft className="w-3.5 h-3.5" /> Voltar
              </button>
              <span className="text-xs text-muted-foreground">→</span>
              <span className="text-xs font-medium text-foreground">
                {path === "livre" ? "Editor Livre" : "Editor Verificado"}
              </span>
            </div>
            <h2 className="text-2xl font-bold mb-1">Seu perfil</h2>

            <div>
              <Label>Bio profissional *</Label>
              <Textarea placeholder="Conte sua experiência, estilo e o que você faz de melhor..." value={form.bio} onChange={e => updateForm("bio", e.target.value)} rows={4} maxLength={500} className="mt-1" />
              <p className="text-xs text-muted-foreground text-right mt-1">{form.bio.length}/500</p>
            </div>

            <div>
              <Label>Especialidade *</Label>
              <select value={form.specialty} onChange={e => updateForm("specialty", e.target.value)} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="">Selecione...</option>
                {SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <Label>Nível *</Label>
              <div className="grid grid-cols-3 gap-3 mt-2">
                {(Object.entries(EDITOR_LEVELS) as [keyof typeof EDITOR_LEVELS, typeof EDITOR_LEVELS[keyof typeof EDITOR_LEVELS]][]).map(([key, level]) => (
                  <button key={key} type="button" onClick={() => updateForm("level", key)}
                    className={`p-3 rounded-xl border-2 text-center transition-all ${form.level === key ? "border-primary bg-primary/10" : "border-border/50 hover:border-primary/50"}`}>
                    <div className="text-sm font-semibold">{level.label}</div>
                    <div className="text-xs text-muted-foreground mt-1">R${level.priceRange[0]}–{level.priceRange[1]}</div>
                    <div className="text-xs text-accent mt-0.5">
                      Taxa: {Math.round(getPlatformFee(key, path === "verificado") * 100)}%
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label>Preço base (R$) *</Label>
              <Input type="number" placeholder={`R$${EDITOR_LEVELS[form.level].priceRange[0]} – R$${EDITOR_LEVELS[form.level].priceRange[1]}`}
                value={form.base_price} onChange={e => updateForm("base_price", e.target.value)}
                min={EDITOR_LEVELS[form.level].priceRange[0]} max={EDITOR_LEVELS[form.level].priceRange[1]} className="mt-1" />
              {form.base_price && (
                <p className="text-xs text-muted-foreground mt-1">
                  Você recebe: <strong>{formatBRL(parseFloat(form.base_price) * (1 - getPlatformFee(form.level, path === "verificado")))}</strong> por projeto
                </p>
              )}
            </div>
          </div>
        )}

        {/* ── PORTFÓLIO ── */}
        {step === "portfolio" && (
          <div className="space-y-5">
            <h2 className="text-2xl font-bold mb-1">Seu portfólio</h2>
            <p className="text-sm text-muted-foreground">Links de vídeos que você editou (YouTube, Vimeo, Drive...)</p>
            {form.portfolio_links.map((link, i) => (
              <div key={i}>
                <Label>Link {i + 1} {i === 0 && "*"}</Label>
                <div className="flex gap-2 mt-1">
                  <Input placeholder="https://youtube.com/watch?v=..." value={link}
                    onChange={e => { const up = [...form.portfolio_links]; up[i] = e.target.value; updateForm("portfolio_links", up); }} />
                  {link && <a href={link} target="_blank" rel="noopener noreferrer"><Button variant="outline" size="icon"><ExternalLink className="w-4 h-4" /></Button></a>}
                </div>
              </div>
            ))}
            <button type="button" className="text-sm text-primary hover:underline"
              onClick={() => updateForm("portfolio_links", [...form.portfolio_links, ""])}>
              + Adicionar mais
            </button>
            {path === "livre" && (
              <div className="bg-primary/10 border border-primary/30 rounded-xl p-4 text-sm text-muted-foreground">
                <strong className="text-foreground">📌 Editor Livre:</strong> Seu perfil vai ao ar imediatamente após confirmar. Clientes veem seu portfólio e avaliações da comunidade. Você pode solicitar verificação a qualquer momento.
              </div>
            )}
          </div>
        )}

        {/* ── QUIZ ── */}
        {step === "quiz" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold mb-1">Questionário técnico</h2>
            <p className="text-sm text-muted-foreground">Sem certo ou errado — queremos entender seu workflow</p>
            {QUIZ.map((q, qi) => (
              <div key={q.id} className="space-y-2">
                <p className="font-medium text-sm">{qi + 1}. {q.question}</p>
                {q.options.map(opt => (
                  <button key={opt} type="button" onClick={() => updateForm("quiz_answers", { ...form.quiz_answers, [q.id]: opt })}
                    className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${form.quiz_answers[q.id] === opt ? "border-primary bg-primary/10" : "border-border/50 hover:border-primary/50 text-muted-foreground"}`}>
                    {opt}
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* ── DESAFIO ── */}
        {step === "desafio" && challenge && (
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/30 text-xs text-accent">
              <Zap className="w-3 h-3" /> Desafio sorteado aleatoriamente
            </div>
            <h2 className="text-2xl font-bold">{challenge.title}</h2>
            <div className="bg-secondary/50 rounded-xl p-5 space-y-3 text-sm">
              <p>{challenge.description}</p>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="flex items-center gap-2 text-muted-foreground"><Clock className="w-4 h-4 text-primary" /> Duração: <strong className="text-foreground">{challenge.duration}</strong></div>
                <div className="flex items-center gap-2 text-muted-foreground"><Upload className="w-4 h-4 text-primary" /> Formato: <strong className="text-foreground">{challenge.format}</strong></div>
              </div>
            </div>
            <a href={challenge.footage_url} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="w-full gap-2"><ExternalLink className="w-4 h-4" /> Acessar footage</Button>
            </a>
            <div className="bg-yellow-400/10 border border-yellow-400/30 rounded-xl p-4 text-sm">
              <div className="flex items-center gap-2 text-yellow-400 font-semibold mb-1"><Clock className="w-4 h-4" /> Prazo: {challenge.deadline_days} dias úteis</div>
              <p className="text-xs text-muted-foreground">Curadoria avalia em até 7 dias após envio. Feedback detalhado independente do resultado.</p>
            </div>
            <div className="border border-border/50 rounded-xl p-4 space-y-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2"><Star className="w-3.5 h-3.5 text-accent" /> Avaliado: técnica (40%), criatividade (25%), prazo (20%), qualidade (15%)</div>
              <div className="flex items-center gap-2"><Award className="w-3.5 h-3.5 text-primary" /> Aprovados recebem badge verificado + destaque no marketplace</div>
            </div>
          </div>
        )}

        {/* ── CONFIRMAÇÃO ── */}
        {step === "confirmacao" && (
          <div className="text-center space-y-6 py-4">
            <div className="w-20 h-20 rounded-full bg-accent/10 grid place-items-center mx-auto">
              <CheckCircle2 className="w-10 h-10 text-accent" />
            </div>
            {path === "livre" ? (
              <>
                <div>
                  <h2 className="text-2xl font-bold mb-2">Perfil publicado! 🎉</h2>
                  <p className="text-muted-foreground text-sm max-w-sm mx-auto">Seu perfil já está visível no marketplace! Clientes podem te encontrar e enviar briefings agora.</p>
                </div>
                <div className="bg-secondary/50 rounded-xl p-4 text-sm text-left space-y-2">
                  <p className="font-medium">Dicas para seus primeiros projetos:</p>
                  {["Responda briefings rapidamente — tempo de resposta importa", "Entregue antes do prazo nos primeiros projetos", "Peça avaliações aos clientes após cada entrega", "Com 5 projetos bem avaliados, solicite a verificação"].map((s, i) => (
                    <div key={i} className="flex items-start gap-2 text-muted-foreground">
                      <span className="text-accent font-bold">{i + 1}.</span> {s}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div>
                  <h2 className="text-2xl font-bold mb-2">Candidatura enviada! 🎉</h2>
                  <p className="text-muted-foreground text-sm max-w-sm mx-auto">Você receberá o material do desafio por email. Prazo: <strong>5 dias úteis</strong>. Curadoria em até <strong>7 dias</strong>.</p>
                </div>
                <div className="bg-secondary/50 rounded-xl p-4 text-sm text-left space-y-2">
                  {["Verifique seu email com o material do desafio", "Edite conforme o brief", "Envie pelo link no email", "Aguarde o feedback da curadoria"].map((s, i) => (
                    <div key={i} className="flex items-start gap-2 text-muted-foreground">
                      <span className="text-primary font-bold">{i + 1}.</span> {s}
                    </div>
                  ))}
                </div>
              </>
            )}
            <Button variant="hero" className="w-full" onClick={() => navigate("/dashboard/editor")}>
              Ir para meu painel
            </Button>
          </div>
        )}

        {/* ── NAVEGAÇÃO ── */}
        {path !== "escolha" && step !== "confirmacao" && (
          <div className="flex gap-3 mt-8">
            {stepIndex > 0 && (
              <Button variant="outline" className="flex-1" onClick={() => setStep(steps[stepIndex - 1])} disabled={loading}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
              </Button>
            )}
            <Button variant="hero" className="flex-1" onClick={handleNext} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> :
                step === "desafio" ? <><CheckCircle2 className="w-4 h-4 mr-2" /> Confirmar e enviar</> :
                step === "portfolio" && path === "livre" ? <><CheckCircle2 className="w-4 h-4 mr-2" /> Publicar perfil</> :
                <><ArrowRight className="w-4 h-4 ml-2" /> Continuar</>
              }
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CandidaturaEditor;
