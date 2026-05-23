import { NextRequest, NextResponse } from "next/server";

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

    // In production: save to database, trigger email sequence
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
