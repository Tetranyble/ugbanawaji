import { syncMixpanelEvents } from "@/lib/mixpanel-sync";

export async function POST(request: Request) {
  const configured = process.env.SCHEDULER_CRON_SECRET;
  const supplied = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!configured || supplied !== configured) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    return Response.json(await syncMixpanelEvents());
  } catch (error) {
    console.error("analytics sync failed", error);
    return Response.json({ error: error instanceof Error ? error.message : "Analytics sync failed" }, { status: 500 });
  }
}
