import { MetadataRoute } from "next";

const BASE_URL = "https://tranquillo.green";

const staticPaths = [
  "",
  "/pricing",
  "/contact",
  "/calculator",
  "/leads",
  "/ads/landing",
  "/tools/280e-calculator",
  "/tools/cogs-allocator",
  "/compare/quickbooks-vs-tranquillo-green",
  "/compare/cannabis-accounting-software",
  "/cannabis-accounting",
  "/280e-guide",
  "/cpa-partners",
  "/case-studies",
  "/blog",
  "/blog/cannabis-cogs-allocation-guide",
  "/blog/metrc-reconciliation-guide",
  "/blog/280e-vs-471c-cannabis",
  "/blog/cannabis-month-end-close-checklist",
  "/blog/cannabis-audit-preparation-guide",
  "/blog/cannabis-cpa-firm-growth",
  "/blog/white-label-cannabis-accounting",
  "/blog/280e-rescheduling-2026",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return staticPaths.map((path) => ({
    url: `${BASE_URL}${path}`,
    lastModified: now,
    changeFrequency: path === "" ? "weekly" : path.startsWith("/blog/") ? "weekly" : "monthly",
    priority: path === "" ? 1.0 : path.startsWith("/tools/") ? 0.9 : path.startsWith("/compare/") ? 0.8 : path.startsWith("/blog/") ? 0.7 : 0.6,
  }));
}
