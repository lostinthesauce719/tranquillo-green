import { authMutation } from "./lib/withAuth";
import { v } from "convex/values";

/**
 * Import inventory data from a parsed CSV payload.
 *
 *expects an array of row objects; each row must contain:
 *  - sku (string)
 *  - productName (string)
 *  - quantity (number)
 *  - unitCost (number)
 *
 * Optional fields:
 *  - category, unitOfMeasure, packageTag, locationName
 *
 * Behavior:
 *  - Upserts the Product (by SKU; creates if missing)
 *  - Upserts the Inventory Batch (by packageTag; generates one if missing)
 *  - Creates batches with source = "csv_import"
 */
export const importInventoryFromCsv = authMutation({
  args: {
    companyId: v.id("cannabisCompanies"),
    rows: v.array(
      v.object({
        productName: v.string(),
        sku: v.string(),
        packageTag: v.optional(v.string()),
        quantity: v.number(),
        unitCost: v.number(),
        category: v.optional(v.string()),
        unitOfMeasure: v.optional(v.string()),
        locationName: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const { companyId } = args;
    const summary: { rowIdx: number; success: boolean; message: string }[] = [];

    for (let i = 0; i < args.rows.length; i++) {
      const row = args.rows[i];
      try {
        // --- Upsert product ---
        // Try to find existing product by SKU within company
        const foundProducts = await ctx.db
          .query("products")
          .withIndex("by_company_sku", (q: any) => q.eq("companyId", companyId).eq("sku", row.sku))
          .collect();
        let productId = foundProducts[0]?._id;

        if (!productId) {
          productId = await ctx.db.insert("products", {
            companyId,
            sku: row.sku,
            name: row.productName,
            category: row.category ?? "Unknown",
            unitOfMeasure: row.unitOfMeasure ?? "each",
            active: true,
          });
        }

        // --- Resolve location ---
        let locationId: string | undefined;
        if (row.locationName) {
          const allLocations = await ctx.db
            .query("cannabisLocations")
            .withIndex("by_company", (q) => q.eq("companyId", companyId))
            .collect();
          const location = allLocations.find(
            (loc) => loc.name.toLowerCase() === row.locationName!.toLowerCase()
          );
          if (location) locationId = location._id;
        }

        // --- Determine/validate package tag ---
        const pkgTag = row.packageTag?.trim() ?? `CSV-${row.sku}-${Date.now()}-${i}`;

        // --- Upsert batch ---
        // Find existing batch by packageTag within company
        const allBatches = await ctx.db
          .query("inventoryBatches")
          .withIndex("by_company", (q) => q.eq("companyId", companyId))
          .collect();
        const existingBatch = allBatches.find((b) => b.packageTag === pkgTag);

        if (existingBatch) {
          // Patch existing batch
          await ctx.db.patch(existingBatch._id, {
            productId,
            locationId,
            quantityOnHand: row.quantity,
            costBasis: row.unitCost,
            source: "csv_import",
          });
        } else {
          // Insert new batch
          await ctx.db.insert("inventoryBatches", {
            companyId,
            productId,
            locationId,
            packageTag: pkgTag,
            quantityOnHand: row.quantity,
            costBasis: row.unitCost,
            source: "csv_import",
          });
        }

        summary.push({ rowIdx: i, success: true, message: "Imported" });
      } catch (e: any) {
        summary.push({ rowIdx: i, success: false, message: e.message ?? "Unknown error" });
      }
    }

    return summary;
  },
});
