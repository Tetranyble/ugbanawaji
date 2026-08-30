"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#f7f7f9", color: "#17171b", fontFamily: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" }}>
        <main style={{ minHeight: "70vh", display: "grid", placeItems: "center", padding: "48px 20px" }}>
          <section style={{ width: "min(100%, 680px)", border: "1px solid #e4e4e7", borderRadius: 20, background: "#ffffff", padding: "clamp(28px, 6vw, 52px)" }}>
            <div style={{ width: 44, height: 4, borderRadius: 999, background: "#ff014f", marginBottom: 28 }} />
            <p style={{ margin: 0, fontSize: 12, fontWeight: 800, letterSpacing: ".14em", textTransform: "uppercase", color: "#71717a" }}>Unexpected error</p>
            <h1 style={{ margin: "12px 0 0", fontSize: "clamp(32px, 7vw, 52px)", lineHeight: 1.05, letterSpacing: "-.04em" }}>The site could not complete that request.</h1>
            <p style={{ margin: "20px 0 0", maxWidth: 560, color: "#61616b", fontSize: 16, lineHeight: 1.7 }}>Retry once. If the problem persists, you can return later or contact u.ekenekiso@ugbanawaji.com.</p>
            <button type="button" onClick={reset} style={{ marginTop: 28, border: 0, borderRadius: 12, background: "#ff014f", color: "#fff", padding: "12px 18px", fontSize: 14, fontWeight: 800, cursor: "pointer" }}>Try again</button>
          </section>
        </main>
      </body>
    </html>
  );
}
