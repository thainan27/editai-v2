-- ═══════════════════════════════════════════════════════════════
-- EDITAÍ — Ecossistema Editor Livre + Score Bilateral (CORRIGIDO)
-- ═══════════════════════════════════════════════════════════════

-- ── 1. Campos no editor_profiles ─────────────────────────────
ALTER TABLE public.editor_profiles
  ADD COLUMN IF NOT EXISTS is_verified  BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS verified_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS libre_since  TIMESTAMPTZ NOT NULL DEFAULT now();

UPDATE public.editor_profiles SET is_verified = true WHERE status = 'aprovado';

-- ── 2. Score de cliente nos profiles ─────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS client_score        NUMERIC(3,2) NOT NULL DEFAULT 5.0,
  ADD COLUMN IF NOT EXISTS client_score_count  INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_orders        INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cancellation_count  INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS dispute_count       INT NOT NULL DEFAULT 0;

-- ── 3. Tabela client_reviews ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.client_reviews (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id      UUID NOT NULL UNIQUE REFERENCES public.orders(id) ON DELETE CASCADE,
  editor_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating        INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  brief_clarity INT NOT NULL CHECK (brief_clarity BETWEEN 1 AND 5),
  communication INT NOT NULL CHECK (communication BETWEEN 1 AND 5),
  comment       TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.client_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Editor avalia cliente"        ON public.client_reviews;
DROP POLICY IF EXISTS "Participantes veem avaliação" ON public.client_reviews;

CREATE POLICY "Editor avalia cliente" ON public.client_reviews
  FOR INSERT WITH CHECK (auth.uid() = editor_id);
CREATE POLICY "Participantes veem avaliação" ON public.client_reviews
  FOR SELECT USING (
    auth.uid() = editor_id OR auth.uid() = client_id
  );

-- ── 4. Controle de revisões nos pedidos ──────────────────────
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS revision_count         INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_revisions          INT NOT NULL DEFAULT 2,
  ADD COLUMN IF NOT EXISTS revision_locked        BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS brief_locked_at        TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS scope_change_requested BOOLEAN NOT NULL DEFAULT false;

-- ── 5. Tabela disputes ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.disputes (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id     UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  opened_by    UUID NOT NULL REFERENCES auth.users(id),
  reason       TEXT NOT NULL,
  q1_answer    TEXT, q2_answer TEXT,
  q1_type      TEXT, q2_type   TEXT,
  status       TEXT NOT NULL DEFAULT 'aberta'
               CHECK (status IN ('aberta','em_analise','resolvida_editor','resolvida_cliente','cancelada')),
  admin_note   TEXT,
  resolved_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Participantes veem disputa" ON public.disputes;
DROP POLICY IF EXISTS "Participante abre disputa"  ON public.disputes;
DROP POLICY IF EXISTS "Admin resolve disputa"      ON public.disputes;

CREATE POLICY "Participantes veem disputa" ON public.disputes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id
      AND (o.client_id = auth.uid() OR o.editor_id = auth.uid())
    )
  );
CREATE POLICY "Participante abre disputa" ON public.disputes
  FOR INSERT WITH CHECK (
    auth.uid() = opened_by AND
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id
      AND (o.client_id = auth.uid() OR o.editor_id = auth.uid())
    )
  );
CREATE POLICY "Admin resolve disputa" ON public.disputes
  FOR UPDATE USING (auth.uid() IN (
    SELECT id FROM auth.users WHERE email = 'oliverinvestir@gmail.com'
  ));

-- ── 6. Trigger: score do cliente ─────────────────────────────
CREATE OR REPLACE FUNCTION public.update_client_score()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.profiles
  SET
    client_score = (
      SELECT ROUND(
        (AVG(rating) * 0.5 + AVG(brief_clarity) * 0.3 + AVG(communication) * 0.2)::NUMERIC, 2
      ) FROM public.client_reviews WHERE client_id = NEW.client_id
    ),
    client_score_count = (
      SELECT COUNT(*) FROM public.client_reviews WHERE client_id = NEW.client_id
    )
  WHERE id = NEW.client_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_client_review_created ON public.client_reviews;
CREATE TRIGGER on_client_review_created
  AFTER INSERT ON public.client_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_client_score();

-- ── 7. Trigger: travar brief ao aceitar ──────────────────────
CREATE OR REPLACE FUNCTION public.lock_brief_on_accept()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'aceito' AND OLD.status = 'aguardando_aceite' THEN
    NEW.brief_locked_at = now();
    NEW.max_revisions = CASE NEW.package_name
      WHEN 'basico'  THEN 1
      WHEN 'padrao'  THEN 2
      WHEN 'premium' THEN 3
      ELSE 2
    END;
  END IF;
  IF NEW.status = 'em_revisao' AND OLD.status != 'em_revisao' THEN
    NEW.revision_count = COALESCE(OLD.revision_count, 0) + 1;
    IF NEW.revision_count >= NEW.max_revisions THEN
      NEW.revision_locked = true;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_order_status_change ON public.orders;
CREATE TRIGGER on_order_status_change
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.lock_brief_on_accept();
