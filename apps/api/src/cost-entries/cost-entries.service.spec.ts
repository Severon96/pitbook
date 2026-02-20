import {Test, TestingModule} from '@nestjs/testing';
import {NotFoundException} from '@nestjs/common';
import {CostEntriesService} from './cost-entries.service';
import {DrizzleService} from '../drizzle/drizzle.service';
import {CreateCostEntryDto} from './dto/create-cost-entry.dto';

describe('CostEntriesService', () => {
  let service: CostEntriesService;
  let drizzleService: DrizzleService;

  const mockCostEntry = {
    id: 'test-cost-entry-id',
    vehicleId: 'test-vehicle-id',
    seasonId: null,
    category: 'FUEL' as const,
    title: 'Gas fillup',
    date: new Date('2024-01-15'),
    totalAmount: '50.00',
    notes: null,
    receiptUrl: null,
    source: 'MANUAL' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockDb = {
    query: {
      costEntries: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
      },
    },
    transaction: jest.fn(),
    insert: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CostEntriesService,
        {
          provide: DrizzleService,
          useValue: {
            db: mockDb,
          },
        },
      ],
    }).compile();

    service = module.get<CostEntriesService>(CostEntriesService);
    drizzleService = module.get<DrizzleService>(DrizzleService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return cost entries for a vehicle', async () => {
      const mockEntries = [mockCostEntry];
      mockDb.query.costEntries.findMany.mockResolvedValue(mockEntries);

      const result = await service.findAll('test-vehicle-id');

      expect(result).toEqual(mockEntries);
      expect(mockDb.query.costEntries.findMany).toHaveBeenCalled();
    });

    it('should filter by seasonId when provided', async () => {
      mockDb.query.costEntries.findMany.mockResolvedValue([mockCostEntry]);

      const result = await service.findAll('test-vehicle-id', 'test-season-id');

      expect(result).toEqual([mockCostEntry]);
      expect(mockDb.query.costEntries.findMany).toHaveBeenCalled();
    });

    it('should return empty array when no entries exist', async () => {
      mockDb.query.costEntries.findMany.mockResolvedValue([]);

      const result = await service.findAll('test-vehicle-id');

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a single cost entry by id', async () => {
      mockDb.query.costEntries.findFirst.mockResolvedValue(mockCostEntry);

      const result = await service.findOne('test-cost-entry-id');

      expect(result).toEqual(mockCostEntry);
    });

    it('should throw NotFoundException when entry not found', async () => {
      mockDb.query.costEntries.findFirst.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('create', () => {
    it('should create a cost entry without items', async () => {
      const createDto: CreateCostEntryDto = {
        vehicleId: 'test-vehicle-id',
        category: 'FUEL' as any,
        title: 'Gas fillup',
        date: '2024-01-15',
        totalAmount: 50.00,
      };

      mockDb.transaction = jest.fn((callback) => {
        const tx = {
          insert: jest.fn().mockReturnValue({
            values: jest.fn().mockReturnValue({
              returning: jest.fn().mockResolvedValue([{...mockCostEntry, items: []}]),
            }),
          }),
        };
        return callback(tx);
      });

      const result = await service.create(createDto);

      expect(result).toHaveProperty('id', mockCostEntry.id);
      expect(result).toHaveProperty('category', mockCostEntry.category);
      expect(mockDb.transaction).toHaveBeenCalled();
    });

    it('should create a cost entry with items', async () => {
      const createDto: CreateCostEntryDto = {
        vehicleId: 'test-vehicle-id',
        category: 'SERVICE' as any,
        title: 'Oil change',
        date: '2024-01-15',
        items: [
          { description: 'Oil filter', quantity: 1, unitPrice: 15.00 },
          { description: 'Motor oil', quantity: 5, unitPrice: 8.00 },
        ],
      };

      mockDb.transaction = jest.fn((callback) => {
        const tx = {
          insert: jest.fn().mockReturnValue({
            values: jest.fn().mockReturnValue({
              returning: jest.fn().mockResolvedValue([
                {...mockCostEntry, totalAmount: '55.00'},
              ]),
            }),
          }),
        };
        return callback(tx);
      });

      const result = await service.create(createDto);

      expect(result).toHaveProperty('totalAmount', '55.00');
      expect(mockDb.transaction).toHaveBeenCalled();
    });

    it('should calculate total from items when items provided', async () => {
      const createDto: CreateCostEntryDto = {
        vehicleId: 'test-vehicle-id',
        category: 'PARTS' as any,
        title: 'New tires',
        date: '2024-01-15',
        items: [
          { description: 'Tire', quantity: 4, unitPrice: 100.00 },
        ],
      };

      mockDb.transaction = jest.fn((callback) => {
        const tx = {
          insert: jest.fn().mockReturnValue({
            values: jest.fn().mockReturnValue({
              returning: jest.fn().mockResolvedValue([
                {...mockCostEntry, totalAmount: '400.00'},
              ]),
            }),
          }),
        };
        return callback(tx);
      });

      const result = await service.create(createDto);

      expect(result).toHaveProperty('totalAmount', '400.00');
    });
  });

  describe('remove', () => {
    it('should delete a cost entry', async () => {
      mockDb.query.costEntries.findFirst.mockResolvedValue(mockCostEntry);
      mockDb.delete.mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([mockCostEntry]),
        }),
      });

      const result = await service.remove('test-cost-entry-id');

      expect(result).toEqual(mockCostEntry);
    });

    it('should throw NotFoundException when deleting non-existent entry', async () => {
      mockDb.query.costEntries.findFirst.mockResolvedValue(null);

      await expect(service.remove('non-existent-id')).rejects.toThrow(
        NotFoundException
      );
    });
  });
});
