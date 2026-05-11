-- Sistema de notificações
CREATE TABLE IF NOT EXISTS public.notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,
  link        TEXT,
  read        BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuario ve suas notificacoes" ON public.notifications;
DROP POLICY IF EXISTS "Sistema cria notificacoes" ON public.notifications;

CREATE POLICY "Usuario ve suas notificacoes" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Usuario marca como lida" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Trigger: notificar editor quando recebe novo pedido
CREATE OR REPLACE FUNCTION public.notify_new_order()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, body, link)
  VALUES (
    NEW.editor_id,
    'new_order',
    'Novo pedido recebido! 🎬',
    'Você tem 48h para aceitar ou recusar.',
    '/chat/' || NEW.id
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_new_order ON public.orders;
CREATE TRIGGER on_new_order
  AFTER INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_order();

-- Trigger: notificar cliente quando editor aceita
CREATE OR REPLACE FUNCTION public.notify_order_accepted()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'aceito' AND OLD.status = 'aguardando_aceite' THEN
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (
      NEW.client_id,
      'order_accepted',
      'Pedido aceito! ✅',
      'O editor aceitou seu projeto. Realize o pagamento para começar.',
      '/pagamento/' || NEW.id
    );
  END IF;

  IF NEW.status = 'em_revisao' AND OLD.status = 'em_andamento' THEN
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (
      NEW.client_id,
      'delivery',
      'Entrega recebida! 🎉',
      'O editor enviou o vídeo para sua aprovação.',
      '/chat/' || NEW.id
    );
  END IF;

  IF NEW.status = 'concluido' AND OLD.status != 'concluido' THEN
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (
      NEW.editor_id,
      'payment_released',
      'Pagamento liberado! 💰',
      'O cliente aprovou a entrega. Seu pagamento foi liberado.',
      '/dashboard/editor'
    );
  END IF;

  IF NEW.status = 'recusado' AND OLD.status = 'aguardando_aceite' THEN
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (
      NEW.client_id,
      'order_declined',
      'Pedido recusado',
      'O editor não pôde aceitar seu projeto. Escolha outro editor.',
      '/editores'
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_order_status_change_notify ON public.orders;
CREATE TRIGGER on_order_status_change_notify
  AFTER UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.notify_order_accepted();
