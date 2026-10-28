/* Vérification de l'ouverture d'un domaine sur Tchap — JavaScript natif, sans dépendance. */
(function () {
  "use strict";

  var CONFIG = {
    apiBaseUrl: "https://matrix.agent.dinum.tchap.gouv.fr/_matrix/identity/api/v1/info",
    instanceSuffix: "tchap.gouv.fr",
    timeoutMs: 10000,
    // null = lien non renseigné, non affiché.
    links: {
      tchap: null,
      requestOpening: "https://demarche.numerique.gouv.fr/commencer/utiliser-tchap",
    },
  };

  var LABEL_RE = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
  var TLD_RE = /^(?:[a-z]{2,63}|xn--[a-z0-9-]{1,59})$/;

  function normalizeDomain(raw) { return String(raw).trim().toLowerCase(); }

  function isValidDomain(d) {
    if (!d || d.length > 253 || !/^[a-z0-9.-]+$/.test(d)) return false;
    var labels = d.split(".");
    if (labels.length < 2) return false;
    for (var i = 0; i < labels.length; i++) {
      var l = labels[i];
      if (!LABEL_RE.test(l)) return false;
      if (l.indexOf("xn--") === 0 && l.length < 5) return false;
      if (l.slice(2, 4) === "--" && l.indexOf("xn--") !== 0) return false;
    }
    return TLD_RE.test(labels[labels.length - 1]);
  }

  /* externe => closed (testé avant agent) ; agent.<x>.tchap.gouv.fr => open ; sinon unknown. */
  function classifyInstance(hs) {
    if (typeof hs !== "string") return "unknown";
    var host = hs.trim().toLowerCase();
    if (!isValidDomain(host)) return "unknown";
    var suffix = "." + CONFIG.instanceSuffix;
    if (host.slice(-suffix.length) !== suffix) return "unknown";
    var labels = host.slice(0, -suffix.length).split(".");
    if (labels.indexOf("externe") !== -1) return "closed";
    if (labels.length === 2 && labels[0] === "agent") return "open";
    return "unknown";
  }

  function CheckError(kind) { this.kind = kind; }

  function fetchInstance(domain, signal) {
    // `medium=` volontairement vide : contrat repris de l'outil interne.
    var url = CONFIG.apiBaseUrl + "?medium=&address=" + encodeURIComponent("test@" + domain);
    var timeout = new AbortController();
    var timer = setTimeout(function () { timeout.abort(); }, CONFIG.timeoutMs);
    var onAbort = function () { timeout.abort(); };
    signal.addEventListener("abort", onAbort);
    var done = function () { clearTimeout(timer); signal.removeEventListener("abort", onAbort); };
    return fetch(url, { credentials: "omit", signal: timeout.signal })
      .catch(function () {
        if (signal.aborted) throw new CheckError("aborted");
        if (timeout.signal.aborted) throw new CheckError("timeout");
        throw new CheckError("network");
      })
      .then(function (r) {
        if (!r.ok) throw new CheckError("http");
        return r.json().catch(function () { throw new CheckError("invalid"); });
      })
      .then(function (data) {
        if (!data || typeof data !== "object") throw new CheckError("invalid");
        return data.hs;
      })
      .then(function (hs) { done(); return hs; }, function (e) { done(); throw e; });
  }

  // Exposé pour d'éventuels tests manuels dans la console.
  window.TchapCheck = { normalizeDomain: normalizeDomain, isValidDomain: isValidDomain, classifyInstance: classifyInstance };

  /* ---------- Interface ---------- */
  var ICONS = {
    loading: '<path d="M21 12a9 9 0 1 1-6.219-8.56"/>',
    open: '<path d="M21.801 10A10 10 0 1 1 17 3.335"/><path d="m9 11 3 3L22 4"/>',
    closed: '<circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/>',
    unknown: '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>',
    error: '<circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/>',
  };
  var TITLES = {
    loading: "Vérification en cours…",
    open: "Ce domaine est ouvert sur Tchap.",
    closed: "Ce domaine n’est pas ouvert sur Tchap pour un accès agent.",
    unknown: "Nous ne pouvons pas déterminer le statut de ce domaine.",
    error: "La vérification est momentanément indisponible. Réessayez dans quelques instants.",
  };
  var NOTE = "Cette vérification porte sur le domaine, pas sur l’existence d’un compte individuel.";

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function linkBtn(href, label, external) {
    var a = el("a", "btn btn-secondary" + (external ? " external" : ""), label);
    a.href = href;
    if (external) { a.target = "_blank"; a.rel = "noopener"; }
    var wrap = el("div", "result-actions"); wrap.appendChild(a); return wrap;
  }

  function init() {
    var form = document.getElementById("check-form");
    var input = document.getElementById("domain-in");
    var btn = document.getElementById("submit-btn");
    var err = document.getElementById("domain-err");
    var status = document.getElementById("status");
    var ctrl = null, reqId = 0, kind = "idle";

    function cancel() { if (ctrl) ctrl.abort(); ctrl = null; reqId++; }

    function setInvalid(on) {
      err.hidden = !on;
      if (on) { input.setAttribute("aria-invalid", "true"); input.setAttribute("aria-describedby", "domain-hint domain-err"); }
      else { input.removeAttribute("aria-invalid"); input.setAttribute("aria-describedby", "domain-hint"); }
    }

    function render(k, domain) {
      kind = k;
      btn.disabled = k === "loading";
      status.textContent = "";
      if (k === "idle") return;
      var box = el("div", "result"); box.dataset.tone = k;
      var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("class", "icon result-icon" + (k === "loading" ? " spin" : ""));
      svg.setAttribute("viewBox", "0 0 24 24"); svg.setAttribute("fill", "none"); svg.setAttribute("stroke", "currentColor");
      svg.setAttribute("stroke-width", "2"); svg.setAttribute("stroke-linecap", "round"); svg.setAttribute("stroke-linejoin", "round");
      svg.setAttribute("aria-hidden", "true"); svg.innerHTML = ICONS[k];
      var body = el("div");
      body.appendChild(el("p", "result-title", TITLES[k]));
      var dom = el("p", "result-domain"); dom.appendChild(el("span", null, "Domaine vérifié : ")); dom.appendChild(document.createTextNode(domain));
      body.appendChild(dom);
      if (k === "closed") {
        var cm = el("div", "result-body");
        cm.appendChild(el("p", null, "Votre administration n’est pas encore présente sur Tchap\u00a0!"));
        if (CONFIG.links.requestOpening) cm.appendChild(linkBtn(CONFIG.links.requestOpening, "Demander l’accès à Tchap pour votre administration", true));
        cm.appendChild(el("p", null, "L’équipe Tchap ouvrira l’accès à votre administration si toutes les conditions sont remplies (délai\u00a0: environ 15\u00a0jours)."));
        cm.appendChild(el("p", null, "Les agents de votre administration pourront ensuite s’inscrire et communiquer sur Tchap."));
        body.appendChild(cm);
      }
      if (k === "open" || k === "unknown") body.appendChild(el("p", "result-note", NOTE));
      if (k === "open" && CONFIG.links.tchap) body.appendChild(linkBtn(CONFIG.links.tchap, "Accéder à Tchap", false));
      if (k === "error") {
        var wrap = el("div", "result-actions");
        var retry = el("button", "btn btn-secondary", "Réessayer"); retry.type = "button";
        retry.addEventListener("click", function () { run(domain); });
        wrap.appendChild(retry); body.appendChild(wrap);
      }
      box.appendChild(svg); box.appendChild(body); status.appendChild(box);
    }

    function run(domain) {
      cancel();
      var my = reqId, c = new AbortController();
      ctrl = c;
      render("loading", domain);
      fetchInstance(domain, c.signal).then(function (hs) {
        if (my !== reqId) return;
        render(classifyInstance(hs), domain);
      }, function (e) {
        if (my !== reqId || (e && e.kind === "aborted")) return;
        render("error", domain);
      }).then(function () { if (ctrl === c) ctrl = null; });
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (kind === "loading") return;
      var d = normalizeDomain(input.value);
      if (!isValidDomain(d)) { cancel(); setInvalid(true); render("idle"); input.focus(); return; }
      setInvalid(false);
      run(d);
    });
    input.addEventListener("input", function () { if (kind !== "idle") { cancel(); render("idle"); } });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
