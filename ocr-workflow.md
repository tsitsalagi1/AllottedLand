# AllottedLand v0.26 backend setup

This backend lets the public Map Workbench submit human-reviewed rows directly to AllottedLand.com without uploading the LOC source image.

## What is included

- `functions/api/submit-records.js` — accepts workbench submissions.
- `functions/api/records.js` — returns approved public records.
- `functions/api/section-status.js` — returns or updates section progress.
- `functions/api/pending-records.js` — admin-only pending queue list.
- `functions/api/admin-approve.js` — admin-only move pending records to approved records.
- `schema.sql` — Cloudflare D1 tables.
- `workbench.html` and `tools/map_workbench.html` — submit-first workbench.

## Cloudflare setup

1. Create a D1 database in Cloudflare named `allottedland_records`.
2. Import or run `schema.sql` against that database.
3. In your Cloudflare Pages project, add a D1 binding:
   - Variable name: `DB`
   - Database: `allottedland_records`
4. Add environment variables:
   - `REVIEWER_KEY` — lets trusted reviewers submit directly to approved records.
   - `ADMIN_KEY` — lets you view pending records and approve them.
5. Deploy from GitHub.

## Submission modes

If the workbench submits with a correct reviewer key, rows go to `approved_records`.

If the workbench submits without the reviewer key, rows go to `pending_records` for later review.

The source image is not submitted. Only row data, section status, grid metadata, and reviewer information are sent.

## First test

After deployment, open:

```text
https://allottedland.com/workbench.html
```

Then submit one test row with your reviewer key. After submission, check:

```text
https://allottedland.com/api/records?township_range=T24N%20R14E
```

If records are returned, the backend is working.
