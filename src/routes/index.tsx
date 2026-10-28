import { createFileRoute } from "@tanstack/react-router";
import { DomainChecker } from "@/components/DomainChecker";
import { INSTITUTIONAL_LINKS, LINKS } from "@/config/site";
import tchapLogo from "@/assets/logo-tchap.png.asset.json";
import lasuiteLogo from "@/assets/logo-lasuite.png.asset.json";
import gouvLogo from "@/assets/logo-gouvernement.png.asset.json";

const TITLE = "Votre domaine est-il ouvert sur Tchap ? – Tchap";
const DESC = "Renseignez le domaine de votre adresse professionnelle pour vérifier son ouverture sur Tchap.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

const legal = [
  { label: "Plan du site", href: LINKS.sitemap },
  { label: "Accessibilité", href: LINKS.accessibility },
  { label: "Mentions légales", href: LINKS.legal },
  { label: "Données personnelles", href: LINKS.privacy },
].filter((l): l is { label: string; href: string } => !!l.href);

function Index() {
  return (
    <>
      <a className="skip-link" href="#contenu">Aller au contenu</a>
      <header className="site-header">
        <div className="container header-inner">
          <div className="service-name">
            <img className="logo-plate" src={tchapLogo.url} alt="" width={40} height={40} />
            <div>
              <strong>Tchap</strong>
              <span>La messagerie instantanée du secteur public</span>
            </div>
          </div>
          <img className="logo-plate logo-lasuite" src={lasuiteLogo.url} alt="LaSuite" width={102} height={40} />
        </div>
      </header>

      <main id="contenu" className="main" tabIndex={-1}>
        <div className="panel">
          <h1>Votre domaine est-il ouvert sur Tchap ?</h1>
          <p className="lead">{DESC}</p>
          <noscript>
            <p className="noscript">
              Cette vérification nécessite JavaScript. Activez-le dans votre navigateur pour utiliser le service.
            </p>
          </noscript>
          <DomainChecker />
        </div>
      </main>

      <footer className="site-footer">
        <div className="container">
          <img
            className="bloc-marque-img"
            src={gouvLogo.url}
            alt="Gouvernement – Direction interministérielle du numérique"
            width={1200}
            height={420}
          />
          <ul className="footer-links">
            {INSTITUTIONAL_LINKS.map((l) => (
              <li key={l.href}><a href={l.href} rel="noopener">{l.label}</a></li>
            ))}
          </ul>
          {legal.length > 0 && (
            <ul className="footer-legal">
              {legal.map((l) => <li key={l.label}><a href={l.href}>{l.label}</a></li>)}
            </ul>
          )}
        </div>
      </footer>
    </>
  );
}
