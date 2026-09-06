# Format de livraison fixe des articles (mémorisé pour tous les prochains articles)

Ce format s'applique à **tous les articles restants du Plan Éditorial**, en complément du Prompt Maître V1.4 (`prompt_maitre_v1.4.md`), tant que Juliana ne demande pas de changement. Chaque article est affiché dans le chat en 3 blocs distincts, jamais fusionnés.

## 1. [TEXTE ARTICLE - GUTENBERG]

- Le bloc markdown commence **obligatoirement** par le Titre H1 (`# Titre de l'article`) tout en haut, avant le hook narratif.
- Corps en Markdown propre : `##` pour les H2, `###` pour les H3 (FAQ), paragraphes pleins.
- Format Editorial (toutes catégories sauf ShopTheLook) : prose pleine, jamais de listes à puces, même pour un titre de type "10 éléments" (énumération narrative dans le texte).
- Notes image au format : `[IMAGE X: Description — Alt Text: ...]`, une par emplacement défini au plan (4 pour un Satellite, 6-8 pour un Pillar, 1 par produit pour un Curated Shopping Edit).
- Lien interne obligatoire vers le Pillar du cluster (Satellite → Pillar), plus les liens internes additionnels prévus au plan, au format texte `[Internal link: Titre de la cible]` tant qu'aucun article n'est publié sur WordPress (exception V1.4, section 11).
- Mention de divulgation d'affiliation en fin de corps si des liens produits sont insérés.

## 2. [METADATA RANKMATH]

Dans cet ordre :
- **Focus Keyword**
- **SEO Title** (≤ 60 caractères, Title Case, contient le Focus Keyword tel quel)
- **Slug** (court, optimisé, minuscules, tirets)
- **Meta Description** (140–155 caractères, contient le Focus Keyword tel quel)
- Excerpt, Tags, Catégorie, Rôle dans le cluster, Statut (Draft) — conservés du Prompt Maître V1.4, section 14

## 3. [SCHEMA JSON-LD]

- Bloc de code séparé, balisé ```json
- Article + FAQPage par défaut (Editorial) ; + Product pour ShopTheLook
- Texte des réponses FAQ identique à celui publié dans l'article

## Rappel — le reste du Prompt Maître V1.4 s'applique sans changement

Typographie (Title Case, pas d'em-dash en milieu de phrase, aucune mention d'IA), structure narrative (frustration → solution → réassurance → confiance), quotas d'affiliation (2-3 Satellite / 4-5 Pillar / 5-8 ShopTheLook), longueur selon le rôle dans le cluster, checklist qualité section 16, workflow 100% manuel (aucune tentative d'intégration WordPress automatique — Juliana copie-colle elle-même dans Gutenberg).
