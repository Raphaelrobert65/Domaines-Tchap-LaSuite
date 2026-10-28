<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Project rules
- The published site is the static root (`index.html`, `styles.css`, `app.js`, `assets/`): no build, relative paths only, works at a domain root and under a GitHub Pages sub-path.
- `app.js` is the reference implementation of validation and classification; `src/` exists only for the Lovable preview and must mirror it.
- Links: `null` means "not provided" and the link is hidden — never render `#` links.
- No backend, no tracking: the page calls the Tchap API directly from the browser (CORS `*` observed); never use `no-cors` or simulated results.
- The "domain not open" answer shows the Tchap team's fixed copy and the access-request form URL — keep the wording and URL verbatim unless the team restates them.
