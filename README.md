# Sentinel Relay Marketing Website

This folder contains a standalone static marketing website for `sentinelrelay.com`.

## Files

- `index.html` - page structure and product copy
- `assets/style.css` - visual system, responsive layout, and motion styling
- `assets/app.js` - reveal and hero tilt interactions
- `assets/favicon.svg` - browser icon
- `robots.txt` and `sitemap.xml` - basic SEO files
- `interest/index.html` - dedicated interest-capture page for a public demo intake
- `api/interest.mjs` - Vercel Function that validates and forwards submissions
- `vercel.json` - host-based routing for `interest.sentinelrelay.com`

## Notes

- The website is intentionally decoupled from the Rust application in `src/`.
- You can deploy the contents of this folder directly to any static host.
- Canonical and sitemap URLs already point at `https://sentinelrelay.com/`.
- For the interest form on Vercel, set `RESEND_API_KEY` and `INTEREST_FORM_TO_EMAIL`.
- Point `interest.sentinelrelay.com` at the same Vercel project so `/` on that host rewrites to `/interest/`.
