# DGS AI First — Cenário 1

**Autor:** Guilherme Nascimento  
**Papel:** Desenvolvedor  
**Programa:** DB1 Global Software — Certificação DGS AI First  
**Branch de entrega:** `cenario-1`  
**Data:** 06/06/2026

---

## O que é este repositório

Entregáveis do **Cenário 1** da certificação DGS AI First. O cenário simula um projeto real: a NovaTech, empresa de logística com 1.200 funcionários, contrata a DB1 para construir um assistente de IA que responde perguntas dos atendentes com base na documentação interna — sem inventar informação.

Os exercícios cobrem fundamentos de LLM, engenharia de contexto, prototipação de system prompt e implementação de um pipeline RAG funcional com ferramentas open-source.

---

## Estrutura do repositório

```
assets/
  anexos/
    anexo-a-documentos-individuais/    ← 5 documentos fonte da NovaTech (input do pipeline)
    anexo-b-chunks-referencia-rag.md   ← gabarito de retrieval (mapa pergunta → chunks esperados)
  copilot-sugestao-ingest.png          ← evidência de uso do GitHub Copilot

exercicios/
  fase-1/
    exercicio-fase-1-entendimento.md   ← enunciado original dos exercícios
    entregaveis/
      exercicio-1.1-resolucao.md       ← análise de viabilidade técnica + revisão com Claude
      exercicio-1.2-resolucao.md       ← system prompt v1/v2 + testes + análise crítica
      exercicio-1.3-resolucao.md       ← pipeline RAG + resultados reais + problemas identificados

rag/                                   ← pipeline RAG implementado em Python
  ingest.py                            ← leitura, chunking, embeddings, ChromaDB
  search.py                            ← busca semântica por distância cosseno
  prompt_builder.py                    ← montagem do prompt com mitigation lost-in-middle
  run_tests.py                         ← 6 testes de retrieval com saída para prompts_para_claude/
  requirements.txt
  prompts_para_claude/                 ← prompts gerados para colar no Claude chat (p1 a p6)
```

---

## Exercícios entregues

| Exercício | Tema | Ferramenta | Entregável |
|-----------|------|-----------|------------|
| 1.1 | Análise de viabilidade técnica + engenharia de contexto | Claude (chat) | [exercicio-1.1-resolucao.md](exercicios/fase-1/entregaveis/exercicio-1.1-resolucao.md) |
| 1.2 | Prototipação de system prompt | Claude (chat) | [exercicio-1.2-resolucao.md](exercicios/fase-1/entregaveis/exercicio-1.2-resolucao.md) |
| 1.3 | Pipeline RAG funcional | Claude + GitHub Copilot | [exercicio-1.3-resolucao.md](exercicios/fase-1/entregaveis/exercicio-1.3-resolucao.md) |

---

## Pipeline RAG — Como rodar

### Pré-requisito

```bash
cd rag
pip install -r requirements.txt
```

### Passo 1 — Ingerir os documentos

Lê os 5 arquivos `.md`, aplica chunking por tipo de documento, gera embeddings e persiste no ChromaDB.

```bash
python ingest.py
```

Saída real da execução:
```
FAQ-atendimento.md: 10 chunks
POL-001-politica-devolucao.md: 6 chunks
PROC-042-frete-especial-v1.md: 6 chunks
PROC-042-v2-frete-especial-revisado.md: 7 chunks
SLA-2024-tabela-sla-clientes.md: 6 chunks
Total: 35 chunks
Ingestão concluída.
```

### Passo 2 — Executar os testes de retrieval

```bash
python run_tests.py
```

Roda as 6 perguntas do gabarito e salva os prompts prontos em `prompts_para_claude/`.

### Passo 3 — Busca avulsa (opcional)

```bash
python search.py "Qual o prazo de devolução?"
```

### Passo 4 — Avaliar no Claude chat

Os arquivos `prompts_para_claude/p1_prompt.txt` a `p6_prompt.txt` contêm o prompt completo pronto para colar no [claude.ai](https://claude.ai). O pipeline não chama a API — o enunciado pede avaliação via Claude chat manual.

---

## Stack

- **Python 3.11**
- **ChromaDB** — vector store local (distância cosseno)
- **sentence-transformers** (`all-MiniLM-L6-v2`) — embeddings open-source
- **Claude** (chat manual) — geração e avaliação das respostas
- **GitHub Copilot** — assistência no desenvolvimento do pipeline

Sem LangChain. O pipeline é código manual para tornar cada etapa explícita e auditável.

---

## Resultados dos testes (execução real)

| ID | Pergunta | Resultado retrieval | Observação |
|----|----------|-------------------|------------|
| P1 | Prazo de devolução? | ✅ POL-001 recuperado | Seção 3.1 ficou em 4º — não entrou no top 3 |
| P2 | Pode devolver carga perigosa? | ✅ POL-001 recuperado | Seção 3.2 (proibição) não entrou no top 5 — FAQ dominou |
| P3 | SLA Gold? | ✅ SLA-2024 recuperado | Tabela (seção 2) não entrou no top 3 |
| P4 | SLA Platinum? | ✅ Alucinação bloqueada | FAQ Item 15 ("Platinum não existe") ficou em 1º |
| P5 | Frete 600kg Manaus? | ✅ PROC-042-v2 recuperado | Tabela de multiplicadores não entrou no top 5 |
| P6 | Frete 300kg Salvador? | ✅ Sem cobertura detectada | min_score = 0.94 > threshold 0.5 |
