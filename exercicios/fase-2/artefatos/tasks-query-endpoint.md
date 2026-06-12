# tasks.md — Spec: query-endpoint

Gerado a partir de `specs/query-endpoint/plan.md`.
Cada tarefa é atômica: pode ser implementada e testada de forma independente.

---

## TASK-001 — HTTP handler scaffold

**Descrição:** Criar o Azure Function HTTP trigger para o endpoint `POST /api/query` com validação de input via Zod, logging estruturado via pino e tratamento de erros via `AppError`.

**Dependências:** TASK-002 (AppError deve existir antes de importar)

**Critério de aceitação:**
- [ ] Recebe `POST /api/query` com body `{ question: string, session_id?: string }`
- [ ] Retorna `400` com `{ error: "VALIDATION_ERROR", details: {...} }` se `question` for vazia ou tiver mais de 500 caracteres
- [ ] Retorna `400` se `session_id` for informado mas não for UUID v4 válido
- [ ] Log `query_received` (nível `info`) emitido com `{ requestId, question_length }`
- [ ] Log `validation_failed` (nível `warn`) emitido com `{ requestId, errors }`
- [ ] Log `app_error` (nível `warn`) emitido com `{ requestId, code, status }`
- [ ] Log `unexpected_error` (nível `error`) emitido com `{ requestId, err }`
- [ ] Nenhuma ocorrência de `console.log`, `console.error` ou `console.warn` no arquivo
- [ ] Compila sem erros: `npx tsc --noEmit`

---

## TASK-002 — Shared types e AppError

**Descrição:** Criar `src/shared/errors.ts` com a classe `AppError` e `src/shared/types.ts` com os tipos de request/response do query endpoint.

**Dependências:** nenhuma

**Critério de aceitação:**
- [ ] `AppError` extende `Error` com campos `code: string`, `status: number` e `name = 'AppError'`
- [ ] `QueryRequest` exportado de `types.ts` com campos `question: string` e `session_id?: string`
- [ ] `QueryResponse` exportado de `types.ts` com campos `answer: string | null`, `source_document: string | null`, `retrieval_failed?: boolean`
- [ ] Nenhum tipo `any` nos arquivos
- [ ] Compila sem erros: `npx tsc --noEmit`

---

## TASK-003 — Integração SearchService

**Descrição:** Conectar o handler ao `SearchService` em `src/services/search.ts` para recuperar os top-N chunks semanticamente relevantes à query.

**Dependências:** TASK-001, TASK-002

**Critério de aceitação:**
- [ ] Handler chama `searchService.search(question, { topK: 5 })`
- [ ] Cada resultado inclui `{ id, text, source, score }` com `score` entre 0 e 1
- [ ] Se nenhum chunk tiver `score >= 0.5`, retorna `200` com `{ answer: null, source_document: null, retrieval_failed: true }`
- [ ] Erro no SearchService resulta em `AppError` com código `SEARCH_FAILED` e status `502`
- [ ] Teste unitário: mock do SearchService retornando 0 chunks → resposta `retrieval_failed: true`

---

## TASK-004 — Integração CompletionService

**Descrição:** Montar o prompt com os chunks recuperados via `PromptBuilderService` e chamar o `CompletionService` para obter a resposta do modelo.

**Dependências:** TASK-003

**Critério de aceitação:**
- [ ] Prompt montado via `promptBuilderService.build(question, chunks)` — sem string interpolation manual
- [ ] Resposta inclui `{ answer: string, source_document: string }`
- [ ] Timeout de 30 s: se CompletionService não responder, retorna `504` com código `COMPLETION_TIMEOUT`
- [ ] Erro no CompletionService resulta em `AppError` com código `COMPLETION_FAILED` e status `502`
- [ ] Teste unitário: mock do CompletionService com delay de 31 s → resposta `504`

---

## TASK-005 — Integration tests

**Descrição:** Criar suite de testes de integração para o query endpoint cobrindo o happy path e os cenários de erro críticos.

**Dependências:** TASK-004

**Critério de aceitação:**
- [ ] Happy path: `POST /api/query` com `question` válida retorna `200` com `answer` e `source_document` não nulos
- [ ] Validation error: `POST /api/query` sem campo `question` retorna `400` com `details.question`
- [ ] Retrieval failed: mock SearchService retornando 0 chunks → resposta `200` com `retrieval_failed: true`
- [ ] Completion timeout: mock CompletionService com delay > 30 s → resposta `504`
- [ ] Todos os testes passam: `npm test`
- [ ] Cobertura de branches: 100% no arquivo `handler.ts`
