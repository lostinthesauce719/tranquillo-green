import "server-only";

import { anyApi } from "convex/server";
import { DEMO_COMPANY_SLUG } from "@/lib/data/accounting-core";
import type {
  ImportJobPromotionSubmission,
  ImportJobStageSubmission,
  ImportJobWriteResult,
} from "@/lib/import-job-types";
import { getConvexContext, withTimeout } from "@/lib/data/convex-client";

export async function stageImportJob(
  payload: ImportJobStageSubmission,
): Promise<ImportJobWriteResult> {
  try {
    const convex = await getConvexContext(payload.companySlug || DEMO_COMPANY_SLUG);
    if (!convex) {
      return {
        ok: true,
        mode: "demo",
        message: `Staged demo import ${payload.dataset.fileName} locally. Convex is not configured, so no persisted import job was created.`,
      };
    }

    const job = await withTimeout(
      convex.client.mutation((anyApi as any).importJobs.stageDemoImportJob, {
        companyId: convex.company._id,
        dataset: payload.dataset,
      }),
    );

    return {
      ok: true,
      mode: "persisted",
      message: `Persisted import job ${payload.dataset.fileName} with ${payload.dataset.rows.length} staged rows, saved mapping profile ${payload.dataset.selectedProfile.name}, and refreshed persisted validation state.`,
      item: { jobId: job?._id },
    };
  } catch (error) {
    return {
      ok: false,
      mode: "persisted",
      message: error instanceof Error
        ? `Persisted import staging failed (${error.message}).`
        : "Persisted import staging failed.",
    };
  }
}

export async function promoteImportJob(
  payload: ImportJobPromotionSubmission,
): Promise<ImportJobWriteResult> {
  try {
    const convex = await getConvexContext(payload.companySlug || DEMO_COMPANY_SLUG);
    if (!convex) {
      return {
        ok: true,
        mode: "demo",
        message: `Promotion stayed in demo mode because Convex is not configured. No persisted transactions were created for ${payload.jobId}.`,
        item: { jobId: payload.jobId, promotedCount: 0, skippedCount: 0 },
      };
    }

    const result = await withTimeout(
      convex.client.mutation((anyApi as any).importJobs.promoteJobToTransactions, {
        companyId: convex.company._id,
        jobId: payload.jobId,
      }),
    );

    return {
      ok: true,
      mode: "persisted",
      message: `Promoted ${result.promotedCount} import row${result.promotedCount === 1 ? "" : "s"} into persisted transactions, skipped ${result.skippedCount}, and set the import job to ${String(result.status).replaceAll("_", " ")}.`,
      item: {
        jobId: payload.jobId,
        promotedCount: result.promotedCount,
        skippedCount: result.skippedCount,
      },
    };
  } catch (error) {
    return {
      ok: false,
      mode: "persisted",
      message: error instanceof Error
        ? `Persisted promotion failed (${error.message}).`
        : "Persisted promotion failed.",
      item: { jobId: payload.jobId },
    };
  }
}
