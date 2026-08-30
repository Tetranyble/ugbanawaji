"use server";

import { randomUUID } from "crypto";
import { db } from "@/db";
import { contactMessages } from "@/db/schema";
import { contactSchema } from "@/lib/validation";
import { sendMail } from "@/lib/mail";
import { checkRateLimit } from "@/lib/rate-limit";
import { formWasFilledTooFast, isDisposableEmail } from "@/lib/spam";

export type ContactState = { ok: boolean; message: string };

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char] ?? char));
}

export async function submitContact(_: ContactState, formData: FormData): Promise<ContactState> {
  const parsed = contactSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    subject: formData.get("subject"),
    message: formData.get("message"),
    website: formData.get("website"),
  });

  if (!parsed.success) return { ok: false, message: "Please check the form and try again." };
  if (formWasFilledTooFast(formData.get("startedAt"))) return { ok: false, message: "Please take a moment and try again." };
  if (isDisposableEmail(parsed.data.email)) return { ok: false, message: "Please use a regular email address for professional enquiries." };
  try {
    const rate = await checkRateLimit("contact", 5, 15 * 60_000);
    if (!rate.allowed) return { ok: false, message: "Too many messages were submitted from this network. Please try again later." };
    const id = randomUUID();
    const email = parsed.data.email.toLowerCase();
    await db.insert(contactMessages).values({
      id,
      name: parsed.data.name,
      email,
      subject: parsed.data.subject || null,
      message: parsed.data.message,
      createdAt: new Date(),
      updatedAt: new Date(),
      readAt: null,
    });

    const recipient = process.env.MAIL_TO_ADDRESS || process.env.ADMIN_EMAIL;
    if (recipient) {
      try {
        const subject = parsed.data.subject ? `Portfolio message: ${parsed.data.subject}` : `Portfolio message from ${parsed.data.name}`;
        await sendMail("transactional", {
          to: recipient,
          subject,
          html: `<p><strong>From:</strong> ${escapeHtml(parsed.data.name)} &lt;${escapeHtml(email)}&gt;</p><p>${escapeHtml(parsed.data.message).replace(/\n/g, "<br>")}</p><p><small>Message ID: ${id}</small></p>`,
          text: `From: ${parsed.data.name} <${email}>\n\n${parsed.data.message}\n\nMessage ID: ${id}`,
        });
      } catch (mailError) {
        console.error("Contact notification email failed", mailError);
      }
    }

    return { ok: true, message: "Thanks — your message has been received." };
  } catch (error) {
    console.error("Contact form submission failed", error);
    return { ok: false, message: "The contact form is unavailable right now. Please email me directly instead." };
  }
}
