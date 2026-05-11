import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Star, Loader2, CheckCircle2, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

// ── Star rating ───────────────────────────────────────────────────────────
const StarRating = ({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) => (
  <div className="space-y-1.5">
    <p className="text-sm font-medium">{label}</p>
    <div className="flex items-center gap-1">
      {[1,2,3,4,5].map(i => (
        <button key={i} type="button" onClick={() => onChange(i)}>
          <Star className={`w-7 h-7 transition-all ${i <= value ? "text-accent fill-accent" : "text-muted-foreground hover:text-accent"}`} />
        </button>
      ))}
      <span className="text-sm text-muted-foreground ml-2">{value > 0 ? `${value}/5` : "Selecione"}</span>
    </div>
  </div>
);

// ── Avaliação do Editor pelo Cliente ─────────────────────────────────────
export const AvaliacaoEditor = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [rating,       setRating]       = useState(0);
  const [prazo,        setPrazo]        = useState(0);
  const [comunicacao,  setComunicacao]  = useState(0);
  const [comment,      setComment]      = useState("");
  const [loading,      setLoading]      = useState(false);
  const [done,         setDone]         = useState(false);

  const handleSubmit = async () => {
    if (!user || !orderId) return;
    if (rating === 0 || prazo === 0 || comunicacao === 0) {
      toast.error("Avalie todos os critérios antes de enviar"); return;
    }
    setLoading(true);
    try {
      // Busca o editor do pedido
      const { data: order } = await supabase.from("orders").select("editor_id").eq("id", orderId).single();
      if (!order) throw new Error("Pedido não encontrado");

      const { error } = await supabase.from("editor_reviews").upsert({
        order_id:      orderId,
        client_id:     user.id,
        editor_id:     order.editor_id,
        rating,
        deadline_score: prazo,
        communication:  comunicacao,
        comment:        comment.trim() || null,
      }, { onConflict: "order_id" });

      if (error) throw error;

      // Recalcula rating médio do editor
      const { data: reviews } = await supabase
        .from("editor_reviews")
        .select("rating, deadline_score, communication")
        .eq("editor_id", order.editor_id);

      if (reviews && reviews.length > 0) {
        const avg = reviews.reduce((s, r) =>
          s + (r.rating * 0.5 + r.deadline_score * 0.3 + r.communication * 0.2), 0) / reviews.length;
        await supabase.from("editor_profiles").update({
          rating_avg:   Math.round(avg * 10) / 10,
          rating_count: reviews.length,
        }).eq("id", order.editor_id);
      }

      setDone(true);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao enviar avaliação");
    } finally {
      setLoading(false);
    }
  };

  if (done) return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="container flex-1 grid place-items-center py-12">
        <div className="text-center space-y-5 max-w-sm">
          <div className="w-20 h-20 rounded-full bg-accent/10 grid place-items-center mx-auto">
            <CheckCircle2 className="w-10 h-10 text-accent" />
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-2">Avaliação enviada! 🎉</h2>
            <p className="text-muted-foreground text-sm">Obrigado por ajudar a comunidade Editaí a crescer.</p>
          </div>
          <Button variant="hero" className="w-full" onClick={() => navigate("/dashboard/cliente")}>
            Voltar aos meus pedidos
          </Button>
        </div>
      </main>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="container flex-1 py-12 max-w-lg mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>
        <div className="bg-gradient-card border border-border/50 rounded-2xl p-7 space-y-6">
          <div>
            <h1 className="text-2xl font-bold mb-1">Avaliar editor</h1>
            <p className="text-sm text-muted-foreground">Sua avaliação ajuda outros clientes a escolher os melhores.</p>
          </div>

          <StarRating label="Qualidade geral do trabalho *" value={rating} onChange={setRating} />
          <StarRating label="Cumprimento do prazo *"         value={prazo} onChange={setPrazo} />
          <StarRating label="Comunicação e clareza *"         value={comunicacao} onChange={setComunicacao} />

          <div>
            <p className="text-sm font-medium mb-1.5">Comentário (opcional)</p>
            <Textarea placeholder="Descreva sua experiência com o editor..." value={comment}
              onChange={e => setComment(e.target.value)} rows={4} maxLength={500} />
            <p className="text-xs text-muted-foreground text-right mt-1">{comment.length}/500</p>
          </div>

          <div className="bg-secondary/50 rounded-xl p-4 text-xs text-muted-foreground">
            Avaliações são públicas e visíveis no perfil do editor. Seja honesto e respeitoso.
          </div>

          <Button variant="hero" className="w-full" onClick={handleSubmit} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Enviar avaliação"}
          </Button>
        </div>
      </main>
    </div>
  );
};

