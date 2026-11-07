import { useEffect, useState } from "react";
import { STATUSES, STATUS_LABEL, type Order, type OrderEvent } from "../../shared/orders";
import { api } from "./api";

const when = (iso: string) =>
  new Date(iso).toLocaleString(undefined, { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

type Props = {
  id: string;
  onClose: () => void;
  onChanged: (order: Order) => void;
  onDeleted: (id: string) => void;
};

export function OrderDetail({ id, onClose, onChanged, onDeleted }: Props) {
  const [order, setOrder] = useState<Order | null>(null);
  const [events, setEvents] = useState<OrderEvent[]>([]);
  const [notes, setNotes] = useState("");
  const [price, setPrice] = useState("");
  const [due, setDue] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let live = true;
    setOrder(null);
    api.order(id)
      .then(({ order, events }) => {
        if (!live) return;
        setOrder(order);
        setEvents(events);
        setNotes(order.notes ?? "");
        setPrice(order.price == null ? "" : String(order.price));
        setDue(order.due_date ?? "");
      })
      .catch((e) => live && setError(e.message));
    return () => { live = false; };
  }, [id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function patch(body: Record<string, unknown>) {
    setSaving(true);
    setError("");
    try {
      const { order: updated } = await api.update(id, body);
      setOrder(updated);
      onChanged(updated);
      const fresh = await api.order(id);
      setEvents(fresh.events);
      setSaved(true);
      setTimeout(() => setSaved(false), 1600);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!confirm("Delete this enquiry for good? This can't be undone.")) return;
    try {
      await api.remove(id);
      onDeleted(id);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  if (error && !order) return <aside className="detail"><p className="a-error">{error}</p></aside>;
  if (!order) return <aside className="detail"><p className="muted">Loading…</p></aside>;

  const dirty = notes !== (order.notes ?? "") || price !== (order.price == null ? "" : String(order.price)) || due !== (order.due_date ?? "");

  return (
    <aside className="detail" aria-label={`Enquiry from ${order.name}`}>
      <div className="detail-head">
        <div>
          <h2>{order.name}</h2>
          <p className="muted">{when(order.created_at)}</p>
        </div>
        <button className="icon-btn" onClick={onClose} aria-label="Close">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg>
        </button>
      </div>

      <div className="detail-contact">
        <a className="a-link" href={`mailto:${order.email}?subject=${encodeURIComponent(`Re: your LittleThreads enquiry (${order.type})`)}`}>{order.email}</a>
        <span className="pill">{order.type}</span>
      </div>

      <section className="detail-block">
        <h3>Their message</h3>
        <blockquote className="message">{order.message}</blockquote>
      </section>

      <section className="detail-block">
        <h3>Status</h3>
        <div className="status-row">
          {STATUSES.map((s) => (
            <button
              key={s}
              className={`status-chip s-${s}${order.status === s ? " on" : ""}`}
              disabled={saving}
              onClick={() => patch({ status: s })}
            >
              {STATUS_LABEL[s]}
            </button>
          ))}
        </div>
      </section>

      <section className="detail-block">
        <h3>Order</h3>
        <div className="a-field-row">
          <label className="a-field">
            <span>Price</span>
            <input type="number" min="0" step="1" value={price} placeholder="—" onChange={(e) => setPrice(e.target.value)} />
          </label>
          <label className="a-field">
            <span>Due date</span>
            <input type="date" value={due} onChange={(e) => setDue(e.target.value)} />
          </label>
        </div>
        <label className="a-field">
          <span>Private notes</span>
          <textarea rows={4} value={notes} placeholder="Thread colours, hoop size, anything to remember…" onChange={(e) => setNotes(e.target.value)} />
        </label>
        <div className="detail-actions">
          <button
            className="a-btn"
            disabled={!dirty || saving}
            onClick={() => patch({ notes, price: price === "" ? null : Number(price), due_date: due || null })}
          >
            {saving ? "Saving…" : saved ? "Saved ✓" : "Save changes"}
          </button>
          <button className="a-btn ghost danger" onClick={remove}>Delete</button>
        </div>
        {error && <p className="a-error">{error}</p>}
      </section>

      <section className="detail-block">
        <h3>History</h3>
        <ol className="timeline">
          {events.map((e) => (
            <li key={e.id}>
              <span className="t-dot" aria-hidden="true" />
              <div>
                <p>{e.detail || e.kind}</p>
                <span className="muted">{when(e.at)}</span>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </aside>
  );
}
