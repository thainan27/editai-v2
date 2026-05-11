-- ========== MESSAGES (Chat interno) ==========
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  file_url TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Apenas participantes do pedido veem as mensagens
CREATE POLICY "Participantes veem mensagens" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id
      AND (o.client_id = auth.uid() OR o.editor_id = auth.uid())
    )
    OR public.has_role(auth.uid(), 'admin')
  );

-- Apenas participantes enviam mensagens
CREATE POLICY "Participantes enviam mensagens" ON public.messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id
      AND (o.client_id = auth.uid() OR o.editor_id = auth.uid())
    )
  );

-- Remetente pode marcar como lida
CREATE POLICY "Destinatario marca como lida" ON public.messages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id
      AND (o.client_id = auth.uid() OR o.editor_id = auth.uid())
    )
  );

-- Habilitar Realtime para mensagens
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
