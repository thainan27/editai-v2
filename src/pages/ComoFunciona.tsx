import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight, Shield, Star, CheckCircle2, Zap, Clock,
  DollarSign, MessageSquare, Award, Users, Video,
  ChevronDown, ChevronUp, AlertCircle, ThumbsUp,
  Lock, RefreshCw, Headphones, TrendingUp, XCircle
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";

// ── FAQ ────────────────────────────────────────────────────────────────────
const FAQ_CLIENTE = [
  {
    q: "Como sei que o editor vai entregar com qualidade?",
    a: "Todos os editores passam por um processo rigoroso de curadoria: enviam portfólio, respondem um questionário técnico e completam um desafio prático avaliado pela nossa equipe. Apenas aprovados aparecem na plataforma. Além disso, você pode ver avaliações reais de outros clientes antes de contratar."
  },
  {
    q: "E se eu não gostar do resultado?",
    a: "Sem problema! Dependendo do pacote escolhido, você tem direito a 1, 2 ou 3 rodadas de revisão. Se mesmo assim a entrega não atender ao briefing original, nossa equipe de suporte analisa a situação e pode acionar o reembolso. Seu dinheiro fica retido na plataforma até você aprovar — nunca vai direto pro editor."
  },
  {
    q: "Quanto tempo demora para receber meu vídeo?",
    a: "O prazo é combinado no briefing e fica registrado no contrato. Editores do nível básico geralmente entregam em 2 a 5 dias úteis; intermediários em 3 a 7 dias; avançados em até 10 dias dependendo da complexidade. O editor só marca como entregue dentro do prazo combinado."
  },
  {
    q: "Quais formas de pagamento são aceitas?",
    a: "Aceitamos PIX (aprovação instantânea), cartão de crédito em até 12x e boleto bancário. O pagamento é processado pelo Mercado Pago com toda a segurança. O valor fica em escrow (retido) até você aprovar a entrega."
  },
  {
    q: "Posso cancelar um pedido?",
    a: "Sim. Se o editor ainda não aceitou o pedido, você pode cancelar sem custo. Após aceite, o cancelamento precisa ser negociado via chat. Se houver disputa, nossa equipe de suporte media a situação de forma justa para ambos os lados."
  },
  {
    q: "Como envio o material bruto para o editor?",
    a: "Pelo chat integrado do pedido você pode enviar links do Google Drive, Dropbox, WeTransfer ou qualquer outro serviço de armazenamento. Não recomendamos enviar arquivos pesados diretamente — use links de compartilhamento para maior agilidade."
  },
  {
    q: "A plataforma cobra alguma taxa do cliente?",
    a: "Não! O valor que você vê no perfil do editor é o que você paga. A taxa da plataforma já está incluída e é descontada do repasse ao editor. Você nunca paga mais do que o combinado."
  },
];

const FAQ_EDITOR = [
  {
    q: "Como funciona o processo de aprovação?",
    a: "Após criar sua conta, você preenche seu perfil, bio e portfólio, responde um questionário técnico e recebe um desafio prático sorteado aleatoriamente para o seu nível. Nossa equipe de curadores — todos editores experientes — avalia sua entrega em até 7 dias úteis e você recebe feedback detalhado independente do resultado."
  },
  {
    q: "Quanto vou receber por projeto?",
    a: "Você define seu preço base dentro da faixa do seu nível. A plataforma retém uma taxa de 10% (nível básico), 15% (intermediário) ou 20% (avançado) como comissão de serviço. O restante é seu, transferido automaticamente após o cliente aprovar a entrega."
  },
  {
    q: "Quando recebo meu pagamento?",
    a: "O pagamento é liberado assim que o cliente aprova a entrega ou, em caso de inatividade do cliente por mais de 7 dias após o envio, liberado automaticamente. O crédito cai na sua conta do Mercado Pago em até 1 dia útil."
  },
  {
    q: "Posso recusar um pedido?",
    a: "Sim! Você recebe o briefing e tem 48 horas para aceitar ou recusar sem nenhuma penalidade. Leia sempre com atenção antes de aceitar — após o aceite, você assume o compromisso de entregar dentro do prazo."
  },
  {
    q: "O que acontece se eu perder o prazo?",
    a: "Atrasos impactam diretamente sua avaliação e posição no ranking. Em casos de atraso, comunique o cliente imediatamente pelo chat e negocie uma extensão. Atrasos recorrentes podem resultar em rebaixamento de nível ou suspensão da conta."
  },
  {
    q: "Posso subir de nível?",
    a: "Sim! Após completar 5 projetos com avaliação média acima de 4.5 estrelas no seu nível atual, você recebe um convite automático para o teste do próximo nível. A promoção é baseada em mérito — qualidade e consistência."
  },
  {
    q: "Posso ter conta como editor e cliente ao mesmo tempo?",
    a: "Atualmente as contas são separadas por tipo. Se você precisa contratar outro editor para um projeto, crie uma conta de cliente com um email diferente. Estamos avaliando integrar os dois perfis em versões futuras."
  },
];

