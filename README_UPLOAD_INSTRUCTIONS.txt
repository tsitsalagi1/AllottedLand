AllottedLand.com — Best/Related Official Leads Patch

Purpose:
- Keeps NARA Catalog API results, but separates stronger matches from broad official leads.
- Adds two sections to the unified packet/output:
  1. Best matching official leads
  2. Related official leads
- Broad NARA records such as photographs, postmaster appointments, or general Cherokee Nation records will no longer be presented as "best matches" unless they also contain strong family/land/Dawes/allotment signals.

Upload:
1. Extract this ZIP.
2. Copy assets/unified-search.js into your full site folder:
   C:\Users\dynam\Desktop\Allotted Land\AllottedLand-main\assets\unified-search.js
3. Deploy from the full site folder:
   cd "C:\Users\dynam\Desktop\Allotted Land\AllottedLand-main"
   npx.cmd wrangler pages deploy . --project-name allottedland --branch main

Do not deploy this ZIP by itself as the entire website.
Do not put the NARA API key in any website file. The key stays in the Cloudflare Worker secret.
