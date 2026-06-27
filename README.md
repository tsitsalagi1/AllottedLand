# AllottedLand.com

AllottedLand.com is a free public research tool helping Native families find allotted land records, maps, and land history.

## Current production workflow

The current primary tool is:

```text
workbench.html
```

and the local/development copy is:

```text
tools/map_workbench.html
```

The workbench loads one full LOC map image in the browser, lets a human calibrate the section grid, zooms into a selected section, and lets a human enter reviewed rows.

Starting with v0.26, the workbench can submit reviewed rows to Cloudflare Pages Functions and a Cloudflare D1 database. The LOC source image stays in the browser and is not uploaded.

## Backend files

```text
functions/api/submit-records.js
functions/api/records.js
functions/api/section-status.js
functions/api/pending-records.js
functions/api/admin-approve.js
schema.sql
docs/cloudflare-d1-backend-setup.md
```

## D1 binding

The Pages Functions expect a Cloudflare D1 binding named:

```text
DB
```

Trusted direct-approval submissions require an environment variable:

```text
REVIEWER_KEY
```

Admin queue review requires:

```text
ADMIN_KEY
```

## Privacy rule

Do not upload private living-person data. The tool should collect only historical public-source transcription data unless a person has given consent under the site policies.
