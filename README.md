# Tchap — Vérification de l’ouverture d’un domaine

Page publique statique (HTML, CSS, JavaScript natifs) : l’usager saisit le domaine de son adresse professionnelle et obtient son statut d’ouverture sur Tchap. Aucun serveur applicatif, aucun build, aucune dépendance à installer.

## Version publiée (racine du dépôt)

| Fichier | Rôle |
|---|---|
| `index.html` | Page (textes, structure, accessibilité, CSP) |
| `styles.css` | Charte La Suite × Marianne, mode sombre, mobile |
| `app.js` | Validation, appel API Tchap, classification, affichage |
| `assets/` | Logos (logotype Tchap transparente, LaSuite, bloc-marque Gouvernement), favicon dérivé du logotype Tchap, polices Marianne (DSFR 1.13.0) servies localement |
| `.nojekyll` | Désactive Jekyll sur GitHub Pages |
| `netlify.toml` | Publication Netlify de la racine, sans build |

Tous les chemins sont relatifs : les mêmes fichiers fonctionnent à la racine d’un domaine et sous `/Domaines-Tchap-LaSuite/`.

Test local : `python3 -m http.server 8000` à la racine, puis http://localhost:8000.

## Contrat API

`GET https://matrix.agent.dinum.tchap.gouv.fr/_matrix/identity/api/v1/info?medium=&address=test%40DOMAINE`
— `medium` volontairement vide (contrat de l’outil interne), `credentials: "omit"`, timeout 10 s, annulation des requêtes obsolètes.
Observé le 28/10/2026 : HTTP 200, `Access-Control-Allow-Origin: *`. À revérifier depuis l’origine Netlify réelle. Si un blocage CORS apparaît, envisager un relais maîtrisé sur l’infrastructure cible (non ajouté).

## Règle de classification (durcissement de l’outil interne)

1. `hs` doit être une chaîne, nom d’hôte valide, normalisé (casse, espaces).
2. Il doit se terminer par `.tchap.gouv.fr` (frontière de label).
3. Un label exactement `externe` → **non ouvert** (testé en premier : `agent.externe.tchap.gouv.fr`).
4. Forme exacte `agent.<x>.tchap.gouv.fr` → **ouvert**.
5. Tout le reste → **indéterminé**. Erreur réseau / timeout / 429 / 5xx / JSON invalide → **erreur**, jamais « non ouvert ».

Limite : l’outil interne affichait « ouvert » pour toute chaîne sans « externe » ; ce n’est plus le cas. **À faire confirmer par l’équipe Tchap avant mise en production.**

## Réponse « domaine non ouvert » (domaine et sous-domaines)

L’API renvoie la même instance pour un domaine et pour ses sous-domaines : un sous-domaine non ouvert est donc classé comme le domaine parent. Dans ce cas, le message de l’équipe Tchap est affiché tel quel :

> Votre administration n’est pas encore présente sur Tchap !
> [Demander l’accès à Tchap pour votre administration](https://demarche.numerique.gouv.fr/commencer/utiliser-tchap)
> L’équipe Tchap ouvrira l’accès à votre administration si toutes les conditions sont remplies (délai : environ 15 jours).
> Les agents de votre administration pourront ensuite s’inscrire et communiquer sur Tchap.



## Publication

### GitHub Pages
1. Dépôt → *Settings* → *Pages*.
2. *Source* : « Deploy from a branch », branche `main`, dossier `/ (root)`.
3. Le site est servi sous `https://<compte>.github.io/Domaines-Tchap-LaSuite/`.

### Netlify
1. *Add new site* → *Import from Git* → choisir le dépôt.
2. Laisser la commande de build vide, dossier publié `.` (déjà défini dans `netlify.toml`).
3. Rattacher ensuite le domaine définitif.

## Fichiers conservés pour la prévisualisation Lovable

L’éditeur Lovable impose une application TanStack Start pour son aperçu. Les fichiers `src/`, `public/`, `package.json`, `bun.lock`, `vite.config.ts`, `vitest.config.ts`, `tsconfig.json`, `eslint.config.js`, `components.json`, `bunfig.toml` ne servent **qu’à cet aperçu** et aux tests unitaires de la logique (`src/lib/tchap-check.test.ts`). Ils ne sont ni nécessaires ni utilisés par le site publié. Si le projet quitte Lovable, ils peuvent être supprimés. Toute modification de la logique doit être reportée dans `app.js` (version de référence).

## Vérifications

Exécutées :
- Serveur HTTP statique à la racine et sous `/Domaines-Tchap-LaSuite/` : styles, script, logos et police Marianne chargés, aucune erreur console ni ressource en erreur.
- Formulaire : `https://x.fr` → message de validation ; `Beta.GOUV.fr` → « ouvert » (appel réel à l’API) ; `example.invalid` → message « non ouvert » avec lien vers le formulaire.
- En-tête : le logo Tchap renvoie vers <https://lasuite.numerique.gouv.fr/produits/tchap>, le logo LaSuite vers <https://lasuite.numerique.gouv.fr/> (clic vérifié, les deux pages répondent en 200).

Restantes :
- Appel API depuis le domaine GitHub Pages réel (CORS `*` observé en direct, à confirmer une fois déployé).
- Déploiement Netlify et domaine définitif.
- Liens légaux (mentions légales, accessibilité, données personnelles) : non fournis, donc non affichés.

## Licence

Le code original de ce projet est distribué sous licence [MIT](LICENSE) — `Copyright (c) 2026 Raphael Robert`.

Les dépendances npm, la police Marianne, ainsi que les logos et éléments de marque Tchap, La Suite et République Française conservent leurs licences et conditions d'utilisation respectives ; cette licence MIT ne les couvre pas.

