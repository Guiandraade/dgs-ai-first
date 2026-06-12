# DGS AI First — Cenário 2

**Autor:** Guilherme Nascimento
**Papel:** Desenvolvedor
**Programa:** DB1 Global Software — Certificação DGS AI First
**Branch de entrega:** `cenario-2`
**Data:** 12/06/2026

---

## O que é este repositório

Entregáveis dos **Cenários 1 e 2** da certificação DGS AI First. O cenário simula um projeto real: a NovaTech, empresa de logística com 1.200 funcionários, que contrata a DB1 para construir um assistente de IA que responde perguntas dos atendentes com base na documentação interna.

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

rag/                                   ← pipeline RAG implementado em Python (Fase 1)
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
