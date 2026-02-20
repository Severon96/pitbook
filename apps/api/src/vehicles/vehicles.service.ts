import { Injectable, NotFoundException } from '@nestjs/common';
import { DrizzleService } from '../drizzle/drizzle.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { eq, sql, sum, count } from 'drizzle-orm';
import { vehicles, costEntries, fuelLogs } from '@pitbook/db/schema';

@Injectable()
export class VehiclesService {
  constructor(private drizzle: DrizzleService) {}

  async findAll() {
    const vehiclesList = await this.drizzle.db.query.vehicles.findMany({
      with: {
        seasons: {
          orderBy: (seasons, { desc }) => [desc(seasons.startDate)],
        },
      },
      orderBy: (vehicles, { desc }) => [desc(vehicles.createdAt)],
    });

    // Manual count for relations (Drizzle doesn't have _count)
    return Promise.all(
      vehiclesList.map(async (v) => {
        const [costCount] = await this.drizzle.db
          .select({ count: count() })
          .from(costEntries)
          .where(eq(costEntries.vehicleId, v.id));

        const [fuelCount] = await this.drizzle.db
          .select({ count: count() })
          .from(fuelLogs)
          .where(eq(fuelLogs.vehicleId, v.id));

        return {
          ...v,
          _count: {
            costEntries: costCount.count,
            fuelLogs: fuelCount.count,
          },
        };
      })
    );
  }

  async findOne(id: string) {
    const vehicle = await this.drizzle.db.query.vehicles.findFirst({
      where: eq(vehicles.id, id),
      with: {
        seasons: {
          orderBy: (seasons, { desc }) => [desc(seasons.startDate)],
        },
        serviceRecords: {
          orderBy: (serviceRecords, { desc }) => [desc(serviceRecords.createdAt)],
          limit: 5,
        },
      },
    });
    if (!vehicle) throw new NotFoundException(`Vehicle ${id} not found`);
    return vehicle;
  }

  async create(dto: CreateVehicleDto) {
    const [vehicle] = await this.drizzle.db
      .insert(vehicles)
      .values(dto)
      .returning();
    return vehicle;
  }

  async update(id: string, dto: UpdateVehicleDto) {
    await this.findOne(id);
    const [updated] = await this.drizzle.db
      .update(vehicles)
      .set(dto)
      .where(eq(vehicles.id, id))
      .returning();
    return updated;
  }

  async remove(id: string) {
    await this.findOne(id);
    const [deleted] = await this.drizzle.db
      .delete(vehicles)
      .where(eq(vehicles.id, id))
      .returning();
    return deleted;
  }

  async getSummary(id: string) {
    await this.findOne(id);

    const [totalResult] = await this.drizzle.db
      .select({
        sum: sum(costEntries.totalAmount),
        count: count(),
      })
      .from(costEntries)
      .where(eq(costEntries.vehicleId, id));

    const byCategory = await this.drizzle.db
      .select({
        category: costEntries.category,
        sum: sum(costEntries.totalAmount),
      })
      .from(costEntries)
      .where(eq(costEntries.vehicleId, id))
      .groupBy(costEntries.category);

    return {
      totalAmount: Number(totalResult.sum || 0),
      entryCount: totalResult.count,
      byCategory: byCategory.map((g) => ({
        category: g.category,
        amount: Number(g.sum || 0),
      })),
    };
  }
}
