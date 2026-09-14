import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import {
  BadRequestException,
  UnauthorizedException,
  RequestTimeoutException,
  ServiceUnavailableException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { AiService } from './ai.service';
import { AuditService } from '../../core/audit/audit.service';
import { SystemRole } from '@ems/shared';

describe('AiService', () => {
  let service: AiService;
  let auditService: Partial<AuditService>;
  let configService: Partial<ConfigService>;
  let originalFetch: any;

  beforeAll(() => {
    originalFetch = global.fetch;
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  beforeEach(async () => {
    auditService = {
      log: jest.fn().mockResolvedValue(undefined),
    };

    configService = {
      get: jest.fn((key: string, defaultValue?: any) => {
        const mockConfig: Record<string, any> = {
          'gemini.apiKey': 'mock_gemini_api_key',
          'gemini.model': 'gemini-1.5-flash',
          'gemini.maxTokens': 1024,
          'gemini.temperature': 0.7,
          'gemini.timeoutMs': 5000,
          'gemini.maxRetries': 1,
        };
        return mockConfig[key] !== undefined ? mockConfig[key] : defaultValue;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiService,
        { provide: ConfigService, useValue: configService },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get<AiService>(AiService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('checkHealth', () => {
    it('should report available when API key is present', async () => {
      const health = await service.checkHealth();
      expect(health.configured).toBe(true);
      expect(health.status).toBe('available');
      expect(health.model).toBe('gemini-1.5-flash');
    });
  });

  describe('generateChatResponse', () => {
    const mockUser = {
      sub: 'usr-123',
      email: 'employee@ems.local',
      roles: [SystemRole.EMPLOYEE],
      permissions: [],
    };

    it('should sanitize input, redact payment card numbers, call Gemini API, and record audit log', async () => {
      const fakeGeminiResponse = {
        candidates: [
          {
            content: {
              parts: [{ text: 'Here is your answer regarding leave policy.' }],
              role: 'model',
            },
            finishReason: 'STOP',
          },
        ],
        usageMetadata: {
          promptTokenCount: 15,
          candidatesTokenCount: 20,
          totalTokenCount: 35,
        },
      };

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue(fakeGeminiResponse),
      });

      const result = await service.generateChatResponse(
        {
          message: 'My card is 4111 2222 3333 4444. What is the leave procedure?',
        },
        mockUser as any,
        '127.0.0.1',
      );

      expect(result.reply).toBe('Here is your answer regarding leave policy.');
      expect(result.model).toBe('gemini-1.5-flash');
      expect(result.usage?.totalTokens).toBe(35);
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          actorId: 'usr-123',
          actorEmail: 'employee@ems.local',
          entityType: 'AI_CHAT',
        }),
      );

      // Verify the fetch call body redacted the card number
      const fetchCallArgs = (global.fetch as jest.Mock).mock.calls[0];
      const parsedBody = JSON.parse(fetchCallArgs[1].body);
      expect(parsedBody.contents[0].parts[0].text).toContain('[REDACTED_CARD_NUMBER]');
      expect(parsedBody.contents[0].parts[0].text).not.toContain('4111 2222 3333 4444');
    });

    it('should reject empty prompts with BadRequestException', async () => {
      await expect(
        service.generateChatResponse({ message: '    ' }, mockUser as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should handle invalid API key error and throw UnauthorizedException without exposing secrets', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: jest.fn().mockResolvedValue({
          error: {
            message: 'API key not valid. Please pass a valid API key.',
            status: 'INVALID_ARGUMENT',
          },
        }),
      });

      await expect(
        service.generateChatResponse({ message: 'Hello' }, mockUser as any),
      ).rejects.toThrow(UnauthorizedException);

      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          afterState: expect.objectContaining({
            status: 'FAILED',
          }),
        }),
      );
    });

    it('should handle quota exceeded and throw HttpException with TOO_MANY_REQUESTS', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 429,
        json: jest.fn().mockResolvedValue({
          error: {
            message: 'Resource has been exhausted (e.g. check quota).',
            status: 'RESOURCE_EXHAUSTED',
          },
        }),
      });

      await expect(
        service.generateChatResponse({ message: 'Hello' }, mockUser as any),
      ).rejects.toThrow(HttpException);
    });

    it('should handle unavailable model and throw ServiceUnavailableException', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: jest.fn().mockResolvedValue({
          error: {
            message: 'models/unknown-model is not found',
            status: 'NOT_FOUND',
          },
        }),
      });

      await expect(
        service.generateChatResponse({ message: 'Hello', model: 'unknown-model' }, mockUser as any),
      ).rejects.toThrow(ServiceUnavailableException);
    });
  });
});
