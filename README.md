# AllottedLand.com v0.27

AllottedLand.com is a free public research tool for helping Native families find allotted land records by name, map number, township/range, section, and source-linked records.

## Current production workflow

1. Human reviewer opens `workbench.html`.
2. Reviewer selects one full LOC map image locally in the browser.
3. Reviewer calibrates the township/range grid and selects a section.
4. Reviewer enters human-reviewed records.
5. Reviewer submits rows to the website.
6. Rows submitted with a trusted reviewer key go to approved records; rows without the key go to pending review.
7. Admin reviews pending rows at `admin.html`.

## Backend

The backend uses Cloudflare Pages Functions and Cloudflare D1.

Required bindings/secrets:

```text
DB
REVIEWER_KEY
ADMIN_KEY
```

## Admin review

Open:

```text
/admin.html
```

The admin panel can load pending records, inspect row data, save obvious corrections, approve records, and reject bad duplicates or mistakes.

## Privacy

Source map images are not stored by the website. The browser uses the local image only to generate section zooms for human review.
