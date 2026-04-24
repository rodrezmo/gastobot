-- phone_links: vincula número de WhatsApp con usuario GastoBot
CREATE TABLE public.phone_links (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  phone       TEXT NOT NULL UNIQUE,
  verified_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_phone_links_user_id ON public.phone_links(user_id);
CREATE INDEX idx_phone_links_phone   ON public.phone_links(phone);

ALTER TABLE public.phone_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own phone links"
  ON public.phone_links FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own phone links"
  ON public.phone_links FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own phone links"
  ON public.phone_links FOR DELETE
  USING (user_id = auth.uid());

-- bot_sessions: estado de conversación activa por número de teléfono
-- Sin RLS: la Edge Function accede con service_role key
CREATE TABLE public.bot_sessions (
  phone      TEXT PRIMARY KEY,
  state      TEXT NOT NULL DEFAULT 'idle',
  context    JSONB,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- linking_codes: códigos temporales para vincular número desde la web app
CREATE TABLE public.linking_codes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  code       TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '10 minutes'),
  used_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_linking_codes_user_id ON public.linking_codes(user_id);
CREATE INDEX idx_linking_codes_code    ON public.linking_codes(code);

ALTER TABLE public.linking_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own linking codes"
  ON public.linking_codes FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own linking codes"
  ON public.linking_codes FOR INSERT
  WITH CHECK (user_id = auth.uid());
