import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { TodoItemsService } from './todo-items.service';
import { CreateTodoItemDto } from './dto/create-todo-item.dto';
import { UpdateTodoItemDto } from './dto/update-todo-item.dto';

@ApiTags('Todo Items')
@Controller('todo-items')
export class TodoItemsController {
  constructor(private readonly todoItemsService: TodoItemsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all todos for a vehicle' })
  @ApiQuery({ name: 'vehicleId', required: true })
  async findAll(@Query('vehicleId') vehicleId: string) {
    return this.todoItemsService.findAll(vehicleId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single todo by ID' })
  async findOne(@Param('id') id: string) {
    return this.todoItemsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new todo with optional parts' })
  async create(@Body() createTodoItemDto: CreateTodoItemDto) {
    return this.todoItemsService.create(createTodoItemDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a todo (title, status, notes, parts)' })
  async update(@Param('id') id: string, @Body() updateTodoItemDto: UpdateTodoItemDto) {
    return this.todoItemsService.update(id, updateTodoItemDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a todo and its parts' })
  async remove(@Param('id') id: string) {
    return this.todoItemsService.remove(id);
  }
}
