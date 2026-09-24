"use server";

import { randomUUID } from "crypto";
import { db } from "@/db";
import { contactMessages } from "@/db/schema";
import { contactSchema } from "@/lib/validation";
import { sendMail } from "@/lib/mail";
import { checkRateLimit } from "@/lib/rate-limit";
import { formWasFilledTooFast, isDisposableEmail } from "@/lib/spam";
import { getSitePage } from "@/lib/data";
import { itemValue } from "@/lib/page-content";

export type ContactState = { ok: boolean; message: string };

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char] ?? char));
}

export async function submitContact(_: ContactState, formData: FormData): Promise<ContactState> {
  const page = await getSitePage("home");
  const copy = page?.sectionMap.contact;
  const message = (key: string) => itemValue(copy, key);
  const parsed = contactSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    subject: formData.get("subject"),
    message: formData.get("message"),
    website: formData.get("website"),
  });

  if (!parsed.success) return { ok: false, message: message("serverInvalid") };
  if (formWasFilledTooFast(formData.get("startedAt"))) return { ok: false, message: message("serverTooFast") };
  if (isDisposableEmail(parsed.data.email)) return { ok: false, message: message("serverDisposable") };
  try {
    const rate = await checkRateLimit("contact", 5, 15 * 60_000);
    if (!rate.allowed) return { ok: false, message: message("serverRateLimited") };
    const id = randomUUID();
    const email = parsed.data.email.toLowerCase();
    await db.insert(contactMessages).values({ id, name: parsed.data.name, email, subject: parsed.data.subject || null, message: parsed.data.message, createdAt: new Date(), updatedAt: new Date(), readAt: null });

    const recipient = process.env.MAIL_TO_ADDRESS || process.env.ADMIN_EMAIL;
    if (recipient) {
      try {
        const subject = parsed.data.subject
          ? message("mailSubjectWithSubject").replace("{subject}", parsed.data.subject)
          : message("mailSubjectWithoutSubject").replace("{name}", parsed.data.name);
        await sendMail("transactional", {
          to: recipient,
          subject,
          html: `<p><strong>${escapeHtml(message("mailFromLabel"))}:</strong> ${escapeHtml(parsed.data.name)} &lt;${escapeHtml(email)}&gt;</p><p>${escapeHtml(parsed.data.message).replace(/\n/g, "<br>")}</p><p><small>${escapeHtml(message("mailMessageIdLabel"))}: ${id}</small></p>`,
          text: `${message("mailFromLabel")}: ${parsed.data.name} <${email}>\n\n${parsed.data.message}\n\n${message("mailMessageIdLabel")}: ${id}`,
        });
      } catch (mailError) { console.error("Contact notification email failed", mailError); }
    }
    return { ok: true, message: message("serverSuccess") };
  } catch (error) {
    console.error("Contact form submission failed", error);
    return { ok: false, message: message("serverUnavailable") };
  }
}
