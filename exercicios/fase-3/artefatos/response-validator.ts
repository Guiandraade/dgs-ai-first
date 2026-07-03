import { z } from 'zod';
import pino from 'pino';

const logger = pino({ name: 'response-validator' });

export const StructuredAnswerSchema = z
  .object({
    answer: z.string().min(1),
    source_document: z.string().min(1),
    confidence_score: z.number().min(0).max(1),
  })
  .strict();

export type StructuredAnswer = z.infer<typeof StructuredAnswerSchema>;

export type ValidationResult = {
  ok: boolean;
  response: StructuredAnswer;
  blockedReason?: 'SCHEMA_INVALID' | 'MISSING_SOURCE' | 'DANGEROUS_RETURN_ALLOWED';
};

const SAFE_RESPONSE: StructuredAnswer = {
  answer:
    'Nao consegui validar esta resposta com seguranca. Encaminhe para revisao humana antes de orientar o cliente.',
  source_document: 'HITL_REQUIRED',
  confidence_score: 0,
};

function normalizeForMatch(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

function mentionsDangerousReturn(answer: string): boolean {
  const normalized = normalizeForMatch(answer);
  return /\bcargas?\s+perigosas?\b/.test(normalized) && /\bdevol/.test(normalized);
}

function allowsDangerousReturn(answer: string): boolean {
  const normalized = normalizeForMatch(answer);
  const permissiveClausePattern =
    /\b(pode|podem|permitid[ao]s?|possivel|autorizad[ao]s?)\b.{0,40}\bdevol/g;
  const localNegationPattern = /\b(nao|nunca|jamais)\b/;

  let match: RegExpExecArray | null;
  while ((match = permissiveClausePattern.exec(normalized)) !== null) {
    const start = match.index ?? 0;
    const localWindow = normalized.slice(Math.max(0, start - 25), start);
    if (!localNegationPattern.test(localWindow)) {
      return true;
    }
  }

  return false;
}

export function validateModelResponse(raw: unknown, requestId: string): ValidationResult {
  const parsed = StructuredAnswerSchema.safeParse(raw);

  if (!parsed.success) {
    logger.warn(
      {
        requestId,
        reason: 'schema_invalid',
        errors: parsed.error.flatten(),
      },
      'response_blocked'
    );

    return {
      ok: false,
      response: SAFE_RESPONSE,
      blockedReason: 'SCHEMA_INVALID',
    };
  }

  const candidate = parsed.data;

  if (!candidate.source_document || candidate.source_document.trim() === '') {
    logger.warn(
      {
        requestId,
        reason: 'missing_source_document',
      },
      'response_blocked'
    );

    return {
      ok: false,
      response: SAFE_RESPONSE,
      blockedReason: 'MISSING_SOURCE',
    };
  }

  if (mentionsDangerousReturn(candidate.answer) && allowsDangerousReturn(candidate.answer)) {
    logger.warn(
      {
        requestId,
        reason: 'dangerous_return_allowed',
        source_document: candidate.source_document,
      },
      'response_blocked'
    );

    return {
      ok: false,
      response: SAFE_RESPONSE,
      blockedReason: 'DANGEROUS_RETURN_ALLOWED',
    };
  }

  logger.info(
    {
      requestId,
      source_document: candidate.source_document,
      confidence_score: candidate.confidence_score,
    },
    'response_validated'
  );

  return {
    ok: true,
    response: candidate,
  };
}
