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

CREATE POLICY "categories_update" ON public.categories
  FOR UPDATE USING (auth.uid() = user_id);

-- preferences
CREATE POLICY "preferences_select" ON public.preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "preferences_insert" ON public.preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "preferences_update" ON public.preferences
  FOR UPDATE USING (auth.uid() = user_id);

-- ── Table prets ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.prets (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  personne    text        NOT NULL,
  montant     numeric     NOT NULL CHECK (montant > 0),
  date        date        NOT NULL DEFAULT CURRENT_DATE,
  description text,
  statut      text        NOT NULL DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'remboursé')),
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS prets_user_id_idx ON public.prets(user_id);
CREATE INDEX IF NOT EXISTS prets_statut_idx  ON public.prets(user_id, statut);

ALTER TABLE public.prets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "prets_select" ON public.prets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "prets_insert" ON public.prets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "prets_update" ON public.prets
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "prets_delete" ON public.prets
  FOR DELETE USING (auth.uid() = user_id);

-- ── Tables recettes & ingrédients ────────────

CREATE TABLE IF NOT EXISTS public.recettes (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nom               text        NOT NULL,
  tags              text[]      NOT NULL DEFAULT '{}',
  temps_preparation integer,
  instructions      text,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ingredients (
  id         uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  recette_id uuid    NOT NULL REFERENCES public.recettes(id) ON DELETE CASCADE,
  nom        text    NOT NULL,
  quantite   text    NOT NULL DEFAULT '1',
  unite      text    NOT NULL DEFAULT 'pièce',
  prix       numeric
);

CREATE INDEX IF NOT EXISTS recettes_user_id_idx    ON public.recettes(user_id);
CREATE INDEX IF NOT EXISTS ingredients_recette_idx ON public.ingredients(recette_id);

ALTER TABLE public.recettes    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingredients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "recettes_select" ON public.recettes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "recettes_insert" ON public.recettes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "recettes_update" ON public.recettes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "recettes_delete" ON public.recettes
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "ingredients_select" ON public.ingredients
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.recettes WHERE id = recette_id AND user_id = auth.uid())
  );

CREATE POLICY "ingredients_insert" ON public.ingredients
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.recettes WHERE id = recette_id AND user_id = auth.uid())
  );

CREATE POLICY "ingredients_update" ON public.ingredients
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.recettes WHERE id = recette_id AND user_id = auth.uid())
  );

CREATE POLICY "ingredients_delete" ON public.ingredients
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.recettes WHERE id = recette_id AND user_id = auth.uid())
  );

-- ── Table paiements_pret ──────────────────────────

CREATE TABLE IF NOT EXISTS public.paiements_pret (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  pret_id    uuid        NOT NULL REFERENCES public.prets(id) ON DELETE CASCADE,
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  montant    numeric     NOT NULL CHECK (montant > 0),
  date       date        NOT NULL DEFAULT CURRENT_DATE,
  note       text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS paiements_pret_pret_id_idx ON public.paiements_pret(pret_id);
CREATE INDEX IF NOT EXISTS paiements_pret_user_id_idx ON public.paiements_pret(user_id);

ALTER TABLE public.paiements_pret ENABLE ROW LEVEL SECURITY;

CREATE POLICY "paiements_pret_select" ON public.paiements_pret
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "paiements_pret_insert" ON public.paiements_pret
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "paiements_pret_update" ON public.paiements_pret
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "paiements_pret_delete" ON public.paiements_pret
  FOR DELETE USING (auth.uid() = user_id);
