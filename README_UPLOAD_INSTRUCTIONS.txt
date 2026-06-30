AllottedLand.com patch: reduce confusing Chronicling America fallback links

WHY:
The previous Chronicling America fallback made 5-6 separate newspaper search cards when the live newspaper API did not return rows. That confused users because generated terms such as tax sale, sheriff sale, guardian, probate, and allotment looked like the user entered them and looked like real matches.

WHAT THIS PATCH DOES:
1. Stops assets/unified-search.js from appending automatic legal-notice terms to the user query before calling /api/chronicling-search.
2. Changes functions/api/chronicling-search.js so that when no automatic newspaper rows are found, it returns ONE clear card:
   "No automatic newspaper match found"
3. Keeps the official Chronicling America link available for manual searching.
4. Keeps fallback/no-match newspaper cards out of "Best matching official leads".

UPLOAD ONLY THESE FILES:
- assets/unified-search.js
- functions/api/chronicling-search.js

DEPLOY:
cd "C:\Users\dynam\Desktop\Allotted Land\AllottedLand-main"
npx.cmd wrangler pages deploy . --project-name allottedland --branch main

DO NOT upload this ZIP by itself as the whole site.
