# Exercicio 3.2 - Revisao Critica de Codigo Gerado por IA

**Autor:** Guilherme Nascimento  
**Papel:** Desenvolvedor  
**Cenario:** 3 - Governanca e Validacao  
**Data:** 03/07/2026

---

## Objetivo

Revisar criticamente o modulo de feedback gerado por IA antes do merge, comparando avaliacao humana com avaliacao do Claude, e entregar uma versao reescrita aderente ao AGENTS.md do projeto.

Resumo das regras consideradas (AGENTS.md):

- TypeScript strict mode.
- Zod para validacao de input.
- pino para logging (nunca console.log).
- Nunca logar dados pessoais.
- Imports estaticos no topo (nunca require dinamico).

---

## 1. Minha revisao (antes do Claude)

Codigo de entrada (simulado) apresentava os problemas abaixo:

| Problema | Classificacao | Risco |
|---|---|---|
| `const body = await request.json() as any;` | Violacao AGENTS.md | Entrada sem contrato, facilita dados invalidos em producao |
| `console.log('Feedback recebido:', JSON.stringify(feedback));` | Violacao AGENTS.md + seguranca | Logging sem controle e vazamento de PII |
| `const { CosmosClient } = require('@azure/cosmos');` | Violacao AGENTS.md | Import dinamico dificulta analise estatica e bundling |
| `attendantEmail` incluido no objeto logado | Problema de seguranca | Exposicao de dado pessoal de atendente |
| Resposta `body: 'OK'` sem estrutura e sem requestId | Bug potencial de observabilidade | Dificulta rastreamento de incidente |
| Sem try/catch estruturado | Bug potencial | Falhas de runtime retornam comportamento inconsistente |

---

## 2. Revisao do Claude (2a opiniao)

Pontos levantados pelo Claude:

1. Necessidade de schema Zod para `queryId`, `rating`, `comment`, `attendantEmail`.
2. Substituicao de `console.log` por pino com payload sanitizado.
3. Import estatico do Cosmos Client no topo.
4. Nao logar email em texto claro.
5. Padronizar respostas de erro com codigos e `requestId`.

### Comparacao humano x Claude

- **Convergencia:** total nos 4 problemas obrigatorios da avaliacao (as any, console.log, require dinamico, PII em log).
- **Complemento do Claude:** reforco de padronizacao de erro e estrutura de resposta para observabilidade.
- **Divergencia relevante:** nenhuma.

---

## 3. Codigo reescrito com Copilot (corrigido)

Arquivo final: [exercicios/fase-3/artefatos/feedback-handler.ts](../artefatos/feedback-handler.ts)

### Correcoes aplicadas

1. `as any` removido, com validacao via `FeedbackSchema.safeParse`.
2. `console.log` removido, substituido por `pino`.
3. `require` dinamico removido, usando `import { CosmosClient } from '@azure/cosmos';`.
4. `attendantEmail` nao eh logado em claro; logs usam flags (`hasAttendantEmail`, `hasComment`).
5. Tratamento de erros com `AppError` e fallback `INTERNAL_ERROR`.
6. Respostas retornam `jsonBody` estruturado com `requestId`.

Trecho representativo:

```typescript
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
```

---

## 4. Checklist contra criterios de avaliacao

| Criterio | Status | Evidencia |
|---|---|---|
| Identifica `as any` sem Zod | Atendido | Secao 1 |
| Identifica `console.log` | Atendido | Secao 1 |
| Identifica `require` dinamico | Atendido | Secao 1 |
| Identifica PII em log (`attendantEmail`) | Atendido | Secao 1 |
| Comparacao humano vs Claude honesta | Atendido | Secao 2 |
| Codigo final segue AGENTS.md | Atendido | Arquivo em artefatos |

---

## 5. Observacao operacional

Para submissao formal da trilha, anexar evidencias de uso real (iteracoes com Claude e Copilot) junto com este documento e o codigo final.
