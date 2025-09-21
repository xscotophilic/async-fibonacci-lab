require("dotenv").config();

const fs = require("fs");
const path = require("path");


const { Pool } = require("pg");

const connectionString = process.env.POSTGRES_URL;
if (!connectionString) {
  throw new Error(
    "POSTGRES_URL is required but not set. Example: postgres://user:pass@host:5432/db?sslmode=disable"
  );
}

const pgClient = new Pool({ connectionString });

const MIGRATIONS_DIR = path.resolve(__dirname, "./sql");

function loadMigrations() {
  if (!fs.existsSync(MIGRATIONS_DIR)) return [];
  const files = fs.readdirSync(MIGRATIONS_DIR);
  const versions = new Map();

  for (const f of files) {
    const m = /^(\d+)_.*\.(up|down)\.sql$/.exec(f);
    if (!m) continue;
    const [ , v, kind ] = m;
    const entry = versions.get(v) || { version: v };
    entry[kind] = path.join(MIGRATIONS_DIR, f);
    versions.set(v, entry);
  }
  return [...versions.values()].sort((a,b) => a.version.localeCompare(b.version));
}

async function ensureTable() {
  await pgClient.query(`CREATE TABLE IF NOT EXISTS schema_migrations(
    version TEXT PRIMARY KEY,
    applied_at TIMESTAMPTZ DEFAULT now()
  )`);
}

async function appliedVersions() {
  const { rows } = await pgClient.query("SELECT version FROM schema_migrations ORDER BY version");
  return new Set(rows.map(r => r.version));
}

async function runInTx(fn) {
  await pgClient.query("BEGIN");
  try { await fn(); await pgClient.query("COMMIT"); }
  catch (e) { await pgClient.query("ROLLBACK"); throw e; }
}

async function up() {
  await ensureTable();
  const done = await appliedVersions();
  for (const m of loadMigrations()) {
    if (done.has(m.version)) continue;
    if (!m.up) throw new Error(`Missing .up.sql for ${m.version}`);

    await runInTx(async () => {
      await pgClient.query(fs.readFileSync(m.up, "utf8"));
      await pgClient.query("INSERT INTO schema_migrations VALUES($1)", [m.version]);
    });
    console.log(`applied ${path.basename(m.up)}`);
  }
}

async function down() {
  await ensureTable();
  const { rows } = await pgClient.query("SELECT version FROM schema_migrations ORDER BY version DESC LIMIT 1");
  if (!rows.length) return console.log("no migrations to revert");

  const v = rows[0].version;
  const m = loadMigrations().find(x => x.version === v);
  if (!m?.down) throw new Error(`Missing .down.sql for ${v}`);

  await runInTx(async () => {
    await pgClient.query(fs.readFileSync(m.down, "utf8"));
    await pgClient.query("DELETE FROM schema_migrations WHERE version=$1", [v]);
  });
  console.log(`reverted ${path.basename(m.down)}`);
}

async function status() {
  await ensureTable();
  const done = await appliedVersions();
  for (const m of loadMigrations()) {
    const name = m.up ? path.basename(m.up) : `${m.version}_<missing>.up.sql`;
    console.log(`${m.version}\t${done.has(m.version) ? "APPLIED" : "PENDING"}\t${name}`);
  }
}

(async () => {
  const cmd = process.argv[2] || "status";
  try {
    if (cmd === "up") await up();
    else if (cmd === "down") await down();
    else await status();
  } catch (e) {
    console.error(e);
    process.exit(1);
  } finally {
    await pgClient.end().catch(() => {});
  }
})();
