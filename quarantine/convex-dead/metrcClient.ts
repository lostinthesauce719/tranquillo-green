// Helper functions to upsert products and batches from METRC
// 'Context' is not exported by convex/server. These helpers are called with a
// mutation context, so use the generated MutationCtx.
import type { MutationCtx } from './_generated/server';

async function upsertMetrcProduct(ctx: MutationCtx, companyId: string, metrcItem: any) {
  // Map METRC item to our product schema
  // METRC Item fields typically include: ProductName, ProductCategoryName, UnitOfMeasure, etc.
  const productData = {
    companyId,
    sku: metrcItem.PackageLabel || metrcItem.ProductName, // Use package tag as SKU if available
    name: metrcItem.ProductName,
    category: metrcItem.ProductCategoryName || 'Uncategorized',
    unitOfMeasure: metrcItem.UnitOfMeasureName,
    active: true,
    // Add other fields as needed based on METRC API response
  };
  
  console.log(`Upserting product: ${productData.name} (SKU: ${productData.sku})`);
  
  // Check if product exists by SKU
  const existing = await ctx.db
    .query('products')
    .withIndex('by_company_sku', (q) => 
      q.eq('companyId', companyId).eq('sku', productData.sku)
    )
    .limit(1)
    .collect();
  
  if (existing.length > 0) {
    // Update existing product
    await ctx.db.patch(existing[0]._id, productData);
    return existing[0]._id;
  } else {
    // Create new product
    return await ctx.db.insert('products', productData);
  }
}

async function upsertMetrcPlantBatch(ctx: MutationCtx, companyId: string, plant: any) {
  // METRC plant fields: Id, LocationName, RoomName, Strain, PlantedDate, etc.
  const batchData = {
    companyId,
    locationId: null, // Would need to map facility to location
    packageTag: `PLANT-${plant.Id}`, // Generate package tag
    strain: plant.Strain, // Assuming we have a strains table
    plantedDate: plant.PlantedDate,
    quantityOnHand: plant.Plants, // Number of plants
    source: 'metrc_import',
    // Additional fields for inventory batches
    unitOfMeasure: 'Each',
    productType: 'plant',
  };
  
  console.log(`Upserting plant batch: ${batchData.packageTag}`);
  
  // Check if batch exists by package tag
  const existing = await ctx.db
    .query('inventoryBatches')
    .withIndex('by_company_packageTag', (q) =>
      q.eq('companyId', companyId).eq('packageTag', batchData.packageTag)
    )
    .collect();
  
  if (existing.length > 0) {
    await ctx.db.patch(existing[0]._id, batchData);
    return existing[0]._id;
  } else {
    return await ctx.db.insert('inventoryBatches', batchData);
  }
}

async function upsertMetrcPackageBatch(ctx: MutationCtx, companyId: string, pkg: any) {
  // METRC package fields: Label, ProductName, ProductCategoryName, UnitOfMeasure, Quantity, etc.
  const batchData = {
    companyId,
    locationId: null, // Would need to map facility to location
    packageTag: pkg.PackageLabel,
    productId: null, // Would need to look up product by name/category
    strain: pkg.Strain,
    quantityOnHand: pkg.Quantity,
    source: 'metrc_import',
    unitOfMeasure: pkg.UnitOfMeasureName,
    productType: pkg.ProductCategoryName,
    // Add other relevant fields
  };
  
  console.log(`Upserting package batch: ${batchData.packageTag}`);
  
  // Check if batch exists by package tag
  const existing = await ctx.db
    .query('inventoryBatches')
    .withIndex('by_company_packageTag', (q) =>
      q.eq('companyId', companyId).eq('packageTag', batchData.packageTag)
    )
    .collect();
  
  if (existing.length > 0) {
    await ctx.db.patch(existing[0]._id, batchData);
    return existing[0]._id;
  } else {
    return await ctx.db.insert('inventoryBatches', batchData);
  }
}