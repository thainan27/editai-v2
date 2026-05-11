import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2, ArrowLeft, Video, CheckCircle2, Award, Eye, EyeOff, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import iconeEditai from "@/assets/icone-definitivo.png";

// ── Reutiliza as mesmas validações do CadastroCliente ──────────────────────
function validateFullName(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) return "Nome obrigatório";
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length < 2) return "Informe pelo menos nome e sobrenome (ex: João Costa)";
  if (parts.some(p => p.length < 2)) return "Cada parte do nome deve ter ao menos 2 letras";
  if (!/^[A-Za-zÀ-ÿ\s]+$/.test(trimmed)) return "Nome deve conter apenas letras";
  return null;
}

function validateEmail(email: string): string | null {
  if (!email.trim()) return "Email obrigatório";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return "Email inválido";
  return null;
}

function validatePhone(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "WhatsApp obrigatório";
  if (digits.length < 10 || digits.length > 11) return "WhatsApp inválido — informe DDD + número";
  if (digits.length === 11 && digits[2] !== "9") return "Celular deve começar com 9 após o DDD";
  return null;
}

const PASSWORD_RULES = [
  { label: "Mínimo 8 caracteres",     test: (p: string) => p.length >= 8 },
  { label: "Letra maiúscula (A-Z)",   test: (p: string) => /[A-Z]/.test(p) },
  { label: "Letra minúscula (a-z)",   test: (p: string) => /[a-z]/.test(p) },
  { label: "Número (0-9)",            test: (p: string) => /[0-9]/.test(p) },
  { label: "Símbolo (!@#$%...)",      test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

function validatePassword(password: string): string | null {
  for (const rule of PASSWORD_RULES) {
    if (!rule.test(password)) return `Senha fraca: ${rule.label}`;
  }
  return null;
}

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2)  return digits;
  if (digits.length <= 6)  return `(${digits.slice(0,2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0,2)}) ${digits.slice(2,6)}-${digits.slice(6)}`;
  return `(${digits.slice(0,2)}) ${digits.slice(2,7)}-${digits.slice(7)}`;
}

const PasswordStrength = ({ password }: { password: string }) => {
  if (!password) return null;
  const passed = PASSWORD_RULES.filter(r => r.test(password)).length;
  return (
    <div className="mt-2 space-y-2">
      <div className="flex gap-1">
        {[1,2,3,4,5].map(i => (
          <div key={i} className={`flex-1 h-1.5 rounded-full transition-all ${
            i <= passed ? passed <= 2 ? "bg-destructive" : passed <= 3 ? "bg-yellow-400" : "bg-accent" : "bg-secondary"
          }`} />
        ))}
      </div>
      <div className="space-y-1">
        {PASSWORD_RULES.map(rule => (
          <div key={rule.label} className={`flex items-center gap-1.5 text-xs ${rule.test(password) ? "text-accent" : "text-muted-foreground"}`}>
            {rule.test(password) ? <CheckCircle2 className="w-3 h-3 flex-shrink-0" /> : <XCircle className="w-3 h-3 flex-shrink-0 opacity-50" />}
            {rule.label}
          </div>
        ))}
      </div>
    </div>
  );
};

const STEPS_INFO = [
  { label: "Cadastro",    desc: "Dados básicos" },
  { label: "Perfil",      desc: "Bio e especialidade" },
  { label: "Portfólio",   desc: "Seus trabalhos" },
  { label: "Questionário",desc: "Habilidades técnicas" },
  { label: "Desafio",     desc: "Teste prático" },
];

