import { Module } from '@nestjs/common';
import { TodoItemsController } from './todo-items.controller';
import { TodoItemsService } from './todo-items.service';

@Module({
  controllers: [TodoItemsController],
  providers: [TodoItemsService],
  exports: [TodoItemsService],
})
export class TodoItemsModule {}
