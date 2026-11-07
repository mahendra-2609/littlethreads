import { ContactSchema, fieldErrorsFrom, formatEnquiry } from "../../shared/contact";
import { createOrder } from "../_lib/db";
import { throttled } from "../_lib/auth";
import { clientIp, fail, ok, type Env } from "../_lib/http";

/** POST /api/contact — saves the enquiry as an order, then tries to email a notification. */
export const onRequestPost: PagesFunction<Env> = async ({ request, env, waitUntil }) => {
  const ip = clientIp(request);
  if (await throttled(env.DB, "contact", ip, 5, 10 * 60_000)) {
    return fail("Too many messages — please try again in a few minutes.", 429);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail("Invalid request.");
  }

  const parsed = ContactSchema.safeParse(body);
  if (!parsed.success) return fail("Please check the form.", 400, { fieldErrors: fieldErrorsFrom(parsed.error) });
  if (parsed.data.website) return ok(); // bot tripped the honeypot

  const order = await createOrder(env.DB, { ...parsed.data, ip });

  // Email is a best-effort extra; the saved order is the record that matters.
  if (env.RESEND_API_KEY) {
    const { subject, text } = formatEnquiry(parsed.data, { ip, at: order.created_at });
    waitUntil(
      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, "content-type": "application/json" },
        body: JSON.stringify({
          from: env.CONTACT_FROM ?? "LittleThreads <onboarding@resend.dev>",
          to: [env.CONTACT_TO ?? "tejaswiande029@gmail.com"],
          reply_to: `${parsed.data.name} <${parsed.data.email}>`,
          subject,
          text,
        }),
      })
        .then(async (r) => { if (!r.ok) console.error("[contact] Resend", r.status, await r.text()); })
        .catch((e) => console.error("[contact] Resend failed", e)),
    );
  }

  return ok();
};
