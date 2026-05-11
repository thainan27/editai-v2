import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight, Sparkles, Zap, Shield, Star, CheckCircle2,
  Users, Video, Search, MessageSquare, DollarSign,
  ThumbsUp, Award, Clock, Lock, TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { EDITOR_LEVELS, formatBRL } from "@/lib/constants";

// ── Steps do Como Funciona ─────────────────────────────────────────────────
const CLIENTE_STEPS = [
  { icon: Search,       title: "Encontre o editor ideal",     desc: "Filtre por especialidade, nível e avaliações reais. Veja portfólio antes de contratar." },
  { icon: MessageSquare,title: "Envie seu briefing",          desc: "Descreva o projeto em detalhes. Nossa IA te ajuda a montar um brief profissional." },
  { icon: Lock,         title: "Pagamento protegido",         desc: "O valor fica retido na plataforma. O editor só recebe quando você aprovar." },
  { icon: ThumbsUp,     title: "Aprove e avalie",             desc: "Recebeu o vídeo? Analise, solicite revisões e libere o pagamento quando estiver satisfeito." },
];

const EDITOR_STEPS = [
  { icon: Award,        title: "Crie seu perfil",             desc: "Monte seu portfólio, defina sua especialidade e escolha seu nível. Editor Livre ou Verificado." },
  { icon: TrendingUp,   title: "Passe pela curadoria",        desc: "Complete um desafio prático. Badge de verificado aumenta sua visibilidade e reduz sua taxa." },
  { icon: Clock,        title: "Receba pedidos",              desc: "Clientes encontram você no marketplace. Aceite projetos alinhados com seu estilo." },
  { icon: DollarSign,   title: "Receba com segurança",        desc: "Pagamento garantido antes de você começar. Liberado automaticamente ao aprovar a entrega." },
];

