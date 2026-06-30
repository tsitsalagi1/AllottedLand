AllottedLand.com NARA Worker Search Patch

Changed file:
- assets/unified-search.js

What this does:
- Connects the existing Search everything button to the Cloudflare Worker:
  https://allottedland-nara-proxy.dynamictech-nwa.workers.dev/
- Keeps the NARA API key out of public website code.
- Shows NARA Catalog results inside the existing Official source leads section.

Upload/replace only this file in the matching path of the existing site:
assets/unified-search.js

Important for Cloudflare Pages Direct Upload:
Do not deploy this patch ZIP by itself as the entire website. Replace the file in your full site folder, then upload/deploy the full site folder if Cloudflare requires a full deployment.

Test after upload:
1. Open https://allottedland.com/
2. Check the Privacy / Terms box.
3. Search Cherokee or Dawes Roll.
4. Look for NARA Catalog API entries under Official source leads.
