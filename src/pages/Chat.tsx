import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft, Send, Loader2, Clock, CheckCircle2,
  AlertCircle, XCircle, Shield, Film, Calendar,
  DollarSign, MessageSquare, Eye, Star, RefreshCw,
  Lock, AlertTriangle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { formatBRL, getClientScoreInfo, REVISION_QUESTIONS } from "@/lib/constants";
import { toast } from "sonner";

interface Message {
  id: string; order_id: string; sender_id: string;
  content: string; file_url: string | null;
  read_at: string | null; created_at: string;
}

interface OrderDetail {
  id: string; video_type: string; briefing: string; status: string;
  total_amount: number; editor_amount: number; deadline: string | null;
  client_id: string; editor_id: string; package_name: string;
  created_at: string; revision_count: number;
  max_revisions: number; revision_locked: boolean;
}

interface ClientScore { client_score: number; client_score_count: number; dispute_count: number; }
interface ParticipantProfile { id: string; full_name: string; avatar_url: string | null; account_type: string; }

const STATUS_MAP: Record<string, { label: string; icon: typeof Clock; color: string }> = {
  aguardando_aceite: { label: "Aguardando aceite", icon: Clock,         color: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30" },
  aceito:            { label: "Aceito",             icon: CheckCircle2,  color: "text-accent bg-accent/10 border-accent/30" },
  em_andamento:      { label: "Em andamento",        icon: Clock,         color: "text-primary bg-primary/10 border-primary/30" },
  em_revisao:        { label: "Em revisão",          icon: AlertCircle,   color: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30" },
  concluido:         { label: "Concluído",           icon: CheckCircle2,  color: "text-accent bg-accent/10 border-accent/30" },
  cancelado:         { label: "Cancelado",           icon: XCircle,       color: "text-destructive bg-destructive/10 border-destructive/30" },
  recusado:          { label: "Recusado",            icon: XCircle,       color: "text-destructive bg-destructive/10 border-destructive/30" },
};

function formatTime(dateStr: string) {
  const date = new Date(dateStr);
  const diff = Date.now() - date.getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  if (days === 1) return "Ontem";
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function groupByDate(messages: Message[]) {
  const groups: Record<string, Message[]> = {};
  messages.forEach(m => {
    const key = new Date(m.created_at).toLocaleDateString("pt-BR");
    if (!groups[key]) groups[key] = [];
    groups[key].push(m);
  });
  return groups;
}

const Chat = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { user, accountType } = useAuth();
  const isAdmin = accountType === "admin";

  const [order,       setOrder]       = useState<OrderDetail | null>(null);
  const [participants,setParticipants]= useState<ParticipantProfile[]>([]);
  const [messages,    setMessages]    = useState<Message[]>([]);
  const [clientScore, setClientScore] = useState<ClientScore | null>(null);
  const [content,     setContent]     = useState("");
  const [sending,     setSending]     = useState(false);
  const [loading,     setLoading]     = useState(true);
  const [showModal,   setShowModal]   = useState(false);
  const [revAnswers,  setRevAnswers]  = useState<Record<string, { id: string; type: string }>>({});

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!orderId || !user) return;
    (async () => {
      const { data: ord, error } = await supabase.from("orders").select("*").eq("id", orderId).single();
      if (error || !ord) { toast.error("Pedido não encontrado"); navigate(-1); return; }
      const o = ord as OrderDetail;
      if (!isAdmin && o.client_id !== user.id && o.editor_id !== user.id) { toast.error("Acesso não autorizado"); navigate(-1); return; }
      setOrder(o);

      if (o.editor_id === user.id || isAdmin) {
        const { data: sc } = await supabase.from("profiles").select("client_score,client_score_count,dispute_count").eq("id", o.client_id).single();
        setClientScore(sc as ClientScore | null);
      }

      const { data: profs } = await supabase.from("profiles").select("id,full_name,avatar_url,account_type").in("id", [o.client_id, o.editor_id]);
      setParticipants((profs as ParticipantProfile[]) ?? []);

      const { data: msgs } = await supabase.from("messages").select("*").eq("order_id", orderId).order("created_at", { ascending: true });
      setMessages((msgs as Message[]) ?? []);
      setLoading(false);
    })();
  }, [orderId, user, navigate, isAdmin]);

  useEffect(() => {
    if (!orderId) return;
    const channel = supabase.channel(`chat:${orderId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `order_id=eq.${orderId}` }, payload => {
        setMessages(prev => prev.find(m => m.id === (payload.new as Message).id) ? prev : [...prev, payload.new as Message]);
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [orderId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleSend = async () => {
    if (!content.trim() || !user || !orderId || sending) return;
    const trimmed = content.trim();
    setContent("");
    const optimistic: Message = { id: crypto.randomUUID(), order_id: orderId, sender_id: user.id, content: trimmed, file_url: null, read_at: null, created_at: new Date().toISOString() };
    setMessages(prev => [...prev, optimistic]);
    setSending(true);
    const { error } = await supabase.from("messages").insert({ order_id: orderId, sender_id: user.id, content: trimmed });
    setSending(false);
    if (error) { toast.error("Erro ao enviar"); setMessages(prev => prev.filter(m => m.id !== optimistic.id)); setContent(trimmed); }
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const updateOrderStatus = async (newStatus: string) => {
    if (!orderId) return;
    const { error } = await supabase.from("orders").update({ status: newStatus }).eq("id", orderId);
    if (error) { toast.error("Erro ao atualizar status"); return; }
    setOrder(prev => prev ? { ...prev, status: newStatus } : null);
    toast.success("Status atualizado!");
  };

  const handleRevisionRequest = () => {
    if (!order) return;
    if (order.revision_count >= order.max_revisions) { setShowModal(true); }
    else { updateOrderStatus("em_andamento"); }
  };

  const handleRevisionSubmit = async () => {
    if (!order || !user || !orderId) return;
    if (!REVISION_QUESTIONS.every(q => revAnswers[q.id])) { toast.error("Responda todas as perguntas"); return; }
    const q1 = revAnswers[REVISION_QUESTIONS[0].id];
    const q2 = revAnswers[REVISION_QUESTIONS[1].id];
    if (q1.type === "scope_change" || q2.type === "not_documented") {
      toast.error("Alterações fora do brief original exigem um novo pedido.");
      setShowModal(false); return;
    }
    await supabase.from("disputes").insert({
      order_id: orderId, opened_by: user.id,
      reason: q1.type === "editor_fault" ? "Revisão extra — falha do editor documentada" : "Revisão extra — insatisfação subjetiva",
      q1_answer: q1.id, q2_answer: q2.id, q1_type: q1.type, q2_type: q2.type, status: "aberta",
    });
    toast.success("Situação registrada! O editor será notificado para decidir.");
    setShowModal(false);
  };

  if (!user) return <div className="min-h-screen flex flex-col"><Navbar /><main className="container flex-1 grid place-items-center"><Button variant="hero" asChild><Link to="/login">Entrar</Link></Button></main></div>;

  if (loading) return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="container flex-1 grid place-items-center">
        <div className="space-y-3 animate-pulse text-center">
          <div className="w-16 h-16 rounded-xl bg-secondary mx-auto" />
          <div className="h-4 w-48 bg-secondary rounded mx-auto" />
        </div>
      </main>
    </div>
  );

  if (!order) return null;

  const isClient = order.client_id === user.id;
  const isEditor = order.editor_id === user.id;
  const clientProfile    = participants.find(p => p.id === order.client_id);
  const editorProfile    = participants.find(p => p.id === order.editor_id);
  const otherParticipant = isAdmin ? null : participants.find(p => p.id !== user.id);
  const getSenderName    = (id: string) => { const p = participants.find(p => p.id === id); if (!p) return "?"; if (id === user.id && !isAdmin) return "Você"; return p.full_name; };
  const getSenderInitial = (id: string) => participants.find(p => p.id === id)?.full_name.charAt(0).toUpperCase() ?? "?";
  const status     = STATUS_MAP[order.status] ?? { label: order.status, icon: Clock, color: "text-muted-foreground bg-secondary border-border" };
  const StatusIcon = status.icon;
  const grouped    = groupByDate(messages);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      {isAdmin && (
        <div className="bg-yellow-400/10 border-b border-yellow-400/30 px-4 py-2 flex items-center justify-center gap-2 text-sm text-yellow-400">
          <Eye className="w-4 h-4" />
          <span><strong>Modo Suporte</strong> — Visualizando como administrador.</span>
        </div>
      )}

      <div className="container flex-1 flex flex-col lg:flex-row gap-0 lg:gap-6 py-6 max-h-[calc(100vh-4rem)]">

        {/* ── SIDEBAR ── */}
        <aside className="lg:w-72 flex-shrink-0 space-y-4 mb-4 lg:mb-0 lg:overflow-y-auto">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-smooth">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </button>

          {/* Participantes */}
          <div className="bg-gradient-card border border-border/50 rounded-2xl p-5 space-y-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
              {isAdmin ? "Participantes" : "Conversando com"}
            </p>
            {isAdmin ? (
              <div className="space-y-3">
                {[{ profile: clientProfile, role: "Cliente" }, { profile: editorProfile, role: "Editor" }].map(({ profile: p, role }) => p && (
                  <div key={p.id} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-primary grid place-items-center text-base font-bold text-primary-foreground">{p.full_name.charAt(0).toUpperCase()}</div>
                    <div><p className="font-semibold text-sm">{p.full_name}</p><p className="text-xs text-muted-foreground">{role}</p></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-primary grid place-items-center text-xl font-bold text-primary-foreground">
                  {otherParticipant?.full_name.charAt(0).toUpperCase() ?? "?"}
                </div>
                <div>
                  <p className="font-semibold">{otherParticipant?.full_name ?? "Participante"}</p>
                  <p className="text-xs text-muted-foreground">{otherParticipant?.account_type === "editor" ? "Editor" : "Cliente"}</p>
                </div>
              </div>
            )}
          </div>

          {/* Score do cliente */}
          {(isEditor || isAdmin) && clientScore && (
            <div className={`border rounded-2xl p-4 space-y-2 ${getClientScoreInfo(clientScore.client_score).color}`}>
              <p className="text-xs font-medium uppercase tracking-wide flex items-center gap-1">
                <Star className="w-3.5 h-3.5" /> Score do cliente
              </p>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{clientScore.client_score.toFixed(1)}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${getClientScoreInfo(clientScore.client_score).color}`}>
                  {getClientScoreInfo(clientScore.client_score).label}
                </span>
              </div>
              <div className="text-xs opacity-80">
                <div>{clientScore.client_score_count} avaliação{clientScore.client_score_count !== 1 ? "ões" : ""} recebida{clientScore.client_score_count !== 1 ? "s" : ""}</div>
                {clientScore.dispute_count > 0 && (
                  <div className="flex items-center gap-1 text-orange-400 mt-1">
                    <AlertTriangle className="w-3 h-3" /> {clientScore.dispute_count} disputa{clientScore.dispute_count > 1 ? "s" : ""}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Contador de revisões */}
          {order.max_revisions > 0 && (
            <div className="bg-gradient-card border border-border/50 rounded-2xl p-4 space-y-2">
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium flex items-center gap-1">
                <RefreshCw className="w-3.5 h-3.5" /> Revisões
              </p>
              <div className="flex items-center gap-2">
                {Array.from({ length: order.max_revisions }).map((_, i) => (
                  <div key={i} className={`flex-1 h-2 rounded-full ${i < order.revision_count ? "bg-primary" : "bg-secondary"}`} />
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {order.revision_count}/{order.max_revisions} revisões usadas
                {order.revision_locked && <span className="ml-1 text-destructive flex items-center gap-1 inline-flex"><Lock className="w-3 h-3" /> Limite atingido</span>}
              </p>
            </div>
          )}

          {/* Status e detalhes do pedido */}
          <div className="bg-gradient-card border border-border/50 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Pedido</p>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${status.color}`}>
                <StatusIcon className="w-3 h-3" /> {status.label}
              </span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground"><Film className="w-3.5 h-3.5 text-primary" /> {order.video_type}</div>
              {order.deadline && <div className="flex items-center gap-2 text-muted-foreground"><Calendar className="w-3.5 h-3.5 text-primary" /> Prazo: {new Date(order.deadline).toLocaleDateString("pt-BR")}</div>}
              <div className="flex items-center gap-2 text-muted-foreground">
                <DollarSign className="w-3.5 h-3.5 text-primary" />
                {isAdmin ? `Cliente: ${formatBRL(order.total_amount)} · Editor: ${formatBRL(order.editor_amount)}` : isClient ? `Você paga ${formatBRL(order.total_amount)}` : `Você recebe ${formatBRL(order.editor_amount)}`}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground"><Shield className="w-3.5 h-3.5 text-accent" /><span className="text-xs">Pagamento protegido</span></div>
            </div>
            <div className="bg-secondary/50 rounded-xl p-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Briefing</p>
              <p className="text-xs line-clamp-3">{order.briefing}</p>
            </div>
          </div>

          {/* Ações */}
          {order.status === "aguardando_aceite" && isEditor && (
            <div className="bg-gradient-card border border-border/50 rounded-2xl p-4 space-y-2">
              <p className="text-sm font-semibold">Novo pedido!</p>
              <Button variant="hero" size="sm" className="w-full" onClick={() => updateOrderStatus("aceito")}><CheckCircle2 className="w-4 h-4 mr-1" /> Aceitar</Button>
              <Button variant="outline" size="sm" className="w-full text-destructive border-destructive/30" onClick={() => updateOrderStatus("recusado")}><XCircle className="w-4 h-4 mr-1" /> Recusar</Button>
            </div>
          )}
          {order.status === "aceito" && isEditor && (
            <Button variant="hero" size="sm" className="w-full" onClick={() => updateOrderStatus("em_andamento")}><Clock className="w-4 h-4 mr-1" /> Iniciar projeto</Button>
          )}
          {order.status === "em_andamento" && isEditor && (
            <Button variant="hero" size="sm" className="w-full" onClick={() => updateOrderStatus("em_revisao")}><AlertCircle className="w-4 h-4 mr-1" /> Enviar para revisão</Button>
          )}
          {order.status === "em_revisao" && isClient && (
            <div className="space-y-2">
              <Button variant="hero" size="sm" className="w-full" onClick={() => updateOrderStatus("concluido")}><CheckCircle2 className="w-4 h-4 mr-1" /> Aprovar entrega</Button>
              <Button variant="outline" size="sm" className="w-full" onClick={handleRevisionRequest}>
                <RefreshCw className="w-3.5 h-3.5 mr-1" />
                {order.revision_locked ? "Solicitar revisão extra" : "Solicitar revisão"}
              </Button>
            </div>
          )}
        </aside>

        {/* ── CHAT ── */}
        <div className="flex-1 flex flex-col bg-gradient-card border border-border/50 rounded-2xl overflow-hidden min-h-[500px] lg:min-h-0">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-border/50 bg-background/50">
            <MessageSquare className="w-5 h-5 text-primary" />
            <div>
              <p className="font-semibold text-sm">Chat com {isAdmin ? "participantes" : otherParticipant?.full_name ?? "Participante"}</p>
              <p className="text-xs text-muted-foreground">{messages.length} mensagem{messages.length !== 1 ? "s" : ""}</p>
            </div>
            <div className="ml-auto flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              <span className="text-xs text-muted-foreground">Tempo real</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <MessageSquare className="w-12 h-12 text-muted-foreground mb-3" />
                <p className="text-muted-foreground text-sm">Nenhuma mensagem ainda.</p>
              </div>
            ) : (
              Object.entries(grouped).map(([date, msgs]) => (
                <div key={date}>
                  <div className="flex items-center gap-3 my-4">
                    <div className="flex-1 h-px bg-border/50" />
                    <span className="text-xs text-muted-foreground px-2">{date}</span>
                    <div className="flex-1 h-px bg-border/50" />
                  </div>
                  <div className="space-y-2">
                    {msgs.map(msg => {
                      const isMine = !isAdmin && msg.sender_id === user.id;
                      return (
                        <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                          {!isMine && (
                            <div className="w-7 h-7 rounded-full bg-gradient-primary grid place-items-center text-xs font-bold text-primary-foreground mr-2 flex-shrink-0 self-end">
                              {getSenderInitial(msg.sender_id)}
                            </div>
                          )}
                          <div className="max-w-[75%] space-y-1">
                            {isAdmin && <p className={`text-xs text-muted-foreground px-1 ${isMine ? "text-right" : "text-left"}`}>{getSenderName(msg.sender_id)}</p>}
                            <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                              isMine ? "bg-gradient-primary text-primary-foreground rounded-br-sm"
                              : isAdmin && msg.sender_id === order.client_id ? "bg-blue-500/20 text-foreground rounded-bl-sm border border-blue-500/20"
                              : "bg-secondary text-foreground rounded-bl-sm"
                            }`}>{msg.content}</div>
                            <p className={`text-xs text-muted-foreground ${isMine ? "text-right" : "text-left"} px-1`}>
                              {formatTime(msg.created_at)}
                              {isMine && msg.read_at && <CheckCircle2 className="w-3 h-3 inline ml-1 text-accent" />}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
            <div ref={bottomRef} />
          </div>

          {["concluido", "cancelado", "recusado"].includes(order.status) || isAdmin ? (
            <div className="px-5 py-4 border-t border-border/50 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
              {isAdmin ? <><Eye className="w-4 h-4 text-yellow-400" /> Modo somente leitura</> : "Este pedido está encerrado."}
            </div>
          ) : (
            <div className="px-5 py-4 border-t border-border/50">
              <div className="flex items-end gap-3">
                <textarea ref={inputRef} value={content} onChange={e => setContent(e.target.value)} onKeyDown={handleKeyDown}
                  placeholder="Digite uma mensagem... (Enter para enviar)" rows={1}
                  className="flex-1 resize-none rounded-xl border border-input bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px] max-h-32" />
                <Button variant="hero" size="icon" className="w-11 h-11 flex-shrink-0 rounded-xl" onClick={handleSend} disabled={!content.trim() || sending}>
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-center">Mensagens são monitoradas para segurança.</p>
            </div>
          )}
        </div>
      </div>

      {/* ── MODAL REVISÃO ── */}
      {showModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-card border border-border/50 rounded-2xl p-6 max-w-md w-full shadow-elegant space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-yellow-400/10 grid place-items-center">
                <AlertTriangle className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <h3 className="font-bold">Revisão além do pacote</h3>
                <p className="text-xs text-muted-foreground">Responda para prosseguir</p>
              </div>
            </div>
            {REVISION_QUESTIONS.map(q => (
              <div key={q.id} className="space-y-2">
                <p className="text-sm font-medium">{q.question}</p>
                {q.options.map(opt => (
                  <button key={opt.id} type="button"
                    onClick={() => setRevAnswers(prev => ({ ...prev, [q.id]: { id: opt.id, type: opt.type } }))}
                    className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${revAnswers[q.id]?.id === opt.id ? "border-primary bg-primary/10" : "border-border/50 hover:border-primary/50 text-muted-foreground"}`}>
                    {opt.label}
                  </button>
                ))}
              </div>
            ))}
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowModal(false)}>Cancelar</Button>
              <Button variant="hero" className="flex-1" onClick={handleRevisionSubmit}>Enviar</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;
