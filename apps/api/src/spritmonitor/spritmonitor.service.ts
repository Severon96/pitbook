import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DrizzleService } from '../drizzle/drizzle.service';
import { eq, and, isNotNull } from 'drizzle-orm';
import { vehicles, fuelLogs, costEntries } from '@pitbook/db';
import axios from 'axios';

const SPRITMONITOR_API = 'https://api.spritmonitor.de/v1';

@Injectable()
export class SpritmonitorService {
  private readonly logger = new Logger(SpritmonitorService.name);

  constructor(private drizzle: DrizzleService) {}

  /**
   * Get all vehicles from Spritmonitor account
   */
  async getVehicles(apiKey: string) {
    const response = await axios.get(`${SPRITMONITOR_API}/vehicles.json`, {
      headers: { Authorization: `Bearer ${apiKey}`, 'Application-Id': 'Pitbook' },
    });
    return response.data;
  }

  /**
   * Link a local vehicle to a Spritmonitor vehicle ID
   */
  async linkVehicle(vehicleId: string, spritmonitorVehicleId: string, apiKey: string) {
    const [updated] = await this.drizzle.db
      .update(vehicles)
      .set({ spritmonitorVehicleId, spritmonitorApiKey: apiKey })
      .where(eq(vehicles.id, vehicleId))
      .returning();
    return updated;
  }

  /**
   * Sync fuel logs for a single vehicle
   */
  async syncVehicle(vehicleId: string): Promise<{ synced: number; skipped: number }> {
    const vehicle = await this.drizzle.db.query.vehicles.findFirst({
      where: eq(vehicles.id, vehicleId),
    });

    if (!vehicle?.spritmonitorVehicleId || !vehicle?.spritmonitorApiKey) {
      throw new Error('Vehicle not linked to Spritmonitor');
    }

    const response = await axios.get(
      `${SPRITMONITOR_API}/vehicle/${vehicle.spritmonitorVehicleId}/fuelups.json`,
      {
        headers: {
          Authorization: `Bearer ${vehicle.spritmonitorApiKey}`,
          'Application-Id': 'Pitbook',
        },
      },
    );

    const fuelups: any[] = response.data;
    let synced = 0;
    let skipped = 0;

    for (const fuelup of fuelups) {
      const spritmonitorId = String(fuelup.id);

      // Deduplication: skip if already imported
      const existing = await this.drizzle.db.query.fuelLogs.findFirst({
        where: and(
          eq(fuelLogs.vehicleId, vehicleId),
          eq(fuelLogs.spritmonitorId, spritmonitorId)
        ),
      });

      if (existing) {
        skipped++;
        continue;
      }

      const totalCost = fuelup.fuelprice * fuelup.quantity;

      await this.drizzle.db.transaction(async (tx) => {
        // Create fuel log
        await tx.insert(fuelLogs).values({
          vehicleId,
          spritmonitorId,
          date: new Date(fuelup.date),
          liters: fuelup.quantity.toString(),
          pricePerLiter: fuelup.fuelprice.toString(),
          totalCost: totalCost.toString(),
          mileage: fuelup.odometer,
          fullTank: fuelup.fulltank ?? true,
          lastSyncedAt: new Date(),
        });

        // Also create a cost entry for the fuel log
        await tx.insert(costEntries).values({
          vehicleId,
          category: 'FUEL',
          title: `Tanken – ${fuelup.quantity}L`,
          date: new Date(fuelup.date),
          totalAmount: totalCost.toString(),
          source: 'SPRITMONITOR',
          notes: `${fuelup.quantity}L @ ${fuelup.fuelprice}€/L | ${fuelup.odometer}km`,
        });
      });

      synced++;
    }

    // Update last sync timestamp
    await this.drizzle.db
      .update(vehicles)
      .set({ spritmonitorLastSync: new Date() })
      .where(eq(vehicles.id, vehicleId));

    this.logger.log(`Synced ${synced} fuelups for vehicle ${vehicleId} (${skipped} skipped)`);
    return { synced, skipped };
  }

  /**
   * Auto-sync all linked vehicles every 6 hours
   */
  @Cron(CronExpression.EVERY_6_HOURS)
  async syncAllVehicles() {
    const vehiclesToSync = await this.drizzle.db.query.vehicles.findMany({
      where: and(
        isNotNull(vehicles.spritmonitorApiKey),
        isNotNull(vehicles.spritmonitorVehicleId)
      ),
    });

    this.logger.log(`Auto-sync: ${vehiclesToSync.length} linked vehicles`);

    for (const vehicle of vehiclesToSync) {
      try {
        await this.syncVehicle(vehicle.id);
      } catch (err) {
        this.logger.error(`Failed to sync vehicle ${vehicle.id}: ${err.message}`);
      }
    }
  }
}
