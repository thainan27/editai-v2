import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Star, Search, Calculator, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EDITOR_LEVELS, SPECIALTIES, formatBRL, EditorLevel } from "@/lib/constants";

interface EditorRow {
  id: string;
  bio: string | null;
  specialty: string;
  level: EditorLevel;
  base_price: number;
  rating_avg: number;
  rating_count: number;
  is_featured: boolean;
  accepts_sos: boolean;
  profiles: { full_name: string; avatar_url: string | null } | null;
}

const Editores = () => {
  const [editors, setEditors] = useState<EditorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterLevel,  setFilterLevel]  = useState<EditorLevel | "all">("all");
  const [filterSpec,   setFilterSpec]   = useState<string>("all");
  const [filterNew,    setFilterNew]    = useState(false);
  const [filterSos,    setFilterSos]    = useState(false);
  const [search,       setSearch]       = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("editor_profiles")
        .select("id, bio, specialty, level, base_price, rating_avg, rating_count, is_featured, accepts_sos, profiles(full_name, avatar_url)")
        .eq("status", "aprovado")
        .order("is_featured", { ascending: false })
        .order("rating_avg", { ascending: false });
      setEditors((data as unknown as EditorRow[]) ?? []);
      setLoading(false);
    })();
  }, []);

  const filtered = editors.filter((e) => {
    if (filterLevel !== "all" && e.level !== filterLevel) return false;
    if (filterSpec !== "all" && e.specialty !== filterSpec) return false;
    if (filterNew && e.rating_count > 0) return false;
    if (filterSos && !e.accepts_sos) return false;
    if (search && !e.profiles?.full_name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="container py-12 flex-1">
        <div className="mb-10 space-y-3">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold">Catálogo de <span className="text-gradient">editores</span></h1>
              <p className="text-muted-foreground mt-1">Encontre o profissional perfeito para o seu próximo vídeo.</p>
            </div>
            <Button
              variant="outline"
              className="gap-2 self-start"
              onClick={() => navigate("/calculadora")}
            >
              <Calculator className="w-4 h-4 text-primary" />
              Quanto vai custar?
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-gradient-card border border-border/50 rounded-2xl p-4 md:p-6 mb-8 flex flex-col gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <FilterChip active={filterLevel === "all"} onClick={() => setFilterLevel("all")}>Todos os níveis</FilterChip>
            {(Object.keys(EDITOR_LEVELS) as EditorLevel[]).map((lvl) => (
              <FilterChip key={lvl} active={filterLevel === lvl} onClick={() => setFilterLevel(lvl)}>
                {EDITOR_LEVELS[lvl].label}
              </FilterChip>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <FilterChip active={!filterNew && !filterSos} onClick={() => { setFilterNew(false); setFilterSos(false); }}>Todos</FilterChip>
            <FilterChip active={filterNew} onClick={() => { setFilterNew(!filterNew); setFilterSos(false); }}>✨ Novos Talentos</FilterChip>
            <FilterChip active={filterSos} onClick={() => { setFilterSos(!filterSos); setFilterNew(false); }}>
              <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-yellow-400" /> SOS Urgente</span>
            </FilterChip>
          </div>
          <div className="flex flex-wrap gap-2">
            <FilterChip active={filterSpec === "all"} onClick={() => setFilterSpec("all")}>Todas especialidades</FilterChip>
            {SPECIALTIES.map((s) => (
              <FilterChip key={s} active={filterSpec === s} onClick={() => setFilterSpec(s)}>{s}</FilterChip>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center text-muted-foreground py-16">Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 space-y-4">
            <p className="text-muted-foreground">Nenhum editor encontrado ainda.</p>
            <Button variant="hero" asChild>
              <Link to="/cadastro?tipo=editor">Seja o primeiro editor</Link>
            </Button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((ed) => (
              <Link
                key={ed.id}
                to={`/editor/${ed.id}`}
                className="group bg-gradient-card border border-border/50 rounded-2xl p-5 transition-smooth hover:border-primary/60 hover:-translate-y-1 hover:shadow-elegant"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-primary grid place-items-center text-xl font-bold text-primary-foreground">
                    {ed.profiles?.full_name.charAt(0) ?? "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="font-semibold truncate">{ed.profiles?.full_name}</h3>
                      {ed.rating_count === 0 && (
                        <span className="text-xs px-1.5 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30 flex-shrink-0">
                          ✨ Novo Talento
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{ed.specialty}</p>
                  </div>
                  {ed.is_featured && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-accent/20 text-accent border border-accent/40">★ Destaque</span>
                  )}
                  {ed.accepts_sos && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-400/20 text-yellow-400 border border-yellow-400/40 flex items-center gap-1">
                      <Zap className="w-3 h-3" /> SOS
                    </span>
                  )}
                </div>
                <div className={`inline-block text-xs px-2.5 py-1 rounded-full bg-gradient-to-r ${EDITOR_LEVELS[ed.level].color} text-primary-foreground font-medium mb-3`}>
                  {EDITOR_LEVELS[ed.level].label}
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4 min-h-[2.5rem]">
                  {ed.bio || "Editor profissional pronto para o seu projeto."}
                </p>
                <div className="flex items-center justify-between pt-4 border-t border-border/50">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-accent fill-current" />
                    <span className="text-sm font-medium">{ed.rating_avg.toFixed(1)}</span>
                    <span className="text-xs text-muted-foreground">({ed.rating_count})</span>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">a partir de</div>
                    <div className="font-bold text-gradient">{formatBRL(ed.base_price)}</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

const FilterChip = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
  <button
    onClick={onClick}
    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-smooth border ${
      active
        ? "bg-gradient-primary text-primary-foreground border-transparent"
        : "border-border bg-secondary/50 text-muted-foreground hover:border-primary/50"
    }`}
  >
    {children}
  </button>
);

export default Editores;
