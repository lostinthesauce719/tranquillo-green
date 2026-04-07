import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { promoteImportJob, stageImportJob } from "@/lib/data/import-job-write-actions";

const TargetFieldSchema = z.enum([
  "date", "postedDate", "description", "reference",
  "amount", "debit", "credit", "location", "memo", "ignore",
]);

const ImportColumnSchema = z.object({
  key: z.string(),
  label: z.string(),
  suggestedTarget: TargetFieldSchema,
  required: z.boolean().optional(),
  sampleValues: z.array(z.string()),
});

const ImportRowSchema = z.object({
  id: z.string(),
  values: z.record(z.string(), z.any()),
  sourceAccountName: z.string(),
  suggestedDebitAccountCode: z.string(),
  suggestedCreditAccountCode: z.string(),
  confidence: z.number(),
  status: z.enum(["ready", "warning", "error"]),
  validationIssues: z.array(z.string()),
});

const StagePayloadSchema = z.object({
  action: z.literal("stage"),
  companySlug: z.string().min(1, "companySlug is required"),
  dataset: z.object({
    id: z.string().min(1),
    fileName: z.string().min(1),
    source: z.string().min(1),
    periodLabel: z.string().min(1),
    uploadedAt: z.string().min(1),
    delimiter: z.string(),
    columns: z.array(ImportColumnSchema),
    rows: z.array(ImportRowSchema),
    selectedProfile: z.object({
      id: z.string(),
      name: z.string(),
      description: z.string(),
      amountStrategy: z.enum(["single_signed", "split_debit_credit"]),
      fieldMappings: z.record(z.string(), TargetFieldSchema),
    }),
    effectiveMappings: z.record(z.string(), TargetFieldSchema),
  }),
});

const PromotePayloadSchema = z.object({
  action: z.literal("promote"),
  companySlug: z.string().min(1, "companySlug is required"),
  jobId: z.string().min(1, "jobId is required"),
});

const ImportJobPayloadSchema = z.discriminatedUnion("action", [
  StagePayloadSchema,
  PromotePayloadSchema,
]);

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = ImportJobPayloadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const payload = parsed.data;

    if (payload.action === "promote") {
      const result = await promoteImportJob(payload);
      return NextResponse.json(result, { status: result.ok ? 200 : 502 });
    }

    const result = await stageImportJob(payload);
    return NextResponse.json(result, { status: result.ok ? 200 : 502 });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Could not process import job request.",
      },
      { status: 400 },
    );
  }
}
