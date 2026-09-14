import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '@ems/shared';
import { AiService } from './ai.service';
import { ChatRequestDto } from './dto/chat-request.dto';
import { ChatResponseDto } from './dto/chat-response.dto';

@ApiTags('AI Assistant')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Get('health')
  @ApiOperation({
    summary: 'Check Gemini AI service status',
    description: 'Returns the operational and readiness status of the Gemini AI integration.',
  })
  @ApiResponse({ status: 200, description: 'AI service status' })
  async getHealth() {
    return this.aiService.checkHealth();
  }

  @Post('chat')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 20, ttl: 60000 } }) // 20 requests per minute per IP/user
  @ApiOperation({
    summary: 'Send a prompt to the Google Gemini AI Assistant',
    description:
      'Secure server-side proxy endpoint. Forwards sanitized user prompt to Google Gemini API with guardrails, exponential backoff retries, and comprehensive audit logging.',
  })
  @ApiResponse({
    status: 200,
    description: 'AI model response generated successfully',
    type: ChatResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid or malformed prompt' })
  @ApiResponse({ status: 401, description: 'Unauthorized credentials or invalid Gemini API key' })
  @ApiResponse({ status: 429, description: 'AI quota or rate limit exceeded' })
  @ApiResponse({ status: 504, description: 'Gemini upstream request timed out' })
  async chat(
    @Body() dto: ChatRequestDto,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ): Promise<ChatResponseDto> {
    const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || req.ip;
    return this.aiService.generateChatResponse(dto, user, clientIp);
  }
}
