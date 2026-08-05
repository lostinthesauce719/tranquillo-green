"use client";

import { useTenant } from "@/lib/auth/tenant-context";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { useRouter } from "next/navigation";
import { useState, useCallback } from "react";
import {
  Edit,
  GitMerge,
  Trash2,
  History,
  Package,
  MapPin,
  DollarSign,
  Box,
  Layers,
  Check,
  X,
  AlertCircle,
  Loader2,
  Search,
  Filter,
} from "lucide-react";

type Batch = {
  _id: string;
  companyId: string;
  productId: string;
  locationId: string | null;
  packageTag: string;
  quantityOnHand: number;
  costBasis: number | null;
  source: "csv_import" | "metrc_import" | "manual";
  mergedFrom: string[] | null;
  lastMergedAt: number | null;
  _creationTime: string;
};

type Product = {
  _id: string;
  sku: string;
  name: string;
  category: string;
};

type Location = {
  _id: string;
  name: string;
};

export default function BatchClient() {
  const { companyId } = useTenant();
  const router = useRouter();

  const batches = useQuery(api.inventory.getBatches, { companyId: companyId as any }) as Batch[] | undefined;
  const products = useQuery(api.inventory.getProducts, { companyId: companyId as any }) as Product[] | undefined;
  const locations = useQuery(api.locations.listByCompany, { companyId: companyId as any }) as Location[] | undefined;

  const updateBatch = useMutation(api.inventory.updateBatch);
  const mergeBatches = useMutation(api.inventory.mergeBatches);
  const deleteBatch = useMutation(api.inventory.deleteBatch);

  const [searchTag, setSearchTag] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [mergeOpen, setMergeOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [selectedSourceIds, setSelectedSourceIds] = useState<Set<string>>(new Set());
  const [editForm, setEditForm] = useState({ locationId: "", costBasis: "" });
  const [error, setError] = useState<string | null>(null);

  // Filter
  const filtered = (batches ?? []).filter((b) =>
    b.packageTag.toLowerCase().includes(searchTag.toLowerCase())
  );

  const getProductName = (productId: string) => {
    return products?.find((p) => p._id === productId)?.name ?? "Unknown";
  };

  const getLocationName = (locationId: string | null) => {
    if (!locationId) return "—";
    return locations?.find((l) => l._id === locationId)?.name ?? "Unknown";
  };

  const handleEdit = (batch: Batch) => {
    setSelectedBatch(batch);
    setEditForm({
      locationId: batch.locationId ?? "",
      costBasis: batch.costBasis?.toString() ?? "",
    });
    setEditOpen(true);
  };

  const handleEditSave = async () => {
    if (!selectedBatch) return;
    try {
      await updateBatch({
        batchId: selectedBatch._id as any,
        locationId: editForm.locationId || null,
        costBasis: editForm.costBasis ? parseFloat(editForm.costBasis) : null,
      } as any);
      setEditOpen(false);
      setSelectedBatch(null);
      router.refresh();
    } catch (e) {
      setError("Failed to update batch: " + (e as Error).message);
    }
  };

  const handleMergeSelect = (batchId: string, multi: boolean) => {
    setSelectedSourceIds((prev) => {
      const next = new Set(prev);
      if (multi) {
        if (next.has(batchId)) next.delete(batchId);
        else next.add(batchId);
      } else {
        next.clear();
        next.add(batchId);
      }
      return next;
    });
  };

  const handleMerge = async () => {
    if (selectedBatch && selectedSourceIds.size > 0) {
      try {
        await mergeBatches({
          companyId: companyId as any,
          targetBatchId: selectedBatch._id as any,
          sourceBatchIds: Array.from(selectedSourceIds).map((id) => id as any),
        } as any);
        setMergeOpen(false);
        setSelectedBatch(null);
        setSelectedSourceIds(new Set());
        router.refresh();
      } catch (e) {
        setError("Merge failed: " + (e as Error).message);
      }
    }
  };

  const handleDelete = async () => {
    if (!selectedBatch) return;
    try {
      await deleteBatch({ batchId: selectedBatch._id as any } as any);
      setDeleteOpen(false);
      setSelectedBatch(null);
      router.refresh();
    } catch (e) {
      setError("Delete failed: " + (e as Error).message);
    }
  };

  if (!batches || !products || !locations) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        Loading batches...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Batch Management</h1>
          <p className="text-gray-500 text-sm">Merge, edit, and track inventory batches</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              placeholder="Search package tag..."
              value={searchTag}
              onChange={(e) => setSearchTag(e.target.value)}
              className="pl-9 pr-3 py-2 border rounded-md bg-background"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded flex items-center text-red-700">
          <AlertCircle className="w-5 h-5 mr-2" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="border rounded-lg overflow-hidden bg-card">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium">Package Tag</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Product</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Location</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Qty</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Cost Basis</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Source</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Merged</th>
              <th className="px-4 py-3 text-right text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map((batch) => (
              <tr key={batch._id} className="hover:bg-muted/30">
                <td className="px-4 py-3 font-mono text-sm">{batch.packageTag}</td>
                <td className="px-4 py-3 text-sm">
                  <div className="flex items-center">
                    <Package className="w-4 h-4 mr-2 text-gray-400" />
                    {getProductName(batch.productId)}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm">
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                    {getLocationName(batch.locationId)}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm font-medium">{batch.quantityOnHand}</td>
                <td className="px-4 py-3 text-sm">
                  {batch.costBasis != null ? (
                    <span className="flex items-center">
                      <DollarSign className="w-3 h-3 mr-1 text-gray-400" />
                      {batch.costBasis.toFixed(2)}
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-3 text-sm capitalize">{batch.source.replace("_", " ")}</td>
                <td className="px-4 py-3 text-sm">
                  {batch.mergedFrom && batch.mergedFrom.length > 0 ? (
                    <span className="flex items-center text-blue-600">
                      <Layers className="w-4 h-4 mr-1" />
                      {batch.mergedFrom.length} batche(s)
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleEdit(batch)}
                      className="p-1.5 hover:bg-background-border rounded"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedBatch(batch);
                        setMergeOpen(true);
                      }}
                      className="p-1.5 hover:bg-background-border rounded"
                      title="Merge into this batch"
                    >
                      <GitMerge className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedBatch(batch);
                        setDeleteOpen(true);
                      }}
                      className="p-1.5 hover:bg-red-50 text-red-600 rounded"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="p-8 text-center text-gray-500">No batches found</div>
        )}
      </div>

      {/* Edit Modal */}
      {editOpen && selectedBatch && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold mb-4">Edit Batch</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Package Tag</label>
                <input value={selectedBatch.packageTag} disabled className="w-full p-2 border rounded bg-muted" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Location</label>
                <select
                  value={editForm.locationId}
                  onChange={(e) => setEditForm({ ...editForm, locationId: e.target.value })}
                  className="w-full p-2 border rounded"
                >
                  <option value="">Unassigned</option>
                  {locations?.map((loc) => (
                    <option key={loc._id} value={loc._id}>{loc.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Cost Basis ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editForm.costBasis}
                  onChange={(e) => setEditForm({ ...editForm, costBasis: e.target.value })}
                  placeholder="Optional"
                  className="w-full p-2 border rounded"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setEditOpen(false)} className="px-4 py-2 border rounded hover:bg-muted">
                Cancel
              </button>
              <button onClick={handleEditSave} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Merge Modal */}
      {mergeOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg shadow-xl w-full max-w-2xl p-6">
            <h2 className="text-lg font-semibold mb-2">Merge Batches</h2>
            <p className="text-sm text-gray-600 mb-4">
              Select source batches to merge into <strong>{selectedBatch?.packageTag}</strong>.
              Quantities will be summed and cost basis averaged.
            </p>

            <div className="space-y-2 mb-4">
              {batches
                ?.filter((b) => b._id !== selectedBatch?._id)
                .map((batch) => (
                  <label
                    key={batch._id}
                    className={`flex items-center p-3 border rounded cursor-pointer ${
                      selectedSourceIds.has(batch._id) ? "bg-blue-50 border-blue-300" : ""
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedSourceIds.has(batch._id)}
                      onChange={() => handleMergeSelect(batch._id, true)}
                      className="mr-3"
                    />
                    <div className="flex-1">
                      <div className="font-mono text-sm">{batch.packageTag}</div>
                      <div className="text-xs text-gray-500">
                        {getProductName(batch.productId)} • Qty: {batch.quantityOnHand}
                        {batch.costBasis != null && ` • $${batch.costBasis.toFixed(2)}`}
                      </div>
                    </div>
                  </label>
                ))}
            </div>

            <div className="flex justify-end gap-2">
              <button onClick={() => { setMergeOpen(false); setSelectedSourceIds(new Set()); }} className="px-4 py-2 border rounded hover:bg-muted">
                Cancel
              </button>
              <button
                onClick={handleMerge}
                disabled={selectedSourceIds.size === 0}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              >
                Merge {selectedSourceIds.size} batch(es)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteOpen && selectedBatch && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold mb-2 text-red-600">Delete Batch</h2>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to delete batch <strong>{selectedBatch.packageTag}</strong>?
              This will zero out inventory and delete the batch record.
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDeleteOpen(false)} className="px-4 py-2 border rounded hover:bg-muted">
                Cancel
              </button>
              <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
