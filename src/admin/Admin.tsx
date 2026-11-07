import { useCallback, useEffect, useState } from "react";
import { STATUS_LABEL, type Order, type Stats } from "../../shared/orders";
import { api } from "./api";
import { OrderDetail } from "./OrderDetail";
import "./admin.css";

const FILTERS = [
  { key: "active", label: "All open" },
  { key: "new", label: "New" },
  { key: "quoted", label: "Quoted" },
  { key: "in_progress", label: "Stitching" },
  { key: "shipped", label: "Shipped" },
  { key: "completed", label: "Completed" },
  { key: "archived", label: "Archived" },
];

const money = (n: number) => `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
const shortDate = (iso: string) => new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" });

/* ------------------------------- Sign in ------------------------------- */

function Login({ onDone, configured }: { onDone: () => void; configured: boolean }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api.login(password);
      onDone();
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="login-wrap">
      <form className="login" onSubmit={submit}>
        <img src="/logo-320.png" alt="" width="64" height="64" />
        <h1>Studio sign-in</h1>
        {configured ? (
          <>
            <p className="muted">Enter the studio password to see your orders.</p>
            <label className="a-field">
              <span>Password</span>
              <input type="password" autoFocus autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </label>
            {error && <p className="a-error">{error}</p>}
            <button className="a-btn" disabled={busy || !password}>{busy ? "Checking…" : "Sign in"}</button>
          </>
        ) : (
          <p className="a-error">Admin isn’t configured. Set <code>ADMIN_PASSWORD</code> in <code>.env</code> and restart the server.</p>
        )}
        <a className="a-link back" href="/">← Back to the website</a>
      </form>
    </div>
  );
}

/* -------------------------------- CRM -------------------------------- */

export default function Admin() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [configured, setConfigured] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [filter, setFilter] = useState("active");
  const [query, setQuery] = useState("");
  // ?order=<id> deep-links to one enquiry, so a link can be bookmarked or shared.
  const [selected, setSelected] = useState<string | null>(() => new URLSearchParams(window.location.search).get("order"));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.session()
      .then((s) => { setAuthed(s.authed); setConfigured(s.configured); })
      .catch(() => setAuthed(false));
  }, []);

  // Keep the URL in step with the open enquiry.
  useEffect(() => {
    const url = new URL(window.location.href);
    if (selected) url.searchParams.set("order", selected);
    else url.searchParams.delete("order");
    window.history.replaceState(null, "", url);
  }, [selected]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api.orders(filter, query);
      setOrders(data.orders);
      setStats(data.stats);
    } catch (e) {
      const err = e as Error & { status?: number };
      if (err.status === 401) setAuthed(false);
      else setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filter, query]);

  useEffect(() => {
    if (!authed) return;
    const t = setTimeout(load, query ? 250 : 0); // debounce typing
    return () => clearTimeout(t);
  }, [authed, load, query]);

  // Keep the list fresh while the tab is open.
  useEffect(() => {
    if (!authed) return;
    const t = setInterval(() => { if (!document.hidden) load(); }, 60_000);
    return () => clearInterval(t);
  }, [authed, load]);

  if (authed === null) return <div className="login-wrap"><p className="muted">Loading…</p></div>;
  if (!authed) return <Login configured={configured} onDone={() => setAuthed(true)} />;

  const tiles = stats
    ? [
        { label: "New enquiries", value: String(stats.counts.new), hint: "waiting on a reply" },
        { label: "In the hoop", value: String(stats.counts.in_progress), hint: "being stitched now" },
        { label: "Open value", value: money(stats.valueOpen), hint: "quoted and in progress" },
        { label: "Completed", value: money(stats.valueCompleted), hint: `${stats.counts.completed} finished pieces` },
      ]
    : [];

  return (
    <div className="admin">
      <header className="a-header">
        <a className="a-brand" href="/">
          <img src="/logo-320.png" alt="" width="36" height="36" />
          <span>LittleThreads <em>studio</em></span>
        </a>
        <div className="a-header-actions">
          <a className="a-btn ghost" href="/api/admin/export.csv">Export CSV</a>
          <button className="a-btn ghost" onClick={() => api.logout().then(() => setAuthed(false))}>Sign out</button>
        </div>
      </header>

      <main className="a-main">
        <section className="tiles">
          {tiles.map((t) => (
            <div className="tile" key={t.label}>
              <span className="tile-value">{t.value}</span>
              <span className="tile-label">{t.label}</span>
              <span className="tile-hint">{t.hint}</span>
            </div>
          ))}
        </section>

        <section className="toolbar">
          <div className="filters" role="tablist" aria-label="Filter orders">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                role="tab"
                aria-selected={filter === f.key}
                className={`filter${filter === f.key ? " on" : ""}`}
                onClick={() => setFilter(f.key)}
              >
                {f.label}
                {stats && f.key !== "active" && stats.counts[f.key as keyof typeof stats.counts] > 0 && (
                  <span className="count">{stats.counts[f.key as keyof typeof stats.counts]}</span>
                )}
              </button>
            ))}
          </div>
          <label className="search">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
            <input type="search" placeholder="Search name, email, message…" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search orders" />
          </label>
        </section>

        {error && <p className="a-error">{error}</p>}

        <div className={`workspace${selected ? " with-detail" : ""}`}>
          <div className="list" role="list">
            {!loading && orders.length === 0 && (
              <p className="empty">
                {query ? `Nothing matches “${query}”.` : "No orders here yet. New enquiries from the website land in this list."}
              </p>
            )}
            {orders.map((o) => (
              <button
                key={o.id}
                role="listitem"
                className={`row${selected === o.id ? " on" : ""}`}
                onClick={() => setSelected(o.id)}
              >
                <span className={`dot s-${o.status}`} aria-hidden="true" />
                <span className="row-main">
                  <span className="row-name">{o.name}</span>
                  <span className="row-msg">{o.message}</span>
                </span>
                <span className="row-meta">
                  <span className={`badge s-${o.status}`}>{STATUS_LABEL[o.status]}</span>
                  <span className="row-type">{o.type}</span>
                  <span className="muted">{shortDate(o.created_at)}{o.price != null ? ` · ${money(o.price)}` : ""}</span>
                </span>
              </button>
            ))}
          </div>

          {selected && (
            <OrderDetail
              id={selected}
              onClose={() => setSelected(null)}
              onChanged={(updated) => {
                setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
                load();
              }}
              onDeleted={(id) => {
                setSelected(null);
                setOrders((prev) => prev.filter((o) => o.id !== id));
                load();
              }}
            />
          )}
        </div>
      </main>
    </div>
  );
}
