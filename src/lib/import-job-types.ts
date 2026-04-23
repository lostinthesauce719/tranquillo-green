import type { DemoPipelineStage } from "@/lib/demo/accounting-close";
import type {
  DemoImportAmountStrategy,
  DemoImportColumn,
  DemoImportDataset,
  DemoImportProfile,
  DemoImportRow,
  DemoImportTargetField,
} from "@/lib/demo/accounting-workflows";

export type ImportJobStatus =
  | "uploaded"
  | "mapped"
  | "validated"
  | "partially_promoted"
  | "promoted"
  | "failed";

export type ImportWorkspaceRow = DemoImportRow & {
  promotedTransactionId?: string;
  promotedAt?: string;
};

export type ImportWorkspaceDataset = Omit<DemoImportDataset, "profiles" | "rows"> & {
  backendMode: "demo" | "persisted";
  jobId?: string;
  persistedStatus: ImportJobStatus;
  persistedStatusReason?: string;
  promotedRowCount: number;
  promotionReadyCount: number;
  blockedRowCount: number;
  appliedProfileId: string;
  profilePersistence: "demo_only" | "saved" | "snapshot_only" | "saved_with_overrides";
  selectedProfileName?: string;
  sourceFileSizeBytes?: number;
  sourceContentType?: string;
  sourceChecksum?: string;
  uploadedBy?: string;
  profiles: DemoImportProfile[];
  rows: ImportWorkspaceRow[];
};

export type ImportWorkspace = {
  source: "demo" | "convex";
  sourceLabel: string;
  sourceDetail: string;
  fallbackReason?: string;
  datasets: ImportWorkspaceDataset[];
  pipelineStages: DemoPipelineStage[];
};

export type ImportJobStageSubmission = {
  companySlug: string;
  dataset: {
    id: string;
    fileName: string;
    source: string;
    periodLabel: string;
    uploadedAt: string;
    delimiter: string;
    columns: DemoImportColumn[];
    rows: DemoImportRow[];
    selectedProfile: {
      id: string;
      name: string;
      description: string;
      amountStrategy: DemoImportAmountStrategy;
      fieldMappings: Record<string, DemoImportTargetField>;
    };
    effectiveMappings: Record<string, DemoImportTargetField>;
  };
};

export type ImportJobPromotionSubmission = {
  companySlug: string;
  jobId: string;
};

export type ImportJobWriteResult =
  | {
      ok: true;
      mode: "persisted" | "demo";
      message: string;
      item?: {
        jobId?: string;
        promotedCount?: number;
        skippedCount?: number;
      };
    }
  | {
      ok: false;
      mode: "persisted";
      message: string;
      item?: {
        jobId?: string;
        promotedCount?: number;
        skippedCount?: number;
      };
    };
