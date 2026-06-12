import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { z } from 'zod';
import pino from 'pino';
import { AppError } from '../../shared/errors.js';

const logger = pino({ name: 'query-handler' });

const QuerySchema = z.object({
  question: z.string().min(1).max(500),
  session_id: z.string().uuid().optional(),
});

export async function queryHandler(
  req: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  const requestId = context.invocationId;

  try {
    const body = await req.json();
    const parsed = QuerySchema.safeParse(body);

    if (!parsed.success) {
      logger.warn({ requestId, errors: parsed.error.flatten() }, 'validation_failed');
      return {
        status: 400,
        jsonBody: {
          error: 'VALIDATION_ERROR',
          details: parsed.error.flatten().fieldErrors,
        },
      };
    }

    const { question } = parsed.data;
    logger.info({ requestId, question_length: question.length }, 'query_received');

    // SearchService e CompletionService integrados em TASK-003 e TASK-004
    throw new AppError('NOT_IMPLEMENTED', 'Query pipeline not yet connected', 501);

  } catch (err) {
    if (err instanceof AppError) {
      logger.warn({ requestId, code: err.code, status: err.status }, 'app_error');
      return {
        status: err.status,
        jsonBody: { error: err.code, message: err.message },
      };
    }
    logger.error({ requestId, err }, 'unexpected_error');
    return {
      status: 500,
      jsonBody: { error: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
    };
  }
}

app.http('query', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'query',
  handler: queryHandler,
});
