import { Link } from "react-router-dom";
import iconeEditai from "@/assets/icone-definitivo.png";

export const Footer = () => (
  <footer className="border-t border-border/50 mt-24">
    <div className="container py-12 grid gap-8 md:grid-cols-4">
      <div className="md:col-span-2">
        <Link to="/" className="flex items-center gap-2 mb-3">
          <img src={iconeEditai} alt="Editaí" className="w-8 h-8 rounded-lg" />
          <span className="font-display text-lg font-bold">Edit<span className="text-gradient">aí</span></span>
        </Link>
        <p className="text-sm text-muted-foreground max-w-sm">
          O marketplace que conecta criadores aos melhores editores de vídeo do Brasil.
          Pagamento seguro, entrega garantida.
        </p>
      </div>
      <div>
        <h4 className="font-semibold mb-3 text-sm">Plataforma</h4>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li><Link to="/editores" className="hover:text-foreground transition-smooth">Editores</Link></li>
          <li><Link to="/como-funciona" className="hover:text-foreground transition-smooth">Como funciona</Link></li>
          <li><Link to="/calculadora" className="hover:text-foreground transition-smooth">Calculadora de preço</Link></li>
          <li><Link to="/recorrente" className="hover:text-foreground transition-smooth">Modo Recorrente</Link></li>
        </ul>
      </div>
      <div>
        <h4 className="font-semibold mb-3 text-sm">Suporte</h4>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li><Link to="/como-funciona" className="hover:text-foreground transition-smooth">Central de ajuda</Link></li>
          <li><a href="mailto:suporte@editai.app" className="hover:text-foreground transition-smooth">Contato</a></li>
          <li><Link to="/termos" className="hover:text-foreground transition-smooth">Termos de uso</Link></li>
          <li><Link to="/privacidade" className="hover:text-foreground transition-smooth">Privacidade</Link></li>
        </ul>
      </div>
    </div>
    <div className="border-t border-border/50 py-6 text-center text-xs text-muted-foreground">
      © {new Date().getFullYear()} Editaí — Todos os direitos reservados · suporte@editai.app
    </div>
  </footer>
);
