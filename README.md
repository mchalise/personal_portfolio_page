# mchalise.island — The Career Archipelago

A one-of-a-kind portfolio in the spirit of acrokat.me: **Manish Chalise's career rendered as an
interactive 3D island** (three.js). Every career stop is a building — EB Pearls, First Global
Data, Eepos IT / InvestReady, WhiteHat Engineering, and the ZenLedger citadel with its orbiting
exchange rings and the BATS federal annex. Hover to label, click (or use the overlay buttons)
to fly the camera and open the dossier drawer. Featured live product: **investready.com**.

Extras: toggleable lampposts, a ringable island bell, fireflies, a boot sequence, a verified
stat wall, intent-based contact — with `pause motion` and `reset 3D view` controls, and full
`prefers-reduced-motion` support.

Stack: Vite + vanilla TypeScript + three.js. No UI frameworks.

## Develop

```bash
npm install
npm run dev
```

## Build

```bash
npm run build      # tsc --noEmit (typecheck) + vite build → dist/
npm run preview    # serve dist/ locally
npm run typecheck  # typecheck only
npm run export     # build + single-file HTML → export/
```

## Deploy

- **This repo deploys via Vercel** (site: `mchalise.com.np`): pushes to `main` build `dist/`
  and go live automatically. Node 22.x, framework auto-detected (Vite) → output `dist/`.
- GitHub Pages mirror (optional): enable **Settings → Pages → Source: GitHub Actions**, then
  run the `Deploy to GitHub Pages` workflow manually from the Actions tab.

## Content placeholders (owner TODO)

Marked with `PLACEHOLDER` comments in `index.html` / `src/island.ts`:

- `og:image` — needs a 1200×630 raster before launch.
- NDA-safe screenshots / extra detail for the BATS federal dossier.
- Confirm `public/resume/ManishChaliseResume.pdf` is the current résumé.
- Contact policy: phone is intentionally withheld; email is public.
- ZenLedger dates are canonical **2018–2025** (older résumé PDF says Nov 2017 – Sep 2023).
