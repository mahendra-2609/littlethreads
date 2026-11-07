import { z } from "zod";

/** Contact-form validation, shared by the Express dev server and the Cloudflare Pages Function. */
export const ContactSchema = z.object({
  name: z.string().trim().min(1, "Please tell us your name.").max(120),
  email: z.string().trim().email("Please enter a valid email address.").max(200),
  type: z.string().trim().max(80).default("Custom hoop"),
  message: z.string().trim().min(10, "Add a little more detail (at least 10 characters).").max(4000),
  // honeypot — real users never fill this in
  website: z.string().max(0).optional(),
});
export type ContactInput = z.infer<typeof ContactSchema>;

export function fieldErrorsFrom(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

export function formatEnquiry(input: ContactInput, meta: { ip: string; at: string }) {
  return {
    subject: `New enquiry: ${input.type} — ${input.name}`,
    text: [
      `Name: ${input.name}`,
      `Email: ${input.email}`,
      `Interested in: ${input.type}`,
      "",
      input.message,
      "",
      `— sent ${meta.at} from ${meta.ip}`,
    ].join("\n"),
  };
}
