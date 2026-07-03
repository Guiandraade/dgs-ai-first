# Checklist de Conformidade - Cenario 3 (Desenvolvedor)

Objetivo: validar aderencia dos exercicios 3.1 e 3.2 aos criterios oficiais e explicitar pendencias de evidencia para nota maxima.

## Status geral

- **Cobertura tecnica:** Alta
- **Cobertura de criterios funcionais:** Alta
- **Cobertura de evidencias de ferramenta (Copilot/Claude):** Completa

---

## Exercicio 3.1 - Structured output e verificacoes deterministicas

| Criterio oficial | Status | Evidencia |
|---|---|---|
| Schema de structured output valido em Zod | PASS | [src/services/response-validator.ts](../../../src/services/response-validator.ts) |
| Guardrail 1 bloqueia respostas sem `source_document` | PASS | [src/services/response-validator.ts](../../../src/services/response-validator.ts) |
| Guardrail 2 bloqueia permissao de devolucao de carga perigosa | PASS | [src/services/response-validator.ts](../../../src/services/response-validator.ts) |
| Code review identifica problemas reais | PASS | [exercicios/fase-3/entregaveis/exercicio-3.1-resolucao.md](./exercicio-3.1-resolucao.md) |
| Distincao prompt (probabilistico) vs codigo (deterministico) clara | PASS | [exercicios/fase-3/entregaveis/exercicio-3.1-resolucao.md](./exercicio-3.1-resolucao.md) |
| Evidencia de uso real de Copilot e Claude | PASS | [EV-3-007](./evidencias-fase-3.md), [EV-3-008](./evidencias-fase-3.md) |

---

## Exercicio 3.2 - Revisao critica de codigo gerado por IA

| Criterio oficial | Status | Evidencia |
|---|---|---|
| Identifica `as any` sem validacao Zod | PASS | [exercicios/fase-3/entregaveis/exercicio-3.2-resolucao.md](./exercicio-3.2-resolucao.md) |
| Identifica `console.log` no lugar de pino | PASS | [exercicios/fase-3/entregaveis/exercicio-3.2-resolucao.md](./exercicio-3.2-resolucao.md) |
| Identifica `require` dinamico | PASS | [exercicios/fase-3/entregaveis/exercicio-3.2-resolucao.md](./exercicio-3.2-resolucao.md) |
| Identifica PII em log (`attendantEmail`) | PASS | [exercicios/fase-3/entregaveis/exercicio-3.2-resolucao.md](./exercicio-3.2-resolucao.md) |
| Comparacao humano x Claude honesta | PASS | [exercicios/fase-3/entregaveis/exercicio-3.2-resolucao.md](./exercicio-3.2-resolucao.md) |
| Codigo final reescrito aderente ao AGENTS.md | PASS | [src/functions/feedback/handler.ts](../../../src/functions/feedback/handler.ts) |
| Evidencia de uso real de Copilot e Claude | PASS | [EV-3-009](./evidencias-fase-3.md), [EV-3-010](./evidencias-fase-3.md) |

---

## Lacunas objetivas para ficar 100%

Sem lacunas abertas para os criterios do exercicio 3.1 e 3.2 no papel Desenvolvedor.

---

## Sugestao de convencao para anexos

Salvar em `assets/evidencias/fase-3/` com padrao:

- `copilot-3.1-geracao-inicial-YYYY-MM-DD-HHMMSS.png`
- `claude-3.1-review-YYYY-MM-DD-HHMMSS.png`
- `claude-3.2-review-YYYY-MM-DD-HHMMSS.png`
- `copilot-3.2-refactor-YYYY-MM-DD-HHMMSS.png`
