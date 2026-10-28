import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <main className="main">
      <div className="panel card">
        <h1 style={{ margin: 0, fontSize: "var(--fs-h1)", fontWeight: 700 }}>Page introuvable</h1>
        <p className="lead" style={{ marginTop: "var(--sp-sm)" }}>
          La page que vous cherchez n'existe pas ou a été déplacée.
        </p>
        <Link to="/" className="btn btn-primary" style={{ textDecoration: "none" }}>
          Retour à l'accueil
        </Link>
      </div>
    </main>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <main className="main">
      <div className="panel card">
        <h1 style={{ margin: 0, fontSize: "var(--fs-h2)", fontWeight: 700 }}>
          La page n'a pas pu se charger
        </h1>
        <p className="lead" style={{ marginTop: "var(--sp-sm)" }}>
          Une erreur est survenue. Vous pouvez réessayer ou revenir à l'accueil.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--sp-xs)" }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              router.invalidate();
              reset();
            }}
          >
            Réessayer
          </button>
          <a href="/" className="btn btn-secondary" style={{ textDecoration: "none" }}>
            Retour à l'accueil
          </a>
        </div>
      </div>
    </main>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Tchap – Vérification de domaine" },
      { name: "description", content: "Vérifier l’ouverture d’un domaine sur Tchap." },
      { property: "og:title", content: "Tchap – Vérification de domaine" },
      { property: "og:description", content: "Vérifier l’ouverture d’un domaine sur Tchap." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
    </QueryClientProvider>
  );
}
