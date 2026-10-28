# Tchap — Vérification de l’ouverture d’un domaine

Page publique unique (français) : la personne saisit son domaine professionnel et obtient son statut d’ouverture sur Tchap.

## Pile réelle

- **TanStack Start v1** (React 19, Vite) — imposé par Lovable. Ce n’est **pas** un fichier HTML autonome : le build produit un serveur (SSR) via Nitro.
- Aucune base de données, aucune authentification, aucun service Lovable à l’exécution, aucun traqueur.
- Icônes : `lucide-react`. Police : Marianne (fichiers DSFR 1.13.0 via jsDelivr, CDN tiers).
- Composants La Suite (`@gouvfr-lasuite/ui-components`) **non installés** : la page n’utilise que champ, bouton et encart ; les tokens La Suite × Marianne sont reproduits dans `src/styles.css`. À réévaluer si l’équipe exige les composants officiels.

## Fichiers

| Fichier | Rôle |
|---|---|
| `src/lib/tchap-check.ts` | Validation, classification, appel API (logique pure) |
| `src/lib/tchap-check.test.ts` | Tests (réponses HTTP simulées, hors parcours public) |
| `src/components/DomainChecker.tsx` | Formulaire et états |
| `src/routes/index.tsx` | Page, en-tête, pied de page |
| `src/config/site.ts` | Configuration centralisée (API, timeout, liens) |
| `src/styles.css` | Tokens et styles |

## Lancement local / build / tests

```sh
bun install
bun run dev      # http://localhost:8080
bun run test     # vitest
bun run build
```

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


## Contenus manquants avant publication

Dans `src/config/site.ts`, ces valeurs sont **non renseignées** (liens masqués) : accès Tchap, aide, mentions légales, déclaration d’accessibilité, données personnelles, plan du site. Le lien de demande d’accès est en revanche renseigné : `https://demarche.numerique.gouv.fr/commencer/utiliser-tchap`.
Marque : les logos Tchap, La Suite et Gouvernement / DINUM sont intégrés (fichiers fournis par l’équipe, servis depuis `src/assets/*.asset.json`). Le pied de page affiche encore le bloc-marque en texte seul : à remplacer par le fichier officiel si l’équipe le souhaite.
Aucune mention de conformité RGAA n’est affichée (pas d’audit).

## Licence

Le code original de ce projet est distribué sous licence [MIT](LICENSE) — `Copyright (c) 2026 Raphael Robert`.

Les dépendances npm, la police Marianne, ainsi que les logos et éléments de marque Tchap, La Suite et République Française conservent leurs licences et conditions d'utilisation respectives ; cette licence MIT ne les couvre pas.

## GitHub

Dans Lovable : *Connectors → GitHub → Connect project*, choisir le compte/organisation ; Lovable crée le dépôt et synchronise la branche par défaut. Aucun dépôt n’est connecté à ce jour.
Branches conseillées : `main` = travail (synchronisée avec Lovable), `production` = mise en production (fusion manuelle).

## Netlify

- Site → *Import from Git* → dépôt ci-dessus, **branche de production : `production`** (les modifications Lovable sur `main` ne déploient alors qu’en preview).
- `netlify.toml` fournit la commande de build et `NITRO_PRESET=netlify`. **Non testé sur Netlify** : vérifier le premier build et le dossier publié produit par le preset (fonctions + statiques). Aucun secret requis.
- Domaine existant : *Domain management → Add a domain*, puis suivre les enregistrements DNS indiqués par Netlify.
