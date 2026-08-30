import sanitizeHtml from "sanitize-html";

const allowedTags = [
  ...sanitizeHtml.defaults.allowedTags,
  "h1", "h2", "h3", "h4", "h5", "h6", "img", "figure", "figcaption",
  "iframe", "pre", "code", "table", "thead", "tbody", "tfoot", "tr", "th", "td",
];

export function sanitizePostHtml(input: string) {
  return sanitizeHtml(input, {
    allowedTags,
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      a: ["href", "name", "target", "rel"],
      img: ["src", "alt", "title", "width", "height", "loading"],
      iframe: ["src", "width", "height", "allowfullscreen", "frameborder", "allow", "loading"],
      code: ["class"],
      pre: ["class"],
      th: ["colspan", "rowspan", "scope"],
      td: ["colspan", "rowspan"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    allowedIframeHostnames: ["www.youtube.com", "www.youtube-nocookie.com", "youtube-nocookie.com", "youtube.com"],
    transformTags: {
      a: (tagName, attribs) => ({
        tagName,
        attribs: { ...attribs, rel: "noopener noreferrer", target: attribs.target || "_blank" },
      }),
      iframe: (tagName, attribs) => ({
        tagName,
        attribs: { ...attribs, loading: "lazy" },
      }),
    },
  });
}

export function stripHtml(input: string) {
  return sanitizeHtml(input, { allowedTags: [], allowedAttributes: {} })
    .replace(/\s+/g, " ")
    .trim();
}

function absoluteWebUrl(value: string | undefined, baseUrl?: string) {
  if (!value || !baseUrl || !value.startsWith("/")) return value;
  try { return new URL(value, baseUrl).toString(); } catch { return value; }
}

function safeEmailImageUrl(value: string | undefined, baseUrl?: string) {
  if (!value) return undefined;
  if (value.startsWith("/") && !baseUrl) return value;
  const resolved = absoluteWebUrl(value, baseUrl) ?? value;
  try {
    const url = new URL(resolved);
    const localHttp = url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname);
    return url.protocol === "https:" || localHttp ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

export function sanitizeNewsletterHtml(input: string, baseUrl?: string) {
  return sanitizeHtml(input, {
    allowedTags: ["p","br","strong","em","u","s","a","ul","ol","li","h1","h2","h3","blockquote","code","pre","img","hr","table","thead","tbody","tr","th","td"],
    allowedAttributes: { a: ["href","target","rel"], img: ["src","alt","title","width","height","style"] },
    allowedSchemes: ["http","https","mailto"],
    transformTags: {
      a: (tagName, attribs) => {
        const href = absoluteWebUrl(attribs.href, baseUrl);
        return { tagName, attribs: { ...attribs, ...(href ? { href } : {}), rel: "noopener noreferrer", target: "_blank" } };
      },
      img: (tagName, attribs) => {
        const src = safeEmailImageUrl(attribs.src, baseUrl);
        if (!src) {
          return {
            tagName,
            attribs: {
              alt: attribs.alt?.trim() || "Image unavailable",
              style: "display:block;max-width:100%;height:auto;border:0;margin:20px auto;",
            },
          };
        }
        return {
          tagName,
          attribs: {
            ...attribs,
            src,
            alt: attribs.alt?.trim() || "Newsletter image",
            style: "display:block;max-width:100%;height:auto;border:0;margin:20px auto;",
          },
        };
      },
    },
  });
}
