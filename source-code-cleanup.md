# AllottedLand.com deployment checklist

## GitHub

1. Create a repo named `allottedland`.
2. Upload all files from this folder.
3. Confirm these files exist at the repo root:
   - `index.html`
   - `privacy.html`
   - `terms.html`
   - `submission-policy.html`
   - `assets/styles.css`
   - `assets/app.js`
   - `data/map_index.json`

## Cloudflare Pages

Recommended settings:

- Framework preset: None
- Build command: leave blank
- Build output directory: /

## Custom domain

- Add `allottedland.com` as the Pages custom domain.
- Add `www.allottedland.com` and redirect it to `https://allottedland.com`.

## Before public submissions

Do not enable uploads, testimonials, or correction forms until:

- Privacy Policy is finalized.
- Terms of Use is finalized.
- Submission Consent workflow is finalized.
- Removal/correction contact workflow exists.
- Review queue exists.
- Redaction rules exist.
