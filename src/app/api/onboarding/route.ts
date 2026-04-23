import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { name, states, operatorTypes, accountingMethods } = await request.json();

    // TODO: Integrate with Convex to save company and operator profile data
    // For now, simulate success
    console.log("Onboarding data received:", { name, states, operatorTypes, accountingMethods });

    return NextResponse.json({ ok: true, message: "Company created successfully (simulated)." });
  } catch (error) {
    console.error("Onboarding API error:", error);
    return NextResponse.json(
      { ok: false, message: "Failed to create company. Network error or invalid data." },
      { status: 400 }
    );
  }
}
