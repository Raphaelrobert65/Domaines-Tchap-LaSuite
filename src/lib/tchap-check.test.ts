import { describe, expect, it, vi } from "vitest";
import {
  CheckError,
  classifyInstance,
  fetchInstanceFromDomain,
  isValidDomain,
  normalizeDomain,
} from "./tchap-check";

describe("normalisation et validation", () => {
  it("normalise casse et espaces extérieurs, conserve les sous-domaines", () => {
    expect(normalizeDomain("  Beta.GOUV.fr ")).toBe("beta.gouv.fr");
    expect(normalizeDomain("www.Sub.Beta.gouv.fr")).toBe("www.sub.beta.gouv.fr");
    expect(isValidDomain("www.sub.beta.gouv.fr")).toBe(true);
    expect(isValidDomain("xn--bcher-kva.fr")).toBe(true);
  });
  it.each([
    "",
    "beta",
    "jean@beta.gouv.fr",
    "https://beta.gouv.fr",
    "beta.gouv.fr/chemin",
    "beta.gouv.fr:443",
    "*.gouv.fr",
    "beta gouv.fr",
    "beta..gouv.fr",
    "-beta.gouv.fr",
    "beta-.gouv.fr",
    "a".repeat(64) + ".fr",
    ("a".repeat(60) + ".").repeat(5) + "fr",
  ])("refuse %s", (v) => expect(isValidDomain(normalizeDomain(v))).toBe(false));
});

describe("classification de l'instance", () => {
  it("agent.dinum → ouvert", () => expect(classifyInstance("agent.dinum.tchap.gouv.fr")).toBe("open"));
  it("agent.externe → non ouvert (externe testé avant agent)", () =>
    expect(classifyInstance("agent.externe.tchap.gouv.fr")).toBe("closed"));
  it.each([undefined, null, "", 42, "matrix.org", "agent.dinum.tchap.gouv.fr.evil.com",
    "agent.dinumtchap.gouv.fr", "faketchap.gouv.fr", "dinum.tchap.gouv.fr", "agent.a.b.tchap.gouv.fr"])(
    "%s → indéterminé, jamais ouvert",
    (v) => expect(classifyInstance(v)).toBe("unknown"),
  );
});

describe("appel réseau", () => {
  const ok = (body: unknown) => vi.fn().mockResolvedValue(new Response(JSON.stringify(body)));
  it("construit la requête sans cookie et medium vide", async () => {
    const f = ok({ hs: "agent.dinum.tchap.gouv.fr" });
    await expect(fetchInstanceFromDomain("beta.gouv.fr", undefined, f)).resolves.toBe("agent.dinum.tchap.gouv.fr");
    expect(f.mock.calls[0]![0]).toContain("?medium=&address=test%40beta.gouv.fr");
    expect((f.mock.calls[0]![1] as RequestInit).credentials).toBe("omit");
  });
  it.each([429, 500])("HTTP %i → erreur", async (s) => {
    const f = vi.fn().mockResolvedValue(new Response("x", { status: s }));
    await expect(fetchInstanceFromDomain("beta.gouv.fr", undefined, f)).rejects.toBeInstanceOf(CheckError);
  });
  it("JSON invalide → erreur", async () => {
    const f = vi.fn().mockResolvedValue(new Response("pas du json"));
    await expect(fetchInstanceFromDomain("beta.gouv.fr", undefined, f)).rejects.toMatchObject({ kind: "invalid" });
  });
  it("réseau coupé → erreur", async () => {
    const f = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));
    await expect(fetchInstanceFromDomain("beta.gouv.fr", undefined, f)).rejects.toMatchObject({ kind: "network" });
  });
  it("annulation → aborted", async () => {
    const ctrl = new AbortController();
    const f = vi.fn((_u: string, init: RequestInit) => new Promise<Response>((_, rej) =>
      init.signal!.addEventListener("abort", () => rej(new DOMException("a", "AbortError")))));
    const p = fetchInstanceFromDomain("beta.gouv.fr", ctrl.signal, f as unknown as typeof fetch);
    ctrl.abort();
    await expect(p).rejects.toMatchObject({ kind: "aborted" });
  });
});
