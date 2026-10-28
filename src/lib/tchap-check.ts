/**
 * Logique de vérification d'ouverture d'un domaine sur Tchap.
 * Fonctions pures (validation, classification) + appel réseau isolé.
 */
import { TCHAP_CONFIG } from "@/config/site";

export type OpeningStatus = "open" | "closed" | "unknown";

const LABEL_RE = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
const TLD_RE = /^(?:[a-z]{2,63}|xn--[a-z0-9-]{1,59})$/;

export function normalizeDomain(raw: string): string {
  return raw.trim().toLowerCase();
}

/** Valide un nom de domaine ASCII (punycode accepté). Pas de conversion IDN. */
export function isValidDomain(domain: string): boolean {
  if (!domain || domain.length > 253) return false;
  if (!/^[a-z0-9.-]+$/.test(domain)) return false; // exclut espaces, @, /, :, *, etc.
  const labels = domain.split(".");
  if (labels.length < 2) return false;
  for (const label of labels) {
    if (!LABEL_RE.test(label)) return false; // vide (..), tirets en bord, > 63
    if (label.startsWith("xn--") && label.length < 5) return false;
    // Tirets en positions 3-4 réservés au punycode.
    if (label.slice(2, 4) === "--" && !label.startsWith("xn--")) return false;
  }
  return TLD_RE.test(labels[labels.length - 1] ?? "");
}

/**
 * Classification durcie de l'instance renvoyée (champ `hs`).
 * - doit être un nom d'hôte valide sous .tchap.gouv.fr (frontière de label)
 * - un label exactement "externe" => closed (testé avant agent)
 * - agent.*.tchap.gouv.fr => open
 * - sinon unknown
 */
export function classifyInstance(hs: unknown): OpeningStatus {
  if (typeof hs !== "string") return "unknown";
  const host = hs.trim().toLowerCase();
  if (!isValidDomain(host)) return "unknown";
  const suffix = "." + TCHAP_CONFIG.instanceSuffix;
  if (!host.endsWith(suffix)) return "unknown";
  const labels = host.slice(0, -suffix.length).split(".");
  if (labels.includes("externe")) return "closed";
  if (labels.length === 2 && labels[0] === "agent") return "open";
  return "unknown";
}

export class CheckError extends Error {
  constructor(public kind: "http" | "network" | "timeout" | "invalid" | "aborted", msg: string) {
    super(msg);
  }
}

export async function fetchInstanceFromDomain(
  domain: string,
  signal?: AbortSignal,
  fetchImpl: typeof fetch = fetch,
): Promise<unknown> {
  const syntheticEmail = `test@${domain}`;
  // `medium=` volontairement vide : contrat repris de l'outil interne.
  const url = `${TCHAP_CONFIG.apiBaseUrl}?medium=&address=${encodeURIComponent(syntheticEmail)}`;
  const timeout = new AbortController();
  const timer = setTimeout(() => timeout.abort(), TCHAP_CONFIG.timeoutMs);
  const onAbort = () => timeout.abort();
  signal?.addEventListener("abort", onAbort);
  try {
    let response: Response;
    try {
      response = await fetchImpl(url, { credentials: "omit", signal: timeout.signal });
    } catch {
      if (signal?.aborted) throw new CheckError("aborted", "aborted");
      if (timeout.signal.aborted) throw new CheckError("timeout", "timeout");
      throw new CheckError("network", "network");
    }
    if (!response.ok) throw new CheckError("http", `HTTP ${response.status}`);
    let data: unknown;
    try {
      data = await response.json();
    } catch {
      throw new CheckError("invalid", "JSON invalide");
    }
    if (!data || typeof data !== "object") throw new CheckError("invalid", "Réponse invalide");
    return (data as { hs?: unknown }).hs;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", onAbort);
  }
}
