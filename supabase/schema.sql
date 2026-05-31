-- ============================================================
-- Wari — Schéma Supabase
-- À exécuter dans l'éditeur SQL de Supabase
-- ============================================================

-- ── Tables ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.depenses (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  montant     numeric     NOT NULL CHECK (montant > 0),
  description text,
  categorie   text        NOT NULL DEFAULT 'Autre',
  date        date        NOT NULL DEFAULT CURRENT_DATE,
  heure       time        NOT NULL DEFAULT CURRENT_TIME,
  devise      text        NOT NULL DEFAULT 'MAD',
  brouillon   boolean     NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.categories (
  id      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nom     text NOT NULL,
  UNIQUE (user_id, nom)
);

CREATE TABLE IF NOT EXISTS public.preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  devise  text NOT NULL DEFAULT 'MAD'
);

-- ── Index ────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS depenses_user_id_idx   ON public.depenses(user_id);
CREATE INDEX IF NOT EXISTS depenses_date_idx       ON public.depenses(date DESC);
CREATE INDEX IF NOT EXISTS depenses_brouillon_idx  ON public.depenses(user_id, brouillon);
CREATE INDEX IF NOT EXISTS categories_user_id_idx  ON public.categories(user_id);

-- ── RLS ──────────────────────────────────────────────────────

ALTER TABLE public.depenses    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.preferences ENABLE ROW LEVEL SECURITY;

-- depenses
CREATE POLICY "depenses_select" ON public.depenses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "depenses_insert" ON public.depenses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "depenses_update" ON public.depenses
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "depenses_delete" ON public.depenses
  FOR DELETE USING (auth.uid() = user_id);

-- categories
CREATE POLICY "categories_select" ON public.categories
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "categories_insert" ON public.categories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "categories_delete" ON public.categories
  FOR DELETE USING (auth.uid() = user_id);

-- preferences
CREATE POLICY "preferences_select" ON public.preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "preferences_insert" ON public.preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "preferences_update" ON public.preferences
  FOR UPDATE USING (auth.uid() = user_id);
