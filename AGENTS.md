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

- Android app lives in `android/` (Capacitor); it loads the published site via `server.url` in capacitor.config.ts, and native overlay code is the `NinoOverlay` plugin (Java) called from `src/nino/utils/nativeOverlay.ts` — keeps web behavior unchanged and avoids bundling the SSR app.
