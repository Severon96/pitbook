// ─────────────────────────────────────────
// Pitbook – Drizzle Schema
// ─────────────────────────────────────────

import {boolean, index, integer, numeric, pgEnum, pgTable, text, timestamp, unique, uuid} from 'drizzle-orm/pg-core';
import {relations} from 'drizzle-orm';
import {randomUUID} from 'crypto';

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
export const userRoleEnum = pgEnum('UserRole', ['ADMIN', 'USER']);
export const authProviderEnum = pgEnum('AuthProvider', ['LOCAL', 'OIDC']);
export const vehicleShareRoleEnum = pgEnum('VehicleShareRole', ['OWNER', 'EDITOR', 'VIEWER']);
export const vehicleTodoStatusEnum = pgEnum('vehicle_todo_status', ['OPEN', 'DONE']);

// ── Tables ────────────────────────────────

export const users = pgTable(
  'users',
  {
    id: uuid('id')
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    email: text('email').notNull().unique(),
    username: text('username').notNull().unique(),
    passwordHash: text('password_hash'), // NULL for OAuth users
    role: userRoleEnum('role').notNull().default('USER'),
    authProvider: authProviderEnum('auth_provider').notNull().default('LOCAL'),
    oidcSub: text('oidc_sub').unique(),
    isActive: boolean('is_active').notNull().default(true),
    lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    emailIdx: index('users_email_idx').on(table.email),
    oidcSubIdx: index('users_oidc_sub_idx').on(table.oidcSub),
  })
);

export const vehicles = pgTable('vehicles', {
  id: uuid('id')
    .primaryKey()
    .$defaultFn(() => randomUUID()),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
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
  id: uuid('id')
    .primaryKey()
    .$defaultFn(() => randomUUID()),
  vehicleId: uuid('vehicle_id')
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
    id: uuid('id')
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    vehicleId: uuid('vehicle_id')
      .notNull()
      .references(() => vehicles.id, { onDelete: 'cascade' }),
    seasonId: uuid('season_id').references(() => seasons.id, {
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
  id: uuid('id')
    .primaryKey()
    .$defaultFn(() => randomUUID()),
  costEntryId: uuid('cost_entry_id')
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
    id: uuid('id')
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    vehicleId: uuid('vehicle_id')
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
    id: uuid('id')
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    vehicleId: uuid('vehicle_id')
      .notNull()
      .references(() => vehicles.id, { onDelete: 'cascade' }),
    costEntryId: uuid('cost_entry_id').references(() => costEntries.id, {
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

export const vehicleShares = pgTable(
  'vehicle_shares',
  {
    id: uuid('id')
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    vehicleId: uuid('vehicle_id')
      .notNull()
      .references(() => vehicles.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: vehicleShareRoleEnum('role').notNull(),
    grantedById: uuid('granted_by_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    grantedAt: timestamp('granted_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    vehicleUserUnique: unique('vehicle_shares_vehicle_user_unique').on(
      table.vehicleId,
      table.userId
    ),
    vehicleIdIdx: index('vehicle_shares_vehicle_id_idx').on(table.vehicleId),
    userIdIdx: index('vehicle_shares_user_id_idx').on(table.userId),
  })
);

export const oauthSessions = pgTable(
  'oauth_sessions',
  {
    id: uuid('id')
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    state: text('state').notNull().unique(),
    nonce: text('nonce').notNull(),
    redirectUri: text('redirect_uri'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  },
  (table) => ({
    stateIdx: index('oauth_sessions_state_idx').on(table.state),
    expiresAtIdx: index('oauth_sessions_expires_at_idx').on(table.expiresAt),
  })
);

export const vehicleTodos = pgTable(
  'vehicle_todos',
  {
    id: uuid('id')
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    vehicleId: uuid('vehicle_id')
      .notNull()
      .references(() => vehicles.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    status: vehicleTodoStatusEnum('status').notNull().default('OPEN'),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    vehicleIdIdx: index('vehicle_todos_vehicle_id_idx').on(table.vehicleId),
  })
);

export const vehicleTodoParts = pgTable('vehicle_todo_parts', {
  id: uuid('id')
    .primaryKey()
    .$defaultFn(() => randomUUID()),
  todoId: uuid('todo_id')
    .notNull()
    .references(() => vehicleTodos.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  link: text('link'),
  price: numeric('price', { precision: 10, scale: 2 }),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ── Relations ─────────────────────────────

export const usersRelations = relations(users, ({ many }) => ({
  vehicles: many(vehicles),
  vehicleShares: many(vehicleShares, { relationName: 'userShares' }),
  grantedShares: many(vehicleShares, { relationName: 'grantedByUser' }),
}));

export const vehiclesRelations = relations(vehicles, ({ one, many }) => ({
  user: one(users, {
    fields: [vehicles.userId],
    references: [users.id],
  }),
  shares: many(vehicleShares),
  seasons: many(seasons),
  costEntries: many(costEntries),
  fuelLogs: many(fuelLogs),
  serviceRecords: many(serviceRecords),
  todos: many(vehicleTodos),
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

export const vehicleSharesRelations = relations(vehicleShares, ({ one }) => ({
  vehicle: one(vehicles, {
    fields: [vehicleShares.vehicleId],
    references: [vehicles.id],
  }),
  user: one(users, {
    fields: [vehicleShares.userId],
    references: [users.id],
    relationName: 'userShares',
  }),
  grantedBy: one(users, {
    fields: [vehicleShares.grantedById],
    references: [users.id],
    relationName: 'grantedByUser',
  }),
}));

export const vehicleTodosRelations = relations(vehicleTodos, ({ one, many }) => ({
  vehicle: one(vehicles, {
    fields: [vehicleTodos.vehicleId],
    references: [vehicles.id],
  }),
  parts: many(vehicleTodoParts),
}));

export const vehicleTodoPartsRelations = relations(vehicleTodoParts, ({ one }) => ({
  todo: one(vehicleTodos, {
    fields: [vehicleTodoParts.todoId],
    references: [vehicleTodos.id],
  }),
}));

// Export schema object for drizzle-orm type inference
export const schema = {
  // Enums
  vehicleTypeEnum,
  costCategoryEnum,
  costSourceEnum,
  seasonStatusEnum,
  userRoleEnum,
  authProviderEnum,
  vehicleShareRoleEnum,
  vehicleTodoStatusEnum,
  // Tables
  users,
  vehicles,
  seasons,
  costEntries,
  costEntryItems,
  fuelLogs,
  serviceRecords,
  vehicleShares,
  oauthSessions,
  vehicleTodos,
  vehicleTodoParts,
  // Relations
  usersRelations,
  vehiclesRelations,
  seasonsRelations,
  costEntriesRelations,
  costEntryItemsRelations,
  fuelLogsRelations,
  serviceRecordsRelations,
  vehicleSharesRelations,
  vehicleTodosRelations,
  vehicleTodoPartsRelations,
};
