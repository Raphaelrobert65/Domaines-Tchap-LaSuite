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
- Domain-opening logic lives in pure functions in `src/lib/tchap-check.ts` (tested); UI only calls them — keeps the business rule auditable.
- All public URLs/links live in `src/config/site.ts`; `null` means "not provided" and the link is hidden — never render `#` links.
- No backend, no Lovable Cloud, no tracking: the page calls the Tchap API directly from the browser (CORS `*` observed).
- Styling uses La Suite × Marianne tokens in `src/styles.css`, not shadcn defaults.
