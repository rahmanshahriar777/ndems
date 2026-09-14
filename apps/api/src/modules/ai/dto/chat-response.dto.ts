import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TokenUsageDto {
  @ApiProperty({ example: 45 })
  promptTokens: number;

  @ApiProperty({ example: 128 })
  completionTokens: number;

  @ApiProperty({ example: 173 })
  totalTokens: number;
}

export class ChatResponseDto {
  @ApiProperty({
    example: 'Bereavement leave provides up to 3 paid working days upon notice to HR and your immediate manager.',
  })
  reply: string;

  @ApiProperty({ example: 'gemini-1.5-flash' })
  model: string;

  @ApiPropertyOptional({ type: TokenUsageDto })
  usage?: TokenUsageDto;

  @ApiProperty({ example: 382, description: 'Processing latency in milliseconds' })
  latencyMs: number;

  @ApiProperty({ example: '2026-09-14T01:30:00.000Z' })
  timestamp: string;
}
