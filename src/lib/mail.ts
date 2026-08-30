import nodemailer from "nodemailer";

type Channel = "transactional" | "newsletter";

export type MailAttachment = {
  filename: string;
  path: string;
  cid: string;
  contentType?: string;
};

type MailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  headers?: Record<string, string>;
  attachments?: MailAttachment[];
};

function config(channel: Channel) {
  const newsletter = channel === "newsletter";
  const get = (key: string) =>
    process.env[newsletter ? `NEWSLETTER_MAIL_${key}` : `MAIL_${key}`] || "";

  return {
    // NEWSLETTER_MAILER predates the NEWSLETTER_MAIL_* namespace and is
    // intentionally retained for deployment compatibility.
    mailer: ((newsletter ? process.env.NEWSLETTER_MAILER : process.env.MAIL_MAILER) || "log").toLowerCase(),
    host: get("HOST"),
    port: Number(get("PORT") || 587),
    scheme: (get("SCHEME") || "tls").toLowerCase(),
    username: get("USERNAME"),
    password: get("PASSWORD"),
    fromAddress: get("FROM_ADDRESS") || process.env.MAIL_FROM_ADDRESS || "u.ekenekiso@ugbanawaji.com",
    fromName: get("FROM_NAME") || process.env.MAIL_FROM_NAME || "Ekenekiso Ugbanawaji",
  };
}

export async function sendMail(channel: Channel, input: MailInput) {
  const cfg = config(channel);
  if (channel === "newsletter" && /(zoho|zeptomail)/i.test(cfg.host)) {
    throw new Error("Newsletter delivery is intentionally blocked for Zoho Mail/ZeptoMail. Configure NEWSLETTER_MAIL_* with a bulk-capable or self-hosted SMTP transport.");
  }
  if (cfg.mailer === "log") {
    console.info(`[mail:${channel}]`, {
      to: input.to,
      subject: input.subject,
      text: input.text || undefined,
      html: input.text ? undefined : input.html,
      attachments: input.attachments?.map(({ filename, cid }) => ({ filename, cid })),
    });
    return { messageId: `log-${Date.now()}` };
  }
  const transporter = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.scheme === "ssl" || cfg.port === 465,
    auth: cfg.username ? { user: cfg.username, pass: cfg.password } : undefined,
    requireTLS: cfg.scheme === "tls",
  });
  return transporter.sendMail({
    from: { address: cfg.fromAddress, name: cfg.fromName },
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
    headers: input.headers,
    attachments: input.attachments,
  });
}
