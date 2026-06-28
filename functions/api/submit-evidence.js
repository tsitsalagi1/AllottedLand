import { json, readJson, makeId } from './_util.js';
export async function onRequestPost({ request, env }) {
  if (!env.DB) return json({ error: 'D1 binding DB is not configured.' }, 500);
  const body = await readJson(request); const consent = body.consent || {};
  if (!consent.privacy || !consent.terms || !consent.submission || !consent.permission) return json({ error: 'Privacy, terms, submission consent, and permission are required.' }, 400);
  const summary = String(body.summary || '').trim(); if (summary.length < 20) return json({ error: 'Summary is too short.' }, 400);
  const id = makeId('evid'); const now = new Date().toISOString();
  await env.DB.prepare(`INSERT INTO pending_evidence (id, family_name, tribe, county, decade, loss_method, source_type, summary, source_note, contact, consent_json, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(id, String(body.family_name||'').trim(), String(body.tribe||'').trim(), String(body.county||'').trim(), String(body.decade||'unknown').trim(), String(body.loss_method||'unknown').trim(), String(body.source_type||'').trim(), summary, String(body.source_note||'').trim(), String(body.contact||'').trim(), JSON.stringify(consent), now).run();
  return json({ ok: true, id, status: 'pending_review' });
}
