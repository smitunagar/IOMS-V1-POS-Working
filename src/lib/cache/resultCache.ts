import db from '@/lib/database';

// Ensure cache table exists (idempotent)
db.exec(`
CREATE TABLE IF NOT EXISTS extraction_cache (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  expires_at DATETIME
);
CREATE INDEX IF NOT EXISTS idx_extraction_cache_expires ON extraction_cache(expires_at);
`);

export function getCachedExtraction(hash: string): any | null {
  const row = db.prepare('SELECT value, expires_at FROM extraction_cache WHERE key = ?').get(hash) as any;
  if (!row) return null;
  if (row.expires_at && new Date(row.expires_at) < new Date()) {
    // expired; lazy delete
    try { db.prepare('DELETE FROM extraction_cache WHERE key = ?').run(hash); } catch {}
    return null;
  }
  try {
    return JSON.parse(row.value);
  } catch {
    return null;
  }
}

export function setCachedExtraction(hash: string, result: any, ttlSec = 60 * 60 * 24 * 30) {
  const expires = new Date(Date.now() + ttlSec * 1000).toISOString();
  const value = JSON.stringify(result);
  db.prepare('INSERT OR REPLACE INTO extraction_cache (key, value, expires_at) VALUES (?, ?, ?)').run(hash, value, expires);
}

export default { getCachedExtraction, setCachedExtraction };