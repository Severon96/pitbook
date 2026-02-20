import { Test, TestingModule } from '@nestjs/testing';
import { VehiclesController } from './vehicles.controller';
import { VehiclesService } from './vehicles.service';

describe('VehiclesController', () => {
  let controller: VehiclesController;
  let service: VehiclesService;

  const mockVehicle = {
    id: 'test-vehicle-id',
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
    _count: {
      costEntries: 5,
      fuelLogs: 3,
    },
  };

  const mockVehiclesService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    getSummary: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VehiclesController],
      providers: [
        {
          provide: VehiclesService,
          useValue: mockVehiclesService,
        },
      ],
    }).compile();

    controller = module.get<VehiclesController>(VehiclesController);
    service = module.get<VehiclesService>(VehiclesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of vehicles', async () => {
      const vehicles = [mockVehicle];
      mockVehiclesService.findAll.mockResolvedValue(vehicles);

      const result = await controller.findAll();

      expect(result).toEqual(vehicles);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a single vehicle', async () => {
      mockVehiclesService.findOne.mockResolvedValue(mockVehicle);

      const result = await controller.findOne('test-vehicle-id');

      expect(result).toEqual(mockVehicle);
      expect(service.findOne).toHaveBeenCalledWith('test-vehicle-id');
    });
  });

  describe('create', () => {
    it('should create and return a new vehicle', async () => {
      const createDto = {
        name: 'New Vehicle',
        brand: 'Honda',
        model: 'Civic',
        year: 2023,
        type: 'DAILY' as const,
      };

      const newVehicle = { ...mockVehicle, ...createDto };
      mockVehiclesService.create.mockResolvedValue(newVehicle);

      const result = await controller.create(createDto);

      expect(result).toEqual(newVehicle);
      expect(service.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('update', () => {
    it('should update and return the vehicle', async () => {
      const updateDto = {
        name: 'Updated Vehicle',
      };

      const updatedVehicle = { ...mockVehicle, ...updateDto };
      mockVehiclesService.update.mockResolvedValue(updatedVehicle);

      const result = await controller.update('test-vehicle-id', updateDto);

      expect(result).toEqual(updatedVehicle);
      expect(service.update).toHaveBeenCalledWith('test-vehicle-id', updateDto);
    });
  });

  describe('remove', () => {
    it('should delete and return the vehicle', async () => {
      mockVehiclesService.remove.mockResolvedValue(mockVehicle);

      const result = await controller.remove('test-vehicle-id');

      expect(result).toEqual(mockVehicle);
      expect(service.remove).toHaveBeenCalledWith('test-vehicle-id');
    });
  });

  describe('getSummary', () => {
    it('should return vehicle cost summary', async () => {
      const summary = {
        totalAmount: 500,
        entryCount: 10,
        byCategory: [
          { category: 'FUEL', amount: 300 },
          { category: 'SERVICE', amount: 200 },
        ],
      };

      mockVehiclesService.getSummary.mockResolvedValue(summary);

      const result = await controller.getSummary('test-vehicle-id');

      expect(result).toEqual(summary);
      expect(service.getSummary).toHaveBeenCalledWith('test-vehicle-id');
    });
  });
});
