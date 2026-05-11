import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import iconeEditai from "@/assets/icone-definitivo.png";

const ADMIN_EMAILS = ["oliverinvestir@gmail.com"];

const Login = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email"));
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: String(fd.get("password")),
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Bem-vindo de volta!");
    // Admin vai direto pro painel
    if (ADMIN_EMAILS.includes(email)) {
      navigate("/admin");
    } else {
      navigate("/");
    }
  }

  return (
    <div className="min-h-screen grid place-items-center p-4">
      <div className="w-full max-w-md space-y-6">
        <Link to="/" className="flex items-center justify-center gap-2">
          <img src={iconeEditai} alt="Editaí" className="w-9 h-9 rounded-lg" />
          <span className="font-display text-xl font-bold">Edit<span className="text-gradient">aí</span></span>
        </Link>

        <div className="bg-gradient-card border border-border/50 rounded-2xl p-8 shadow-elegant">
          <h1 className="font-display text-2xl font-bold mb-1">Entrar</h1>
          <p className="text-sm text-muted-foreground mb-6">Acesse sua conta Editaí</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            <div>
              <Label htmlFor="password">Senha</Label>
              <Input id="password" name="password" type="password" required />
            </div>
            <Button type="submit" variant="hero" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Entrar"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Não tem conta? <Link to="/cadastro" className="text-primary hover:underline">Criar conta</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
