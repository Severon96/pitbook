import { IsString, IsOptional, IsEnum, IsArray, ValidateNested, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreateTodoPartDto } from './create-todo-item.dto';

enum VehicleTodoStatus {
  OPEN = 'OPEN',
  DONE = 'DONE',
}

export class UpdateTodoItemDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ enum: VehicleTodoStatus })
  @IsEnum(VehicleTodoStatus)
  @IsOptional()
  status?: VehicleTodoStatus;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ type: [CreateTodoPartDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTodoPartDto)
  @IsOptional()
  parts?: CreateTodoPartDto[];
}
