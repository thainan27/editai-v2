import { Link, useLocation, useNavigate } from "react-router-dom";
import { LogOut, LayoutDashboard, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
// import { NotificationBell } from "@/components/NotificationBell";
import iconeEditai from "@/assets/icone-definitivo.png";

export const Navbar = () => {
  const { user, signOut, accountType } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(0);

  const dashPath =
    accountType === "admin"   ? "/admin"
    : accountType === "editor"  ? "/dashboard/editor"
    : "/dashboard/cliente";

  // Badge de notificação — pedidos pendentes
  useEffect(() => {
    if (!user || !accountType) return;
    (async () => {
      if (accountType === "cliente") {
        const { count } = await supabase
          .from("orders")
          .select("id", { count: "exact", head: true })
          .eq("client_id", user.id)
          .eq("status", "em_revisao");
        setPending(count ?? 0);
      } else if (accountType === "editor") {
        const { count } = await supabase
          .from("orders")
          .select("id", { count: "exact", head: true })
          .eq("editor_id", user.id)
          .eq("status", "aguardando_aceite");
        setPending(count ?? 0);
      } else if (accountType === "admin") {
        const { count } = await supabase
          .from("editor_profiles")
          .select("id", { count: "exact", head: true })
          .eq("status", "pendente");
        setPending(count ?? 0);
      }
    })();
  }, [user, accountType]);

  // Nav por perfil
  const navItems = (() => {
    if (!user) return [
      { to: "/",              label: "Início" },
      { to: "/editores",      label: "Editores" },
      { to: "/como-funciona", label: "Como funciona" },
    ];
    if (accountType === "cliente") return [
      { to: "/",                   label: "Início" },
      { to: "/editores",           label: "Editores" },
      { to: "/dashboard/cliente",  label: "Meus pedidos" },
    ];
    if (accountType === "editor") return [
      { to: "/",                  label: "Início" },
      { to: "/dashboard/editor",  label: "Meu painel" },
      { to: "/editores",          label: "Marketplace" },
    ];
    if (accountType === "admin") return [
      { to: "/",        label: "Início" },
      { to: "/admin",   label: "Gestão" },
      { to: "/editores",label: "Marketplace" },
    ];
    return [];
  })();

  const isActive = (path: string) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/70 border-b border-border/50">
      <nav className="container flex items-center justify-between h-16">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <img
            src={iconeEditai}
            alt="Editaí"
            className="w-9 h-9 rounded-lg transition-smooth group-hover:scale-110"
          />
          <span className="font-display text-xl font-bold tracking-tight">
            Edit<span className="text-gradient">aí</span>
          </span>
        </Link>

        {/* Nav desktop */}
        <div className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`text-sm font-medium transition-smooth hover:text-primary ${
                isActive(item.to) ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* Ações desktop */}
        <div className="hidden md:flex items-center gap-2">
          {user ? (
            <>
              {/* <NotificationBell /> */}
              <Button variant="ghost" size="sm" className="relative" onClick={() => navigate(dashPath)}>
                <LayoutDashboard className="w-4 h-4 mr-2" /> Painel
                {pending > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-xs grid place-items-center font-bold">
                    {pending > 9 ? "9+" : pending}
                  </span>
                )}
              </Button>
              <Button variant="ghost" size="icon" onClick={() => signOut().then(() => navigate("/"))} title="Sair">
                <LogOut className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate("/login")}>
                Entrar
              </Button>
              <Button variant="hero" size="sm" onClick={() => navigate("/cadastro")}>
                Começar grátis
              </Button>
            </>
          )}
        </div>

        {/* Botão menu mobile */}
        <button
          className="md:hidden p-2 relative"
          onClick={() => setOpen(!open)}
          aria-label="Menu"
        >
          {open ? <X /> : <Menu />}
          {pending > 0 && (
            <span className="absolute top-1 right-1 w-3 h-3 rounded-full bg-destructive" />
          )}
        </button>
      </nav>

      {/* Menu mobile */}
      {open && (
        <div className="md:hidden border-t border-border/50 bg-background/95 backdrop-blur-xl">
          <div className="container py-4 flex flex-col gap-3">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={`py-2 text-sm font-medium flex items-center justify-between ${
                  isActive(item.to) ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {item.label}
                {item.to === dashPath && pending > 0 && (
                  <span className="w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-xs grid place-items-center">
                    {pending}
                  </span>
                )}
              </Link>
            ))}
            <div className="border-t border-border/50 pt-3 flex flex-col gap-2">
              {user ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() => { navigate(dashPath); setOpen(false); }}
                    className="relative"
                  >
                    Painel
                    {pending > 0 && (
                      <span className="ml-2 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-xs grid place-items-center">
                        {pending}
                      </span>
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => { signOut().then(() => navigate("/")); setOpen(false); }}
                  >
                    Sair
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" onClick={() => { navigate("/login"); setOpen(false); }}>
                    Entrar
                  </Button>
                  <Button variant="hero" onClick={() => { navigate("/cadastro"); setOpen(false); }}>
                    Começar grátis
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
