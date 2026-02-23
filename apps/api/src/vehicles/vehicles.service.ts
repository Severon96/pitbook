import {Injectable, NotFoundException} from '@nestjs/common';
import {DrizzleService} from '../drizzle/drizzle.service';
import {CreateVehicleDto} from './dto/create-vehicle.dto';
import {UpdateVehicleDto} from './dto/update-vehicle.dto';
import {count, eq, sum} from 'drizzle-orm';
import {costEntries, vehicles, vehicleShares} from '@pitbook/db';

@Injectable()
export class VehiclesService {
  constructor(private drizzle: DrizzleService) {}

  async findAll(userId: string, userRole: string) {
    // Admins see all vehicles
    if (userRole === 'ADMIN') {
      const vehiclesList = await this.drizzle.db.query.vehicles.findMany({
        with: {
          seasons: {
            orderBy: (seasons, { desc }) => [desc(seasons.startDate)],
          },
        },
        orderBy: (vehicles, { desc }) => [desc(vehicles.createdAt)],
      });

      return Promise.all(
        vehiclesList.map(async (v) => {
          const [costCount] = await this.drizzle.db
            .select({ count: count() })
            .from(costEntries)
            .where(eq(costEntries.vehicleId, v.id));

          return {
            ...v,
            _count: {
              costEntries: costCount.count,
            },
          };
        })
      );
    }

    // Regular users see only their own vehicles + shared vehicles
    const ownedVehicles = await this.drizzle.db.query.vehicles.findMany({
      where: eq(vehicles.userId, userId),
      with: {
        seasons: {
          orderBy: (seasons, { desc }) => [desc(seasons.startDate)],
        },
      },
      orderBy: (vehicles, { desc }) => [desc(vehicles.createdAt)],
    });

    // Get shared vehicles
    const sharedVehiclesList = await this.drizzle.db.query.vehicleShares.findMany({
      where: eq(vehicleShares.userId, userId),
      with: {
        vehicle: {
          with: {
            seasons: {
              orderBy: (seasons, { desc }) => [desc(seasons.startDate)],
            },
          },
        },
      },
    });

    const allVehicles = [
      ...ownedVehicles,
      ...sharedVehiclesList.map(s => ({ ...s.vehicle, shareRole: s.role })),
    ];

    // Add counts
    return Promise.all(
      allVehicles.map(async (v) => {
        const [costCount] = await this.drizzle.db
          .select({ count: count() })
          .from(costEntries)
          .where(eq(costEntries.vehicleId, v.id));

        return {
          ...v,
          _count: {
            costEntries: costCount.count,
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

  async create(dto: CreateVehicleDto, userId: string) {
    const [vehicle] = await this.drizzle.db
      .insert(vehicles)
      .values({ ...dto, userId })
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
