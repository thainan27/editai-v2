import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, ChevronUp, Shield, FileText, Users, AlertTriangle } from "lucide-react";

const SECTIONS = [
  {
    id: "sobre",
    icon: FileText,
    title: "1. Sobre a Plataforma",
    content: `O Editaí é uma plataforma digital brasileira que conecta clientes a editores profissionais verificados. Somos um intermediário — não somos empregadores, nem prestadores diretos do serviço de edição.

Ao criar uma conta, você concorda integralmente com estes Termos.`,
  },
  {
    id: "quem",
    icon: Users,
    title: "2. Quem Pode Usar",
    content: `• Ter 18 anos ou mais (ou 16/17 com autorização de responsável)
• Fornecer informações verdadeiras no cadastro
• Ter capacidade legal para celebrar contratos
• Não estar banido anteriormente da plataforma`,
  },
  {
    id: "pagamentos",
    icon: Shield,
    title: "3. Pagamentos e Proteção",
    content: `Escrow: Todo pagamento é retido pela plataforma e liberado ao editor somente após aprovação da entrega pelo cliente.

Reembolso total: pedido cancelado antes do aceite.
Reembolso parcial/total: disputas resolvidas a favor do cliente.
Sem reembolso: entrega aprovada pelo cliente.

Pagamento ao editor liberado automaticamente após 7 dias sem resposta do cliente.`,
  },
  {
    id: "conduta",
    icon: Users,
    title: "4. Regras de Conduta",
    content: `Proibido para todos:
• Informações falsas no cadastro
• Usar a plataforma para fins ilegais
• Assediar ou discriminar outros usuários
• Negociar fora da plataforma para burlar taxas
• Criar múltiplas contas
• Avaliações falsas

Proibido para Editores:
• Aceitar pedidos sem intenção de entrega
• Subcontratar sem consentimento do cliente
• Compartilhar material confidencial

Proibido para Clientes:
• Solicitar revisões fora do escopo original
• Recusar aprovação de entrega que atenda ao briefing`,
  },
  {
    id: "conteudo",
    icon: AlertTriangle,
    title: "5. Conteúdo Proibido",
    content: `TOLERÂNCIA ZERO (banimento imediato + denúncia às autoridades):
• Material Sexual Envolvendo Menores (CSAM)
• Conteúdo que promova terrorismo
• Incitação a genocídio ou crimes contra a humanidade
• Doxxing e deep fakes não consensuais

CONTEÚDO ADULTO (18+):
Permitido somente quando ambas as partes declaram ter 18+ anos, o projeto é marcado como adulto e o conteúdo é legal. Não aparece no marketplace público.`,
  },
  {
    id: "propriedade",
    icon: FileText,
    title: "6. Propriedade Intelectual",
    content: `• O cliente é responsável pelos direitos do material bruto enviado
• O editor é responsável por usar assets com licença adequada
• A propriedade do vídeo final é do cliente após liberação do pagamento
• A plataforma não reivindica propriedade sobre nenhum conteúdo criado`,
  },
  {
    id: "lgpd",
    icon: Shield,
    title: "7. Seus Dados (LGPD)",
    content: `Coletamos apenas o necessário para funcionamento da plataforma. Não vendemos seus dados. Você pode acessar, corrigir, exportar e excluir seus dados a qualquer momento.

Contato DPO: privacidade@editai.app

Para mais detalhes, consulte nossa Política de Privacidade completa.`,
  },
];

const TermosDeUso = () => {
  const [openSection, setOpenSection] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-2xl py-12">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 grid place-items-center mx-auto mb-4">
            <FileText className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Termos de Uso</h1>
          <p className="text-muted-foreground text-sm">
            Versão 1.0 — Leia com atenção antes de criar sua conta
          </p>
        </div>

        {/* Resumo visual */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { icon: Shield, label: "Pagamento protegido", desc: "Escrow garantido" },
            { icon: Users, label: "Conduta clara", desc: "Regras para todos" },
            { icon: AlertTriangle, label: "Tolerância zero", desc: "Conteúdo ilegal" },
          ].map((item) => (
            <div key={item.label} className="bg-gradient-card border border-border/50 rounded-xl p-4 text-center">
              <item.icon className="w-5 h-5 text-primary mx-auto mb-2" />
              <p className="text-xs font-semibold">{item.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Seções accordion */}
        <div className="space-y-3 mb-8">
          {SECTIONS.map((section) => (
            <div key={section.id} className="bg-gradient-card border border-border/50 rounded-xl overflow-hidden">
              <button
                onClick={() => setOpenSection(openSection === section.id ? null : section.id)}
                className="w-full flex items-center justify-between p-5 text-left hover:bg-secondary/30 transition-smooth"
              >
                <div className="flex items-center gap-3">
                  <section.icon className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="font-medium text-sm">{section.title}</span>
                </div>
                {openSection === section.id
                  ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  : <ChevronDown className="w-4 h-4 text-muted-foreground" />
                }
              </button>
              {openSection === section.id && (
                <div className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed whitespace-pre-line border-t border-border/50 pt-4">
                  {section.content}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Links */}
        <div className="bg-secondary/30 rounded-xl p-5 space-y-2 text-sm text-center">
          <p className="text-muted-foreground">Documentos completos:</p>
          <div className="flex justify-center gap-4">
            <Link to="/privacidade" className="text-primary hover:underline">Política de Privacidade</Link>
            <Link to="/conduta" className="text-primary hover:underline">Código de Conduta</Link>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Dúvidas: <a href="mailto:suporte@editai.app" className="text-primary hover:underline">suporte@editai.app</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default TermosDeUso;
