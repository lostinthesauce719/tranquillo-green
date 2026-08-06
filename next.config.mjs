/** @type {import("next").NextConfig} */

const isProd = process.env.NODE_ENV === "production";

// Clerk serves its frontend SDK from the instance domain; Convex is reached
// over HTTPS and WebSocket. Everything else is same-origin: next/font
// self-hosts at build time, and there are no third-party script tags.
const CLERK = "https://*.clerk.accounts.dev https://*.clerk.com";
const CONVEX = "https://*.convex.cloud wss://*.convex.cloud";
const STRIPE = "https://js.stripe.com https://hooks.stripe.com";

const csp = [
  "default-src 'self'",
  // 'unsafe-inline' is required by Next's inline bootstrap and Clerk's SDK.
  // 'unsafe-eval' is only tolerated outside production (React Fast Refresh).
  `script-src 'self' 'unsafe-inline'${isProd ? "" : " 'unsafe-eval'"} ${CLERK} ${STRIPE}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  `connect-src 'self' ${CONVEX} ${CLERK}`,
  `frame-src 'self' ${CLERK} ${STRIPE}`,
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  // Report-Only first: this policy has never run against live Clerk traffic,
  // and a wrong directive here would break sign-in for every user. Watch the
  // browser console on the auth and dashboard routes, then promote the header
  // name to "Content-Security-Policy" once it reports clean.
  { key: "Content-Security-Policy-Report-Only", value: csp },
];

if (isProd) {
  securityHeaders.push({
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  });
}

const nextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        // Applies to every response, including HTML documents — previously
        // these headers only reached JSON API responses.
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
