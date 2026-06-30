// AllottedLand.com NARA Catalog API proxy — v4
// Keeps the NARA key server-side and allows the live domain plus Cloudflare Pages preview domains.
const ALLOWED_ORIGINS = [
  "https://allottedland.com",
  "https://www.allottedland.com"
];
const NARA_BASE = "https://catalog.archives.gov/api/v2";
const WORKER_VERSION = "allottedland-nara-proxy-v4-pages-preview-cors";

function isAllowedOrigin(origin) {
  if (!origin) return true;
  try {
    const u = new URL(origin);
    return ALLOWED_ORIGINS.includes(origin) || u.hostname.endsWith(".allottedland.pages.dev");
  } catch (e) {
    return false;
  }
}

function corsHeaders(request) {
  const origin = request.headers.get("Origin") || "https://allottedland.com";
  const allowedOrigin = isAllowedOrigin(origin) ? origin : "https://allottedland.com";
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Accept",
    "Vary": "Origin"
  };
}

function json(data, status = 200, request) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      ...corsHeaders(request),
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Worker-Version": WORKER_VERSION
    }
  });
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(request) });
    }

    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return json({
        ok: true,
        worker: "allottedland-nara-proxy",
        version: WORKER_VERSION,
        hasNaraKey: Boolean(env.NARA_API_KEY)
      }, 200, request);
    }

    if (request.method !== "GET") {
      return json({ error: "Method not allowed" }, 405, request);
    }

    const q = (url.searchParams.get("q") || "").trim();
    const rows = Math.min(Math.max(Number(url.searchParams.get("rows") || "10"), 1), 25);

    if (!q) {
      return json({ error: "Missing search query. Use ?q=search terms", version: WORKER_VERSION }, 400, request);
    }

    const naraUrl = new URL(`${NARA_BASE}/records/search`);
    naraUrl.searchParams.set("q", q);
    naraUrl.searchParams.set("rows", String(rows));

    const naraResponse = await fetch(naraUrl.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": env.NARA_API_KEY
      }
    });

    const data = await naraResponse.json().catch(() => ({ error: "Unable to parse NARA response" }));
    const normalized = data.body || data;
    return json(normalized, naraResponse.status, request);
  }
};
