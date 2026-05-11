import { useNavigate, Link } from "react-router-dom";
import { Users, Video, CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import iconeEditai from "@/assets/icone-definitivo.png";

const EscolhaCadastro = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen grid place-items-center p-4 bg-background">
      <div className="w-full max-w-2xl space-y-8">

        {/* Logo */}
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <img src={iconeEditai} alt="Editaí" className="w-10 h-10 rounded-xl" />
            <span className="font-display text-2xl font-bold">Edit<span className="text-gradient">aí</span></span>
          </Link>
          <h1 className="text-3xl font-bold mb-2">Criar conta</h1>
          <p className="text-muted-foreground">Como você quer usar a plataforma?</p>
        </div>

        {/* Cards de escolha */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          {/* Card Cliente */}
          <button
            onClick={() => navigate("/cadastro/cliente")}
            className="group bg-gradient-card border-2 border-border/50 hover:border-primary/50 rounded-2xl p-7 text-left transition-all hover:shadow-elegant space-y-4"
          >
            <div className="w-14 h-14 rounded-2xl bg-primary/10 grid place-items-center group-hover:bg-primary/20 transition-all">
              <Users className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold mb-1">Sou cliente</h2>
              <p className="text-sm text-muted-foreground">
                Quero contratar editores de vídeo para meus projetos
              </p>
            </div>
            <ul className="space-y-2">
              {[
                "Acesso imediato após cadastro",
                "Busque editores verificados",
                "Pagamento seguro via plataforma",
                "Acompanhe seus projetos",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CheckCircle2 className="w-3.5 h-3.5 text-accent flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <div className="flex items-center gap-2 text-primary font-medium text-sm group-hover:gap-3 transition-all">
              Criar conta de cliente <ArrowRight className="w-4 h-4" />
            </div>
          </button>

          {/* Card Editor */}
          <button
            onClick={() => navigate("/cadastro/editor")}
            className="group bg-gradient-card border-2 border-border/50 hover:border-accent/50 rounded-2xl p-7 text-left transition-all hover:shadow-elegant space-y-4"
          >
            <div className="w-14 h-14 rounded-2xl bg-accent/10 grid place-items-center group-hover:bg-accent/20 transition-all">
              <Video className="w-7 h-7 text-accent" />
            </div>
            <div>
              <h2 className="text-xl font-bold mb-1">Sou editor</h2>
              <p className="text-sm text-muted-foreground">
                Quero oferecer meus serviços de edição de vídeo
              </p>
            </div>
            <ul className="space-y-2">
              {[
                "Processo de verificação de qualidade",
                "Badge de editor verificado",
                "Receba projetos de clientes",
                "Pagamento seguro e garantido",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CheckCircle2 className="w-3.5 h-3.5 text-accent flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <div className="flex items-center gap-2 text-accent font-medium text-sm group-hover:gap-3 transition-all">
              Quero ser editor <ArrowRight className="w-4 h-4" />
            </div>
          </button>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Já tem conta?{" "}
          <Link to="/login" className="text-primary hover:underline font-medium">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
};

export default EscolhaCadastro;
