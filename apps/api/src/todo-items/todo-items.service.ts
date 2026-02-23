import { Injectable, NotFoundException } from '@nestjs/common';
import { DrizzleService } from '../drizzle/drizzle.service';
import { CreateTodoItemDto } from './dto/create-todo-item.dto';
import { UpdateTodoItemDto } from './dto/update-todo-item.dto';
import { eq } from 'drizzle-orm';
import { vehicleTodos, vehicleTodoParts } from '@pitbook/db';

@Injectable()
export class TodoItemsService {
  constructor(private drizzle: DrizzleService) {}

  async findAll(vehicleId: string) {
    return await this.drizzle.db.query.vehicleTodos.findMany({
      where: eq(vehicleTodos.vehicleId, vehicleId),
      with: { parts: true },
      orderBy: (vehicleTodos, { desc }) => [desc(vehicleTodos.createdAt)],
    });
  }

  async findOne(id: string) {
    const todo = await this.drizzle.db.query.vehicleTodos.findFirst({
      where: eq(vehicleTodos.id, id),
      with: { parts: true },
    });
    if (!todo) throw new NotFoundException(`Todo ${id} not found`);
    return todo;
  }

  async create(dto: CreateTodoItemDto) {
    return await this.drizzle.db.transaction(async (tx) => {
      const [newTodo] = await tx
        .insert(vehicleTodos)
        .values({
          vehicleId: dto.vehicleId,
          title: dto.title,
          notes: dto.notes,
        })
        .returning();

      let createdParts = [];
      if (dto.parts && dto.parts.length > 0) {
        createdParts = await tx
          .insert(vehicleTodoParts)
          .values(
            dto.parts.map((part) => ({
              todoId: newTodo.id,
              name: part.name,
              link: part.link,
              price: part.price != null ? part.price.toString() : null,
              notes: part.notes,
            }))
          )
          .returning();
      }

      return { ...newTodo, parts: createdParts };
    });
  }

  async update(id: string, dto: UpdateTodoItemDto) {
    await this.findOne(id);

    return await this.drizzle.db.transaction(async (tx) => {
      const updateData: Record<string, unknown> = {};
      if (dto.title !== undefined) updateData['title'] = dto.title;
      if (dto.status !== undefined) updateData['status'] = dto.status;
      if (dto.notes !== undefined) updateData['notes'] = dto.notes;

      const [updated] = await tx
        .update(vehicleTodos)
        .set(updateData)
        .where(eq(vehicleTodos.id, id))
        .returning();

      if (dto.parts !== undefined) {
        await tx.delete(vehicleTodoParts).where(eq(vehicleTodoParts.todoId, id));

        let updatedParts = [];
        if (dto.parts.length > 0) {
          updatedParts = await tx
            .insert(vehicleTodoParts)
            .values(
              dto.parts.map((part) => ({
                todoId: id,
                name: part.name,
                link: part.link,
                price: part.price != null ? part.price.toString() : null,
                notes: part.notes,
              }))
            )
            .returning();
        }

        return { ...updated, parts: updatedParts };
      }

      const parts = await tx.query.vehicleTodoParts.findMany({
        where: eq(vehicleTodoParts.todoId, id),
      });

      return { ...updated, parts };
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    const [deleted] = await this.drizzle.db
      .delete(vehicleTodos)
      .where(eq(vehicleTodos.id, id))
      .returning();
    return deleted;
  }
}
