# Wari — Suivi de dépenses

PWA de suivi de dépenses personnelles, conçue pour mobile.

## Fonctionnalités

- Saisie rapide avec brouillon ou enregistrement direct
- Catégories personnalisables
- Historique filtrable par date
- Totaux par catégorie
- Multi-devises
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

## Déploiement

Chaque push sur `master` déclenche automatiquement le build et le déploiement via GitHub Actions.

## Utilisation sur mobile

Ouvre [https://karim-dkt.github.io/Wari/](https://karim-dkt.github.io/Wari/) dans ton navigateur mobile et installe l'app :

- **Android** : Chrome → menu ⋮ → *Ajouter à l'écran d'accueil*
- **iOS** : Safari → partage ⬆ → *Sur l'écran d'accueil*

