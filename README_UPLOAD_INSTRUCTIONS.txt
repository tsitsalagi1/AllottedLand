AllottedLand.com patch: user-friendly Chronicling America no-match text

Replace this one file in your full website folder:

  functions/api/chronicling-search.js

with the patched file in this ZIP.

Then deploy from your full site folder:

  cd "C:\Users\dynam\Desktop\Allotted Land\AllottedLand-main"
  npx.cmd wrangler pages deploy . --project-name allottedland --branch main

What changed:
- Removed technical wording like "Live newspaper API did not return usable rows (HTTP 403)."
- Replaced it with: "No matching newspaper record was found automatically. Open the official Chronicling America search to check manually."

No API keys are included. No page wording or layout was changed.
