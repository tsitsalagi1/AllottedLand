# AllottedLand.com v0.3

AllottedLand.com is a free public research-tool prototype for helping Native families find allotted land from partial clues such as name, tribe, roll/enrollment number, township/range/section, county, town, cemetery, or family story.

## Current status

Beta / Phase 1. The current live search starts with the Library of Congress 1909 Cherokee Nation atlas map index. Name, roll-number, allotment-number, county routing, testimonial, and land-loss datasets will expand as verified records are added.

## Site pages

- `index.html` — homepage, guided finder, search, process guide, request builder, stories/data preview
- `about.html` — mission and beta scope
- `sources.html` — source-record explanation and official source links
- `contact.html` — contact/correction guidance and privacy warning
- `privacy.html` — starter privacy policy
- `terms.html` — starter terms of use
- `submission-policy.html` — starter submission consent policy
- `sitemap.xml` — sitemap for search engines
- `robots.txt` — crawl rules and sitemap location

## Data files

- `data/map_index.json` — LOC map-page index
- `data/allotment_records.json` — verified name/roll/allotment records, currently empty
- `data/county_routes.json` — starter county-route examples
- `data/land_loss_categories.json` — future voluntary land-loss categories

## Safety rule

Do not accept uploads, testimonials, corrections, or family documents until Privacy, Terms, Submission Consent, and a review/removal process are finalized.

## Deployment

Static site for GitHub + Cloudflare Pages.

Suggested Cloudflare Pages settings:

- Framework preset: None
- Build command: blank
- Build output directory: `/` or `.`
