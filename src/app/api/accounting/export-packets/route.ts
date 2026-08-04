import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { persistExportPacketRun } from "@/lib/data/accounting-write-actions";

const ExportPacketMutationSchema = z.object({
  companySlug: z.string().min(1, "companySlug is required"),
  bundleId: z.string().min(1, "bundleId is required"),
  bundleName: z.string().min(1, "bundleName is required"),
  periodLabel: z.string().min(1, "periodLabel is required"),
  recipient: z.string().min(1, "recipient is required"),
  owner: z.string().min(1, "owner is required"),
  status: z.enum(["draft", "generated", "sent", "held"]),
  selectedFormats: z.array(z.string()),
  selectedSchedules: z.array(z.string()),
  selectedChecklistTitles: z.array(z.string()),
  coverMemoMode: z.enum(["controller_summary", "cpa_handoff", "open_items"]),
  includeDeliveryNotes: z.boolean(),
  detail: z.string().min(1, "detail is required"),
  blockers: z.array(z.string()),
  /**
   * Typed confirmation for contestable tax positions. Absent on the first
   * attempt; the mutation refuses and returns the warnings, the operator reads
   * them and types "understand", and the request is retried with this set.
   *
   * Must be declared here or zod strips it before it reaches the mutation and
   * the gate can never be satisfied.
   */
  acknowledgement: z.string().optional(),
});

export async function POST(request: Request) {
  const { userId } = auth();
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = ExportPacketMutationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const result = await persistExportPacketRun(parsed.data);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Could not process export packet update.",
      },
      { status: 400 },
    );
  }
}
