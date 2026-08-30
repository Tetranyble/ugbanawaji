export const dynamic = "force-dynamic";

export function GET() {
  const expires = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString();
  const body = [
    "Contact: mailto:u.ekenekiso@ugbanawaji.com",
    "Preferred-Languages: en",
    "Canonical: https://ugbanawaji.com/.well-known/security.txt",
    "Policy: https://ugbanawaji.com/security",
    `Expires: ${expires}`,
  ].join("\n") + "\n";
  return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=86400" } });
}
