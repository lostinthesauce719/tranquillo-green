import { NextResponse } from "next/server";

// API route handler — delegates to server actions
// The actual logic lives in ./actions.ts

export async function GET() {
  return NextResponse.json({ status: "ok", message: "Metrc API endpoint" });
}
