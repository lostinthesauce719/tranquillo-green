import { NextResponse } from "next/server";
import type {
  ImportJobPromotionSubmission,
  ImportJobStageSubmission,
} from "@/lib/import-job-types";
import { promoteImportJob, stageImportJob } from "@/lib/data/import-job-write-actions";
import { withAuth, securityHeaders, corsHeaders } from "@/lib/api-helpers";

export const POST = withAuth(async (request) => {
  try {
    const payload = (await request.json()) as
      | ({ action: "stage" } & ImportJobStageSubmission)
      | ({ action: "promote" } & ImportJobPromotionSubmission);

    if (payload.action === "promote") {
      const result = await promoteImportJob(payload);
      return securityHeaders(NextResponse.json(result, { status: result.ok ? 200 : 502 }));
    }

    const result = await stageImportJob(payload);
    return securityHeaders(NextResponse.json(result, { status: result.ok ? 200 : 502 }));
  } catch (error) {
    return securityHeaders(
      NextResponse.json(
        {
          ok: false,
          message: error instanceof Error ? error.message : "Could not process import job request.",
        },
        { status: 400 },
      ),
    );
  }
});

export async function OPTIONS(request: Request) {
  const origin = request.headers.get("Origin") ?? undefined;
  return corsHeaders(new NextResponse(null, { status: 204 }), origin);
}
