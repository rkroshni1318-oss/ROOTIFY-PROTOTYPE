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

- Signed-in app lives under `src/routes/_authenticated/` with five tabs (home, search, map, trips, profile); `/` is sign-in, because trips must persist per user.
- Places come from Google Places via the connector gateway with OpenStreetMap Overpass fallback, because nothing may be invented.
- Weather uses Open-Meteo forecast, and the archive API labelled "Typical" beyond 16 days, because it needs no key.
- Leg times come from OSRM plus Google Routes transit for real line numbers only, because line numbers must never be guessed.
- Trips are saved in the `trips` table (plan jsonb holds input + plan) and mirrored to localStorage for offline viewing.
