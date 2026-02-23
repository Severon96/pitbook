import { Test, TestingModule } from '@nestjs/testing';
import { TodoItemsController } from './todo-items.controller';
import { TodoItemsService } from './todo-items.service';

describe('TodoItemsController', () => {
  let controller: TodoItemsController;
  let service: TodoItemsService;

  const mockTodo = {
    id: 'todo-uuid-1',
    vehicleId: 'vehicle-uuid-1',
    title: 'Replace brake pads',
    status: 'OPEN' as const,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    parts: [],
  };

  const mockTodoWithParts = {
    ...mockTodo,
    parts: [
      {
        id: 'part-uuid-1',
        todoId: 'todo-uuid-1',
        name: 'Brake pad set',
        link: 'https://example.com/pads',
        price: '49.99',
        notes: 'Front axle',
        createdAt: new Date(),
      },
    ],
  };

  const mockTodoItemsService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TodoItemsController],
      providers: [
        {
          provide: TodoItemsService,
          useValue: mockTodoItemsService,
        },
      ],
    }).compile();

    controller = module.get<TodoItemsController>(TodoItemsController);
    service = module.get<TodoItemsService>(TodoItemsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // ── findAll ────────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('should return all todos for a vehicle', async () => {
      mockTodoItemsService.findAll.mockResolvedValue([mockTodoWithParts]);

      const result = await controller.findAll('vehicle-uuid-1');

      expect(result).toEqual([mockTodoWithParts]);
      expect(service.findAll).toHaveBeenCalledWith('vehicle-uuid-1');
    });

    it('should return an empty array when there are no todos', async () => {
      mockTodoItemsService.findAll.mockResolvedValue([]);

      const result = await controller.findAll('vehicle-uuid-1');

      expect(result).toEqual([]);
    });
  });

  // ── findOne ────────────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('should return a single todo by id', async () => {
      mockTodoItemsService.findOne.mockResolvedValue(mockTodoWithParts);

      const result = await controller.findOne('todo-uuid-1');

      expect(result).toEqual(mockTodoWithParts);
      expect(service.findOne).toHaveBeenCalledWith('todo-uuid-1');
    });
  });

  // ── create ─────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('should create a todo without parts', async () => {
      const dto = { vehicleId: 'vehicle-uuid-1', title: 'Replace brake pads' };
      mockTodoItemsService.create.mockResolvedValue(mockTodo);

      const result = await controller.create(dto as any);

      expect(result).toEqual(mockTodo);
      expect(service.create).toHaveBeenCalledWith(dto);
    });

    it('should create a todo with parts', async () => {
      const dto = {
        vehicleId: 'vehicle-uuid-1',
        title: 'Replace brake pads',
        parts: [{ name: 'Brake pad set', price: 49.99 }],
      };
      mockTodoItemsService.create.mockResolvedValue(mockTodoWithParts);

      const result = await controller.create(dto as any);

      expect(result).toEqual(mockTodoWithParts);
      expect(service.create).toHaveBeenCalledWith(dto);
    });
  });

  // ── update ─────────────────────────────────────────────────────────────────

  describe('update', () => {
    it('should toggle status to DONE', async () => {
      const dto = { status: 'DONE' };
      const updated = { ...mockTodo, status: 'DONE' as const };
      mockTodoItemsService.update.mockResolvedValue(updated);

      const result = await controller.update('todo-uuid-1', dto as any);

      expect(result.status).toBe('DONE');
      expect(service.update).toHaveBeenCalledWith('todo-uuid-1', dto);
    });

    it('should update title', async () => {
      const dto = { title: 'New title' };
      const updated = { ...mockTodo, title: 'New title' };
      mockTodoItemsService.update.mockResolvedValue(updated);

      const result = await controller.update('todo-uuid-1', dto as any);

      expect(result.title).toBe('New title');
      expect(service.update).toHaveBeenCalledWith('todo-uuid-1', dto);
    });

    it('should replace parts', async () => {
      const dto = { parts: [{ name: 'New part' }] };
      const updated = { ...mockTodo, parts: [{ id: 'p2', todoId: 'todo-uuid-1', name: 'New part', link: null, price: null, notes: null, createdAt: new Date() }] };
      mockTodoItemsService.update.mockResolvedValue(updated);

      const result = await controller.update('todo-uuid-1', dto as any);

      expect(result.parts).toHaveLength(1);
      expect(result.parts[0].name).toBe('New part');
    });
  });

  // ── remove ─────────────────────────────────────────────────────────────────

  describe('remove', () => {
    it('should delete a todo and return it', async () => {
      mockTodoItemsService.remove.mockResolvedValue(mockTodo);

      const result = await controller.remove('todo-uuid-1');

      expect(result).toEqual(mockTodo);
      expect(service.remove).toHaveBeenCalledWith('todo-uuid-1');
    });
  });
});
