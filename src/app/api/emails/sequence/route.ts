import { NextRequest, NextResponse } from "next/server";

/* ─── Email Sequence Trigger API ────────────────────────────────── */

interface SequenceData {
  email: string;
  sequence: "lead-nurture" | "post-demo" | "trial-expiry";
  firstName?: string;
  company?: string;
}

const EMAIL_SEQUENCES = {
  "lead-nurture": {
    name: "Lead Nurture",
    emails: [
      { day: 0, subject: "Your 280E savings estimate", template: "welcome" },
      { day: 3, subject: "What if you could close books in 4 days?", template: "time-savings" },
      { day: 6, subject: "\"We found $94K in missed deductions\"", template: "social-proof" },
      { day: 8, subject: "Serve more cannabis clients without hiring", template: "cpa-channel" },
      { day: 10, subject: "Tax season isn't waiting", template: "urgency" },
    ],
  },
  "post-demo": {
    name: "Post-Demo Conversion",
    emails: [
      { day: 0, subject: "Your Tranquillo Green demo recap", template: "demo-recap" },
      { day: 3, subject: "Is this really worth the switch?", template: "objection-handling" },
      { day: 11, subject: "Your 14-day trial expires in 3 days", template: "trial-expiry" },
    ],
  },
  "trial-expiry": {
    name: "Trial Expiry",
    emails: [
      { day: 0, subject: "Your trial expires tomorrow", template: "expiry-warning" },
      { day: 1, subject: "Last chance: Your trial has expired", template: "expired" },
      { day: 7, subject: "We saved your data", template: "win-back" },
    ],
  },
};

export async function POST(req: NextRequest) {
  try {
    const data: SequenceData = await req.json();

    if (!data.email || !data.sequence) {
      return NextResponse.json({ error: "Email and sequence are required" }, { status: 400 });
    }

    const sequence = EMAIL_SEQUENCES[data.sequence];
    if (!sequence) {
      return NextResponse.json({ error: "Invalid sequence" }, { status: 400 });
    }

    // In production: queue emails via Resend/SendGrid
    console.log("[EMAIL SEQUENCE]", {
      email: data.email,
      sequence: sequence.name,
      emails: sequence.emails.length,
      firstName: data.firstName,
      company: data.company,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: `Sequence "${sequence.name}" triggered for ${data.email}`,
      emailsQueued: sequence.emails.length,
    });
  } catch (error) {
    console.error("[EMAIL SEQUENCE ERROR]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/* ─── Get Available Sequences ───────────────────────────────────── */

export async function GET() {
  return NextResponse.json({
    sequences: Object.entries(EMAIL_SEQUENCES).map(([key, seq]) => ({
      id: key,
      name: seq.name,
      emailCount: seq.emails.length,
      emails: seq.emails.map((e) => ({ day: e.day, subject: e.subject })),
    })),
  });
}
