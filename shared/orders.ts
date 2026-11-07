/** Order shapes and status vocabulary shared by the server and the admin UI. */

export const STATUSES = ["new", "quoted", "in_progress", "shipped", "completed", "archived"] as const;
export type Status = (typeof STATUSES)[number];

export const STATUS_LABEL: Record<Status, string> = {
  new: "New",
  quoted: "Quoted",
  in_progress: "Stitching",
  shipped: "Shipped",
  completed: "Completed",
  archived: "Archived",
};

/** Statuses that still need the studio to do something. */
export const OPEN_STATUSES: Status[] = ["new", "quoted", "in_progress"];

export type Order = {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  email: string;
  type: string;
  message: string;
  status: Status;
  price: number | null;
  due_date: string | null;
  notes: string | null;
};

export type OrderEvent = {
  id: number;
  order_id: string;
  at: string;
  kind: "created" | "status" | "note" | "edit";
  detail: string;
};

export type Stats = {
  counts: Record<Status, number>;
  total: number;
  open: number;
  valueOpen: number;
  valueCompleted: number;
};
