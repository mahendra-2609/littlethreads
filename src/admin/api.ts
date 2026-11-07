import type { Order, OrderEvent, Stats } from "../../shared/orders";

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    credentials: "same-origin",
    headers: init?.body ? { "Content-Type": "application/json" } : undefined,
    ...init,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.ok === false) {
    const err = new Error(data.error ?? `Request failed (${res.status})`) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }
  return data as T;
}

export const api = {
  session: () => request<{ authed: boolean; configured: boolean }>("/api/admin/session"),
  login: (password: string) => request("/api/admin/login", { method: "POST", body: JSON.stringify({ password }) }),
  logout: () => request("/api/admin/logout", { method: "POST" }),
  orders: (status: string, q: string) =>
    request<{ orders: Order[]; stats: Stats }>(`/api/admin/orders?status=${encodeURIComponent(status)}&q=${encodeURIComponent(q)}`),
  order: (id: string) => request<{ order: Order; events: OrderEvent[] }>(`/api/admin/orders/${id}`),
  update: (id: string, patch: Record<string, unknown>) =>
    request<{ order: Order; stats: Stats }>(`/api/admin/orders/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
  remove: (id: string) => request<{ stats: Stats }>(`/api/admin/orders/${id}`, { method: "DELETE" }),
};
