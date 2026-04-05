import "server-only";

import { ConvexHttpClient } from "convex/browser";
import { anyApi } from "convex/server";
import { DEMO_COMPANY_SLUG } from "@/lib/data/accounting-core";
import type {
  ImportJobPromotionSubmission,
  ImportJobStageSubmission,
  ImportJobWriteResult,
} from "@/lib/import-job-types";

function getConvexUrl() {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL?.trim();
  if (!url || !/^https?:\/\//.test(url)) {
    return null;
  }
  return url;
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs = 5000): Promise<T> {
  return await Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(`Timed out after ${timeoutMs}ms`)), timeoutMs);
    }),
  ]);
}

async function getConvexContext(companySlug: string) {
  const url = getConvexUrl();
  if (!url) {
    return null;
  }

  const client = new ConvexHttpClient(url);
  const company = await withTimeout(client.query((anyApi as any).cannabisCompanies.getBySlug, { slug: companySlug }));
  if (!company) {
    throw new Error(`Configured Convex backend could not find company ${companySlug}.`);
  }

  return { client, company };
}

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
      message: `Persisted import job ${payload.dataset.fileName} with ${payload.dataset.rows.length} staged rows and saved mapping profile ${payload.dataset.selectedProfile.name}.`,
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
      message: `Promoted ${result.promotedCount} import row${result.promotedCount === 1 ? "" : "s"} into persisted transactions and skipped ${result.skippedCount}.`,
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