// ── Componente FAQ ─────────────────────────────────────────────────────────
const FAQItem = ({ q, a }: { q: string; a: string }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border/50 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-secondary/30 transition-smooth"
      >
        <span className="font-medium text-sm pr-4">{q}</span>
        {open ? <ChevronUp className="w-4 h-4 text-primary flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
      </button>
      {open && (
        <div className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed border-t border-border/50 pt-4">
          {a}
        </div>
      )}
    </div>
  );
};

// ── Componente principal ────────────────────────────────────────────────────
const ComoFunciona = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"cliente" | "editor">("cliente");

  const clienteSteps = [
    {
      n: "01", icon: Users, color: "text-primary bg-primary/10",
      title: "Encontre o editor ideal",
      desc: "Navegue pelo marketplace e filtre por especialidade, nível e preço. Cada editor tem perfil completo com portfólio em vídeo, avaliações reais de clientes anteriores e tempo médio de entrega. Não tem chute — você vê exatamente com quem vai trabalhar antes de decidir.",
    },
    {
      n: "02", icon: MessageSquare, color: "text-accent bg-accent/10",
      title: "Envie um briefing detalhado",
      desc: "Descreva seu projeto com tipo de vídeo, estilo desejado, referências, material bruto disponível, plataforma de publicação e prazo. Quanto mais detalhe você der, melhor a entrega. Você escolhe o pacote (básico, padrão ou premium) com o número de revisões que precisar.",
    },
    {
      n: "03", icon: Lock, color: "text-yellow-400 bg-yellow-400/10",
      title: "Pagamento retido com segurança",
      desc: "O valor é processado pelo Mercado Pago e fica em escrow — retido na plataforma, não no editor. Isso garante que você só paga de verdade quando estiver satisfeito. Aceitamos PIX, cartão em até 12x e boleto bancário. Sem taxa extra pra você.",
    },
    {
      n: "04", icon: Video, color: "text-primary bg-primary/10",
      title: "Acompanhe pelo chat integrado",
      desc: "Toda a comunicação acontece no chat interno do pedido. Envie referências adicionais, tire dúvidas, acompanhe o andamento e receba atualizações do editor. Histórico completo, arquivos organizados e tudo registrado — nunca mais perde uma informação importante.",
    },
    {
      n: "05", icon: ThumbsUp, color: "text-accent bg-accent/10",
      title: "Aprove, avalie e libere",
      desc: "Recebeu o vídeo? Analise com calma. Se precisar de ajustes, solicite revisão dentro do pacote escolhido. Quando estiver satisfeito, aprove a entrega — o pagamento é liberado automaticamente para o editor. Sua avaliação ajuda a comunidade a escolher os melhores.",
    },
  ];

  const editorSteps = [
    {
      n: "01", icon: Award, color: "text-accent bg-accent/10",
      title: "Crie seu perfil profissional",
      desc: "Preencha sua bio, defina sua especialidade principal (reels, motion graphics, casamentos, YouTube...) e escolha o nível que melhor representa sua experiência — básico, intermediário ou avançado. Seu perfil é sua vitrine: capriche na descrição e seja honesto sobre o que você entrega de melhor.",
    },
    {
      n: "02", icon: Video, color: "text-primary bg-primary/10",
      title: "Mostre seu portfólio",
      desc: "Adicione links de vídeos que você editou — YouTube, Vimeo, Google Drive. Escolha trabalhos que representem o nível que você se candidatou. Nossos curadores vão analisar antes de aprovar. Dica: inclua variedade de estilos para mostrar versatilidade.",
    },
    {
      n: "03", icon: CheckCircle2, color: "text-accent bg-accent/10",
      title: "Complete o desafio prático",
      desc: "Você recebe um material bruto e um brief criativo sorteado aleatoriamente — para não ser previsível. Tem 5 dias úteis para editar e entregar. Nossa equipe de curadoria avalia em até 7 dias com um scorecard: técnica (40%), criatividade (25%), prazo (20%) e qualidade de entrega (15%).",
    },
    {
      n: "04", icon: Star, color: "text-yellow-400 bg-yellow-400/10",
      title: "Receba o badge verificado",
      desc: "Editor aprovado? Seu perfil recebe o badge de verificado e fica visível para todos os clientes da plataforma. Quanto mais projetos bem avaliados você acumular, mais alto você aparece nas buscas. A plataforma não cobra mensalidade nem taxa de adesão — você só paga quando recebe.",
    },
    {
      n: "05", icon: DollarSign, color: "text-accent bg-accent/10",
      title: "Receba projetos e ganhe",
      desc: "Clientes encontram você, enviam briefings e você decide aceitar ou não. Após aceite, você tem prazo e comunicação organizados pelo chat. Quando o cliente aprovar sua entrega, o pagamento cai automaticamente na sua conta do Mercado Pago. Sem burocracia, sem espera.",
    },
  ];

  const garantias = [
    {
      icon: Lock, title: "Pagamento em escrow",
      desc: "O dinheiro do cliente fica retido na plataforma — não vai pro editor até a aprovação final. Se a entrega não atender ao brief, você tem direito a revisões e, em último caso, reembolso.",
    },
    {
      icon: Award, title: "Editores verificados",
      desc: "Nenhum editor chega ao marketplace sem passar pela curadoria. Portfólio, questionário técnico e desafio prático avaliados por editores sênior da nossa equipe.",
    },
    {
      icon: Headphones, title: "Suporte em disputas",
      desc: "Se cliente e editor não chegarem a um acordo, nossa equipe de suporte analisa o briefing original, o histórico do chat e a entrega para mediar de forma justa.",
    },
    {
      icon: RefreshCw, title: "Revisões garantidas",
      desc: "Cada pacote inclui revisões: básico (1x), padrão (2x) e premium (3x). O editor é obrigado a cumprir as revisões dentro do prazo — isso está no contrato da plataforma.",
    },
    {
      icon: Shield, title: "Dados protegidos",
      desc: "Toda a comunicação e transações acontecem dentro da plataforma. Nunca compartilhamos seus dados com terceiros. Pagamentos processados pelo Mercado Pago com criptografia de ponta.",
    },
    {
      icon: TrendingUp, title: "Avaliações reais",
      desc: "Só clientes que completaram um projeto podem avaliar um editor. Sem reviews falsos — cada estrela representa uma experiência real verificada pela plataforma.",
    },
  ];

  const comparativo = [
    { item: "Editores verificados", editai: true, sozinho: false },
    { item: "Pagamento protegido (escrow)", editai: true, sozinho: false },
    { item: "Revisões garantidas", editai: true, sozinho: false },
    { item: "Chat integrado ao projeto", editai: true, sozinho: false },
    { item: "Avaliações verificadas", editai: true, sozinho: false },
    { item: "Suporte em disputas", editai: true, sozinho: false },
    { item: "Diversidade de nível e preço", editai: true, sozinho: false },
    { item: "Histórico e organização", editai: true, sozinho: false },
    { item: "Risco de sumir com o dinheiro", editai: false, sozinho: true },
    { item: "Sem garantia de qualidade", editai: false, sozinho: true },
  ];

  const steps = activeTab === "cliente" ? clienteSteps : editorSteps;
  const faqs   = activeTab === "cliente" ? FAQ_CLIENTE : FAQ_EDITOR;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* ── HERO ── */}
      <section className="relative overflow-hidden border-b border-border/50">
        <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />
        <div className="container py-20 md:py-28 text-center relative">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-sm mb-6">
            <Zap className="w-3.5 h-3.5 text-accent" />
            <span className="text-muted-foreground">Simples, seguro e transparente</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Como a <span className="text-gradient">Editaí</span> funciona
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8">
            Uma plataforma construída para proteger os dois lados — cliente que precisa de qualidade e editor que merece receber pelo seu trabalho.
          </p>

          {/* Toggle cliente/editor */}
          <div className="inline-flex gap-1 p-1 bg-secondary rounded-xl">
            {(["cliente", "editor"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-smooth ${
                  activeTab === tab
                    ? "bg-gradient-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab === "cliente" ? "👤 Sou cliente" : "🎬 Sou editor"}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── PASSOS ── */}
      <section className="container py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold mb-3">
            {activeTab === "cliente" ? "Como contratar um editor" : "Como se tornar editor verificado"}
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto text-sm">
            {activeTab === "cliente"
              ? "Do briefing à entrega aprovada em poucos passos."
              : "Do cadastro ao primeiro projeto pago com qualidade verificada."
            }
          </p>
        </div>

        <div className="space-y-6 max-w-3xl mx-auto">
          {steps.map((step, i) => (
            <div key={step.n} className="flex gap-5 items-start bg-gradient-card border border-border/50 rounded-2xl p-6 hover:border-primary/30 transition-smooth">
              <div className="flex-shrink-0">
                <div className={`w-12 h-12 rounded-xl grid place-items-center ${step.color}`}>
                  <step.icon className="w-6 h-6" />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xs font-mono text-muted-foreground">{step.n}</span>
                  <h3 className="font-bold text-lg">{step.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
              </div>
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute -mb-6 left-1/2 -translate-x-1/2" />
              )}
            </div>
          ))}
        </div>

        {/* CTA após passos */}
        <div className="text-center mt-10">
          <Button
            variant="hero"
            size="lg"
            onClick={() => navigate(activeTab === "cliente" ? "/editores" : "/cadastro/editor")}
          >
            {activeTab === "cliente" ? "Encontrar editor agora" : "Quero ser editor verificado"}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </section>

      {/* ── GARANTIAS ── */}
      <section className="border-t border-border/50 bg-secondary/20">
        <div className="container py-20">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">
              Suas garantias na <span className="text-gradient">Editaí</span>
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto text-sm">
              Construímos cada detalhe pensando na segurança de todos os envolvidos.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {garantias.map((g) => (
              <div key={g.title} className="bg-gradient-card border border-border/50 rounded-2xl p-6 space-y-3 hover:border-primary/30 transition-smooth">
                <div className="w-11 h-11 rounded-xl bg-primary/10 grid place-items-center">
                  <g.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-bold">{g.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{g.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMPARATIVO ── */}
      <section className="container py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold mb-3">
            Editaí vs contratar <span className="text-gradient">por conta própria</span>
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto text-sm">
            Já tentou contratar editor no Instagram ou grupos do WhatsApp? Sabe como pode ser arriscado.
          </p>
        </div>

        <div className="max-w-2xl mx-auto bg-gradient-card border border-border/50 rounded-2xl overflow-hidden">
          <div className="grid grid-cols-3 bg-secondary/50 p-4 text-sm font-semibold">
            <span>Recurso</span>
            <span className="text-center text-gradient">Editaí</span>
            <span className="text-center text-muted-foreground">Freelancer direto</span>
          </div>
          <div className="divide-y divide-border/50">
            {comparativo.map((c) => (
              <div key={c.item} className="grid grid-cols-3 p-4 items-center text-sm">
                <span className="text-muted-foreground">{c.item}</span>
                <div className="flex justify-center">
                  {c.editai
                    ? <CheckCircle2 className="w-5 h-5 text-accent" />
                    : <XCircle className="w-5 h-5 text-destructive" />
                  }
                </div>
                <div className="flex justify-center">
                  {!c.editai
                    ? <CheckCircle2 className="w-5 h-5 text-accent" />
                    : <XCircle className="w-5 h-5 text-destructive" />
                  }
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="border-t border-border/50 bg-secondary/20">
        <div className="container py-20">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Perguntas frequentes</h2>
            <p className="text-muted-foreground text-sm">
              {activeTab === "cliente" ? "Dúvidas de quem quer contratar" : "Dúvidas de quem quer ser editor"}
            </p>
            {/* Toggle FAQ */}
            <div className="inline-flex gap-1 p-1 bg-secondary rounded-xl mt-4">
              {(["cliente", "editor"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-2 rounded-lg text-sm font-medium transition-smooth ${
                    activeTab === tab
                      ? "bg-gradient-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab === "cliente" ? "Para clientes" : "Para editores"}
                </button>
              ))}
            </div>
          </div>

          <div className="max-w-2xl mx-auto space-y-3">
            {faqs.map((faq) => (
              <FAQItem key={faq.q} q={faq.q} a={faq.a} />
            ))}
          </div>

          {/* Ainda com dúvidas */}
          <div className="max-w-2xl mx-auto mt-8 bg-gradient-card border border-border/50 rounded-2xl p-6 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-8 h-8 text-primary flex-shrink-0" />
              <div>
                <p className="font-semibold">Ainda tem dúvidas?</p>
                <p className="text-xs text-muted-foreground">Nossa equipe responde em até 24h úteis</p>
              </div>
            </div>
            <Button variant="outline" className="gap-2" onClick={() => window.open("mailto:suporte@editai.com.br")}>
              <Headphones className="w-4 h-4" /> Falar com suporte
            </Button>
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="container py-20">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-card border border-border/50 p-10 md:p-16 text-center">
          <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-accent/20 blur-3xl pointer-events-none" />
          <div className="relative">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Pronto para <span className="text-gradient">começar?</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto mb-8 text-sm">
              Cadastro gratuito. Sem mensalidade. Você só paga quando contratar.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button variant="hero" size="lg" onClick={() => navigate("/editores")}>
                <Users className="w-4 h-4 mr-2" /> Encontrar editor
              </Button>
              <Button variant="outline" size="lg" onClick={() => navigate("/cadastro/editor")}>
                <Video className="w-4 h-4 mr-2" /> Quero ser editor
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ComoFunciona;
