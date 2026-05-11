-- Adiciona suporte a SOS e Modo Recorrente nos perfis de editor
ALTER TABLE public.editor_profiles
  ADD COLUMN IF NOT EXISTS accepts_sos       BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS accepts_recurrent BOOLEAN NOT NULL DEFAULT false;
