import { processNewsletterBatch } from "@/lib/newsletter";

async function run(request: Request) {
  const configured = process.env.NEWSLETTER_CRON_SECRET;
  const supplied = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || new URL(request.url).searchParams.get("secret");
  if (!configured || supplied !== configured) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try { return Response.json(await processNewsletterBatch()); }
  catch (error) { console.error("newsletter worker failed", error); return Response.json({ error: error instanceof Error ? error.message : "Newsletter worker failed" }, { status: 500 }); }
}
export const GET = run;
export const POST = run;
