import { json } from './_util.js';
async function count(env, table){ try { const r = await env.DB.prepare(`SELECT COUNT(*) AS count FROM ${table}`).first(); return r?.count || 0; } catch { return 0; } }
async function latestApproved(env){ try { const rows = await env.DB.prepare(`SELECT id, verified_name, township_range, section, number_shown_on_map, number_type, created_at, record_json FROM approved_records ORDER BY created_at DESC LIMIT 20`).all(); return (rows.results||[]).map(row=>{let record={};try{record=JSON.parse(row.record_json||'{}')}catch{} return {id:row.id,verified_name:row.verified_name||record.verified_name||'',township_range:row.township_range||record.township_range||'',section:row.section||record.section||'',number_shown_on_map:row.number_shown_on_map||record.number_shown_on_map||record.map_number||'',number_type:row.number_type||record.number_type||'',created_at:row.created_at||'',record};}); } catch { return []; } }
export async function onRequestGet({ request, env }) {
  if (!env.DB) return json({ error: 'D1 binding DB is not configured.' }, 500);
  if (!env.ADMIN_KEY || request.headers.get('X-Admin-Key') !== env.ADMIN_KEY) return json({ error: 'Admin key required.' }, 401);
  let section_status = {};
  try { const sections = await env.DB.prepare('SELECT status, COUNT(*) AS count FROM section_status GROUP BY status').all(); for (const row of sections.results || []) section_status[row.status || 'unknown'] = row.count || 0; } catch {}
  return json({
    approved_records: await count(env,'approved_records'),
    pending_records: await count(env,'pending_records'),
    pending_testimonials: await count(env,'pending_testimonials'),
    approved_testimonials: await count(env,'approved_testimonials'),
    pending_evidence: await count(env,'pending_evidence'),
    approved_evidence: await count(env,'approved_evidence'),
    section_status,
    latest_approved: await latestApproved(env)
  });
}
