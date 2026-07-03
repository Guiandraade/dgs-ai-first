# DGS AI First - Cenario 3

**Autor:** Guilherme Nascimento
**Papel:** Desenvolvedor
**Programa:** DB1 Global Software - Certificacao DGS AI First
**Branch de entrega:** `cenario-3`
**Data:** 03/07/2026

---

## O que e este repositorio

Entregaveis dos **Cenarios 1, 2 e 3** da certificacao DGS AI First.
O cenario simula um projeto real: a NovaTech, empresa de logistica com 1.200 funcionarios,
que contrata a DB1 para construir um assistente de IA para atendimento interno.

---

## Estrutura do repositorio

```text
assets/
  anexos/
    anexo-a-documentos-individuais/
    anexo-b-chunks-referencia-rag.md
  evidencias/
    fase-3/
      captura-governanca-2026-06-23-163908.png
      claude-3.1-review-2026-07-03-172132.png
      claude-3.2-review-2026-07-03-172511.png
      copilot-3.1-geracao-inicial-2026-07-03-171824.png
      copilot-3.2-refactor-2026-07-03-172715.png

exercicios/
  fase-1/
    exercicio-fase-1-entendimento.md
    entregaveis/
      exercicio-1.1-resolucao.md
      exercicio-1.2-resolucao.md
      exercicio-1.3-resolucao.md
  fase-2/
    entregaveis/
      exercicio-2.1-resolucao.md
      exercicio-2.2-resolucao.md
      exercicio-2.3-resolucao.md
    artefatos/
      mcp.json
      tasks-query-endpoint.md
      handler.ts
      errors.ts
      skill-error-handling.md
  fase-3/
    entregaveis/
      exercicio-3.1-resolucao.md
      exercicio-3.2-resolucao.md
      evidencias-fase-3.md
      checklist-conformidade-fase-3.md
    artefatos/
      response-validator.ts
      feedback-handler.ts

src/
  services/
    response-validator.ts
  functions/
    feedback/
      handler.ts

rag/
  ingest.py
  prompt_builder.py
  run_tests.py
  search.py
```

---

## Exercicios entregues

### Fase 1 - Pipeline RAG

| Exercicio | Tema | Ferramenta | Entregavel |
|-----------|------|------------|------------|
| 1.1 | Analise de viabilidade tecnica | Claude (chat) | [exercicio-1.1-resolucao.md](exercicios/fase-1/entregaveis/exercicio-1.1-resolucao.md) |
| 1.2 | Prototipacao de system prompt | Claude (chat) | [exercicio-1.2-resolucao.md](exercicios/fase-1/entregaveis/exercicio-1.2-resolucao.md) |
| 1.3 | Pipeline RAG funcional | Claude + GitHub Copilot | [exercicio-1.3-resolucao.md](exercicios/fase-1/entregaveis/exercicio-1.3-resolucao.md) |

### Fase 2 - Developer

| Exercicio | Tema | Entregavel |
|-----------|------|------------|
| 2.1 | MCP Servers: mapeamento + least privilege + riscos | [exercicio-2.1-resolucao.md](exercicios/fase-2/entregaveis/exercicio-2.1-resolucao.md) |
| 2.2 | SDD: tasks.md + Azure Function handler + revisao critica | [exercicio-2.2-resolucao.md](exercicios/fase-2/entregaveis/exercicio-2.2-resolucao.md) |
| 2.3 | Skill tree + SKILL.md error-handling | [exercicio-2.3-resolucao.md](exercicios/fase-2/entregaveis/exercicio-2.3-resolucao.md) |

### Fase 3 - Governanca e Validacao (Developer)

| Exercicio | Tema | Entregavel |
|-----------|------|------------|
| 3.1 | Structured output + verificacoes deterministicas | [exercicio-3.1-resolucao.md](exercicios/fase-3/entregaveis/exercicio-3.1-resolucao.md) |
| 3.2 | Revisao critica de codigo gerado por IA | [exercicio-3.2-resolucao.md](exercicios/fase-3/entregaveis/exercicio-3.2-resolucao.md) |
| Evidencias | Indice de evidencias da fase | [evidencias-fase-3.md](exercicios/fase-3/entregaveis/evidencias-fase-3.md) |
| Conformidade | Checklist oficial de criterios | [checklist-conformidade-fase-3.md](exercicios/fase-3/entregaveis/checklist-conformidade-fase-3.md) |

---

## Stack

### Fase 1 (Python)
- Python 3.11
- ChromaDB
- sentence-transformers (`all-MiniLM-L6-v2`)

### Fase 2 e 3 (TypeScript)
- Azure Functions v4
- Zod
- pino
- TypeScript 5.5
- Vitest

### Governanca (Fase 3)
- Structured outputs com validacao em Zod
- Guardrails deterministicos em codigo
- Revisao critica de outputs de IA com evidencia real de ferramenta
