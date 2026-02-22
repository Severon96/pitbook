import { Injectable, NotFoundException } from '@nestjs/common';
import { DrizzleService } from '../drizzle/drizzle.service';
import { CreateCostEntryDto } from './dto/create-cost-entry.dto';
import { eq, and } from 'drizzle-orm';
import { costEntries, costEntryItems } from '@pitbook/db';

@Injectable()
export class CostEntriesService {
  constructor(private drizzle: DrizzleService) {}

  async findAll(vehicleId: string, seasonId?: string) {
    const conditions = [eq(costEntries.vehicleId, vehicleId)];
    if (seasonId) {
      conditions.push(eq(costEntries.seasonId, seasonId));
    }

    return await this.drizzle.db.query.costEntries.findMany({
      where: conditions.length > 1 ? and(...conditions) : conditions[0],
      with: {
        items: true,
      },
      orderBy: (costEntries, { desc }) => [desc(costEntries.date)],
    });
  }

  async findOne(id: string) {
    const entry = await this.drizzle.db.query.costEntries.findFirst({
      where: eq(costEntries.id, id),
      with: { items: true, season: true },
    });
    if (!entry) throw new NotFoundException(`CostEntry ${id} not found`);
    return entry;
  }

  async create(dto: CreateCostEntryDto) {
    const { items, totalAmount, vehicleId, seasonId, category, title, date, notes, receiptUrl, source } = dto;

    try {
      // Calculate totalAmount from items if items are provided
      const computedTotal =
        items && items.length > 0
          ? items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
          : totalAmount ?? 0;

      return await this.drizzle.db.transaction(async (tx) => {
        const [newEntry] = await tx
          .insert(costEntries)
          .values({
            vehicleId,
            seasonId,
            category,
            title,
            date: new Date(date),
            totalAmount: computedTotal.toString(),
            notes,
            receiptUrl,
            source: source ?? 'MANUAL',
          })
          .returning();

        let createdItems = [];
        if (items && items.length > 0) {
          createdItems = await tx
            .insert(costEntryItems)
            .values(
              items.map((item) => ({
                costEntryId: newEntry.id,
                description: item.description,
                quantity: item.quantity.toString(),
                unitPrice: item.unitPrice.toString(),
                amount: (item.quantity * item.unitPrice).toString(),
              }))
            )
            .returning();
        }

        return { ...newEntry, items: createdItems };
      });
    } catch (error) {
      console.error('Error creating cost entry:', error);
      throw error;
    }
  }

  async remove(id: string) {
    await this.findOne(id);
    const [deleted] = await this.drizzle.db
      .delete(costEntries)
      .where(eq(costEntries.id, id))
      .returning();
    return deleted;
  }
}
