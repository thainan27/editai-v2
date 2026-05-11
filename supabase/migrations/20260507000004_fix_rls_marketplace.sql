-- ═══════════════════════════════════════════════════════
-- FIX: RLS policies para leitura pública do marketplace
-- ═══════════════════════════════════════════════════════

-- ── 1. editor_profiles: leitura pública para editores aprovados ──
DROP POLICY IF EXISTS "Leitura publica editores aprovados" ON public.editor_profiles;
DROP POLICY IF EXISTS "Public read approved editors"       ON public.editor_profiles;
DROP POLICY IF EXISTS "Editor manages own profile"         ON public.editor_profiles;
DROP POLICY IF EXISTS "Editor ve proprio perfil"           ON public.editor_profiles;

-- Qualquer pessoa pode ver editores aprovados
CREATE POLICY "Leitura publica editores aprovados"
  ON public.editor_profiles FOR SELECT
  USING (status = 'aprovado' OR auth.uid() = id);

-- Editor pode inserir/atualizar o próprio perfil
CREATE POLICY "Editor gerencia proprio perfil"
  ON public.editor_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Editor atualiza proprio perfil"
  ON public.editor_profiles FOR UPDATE
  USING (auth.uid() = id);

-- ── 2. profiles: leitura pública do nome e avatar ────────────────
DROP POLICY IF EXISTS "Leitura publica profiles"   ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are visible" ON public.profiles;
DROP POLICY IF EXISTS "Users can read all profiles" ON public.profiles;

-- Qualquer pessoa pode ver nome e avatar (necessário para o marketplace)
CREATE POLICY "Leitura publica profiles"
  ON public.profiles FOR SELECT
  USING (true);

-- Usuário gerencia o próprio perfil
CREATE POLICY "Usuario gerencia proprio perfil"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- ── 3. Garante que accepts_sos existe (caso migration não tenha rodado) ──
ALTER TABLE public.editor_profiles
  ADD COLUMN IF NOT EXISTS accepts_sos       BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS accepts_recurrent BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_verified       BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS verified_at       TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rating_avg        NUMERIC(3,1) NOT NULL DEFAULT 0.0,
  ADD COLUMN IF NOT EXISTS rating_count      INT NOT NULL DEFAULT 0;

-- ── 4. Atualiza editores existentes já aprovados como verificados ──
UPDATE public.editor_profiles
  SET is_verified = true
  WHERE status = 'aprovado' AND is_verified = false;
