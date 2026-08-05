import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedConvexClient } from "@/lib/data/convex-client";
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


/* ─── Lead Capture API ──────────────────────────────────────────── */

interface LeadData {
  email: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  source?: string;
  medium?: string;
  campaign?: string;
  magnetId?: string;
}

// In production, this would write to Convex or a database
// For now, we log and return success

export async function POST(req: NextRequest) {
  try {
    const data: LeadData = await req.json();

    if (!data.email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    // Write to Convex
    try {
      const convex = await getAuthenticatedConvexClient();
      if (convex) {
        const contactName = [data.firstName, data.lastName].filter(Boolean).join(" ").trim() || data.email.split("@")[0];
        await convex.mutation(
          (anyApi as any).business.captureLead,
          {
            companyName: data.company || "",
            contactName,
            email: data.email,
            operatorType: "dispensary",
            state: "CO",
            painPoints: data.magnetId ? [data.magnetId] : [],
            acquisitionSource: data.source || "website",
          }
        );
      }
    } catch (convexErr) {
      console.error("[LEAD CAPTURE] Convex write failed:", convexErr);
    }

    console.log("[LEAD CAPTURE]", {
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      company: data.company,
      source: data.source || "direct",
      medium: data.medium || "none",
      campaign: data.campaign || "none",
      magnetId: data.magnetId,
      timestamp: new Date().toISOString(),
    });

    // In production: trigger welcome email sequence
    // await triggerEmailSequence(data.email, "lead-nurture");

    return NextResponse.json({
      success: true,
      message: "Lead captured successfully",
      nextStep: "check-email",
    });
  } catch (error) {
    console.error("[LEAD CAPTURE ERROR]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