// ── Avaliação do Cliente pelo Editor ─────────────────────────────────────
export const AvaliacaoCliente = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [rating,       setRating]       = useState(0);
  const [clareza,      setClareza]      = useState(0);
  const [comunicacao,  setComunicacao]  = useState(0);
  const [comment,      setComment]      = useState("");
  const [loading,      setLoading]      = useState(false);
  const [done,         setDone]         = useState(false);

  const handleSubmit = async () => {
    if (!user || !orderId) return;
    if (rating === 0 || clareza === 0 || comunicacao === 0) {
      toast.error("Avalie todos os critérios antes de enviar"); return;
    }
    setLoading(true);
    try {
      const { data: order } = await supabase.from("orders").select("client_id").eq("id", orderId).single();
      if (!order) throw new Error("Pedido não encontrado");

      const { error } = await supabase.from("client_reviews").upsert({
        order_id:      orderId,
        editor_id:     user.id,
        client_id:     order.client_id,
        rating,
        brief_clarity: clareza,
        communication: comunicacao,
        comment:       comment.trim() || null,
      }, { onConflict: "order_id" });

      if (error) throw error;

      // Recalcula score do cliente
      const { data: reviews } = await supabase
        .from("client_reviews")
        .select("rating, brief_clarity, communication")
        .eq("client_id", order.client_id);

      if (reviews && reviews.length > 0) {
        const avg = reviews.reduce((s, r) =>
          s + (r.rating * 0.5 + r.brief_clarity * 0.3 + r.communication * 0.2), 0) / reviews.length;
        await supabase.from("profiles").update({
          client_score:       Math.round(avg * 100) / 100,
          client_score_count: reviews.length,
        }).eq("id", order.client_id);
      }

      setDone(true);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao enviar avaliação");
    } finally {
      setLoading(false);
    }
  };

  if (done) return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="container flex-1 grid place-items-center py-12">
        <div className="text-center space-y-5 max-w-sm">
          <div className="w-20 h-20 rounded-full bg-accent/10 grid place-items-center mx-auto">
            <CheckCircle2 className="w-10 h-10 text-accent" />
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-2">Avaliação enviada! 🎉</h2>
            <p className="text-muted-foreground text-sm">Obrigado por contribuir com a qualidade da plataforma.</p>
          </div>
          <Button variant="hero" className="w-full" onClick={() => navigate("/dashboard/editor")}>
            Voltar ao painel
          </Button>
        </div>
      </main>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="container flex-1 py-12 max-w-lg mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>
        <div className="bg-gradient-card border border-border/50 rounded-2xl p-7 space-y-6">
          <div>
            <h1 className="text-2xl font-bold mb-1">Avaliar cliente</h1>
            <p className="text-sm text-muted-foreground">Sua avaliação ajuda outros editores a conhecer este cliente.</p>
          </div>

          <StarRating label="Experiência geral com o cliente *" value={rating} onChange={setRating} />
          <StarRating label="Clareza do brief fornecido *"       value={clareza} onChange={setClareza} />
          <StarRating label="Comunicação durante o projeto *"    value={comunicacao} onChange={setComunicacao} />

          <div>
            <p className="text-sm font-medium mb-1.5">Comentário (opcional)</p>
            <Textarea placeholder="Como foi trabalhar com este cliente?" value={comment}
              onChange={e => setComment(e.target.value)} rows={4} maxLength={500} />
            <p className="text-xs text-muted-foreground text-right mt-1">{comment.length}/500</p>
          </div>

          <div className="bg-secondary/50 rounded-xl p-4 text-xs text-muted-foreground">
            A avaliação do cliente é visível apenas para editores antes de aceitarem um pedido — nunca para o próprio cliente.
          </div>

          <Button variant="hero" className="w-full" onClick={handleSubmit} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Enviar avaliação"}
          </Button>
        </div>
      </main>
    </div>
  );
};
