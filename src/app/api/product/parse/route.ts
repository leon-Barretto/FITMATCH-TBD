import { NextResponse } from "next/server";

function extractMeta(html: string, prop: string): string | undefined {
  const escaped = prop.replace(":", "\\:");
  const patterns = [
    new RegExp(`property="${escaped}"\\s+content="([^"]*)"`, "i"),
    new RegExp(`content="([^"]*)"\\s+property="${escaped}"`, "i"),
    new RegExp(`name="${escaped}"\\s+content="([^"]*)"`, "i"),
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m?.[1]) return m[1].trim();
  }
  return undefined;
}

function extractTitle(html: string): string | undefined {
  const m = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return m?.[1]?.trim() || undefined;
}

function parseUrl(url: string): { domain: string; slug: string } {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    const path = u.pathname;
    const slug =
      path
        .split("/")
        .filter(Boolean)
        .pop()
        ?.replace(/[-_]/g, " ")
        .replace(/\.[a-z0-9]+$/i, "") ?? "";
    return {
      domain: host.replace(/\.(com|co|io|net)$/i, "").replace(/\./g, " "),
      slug: slug || "product",
    };
  } catch {
    return { domain: "unknown", slug: "product" };
  }
}

function cleanTitle(title: string): string {
  return title
    .replace(/\s*\|\s*[^|]+\s*$/i, "")
    .replace(/\s*–\s*Official Store\s*$/i, "")
    .replace(/\s*-\s*Official Store\s*$/i, "")
    .trim();
}

export type ProductParseResponse = {
  brand: string;
  productName: string;
  title?: string;
  ogTitle?: string;
  ogSiteName?: string;
};

export async function POST(request: Request) {
  let body: { url?: string } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body. Provide { url: string }." },
      { status: 400 }
    );
  }

  const url = String(body?.url ?? "").trim();
  if (!url.startsWith("http")) {
    return NextResponse.json(
      { error: "Valid URL required." },
      { status: 400 }
    );
  }

  const fallback = parseUrl(url);
  const defaultBrand =
    fallback.domain.charAt(0).toUpperCase() + fallback.domain.slice(1).replace(/\s/g, "");
  const defaultProductName =
    fallback.slug.charAt(0).toUpperCase() + fallback.slug.slice(1);

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; FitMatch/1.0; +https://fitmatch.app)",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      return NextResponse.json({
        brand: defaultBrand,
        productName: defaultProductName,
        title: undefined,
        ogTitle: undefined,
        ogSiteName: undefined,
      });
    }

    const html = await res.text();
    const ogTitle = extractMeta(html, "og:title");
    const ogSiteName = extractMeta(html, "og:site_name");
    const ogBrand = extractMeta(html, "og:brand") || extractMeta(html, "product:brand");
    const title = extractTitle(html);

    const rawName = cleanTitle(ogTitle || title || defaultProductName);
    const brand = ogBrand || ogSiteName || defaultBrand;
    const productName = rawName || defaultProductName;

    const response: ProductParseResponse = {
      brand,
      productName,
      title: title || undefined,
      ogTitle: ogTitle || undefined,
      ogSiteName: ogSiteName || undefined,
    };

    return NextResponse.json(response);
  } catch {
    return NextResponse.json({
      brand: defaultBrand,
      productName: defaultProductName,
      title: undefined,
      ogTitle: undefined,
      ogSiteName: undefined,
    });
  }
}
