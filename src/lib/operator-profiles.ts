/**
 * Operator Type Profiles
 * 
 * Each cannabis operator type has different cost structures, 280E allocation
 * categories, and compliance requirements. This module defines those differences
 * so the UI adapts to what matters for each operator.
 */

import type { OperatorType } from "@/lib/navigation";

// ─── TYPES ──────────────────────────────────────────────────────────

export type CostCategory = {
  code: string;
  name: string;
  taxTreatment: "deductible" | "cogs" | "nondeductible";
  description: string;
};

export type AllocationMethod = {
  id: string;
  name: string;
  description: string;
  default: boolean;
};

export type OperatorProfile = {
  label: string;
  tagline: string;
  icon: string;
  costCategories: CostCategory[];
  allocationMethods: AllocationMethod[];
  dashboardMetrics: string[];
  complianceItems: string[];
  importSources: string[];
};

// ─── PROFILES ───────────────────────────────────────────────────────

export const OPERATOR_PROFILES: Record<OperatorType, OperatorProfile> = {
  dispensary: {
    label: "Dispensary",
    tagline: "Retail cannabis operations",
    icon: "🏪",
    costCategories: [
      { code: "COGS-RET", name: "Retail Product Cost", taxTreatment: "cogs", description: "Wholesale cost of cannabis products sold at retail" },
      { code: "COGS-SHIP", name: "Shipping & Logistics", taxTreatment: "cogs", description: "Transport costs from distributor to store" },
      { code: "OPEX-RENT", name: "Retail Rent & Occupancy", taxTreatment: "nondeductible", description: "Storefront lease, utilities, security" },
      { code: "OPEX-STAFF", name: "Staff & Training", taxTreatment: "nondeductible", description: "Budtender wages, training, benefits" },
      { code: "OPEX-MKT", name: "Marketing & Loyalty", taxTreatment: "nondeductible", description: "Signage, loyalty programs, digital marketing" },
      { code: "OPEX-COMP", name: "Compliance & Licensing", taxTreatment: "nondeductible", description: "State/local licenses, Metrc fees, legal" },
      { code: "OPEX-TECH", name: "POS & Technology", taxTreatment: "nondeductible", description: "POS system, inventory software, security cameras" },
    ],
    allocationMethods: [
      { id: "revenue", name: "Revenue Mix", description: "Allocate based on cannabis vs non-cannabis revenue ratio", default: true },
      { id: "square_footage", name: "Square Footage", description: "Allocate based on cannabis display vs total store area", default: false },
      { id: "headcount", name: "Staff Headcount", description: "Allocate based on cannabis-related vs total staff", default: false },
    ],
    dashboardMetrics: ["daily_revenue", "avg_basket", "units_sold", "customer_count", "top_products"],
    complianceItems: ["retail_license", "local_permits", "sales_tax", "metrc_reconciliation"],
    importSources: ["pos_system", "bank_csv", "metrc_export"],
  },

  cultivator: {
    label: "Cultivator",
    tagline: "Cannabis cultivation and harvest",
    icon: "🌱",
    costCategories: [
      { code: "COGS-GROW", name: "Cultivation Costs", taxTreatment: "cogs", description: "Grow media, nutrients, water, electricity for cultivation" },
      { code: "COGS-HARVEST", name: "Harvest & Processing", taxTreatment: "cogs", description: "Trimming, drying, curing, packaging labor" },
      { code: "COGS-GENETICS", name: "Genetics & Clones", taxTreatment: "cogs", description: "Seeds, clones, genetic licensing fees" },
      { code: "OPEX-FACILITY", name: "Facility & Equipment", taxTreatment: "nondeductible", description: "Warehouse lease, HVAC, lighting, irrigation" },
      { code: "OPEX-STAFF", name: "Cultivation Staff", taxTreatment: "nondeductible", description: "Growers, trimmers, facility managers" },
      { code: "OPEX-WASTE", name: "Waste & Destruction", taxTreatment: "nondeductible", description: "Waste disposal, destruction documentation" },
      { code: "OPEX-COMP", name: "Compliance & Testing", taxTreatment: "nondeductible", description: "Lab testing, Metrc tracking, licensing" },
    ],
    allocationMethods: [
      { id: "square_footage", name: "Canopy Square Footage", description: "Allocate based on cannabis canopy vs total facility", default: true },
      { id: "labor_hours", name: "Labor Hours", description: "Allocate based on cultivation vs admin labor", default: false },
      { id: "utility_usage", name: "Utility Usage", description: "Allocate based on cultivation vs non-cultivation power/water", default: false },
    ],
    dashboardMetrics: ["plants_in_veg", "plants_in_flower", "harvest_yield", "cost_per_gram", "waste_rate"],
    complianceItems: ["cultivation_license", "metrc_plant_tracking", "harvest_manifests", "lab_testing"],
    importSources: ["metrc_export", "utility_bills", "bank_csv"],
  },

  manufacturer: {
    label: "Manufacturer",
    tagline: "Cannabis extraction and infused products",
    icon: "⚗️",
    costCategories: [
      { code: "COGS-RAW", name: "Raw Material Cost", taxTreatment: "cogs", description: "Bulk cannabis, trim, biomass for extraction" },
      { code: "COGS-EXTRACT", name: "Extraction & Processing", taxTreatment: "cogs", description: "Solvents, CO2, lab equipment consumables" },
      { code: "COGS-PACKAGING", name: "Packaging & Labeling", taxTreatment: "cogs", description: "Child-resistant packaging, labels, inserts" },
      { code: "OPEX-LAB", name: "Lab & Equipment", taxTreatment: "nondeductible", description: "Extraction equipment, lab lease, maintenance" },
      { code: "OPEX-STAFF", name: "Production Staff", taxTreatment: "nondeductible", description: "Extraction techs, QA staff, production managers" },
      { code: "OPEX-RD", name: "R&D and Testing", taxTreatment: "nondeductible", description: "Product development, stability testing, R&D batches" },
      { code: "OPEX-COMP", name: "Compliance & Quality", taxTreatment: "nondeductible", description: "GMP compliance, licensing, third-party testing" },
    ],
    allocationMethods: [
      { id: "labor_hours", name: "Labor Hours", description: "Allocate based on production vs admin labor", default: true },
      { id: "machine_hours", name: "Machine Hours", description: "Allocate based on extraction equipment usage", default: false },
      { id: "output_volume", name: "Output Volume", description: "Allocate based on units produced vs total output", default: false },
    ],
    dashboardMetrics: ["batches_processed", "yield_rate", "cost_per_unit", "batch_consistency", "inventory_value"],
    complianceItems: ["manufacturing_license", "metrc_batch_tracking", "gmp_audit", "lab_certificates"],
    importSources: ["metrc_export", "lab_reports", "bank_csv"],
  },

  distributor: {
    label: "Distributor",
    tagline: "Cannabis distribution and logistics",
    icon: "🚛",
    costCategories: [
      { code: "COGS-PRODUCT", name: "Product Acquisition", taxTreatment: "cogs", description: "Wholesale cost of inventory for distribution" },
      { code: "COGS-TRANSPORT", name: "Transport & Logistics", taxTreatment: "cogs", description: "Vehicle costs, fuel, drivers, route planning" },
      { code: "COGS-WAREHOUSE", name: "Warehousing", taxTreatment: "cogs", description: "Storage facility, climate control, security" },
      { code: "OPEX-STAFF", name: "Distribution Staff", taxTreatment: "nondeductible", description: "Drivers, warehouse workers, logistics managers" },
      { code: "OPEX-VEHICLES", name: "Fleet & Maintenance", taxTreatment: "nondeductible", description: "Vehicle leases, maintenance, insurance" },
      { code: "OPEX-COMP", name: "Compliance & Manifests", taxTreatment: "nondeductible", description: "Metrc manifests, transport licenses, route compliance" },
      { code: "OPEX-TECH", name: "Logistics Technology", taxTreatment: "nondeductible", description: "Route optimization, tracking, inventory systems" },
    ],
    allocationMethods: [
      { id: "revenue", name: "Revenue Mix", description: "Allocate based on cannabis vs non-cannabis distribution revenue", default: true },
      { id: "mileage", name: "Mileage", description: "Allocate based on cannabis vs total delivery miles", default: false },
      { id: "headcount", name: "Staff Headcount", description: "Allocate based on cannabis-related vs total staff", default: false },
    ],
    dashboardMetrics: ["transfers_in", "transfers_out", "manifest_compliance", "delivery_time", "inventory_turns"],
    complianceItems: ["distributor_license", "metrc_manifests", "transport_permits", "chain_of_custody"],
    importSources: ["metrc_export", "fleet_tracking", "bank_csv"],
  },

  delivery: {
    label: "Delivery",
    tagline: "Direct-to-consumer cannabis delivery",
    icon: "🛵",
    costCategories: [
      { code: "COGS-PRODUCT", name: "Product Cost", taxTreatment: "cogs", description: "Wholesale cost of cannabis products for delivery" },
      { code: "COGS-DRIVERS", name: "Driver Wages (COGS)", taxTreatment: "cogs", description: "Wages for drivers directly involved in product delivery" },
      { code: "COGS-VEHICLES", name: "Delivery Vehicle Costs (COGS)", taxTreatment: "cogs", description: "Vehicle depreciation, fuel, maintenance for delivery ops" },
      { code: "OPEX-SOFTWARE", name: "Delivery Software Fees", taxTreatment: "nondeductible", description: "Platform fees, route optimization software" },
      { code: "OPEX-STAFF", name: "Admin/Dispatch Staff", taxTreatment: "nondeductible", description: "Call center, dispatch, support staff" },
      { code: "OPEX-INSUR", name: "Insurance & Licenses", taxTreatment: "nondeductible", description: "Delivery vehicle insurance, state/local licenses" },
      { code: "OPEX-MKT", name: "Marketing & Promotions", taxTreatment: "nondeductible", description: "Online ads, customer acquisition, discounts" },
    ],
    allocationMethods: [
      { id: "revenue", name: "Revenue Mix", description: "Allocate based on cannabis vs non-cannabis delivery revenue", default: true },
      { id: "delivery_miles", name: "Delivery Miles", description: "Allocate based on miles driven for cannabis vs other deliveries", default: false },
      { id: "labor_hours", name: "Driver Labor Hours", description: "Allocate based on hours spent on cannabis vs other deliveries", default: false },
    ],
    dashboardMetrics: ["orders_completed", "avg_order_value", "delivery_time", "driver_utilization", "customer_ratings"],
    complianceItems: ["delivery_license", "vehicle_registration", "delivery_manifests", "age_verification"],
    importSources: ["delivery_platform_export", "bank_csv", "payroll_export"],
  },

  vertical: {
    label: "Vertical (Integrated)",
    tagline: "Seed-to-sale operations",
    icon: "🌿",
    costCategories: [
      { code: "COGS-GROW", name: "Cultivation Costs", taxTreatment: "cogs", description: "All costs from clone to harvest" },
      { code: "COGS-EXTRACT", name: "Manufacturing Costs", taxTreatment: "cogs", description: "Extraction, processing, packaging" },
      { code: "COGS-RETAIL", name: "Retail Product Cost", taxTreatment: "cogs", description: "Transfer cost of products to retail locations" },
      { code: "COGS-DELIVERY", name: "Delivery Product Cost", taxTreatment: "cogs", description: "Transfer cost of products for delivery" },
      { code: "OPEX-FACILITY", name: "Facilities & Equipment", taxTreatment: "nondeductible", description: "All facility leases, equipment, maintenance" },
      { code: "OPEX-STAFF", name: "All Staff", taxTreatment: "nondeductible", description: "Cultivation, production, retail, delivery, admin staff" },
      { code: "OPEX-COMP", name: "Compliance & Licensing", taxTreatment: "nondeductible", description: "All licenses, Metrc, legal, compliance" },
      { code: "OPEX-CORP", name: "Corporate Overhead", taxTreatment: "nondeductible", description: "Executive, finance, HR, IT" },
    ],
    allocationMethods: [
      { id: "square_footage", name: "Square Footage", description: "Allocate based on cannabis vs total facility area", default: true },
      { id: "labor_hours", name: "Labor Hours", description: "Allocate based on cannabis vs admin labor", default: false },
      { id: "revenue_mix", name: "Revenue Mix", description: "Allocate based on cannabis vs non-cannabis revenue", default: false },
    ],
    dashboardMetrics: ["total_revenue", "cogs_ratio", "allocation_split", "compliance_score", "close_readiness"],
    complianceItems: ["all_licenses", "metrc_full", "intercompany_transfers", "consolidated_reporting"],
    importSources: ["metrc_export", "pos_system", "delivery_platform_export", "bank_csv", "payroll"],
  },
};

// ─── HELPERS ────────────────────────────────────────────────────────

export function getOperatorProfile(type: OperatorType): OperatorProfile {
  return OPERATOR_PROFILES[type] ?? OPERATOR_PROFILES.vertical;
}

export function getCogsCategories(type: OperatorType): CostCategory[] {
  return getOperatorProfile(type).costCategories.filter((c) => c.taxTreatment === "cogs");
}

export function getNondeductibleCategories(type: OperatorType): CostCategory[] {
  return getOperatorProfile(type).costCategories.filter((c) => c.taxTreatment === "nondeductible");
}

export function getDefaultAllocationMethod(type: OperatorType): AllocationMethod {
  const profile = getOperatorProfile(type);
  return profile.allocationMethods.find((m) => m.default) ?? profile.allocationMethods[0];
}
