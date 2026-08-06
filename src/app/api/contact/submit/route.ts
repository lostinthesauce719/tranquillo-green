import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedConvexClient } from "@/lib/data/convex-client";
import { rateLimitDurable } from "@/lib/rate-limit";
import { anyApi } from "convex/server";

function sanitizeString(value: unknown, maxLen: number = 256): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > maxLen) return undefined;
  return trimmed;
}

function sanitizeEmail(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return undefined;
  return trimmed;
}

function sanitizeNumber(value: unknown): number | undefined {
  if (typeof value === "number" && !isNaN(value) && isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = parseFloat(value);
    if (!isNaN(parsed) && isFinite(parsed)) return parsed;
  }
  return undefined;
}


export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Sanitize and validate inputs
    const name = sanitizeString(body.name, 256);
    const email = sanitizeEmail(body.email);
    const message = sanitizeString(body.message, 5000);
    const inquiryType = sanitizeString(body.inquiryType, 32);
    const company = sanitizeString(body.company, 256);
    const phone = sanitizeString(body.phone, 32);
    const operatorType = sanitizeString(body.operatorType, 32);
    const state = sanitizeString(body.state, 2);
    const clientCount = sanitizeString(body.clientCount, 16);

    // Rate limit: 5 submissions per minute per IP
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const rl = await rateLimitDurable(`contact:${ip}`, 5, 60_000);
    if (!rl.allowed) {
      return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
    }

    if (!name || !email || !message || !inquiryType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!["demo", "cpa", "general"].includes(inquiryType)) {
      return NextResponse.json({ error: "Invalid inquiry type" }, { status: 400 });
    }

    // Write to Convex
    try {
      const convex = await getAuthenticatedConvexClient();
      if (convex) {
        await convex.mutation(
          (anyApi as any).business.submitContactForm,
          {
            name,
            email,
            company,
            phone,
            message,
            inquiryType,
            operatorType,
            state: state?.toUpperCase(),
            clientCount,
          }
        );
      }
    } catch (convexErr) {
      console.error("[CONTACT] Convex write failed:", convexErr);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[CONTACT] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
