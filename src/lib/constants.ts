// ── Constantes da plataforma EDITAÍ ───────────────────────────────────────

export const EDITOR_LEVELS = {
  basico: {
    label: "Básico",
    services: "Cortes simples, reels, legendas",
    priceRange: [50, 150] as [number, number],
    platformFee:      0.10,
    platformFeeLivre: 0.20,
    color: "from-accent to-accent-glow",
  },
  intermediario: {
    label: "Intermediário",
    services: "Motion graphics, color grading, vídeos médios",
    priceRange: [150, 400] as [number, number],
    platformFee:      0.10,
    platformFeeLivre: 0.23,
    color: "from-primary to-primary-glow",
  },
  avancado: {
    label: "Avançado",
    services: "Comerciais, projetos complexos, vídeos longos",
    priceRange: [400, 1500] as [number, number],
    platformFee:      0.15,
    platformFeeLivre: 0.25,
    color: "from-primary via-accent to-primary-glow",
  },
} as const;

export type EditorLevel = keyof typeof EDITOR_LEVELS;

export function getPlatformFee(level: EditorLevel, verified: boolean): number {
  return verified
    ? EDITOR_LEVELS[level].platformFee
    : EDITOR_LEVELS[level].platformFeeLivre;
}

export const PACKAGES = {
  basico:  { label: "Básico",  revisoes: 1, desc: "Entrega simples, 1 revisão" },
  padrao:  { label: "Padrão",  revisoes: 2, desc: "2 rodadas de revisão" },
  premium: { label: "Premium", revisoes: 3, desc: "Até 3 revisões + prioridade" },
} as const;

export type PackageName = keyof typeof PACKAGES;

export const CLIENT_SCORE_THRESHOLDS = {
  excellent: 4.5,
  good:      3.5,
  warning:   2.5,
  danger:    1.5,
};

export const REVISION_QUESTIONS = [
  {
    id: "q1",
    question: "Por que você está solicitando mais uma revisão?",
    options: [
      { id: "a", label: "O editor não seguiu o brief original",              type: "editor_fault" },
      { id: "b", label: "Quero ajustes que não estavam no brief",            type: "scope_change" },
      { id: "c", label: "Problema técnico na entrega (formato, qualidade)",  type: "technical" },
      { id: "d", label: "Simplesmente não gostei do resultado",              type: "subjective" },
    ],
  },
  {
    id: "q2",
    question: "O editor foi comunicado sobre essa expectativa no brief ou no chat?",
    options: [
      { id: "a", label: "Sim, está claramente descrito no brief",  type: "documented" },
      { id: "b", label: "Sim, discutimos no chat do projeto",      type: "documented" },
      { id: "c", label: "Não cheguei a comunicar",                 type: "not_documented" },
      { id: "d", label: "Não tenho certeza",                       type: "not_documented" },
    ],
  },
] as const;

export const SPECIALTIES = [
  "Reels e Shorts",
  "YouTube",
  "Comerciais",
  "Motion Graphics",
  "Color Grading",
  "Casamentos",
  "Documentário",
  "Gaming",
] as const;

// ── SOS Urgente ────────────────────────────────────────────────────────────
export const SOS_MULTIPLIER = 1.75;  // +75% no valor
export const SOS_HOURS      = 24;    // prazo máximo em horas

// ── Modo Recorrente ────────────────────────────────────────────────────────
export const RECORRENTE_DISCOUNT = 0.10; // 10% desconto
export const RECORRENTE_PACKAGES = [
  { id: "4_por_mes",  label: "4 vídeos/mês",  desc: "1 por semana",  base_count: 4  },
  { id: "8_por_mes",  label: "8 vídeos/mês",  desc: "2 por semana",  base_count: 8  },
  { id: "12_por_mes", label: "12 vídeos/mês", desc: "3 por semana",  base_count: 12 },
] as const;

// ── Helpers ────────────────────────────────────────────────────────────────
export const formatBRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function getClientScoreInfo(score: number) {
  if (score >= 4.5) return { label: "Excelente", color: "text-accent bg-accent/10 border-accent/30" };
  if (score >= 3.5) return { label: "Bom",       color: "text-primary bg-primary/10 border-primary/30" };
  if (score >= 2.5) return { label: "Regular",   color: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30" };
  if (score >= 1.5) return { label: "Atenção",   color: "text-orange-400 bg-orange-400/10 border-orange-400/30" };
  return              { label: "Alto risco",  color: "text-destructive bg-destructive/10 border-destructive/30" };
}
