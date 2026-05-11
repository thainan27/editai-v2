-- ══════════════════════════════════════════════
-- EDITAÍ — Avaliação bilateral + melhorias
-- ══════════════════════════════════════════════

-- ── Avaliações do editor pelo cliente ─────────
CREATE TABLE IF NOT EXISTS public.editor_reviews (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        UUID NOT NULL UNIQUE REFERENCES public.orders(id) ON DELETE CASCADE,
  client_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  editor_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating          INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  deadline_score  INT NOT NULL CHECK (deadline_score BETWEEN 1 AND 5),
  communication   INT NOT NULL CHECK (communication BETWEEN 1 AND 5),
  comment         TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.editor_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cliente avalia editor"
  ON public.editor_reviews FOR INSERT
  WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Avaliação visível publicamente"
  ON public.editor_reviews FOR SELECT
  USING (true);

-- ── Trigger: atualizar rating_avg do editor ────
CREATE OR REPLACE FUNCTION public.update_editor_rating()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.editor_profiles
  SET
    rating_avg = (
      SELECT ROUND(
        (AVG(rating) * 0.5 + AVG(deadline_score) * 0.3 + AVG(communication) * 0.2)::NUMERIC,
        1
      )
      FROM public.editor_reviews WHERE editor_id = NEW.editor_id
    ),
    rating_count = (
      SELECT COUNT(*) FROM public.editor_reviews WHERE editor_id = NEW.editor_id
    )
  WHERE id = NEW.editor_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_editor_review_created
  AFTER INSERT ON public.editor_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_editor_rating();

-- ── Adicionar updated_at nos pedidos (para calcular atrasos) ──
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
