# SKILL: error-handling

**Nível:** Foundation
**Versão:** 1.0
**Aplica-se a:** Qualquer módulo TypeScript no projeto `novatech-assistant`

---

## Contexto

Use `AppError` quando o erro é uma **condição operacional esperada**: validação falhou, recurso não encontrado, serviço externo retornou status não-2xx. Deixe `Error` nativo para **bugs de programação** inesperados que não devem ser capturados no handler.

Por que não `console.log`? Em Azure Functions, `console.log` emite texto não estruturado. Com pino, cada log é um objeto JSON com campos tipados (`requestId`, `code`, `status`) que o Application Insights indexa e sobre os quais dashboards e alertas podem ser construídos.

---

## Regras

1. **Toda instância de `AppError` usa código em `SCREAMING_SNAKE_CASE`.** Exemplos válidos: `VALIDATION_ERROR`, `SEARCH_FAILED`, `NOT_FOUND`. Nunca strings livres como `"search failed"` ou camelCase como `searchFailed`.

2. **Nunca capture um erro apenas para relançar sem adicionar contexto.** Um `try/catch` que só faz `throw err` novamente é ruído. Se não há contexto a adicionar, não use `try/catch` ali.

3. **Nunca use `console.log`, `console.error` ou `console.warn` em handlers ou services.** Use exclusivamente `logger.info`, `logger.warn`, `logger.error` importados de `src/shared/logger.ts`.

4. **Erros não tratados em handlers retornam `500`, sem vazar detalhes internos.** A mensagem ao cliente é genérica (`INTERNAL_ERROR`). Stack traces e mensagens de erro interno ficam apenas no log com nível `error`.

5. **Inclua `requestId` em toda entrada de log que referencia uma operação de negócio.** Sem `requestId`, não é possível correlacionar múltiplos logs de uma mesma request no Application Insights.

---

## DO / DON'T

### Criando erros operacionais

```typescript
// ✅ DO — código padronizado, status HTTP explícito
throw new AppError('SEARCH_FAILED', 'Embedding service returned 503', 502);

// ❌ DON'T — sem código estruturado, sem status HTTP
throw new Error('search failed');
```

### Tratando erros em handlers

```typescript
// ✅ DO — bifurca AppError de erros inesperados, não vaza detalhes
} catch (err) {
  if (err instanceof AppError) {
    logger.warn({ requestId, code: err.code, status: err.status }, 'app_error');
    return { status: err.status, jsonBody: { error: err.code, message: err.message } };
  }
  logger.error({ requestId, err }, 'unexpected_error');
  return { status: 500, jsonBody: { error: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } };
}

// ❌ DON'T — console, vaza stack trace ao cliente
} catch (err) {
  console.log(err);
  return { status: 500, jsonBody: { error: (err as Error).message } };
}
```

### Logging com contexto

```typescript
// ✅ DO — structured log, sem PII, com requestId
logger.info({ requestId, question_length: question.length }, 'query_received');

// ❌ DON'T — PII no log, não estruturado, sem requestId
console.log(`query received: ${question}`);
```

---

## Anti-patterns

### 1. Error swallowing silencioso

```typescript
// ❌ Anti-pattern
try {
  await searchService.search(question);
} catch {
  // silently ignored
}
```

**Por que é perigoso:** falhas no SearchService passam despercebidas. O usuário recebe resposta vazia sem erro explícito e o time de operações não recebe alerta.

**Correção:** sempre logar + re-throw como `AppError` ou retornar resposta de erro explícita com status adequado.

---

### 2. Códigos de erro sem contrato

```typescript
// ❌ Anti-pattern — strings livres impossibilitam groupBy em dashboards
throw new AppError('the search service was down', 'service error', 502);

// ❌ também ruim — camelCase inconsistente
throw new AppError('searchFailed', 'service error', 502);
```

**Por que é perigoso:** sem padronização, alertas no Application Insights não conseguem agrupar erros por tipo. `SEARCH_FAILED` vs `SearchFailed` vs `search_failed` são três categorias distintas no índice.

**Correção:** definir os códigos como constantes:

```typescript
export const ErrorCodes = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  SEARCH_FAILED: 'SEARCH_FAILED',
  COMPLETION_FAILED: 'COMPLETION_FAILED',
  COMPLETION_TIMEOUT: 'COMPLETION_TIMEOUT',
  NOT_IMPLEMENTED: 'NOT_IMPLEMENTED',
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];
```
