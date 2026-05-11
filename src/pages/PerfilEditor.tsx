import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Star, ArrowLeft, ExternalLink, CheckCircle2, Clock,
  Award, Zap, MessageSquare, Shield, TrendingUp,
  Play, Package, ThumbsUp
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { EDITOR_LEVELS, SPECIALTIES, formatBRL } from "@/lib/constants";
import type { EditorLevel } from "@/lib/constants";

interface EditorProfile {
  id: string;
  bio: string | null;
  specialty: string;
  level: EditorLevel;
  base_price: number;
  rating_avg: number;
  rating_count: number;
  is_featured: boolean;
  portfolio_links: string[];
  status: string;
  created_at: string;
}

interface Profile {
  full_name: string;
  avatar_url: string | null;
}

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

function getVideoEmbed(url: string): { type: string; embedUrl: string } {
  if (url.includes("youtube.com/watch")) {
    const id = new URL(url).searchParams.get("v");
    return { type: "youtube", embedUrl: `https://www.youtube.com/embed/${id}` };
  }
  if (url.includes("youtu.be/")) {
    const id = url.split("youtu.be/")[1]?.split("?")[0];
    return { type: "youtube", embedUrl: `https://www.youtube.com/embed/${id}` };
  }
  if (url.includes("vimeo.com/")) {
    const id = url.split("vimeo.com/")[1]?.split("?")[0];
    return { type: "vimeo", embedUrl: `https://player.vimeo.com/video/${id}` };
  }
  return { type: "link", embedUrl: url };
}

function StarRating({ value, size = "sm" }: { value: number; size?: "sm" | "lg" }) {
  const cls = size === "lg" ? "w-5 h-5" : "w-4 h-4";
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={`${cls} ${i <= Math.round(value) ? "text-accent fill-accent" : "text-muted-foreground"}`} />
      ))}
    </div>
  );
}

