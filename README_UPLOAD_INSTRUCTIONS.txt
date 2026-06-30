AllottedLand.com NARA packet/results patch

This patch fixes the problem where the Cloudflare Worker worked in the browser console, but NARA API hits were not reliably showing inside the same “Official source leads” section that the printable packet uses.

UPLOAD TO WEBSITE:
1. Replace this file on the full website:
   assets/unified-search.js

2. Deploy from the FULL site folder, not from this patch folder:
   cd "C:\Users\dynam\Desktop\Allotted Land\AllottedLand-main"
   npx.cmd wrangler pages deploy . --project-name allottedland --branch main

WORKER UPDATE RECOMMENDED:
The uploaded PDF was generated from a Cloudflare Pages preview URL:
https://48a1b44d.allottedland.pages.dev

If the Worker only allows https://allottedland.com, NARA results can work on the live site but fail on preview/PDF testing because of CORS. To fix that, open:
Cloudflare → Workers & Pages → allottedland-nara-proxy → Edit code

Replace the Worker code with:
worker/allottedland-nara-proxy-worker-v4.js

Then Save and deploy.

TESTS:
1. Worker health:
   https://allottedland-nara-proxy.dynamictech-nwa.workers.dev/health

2. Worker search:
   https://allottedland-nara-proxy.dynamictech-nwa.workers.dev/?q=Cherokee&rows=5&nocache=v4

3. Live site:
   https://allottedland.com
   Search: Cherokee Nation
   Print/save packet. NARA Catalog API cards should appear under Official source leads.

SECURITY:
Do not put the NARA API key into any website file. It stays only in the Worker secret named NARA_API_KEY.
