// navo Datenbank
// Postgres via Neon (kostenloses Tier).
// Schema wird beim Start automatisch angelegt, wenn es fehlt.

const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 5,
});

async function query(text, params) {
  return pool.query(text, params);
}

async function migrate() {
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id BIGSERIAL PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      paid BOOLEAN NOT NULL DEFAULT FALSE,
      paid_at TIMESTAMPTZ,
      stripe_session_id TEXT,
      initial_idea TEXT
    );
  `);
  await query(`
    CREATE TABLE IF NOT EXISTS messages (
      id BIGSERIAL PRIMARY KEY,
      user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
      content TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  await query(`
    CREATE INDEX IF NOT EXISTS idx_messages_user_created
      ON messages (user_id, created_at);
  `);
  await query(`
    CREATE TABLE IF NOT EXISTS login_tokens (
      token TEXT PRIMARY KEY,
      user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at TIMESTAMPTZ NOT NULL,
      used_at TIMESTAMPTZ
    );
  `);
  console.log("DB Migration OK.");
}

async function findOrCreateUser(email, extras = {}) {
  const normalized = email.trim().toLowerCase();
  const existing = await query("SELECT * FROM users WHERE email = $1", [normalized]);
  if (existing.rows.length > 0) return existing.rows[0];

  const insert = await query(
    `INSERT INTO users (email, initial_idea) VALUES ($1, $2) RETURNING *`,
    [normalized, extras.initial_idea || null]
  );
  return insert.rows[0];
}

async function markUserPaid(userId, stripeSessionId) {
  await query(
    `UPDATE users SET paid = TRUE, paid_at = NOW(), stripe_session_id = $1 WHERE id = $2`,
    [stripeSessionId, userId]
  );
}

async function getUserById(id) {
  const res = await query("SELECT * FROM users WHERE id = $1", [id]);
  return res.rows[0] || null;
}

async function getUserByEmail(email) {
  const res = await query("SELECT * FROM users WHERE email = $1", [email.trim().toLowerCase()]);
  return res.rows[0] || null;
}

async function addMessage(userId, role, content) {
  await query(
    `INSERT INTO messages (user_id, role, content) VALUES ($1, $2, $3)`,
    [userId, role, content]
  );
}

async function getMessages(userId, limit = 200) {
  const res = await query(
    `SELECT role, content, created_at FROM messages
     WHERE user_id = $1
     ORDER BY created_at ASC
     LIMIT $2`,
    [userId, limit]
  );
  return res.rows;
}

async function createLoginToken(userId, token, ttlMinutes = 20) {
  await query(
    `INSERT INTO login_tokens (token, user_id, expires_at)
     VALUES ($1, $2, NOW() + ($3 || ' minutes')::interval)`,
    [token, userId, String(ttlMinutes)]
  );
}

async function consumeLoginToken(token) {
  const res = await query(
    `SELECT lt.user_id, lt.expires_at, lt.used_at, u.paid
       FROM login_tokens lt
       JOIN users u ON u.id = lt.user_id
      WHERE lt.token = $1`,
    [token]
  );
  const row = res.rows[0];
  if (!row) return { ok: false, reason: "unknown" };
  if (row.used_at) return { ok: false, reason: "used" };
  if (new Date(row.expires_at) < new Date()) return { ok: false, reason: "expired" };
  await query("UPDATE login_tokens SET used_at = NOW() WHERE token = $1", [token]);
  return { ok: true, userId: row.user_id, paid: row.paid };
}

async function cleanupOldTokens() {
  await query(`DELETE FROM login_tokens WHERE expires_at < NOW() - INTERVAL '7 days'`);
}

if (require.main === module) {
  migrate().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
}

module.exports = {
  pool,
  query,
  migrate,
  findOrCreateUser,
  markUserPaid,
  getUserById,
  getUserByEmail,
  addMessage,
  getMessages,
  createLoginToken,
  consumeLoginToken,
  cleanupOldTokens,
};
