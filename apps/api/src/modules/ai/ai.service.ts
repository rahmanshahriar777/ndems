import {
  Injectable,
  Logger,
  BadRequestException,
  UnauthorizedException,
  RequestTimeoutException,
  ServiceUnavailableException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuditService } from '../../core/audit/audit.service';
import { AuditAction, JwtPayload } from '@ems/shared';
import { ChatRequestDto } from './dto/chat-request.dto';
import { ChatResponseDto } from './dto/chat-response.dto';

export interface GeminiApiContentPart {
  text: string;
}

export interface GeminiApiContent {
  role: 'user' | 'model';
  parts: GeminiApiContentPart[];
}

export interface GeminiApiPayload {
  contents: GeminiApiContent[];
  systemInstruction?: {
    parts: GeminiApiContentPart[];
  };
  generationConfig?: {
    temperature?: number;
    maxOutputTokens?: number;
    topP?: number;
  };
  safetySettings?: Array<{
    category: string;
    threshold: string;
  }>;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  private readonly defaultApiKey: string;
  private readonly defaultModel: string;
  private readonly defaultMaxTokens: number;
  private readonly defaultTemperature: number;
  private readonly defaultTimeoutMs: number;
  private readonly defaultMaxRetries: number;

  private readonly enterpriseSystemInstruction = `
You are NEO EMS AI Assistant, an enterprise-grade artificial intelligence specialized in Human Resource management, organizational workflows, and employee self-service.
Your role:
1. Provide accurate, professional, empathetic, and objective assistance on company policies, leave entitlements, attendance procedures, performance reviews, benefits, and workplace productivity.
2. Maintain strict workplace confidentiality. Never ask for or encourage sharing passwords, payment cards, or sensitive personal credentials.
3. Be concise and clearly format responses using markdown bullet points, bold headings, or numbered steps when appropriate.
4. If a user asks about something outside HR, work, or company operations, answer politely while gently keeping the focus on professional assistance.
`.trim();

  constructor(
    private readonly configService: ConfigService,
    private readonly auditService: AuditService,
  ) {
    this.defaultApiKey = this.configService.get<string>('gemini.apiKey') || '';
    this.defaultModel = this.configService.get<string>('gemini.model') || 'gemini-flash-latest';
    this.defaultMaxTokens = this.configService.get<number>('gemini.maxTokens') || 1024;
    this.defaultTemperature = this.configService.get<number>('gemini.temperature') || 0.7;
    this.defaultTimeoutMs = this.configService.get<number>('gemini.timeoutMs') || 30000;
    this.defaultMaxRetries = this.configService.get<number>('gemini.maxRetries') || 3;

    if (!this.defaultApiKey) {
      this.logger.warn('⚠️ GEMINI_API_KEY is not configured in server environment. AI endpoints will return service configuration error until set.');
    } else {
      this.logger.log(`✓ Gemini AI Service initialized with model: ${this.defaultModel}`);
    }
  }

  /**
   * Health and readiness check for the Gemini provider without consuming prompt tokens.
   */
  async checkHealth(): Promise<{ status: string; configured: boolean; model: string }> {
    return {
      status: this.defaultApiKey ? 'available' : 'unconfigured',
      configured: Boolean(this.defaultApiKey),
      model: this.defaultModel,
    };
  }

