import { IsString, IsInt, IsEnum, IsOptional, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateVehicleDto {
  @ApiProperty() @IsString() name: string;
  @ApiProperty() @IsString() brand: string;
  @ApiProperty() @IsString() model: string;
  @ApiProperty() @IsInt() @Min(1900) @Max(new Date().getFullYear() + 1) year: number;
  @ApiProperty({ enum: ['DAILY', 'SEASONAL'] }) @IsEnum(['DAILY', 'SEASONAL']) type: 'DAILY' | 'SEASONAL';
  @ApiPropertyOptional() @IsOptional() @IsString() licensePlate?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() vin?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() spritmonitorVehicleId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() spritmonitorApiKey?: string;
}
