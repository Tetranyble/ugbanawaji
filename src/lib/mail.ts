import { Message, SMTPClient } from "emailjs";

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

function address(name: string, email: string) {
  const safeName = name.replace(/["\r\n]/g, "").trim();
  return safeName ? `"${safeName}" <${email}>` : email;
}

export async function sendMail(channel: Channel, input: MailInput) {
  const cfg = config(channel);
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
  if (cfg.mailer !== "smtp") {
    throw new Error(`Unsupported ${channel} mailer: ${cfg.mailer}. Use "log" or "smtp".`);
  }
  if (!cfg.host || !cfg.username || !cfg.password) {
    throw new Error(`${channel} SMTP delivery requires host, username, and password.`);
  }

  const client = new SMTPClient({
    host: cfg.host,
    port: cfg.port,
    user: cfg.username,
    password: cfg.password,
    ssl: cfg.scheme === "ssl" || cfg.port === 465,
    tls: cfg.scheme === "tls" && cfg.port !== 465,
    timeout: 30_000,
  });

  const message = new Message({
    ...input.headers,
    from: address(cfg.fromName, cfg.fromAddress),
    to: input.to,
    subject: input.subject,
    text: input.text,
    attachment: [
      { data: input.html, alternative: true, type: "text/html", charset: "utf-8" },
      ...(input.attachments ?? []).map((attachment) => ({
        path: attachment.path,
        name: attachment.filename,
        type: attachment.contentType,
        headers: { "Content-ID": `<${attachment.cid}>` },
      })),
    ],
  });

  try {
    const result = await client.sendAsync(message);
    const messageId = result instanceof Message ? result.header["message-id"] : result["message-id"];
    return { messageId: typeof messageId === "string" ? messageId : null };
  } finally {
    client.smtp.close();
  }
}
