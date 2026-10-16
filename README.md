# vocal-remover-home

Landing page for [Vocal Remover](https://github.com/Volta-Jebaprashanth/vocal-remover), live at
**https://vocal-remover.voltajeba.com**.

Built with [Astro](https://astro.build) as a fully static site (no framework runtime; only small scripts for
the animated visuals).

## Develop

```sh
npm install
npm run dev       # http://localhost:4321
npm run build     # outputs to dist/
npm run preview   # serve the built site
```

## Where things live

| Path | What |
| --- | --- |
| `src/data/site.ts` | Contact details, repo URL, latest-release lookup |
| `src/styles/global.css` | Design tokens (colours taken from the app's `styles.py` + icon glow) |
| `src/scripts/separation-viz.ts` | The animated "song → AI → stems" canvas |
| `src/components/*` | One component per page section |
| `scripts/make-assets.mjs` | Regenerates the cropped logo, favicons and `public/og.png` |

The download button always points at the newest GitHub release. The URL is fetched at build time and
refreshed in the browser, so publishing a new release needs no change here. The deploy workflow also
rebuilds daily.

## Deploy (GitHub Pages)

1. Push this folder to a GitHub repo (e.g. `Volta-Jebaprashanth/vocal-remover-home`), branch `main`.
2. Repo → **Settings → Pages → Source: GitHub Actions**. The included workflow builds and deploys on every push.
3. Repo → **Settings → Pages → Custom domain**: `vocal-remover.voltajeba.com` and tick **Enforce HTTPS**
   (`public/CNAME` already contains the domain).
4. At your DNS provider for `voltajeba.com`, add:
   `CNAME  vocal-remover  →  volta-jebaprashanth.github.io`
