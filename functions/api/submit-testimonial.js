import { json, readJson, makeId } from './_util.js';
export async function onRequestPost({ request, env }) {
  if (!env.DB) return json({ error: 'D1 binding DB is not configured.' }, 500);
  const body = await readJson(request);
  const consent = body.consent || {};
  if (!consent.privacy || !consent.terms || !consent.submission || !consent.permission) return json({ error: 'Privacy, terms, submission consent, and permission are required.' }, 400);
  const story = String(body.story || '').trim();
  if (story.length < 20) return json({ error: 'Story is too short.' }, 400);
  const now = new Date().toISOString();
  const id = makeId('test');
  await env.DB.prepare(`INSERT INTO pending_testimonials (id, display_name, tribe, story, publication_choice, contact, consent_json, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).bind(id, String(body.display_name||'').trim(), String(body.tribe||'').trim(), story, String(body.publication_choice||'anonymous_public').trim(), String(body.contact||'').trim(), JSON.stringify(consent), now).run();
  return json({ ok: true, id, status: 'pending_review' });
}
