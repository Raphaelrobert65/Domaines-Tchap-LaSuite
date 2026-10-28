// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DomainChecker } from "@/components/DomainChecker";

const FORM_URL = "https://demarche.numerique.gouv.fr/commencer/utiliser-tchap";

function mockHs(hs: string) {
  const impl = vi.fn(async () => new Response(JSON.stringify({ hs })));
  vi.stubGlobal("fetch", impl);
  return impl;
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

async function check(domain: string) {
  const user = userEvent.setup();
  render(<DomainChecker />);
  await user.type(screen.getByLabelText("Domaine professionnel"), domain);
  await user.click(screen.getByRole("button", { name: "Vérifier mon domaine" }));
  return user;
}

describe("domaine non ouvert", () => {
  it("affiche le message d'absence d'administration avec le lien du formulaire", async () => {
    mockHs("agent.externe.tchap.gouv.fr");
    await check("example.invalid");

    expect(await screen.findByText("Votre administration n’est pas encore présente sur Tchap !")).toBeInTheDocument();
    expect(
      screen.getByText(
        "L’équipe Tchap ouvrira l’accès à votre administration si toutes les conditions sont remplies (délai : environ 15 jours).",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Les agents de votre administration pourront ensuite s’inscrire et communiquer sur Tchap."),
    ).toBeInTheDocument();

    const link = screen.getByRole("link", { name: /Demander l’accès à Tchap pour votre administration/ });
    expect(link).toHaveAttribute("href", FORM_URL);

    // Le domaine saisi est bien celui transmis à l'API (sous-domaine inclus).
    await waitFor(() => expect(vi.mocked(fetch).mock.calls.length).toBeGreaterThan(0));
    expect(String(vi.mocked(fetch).mock.calls[0]![0])).toContain("address=test%40example.invalid");
  });

  it("ne propose pas le formulaire quand le domaine est ouvert", async () => {
    mockHs("agent.dinum.tchap.gouv.fr");
    await check("beta.gouv.fr");

    await screen.findByText("Ce domaine est ouvert sur Tchap.");
    expect(screen.queryByText("Votre administration n’est pas encore présente sur Tchap !")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Demander l’accès à Tchap/ })).not.toBeInTheDocument();
  });
});
