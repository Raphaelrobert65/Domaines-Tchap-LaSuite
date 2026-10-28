/**
 * Configuration publique centralisée.
 * `null` = valeur NON RENSEIGNÉE : le lien correspondant n'est pas affiché.
 */
export const TCHAP_CONFIG = {
  apiBaseUrl: "https://matrix.agent.dinum.tchap.gouv.fr/_matrix/identity/api/v1/info",
  instanceSuffix: "tchap.gouv.fr",
  timeoutMs: 10_000,
} as const;

export const LINKS: Record<
  "tchap" | "lasuite" | "help" | "requestOpening" | "legal" | "accessibility" | "privacy" | "sitemap",
  string | null
> = {
  tchap: "https://lasuite.numerique.gouv.fr/produits/tchap", // page produit Tchap (LaSuite) — lien du logo Tchap
  lasuite: "https://lasuite.numerique.gouv.fr/", // site LaSuite — lien du logo LaSuite
  help: null,
  requestOpening: "https://demarche.numerique.gouv.fr/commencer/utiliser-tchap", // demande d'accès / ouverture d'une administration
  legal: null, // mentions légales
  accessibility: null, // déclaration d'accessibilité
  privacy: null, // données personnelles
  sitemap: null,
};

/** Liens institutionnels publics connus (sites gouvernementaux officiels). */
export const INSTITUTIONAL_LINKS = [
  { label: "info.gouv.fr", href: "https://www.info.gouv.fr" },
  { label: "service-public.fr", href: "https://www.service-public.fr" },
  { label: "legifrance.gouv.fr", href: "https://www.legifrance.gouv.fr" },
  { label: "data.gouv.fr", href: "https://www.data.gouv.fr" },
];
