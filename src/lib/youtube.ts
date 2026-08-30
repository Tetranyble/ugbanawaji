export function youtubeEmbedUrl(value: string | null | undefined) {
  if (!value) return null;
  try {
    const url = new URL(value);
    let id = "";
    if (url.hostname === "youtu.be") id = url.pathname.slice(1).split("/")[0] || "";
    else if (["youtube.com", "www.youtube.com", "m.youtube.com", "music.youtube.com", "www.youtube-nocookie.com", "youtube-nocookie.com"].includes(url.hostname)) {
      if (url.pathname === "/watch") id = url.searchParams.get("v") || "";
      else if (url.pathname.startsWith("/embed/")) id = url.pathname.split("/")[2] || "";
      else if (url.pathname.startsWith("/shorts/")) id = url.pathname.split("/")[2] || "";
    }
    if (!/^[A-Za-z0-9_-]{6,20}$/.test(id)) return null;
    return `https://www.youtube-nocookie.com/embed/${id}`;
  } catch { return null; }
}