const PerfilEditor = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<EditorProfile | null>(null);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [completedOrders, setCompletedOrders] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"sobre" | "portfolio" | "avaliacoes">("sobre");

  useEffect(() => {
    if (!id) return;
    (async () => {
      const [{ data: ep }, { data: up }, { data: rv }, { data: ords }] = await Promise.all([
        supabase.from("editor_profiles").select("*").eq("id", id).eq("status", "aprovado").single(),
        supabase.from("profiles").select("full_name, avatar_url").eq("id", id).single(),
        supabase.from("reviews").select("*").eq("editor_id", id).order("created_at", { ascending: false }).limit(10),
        supabase.from("orders").select("id").eq("editor_id", id).eq("status", "concluido"),
      ]);
      setProfile(ep as EditorProfile | null);
      setUserProfile(up as Profile | null);
      setReviews((rv as Review[]) ?? []);
      setCompletedOrders(ords?.length ?? 0);
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="container py-24 flex-1 grid place-items-center">
          <div className="space-y-4 text-center animate-pulse">
            <div className="w-24 h-24 rounded-2xl bg-secondary mx-auto" />
            <div className="h-5 w-48 bg-secondary rounded mx-auto" />
            <div className="h-4 w-32 bg-secondary rounded mx-auto" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!profile || !userProfile) {
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

  const level = EDITOR_LEVELS[profile.level];
  const memberSince = new Date(profile.created_at).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  const portfolioLinks = Array.isArray(profile.portfolio_links) ? profile.portfolio_links as string[] : [];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">

        {/* HERO */}
        <div className="relative overflow-hidden border-b border-border/50">
          <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />
          <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${level.color}`} />
          <div className="container py-10 relative">
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-smooth">
              <ArrowLeft className="w-4 h-4" /> Voltar
            </button>

            <div className="flex flex-col md:flex-row gap-6 items-start">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className="w-24 h-24 md:w-28 md:h-28 rounded-2xl bg-gradient-primary grid place-items-center text-4xl font-bold text-primary-foreground shadow-elegant">
                  {userProfile.full_name.charAt(0).toUpperCase()}
                </div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-accent grid place-items-center border-2 border-background">
                  <CheckCircle2 className="w-4 h-4 text-accent-foreground" />
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-2xl md:text-3xl font-bold">{userProfile.full_name}</h1>
                  {profile.is_featured && (
                    <span className="px-2.5 py-1 rounded-full bg-accent/10 text-accent border border-accent/30 text-xs font-medium flex items-center gap-1">
                      <Award className="w-3 h-3" /> Editor Destaque
                    </span>
                  )}
                  <span className={`px-2.5 py-1 rounded-full bg-gradient-to-r ${level.color} text-primary-foreground text-xs font-semibold`}>
                    Nível {level.label}
                  </span>
                </div>
                <p className="text-muted-foreground text-sm">{profile.specialty}</p>
                <div className="flex flex-wrap items-center gap-5 text-sm">
                  <div className="flex items-center gap-2">
                    <StarRating value={profile.rating_avg} />
                    <span className="font-semibold">{profile.rating_avg.toFixed(1)}</span>
                    <span className="text-muted-foreground">({profile.rating_count})</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Package className="w-4 h-4 text-primary" />
                    <span><strong className="text-foreground">{completedOrders}</strong> concluídos</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Clock className="w-4 h-4 text-primary" />
                    Membro desde {memberSince}
                  </div>
                </div>
              </div>

              {/* CTA Desktop */}
              <div className="hidden md:block bg-gradient-card border border-border/50 rounded-2xl p-5 w-64 flex-shrink-0 shadow-elegant space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground">A partir de</p>
                  <p className="text-3xl font-bold text-gradient">{formatBRL(profile.base_price)}</p>
                  <p className="text-xs text-muted-foreground">por projeto</p>
                </div>
                <Button variant="hero" className="w-full" onClick={() => navigate(`/briefing/${profile.id}`)}>
                  Contratar agora <Zap className="w-4 h-4 ml-1" />
                </Button>
                <Button variant="outline" className="w-full gap-2">
                  <MessageSquare className="w-4 h-4" /> Enviar mensagem
                </Button>
                <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center">
                  <Shield className="w-3.5 h-3.5 text-accent" /> Pagamento seguro
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CONTEÚDO */}
        <div className="container py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-1 min-w-0">

              {/* Tabs */}
              <div className="flex gap-1 p-1 bg-secondary rounded-xl mb-6 w-fit">
                {(["sobre", "portfolio", "avaliacoes"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-smooth ${
                      activeTab === tab ? "bg-gradient-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {tab === "sobre" ? "Sobre" : tab === "portfolio" ? "Portfólio" : "Avaliações"}
                  </button>
                ))}
              </div>

              {/* TAB SOBRE */}
              {activeTab === "sobre" && (
                <div className="space-y-5">
                  <div className="bg-gradient-card border border-border/50 rounded-2xl p-6">
                    <h2 className="font-semibold text-lg mb-3">Bio</h2>
                    <p className="text-muted-foreground leading-relaxed">{profile.bio || "Bio não informada."}</p>
                  </div>
                  <div className="bg-gradient-card border border-border/50 rounded-2xl p-6">
                    <h2 className="font-semibold text-lg mb-4">Especialidade</h2>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-sm text-primary font-medium">{profile.specialty}</span>
                    </div>
                  </div>
                  <div className="bg-gradient-card border border-border/50 rounded-2xl p-6">
                    <h2 className="font-semibold text-lg mb-4">Faixa de preço — Nível {level.label}</h2>
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <p className="text-xl font-bold">{formatBRL(level.priceRange[0])}</p>
                        <p className="text-xs text-muted-foreground">mínimo</p>
                      </div>
                      <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                        <div className={`h-full bg-gradient-to-r ${level.color} rounded-full`}
                          style={{ width: `${((profile.base_price - level.priceRange[0]) / (level.priceRange[1] - level.priceRange[0])) * 100}%` }} />
                      </div>
                      <div className="text-center">
                        <p className="text-xl font-bold">{formatBRL(level.priceRange[1])}</p>
                        <p className="text-xs text-muted-foreground">máximo</p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-3 text-center">
                      Editor recebe {Math.round((1 - level.platformFee) * 100)}% · Plataforma retém {Math.round(level.platformFee * 100)}%
                    </p>
                  </div>
                </div>
              )}

              {/* TAB PORTFOLIO */}
              {activeTab === "portfolio" && (
                <div className="space-y-5">
                  {portfolioLinks.length === 0 ? (
                    <div className="bg-gradient-card border border-border/50 rounded-2xl p-12 text-center">
                      <Play className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground">Nenhum vídeo adicionado ainda.</p>
                    </div>
                  ) : portfolioLinks.map((link, i) => {
                    const embed = getVideoEmbed(link);
                    return (
                      <div key={i} className="bg-gradient-card border border-border/50 rounded-2xl overflow-hidden">
                        {(embed.type === "youtube" || embed.type === "vimeo") ? (
                          <div className="aspect-video">
                            <iframe src={embed.embedUrl} className="w-full h-full"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen title={`Portfólio ${i + 1}`} />
                          </div>
                        ) : (
                          <div className="p-5 flex items-center justify-between">
                            <div>
                              <p className="font-medium text-sm">Vídeo {i + 1}</p>
                              <p className="text-xs text-muted-foreground truncate max-w-xs">{link}</p>
                            </div>
                            <a href={link} target="_blank" rel="noopener noreferrer">
                              <Button variant="outline" size="sm" className="gap-2">
                                <ExternalLink className="w-3.5 h-3.5" /> Abrir
                              </Button>
                            </a>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* TAB AVALIAÇÕES */}
              {activeTab === "avaliacoes" && (
                <div className="space-y-4">
                  <div className="bg-gradient-card border border-border/50 rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-6">
                    <div className="text-center">
                      <p className="text-5xl font-bold text-gradient">{profile.rating_avg.toFixed(1)}</p>
                      <StarRating value={profile.rating_avg} size="lg" />
                      <p className="text-xs text-muted-foreground mt-1">{profile.rating_count} avaliações</p>
                    </div>
                    <div className="flex-1 w-full space-y-2">
                      {[5, 4, 3, 2, 1].map((star) => {
                        const count = reviews.filter(r => r.rating === star).length;
                        const pct = reviews.length ? (count / reviews.length) * 100 : 0;
                        return (
                          <div key={star} className="flex items-center gap-2 text-xs">
                            <span className="w-3 text-muted-foreground">{star}</span>
                            <Star className="w-3 h-3 text-accent fill-accent flex-shrink-0" />
                            <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                              <div className="h-full bg-accent rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="w-4 text-muted-foreground text-right">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  {reviews.length === 0 ? (
                    <div className="bg-gradient-card border border-border/50 rounded-2xl p-12 text-center">
                      <ThumbsUp className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground">Ainda sem avaliações.</p>
                    </div>
                  ) : reviews.map((rv) => (
                    <div key={rv.id} className="bg-gradient-card border border-border/50 rounded-xl p-5 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-primary grid place-items-center text-xs font-bold text-primary-foreground">C</div>
                          <span className="text-sm font-medium">Cliente verificado</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <StarRating value={rv.rating} />
                          <span className="text-xs text-muted-foreground">{new Date(rv.created_at).toLocaleDateString("pt-BR")}</span>
                        </div>
                      </div>
                      {rv.comment && <p className="text-sm text-muted-foreground">{rv.comment}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:w-72 space-y-5">
              <div className="bg-gradient-card border border-border/50 rounded-2xl p-5 space-y-4">
                <h3 className="font-semibold">Estatísticas</h3>
                {[
                  { label: "Projetos concluídos", value: completedOrders, icon: Package, color: "text-primary" },
                  { label: "Avaliação média", value: `${profile.rating_avg.toFixed(1)} / 5.0`, icon: Star, color: "text-accent" },
                  { label: "Total de avaliações", value: profile.rating_count, icon: TrendingUp, color: "text-primary" },
                ].map((stat) => (
                  <div key={stat.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <stat.icon className={`w-4 h-4 ${stat.color}`} /> {stat.label}
                    </div>
                    <span className="font-semibold text-sm">{stat.value}</span>
                  </div>
                ))}
              </div>

              <div className="bg-gradient-card border border-border/50 rounded-2xl p-5 space-y-3">
                <h3 className="font-semibold">Garantias</h3>
                {[
                  { icon: Shield, text: "Pagamento retido até aprovação" },
                  { icon: CheckCircle2, text: "Editor verificado pela curadoria" },
                  { icon: Award, text: "Revisões incluídas" },
                  { icon: MessageSquare, text: "Suporte em disputas" },
                ].map((g, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <g.icon className="w-4 h-4 text-accent flex-shrink-0" /> {g.text}
                  </div>
                ))}
              </div>

              {/* CTA Mobile */}
              <div className="bg-gradient-card border border-primary/30 rounded-2xl p-5 space-y-3 md:hidden">
                <p className="font-bold text-2xl text-gradient">{formatBRL(profile.base_price)}</p>
                <Button variant="hero" className="w-full" onClick={() => navigate(`/briefing/${profile.id}`)}>
                  Contratar agora <Zap className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PerfilEditor;
