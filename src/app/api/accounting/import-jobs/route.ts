import { NextResponse } from "next/server";
import type {
  ImportJobPromotionSubmission,
  ImportJobStageSubmission,
} from "@/lib/import-job-types";
import { promoteImportJob, stageImportJob } from "@/lib/data/import-job-write-actions";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as
      | ({ action: "stage" } & ImportJobStageSubmission)
      | ({ action: "promote" } & ImportJobPromotionSubmission);

    if (payload.action === "promote") {
      return NextResponse.json(await promoteImportJob(payload));
    }

    return NextResponse.json(await stageImportJob(payload));
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
