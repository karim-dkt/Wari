# Wari — Suivi de dépenses & recettes

PWA de gestion du quotidien, conçue pour mobile.

## Fonctionnalités

### Dépenses
- Saisie rapide avec brouillon ou enregistrement direct
- Catégories personnalisables
- Historique filtrable par date
- Totaux par catégorie
- Multi-devises

### Prêts
- Suivi des prêts avec statut (en attente / remboursé)

### Recettes
- Ajout de recettes avec tags (Soirée / Midi / Rapide / Rassasiant) et temps de préparation
- Gestion des ingrédients avec quantité, unité et prix estimé
- Coût total calculé dynamiquement
- Instructions de préparation
- Bouton aléatoire "Je cuisine ça ce soir"

### Général
- Fonctionne hors ligne (Service Worker)
- Synchronisation cloud via Supabase

## Stack

- [React](https://react.dev/) + [Vite](https://vitejs.dev/)
- [Supabase](https://supabase.com/) (auth + base de données)
- Déployé sur [GitHub Pages](https://pages.github.com/)

## Installation locale

```bash
git clone https://github.com/karim-dkt/Wari.git
cd Wari
npm install
```

Crée un fichier `.env.local` à la racine :

```
VITE_SUPABASE_URL=<ton-url-supabase>
VITE_SUPABASE_ANON_KEY=<ta-clé-anon>
```

```bash
npm run dev
```

## Base de données

Après avoir créé un projet Supabase, exécute le contenu de `supabase/schema.sql` dans l'éditeur SQL pour créer les tables et les politiques RLS.

## Déploiement

Chaque push sur `main` déclenche automatiquement le build et le déploiement via GitHub Actions.

## Utilisation sur mobile

Ouvre [https://karim-dkt.github.io/Wari/](http://agsv-app.me/Wari/) dans ton navigateur mobile et installe l'app :

- **Android** : Chrome → menu ⋮ → *Ajouter à l'écran d'accueil*
- **iOS** : Safari → partage ⬆ → *Sur l'écran d'accueil*

