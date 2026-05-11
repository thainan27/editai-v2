
-- ========== ENUMS ==========
CREATE TYPE public.app_role AS ENUM ('admin', 'cliente', 'editor');
CREATE TYPE public.editor_level AS ENUM ('basico', 'intermediario', 'avancado');
CREATE TYPE public.editor_status AS ENUM ('pendente', 'aprovado', 'rejeitado');
CREATE TYPE public.order_status AS ENUM ('aguardando_aceite', 'aceito', 'em_andamento', 'em_revisao', 'concluido', 'cancelado', 'recusado');
CREATE TYPE public.payment_status AS ENUM ('pendente', 'pago', 'liberado', 'reembolsado');

-- ========== PROFILES ==========
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  account_type TEXT NOT NULL DEFAULT 'cliente',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Perfis são públicos para leitura" ON public.profiles
  FOR SELECT USING (true);
CREATE POLICY "Usuário edita o próprio perfil" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Usuário insere o próprio perfil" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ========== USER ROLES (segurança) ==========
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Usuário vê seus próprios roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Apenas admin gerencia roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- ========== EDITOR PROFILES ==========
CREATE TABLE public.editor_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  bio TEXT,
  specialty TEXT NOT NULL,
  level editor_level NOT NULL DEFAULT 'basico',
  base_price NUMERIC(10,2) NOT NULL DEFAULT 50,
  portfolio_links JSONB NOT NULL DEFAULT '[]'::jsonb,
  status editor_status NOT NULL DEFAULT 'pendente',
  rating_avg NUMERIC(3,2) NOT NULL DEFAULT 0,
  rating_count INT NOT NULL DEFAULT 0,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.editor_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Editores aprovados são públicos" ON public.editor_profiles
  FOR SELECT USING (status = 'aprovado' OR auth.uid() = id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Editor edita seu próprio perfil" ON public.editor_profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Editor cria seu próprio perfil" ON public.editor_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Admin gerencia editores" ON public.editor_profiles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- ========== ORDERS ==========
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  editor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  video_type TEXT NOT NULL,
  duration_minutes INT,
  deadline DATE,
  references_text TEXT,
  briefing TEXT NOT NULL,
  package_name TEXT NOT NULL,
  total_amount NUMERIC(10,2) NOT NULL,
  platform_fee NUMERIC(10,2) NOT NULL,
  editor_amount NUMERIC(10,2) NOT NULL,
  status order_status NOT NULL DEFAULT 'aguardando_aceite',
  delivery_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cliente vê seus pedidos" ON public.orders
  FOR SELECT USING (auth.uid() = client_id OR auth.uid() = editor_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Cliente cria pedidos" ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = client_id);
CREATE POLICY "Cliente e editor atualizam pedidos" ON public.orders
  FOR UPDATE USING (auth.uid() = client_id OR auth.uid() = editor_id OR public.has_role(auth.uid(), 'admin'));

-- ========== PAYMENTS ==========
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  platform_fee NUMERIC(10,2) NOT NULL,
  editor_amount NUMERIC(10,2) NOT NULL,
  status payment_status NOT NULL DEFAULT 'pendente',
  mp_payment_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cliente e editor veem o pagamento" ON public.payments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND (o.client_id = auth.uid() OR o.editor_id = auth.uid()))
    OR public.has_role(auth.uid(), 'admin')
  );
CREATE POLICY "Admin gerencia pagamentos" ON public.payments
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- ========== REVIEWS ==========
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL UNIQUE REFERENCES public.orders(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  editor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Avaliações são públicas" ON public.reviews
  FOR SELECT USING (true);
CREATE POLICY "Cliente cria sua avaliação" ON public.reviews
  FOR INSERT WITH CHECK (auth.uid() = client_id);

-- ========== TRIGGER: criar perfil automaticamente ==========
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, account_type)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'phone',
    COALESCE(NEW.raw_user_meta_data->>'account_type', 'cliente')
  );

  -- Atribuir role baseado no tipo de conta
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'account_type', 'cliente')::app_role
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ========== TRIGGER: atualizar média de avaliações ==========
CREATE OR REPLACE FUNCTION public.update_editor_rating()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.editor_profiles
  SET rating_avg = (SELECT AVG(rating)::NUMERIC(3,2) FROM public.reviews WHERE editor_id = NEW.editor_id),
      rating_count = (SELECT COUNT(*) FROM public.reviews WHERE editor_id = NEW.editor_id),
      updated_at = now()
  WHERE id = NEW.editor_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_review_created
AFTER INSERT ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.update_editor_rating();

-- ========== TRIGGER: updated_at ==========
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER touch_profiles BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER touch_editors BEFORE UPDATE ON public.editor_profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER touch_orders BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER touch_payments BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
