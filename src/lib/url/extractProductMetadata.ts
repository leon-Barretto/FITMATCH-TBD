export type ProductMetadata = {
  productName: string;
  brand?: string;
  price?: string;
  /** Meta description or product page copy for bias analysis */
  pageDescription?: string;
};

function extractMeta(html: string, selector: "og:title" | "og:brand" | "product:price:amount" | "og:description"): string | undefined {
  const props: Record<string, string> = {
    "og:title": 'property="og:title" content="([^"]*)"',
    "og:brand": 'property="og:brand" content="([^"]*)"',
    "product:price:amount": 'property="product:price:amount" content="([^"]*)"',
    "og:description": 'property="og:description" content="([^"]*)"',
  };
  const re = new RegExp(props[selector], "i");
  const m = html.match(re);
  return m?.[1]?.trim() || undefined;
}

function extractMetaDescription(html: string): string | undefined {
  const m = html.match(/<meta\s+name="description"\s+content="([^"]*)"/i);
  return m?.[1]?.trim() || undefined;
}

function extractTitle(html: string): string | undefined {
  const m = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return m?.[1]?.trim() || undefined;
}

function cleanTitle(title: string): string {
  return title
    .replace(/\s*\|\s*[^|]+\s*$/i, "")
    .replace(/\s*–\s*Official Store\s*$/i, "")
    .replace(/\s*-\s*Official Store\s*$/i, "")
    .replace(/\s*\|[^|]*$/g, "")
    .trim();
}

function parseUrl(url: string): { domain: string; slug: string } {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    const path = u.pathname;
    const slug = path
      .split("/")
      .filter(Boolean)
      .pop()
      ?.replace(/[-_]/g, " ")
      .replace(/\.[a-z0-9]+$/i, "") ?? "";
    return { domain: host.replace(".com", "").replace(".co", ""), slug };
  } catch {
    return { domain: "unknown", slug: "product" };
  }
}

/**
 * Fetch HTML from URL and extract product metadata.
 * Fallback: domain as brand, URL slug as productName if extraction fails.
 */
export async function extractProductMetadata(url: string): Promise<ProductMetadata> {
  const fallback = parseUrl(url);
  const defaultName = fallback.slug || fallback.domain || "Product";
  const defaultBrand = fallback.domain.charAt(0).toUpperCase() + fallback.domain.slice(1);

  if (!url.startsWith("http")) {
    return {
      productName: defaultName,
      brand: defaultBrand,
    };
  }

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; FitMatch/1.0; +https://fitmatch.app)",
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      return {
        productName: defaultName,
        brand: defaultBrand,
      };
    }

    const html = await res.text();
    const ogTitle = extractMeta(html, "og:title");
    const title = extractTitle(html);
    const brand = extractMeta(html, "og:brand");
    const price = extractMeta(html, "product:price:amount");
    const pageDescription = extractMeta(html, "og:description") || extractMetaDescription(html);

    const rawName = cleanTitle(ogTitle || title || defaultName);

    return {
      productName: rawName || defaultName,
      brand: brand || defaultBrand,
      price: price || undefined,
      pageDescription: pageDescription?.slice(0, 500),
    };
  } catch {
    return {
      productName: defaultName,
      brand: defaultBrand,
    };
  }
}
