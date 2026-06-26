# AllottedLand.com v0.1

AllottedLand.com is a free public research-tool prototype for helping Native families find allotted land from partial clues such as name, roll/enrollment number, tribe, county, township/range/section, or family stories.

## What this version includes

- AllottedLand.com homepage and mission.
- Guided “I don’t know where to start” family-land finder.
- Cherokee Nation LOC atlas map search by township/range.
- Map preview using LOC source links / IIIF when the browser permits.
- County record request builder.
- Evidence checklist.
- Testimonials and land-loss data project placeholder.
- Privacy Policy starter page.
- Terms of Use starter page.
- Submission Consent Policy starter page.
- Data templates for verified records and future land-loss submissions.

## Important limitation

The Library of Congress atlas pages are image-based. Name, roll number, and allotment-number search will only work after names and allotment data are OCRed or manually verified into `data/allotment_records.json`.

Roll/enrollment numbers generally require a Dawes/NARA crosswalk. LOC maps may show names and allotment numbers, but Dawes roll/enrollment numbers come from Dawes enrollment and allotment records.

## Files

- `index.html` — main website.
- `privacy.html` — starter privacy policy.
- `terms.html` — starter terms of use.
- `submission-policy.html` — starter consent policy.
- `assets/styles.css` — styling.
- `assets/app.js` — search, wizard, county request builder, LOC map preview.
- `data/map_index.json` — LOC Cherokee Nation atlas page index.
- `data/allotment_records.json` — verified person/allotment rows; currently empty.
- `data/allotment_records_template.csv` — data-entry template for person/allotment rows.
- `data/county_routes.json` — township/range/section-to-county routing examples.
- `data/county_routes_template.csv` — data-entry template for county routing rows.
- `data/land_loss_categories.json` — future dashboard categories.
- `data/submission_intake_template.csv` — future voluntary submission template.
- `schema.md` — recommended data schema.
- `docs/deployment-checklist.md` — GitHub + Cloudflare deployment checklist.

## Local testing

From inside this folder, run:

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## Cloudflare Pages settings

Recommended project settings:

```text
Framework preset: None
Build command: leave blank
Build output directory: /
```

## Legal/research disclaimer

This site is a free research index. It does not determine ownership, title, heirship, citizenship, enrollment, land recovery claims, or legal rights. Verify all results against original records, county records, tribal records, BIA/LTRO records, and National Archives records.
