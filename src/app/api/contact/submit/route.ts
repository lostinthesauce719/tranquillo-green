import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedConvexClient } from "@/lib/data/convex-client";
import { anyApi } from "convex/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, company, phone, message, inquiryType, operatorType, state, clientCount } = body;

    if (!name || !email || !message || !inquiryType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
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
            state,
            clientCount,
          }
        );
      }
    } catch (convexErr) {
      console.error("[CONTACT] Convex write failed:", convexErr);
      // Don't fail the request — still return success to user
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[CONTACT] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
