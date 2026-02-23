import { Test, TestingModule } from '@nestjs/testing';
import { SpritmonitorService } from './spritmonitor.service';
import { DrizzleService } from '../drizzle/drizzle.service';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('SpritmonitorService', () => {
  let service: SpritmonitorService;

  const mockVehicle = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'Test Vehicle',
    brand: 'Porsche',
    model: '911',
    year: 1998,
    type: 'SEASONAL' as const,
    spritmonitorVehicleId: '12345',
    spritmonitorApiKey: 'test-api-key',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockDb = {
    query: {
      vehicles: {
        findFirst: jest.fn(),
      },
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SpritmonitorService,
        {
          provide: DrizzleService,
          useValue: { db: mockDb },
        },
      ],
    }).compile();

    service = module.get<SpritmonitorService>(SpritmonitorService);
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
          { id: '12345', make: 'Porsche', model: '911' },
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
            'Application-Id': '190e3b1080a39777f369a4e9875df3d7',
          },
        })
      );
    });

    it('should propagate API errors', async () => {
      mockedAxios.get.mockRejectedValue(new Error('API Error'));
      await expect(service.getVehicles('invalid-key')).rejects.toThrow('API Error');
    });
  });

  describe('getStats', () => {
    it('should return consumption stats for a linked vehicle', async () => {
      mockDb.query.vehicles.findFirst.mockResolvedValue(mockVehicle);

      mockedAxios.get.mockResolvedValue({
        data: [
          { id: '12345', make: 'Porsche', model: '911', consumption: '7.2', consumptionunit: 'l/100km' },
        ],
      });

      const result = await service.getStats(mockVehicle.id);

      expect(result).toEqual({ consumption: '7.2', consumptionunit: 'l/100km' });
    });

    it('should return null when vehicle is not linked', async () => {
      mockDb.query.vehicles.findFirst.mockResolvedValue({
        ...mockVehicle,
        spritmonitorVehicleId: null,
        spritmonitorApiKey: null,
      });

      const result = await service.getStats(mockVehicle.id);

      expect(result).toBeNull();
      expect(mockedAxios.get).not.toHaveBeenCalled();
    });

    it('should return null when Spritmonitor vehicle id not found in API response', async () => {
      mockDb.query.vehicles.findFirst.mockResolvedValue(mockVehicle);

      mockedAxios.get.mockResolvedValue({
        data: [
          { id: '99999', make: 'BMW', model: 'M3', consumption: '9.5', consumptionunit: 'l/100km' },
        ],
      });

      const result = await service.getStats(mockVehicle.id);

      expect(result).toBeNull();
    });
  });
});
