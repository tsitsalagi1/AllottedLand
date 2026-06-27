# AllottedLand Admin Review Workflow v0.27

The admin panel lets a trusted maintainer review pending public submissions stored in Cloudflare D1.

## Page

Open:

```text
https://allottedland.com/admin.html
```

## Required Cloudflare setup

- D1 database binding on the Pages project named `DB`
- Environment variable or secret named `ADMIN_KEY`

## Workflow

1. Enter the `ADMIN_KEY` in the Admin key field.
2. Optionally filter by township/range, for example `T24N R14E`.
3. Click **Load pending records**.
4. Click **Inspect** on a record.
5. Edit only obvious human-transcription corrections. Do not guess.
6. Click **Save edits to pending row** if you changed anything.
7. Approve verified rows or reject bad duplicates/mistakes.

## Important review rule

The admin panel is not a research shortcut. It is only for reviewing human-submitted entries against the map/source record. If the spelling, number, or section is uncertain, leave it pending or reject it and ask for resubmission.
