# AllottedLand.com v0.30 setup

1. Upload the v0.30 changed files to GitHub.
2. Wait for Cloudflare Pages to redeploy.
3. Open Cloudflare D1 > allottedland-db > Console.
4. Open `migrations/0002_testimonials_evidence.sql` in GitHub.
5. Copy the entire SQL file into the D1 Console and click Execute.
6. Test:
   - `/login.html`
   - `/testimonials.html`
   - `/evidence.html`
   - `/admin.html`
   - `/api/evidence-stats`
7. Use the admin panel to approve or reject pending testimonials and evidence submissions.