const Index = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"cliente" | "editor">("cliente");

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-border/50">
        <div className="absolute inset-0 grid-bg opacity-40 pointer-events-none" />
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-accent/10 blur-3xl pointer-events-none" />

        <div className="container relative pt-16 pb-20 md:pt-24 md:pb-28 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-sm mb-6">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            <span className="text-muted-foreground">O marketplace de editores de vídeo do Brasil</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold leading-[1.05] tracking-tight mb-6">
            Seu vídeo,{" "}
            <span className="text-gradient">editado por feras.</span>
          </h1>

          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
            Contrate editores verificados em minutos — reels, comerciais, motion graphics
            e muito mais. Pagamento seguro, entrega garantida.
          </p>

          <div className="flex flex-wrap gap-4 justify-center mb-12">
            <Button variant="hero" size="lg" onClick={() => navigate("/cadastro/cliente")}>
              <Users className="w-4 h-4 mr-2" /> Quero contratar
            </Button>
            <Button variant="outline" size="lg" onClick={() => navigate("/cadastro/editor")}>
              <Video className="w-4 h-4 mr-2" /> Sou editor
            </Button>
          </div>

          {/* Social proof */}
          <div className="flex items-center justify-center gap-8 flex-wrap">
            {[
              { value: "+500",  label: "Editores verificados" },
              { value: "98%",   label: "Entregas aprovadas" },
              { value: "4.9★",  label: "Avaliação média" },
            ].map(s => (
              <div key={s.label} className="text-center">
                <div className="text-2xl font-bold text-gradient">{s.value}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3 PILARES ─────────────────────────────────────────────────── */}
      <section className="container py-16">
        <div className="grid md:grid-cols-3 gap-5">
          {[
            { icon: Shield,   title: "Pagamento 100% seguro",    desc: "O dinheiro fica retido na plataforma. O editor só recebe quando você aprovar a entrega." },
            { icon: Award,    title: "Editores verificados",      desc: "Todos passam por portfólio, questionário técnico e desafio prático antes de aparecer no marketplace." },
            { icon: Zap,      title: "Entrega garantida",         desc: "Brief travado no aceite, revisões incluídas no pacote e timer de inatividade automático." },
          ].map(f => (
            <div key={f.title} className="bg-gradient-card border border-border/50 rounded-2xl p-6 hover:border-primary/30 transition-smooth">
              <div className="w-12 h-12 rounded-xl bg-primary/10 grid place-items-center mb-4">
                <f.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-bold text-lg mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── COMO FUNCIONA — DESTAQUE PRINCIPAL ────────────────────────── */}
      <section className="border-t border-border/50 bg-secondary/20">
        <div className="container py-20">

          <div className="text-center mb-14">
            <h2 className="text-4xl md:text-5xl font-bold mb-3">
              Como funciona o <span className="text-gradient">Editaí</span>
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Simples para quem contrata. Justo para quem edita.
            </p>

            {/* Toggle mobile */}
            <div className="inline-flex gap-1 p-1 bg-secondary rounded-xl mt-6 md:hidden">
              {(["cliente", "editor"] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`px-5 py-2 rounded-lg text-sm font-medium transition-smooth ${
                    activeTab === tab ? "bg-gradient-primary text-primary-foreground" : "text-muted-foreground"
                  }`}>
                  {tab === "cliente" ? "👤 Cliente" : "🎬 Editor"}
                </button>
              ))}
            </div>
          </div>

          {/* Desktop: duas colunas | Mobile: tabs */}
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">

            {/* Coluna Cliente */}
            <div className={`space-y-4 ${activeTab !== "cliente" ? "hidden md:block" : ""}`}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-primary/10 grid place-items-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-xl">Para clientes</h3>
                  <p className="text-xs text-muted-foreground">Quem quer contratar edição</p>
                </div>
              </div>

              {CLIENTE_STEPS.map((step, i) => (
                <div key={step.title}
                  className="flex gap-4 bg-gradient-card border border-border/50 hover:border-primary/30 rounded-2xl p-5 transition-smooth">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 grid place-items-center">
                      <step.icon className="w-5 h-5 text-primary" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-muted-foreground">0{i + 1}</span>
                      <h4 className="font-semibold">{step.title}</h4>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}

              <Button variant="hero" className="w-full mt-2" onClick={() => navigate("/cadastro/cliente")}>
                Criar conta de cliente <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>

            {/* Coluna Editor */}
            <div className={`space-y-4 ${activeTab !== "editor" ? "hidden md:block" : ""}`}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-accent/10 grid place-items-center">
                  <Video className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h3 className="font-bold text-xl">Para editores</h3>
                  <p className="text-xs text-muted-foreground">Quem quer oferecer seu serviço</p>
                </div>
              </div>

              {EDITOR_STEPS.map((step, i) => (
                <div key={step.title}
                  className="flex gap-4 bg-gradient-card border border-border/50 hover:border-accent/30 rounded-2xl p-5 transition-smooth">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-xl bg-accent/10 grid place-items-center">
                      <step.icon className="w-5 h-5 text-accent" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-muted-foreground">0{i + 1}</span>
                      <h4 className="font-semibold">{step.title}</h4>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}

              <Button variant="outline" className="w-full mt-2 border-accent/30 text-accent hover:bg-accent/10"
                onClick={() => navigate("/cadastro/editor")}>
                Quero ser editor <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ── NÍVEIS ────────────────────────────────────────────────────── */}
      <section className="container py-20">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-3">
            Três níveis. <span className="text-gradient">Um padrão.</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm">
            Cada editor é verificado e classificado. Escolha o que faz sentido pro seu projeto.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {(Object.entries(EDITOR_LEVELS) as [keyof typeof EDITOR_LEVELS, typeof EDITOR_LEVELS[keyof typeof EDITOR_LEVELS]][]).map(([key, level]) => (
            <div key={key}
              className="relative bg-gradient-card border border-border/50 rounded-2xl p-6 hover:border-primary/30 hover:-translate-y-1 transition-smooth">
              <div className={`absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r ${level.color}`} />
              <div className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Nível</div>
              <h3 className="text-2xl font-bold mb-3">{level.label}</h3>
              <p className="text-sm text-muted-foreground mb-4">{level.services}</p>
              <div className="text-3xl font-bold mb-1">
                {formatBRL(level.priceRange[0])}
                <span className="text-base font-normal text-muted-foreground"> – {formatBRL(level.priceRange[1])}</span>
              </div>
              <div className="text-xs text-accent mb-5">
                Editor recebe {Math.round((1 - level.platformFee) * 100)}% do valor
              </div>
              <ul className="space-y-2">
                {level.services.split(", ").map(s => (
                  <li key={s} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-accent flex-shrink-0" /> {s}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="text-center mt-8">
          <Button variant="outline" onClick={() => navigate("/editores")}>
            Ver todos os editores <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </section>

      {/* ── CTA FINAL ─────────────────────────────────────────────────── */}
      <section className="container py-20">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-card border border-border/50 p-10 md:p-16">
          <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-accent/10 blur-3xl pointer-events-none" />
          <div className="relative grid md:grid-cols-2 gap-10 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                Pronto para <span className="text-gradient">começar?</span>
              </h2>
              <p className="text-muted-foreground mb-2 text-sm">
                Cadastro gratuito. Sem mensalidade. Você só paga quando contratar.
              </p>
              <ul className="space-y-2 mt-4">
                {["Editores verificados por curadoria", "Pagamento 100% seguro com escrow", "Revisões garantidas em contrato"].map(i => (
                  <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-accent flex-shrink-0" /> {i}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-col gap-4">
              <Button variant="hero" size="lg" className="w-full" onClick={() => navigate("/cadastro/cliente")}>
                <Users className="w-4 h-4 mr-2" /> Criar conta de cliente
              </Button>
              <Button variant="outline" size="lg" className="w-full border-accent/30 text-accent hover:bg-accent/10"
                onClick={() => navigate("/cadastro/editor")}>
                <Video className="w-4 h-4 mr-2" /> Quero ser editor verificado
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Já tem conta?{" "}
                <button onClick={() => navigate("/login")} className="text-primary hover:underline">Entrar</button>
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
