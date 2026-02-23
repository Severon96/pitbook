import { Injectable } from '@nestjs/common';
import { DrizzleService } from '../drizzle/drizzle.service';
import { eq } from 'drizzle-orm';
import { vehicles } from '@pitbook/db';
import axios from 'axios';

const SPRITMONITOR_API = 'https://api.spritmonitor.de/v1';
// Public app token assigned by Spritmonitor for community integrations
const SPRITMONITOR_APP_TOKEN = '190e3b1080a39777f369a4e9875df3d7';

@Injectable()
export class SpritmonitorService {
  constructor(private drizzle: DrizzleService) {}

  /**
   * Fetch all vehicles from a Spritmonitor account using the given API key.
   */
  async getVehicles(apiKey: string): Promise<Array<{ id: string; make: string; model: string }>> {
    const response = await axios.get(`${SPRITMONITOR_API}/vehicles.json`, {
      headers: { Authorization: `Bearer ${apiKey}`, 'Application-Id': SPRITMONITOR_APP_TOKEN },
    });
    return response.data;
  }

  /**
   * Fetch the current average fuel consumption for a linked local vehicle.
   * Returns null if the vehicle is not linked to Spritmonitor.
   */
  async getStats(localVehicleId: string): Promise<{ consumption: string; consumptionunit: string } | null> {
    const vehicle = await this.drizzle.db.query.vehicles.findFirst({
      where: eq(vehicles.id, localVehicleId),
    });

    if (!vehicle?.spritmonitorVehicleId || !vehicle?.spritmonitorApiKey) {
      return null;
    }

    const response = await axios.get(`${SPRITMONITOR_API}/vehicles.json`, {
      headers: {
        Authorization: `Bearer ${vehicle.spritmonitorApiKey}`,
        'Application-Id': SPRITMONITOR_APP_TOKEN,
      },
    });

    const apiVehicles: any[] = response.data;
    const match = apiVehicles.find((v: any) => String(v.id) === vehicle.spritmonitorVehicleId);

    if (!match) {
      return null;
    }

    return {
      consumption: match.consumption,
      consumptionunit: match.consumptionunit,
    };
  }
}
