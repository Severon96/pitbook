import { db, queryClient } from './client';
import { vehicles, seasons, costEntries, costEntryItems } from './schema';

async function main() {
  console.log('🌱 Seeding Pitbook database...');

  // ── Daily Vehicle ─────────────────────────
  const [daily] = await db
    .insert(vehicles)
    .values({
      name: 'Mein Alltagsauto',
      brand: 'Volkswagen',
      model: 'Golf VIII',
      year: 2022,
      type: 'DAILY',
      licensePlate: 'FD-PB 2024',
    })
    .returning();

  // Daily cost entry with items
  const [dailyCost] = await db
    .insert(costEntries)
    .values({
      vehicleId: daily.id,
      category: 'SERVICE',
      title: 'Inspektion + Ölwechsel',
      date: new Date('2024-03-15'),
      totalAmount: '189.90',
      notes: 'Freie Werkstatt, Mobil 1 5W-40',
    })
    .returning();

  await db.insert(costEntryItems).values([
    {
      costEntryId: dailyCost.id,
      description: 'Motoröl Mobil 1 5W-40 (5L)',
      quantity: '1',
      unitPrice: '45.90',
      amount: '45.90',
    },
    {
      costEntryId: dailyCost.id,
      description: 'Ölfilter',
      quantity: '1',
      unitPrice: '12.50',
      amount: '12.50',
    },
    {
      costEntryId: dailyCost.id,
      description: 'Luftfilter',
      quantity: '1',
      unitPrice: '18.50',
      amount: '18.50',
    },
    {
      costEntryId: dailyCost.id,
      description: 'Arbeitszeit (1,5h)',
      quantity: '1.5',
      unitPrice: '75.00',
      amount: '112.50',
    },
  ]);

  // ── Seasonal Vehicle ──────────────────────
  const [seasonal] = await db
    .insert(vehicles)
    .values({
      name: 'Saisonfahrzeug',
      brand: 'Porsche',
      model: '911 Carrera',
      year: 1998,
      type: 'SEASONAL',
      licensePlate: 'FD-PB 911',
    })
    .returning();

  // Season 2023 (closed)
  const [season2023] = await db
    .insert(seasons)
    .values({
      vehicleId: seasonal.id,
      name: 'Saison 2023',
      startDate: new Date('2023-04-01'),
      endDate: new Date('2023-10-31'),
      status: 'CLOSED',
    })
    .returning();

  const [brakeCost] = await db
    .insert(costEntries)
    .values({
      vehicleId: seasonal.id,
      seasonId: season2023.id,
      category: 'REPAIR',
      title: 'Bremsanlage komplett überholt',
      date: new Date('2023-05-10'),
      totalAmount: '780.00',
    })
    .returning();

  await db.insert(costEntryItems).values([
    {
      costEntryId: brakeCost.id,
      description: 'Bremsscheiben vorne (Paar)',
      quantity: '1',
      unitPrice: '180.00',
      amount: '180.00',
    },
    {
      costEntryId: brakeCost.id,
      description: 'Bremsscheiben hinten (Paar)',
      quantity: '1',
      unitPrice: '150.00',
      amount: '150.00',
    },
    {
      costEntryId: brakeCost.id,
      description: 'Bremsbeläge vorne',
      quantity: '1',
      unitPrice: '85.00',
      amount: '85.00',
    },
    {
      costEntryId: brakeCost.id,
      description: 'Bremsbeläge hinten',
      quantity: '1',
      unitPrice: '65.00',
      amount: '65.00',
    },
    {
      costEntryId: brakeCost.id,
      description: 'Bremsflüssigkeit DOT 4',
      quantity: '1',
      unitPrice: '12.00',
      amount: '12.00',
    },
    {
      costEntryId: brakeCost.id,
      description: 'Arbeitszeit (3h)',
      quantity: '3',
      unitPrice: '90.00',
      amount: '270.00',
    },
    {
      costEntryId: brakeCost.id,
      description: 'Versandkosten Teile',
      quantity: '1',
      unitPrice: '8.00',
      amount: '8.00',
    },
    {
      costEntryId: brakeCost.id,
      description: 'Entsorgung Altteile',
      quantity: '1',
      unitPrice: '10.00',
      amount: '10.00',
    },
  ]);

  // Season 2024 (active)
  const [season2024] = await db
    .insert(seasons)
    .values({
      vehicleId: seasonal.id,
      name: 'Saison 2024',
      startDate: new Date('2024-04-01'),
      status: 'ACTIVE',
    })
    .returning();

  const [prepCost] = await db
    .insert(costEntries)
    .values({
      vehicleId: seasonal.id,
      seasonId: season2024.id,
      category: 'SERVICE',
      title: 'Saisonvorbereitung',
      date: new Date('2024-04-02'),
      totalAmount: '320.00',
    })
    .returning();

  await db.insert(costEntryItems).values([
    {
      costEntryId: prepCost.id,
      description: 'Motoröl 10W-60 (6L)',
      quantity: '6',
      unitPrice: '18.00',
      amount: '108.00',
    },
    {
      costEntryId: prepCost.id,
      description: 'Ölfilter',
      quantity: '1',
      unitPrice: '22.00',
      amount: '22.00',
    },
    {
      costEntryId: prepCost.id,
      description: 'Zündkerzen (6 Stück)',
      quantity: '6',
      unitPrice: '18.00',
      amount: '108.00',
    },
    {
      costEntryId: prepCost.id,
      description: 'Arbeitszeit (2h)',
      quantity: '2',
      unitPrice: '90.00',
      amount: '180.00',
    },
  ]);

  console.log(`✅ Seed complete!`);
  console.log(`   Daily vehicle: ${daily.name} (${daily.id})`);
  console.log(`   Seasonal vehicle: ${seasonal.name} (${seasonal.id})`);
  console.log(`   Seasons: ${season2023.name}, ${season2024.name}`);
}

main()
  .catch(console.error)
  .finally(async () => {
    await queryClient.end();
    process.exit(0);
  });
