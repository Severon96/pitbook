import {Test, TestingModule} from '@nestjs/testing';
import {SpritmonitorService} from './spritmonitor.service';
import {DrizzleService} from '../drizzle/drizzle.service';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('SpritmonitorService', () => {
  let service: SpritmonitorService;
  let drizzleService: DrizzleService;

  const mockVehicle = {
    id: 'test-vehicle-id',
    name: 'Test Vehicle',
    brand: 'Porsche',
    model: '911',
    year: 1998,
    type: 'SEASONAL' as const,
    spritmonitorVehicleId: '12345',
    spritmonitorApiKey: 'test-api-key',
    spritmonitorLastSync: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockDb = {
    query: {
      vehicles: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
      },
      fuelLogs: {
        findFirst: jest.fn(),
      },
    },
    transaction: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SpritmonitorService,
        {
          provide: DrizzleService,
          useValue: {
            db: mockDb,
          },
        },
      ],
    }).compile();

    service = module.get<SpritmonitorService>(SpritmonitorService);
    drizzleService = module.get<DrizzleService>(DrizzleService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getVehicles', () => {
    it('should fetch vehicles from Spritmonitor API', async () => {
      const mockApiResponse = {
        data: [
          {
            id: '12345',
            make: 'Porsche',
            model: '911',
            year: 1998,
          },
        ],
      };

      mockedAxios.get.mockResolvedValue(mockApiResponse);

      const result = await service.getVehicles('test-api-key');

      expect(result).toEqual(mockApiResponse.data);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://api.spritmonitor.de/v1/vehicles.json',
        expect.objectContaining({
          headers: {
            Authorization: 'Bearer test-api-key',
            'Application-Id': 'Pitbook',
          },
        })
      );
    });

    it('should handle API errors', async () => {
      mockedAxios.get.mockRejectedValue(new Error('API Error'));

      await expect(service.getVehicles('invalid-key')).rejects.toThrow();
    });
  });

  describe('linkVehicle', () => {
    it('should link a vehicle to Spritmonitor', async () => {
      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([
              {
                ...mockVehicle,
                spritmonitorVehicleId: '12345',
                spritmonitorApiKey: 'new-api-key',
              },
            ]),
          }),
        }),
      });

      const result = await service.linkVehicle(
        'test-vehicle-id',
        '12345',
        'new-api-key'
      );

      expect(result.spritmonitorVehicleId).toBe('12345');
      expect(result.spritmonitorApiKey).toBe('new-api-key');
    });
  });

  describe('syncVehicle', () => {
    it('should sync fuel logs from Spritmonitor', async () => {
      mockDb.query.vehicles.findFirst.mockResolvedValue(mockVehicle);
      mockDb.query.fuelLogs.findFirst.mockResolvedValue(null); // No existing fuel log

      const mockFuelLogsResponse = {
        data: [
          {
            id: '1',
            date: '2024-01-15',
            quantity: 50.5,
            fuelprice: 1.50,
            odometer: 10000,
            fulltank: true,
          },
        ],
      };

      mockedAxios.get.mockResolvedValue(mockFuelLogsResponse);

      mockDb.transaction = jest.fn(async (callback) => {
        const tx = {
          insert: jest.fn().mockReturnValue({
            values: jest.fn().mockReturnValue({
              onConflictDoNothing: jest.fn().mockResolvedValue(undefined),
            }),
          }),
        };
        await callback(tx);
        return {synced: 1, skipped: 0};
      });
      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(undefined),
        }),
      });

      const result = await service.syncVehicle('test-vehicle-id');

      expect(result).toHaveProperty('synced');
      expect(result).toHaveProperty('skipped');
      expect(mockedAxios.get).toHaveBeenCalled();
    });

    it('should throw error when vehicle not linked', async () => {
      mockDb.query.vehicles.findFirst.mockResolvedValue({
        ...mockVehicle,
        spritmonitorVehicleId: null,
        spritmonitorApiKey: null,
      });

      await expect(service.syncVehicle('test-vehicle-id')).rejects.toThrow(
        'Vehicle not linked to Spritmonitor'
      );
    });
  });

});
