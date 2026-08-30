/**
 * Fetch the public text of a LinkedIn (or any professional) profile URL.
 * Uses the Firecrawl connector when available.
 *
 * LinkedIn aggressively blocks crawlers on most profiles, so callers must
 * always be able to fall back to "paste your profile text instead".
 */
export class ScrapeUnavailableError extends Error {}

export function normalizeProfileUrl(raw: string): string {
  let url = raw.trim();
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
  const u = new URL(url);
  u.hash = "";
  u.search = "";
  return u.toString();
}

export async function scrapeProfileMarkdown(rawUrl: string): Promise<string> {
  const url = normalizeProfileUrl(rawUrl);
  const fcKey = process.env["FIRECRAWL_API_KEY"];
  const lovableKey = process.env["LOVABLE_API_KEY"];

  if (!fcKey) {
    throw new ScrapeUnavailableError(
      "URL import isn't available yet. Open your profile, choose “Save to PDF”, and upload that file — or paste your profile text instead.",
    );
  }

  const isGateway = fcKey.startsWith("lovc_");
  const endpoint = isGateway
    ? "https://connector-gateway.lovable.dev/firecrawl/v2/scrape"
    : "https://api.firecrawl.dev/v2/scrape";

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (isGateway) {
    if (!lovableKey) throw new ScrapeUnavailableError("URL import is misconfigured. Please upload a PDF instead.");
    headers["Authorization"] = `Bearer ${lovableKey}`;
    headers["X-Connection-Api-Key"] = fcKey;
  } else {
    headers["Authorization"] = `Bearer ${fcKey}`;
  }

  const res = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify({ url, formats: ["markdown"], onlyMainContent: true, waitFor: 2500 }),
  });

  const bodyText = await res.text();
  if (!res.ok) {
    console.error(`profile scrape failed [${res.status}]: ${bodyText}`);
    throw new ScrapeUnavailableError(
      "That profile couldn't be read (LinkedIn blocks most automated reads). Upload your “Save to PDF” export or paste your profile text instead.",
    );
  }

  let json: any;
  try { json = JSON.parse(bodyText); } catch { json = null; }
  const markdown: string | undefined = json?.markdown ?? json?.data?.markdown;

  const cleaned = (markdown ?? "").replace(/\n{3,}/g, "\n\n").trim();
  if (cleaned.length < 300 || /sign in|join linkedin to see/i.test(cleaned.slice(0, 400))) {
    throw new ScrapeUnavailableError(
      "That profile appears to be private or login-walled. Upload your “Save to PDF” export or paste your profile text instead.",
    );
  }
  return cleaned.slice(0, 40000);
}
