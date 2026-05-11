import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Clapperboard, Loader2 } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

// Schema de validação do cadastro
const signupSchema = z.object({
  full_name: z.string().trim().min(2, "Nome muito curto").max(100),
  email: z.string().trim().email("Email inválido").max(255),
  phone: z.string().trim().min(8, "Telefone inválido").max(20),
  password: z.string().min(6, "Mínimo 6 caracteres").max(72),
});

const Cadastro = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const initialType = params.get("tipo") === "editor" ? "editor" : "cliente";
  const [accountType, setAccountType] = useState<"cliente" | "editor">(initialType);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = signupSchema.safeParse(Object.fromEntries(fd));
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    const { full_name, email, phone, password } = parsed.data;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { full_name, phone, account_type: accountType },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Conta criada! Verifique seu email para ativar.");
    navigate(accountType === "editor" ? "/candidatura" : "/dashboard/cliente");
  }

  return (
    <div className="min-h-screen grid place-items-center p-4">
      <div className="w-full max-w-md space-y-6">
        <Link to="/" className="flex items-center justify-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-gradient-primary grid place-items-center">
            <Clapperboard className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-display text-xl font-bold">EDITA<span className="text-gradient">Í</span></span>
        </Link>

        <div className="bg-gradient-card border border-border/50 rounded-2xl p-8 shadow-elegant">
          <h1 className="font-display text-2xl font-bold mb-1">Criar conta</h1>
          <p className="text-sm text-muted-foreground mb-6">Comece em menos de um minuto</p>

          <div className="grid grid-cols-2 gap-2 mb-6 p-1 bg-secondary rounded-lg">
            {(["cliente", "editor"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setAccountType(t)}
                className={`py-2 rounded-md text-sm font-medium transition-smooth ${
                  accountType === t ? "bg-gradient-primary text-primary-foreground" : "text-muted-foreground"
                }`}
              >
                Sou {t === "cliente" ? "cliente" : "editor"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="full_name">Nome completo</Label>
              <Input id="full_name" name="full_name" required />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            <div>
              <Label htmlFor="phone">Telefone</Label>
              <Input id="phone" name="phone" type="tel" placeholder="(11) 99999-9999" required />
            </div>
            <div>
              <Label htmlFor="password">Senha</Label>
              <Input id="password" name="password" type="password" minLength={6} required />
            </div>
            <Button type="submit" variant="hero" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Criar conta"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Já tem conta? <Link to="/login" className="text-primary hover:underline">Entrar</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Cadastro;
