import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  RefreshCw, CheckCircle2, ArrowRight, Star,
  DollarSign, Calendar, Shield, Zap, ArrowLeft
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { formatBRL, RECORRENTE_PACKAGES, RECORRENTE_DISCOUNT } from "@/lib/constants";

const BENEFICIOS = [
  { icon: DollarSign, title: "10% de desconto",      desc: "Em todos os projetos do plano" },
  { icon: Star,       title: "Editor dedicado",       desc: "O mesmo profissional todo mês" },
  { icon: Calendar,   title: "Entregas garantidas",  desc: "Prazo fixo semanal ou quinzenal" },
  { icon: Shield,     title: "Prioridade total",      desc: "Seu projeto sempre em primeiro" },
  { icon: Zap,        title: "Sem burocracia",        desc: "Brief padrão reutilizável" },
  { icon: RefreshCw,  title: "Flexível",              desc: "Cancele quando quiser" },
];

const EXEMPLOS = [
  { perfil: "Criador de conteúdo",    desc: "8 reels/mês + 4 vídeos longos",    economy: 180 },
  { perfil: "Empresa de marketing",   desc: "12 vídeos/mês para redes sociais", economy: 320 },
  { perfil: "Youtuber",               desc: "4 vídeos editados por mês",        economy: 120 },
];

const ModoRecorrente = () => {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">

        {/* Hero */}
        <div className="relative overflow-hidden border-b border-border/50">
          <div className="absolute inset-0 grid-bg opacity-20 pointer-events-none" />
          <div className="container py-20 text-center relative">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-accent/30 bg-accent/10 text-sm mb-6">
              <RefreshCw className="w-3.5 h-3.5 text-accent" />
              <span className="text-muted-foreground">Novo — Modo Recorrente</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-5">
              Edição de vídeo<br /><span className="text-gradient">todo mês, sem stress</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Assine um plano com seu editor favorito. Receba vídeos todo mês com desconto, prioridade e o mesmo profissional que já conhece o seu estilo.
            </p>
          </div>
        </div>

        {/* Benefícios */}
        <div className="container py-16">
          <h2 className="text-2xl font-bold text-center mb-10">Por que assinar?</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {BENEFICIOS.map(b => (
              <div key={b.title} className="bg-gradient-card border border-border/50 rounded-2xl p-5 flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-accent/10 grid place-items-center flex-shrink-0">
                  <b.icon className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="font-semibold text-sm">{b.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Planos */}
        <div className="border-t border-border/50 bg-secondary/20">
          <div className="container py-16">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-bold mb-2">Escolha seu plano</h2>
              <p className="text-muted-foreground text-sm">
                O preço varia conforme o editor e o tipo de vídeo. Esses são exemplos com editor Básico.
              </p>
            </div>
            <div className="grid sm:grid-cols-3 gap-5 max-w-3xl mx-auto">
              {RECORRENTE_PACKAGES.map(pkg => {
                const precoBase = 120; // preço base de exemplo
                const total    = precoBase * pkg.base_count;
                const comDesc  = total * (1 - RECORRENTE_DISCOUNT);
                const economia = total - comDesc;
                const isSelected = selected === pkg.id;

                return (
                  <button
                    key={pkg.id}
                    onClick={() => setSelected(pkg.id)}
                    className={`text-left p-6 rounded-2xl border-2 transition-all space-y-4 ${
                      isSelected
                        ? "border-accent bg-accent/5"
                        : "border-border/50 hover:border-accent/50 bg-gradient-card"
                    }`}
                  >
                    <div>
                      <p className="font-bold text-lg">{pkg.label}</p>
                      <p className="text-xs text-muted-foreground">{pkg.desc}</p>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gradient">{formatBRL(comDesc)}</div>
                      <div className="text-xs text-muted-foreground line-through">{formatBRL(total)}</div>
                      <div className="text-xs text-accent mt-1">Economize {formatBRL(economia)}/mês</div>
                    </div>
                    {isSelected && (
                      <div className="flex items-center gap-1.5 text-accent text-xs font-medium">
                        <CheckCircle2 className="w-4 h-4" /> Selecionado
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="text-center mt-8 space-y-4">
              <Button
                variant="hero"
                size="lg"
                disabled={!selected}
                onClick={() => navigate("/editores?modo=recorrente")}
                className="gap-2"
              >
                Escolher meu editor <ArrowRight className="w-4 h-4" />
              </Button>
              <p className="text-xs text-muted-foreground">
                Sem fidelidade. Cancele quando quiser com 15 dias de antecedência.
              </p>
            </div>
          </div>
        </div>

        {/* Exemplos de uso */}
        <div className="container py-16">
          <h2 className="text-2xl font-bold text-center mb-10">Quem usa o Modo Recorrente?</h2>
          <div className="grid sm:grid-cols-3 gap-5 max-w-3xl mx-auto">
            {EXEMPLOS.map(e => (
              <div key={e.perfil} className="bg-gradient-card border border-border/50 rounded-2xl p-5 space-y-3">
                <p className="font-semibold">{e.perfil}</p>
                <p className="text-sm text-muted-foreground">{e.desc}</p>
                <div className="text-accent text-sm font-medium">
                  Economia: {formatBRL(e.economy)}/mês
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ rápido */}
        <div className="border-t border-border/50 bg-secondary/20">
          <div className="container py-12 max-w-2xl mx-auto space-y-4">
            <h2 className="text-xl font-bold text-center mb-6">Dúvidas frequentes</h2>
            {[
              { q: "Posso trocar de editor?", a: "Sim! Você pode mudar de editor no início de cada ciclo mensal." },
              { q: "E se eu não usar todos os vídeos do mês?", a: "Vídeos não utilizados não acumulam. O plano renova mensalmente." },
              { q: "Como funciona o pagamento?", a: "Débito automático mensal. O valor é cobrado no mesmo dia todo mês." },
              { q: "Posso cancelar quando quiser?", a: "Sim! Cancele com 15 dias de antecedência sem multa." },
            ].map(faq => (
              <div key={faq.q} className="bg-gradient-card border border-border/50 rounded-xl p-5">
                <p className="font-semibold text-sm mb-1">{faq.q}</p>
                <p className="text-sm text-muted-foreground">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA final */}
        <div className="container py-16 text-center">
          <h2 className="text-3xl font-bold mb-4">Pronto para simplificar?</h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto text-sm">
            Escolha seu editor no marketplace e proponha um plano recorrente direto pelo chat.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button variant="hero" size="lg" onClick={() => navigate("/editores")}>
              Ver editores disponíveis
            </Button>
            <Button variant="outline" size="lg" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
            </Button>
          </div>
        </div>

      </main>
      <Footer />
    </div>
  );
};

export default ModoRecorrente;
