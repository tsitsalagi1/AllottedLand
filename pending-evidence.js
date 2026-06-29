import { json } from './_util.js';
async function rows(env, sql){ const r = await env.DB.prepare(sql).all(); return r.results || []; }
export async function onRequestGet({ env }) {
  if (!env.DB) return json({ loss_methods: [], decades: [], counties: [] });
  const loss_methods = await rows(env, `SELECT loss_method AS label, COUNT(*) AS count FROM approved_evidence GROUP BY loss_method ORDER BY count DESC`);
  const decades = await rows(env, `SELECT decade AS label, COUNT(*) AS count FROM approved_evidence GROUP BY decade ORDER BY label`);
  const counties = await rows(env, `SELECT county AS label, COUNT(*) AS count FROM approved_evidence WHERE county IS NOT NULL AND county <> '' GROUP BY county ORDER BY count DESC LIMIT 20`);
  return json({ loss_methods, decades, counties });
}
