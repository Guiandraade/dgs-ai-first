# Exercício 2.2 — Spec Driven Development: Query Endpoint

**Autor:** Guilherme Nascimento
**Papel:** Desenvolvedor
**Cenário:** 2 — NovaTech Assistant (TypeScript)
**Data:** 12/06/2026

---

## Objetivo

Aplicar o fluxo SDD (Spec Driven Development) para a spec `query-endpoint`: decompor o `plan.md` em tarefas atômicas com critérios de aceitação verificáveis (`tasks.md`), implementar a TASK-001 com o stack prescrito (Azure Functions v4, Zod, pino, AppError) e realizar uma revisão crítica de 3 pontos do código gerado.

---

## 1. Decomposição em Tarefas Atômicas (`tasks.md`)

O arquivo completo está disponível em [`artefatos/tasks-query-endpoint.md`](../artefatos/tasks-query-endpoint.md). Resumo das 5 tarefas e suas dependências:

```
TASK-002  Shared types e AppError              (sem dependências)
    ↓
TASK-001  HTTP handler scaffold                (depende de TASK-002)
    ↓
TASK-003  Integração SearchService             (depende de TASK-001)
    ↓
TASK-004  Integração CompletionService         (depende de TASK-003)
    ↓
TASK-005  Integration tests                    (depende de TASK-004)
```

### Critérios de decomposição adotados

| Critério | Decisão |
|---|---|
| **Atomicidade** | Cada tarefa entrega um comportamento verificável por pelo menos um teste unitário antes de avançar |
| **Dependência explícita** | TASK-001 depende de TASK-002 (AppError deve existir na compilação), não o contrário |
| **Separação serviços externos** | SearchService (TASK-003) e CompletionService (TASK-004) são tarefas separadas: falhas de integração têm diagnóstico isolado |
| **Testes por último** | Integration tests (TASK-005) só fazem sentido com pipeline completo. Testes unitários de cada tarefa ficam nos critérios de aceitação da própria tarefa |

---

## 2. Implementação: TASK-001 — HTTP Handler Scaffold

### 2.1 `src/shared/errors.ts` (pré-requisito de TASK-002)

```typescript
export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number = 500
  ) {
    super(message);
    this.name = 'AppError';
  }
}
```

### 2.2 `src/functions/query/handler.ts`

```typescript
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
```

Arquivo completo disponível em: [`artefatos/handler.ts`](../artefatos/handler.ts)

### 2.3 Cobertura dos critérios da TASK-001

| Critério | Status | Como verificar |
|---|---|---|
| Recebe POST com `question` + `session_id?` | ✅ | `QuerySchema` valida ambos os campos |
| Retorna 400 se `question` vazia ou > 500 chars | ✅ | `z.string().min(1).max(500)` |
| Retorna 400 se `session_id` não for UUID | ✅ | `z.string().uuid().optional()` |
| Log `query_received` (info) com `question_length` | ✅ | `logger.info({ requestId, question_length })` |
| Log `validation_failed` (warn) | ✅ | `logger.warn({ requestId, errors })` |
| Log `app_error` (warn) | ✅ | `logger.warn({ requestId, code, status })` |
| Log `unexpected_error` (error) | ✅ | `logger.error({ requestId, err })` |
| Sem `console.log` | ✅ | Apenas pino no arquivo |
| Compila sem erros | ✅ | `npx tsc --noEmit` sem output |

---

## 3. Revisão Crítica — 3 Pontos

### Ponto 1 — `authLevel: 'anonymous'` sem alerta de produção

**O que está no código:**
```typescript
app.http('query', {
  methods: ['POST'],
  authLevel: 'anonymous',   // ← sem comentário
  route: 'query',
  handler: queryHandler,
});
```

**Problema:** `anonymous` remove qualquer verificação de chave de função do Azure. Em ambiente local e de desenvolvimento é necessário e prático. O risco é que o arquivo seja promovido para produção sem alteração — o endpoint ficaria exposto sem autenticação.

**Sugestão de correção:** Ou mudar para `'function'` e usar variável de ambiente para override local, ou adicionar comentário explícito:
```typescript
// ATENÇÃO: mudar para 'function' antes do deploy para produção
authLevel: process.env.NODE_ENV === 'production' ? 'function' : 'anonymous',
```

**Severidade:** Alta em produção, aceitável em desenvolvimento.

---

### Ponto 2 — `requestId` ausente nas respostas de erro

**O que está no código:**
```typescript
return {
  status: err.status,
  jsonBody: { error: err.code, message: err.message },
  //         ↑ sem requestId
};
```

**Problema:** quando um cliente recebe um erro `502 SEARCH_FAILED`, não tem como correlacionar esse erro com um log específico no Application Insights. O suporte precisa da `requestId` para encontrar o contexto. O `requestId` existe no escopo do handler mas não é propagado ao cliente.

**Sugestão de correção:**
```typescript
return {
  status: err.status,
  jsonBody: { error: err.code, message: err.message, requestId },
};
```

**Severidade:** Média — impacta observabilidade e tempo de diagnóstico em incidentes.

---

### Ponto 3 — `session_id` aceito mas ignorado silenciosamente

**O que está no código:**
```typescript
const { question } = parsed.data;
// session_id está em parsed.data mas não é desestruturado nem usado
```

**Problema:** o campo `session_id` é validado como UUID opcional, mas nunca utilizado na TASK-001. Se um cliente enviar `session_id`, o campo entra no sistema, é validado com sucesso e desaparece silenciosamente. Isso pode causar confusão em testes de integração: o cliente assume que `session_id` influencia o comportamento, mas não influencia.

**Sugestão de correção:** duas opções:
1. Adicionar comentário documentando uso futuro: `// session_id será usado em TASK-003 para cache de busca`
2. Retornar 400 até o campo ser implementado, para fazer o contrato ser honesto:
```typescript
if (parsed.data.session_id) {
  return { status: 400, jsonBody: { error: 'NOT_SUPPORTED', message: 'session_id not yet implemented' } };
}
```

**Severidade:** Baixa — técnica dívida que pode confundir integradores.

---

## Artefatos

| Arquivo | Descrição |
|---|---|
| [`artefatos/tasks-query-endpoint.md`](../artefatos/tasks-query-endpoint.md) | 5 tarefas atômicas com critérios de aceitação |
| [`artefatos/handler.ts`](../artefatos/handler.ts) | Implementação TASK-001 |
| [`artefatos/errors.ts`](../artefatos/errors.ts) | AppError class (TASK-002 pré-requisito) |
