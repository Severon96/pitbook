import { IsString, IsNotEmpty, IsOptional, IsEnum, IsDateString, IsNumber, IsArray, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

enum CostCategory {
  FUEL = 'FUEL',
  SERVICE = 'SERVICE',
  REPAIR = 'REPAIR',
  INSURANCE = 'INSURANCE',
  TAX = 'TAX',
  PARTS = 'PARTS',
  OTHER = 'OTHER',
}

enum CostSource {
  MANUAL = 'MANUAL',
  SPRITMONITOR = 'SPRITMONITOR',
}

export class CostEntryItemDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  quantity: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  unitPrice: number;
}

export class CreateCostEntryDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  vehicleId: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  seasonId?: string;

  @ApiProperty({ enum: CostCategory })
  @IsEnum(CostCategory)
  category: CostCategory;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty()
  @IsDateString()
  date: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  @Min(0)
  totalAmount?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  receiptUrl?: string;

  @ApiPropertyOptional({ enum: CostSource, default: 'MANUAL' })
  @IsEnum(CostSource)
  @IsOptional()
  source?: CostSource;

  @ApiPropertyOptional({ type: [CostEntryItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CostEntryItemDto)
  @IsOptional()
  items?: CostEntryItemDto[];
}
