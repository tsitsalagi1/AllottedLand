import { json } from './_util.js';
export async function onRequestGet({ env }) {
  if (!env.DB) return json({ testimonials: [] });
  const rows = await env.DB.prepare(`SELECT id, title, display_name, tribe, story, publication_choice, approved_at FROM approved_testimonials ORDER BY approved_at DESC LIMIT 50`).all();
  return json({ testimonials: rows.results || [] });
}
