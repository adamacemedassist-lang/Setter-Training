// Vercel Serverless Function — Supabase Proxy
// Saari Supabase calls iske through jati hain. Keys server pe.

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const SUPA_URL = process.env.SUPA_URL;
  const SUPA_KEY = process.env.SUPA_KEY;

  if (!SUPA_URL || !SUPA_KEY) {
    return res.status(500).json({ error: 'Supabase not configured on server' });
  }

  try {
    // Query params se path nikalo: ?path=agents?select=*
    const { path } = req.query;
    if (!path) {
      return res.status(400).json({ error: 'path query param required' });
    }

    const url = SUPA_URL + '/rest/v1/' + path;

    const opts = {
      method: req.method,
      headers: {
        'apikey': SUPA_KEY,
        'Authorization': 'Bearer ' + SUPA_KEY,
        'Content-Type': 'application/json',
        'Prefer': (req.method === 'POST' || req.method === 'PATCH')
          ? 'return=representation'
          : 'return=minimal'
      }
    };

    if (req.method === 'POST' || req.method === 'PATCH') {
      opts.body = JSON.stringify(req.body);
    }

    const supaRes = await fetch(url, opts);

    if (!supaRes.ok) {
      const errText = await supaRes.text();
      return res.status(supaRes.status).json({ error: errText });
    }

    if (req.method === 'DELETE' || supaRes.status === 204) {
      return res.status(200).json({ ok: true });
    }

    const data = await supaRes.json();
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Server error' });
  }
}
