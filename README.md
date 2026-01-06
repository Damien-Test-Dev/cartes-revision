# linkedops-rss-lab
RSS Test


# LinkedOps — RSS Lab (Projet 1)

Objectif : apprendre concrètement la mécanique RSS/Atom avec GitHub.
On publie un flux RSS (`feed.xml`) via GitHub Pages, et on y ajoute des items (posts) pour observer le comportement d’un lecteur RSS.

## Prérequis
- Un compte GitHub
- Un repo public (GitHub Pages sur GitHub Free requiert un repo public) :
  https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages

## 1) Activer GitHub Pages
Dans le repo :
- Settings → Pages
- Source: Deploy from a branch
- Branch: `main`
- Folder: `/ (root)`

GitHub te donnera une URL du type :
`https://<username>.github.io/linkedops-rss-lab/`

## 2) URLs importantes
- Page d’accueil: `https://<username>.github.io/linkedops-rss-lab/`
- Flux RSS: `https://<username>.github.io/linkedops-rss-lab/feed.xml`

## 3) Comment “fonctionne” RSS (pratique)
- `feed.xml` est un fichier XML RSS 2.0.
- Un lecteur RSS lit régulièrement l’URL du flux.
- Il détecte les nouveaux items via leur `guid` + dates (`pubDate`).

Spécification RSS 2.0 (référence) : https://www.rssboard.org/rss-specification

## 4) Ajouter un nouveau post (exercice)
1) Crée une nouvelle page dans `posts/` (copie une existante).
2) Ajoute un nouvel `<item>` dans `feed.xml` :
   - `title` : titre court
   - `link` : lien vers la page post
   - `guid` : identifiant unique (ne jamais le réutiliser)
   - `pubDate` : date RFC 822 (ex : Tue, 06 Jan 2026 08:00:00 +0000)
   - `description` : contenu (souvent HTML dans CDATA)
3) Commit + push
4) Rafraîchis ton lecteur RSS / navigateur sur `feed.xml`

## 5) Vérifier que ton RSS est valide
Tu peux coller l’URL `feed.xml` dans un validateur RSS en ligne (optionnel).
