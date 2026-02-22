import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { DrizzleService } from '../../drizzle/drizzle.service';
import { vehicles, vehicleShares } from '@pitbook/db';
import { eq, and } from 'drizzle-orm';

@Injectable()
export class VehicleOwnershipGuard implements CanActivate {
  constructor(private drizzle: DrizzleService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return false;
    }

    // Admin can access all vehicles
    if (user.role === 'ADMIN') {
      return true;
    }

    // Extract vehicle ID from params, query, or body
    const vehicleId =
      request.params.id ||
      request.params.vehicleId ||
      request.query.vehicleId ||
      request.body.vehicleId;

    if (!vehicleId) {
      // No vehicle ID to check - allow (other guards will handle)
      return true;
    }

    // Check if vehicle exists
    const vehicle = await this.drizzle.db.query.vehicles.findFirst({
      where: eq(vehicles.id, vehicleId),
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    // Check if user owns the vehicle
    if (vehicle.userId === user.id) {
      return true;
    }

    // Check if vehicle is shared with the user
    const share = await this.drizzle.db.query.vehicleShares.findFirst({
      where: and(
        eq(vehicleShares.vehicleId, vehicleId),
        eq(vehicleShares.userId, user.id),
      ),
    });

    if (!share) {
      throw new ForbiddenException('You do not have access to this vehicle');
    }

    // Check permission level for write operations
    const method = request.method;
    const isWriteOperation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);

    if (isWriteOperation) {
      // VIEWER can only read
      if (share.role === 'VIEWER') {
        throw new ForbiddenException('You only have view access to this vehicle');
      }

      // EDITOR cannot delete or share
      if (share.role === 'EDITOR' && method === 'DELETE') {
        throw new ForbiddenException('You do not have permission to delete this vehicle');
      }
    }

    // Attach share role to request for later use
    request.shareRole = share.role;

    return true;
  }
}