  /**
   * Primary entry point for AI chat interactions.
   * Handles guardrails, input sanitization, API call with retries and timeout, audit logging.
   */
  async generateChatResponse(
    dto: ChatRequestDto,
    user?: JwtPayload,
    ipAddress?: string,
  ): Promise<ChatResponseDto> {
    const startTime = Date.now();
    const model = dto.model || this.defaultModel;
    const temperature = dto.temperature !== undefined ? dto.temperature : this.defaultTemperature;
    const maxTokens = dto.maxTokens !== undefined ? dto.maxTokens : this.defaultMaxTokens;

    // 1. Guardrails: Input Sanitization & Safety Verification
    const sanitizedPrompt = this.sanitizeAndApplyGuardrails(dto.message);
    if (!sanitizedPrompt) {
      throw new BadRequestException('The prompt cannot be empty after guardrail filtering.');
    }

    // 2. Build Gemini REST API Payload
    const payload = this.buildGeminiPayload({
      sanitizedPrompt,
      history: dto.history,
      context: dto.context,
      temperature,
      maxTokens,
    });

    // 3. Execute with Retry & Timeout
    let rawResult: any;
    let errorToLog: Error | null = null;
    try {
      rawResult = await this.executeGeminiRequestWithRetry(model, payload);
    } catch (err: any) {
      errorToLog = err;
      throw err;
    } finally {
      const latencyMs = Date.now() - startTime;
      const status = errorToLog ? 'FAILED' : 'SUCCESS';

      // 4. Audit Logging (Zero credentials or secret leakage)
      const promptSnippet = sanitizedPrompt.length > 80 ? `${sanitizedPrompt.substring(0, 80)}...` : sanitizedPrompt;
      this.auditService.log({
        actorId: user?.sub,
        actorEmail: user?.email,
        action: AuditAction.CREATE,
        entityType: 'AI_CHAT',
        entityId: `ai-req-${Date.now()}`,
        beforeState: {
          promptPreview: promptSnippet,
          model,
          temperature,
        },
        afterState: {
          status,
          latencyMs,
          error: errorToLog ? errorToLog.message : undefined,
          tokenUsage: rawResult?.usageMetadata,
        },
        ipAddress,
      }).catch((logErr) => {
        this.logger.warn(`Failed to write AI audit log: ${logErr.message}`);
      });
    }

    const latencyMs = Date.now() - startTime;

    // 5. Parse Gemini Candidate Response
    const replyText = this.extractReplyText(rawResult);

    const tokenUsage = rawResult?.usageMetadata ? {
      promptTokens: rawResult.usageMetadata.promptTokenCount || 0,
      completionTokens: rawResult.usageMetadata.candidatesTokenCount || 0,
      totalTokens: rawResult.usageMetadata.totalTokenCount || 0,
    } : undefined;

    return {
      reply: replyText,
      model,
      usage: tokenUsage,
      latencyMs,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Enterprise Guardrail Pipeline:
   * - Strips dangerous control chars
   * - Clamps character bounds
   * - Redacts potential credentials or payment card sequences
   */
  private sanitizeAndApplyGuardrails(input: string): string {
    if (!input || typeof input !== 'string') {
      return '';
    }

    let sanitized = input.trim();

    // Clamp input to 4000 chars
    if (sanitized.length > 4000) {
      sanitized = sanitized.substring(0, 4000);
    }

    // Redact credit card patterns (13-16 digits with optional dashes/spaces)
    sanitized = sanitized.replace(/\b(?:\d[ -]*?){13,16}\b/g, '[REDACTED_CARD_NUMBER]');

    // Strip null bytes and non-printable control characters (except newline, tab, carriage return)
    sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

    return sanitized;
  }

  /**
   * Constructs the Gemini REST request body formatted for v1beta endpoints.
   */
  private buildGeminiPayload(options: {
    sanitizedPrompt: string;
    history?: ChatRequestDto['history'];
    context?: string;
    temperature: number;
    maxTokens: number;
  }): GeminiApiPayload {
    const contents: GeminiApiContent[] = [];

    // Map conversation history if present
    if (options.history && Array.isArray(options.history)) {
      for (const msg of options.history) {
        const role = msg.role === 'model' || msg.role === 'assistant' ? 'model' : 'user';
        const cleanContent = this.sanitizeAndApplyGuardrails(msg.content);
        if (cleanContent) {
          contents.push({
            role,
            parts: [{ text: cleanContent }],
          });
        }
      }
    }

    // Append context note if present
    let promptWithContext = options.sanitizedPrompt;
    if (options.context) {
      promptWithContext = `[Context: ${options.context.trim()}]\n\n${promptWithContext}`;
    }

    // Add current user prompt
    contents.push({
      role: 'user',
      parts: [{ text: promptWithContext }],
    });

    return {
      contents,
      systemInstruction: {
        parts: [{ text: this.enterpriseSystemInstruction }],
      },
      generationConfig: {
        temperature: options.temperature,
        maxOutputTokens: options.maxTokens,
        topP: 0.95,
      },
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      ],
    };
  }

  /**
   * Resilient executor with exponential backoff, jitter, and timeout.
   */
  private async executeGeminiRequestWithRetry(
    model: string,
    payload: GeminiApiPayload,
  ): Promise<any> {
    const apiKey = this.defaultApiKey;
    if (!apiKey) {
      throw new ServiceUnavailableException(
        'Gemini AI API key is not configured on this server. Please contact your system administrator.',
      );
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      model,
    )}:generateContent?key=${apiKey}`;

    let attempt = 0;
    const maxRetries = this.defaultMaxRetries;
    const baseDelayMs = 1000;

    while (attempt <= maxRetries) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.defaultTimeoutMs);

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          return await response.json();
        }

        const errorBody = await response.json().catch(() => ({}));
        const rawErrorMessage = errorBody?.error?.message || response.statusText || 'Unknown Gemini error';
        const statusCode = response.status;

        // Categorize errors
        if (statusCode === 400) {
          if (rawErrorMessage.toLowerCase().includes('api key not valid') || rawErrorMessage.toLowerCase().includes('invalid api key')) {
            this.logger.error('Gemini API authentication failed: Invalid API key configured.');
            throw new UnauthorizedException('Gemini AI authentication failed. Invalid API key configured on server.');
          }
          throw new BadRequestException(`Malformed request to Gemini AI: ${rawErrorMessage}`);
        }

        if (statusCode === 401 || statusCode === 403) {
          this.logger.error(`Gemini API authorization failed with HTTP ${statusCode}.`);
          throw new UnauthorizedException('Gemini AI authentication or permission denied.');
        }

        if (statusCode === 404) {
          throw new ServiceUnavailableException(`The requested Gemini model '${model}' was not found or is deprecated.`);
        }

        // 429 Quota Exceeded / Too Many Requests or 503 Service Unavailable
        const isTransient = statusCode === 429 || statusCode >= 500;
        if (isTransient && attempt < maxRetries) {
          attempt++;
          const jitter = Math.floor(Math.random() * 300);
          const delay = Math.min(baseDelayMs * Math.pow(2, attempt) + jitter, 10000);
          this.logger.warn(`Gemini returned HTTP ${statusCode} (${rawErrorMessage}). Retrying attempt ${attempt}/${maxRetries} in ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        if (statusCode === 429) {
          throw new HttpException(
            'Gemini AI quota exceeded or rate limit reached. Please try again in a few moments.',
            HttpStatus.TOO_MANY_REQUESTS,
          );
        }

        throw new HttpException(
          `Gemini AI service error: ${rawErrorMessage}`,
          statusCode >= 400 && statusCode < 600 ? statusCode : HttpStatus.BAD_GATEWAY,
        );
      } catch (err: any) {
        clearTimeout(timeoutId);

        if (err.name === 'AbortError' || controller.signal.aborted) {
          if (attempt < maxRetries) {
            attempt++;
            this.logger.warn(`Gemini request timed out after ${this.defaultTimeoutMs}ms. Retrying attempt ${attempt}/${maxRetries}...`);
            await new Promise((resolve) => setTimeout(resolve, 1000));
            continue;
          }
          throw new RequestTimeoutException(`The Gemini AI request timed out after ${this.defaultTimeoutMs}ms.`);
        }

        // Re-throw NestJS HTTP exceptions directly
        if (err instanceof HttpException) {
          throw err;
        }

        // Other network errors (DNS, connection reset)
        if (attempt < maxRetries) {
          attempt++;
          this.logger.warn(`Network error calling Gemini: ${err.message}. Retrying attempt ${attempt}/${maxRetries}...`);
          await new Promise((resolve) => setTimeout(resolve, 1500));
          continue;
        }

        this.logger.error(`Failed to communicate with Gemini AI after ${maxRetries} retries: ${err.message}`);
        throw new ServiceUnavailableException('Unable to establish connection with Gemini AI service.');
      }
    }
  }

  /**
   * Safely extracts text from Gemini response structure.
   */
  private extractReplyText(result: any): string {
    if (!result?.candidates || result.candidates.length === 0) {
      if (result?.promptFeedback?.blockReason) {
        return `I am unable to answer this query because it was flagged by safety filters (${result.promptFeedback.blockReason}).`;
      }
      return 'No response was generated by the AI model.';
    }

    const candidate = result.candidates[0];
    const finishReason = candidate.finishReason;

    if (finishReason === 'SAFETY') {
      return 'The generated response was withheld due to enterprise safety policies.';
    }

    const parts = candidate.content?.parts;
    if (Array.isArray(parts) && parts.length > 0) {
      return parts.map((p: any) => p.text || '').join('').trim();
    }

    return 'The AI assistant provided an empty response.';
  }
}
