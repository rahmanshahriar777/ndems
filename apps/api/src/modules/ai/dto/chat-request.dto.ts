import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ChatMessageDto {
  @ApiProperty({ enum: ['user', 'model', 'assistant'], example: 'user' })
  @IsString()
  @IsIn(['user', 'model', 'assistant'])
  role: 'user' | 'model' | 'assistant';

  @ApiProperty({ example: 'Can you summarize company leave policies?' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  content: string;
}

export class ChatRequestDto {
  @ApiProperty({
    description: 'The user message to send to the AI Assistant',
    example: 'What is the standard procedure for applying for bereavement leave?',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(4000)
  message: string;

  @ApiPropertyOptional({
    description: 'Prior conversation message history for multi-turn dialogue',
    type: [ChatMessageDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChatMessageDto)
  history?: ChatMessageDto[];

  @ApiPropertyOptional({
    description: 'Optional organizational or contextual information (e.g. employee role, department name)',
    example: 'Department: Engineering, Role: Senior Developer',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  context?: string;

  @ApiPropertyOptional({
    description: 'Gemini model identifier override (e.g. gemini-1.5-flash, gemini-2.0-flash)',
    example: 'gemini-1.5-flash',
  })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional({
    description: 'Sampling temperature between 0.0 (deterministic) and 2.0 (creative)',
    example: 0.7,
  })
  @IsOptional()
  @IsNumber()
  temperature?: number;

  @ApiPropertyOptional({
    description: 'Maximum generation output tokens (between 1 and 4096)',
    example: 1024,
  })
  @IsOptional()
  @IsNumber()
  maxTokens?: number;
}
