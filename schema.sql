-- LittleThreads D1 schema.
-- Apply locally:  npm run db:local
-- Apply to prod:  npm run db:remote

CREATE TABLE IF NOT EXISTS orders (
  id          TEXT PRIMARY KEY,
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL,
  name        TEXT NOT NULL,
  email       TEXT NOT NULL,
  type        TEXT NOT NULL,
  message     TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'new',
  price       REAL,
  due_date    TEXT,
  notes       TEXT,
  ip          TEXT
);
CREATE INDEX IF NOT EXISTS orders_status  ON orders(status);
CREATE INDEX IF NOT EXISTS orders_created ON orders(created_at DESC);

CREATE TABLE IF NOT EXISTS events (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id TEXT NOT NULL,
  at       TEXT NOT NULL,
  kind     TEXT NOT NULL,
  detail   TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS events_order ON events(order_id, id);

-- Rate-limit ledger: Workers have no shared memory, so attempts are counted here.
CREATE TABLE IF NOT EXISTS rate (
  bucket TEXT NOT NULL,
  ip     TEXT NOT NULL,
  at     TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS rate_lookup ON rate(bucket, ip, at);
