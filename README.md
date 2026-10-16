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
refreshed in the browser, so publishing a new release needs no change here.

## Deploy (Cloudflare Workers, static assets)

`wrangler.jsonc` serves the built `dist/` folder as static assets, so no Astro adapter is needed.

- **Build command:** `npm run build`
- **Deploy command:** `npx wrangler deploy`
- **Custom domain:** in the Cloudflare dashboard, open the Worker and go to Settings → Domains & Routes →
  Add → Custom domain → `vocal-remover.voltajeba.com`

To deploy from your machine instead: `npm run deploy`
