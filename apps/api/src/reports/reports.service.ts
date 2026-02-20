import { Injectable, NotFoundException } from '@nestjs/common';
import { DrizzleService } from '../drizzle/drizzle.service';
import { eq, and, gte, lte } from 'drizzle-orm';
import { vehicles, costEntries, seasons } from '@pitbook/db';

export interface ReportFilter {
  vehicleId: string;
  seasonId?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

@Injectable()
export class ReportsService {
  constructor(private drizzle: DrizzleService) {}

  async generateReport(filter: ReportFilter) {
    const { vehicleId, seasonId, dateFrom, dateTo } = filter;

    const vehicle = await this.drizzle.db.query.vehicles.findFirst({
      where: eq(vehicles.id, vehicleId),
    });
    if (!vehicle) throw new NotFoundException(`Vehicle ${vehicleId} not found`);

    const conditions = [eq(costEntries.vehicleId, vehicleId)];
    if (seasonId) conditions.push(eq(costEntries.seasonId, seasonId));
    if (dateFrom) conditions.push(gte(costEntries.date, dateFrom));
    if (dateTo) conditions.push(lte(costEntries.date, dateTo));

    const entries = await this.drizzle.db.query.costEntries.findMany({
      where: and(...conditions),
      with: {
        items: true,
        season: true,
      },
      orderBy: (costEntries, { asc }) => [asc(costEntries.date)],
    });

    // Aggregate by category
    const byCategory: Record<string, number> = {};
    let totalAmount = 0;

    for (const entry of entries) {
      const amount = Number(entry.totalAmount);
      totalAmount += amount;
      byCategory[entry.category] = (byCategory[entry.category] || 0) + amount;
    }

    // Season info
    let seasonInfo = null;
    if (seasonId) {
      seasonInfo = await this.drizzle.db.query.seasons.findFirst({
        where: eq(seasons.id, seasonId),
      });
    }

    return {
      vehicle: { id: vehicle.id, name: vehicle.name, brand: vehicle.brand, model: vehicle.model },
      season: seasonInfo,
      period: {
        from: dateFrom || entries[0]?.date || null,
        to: dateTo || entries[entries.length - 1]?.date || null,
        label: seasonInfo?.name || 'Gesamtübersicht',
      },
      summary: {
        totalAmount,
        entryCount: entries.length,
        byCategory,
      },
      entries: entries.map((entry) => ({
        id: entry.id,
        title: entry.title,
        category: entry.category,
        date: entry.date,
        totalAmount: Number(entry.totalAmount),
        notes: entry.notes,
        source: entry.source,
        items: entry.items.map((item) => ({
          description: item.description,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          amount: Number(item.amount),
        })),
      })),
    };
  }

  /**
   * Generate a flat CSV-exportable format
   */
  async generateCsvData(filter: ReportFilter): Promise<string> {
    const report = await this.generateReport(filter);

    const rows: string[] = [
      'Datum,Kategorie,Titel,Position,Menge,Einzelpreis,Betrag',
    ];

    for (const entry of report.entries) {
      if (entry.items.length === 0) {
        rows.push(
          [
            entry.date.toISOString().split('T')[0],
            entry.category,
            `"${entry.title}"`,
            '',
            '',
            '',
            entry.totalAmount.toFixed(2),
          ].join(','),
        );
      } else {
        for (const item of entry.items) {
          rows.push(
            [
              entry.date.toISOString().split('T')[0],
              entry.category,
              `"${entry.title}"`,
              `"${item.description}"`,
              item.quantity,
              item.unitPrice.toFixed(2),
              item.amount.toFixed(2),
            ].join(','),
          );
        }
      }
    }

    return rows.join('\n');
  }
}
