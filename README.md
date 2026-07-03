# DGS AI First — Cenário 3

**Autor:** Guilherme Nascimento
**Papel:** Desenvolvedor
**Programa:** DB1 Global Software — Certificação DGS AI First
**Branch de entrega:** `cenario-3`
**Data:** 03/07/2026

---

## O que é este repositório

Entregáveis dos **Cenários 1, 2 e 3** da certificação DGS AI First. O cenário simula um projeto real: a NovaTech, empresa de logística com 1.200 funcionários, que contrata a DB1 para construir um assistente de IA que responde perguntas dos atendentes com base na documentação interna.

---

## Estrutura do repositório

```
assets/
  anexos/
    anexo-a-documentos-individuais/    ← 5 documentos fonte da NovaTech
    anexo-b-chunks-referencia-rag.md   ← gabarito de retrieval
  copilot-sugestao-ingest.png          ← evidência de uso do GitHub Copilot

exercicios/
  fase-1/
    exercicio-fase-1-entendimento.md   ← enunciado original
    entregaveis/
      exercicio-1.1-resolucao.md       ← análise de viabilidade técnica
  fase-3/
    entregaveis/
      exercicio-3.1-resolucao.md       ← structured output + guardrails determinísticos
      exercicio-3.2-resolucao.md       ← revisão crítica de código gerado por IA
      evidencias-fase-3.md             ← índice de evidências da fase
      checklist-conformidade-fase-3.md ← checklist final de conformidade
    artefatos/
      response-validator.ts            ← validação determinística de resposta do modelo
      feedback-handler.ts              ← módulo de feedback reescrito conforme AGENTS

src/
  services/
    response-validator.ts              ← path canônico do enunciado 3.1
  functions/
    feedback/
      handler.ts                       ← path canônico do enunciado 3.2

assets/
  evidencias/
    fase-3/
      claude-3.1-review-*.png          ← evidências reais de revisão/iteração
      claude-3.2-review-*.png
      copilot-3.1-geracao-inicial-*.png
      copilot-3.2-refactor-*.png
      exercicio-1.2-resolucao.md       ← system prompt v1/v2 + testes
      exercicio-1.3-resolucao.md       ← pipeline RAG + resultados reais
  fase-2/
    entregaveis/
      exercicio-2.1-resolucao.md       ← MCP servers: configuração + riscos
      exercicio-2.2-resolucao.md       ← SDD: tasks.md + handler + revisão crítica
      exercicio-2.3-resolucao.md       ← Skill tree + SKILL.md error-handling
    artefatos/
      mcp.json                         ← config MCP com least privilege
      tasks-query-endpoint.md          ← 5 tarefas atômicas
      handler.ts                       ← Azure Function query handler
      errors.ts                        ← AppError class
      skill-error-handling.md          ← SKILL.md completo
  fase-3/
    entregaveis/
      exercicio-3.1-resolucao.md       ← structured output + guardrails deterministicos
      exercicio-3.2-resolucao.md       ← revisao critica de codigo IA + modulo reescrito
      evidencias-fase-3.md             ← indice de evidencias da fase de governanca
      checklist-conformidade-fase-3.md ← conformidade PASS/PENDENTE por criterio oficial
    artefatos/
      response-validator.ts            ← validacao deterministica de respostas do modelo
      feedback-handler.ts              ← handler de feedback reescrito conforme AGENTS.md

src/
  services/
    response-validator.ts              ← path canonico pedido no enunciado (3.1)
  functions/
    feedback/
      handler.ts                       ← path canonico pedido no enunciado (3.2)

rag/                                   ← pipeline RAG implementado em Python (Fase 1)

assets/
  evidencias/
    fase-3/
      captura-governanca-2026-06-23-163908.png  ← captura indexada para suporte da avaliacao
```

---

## Exercícios entregues

### Fase 1 — Pipeline RAG

| Exercício | Tema | Ferramenta | Entregável |
|-----------|------|-----------|------------|
| 1.1 | Análise de viabilidade técnica | Claude (chat) | [exercicio-1.1-resolucao.md](exercicios/fase-1/entregaveis/exercicio-1.1-resolucao.md) |
| 1.2 | Prototipação de system prompt | Claude (chat) | [exercicio-1.2-resolucao.md](exercicios/fase-1/entregaveis/exercicio-1.2-resolucao.md) |
| 1.3 | Pipeline RAG funcional | Claude + GitHub Copilot | [exercicio-1.3-resolucao.md](exercicios/fase-1/entregaveis/exercicio-1.3-resolucao.md) |

