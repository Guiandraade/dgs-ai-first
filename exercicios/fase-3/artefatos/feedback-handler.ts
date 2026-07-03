import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { CosmosClient } from '@azure/cosmos';
import pino from 'pino';
import { z } from 'zod';
import { AppError } from './errors.js';

const logger = pino({ name: 'feedback-handler' });

const FeedbackSchema = z.object({
  queryId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional(),
  attendantEmail: z.string().email().optional(),
});

type FeedbackInput = z.infer<typeof FeedbackSchema>;

function sanitizeForLogs(feedback: FeedbackInput) {
  return {
    queryId: feedback.queryId,
    rating: feedback.rating,
    hasComment: Boolean(feedback.comment),
    hasAttendantEmail: Boolean(feedback.attendantEmail),
  };
}

async function saveFeedback(feedback: FeedbackInput): Promise<void> {
  const connectionString = process.env.COSMOS_CONNECTION_STRING;

  if (!connectionString) {
    throw new AppError('CONFIG_ERROR', 'COSMOS_CONNECTION_STRING not configured', 500);
  }

  const client = new CosmosClient(connectionString);
  const database = client.database('novatech');
  const container = database.container('feedbacks');

  await container.items.create({
    ...feedback,
    timestamp: new Date().toISOString(),
  });
}

export async function feedbackHandler(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  const requestId = context.invocationId;

  let rawBody: unknown;

  try {
    rawBody = await request.json();
  } catch (err) {
    logger.warn({ requestId, err }, 'invalid_json');
    return {
      status: 400,
      jsonBody: {
        error: 'INVALID_JSON',
        message: 'Request body must be valid JSON',
        requestId,
      },
    };
  }

  try {
    const parsed = FeedbackSchema.safeParse(rawBody);

    if (!parsed.success) {
      logger.warn({ requestId, errors: parsed.error.flatten() }, 'validation_failed');
      return {
        status: 400,
        jsonBody: {
          error: 'VALIDATION_ERROR',
          details: parsed.error.flatten().fieldErrors,
          requestId,
        },
      };
    }

    await saveFeedback(parsed.data);

    logger.info(
      {
        requestId,
        feedback: sanitizeForLogs(parsed.data),
      },
      'feedback_saved'
    );

    return {
      status: 200,
      jsonBody: {
        status: 'OK',
        requestId,
      },
    };
  } catch (err) {
    if (err instanceof AppError) {
      logger.warn(
        {
          requestId,
          code: err.code,
          status: err.status,
        },
        'app_error'
      );

      return {
        status: err.status,
        jsonBody: {
          error: err.code,
          message: err.message,
          requestId,
        },
      };
    }

    logger.error({ requestId, err }, 'unexpected_error');

    return {
      status: 500,
      jsonBody: {
        error: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
        requestId,
      },
    };
  }
}

app.http('feedback', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'feedback',
  handler: feedbackHandler,
});
