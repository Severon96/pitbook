import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { DrizzleService } from '../drizzle/drizzle.service';

describe('ReportsService', () => {
  let service: ReportsService;
  let drizzleService: DrizzleService;

  const mockVehicle = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'Test Vehicle',
    brand: 'Toyota',
    model: 'Camry',
    year: 2022,
    type: 'DAILY' as const,
  };

  const mockSeason = {
    id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    vehicleId: '550e8400-e29b-41d4-a716-446655440000',
    name: 'Saison 2024',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-12-31'),
    status: 'ACTIVE' as const,
  };

  const mockCostEntry = {
    id: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
    vehicleId: '550e8400-e29b-41d4-a716-446655440000',
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
    items: [],
  };

  const mockCostEntryWithItems = {
    id: '8d0e7780-8536-51ef-95df-f18gd2g91bf8',
    vehicleId: '550e8400-e29b-41d4-a716-446655440000',
    seasonId: null,
    category: 'SERVICE' as const,
    title: 'Oil change',
    date: new Date('2024-02-20'),
    totalAmount: '100.00',
    notes: null,
    receiptUrl: null,
    source: 'MANUAL' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
    items: [
      {
        id: 'item-1',
        costEntryId: '8d0e7780-8536-51ef-95df-f18gd2g91bf8',
        description: 'Oil filter',
        quantity: '1',
        unitPrice: '15.00',
        amount: '15.00',
      },
      {
        id: 'item-2',
        costEntryId: '8d0e7780-8536-51ef-95df-f18gd2g91bf8',
        description: 'Motor oil 5L',
        quantity: '5',
        unitPrice: '17.00',
        amount: '85.00',
      },
    ],
  };

  const mockDb = {
    query: {
      vehicles: {
        findFirst: jest.fn(),
      },
      costEntries: {
        findMany: jest.fn(),
      },
      seasons: {
        findFirst: jest.fn(),
      },
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        {
          provide: DrizzleService,
          useValue: {
            db: mockDb,
          },
        },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
    drizzleService = module.get<DrizzleService>(DrizzleService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateReport', () => {
    it('should generate a report for a vehicle', async () => {
      mockDb.query.vehicles.findFirst.mockResolvedValue(mockVehicle);
      mockDb.query.costEntries.findMany.mockResolvedValue([mockCostEntry]);

      const result = await service.generateReport({
        vehicleId: '550e8400-e29b-41d4-a716-446655440000',
      });

      expect(result).toHaveProperty('vehicle');
      expect(result.vehicle.id).toBe(mockVehicle.id);
      expect(result).toHaveProperty('summary');
      expect(result.summary.totalAmount).toBe(50);
      expect(result.summary.entryCount).toBe(1);
      expect(result.summary.byCategory).toHaveProperty('FUEL', 50);
      expect(result.entries).toHaveLength(1);
    });

    it('should throw NotFoundException when vehicle not found', async () => {
      mockDb.query.vehicles.findFirst.mockResolvedValue(null);

      await expect(
        service.generateReport({
          vehicleId: '123e4567-e89b-12d3-a456-426614174000',
        })
      ).rejects.toThrow(NotFoundException);
    });

    it('should filter by seasonId when provided', async () => {
      mockDb.query.vehicles.findFirst.mockResolvedValue(mockVehicle);
      mockDb.query.costEntries.findMany.mockResolvedValue([mockCostEntry]);
      mockDb.query.seasons.findFirst.mockResolvedValue(mockSeason);

      const result = await service.generateReport({
        vehicleId: '550e8400-e29b-41d4-a716-446655440000',
        seasonId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      });

      expect(result.season).toBeDefined();
      expect(result.season?.name).toBe('Saison 2024');
      expect(result.period.label).toBe('Saison 2024');
    });

    it('should filter by date range when provided', async () => {
      mockDb.query.vehicles.findFirst.mockResolvedValue(mockVehicle);
      mockDb.query.costEntries.findMany.mockResolvedValue([mockCostEntry]);

      const result = await service.generateReport({
        vehicleId: '550e8400-e29b-41d4-a716-446655440000',
        dateFrom: new Date('2024-01-01'),
        dateTo: new Date('2024-12-31'),
      });

      expect(result.period.from).toEqual(new Date('2024-01-01'));
      expect(result.period.to).toEqual(new Date('2024-12-31'));
      expect(mockDb.query.costEntries.findMany).toHaveBeenCalled();
    });

    it('should aggregate costs by category correctly', async () => {
      const multiCategoryEntries = [
        { ...mockCostEntry, category: 'FUEL' as const, totalAmount: '50.00' },
        { ...mockCostEntry, id: 'entry-2', category: 'SERVICE' as const, totalAmount: '100.00' },
        { ...mockCostEntry, id: 'entry-3', category: 'FUEL' as const, totalAmount: '45.00' },
      ];

      mockDb.query.vehicles.findFirst.mockResolvedValue(mockVehicle);
      mockDb.query.costEntries.findMany.mockResolvedValue(multiCategoryEntries);

      const result = await service.generateReport({
        vehicleId: '550e8400-e29b-41d4-a716-446655440000',
      });

      expect(result.summary.totalAmount).toBe(195);
      expect(result.summary.entryCount).toBe(3);
      expect(result.summary.byCategory).toHaveProperty('FUEL', 95);
      expect(result.summary.byCategory).toHaveProperty('SERVICE', 100);
    });

    it('should return empty report when no cost entries exist', async () => {
      mockDb.query.vehicles.findFirst.mockResolvedValue(mockVehicle);
      mockDb.query.costEntries.findMany.mockResolvedValue([]);

      const result = await service.generateReport({
        vehicleId: '550e8400-e29b-41d4-a716-446655440000',
      });

      expect(result.summary.totalAmount).toBe(0);
      expect(result.summary.entryCount).toBe(0);
      expect(result.entries).toHaveLength(0);
    });

    it('should include itemized cost entries', async () => {
      mockDb.query.vehicles.findFirst.mockResolvedValue(mockVehicle);
      mockDb.query.costEntries.findMany.mockResolvedValue([mockCostEntryWithItems]);

      const result = await service.generateReport({
        vehicleId: '550e8400-e29b-41d4-a716-446655440000',
      });

      expect(result.entries[0].items).toHaveLength(2);
      expect(result.entries[0].items[0].description).toBe('Oil filter');
      expect(result.entries[0].items[0].quantity).toBe(1);
      expect(result.entries[0].items[0].unitPrice).toBe(15);
      expect(result.entries[0].items[0].amount).toBe(15);
    });
  });

  describe('generateCsvData', () => {
    it('should generate CSV for cost entries without items', async () => {
      mockDb.query.vehicles.findFirst.mockResolvedValue(mockVehicle);
      mockDb.query.costEntries.findMany.mockResolvedValue([mockCostEntry]);

      const result = await service.generateCsvData({
        vehicleId: '550e8400-e29b-41d4-a716-446655440000',
      });

      expect(result).toContain('Datum,Kategorie,Titel,Position,Menge,Einzelpreis,Betrag');
      expect(result).toContain('2024-01-15,FUEL,"Gas fillup",,,,50.00');
    });

    it('should generate CSV for cost entries with items', async () => {
      mockDb.query.vehicles.findFirst.mockResolvedValue(mockVehicle);
      mockDb.query.costEntries.findMany.mockResolvedValue([mockCostEntryWithItems]);

      const result = await service.generateCsvData({
        vehicleId: '550e8400-e29b-41d4-a716-446655440000',
      });

      expect(result).toContain('Datum,Kategorie,Titel,Position,Menge,Einzelpreis,Betrag');
      expect(result).toContain('2024-02-20,SERVICE,"Oil change","Oil filter",1,15.00,15.00');
      expect(result).toContain('2024-02-20,SERVICE,"Oil change","Motor oil 5L",5,17.00,85.00');
    });

    it('should handle mixed entries (with and without items) in CSV', async () => {
      mockDb.query.vehicles.findFirst.mockResolvedValue(mockVehicle);
      mockDb.query.costEntries.findMany.mockResolvedValue([
        mockCostEntry,
        mockCostEntryWithItems,
      ]);

      const result = await service.generateCsvData({
        vehicleId: '550e8400-e29b-41d4-a716-446655440000',
      });

      const lines = result.split('\n');
      expect(lines[0]).toBe('Datum,Kategorie,Titel,Position,Menge,Einzelpreis,Betrag');
      expect(lines).toHaveLength(4); // header + 1 simple entry + 2 itemized entries
    });

    it('should properly escape quotes in CSV titles', async () => {
      const entryWithQuotes = {
        ...mockCostEntry,
        title: 'Test "Special" Entry',
      };

      mockDb.query.vehicles.findFirst.mockResolvedValue(mockVehicle);
      mockDb.query.costEntries.findMany.mockResolvedValue([entryWithQuotes]);

      const result = await service.generateCsvData({
        vehicleId: '550e8400-e29b-41d4-a716-446655440000',
      });

      expect(result).toContain('"Test "Special" Entry"');
    });

    it('should return empty CSV with headers when no entries', async () => {
      mockDb.query.vehicles.findFirst.mockResolvedValue(mockVehicle);
      mockDb.query.costEntries.findMany.mockResolvedValue([]);

      const result = await service.generateCsvData({
        vehicleId: '550e8400-e29b-41d4-a716-446655440000',
      });

      expect(result).toBe('Datum,Kategorie,Titel,Position,Menge,Einzelpreis,Betrag');
    });
  });
});
