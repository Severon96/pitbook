// ─────────────────────────────────────────
// Pitbook – Shared Domain Types
// ─────────────────────────────────────────

// ── Enums ────────────────────────────────

export type VehicleType = 'DAILY' | 'SEASONAL';

export type CostCategory =
  | 'FUEL'
  | 'SERVICE'
  | 'REPAIR'
  | 'INSURANCE'
  | 'TAX'
  | 'PARTS'
  | 'OTHER';

export type CostSource = 'MANUAL' | 'SPRITMONITOR';

export type SeasonStatus = 'ACTIVE' | 'CLOSED';

// ── Vehicles ─────────────────────────────

export interface Vehicle {
  id: string;
  name: string;
  brand: string;
  model: string;
  year: number;
  type: VehicleType;
  licensePlate?: string;
  vin?: string;
  imageUrl?: string;
  notes?: string;
  spritmonitorVehicleId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateVehicleDto {
  name: string;
  brand: string;
  model: string;
  year: number;
  type: VehicleType;
  licensePlate?: string;
  vin?: string;
  notes?: string;
}

// ── Seasons ──────────────────────────────

export interface Season {
  id: string;
  vehicleId: string;
  name: string;
  startDate: Date;
  endDate?: Date;
  status: SeasonStatus;
  notes?: string;
  createdAt: Date;
}

export interface CreateSeasonDto {
  vehicleId: string;
  name: string;
  startDate: Date;
  endDate?: Date;
  notes?: string;
}

// ── Cost Entries ──────────────────────────

export interface CostEntryItem {
  id: string;
  costEntryId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface CreateCostEntryItemDto {
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface CostEntry {
  id: string;
  vehicleId: string;
  seasonId?: string;
  category: CostCategory;
  title: string;
  date: Date;
  totalAmount: number;
  notes?: string;
  receiptUrl?: string;
  source: CostSource;
  items: CostEntryItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCostEntryDto {
  vehicleId: string;
  seasonId?: string;
  category: CostCategory;
  title: string;
  date: Date;
  notes?: string;
  receiptUrl?: string;
  items?: CreateCostEntryItemDto[];
  // If no items: provide totalAmount directly
  totalAmount?: number;
}

// ── Fuel Logs ─────────────────────────────

export interface FuelLog {
  id: string;
  vehicleId: string;
  spritmonitorId?: string;
  date: Date;
  liters: number;
  pricePerLiter: number;
  totalCost: number;
  mileage: number;
  fullTank: boolean;
  notes?: string;
  lastSyncedAt?: Date;
}

// ── Service Records ───────────────────────

export interface ServiceRecord {
  id: string;
  vehicleId: string;
  costEntryId?: string;
  serviceType: string;
  mileageAtService: number;
  nextServiceDate?: Date;
  nextServiceMileage?: number;
  notes?: string;
  createdAt: Date;
}

// ── Cost Report ───────────────────────────

export interface CostReportFilter {
  vehicleId: string;
  seasonId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  categories?: CostCategory[];
}

export interface CostReportLine {
  entry: CostEntry;
  items: CostEntryItem[];
}

export interface CostReportSummary {
  totalAmount: number;
  byCategory: Record<CostCategory, number>;
  entries: CostReportLine[];
  period: {
    from: Date;
    to: Date;
    label: string;
  };
}

// ── Spritmonitor ──────────────────────────

export interface SpritmonitorSyncConfig {
  vehicleId: string;
  spritmonitorVehicleId: string;
  apiKey: string;
}
