import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { TodoItemsService } from './todo-items.service';
import { DrizzleService } from '../drizzle/drizzle.service';
import { CreateTodoItemDto } from './dto/create-todo-item.dto';
import { UpdateTodoItemDto } from './dto/update-todo-item.dto';

describe('TodoItemsService', () => {
  let service: TodoItemsService;

  const mockTodo = {
    id: 'todo-uuid-1',
    vehicleId: 'vehicle-uuid-1',
    title: 'Replace brake pads',
    status: 'OPEN' as const,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPart = {
    id: 'part-uuid-1',
    todoId: 'todo-uuid-1',
    name: 'Brake pad set',
    link: 'https://example.com/pads',
    price: '49.99',
    notes: 'Front axle',
    createdAt: new Date(),
  };

  const mockTodoWithParts = { ...mockTodo, parts: [mockPart] };

  const mockDb = {
    query: {
      vehicleTodos: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
      },
      vehicleTodoParts: {
        findMany: jest.fn(),
      },
    },
    transaction: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TodoItemsService,
        {
          provide: DrizzleService,
          useValue: { db: mockDb },
        },
      ],
    }).compile();

    service = module.get<TodoItemsService>(TodoItemsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ── findAll ────────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('should return todos for a vehicle', async () => {
      mockDb.query.vehicleTodos.findMany.mockResolvedValue([mockTodoWithParts]);

      const result = await service.findAll('vehicle-uuid-1');

      expect(result).toEqual([mockTodoWithParts]);
      expect(mockDb.query.vehicleTodos.findMany).toHaveBeenCalled();
    });

    it('should return an empty array when the vehicle has no todos', async () => {
      mockDb.query.vehicleTodos.findMany.mockResolvedValue([]);

      const result = await service.findAll('vehicle-uuid-1');

      expect(result).toEqual([]);
    });
  });

  // ── findOne ────────────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('should return a single todo with its parts', async () => {
      mockDb.query.vehicleTodos.findFirst.mockResolvedValue(mockTodoWithParts);

      const result = await service.findOne('todo-uuid-1');

      expect(result).toEqual(mockTodoWithParts);
    });

    it('should throw NotFoundException when todo does not exist', async () => {
      mockDb.query.vehicleTodos.findFirst.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(NotFoundException);
    });
  });

  // ── create ─────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('should create a todo without parts', async () => {
      const dto: CreateTodoItemDto = {
        vehicleId: 'vehicle-uuid-1',
        title: 'Replace brake pads',
      };

      mockDb.transaction = jest.fn((callback) => {
        const tx = {
          insert: jest.fn().mockReturnValue({
            values: jest.fn().mockReturnValue({
              returning: jest.fn().mockResolvedValue([mockTodo]),
            }),
          }),
        };
        return callback(tx);
      });

      const result = await service.create(dto);

      expect(result).toMatchObject({ id: mockTodo.id, title: mockTodo.title, parts: [] });
      expect(mockDb.transaction).toHaveBeenCalled();
    });

    it('should create a todo with parts in a single transaction', async () => {
      const dto: CreateTodoItemDto = {
        vehicleId: 'vehicle-uuid-1',
        title: 'Replace brake pads',
        parts: [{ name: 'Brake pad set', price: 49.99, link: 'https://example.com', notes: 'Front' }],
      };

      mockDb.transaction = jest.fn((callback) => {
        const insertMock = jest.fn();
        // First insert returns the todo, second returns the parts
        insertMock
          .mockReturnValueOnce({
            values: jest.fn().mockReturnValue({ returning: jest.fn().mockResolvedValue([mockTodo]) }),
          })
          .mockReturnValueOnce({
            values: jest.fn().mockReturnValue({ returning: jest.fn().mockResolvedValue([mockPart]) }),
          });
        const tx = { insert: insertMock };
        return callback(tx);
      });

      const result = await service.create(dto);

      expect(result.parts).toHaveLength(1);
      expect(result.parts[0]).toMatchObject({ name: mockPart.name, price: mockPart.price });
    });

    it('should store part price as a string for the DB', async () => {
      const dto: CreateTodoItemDto = {
        vehicleId: 'vehicle-uuid-1',
        title: 'Buy oil',
        parts: [{ name: 'Engine oil', price: 29.99 }],
      };

      let capturedPartValues: any[] = [];

      mockDb.transaction = jest.fn((callback) => {
        const tx = {
          insert: jest.fn()
            .mockReturnValueOnce({
              values: jest.fn().mockReturnValue({ returning: jest.fn().mockResolvedValue([mockTodo]) }),
            })
            .mockReturnValueOnce({
              values: jest.fn().mockImplementation((vals) => {
                capturedPartValues = vals;
                return { returning: jest.fn().mockResolvedValue([mockPart]) };
              }),
            }),
        };
        return callback(tx);
      });

      await service.create(dto);

      expect(capturedPartValues[0].price).toBe('29.99');
    });

    it('should handle null price parts without error', async () => {
      const dto: CreateTodoItemDto = {
        vehicleId: 'vehicle-uuid-1',
        title: 'Check tires',
        parts: [{ name: 'Tire pressure gauge' }],
      };

      let capturedPartValues: any[] = [];

      mockDb.transaction = jest.fn((callback) => {
        const tx = {
          insert: jest.fn()
            .mockReturnValueOnce({
              values: jest.fn().mockReturnValue({ returning: jest.fn().mockResolvedValue([mockTodo]) }),
            })
            .mockReturnValueOnce({
              values: jest.fn().mockImplementation((vals) => {
                capturedPartValues = vals;
                return { returning: jest.fn().mockResolvedValue([{ ...mockPart, price: null }]) };
              }),
            }),
        };
        return callback(tx);
      });

      await service.create(dto);

      expect(capturedPartValues[0].price).toBeNull();
    });
  });

  // ── update ─────────────────────────────────────────────────────────────────

  describe('update', () => {
    it('should update status from OPEN to DONE', async () => {
      const dto: UpdateTodoItemDto = { status: 'DONE' as any };
      const updatedTodo = { ...mockTodo, status: 'DONE' as const };

      mockDb.query.vehicleTodos.findFirst.mockResolvedValue(mockTodoWithParts);
      mockDb.transaction = jest.fn((callback) => {
        const tx = {
          update: jest.fn().mockReturnValue({
            set: jest.fn().mockReturnValue({
              where: jest.fn().mockReturnValue({ returning: jest.fn().mockResolvedValue([updatedTodo]) }),
            }),
          }),
          query: {
            vehicleTodoParts: {
              findMany: jest.fn().mockResolvedValue([mockPart]),
            },
          },
        };
        return callback(tx);
      });

      const result = await service.update('todo-uuid-1', dto);

      expect(result.status).toBe('DONE');
    });

    it('should replace all parts when parts array is provided', async () => {
      const newPart = { name: 'New part', price: 19.99 };
      const dto: UpdateTodoItemDto = { parts: [newPart] };
      const createdPart = { ...mockPart, id: 'part-uuid-2', name: 'New part', price: '19.99' };

      mockDb.query.vehicleTodos.findFirst.mockResolvedValue(mockTodoWithParts);
      mockDb.transaction = jest.fn((callback) => {
        const tx = {
          update: jest.fn().mockReturnValue({
            set: jest.fn().mockReturnValue({
              where: jest.fn().mockReturnValue({ returning: jest.fn().mockResolvedValue([mockTodo]) }),
            }),
          }),
          delete: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue(undefined),
          }),
          insert: jest.fn().mockReturnValue({
            values: jest.fn().mockReturnValue({ returning: jest.fn().mockResolvedValue([createdPart]) }),
          }),
        };
        return callback(tx);
      });

      const result = await service.update('todo-uuid-1', dto);

      expect(result.parts).toHaveLength(1);
      expect(result.parts[0].name).toBe('New part');
    });

    it('should clear all parts when an empty parts array is provided', async () => {
      const dto: UpdateTodoItemDto = { parts: [] };

      mockDb.query.vehicleTodos.findFirst.mockResolvedValue(mockTodoWithParts);
      mockDb.transaction = jest.fn((callback) => {
        const tx = {
          update: jest.fn().mockReturnValue({
            set: jest.fn().mockReturnValue({
              where: jest.fn().mockReturnValue({ returning: jest.fn().mockResolvedValue([mockTodo]) }),
            }),
          }),
          delete: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue(undefined),
          }),
        };
        return callback(tx);
      });

      const result = await service.update('todo-uuid-1', dto);

      expect(result.parts).toEqual([]);
    });

    it('should keep existing parts when parts is not provided', async () => {
      const dto: UpdateTodoItemDto = { title: 'Updated title' };

      mockDb.query.vehicleTodos.findFirst.mockResolvedValue(mockTodoWithParts);
      mockDb.transaction = jest.fn((callback) => {
        const tx = {
          update: jest.fn().mockReturnValue({
            set: jest.fn().mockReturnValue({
              where: jest.fn().mockReturnValue({
                returning: jest.fn().mockResolvedValue([{ ...mockTodo, title: 'Updated title' }]),
              }),
            }),
          }),
          query: {
            vehicleTodoParts: {
              findMany: jest.fn().mockResolvedValue([mockPart]),
            },
          },
        };
        return callback(tx);
      });

      const result = await service.update('todo-uuid-1', dto);

      expect(result.title).toBe('Updated title');
      expect(result.parts).toEqual([mockPart]);
    });

    it('should throw NotFoundException when todo does not exist', async () => {
      mockDb.query.vehicleTodos.findFirst.mockResolvedValue(null);

      await expect(service.update('non-existent-id', { title: 'x' })).rejects.toThrow(NotFoundException);
    });
  });

  // ── remove ─────────────────────────────────────────────────────────────────

  describe('remove', () => {
    it('should delete a todo and return it', async () => {
      mockDb.query.vehicleTodos.findFirst.mockResolvedValue(mockTodoWithParts);
      mockDb.delete.mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([mockTodo]),
        }),
      });

      const result = await service.remove('todo-uuid-1');

      expect(result).toEqual(mockTodo);
      expect(mockDb.delete).toHaveBeenCalled();
    });

    it('should throw NotFoundException when todo does not exist', async () => {
      mockDb.query.vehicleTodos.findFirst.mockResolvedValue(null);

      await expect(service.remove('non-existent-id')).rejects.toThrow(NotFoundException);
    });
  });
});
