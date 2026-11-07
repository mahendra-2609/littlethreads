import { useState, type FormEvent } from "react";
import { SectionHead } from "./SectionHead";
import { delay } from "./Split";
import { Spray } from "./Motifs";

type Fields = { name: string; email: string; type: string; message: string; website: string };
type Errors = Partial<Record<keyof Fields, string>>;
type Status = { kind: "idle" } | { kind: "sending" } | { kind: "sent" } | { kind: "error"; message: string };

const TYPES = ["Custom hoop", "Name & birth hoop", "Pet or home portrait", "Wedding & anniversary", "Patches & accessories", "Something else"];

function validate(f: Fields): Errors {
  const e: Errors = {};
  if (!f.name.trim()) e.name = "Please tell us your name.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) e.email = "Please enter a valid email, like you@example.com.";
  if (f.message.trim().length < 10) e.message = "Add a little more detail (at least 10 characters).";
  return e;
}

export function Contact() {
  const [fields, setFields] = useState<Fields>({ name: "", email: "", type: TYPES[0], message: "", website: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof Fields, boolean>>>({});
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const set = (k: keyof Fields) => (e: { target: { value: string } }) => {
    const next = { ...fields, [k]: e.target.value };
    setFields(next);
    if (touched[k]) setErrors(validate(next));
  };
  const blur = (k: keyof Fields) => () => {
    setTouched((t) => ({ ...t, [k]: true }));
    setErrors(validate(fields));
  };

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const errs = validate(fields);
    setErrors(errs);
    setTouched({ name: true, email: true, message: true });
    const first = (Object.keys(errs) as (keyof Fields)[])[0];
    if (first) { document.getElementById(first)?.focus(); return; }

    setStatus({ kind: "sending" });
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        setStatus({ kind: "sent" });
        setFields({ name: "", email: "", type: TYPES[0], message: "", website: "" });
        setTouched({});
      } else if (data.fieldErrors) {
        setErrors(data.fieldErrors);
        setStatus({ kind: "idle" });
      } else {
        setStatus({ kind: "error", message: data.error ?? "Something went wrong. Please try again or email us directly." });
      }
    } catch {
      setStatus({ kind: "error", message: "We couldn’t reach the server. Please check your connection or email us directly." });
    }
  }

  const err = (k: keyof Fields) => (touched[k] || status.kind !== "idle") && errors[k];

  return (
    <section className="section contact" id="contact">
      <div className="container">
        <SectionHead num="06" kicker="Say hello" lines={["Tell us what you’d", "like stitched."]} />
        <div className="contact-grid">
          <div className="contact-side reveal-group">
            <p className="sec-intro reveal">Send a few details and we’ll reply within two days with ideas, a quote and an estimated finish date.</p>
            <dl className="contact-details">
              <div className="reveal" style={delay(1, 120)}><dt>Email</dt><dd><a href="mailto:tejaswiande029@gmail.com">tejaswiande029@gmail.com</a></dd></div>
              <div className="reveal" style={delay(2, 120)}><dt>Instagram</dt><dd><a href="https://instagram.com/little_threadstudio17" target="_blank" rel="noreferrer">@little_threadstudio17</a></dd></div>
              <div className="reveal" style={delay(3, 120)}><dt>Studio hours</dt><dd>Mon – Fri, 9am – 5pm</dd></div>
            </dl>
            <div className="contact-spray" aria-hidden="true"><Spray /></div>
          </div>

          {status.kind === "sent" ? (
            <div className="contact-form form-done reveal in" role="status">
              <span className="kicker">Sent</span>
              <h3>Thank you.</h3>
              <p>Your message is on its way. We’ll be in touch within two days.</p>
              <button type="button" className="btn btn-ghost" onClick={() => setStatus({ kind: "idle" })}>Send another</button>
            </div>
          ) : (
            <form className="contact-form reveal-group" onSubmit={onSubmit} noValidate>
              <div className="field-row">
                <div className="field" style={delay(0, 140)}>
                  <label htmlFor="name">Your name</label>
                  <input id="name" name="name" type="text" autoComplete="name" required value={fields.name} onChange={set("name")} onBlur={blur("name")}
                    aria-invalid={!!err("name")} aria-describedby={err("name") ? "name-error" : undefined} />
                  {err("name") && <p className="error" id="name-error">{errors.name}</p>}
                </div>
                <div className="field" style={delay(1, 140)}>
                  <label htmlFor="email">Email</label>
                  <input id="email" name="email" type="email" autoComplete="email" required value={fields.email} onChange={set("email")} onBlur={blur("email")}
                    aria-invalid={!!err("email")} aria-describedby={err("email") ? "email-error" : undefined} />
                  {err("email") && <p className="error" id="email-error">{errors.email}</p>}
                </div>
              </div>
              <div className="field" style={delay(2, 140)}>
                <label htmlFor="type">What are you interested in?</label>
                <select id="type" name="type" value={fields.type} onChange={set("type")}>
                  {TYPES.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="field" style={delay(3, 140)}>
                <label htmlFor="message">Tell us about your idea</label>
                <textarea id="message" name="message" rows={4} required value={fields.message} onChange={set("message")} onBlur={blur("message")}
                  placeholder="Names, dates, colours, occasion — anything helps."
                  aria-invalid={!!err("message")} aria-describedby={err("message") ? "message-error" : undefined} />
                {err("message") && <p className="error" id="message-error">{errors.message}</p>}
              </div>
              <div className="hp" aria-hidden="true">
                <label htmlFor="website">Website</label>
                <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" value={fields.website} onChange={set("website")} />
              </div>
              <div className="form-foot reveal" style={delay(4, 140)}>
                <button type="submit" className="btn btn-primary" disabled={status.kind === "sending"}>
                  {status.kind === "sending" ? "Sending…" : "Send my request"}
                </button>
                <span className="cta-note">We never share your details.</span>
              </div>
              {status.kind === "error" && <p className="error form-error" role="alert">{status.message}</p>}
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