const CadastroEditor = () => {
  const navigate = useNavigate();
  const [loading,       setLoading]       = useState(false);
  const [aceitouTermos, setAceitouTermos] = useState(false);
  const [showPass,      setShowPass]      = useState(false);
  const [showConfirm,   setShowConfirm]   = useState(false);
  const [fields, setFields] = useState({
    full_name: "", email: "", phone: "", password: "", confirm_password: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const update = (key: string, value: string) => {
    setFields(prev => ({ ...prev, [key]: value }));
    setErrors(prev => ({ ...prev, [key]: "" }));
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    const nameErr = validateFullName(fields.full_name);     if (nameErr) errs.full_name = nameErr;
    const emailErr = validateEmail(fields.email);           if (emailErr) errs.email = emailErr;
    const phoneErr = validatePhone(fields.phone);           if (phoneErr) errs.phone = phoneErr;
    const passErr = validatePassword(fields.password);      if (passErr) errs.password = passErr;
    if (fields.password !== fields.confirm_password) errs.confirm_password = "As senhas não coincidem";
    if (!aceitouTermos) errs.termos = "Você precisa aceitar os Termos de Uso";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);

    const { error: signUpError } = await supabase.auth.signUp({
      email: fields.email.trim(),
      password: fields.password,
      options: { data: { full_name: fields.full_name.trim(), phone: fields.phone.replace(/\D/g,""), account_type: "editor" } },
    });
    if (signUpError) { setLoading(false); toast.error(signUpError.message); return; }

    const { error: signInError } = await supabase.auth.signInWithPassword({ email: fields.email.trim(), password: fields.password });
    setLoading(false);
    if (signInError) { toast.success("Conta criada! Faça login para continuar."); navigate("/login"); return; }
    toast.success("Conta criada! Vamos completar seu perfil de editor.");
    navigate("/candidatura");
  }

  return (
    <div className="min-h-screen grid place-items-center p-4 py-10">
      <div className="w-full max-w-lg space-y-6">

        <Link to="/" className="flex items-center justify-center gap-2">
          <img src={iconeEditai} alt="Editaí" className="w-9 h-9 rounded-lg" />
          <span className="font-display text-xl font-bold">Edit<span className="text-gradient">aí</span></span>
        </Link>

        {/* Linha do tempo */}
        <div className="bg-gradient-card border border-border/50 rounded-2xl p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-4">Sua jornada como editor verificado</p>
          <div className="flex items-center justify-between relative">
            <div className="absolute top-4 left-0 right-0 h-0.5 bg-border/50 z-0" />
            {STEPS_INFO.map((step, i) => (
              <div key={step.label} className="flex flex-col items-center gap-1.5 z-10 relative">
                <div className={`w-8 h-8 rounded-full grid place-items-center text-xs font-bold border-2 ${i === 0 ? "bg-primary border-primary text-primary-foreground" : "bg-background border-border/50 text-muted-foreground"}`}>
                  {i === 0 ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                </div>
                <div className="text-center">
                  <p className="text-xs font-medium">{step.label}</p>
                  <p className="text-xs text-muted-foreground hidden sm:block">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gradient-card border border-border/50 rounded-2xl p-8 shadow-elegant">
          <button onClick={() => navigate("/cadastro")} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-5">
            <ArrowLeft className="w-3.5 h-3.5" /> Voltar
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-accent/10 grid place-items-center">
              <Video className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h1 className="font-bold text-xl">Cadastro de editor</h1>
              <p className="text-xs text-muted-foreground">Passo 1 de 5 — Dados básicos</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>

            <div>
              <Label>Nome completo *</Label>
              <Input placeholder="João Costa" autoComplete="name" value={fields.full_name}
                onChange={e => update("full_name", e.target.value)}
                className={`mt-1 ${errors.full_name ? "border-destructive" : ""}`} />
              {errors.full_name && <p className="text-xs text-destructive mt-1">{errors.full_name}</p>}
            </div>

            <div>
              <Label>Email profissional *</Label>
              <Input type="email" placeholder="seu@email.com" autoComplete="email" value={fields.email}
                onChange={e => update("email", e.target.value)}
                className={`mt-1 ${errors.email ? "border-destructive" : ""}`} />
              {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
            </div>

            <div>
              <Label>WhatsApp *</Label>
              <Input type="tel" placeholder="(11) 99999-9999" value={fields.phone}
                onChange={e => update("phone", formatPhone(e.target.value))}
                className={`mt-1 ${errors.phone ? "border-destructive" : ""}`} />
              {errors.phone ? <p className="text-xs text-destructive mt-1">{errors.phone}</p>
                : <p className="text-xs text-muted-foreground mt-1">Para notificações de novos pedidos</p>}
            </div>

            <div>
              <Label>Senha *</Label>
              <div className="relative mt-1">
                <Input type={showPass ? "text" : "password"} placeholder="Crie uma senha forte"
                  value={fields.password} onChange={e => update("password", e.target.value)}
                  className={`pr-10 ${errors.password ? "border-destructive" : ""}`} />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-destructive mt-1">{errors.password}</p>}
              <PasswordStrength password={fields.password} />
            </div>

            <div>
              <Label>Confirmar senha *</Label>
              <div className="relative mt-1">
                <Input type={showConfirm ? "text" : "password"} placeholder="Repita a senha"
                  value={fields.confirm_password} onChange={e => update("confirm_password", e.target.value)}
                  className={`pr-10 ${errors.confirm_password ? "border-destructive" : fields.confirm_password && fields.confirm_password === fields.password ? "border-accent" : ""}`} />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirm_password
                ? <p className="text-xs text-destructive mt-1">{errors.confirm_password}</p>
                : fields.confirm_password && fields.confirm_password === fields.password
                  ? <p className="text-xs text-accent mt-1 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Senhas coincidem</p>
                  : null}
            </div>

            <div className="bg-accent/10 border border-accent/30 rounded-xl p-4 flex items-start gap-3">
              <Award className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
              <div className="text-xs text-muted-foreground">
                <strong className="text-foreground">Processo de verificação:</strong> Após o cadastro você completará seu perfil, portfólio e um desafio prático. Nossa curadoria avalia em até 7 dias.
              </div>
            </div>

            <div>
              <div className="flex items-start gap-3">
                <input type="checkbox" id="termos" checked={aceitouTermos}
                  onChange={e => { setAceitouTermos(e.target.checked); setErrors(prev => ({ ...prev, termos: "" })); }}
                  className="mt-0.5 w-4 h-4 rounded border-border accent-primary cursor-pointer" />
                <label htmlFor="termos" className="text-xs text-muted-foreground cursor-pointer leading-relaxed">
                  Li e concordo com os{" "}
                  <Link to="/termos" target="_blank" className="text-primary hover:underline">Termos de Uso</Link>
                  {" "}e a{" "}
                  <Link to="/privacidade" target="_blank" className="text-primary hover:underline">Política de Privacidade</Link>
                  {" "}do Editaí, incluindo as regras para editores.
                </label>
              </div>
              {errors.termos && <p className="text-xs text-destructive mt-1">{errors.termos}</p>}
            </div>

            <Button type="submit" variant="hero" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Criar conta e completar perfil →"}
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

export default CadastroEditor;
