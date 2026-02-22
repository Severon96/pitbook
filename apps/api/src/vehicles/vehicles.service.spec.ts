import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { VehiclesService } from './vehicles.service';
import { DrizzleService } from '../drizzle/drizzle.service';

describe('VehiclesService', () => {
  let service: VehiclesService;
  let drizzleService: DrizzleService;

  const mockVehicle = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    userId: 'user-123',
    name: 'Test Vehicle',
    brand: 'Toyota',
    model: 'Camry',
    year: 2022,
    type: 'DAILY' as const,
    licensePlate: 'ABC-123',
    vin: null,
    imageUrl: null,
    notes: null,
    spritmonitorVehicleId: null,
    spritmonitorApiKey: null,
    spritmonitorLastSync: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockDb = {
    query: {
      vehicles: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
      },
      vehicleShares: {
        findMany: jest.fn(),
      },
    },
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    select: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VehiclesService,
        {
          provide: DrizzleService,
          useValue: {
            db: mockDb,
          },
        },
      ],
    }).compile();

    service = module.get<VehiclesService>(VehiclesService);
    drizzleService = module.get<DrizzleService>(DrizzleService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all vehicles for admin users', async () => {
      const mockVehicles = [mockVehicle];
      mockDb.query.vehicles.findMany.mockResolvedValue(mockVehicles);
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 5 }]),
        }),
      });

      const result = await service.findAll('admin-user-id', 'ADMIN');

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('_count');
      expect(mockDb.query.vehicles.findMany).toHaveBeenCalled();
    });

    it('should return only owned vehicles for regular users', async () => {
      const mockVehicles = [mockVehicle];
      mockDb.query.vehicles.findMany.mockResolvedValue(mockVehicles);
      mockDb.query.vehicleShares.findMany.mockResolvedValue([]);
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 5 }]),
        }),
      });

      const result = await service.findAll('user-123', 'USER');

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('_count');
    });

    it('should return empty array when no vehicles exist', async () => {
      mockDb.query.vehicles.findMany.mockResolvedValue([]);
      mockDb.query.vehicleShares.findMany.mockResolvedValue([]);

      const result = await service.findAll('user-123', 'USER');

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a single vehicle by id', async () => {
      mockDb.query.vehicles.findFirst.mockResolvedValue(mockVehicle);

      const result = await service.findOne('550e8400-e29b-41d4-a716-446655440000');

      expect(result).toEqual(mockVehicle);
      expect(mockDb.query.vehicles.findFirst).toHaveBeenCalled();
    });

    it('should throw NotFoundException when vehicle not found', async () => {
      mockDb.query.vehicles.findFirst.mockResolvedValue(null);

      await expect(service.findOne('123e4567-e89b-12d3-a456-426614174000')).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('create', () => {
    it('should create a new vehicle', async () => {
      const createDto = {
        name: 'New Vehicle',
        brand: 'Honda',
        model: 'Civic',
        year: 2023,
        type: 'DAILY' as const,
      };

      mockDb.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([{ ...mockVehicle, ...createDto }]),
        }),
      });

      const result = await service.create(createDto, 'user-123');

      expect(result).toHaveProperty('brand', 'Honda');
      expect(mockDb.insert).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update an existing vehicle', async () => {
      const updateDto = {
        name: 'Updated Vehicle',
      };

      mockDb.query.vehicles.findFirst.mockResolvedValue(mockVehicle);
      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([{ ...mockVehicle, ...updateDto }]),
          }),
        }),
      });

      const result = await service.update('550e8400-e29b-41d4-a716-446655440000', updateDto);

      expect(result).toHaveProperty('name', 'Updated Vehicle');
    });

    it('should throw NotFoundException when updating non-existent vehicle', async () => {
      mockDb.query.vehicles.findFirst.mockResolvedValue(null);

      await expect(
        service.update('123e4567-e89b-12d3-a456-426614174000', { name: 'Test' })
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a vehicle', async () => {
      mockDb.query.vehicles.findFirst.mockResolvedValue(mockVehicle);
      mockDb.delete.mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([mockVehicle]),
        }),
      });

      const result = await service.remove('550e8400-e29b-41d4-a716-446655440000');

      expect(result).toEqual(mockVehicle);
    });

    it('should throw NotFoundException when deleting non-existent vehicle', async () => {
      mockDb.query.vehicles.findFirst.mockResolvedValue(null);

      await expect(service.remove('123e4567-e89b-12d3-a456-426614174000')).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('getSummary', () => {
    it('should return vehicle cost summary', async () => {
      mockDb.query.vehicles.findFirst.mockResolvedValue(mockVehicle);

      // Mock the first select for total
      const mockWhereForTotal = jest.fn().mockResolvedValue([{ sum: '500.00', count: 10 }]);
      const mockFromForTotal = jest.fn().mockReturnValue({
        where: mockWhereForTotal,
      });

      // Mock the second select for category breakdown
      const mockGroupBy = jest.fn().mockResolvedValue([
        { category: 'FUEL', sum: '300.00' },
        { category: 'SERVICE', sum: '200.00' },
      ]);
      const mockWhereForCategory = jest.fn().mockReturnValue({
        groupBy: mockGroupBy,
      });
      const mockFromForCategory = jest.fn().mockReturnValue({
        where: mockWhereForCategory,
      });

      // Mock select to return different chains on consecutive calls
      mockDb.select
        .mockReturnValueOnce({ from: mockFromForTotal })
        .mockReturnValueOnce({ from: mockFromForCategory });

      const result = await service.getSummary('550e8400-e29b-41d4-a716-446655440000');

      expect(result).toHaveProperty('totalAmount', 500);
      expect(result).toHaveProperty('entryCount', 10);
      expect(result.byCategory).toHaveLength(2);
    });

    it('should throw NotFoundException when vehicle not found', async () => {
      mockDb.query.vehicles.findFirst.mockResolvedValue(null);

      await expect(service.getSummary('123e4567-e89b-12d3-a456-426614174000')).rejects.toThrow(
        NotFoundException
      );
    });
  });
});
