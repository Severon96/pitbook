// ─────────────────────────────────────────
// Pitbook – Drizzle Schema
// ─────────────────────────────────────────

import {
  pgTable,
  pgEnum,
  text,
  integer,
  timestamp,
  numeric,
  boolean,
  index,
  uniqueIndex,
  unique,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';

// ── Enums ─────────────────────────────────

export const vehicleTypeEnum = pgEnum('VehicleType', ['DAILY', 'SEASONAL']);
export const costCategoryEnum = pgEnum('CostCategory', [
  'FUEL',
  'SERVICE',
  'REPAIR',
  'INSURANCE',
  'TAX',
  'PARTS',
  'OTHER',
]);
export const costSourceEnum = pgEnum('CostSource', ['MANUAL', 'SPRITMONITOR']);
export const seasonStatusEnum = pgEnum('SeasonStatus', ['ACTIVE', 'CLOSED']);

// ── Tables ────────────────────────────────

export const vehicles = pgTable('vehicles', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  name: text('name').notNull(),
  brand: text('brand').notNull(),
  model: text('model').notNull(),
  year: integer('year').notNull(),
  type: vehicleTypeEnum('type').notNull(),
  licensePlate: text('license_plate'),
  vin: text('vin'),
  imageUrl: text('image_url'),
  notes: text('notes'),

  // Spritmonitor integration
  spritmonitorVehicleId: text('spritmonitor_vehicle_id'),
  spritmonitorApiKey: text('spritmonitor_api_key'),
  spritmonitorLastSync: timestamp('spritmonitor_last_sync', { withTimezone: true }),

  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const seasons = pgTable('seasons', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  vehicleId: text('vehicle_id')
    .notNull()
    .references(() => vehicles.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  startDate: timestamp('start_date', { withTimezone: true }).notNull(),
  endDate: timestamp('end_date', { withTimezone: true }),
  status: seasonStatusEnum('status').notNull().default('ACTIVE'),
  notes: text('notes'),

  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const costEntries = pgTable(
  'cost_entries',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),
    vehicleId: text('vehicle_id')
      .notNull()
      .references(() => vehicles.id, { onDelete: 'cascade' }),
    seasonId: text('season_id').references(() => seasons.id, {
      onDelete: 'set null',
    }),
    category: costCategoryEnum('category').notNull(),
    title: text('title').notNull(),
    date: timestamp('date', { withTimezone: true }).notNull(),
    totalAmount: numeric('total_amount', { precision: 10, scale: 2 }).notNull(),
    notes: text('notes'),
    receiptUrl: text('receipt_url'),
    source: costSourceEnum('source').notNull().default('MANUAL'),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    vehicleIdIdx: index('cost_entries_vehicle_id_idx').on(table.vehicleId),
    seasonIdIdx: index('cost_entries_season_id_idx').on(table.seasonId),
    dateIdx: index('cost_entries_date_idx').on(table.date),
  })
);

export const costEntryItems = pgTable('cost_entry_items', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  costEntryId: text('cost_entry_id')
    .notNull()
    .references(() => costEntries.id, { onDelete: 'cascade' }),
  description: text('description').notNull(),
  quantity: numeric('quantity', { precision: 10, scale: 3 }).notNull(),
  unitPrice: numeric('unit_price', { precision: 10, scale: 2 }).notNull(),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
});

export const fuelLogs = pgTable(
  'fuel_logs',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),
    vehicleId: text('vehicle_id')
      .notNull()
      .references(() => vehicles.id, { onDelete: 'cascade' }),
    spritmonitorId: text('spritmonitor_id'),
    date: timestamp('date', { withTimezone: true }).notNull(),
    liters: numeric('liters', { precision: 8, scale: 3 }).notNull(),
    pricePerLiter: numeric('price_per_liter', { precision: 6, scale: 4 }).notNull(),
    totalCost: numeric('total_cost', { precision: 10, scale: 2 }).notNull(),
    mileage: integer('mileage').notNull(),
    fullTank: boolean('full_tank').notNull().default(true),
    notes: text('notes'),
    lastSyncedAt: timestamp('last_synced_at', { withTimezone: true }),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    vehicleSpritmonitorUnique: unique('fuel_logs_vehicle_id_spritmonitor_id_key').on(
      table.vehicleId,
      table.spritmonitorId
    ),
    vehicleDateIdx: index('fuel_logs_vehicle_id_date_idx').on(
      table.vehicleId,
      table.date
    ),
  })
);

export const serviceRecords = pgTable(
  'service_records',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),
    vehicleId: text('vehicle_id')
      .notNull()
      .references(() => vehicles.id, { onDelete: 'cascade' }),
    costEntryId: text('cost_entry_id').references(() => costEntries.id, {
      onDelete: 'set null',
    }),
    serviceType: text('service_type').notNull(),
    mileageAtService: integer('mileage_at_service').notNull(),
    nextServiceDate: timestamp('next_service_date', { withTimezone: true }),
    nextServiceMileage: integer('next_service_mileage'),
    notes: text('notes'),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    vehicleIdIdx: index('service_records_vehicle_id_idx').on(table.vehicleId),
    costEntryIdUnique: unique('service_records_cost_entry_id_key').on(
      table.costEntryId
    ),
  })
);

// ── Relations ─────────────────────────────

export const vehiclesRelations = relations(vehicles, ({ many }) => ({
  seasons: many(seasons),
  costEntries: many(costEntries),
  fuelLogs: many(fuelLogs),
  serviceRecords: many(serviceRecords),
}));

export const seasonsRelations = relations(seasons, ({ one, many }) => ({
  vehicle: one(vehicles, {
    fields: [seasons.vehicleId],
    references: [vehicles.id],
  }),
  costEntries: many(costEntries),
}));

export const costEntriesRelations = relations(costEntries, ({ one, many }) => ({
  vehicle: one(vehicles, {
    fields: [costEntries.vehicleId],
    references: [vehicles.id],
  }),
  season: one(seasons, {
    fields: [costEntries.seasonId],
    references: [seasons.id],
  }),
  items: many(costEntryItems),
  serviceRecord: one(serviceRecords),
}));

export const costEntryItemsRelations = relations(costEntryItems, ({ one }) => ({
  costEntry: one(costEntries, {
    fields: [costEntryItems.costEntryId],
    references: [costEntries.id],
  }),
}));

export const fuelLogsRelations = relations(fuelLogs, ({ one }) => ({
  vehicle: one(vehicles, {
    fields: [fuelLogs.vehicleId],
    references: [vehicles.id],
  }),
}));

export const serviceRecordsRelations = relations(serviceRecords, ({ one }) => ({
  vehicle: one(vehicles, {
    fields: [serviceRecords.vehicleId],
    references: [vehicles.id],
  }),
  costEntry: one(costEntries, {
    fields: [serviceRecords.costEntryId],
    references: [costEntries.id],
  }),
}));

// Export schema object for drizzle-orm type inference
export const schema = {
  // Enums
  vehicleTypeEnum,
  costCategoryEnum,
  costSourceEnum,
  seasonStatusEnum,
  // Tables
  vehicles,
  seasons,
  costEntries,
  costEntryItems,
  fuelLogs,
  serviceRecords,
  // Relations
  vehiclesRelations,
  seasonsRelations,
  costEntriesRelations,
  costEntryItemsRelations,
  fuelLogsRelations,
  serviceRecordsRelations,
};