### Fase 2 — Developer

| Exercício | Tema | Entregável |
|-----------|------|------------|
| 2.1 | MCP Servers: mapeamento + least privilege + riscos | [exercicio-2.1-resolucao.md](exercicios/fase-2/entregaveis/exercicio-2.1-resolucao.md) |
| 2.2 | SDD: tasks.md + Azure Function handler + revisão crítica | [exercicio-2.2-resolucao.md](exercicios/fase-2/entregaveis/exercicio-2.2-resolucao.md) |
| 2.3 | Skill tree (10 nós) + SKILL.md error-handling | [exercicio-2.3-resolucao.md](exercicios/fase-2/entregaveis/exercicio-2.3-resolucao.md) |

### Fase 3 — Governança e Validação (Developer)

| Exercício | Tema | Entregável |
|-----------|------|------------|
| 3.1 | Structured output + verificações determinísticas | [exercicio-3.1-resolucao.md](exercicios/fase-3/entregaveis/exercicio-3.1-resolucao.md) |
| 3.2 | Revisão crítica de código gerado por IA | [exercicio-3.2-resolucao.md](exercicios/fase-3/entregaveis/exercicio-3.2-resolucao.md) |
| Evidências | Índice de evidências da fase | [evidencias-fase-3.md](exercicios/fase-3/entregaveis/evidencias-fase-3.md) |
| Conformidade | Checklist oficial de critérios | [checklist-conformidade-fase-3.md](exercicios/fase-3/entregaveis/checklist-conformidade-fase-3.md) |

### Fase 3 — Governança e Validação (Developer)

| Exercício | Tema | Entregável |
|-----------|------|------------|
| 3.1 | Structured output + verificações determinísticas | [exercicio-3.1-resolucao.md](exercicios/fase-3/entregaveis/exercicio-3.1-resolucao.md) |
| 3.2 | Revisão crítica de código gerado por IA | [exercicio-3.2-resolucao.md](exercicios/fase-3/entregaveis/exercicio-3.2-resolucao.md) |
| Evidências | Índice de evidências da fase | [evidencias-fase-3.md](exercicios/fase-3/entregaveis/evidencias-fase-3.md) |
| Conformidade | Checklist oficial de critérios | [checklist-conformidade-fase-3.md](exercicios/fase-3/entregaveis/checklist-conformidade-fase-3.md) |

---

## Pipeline RAG — Como rodar (Fase 1)

```bash
cd rag
pip install -r requirements.txt
python ingest.py    # ingere 5 documentos → 35 chunks no ChromaDB
python run_tests.py # roda 6 perguntas e gera prompts_para_claude/
```

Resultados dos testes de retrieval:

| ID | Pergunta | Resultado | Observação |
|----|----------|-----------|------------|
| P1 | Prazo de devolução? | ✅ POL-001 recuperado | Seção 3.1 ficou em 4º |
| P2 | Pode devolver carga perigosa? | ⚠️ Falha crítica | §3.2 não entrou no top 5 — FAQ dominou |
| P3 | SLA Gold? | ✅ SLA-2024 recuperado | Tabela (seção 2) não entrou no top 3 |
| P4 | SLA Platinum? | ✅ Alucinação bloqueada | FAQ Item 15 ficou em 1º |
| P5 | Frete 600kg Manaus? | ✅ PROC-042-v2 recuperado | Tabela de multiplicadores não entrou no top 5 |
| P6 | Frete 300kg Salvador? | ✅ Sem cobertura detectada | score mínimo 0.94 > threshold 0.5 |

---

## Stack

### Fase 1 (Python)
- **Python 3.11**, **ChromaDB**, **sentence-transformers** (`all-MiniLM-L6-v2`), **Claude** (chat manual), **GitHub Copilot**

### Fase 2 (TypeScript)
- **Azure Functions v4**, **Zod**, **pino**, **TypeScript 5.5**, **Vitest**
- Workspace local: `novatech-assistant` (Anexo D do enunciado)

### Fase 3 (TypeScript + Governança)
- **Structured outputs com Zod**, **guardrails determinísticos**, **revisão crítica de outputs de IA**
- Evidências reais de uso de **Claude** e **GitHub Copilot** versionadas em `assets/evidencias/fase-3/`
