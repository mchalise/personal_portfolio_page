# mchalise.ledger — The Chalise Ledger

A one-of-a-kind portfolio: **your career as a blockchain under forensic investigation.**
Near-black console, mint/cyan chain accents, amber alerts — with a live hash-linked chain
canvas, click-through career blocks that open redacted dossiers, three deep-dive case files,
a verified stat wall, intent-based contact, and an on-call pager easter egg.

Static output, zero runtime frameworks — Vite + vanilla TypeScript only.

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
```

## Deploy

- Any static host: publish the `dist/` folder.
- GitHub Pages: `.github/workflows/deploy.yml` builds and deploys on push to `main`
  (enable it once: **Settings → Pages → Source: GitHub Actions**).
- Custom domain `mchalise.com.np`: point DNS at whatever host serves `dist/`.

## Content placeholders (owner TODO)

Marked with `PLACEHOLDER` comments in `index.html`:

- `og:image` — needs a 1200×630 raster before launch.
- The "many more" ZenLedger bullets (append to block #004 dossier).
- NDA-safe screenshots / extra detail for the BATS federal case.
- Confirm `public/resume/ManishChaliseResume.pdf` is the current résumé.
- Contact policy: phone is intentionally withheld; email is public.
- ZenLedger dates are canonical **2018–2025** here (older résumé PDF says Nov 2017 – Sep 2023).
