import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { submitManualJournal } from "@/lib/data/accounting-write-actions";

const ManualJournalLineSchema = z.object({
  accountCode: z.string().min(1, "accountCode is required"),
  direction: z.enum(["debit", "credit"]),
  amount: z.number().positive("amount must be positive"),
  memo: z.string(),
});

const ManualJournalSubmissionSchema = z.object({
  companySlug: z.string().min(1, "companySlug is required"),
  entryDate: z.string().min(1, "entryDate is required"),
  periodLabel: z.string().min(1, "periodLabel is required"),
  reference: z.string().min(1, "reference is required"),
  description: z.string().min(1, "description is required"),
  lines: z.array(ManualJournalLineSchema).min(1, "At least one journal line is required"),
});

export async function POST(request: Request) {
  const { userId } = auth();
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = ManualJournalSubmissionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const result = await submitManualJournal(parsed.data);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Could not process manual journal request.",
      },
      { status: 400 },
    );
  }
}
