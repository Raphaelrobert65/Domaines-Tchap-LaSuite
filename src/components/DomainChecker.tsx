import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { AlertCircle, CheckCircle2, HelpCircle, Loader2, XCircle } from "lucide-react";
import { LINKS } from "@/config/site";
import {
  CheckError,
  classifyInstance,
  fetchInstanceFromDomain,
  isValidDomain,
  normalizeDomain,
} from "@/lib/tchap-check";

type State =
  | { kind: "idle" }
  | { kind: "loading"; domain: string }
  | { kind: "open" | "closed" | "unknown" | "error"; domain: string };

const NOTE = "Cette vérification porte sur le domaine, pas sur l’existence d’un compte individuel.";

export function DomainChecker() {
  const id = useId();
  const [value, setValue] = useState("");
  const [invalid, setInvalid] = useState(false);
  const [state, setState] = useState<State>({ kind: "idle" });
  const ctrl = useRef<AbortController | null>(null);
  const reqId = useRef(0);

  useEffect(() => () => ctrl.current?.abort(), []);

  const cancel = () => {
    ctrl.current?.abort();
    ctrl.current = null;
    reqId.current++;
  };

  async function run(domain: string) {
    cancel();
    const my = reqId.current;
    const c = new AbortController();
    ctrl.current = c;
    setState({ kind: "loading", domain });
    try {
      const hs = await fetchInstanceFromDomain(domain, c.signal);
      if (my !== reqId.current) return;
      setState({ kind: classifyInstance(hs), domain });
    } catch (e) {
      if (my !== reqId.current || (e instanceof CheckError && e.kind === "aborted")) return;
      if (import.meta.env.DEV) console.debug("[tchap-check]", e);
      setState({ kind: "error", domain });
    } finally {
      if (ctrl.current === c) ctrl.current = null;
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (state.kind === "loading") return;
    const domain = normalizeDomain(value);
    if (!isValidDomain(domain)) {
      cancel();
      setInvalid(true);
      setState({ kind: "idle" });
      return;
    }
    setInvalid(false);
    run(domain);
  }

  function onChange(v: string) {
    setValue(v);
    if (state.kind !== "idle") {
      cancel();
      setState({ kind: "idle" });
    }
  }

  const hintId = `${id}-hint`;
  const errId = `${id}-err`;
  const loading = state.kind === "loading";

  return (
    <div className="card">
      <form onSubmit={onSubmit} noValidate>
        <label className="label" htmlFor={`${id}-in`}>Domaine professionnel</label>
        <span className="hint" id={hintId}>
          La partie située après le @ dans votre adresse professionnelle. Exemple : beta.gouv.fr
        </span>
        <div className="field-row">
          <input
            id={`${id}-in`}
            className="input"
            type="text"
            inputMode="url"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="beta.gouv.fr"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            aria-invalid={invalid || undefined}
            aria-describedby={invalid ? `${hintId} ${errId}` : hintId}
          />
          <button type="submit" className="btn btn-primary" disabled={loading}>
            Vérifier mon domaine
          </button>
        </div>
        {invalid && (
          <p className="error-msg" id={errId}>
            <AlertCircle size={16} aria-hidden="true" />
            <span>Saisissez un domaine valide, par exemple beta.gouv.fr, sans adresse email ni https://.</span>
          </p>
        )}
      </form>

      <div className="status-zone" role="status" aria-live="polite">
        {state.kind !== "idle" && <Result state={state} onRetry={() => run(state.domain)} />}
      </div>
    </div>
  );
}

function Result({ state, onRetry }: { state: Exclude<State, { kind: "idle" }>; onRetry: () => void }) {
  const map = {
    loading: { Icon: Loader2, title: "Vérification en cours…" },
    open: { Icon: CheckCircle2, title: "Ce domaine est ouvert sur Tchap." },
    closed: { Icon: XCircle, title: "Ce domaine n’est pas ouvert sur Tchap pour un accès agent." },
    unknown: { Icon: HelpCircle, title: "Nous ne pouvons pas déterminer le statut de ce domaine." },
    error: { Icon: AlertCircle, title: "La vérification est momentanément indisponible. Réessayez dans quelques instants." },
  } as const;
  const { Icon, title } = map[state.kind];
  return (
    <div className="result" data-tone={state.kind}>
      <Icon className={`result-icon${state.kind === "loading" ? " spin" : ""}`} size={20} aria-hidden="true" />
      <div>
        <p className="result-title">{title}</p>
        <p className="result-domain">
          <span className="sr-only-label">Domaine vérifié : </span>
          {state.domain}
        </p>
        {state.kind !== "loading" && state.kind !== "error" && <p className="result-note">{NOTE}</p>}
        {state.kind === "open" && LINKS.tchap && (
          <div className="result-actions"><a className="btn btn-secondary" href={LINKS.tchap}>Accéder à Tchap</a></div>
        )}
        {state.kind === "closed" && LINKS.requestOpening && (
          <div className="result-actions"><a className="btn btn-secondary" href={LINKS.requestOpening}>Demander l’ouverture</a></div>
        )}
        {state.kind === "error" && (
          <div className="result-actions">
            <button type="button" className="btn btn-secondary" onClick={onRetry}>Réessayer</button>
          </div>
        )}
      </div>
    </div>
  );
}
