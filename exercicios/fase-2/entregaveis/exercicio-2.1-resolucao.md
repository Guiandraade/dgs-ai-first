# Exercício 2.1 — Configuração de MCP Servers

**Autor:** Guilherme Nascimento
**Papel:** Desenvolvedor
**Cenário:** 2 — NovaTech Assistant (TypeScript)
**Data:** 12/06/2026

---

## Objetivo

Identificar as necessidades de contexto do papel de Desenvolvedor durante a implementação do `query-endpoint`, mapear essas necessidades a servidores MCP locais e configurar o arquivo `.mcp/mcp.json` com o princípio de menor privilégio. Documentar os riscos de segurança identificados e as evidências de uso.

---

## 1. Mapeamento Necessidade → Servidor MCP

| # | Necessidade | Servidor MCP | Escopo configurado | Justificativa least-privilege |
|---|---|---|---|---|
| 1 | Ler e escrever specs da tarefa (`tasks.md`, `plan.md`) e código do handler (`handler.ts`, `validator.ts`, `shared/`) | `filesystem-rw` | `./specs/query-endpoint`, `./src/functions/query`, `./src/shared` | Limita acesso aos diretórios da tarefa em desenvolvimento. Exclui outros handlers (`/feedback`, `/health`), CI/CD (`.github/workflows/`) e configuração de infraestrutura. |
| 2 | Consultar documentos fonte da NovaTech (política de devolução, SLA, FAQ) para entender o domínio do endpoint | `filesystem-ro` | `./docs/novatech`, `./data/retrieval-corpus` | Documentos de referência nunca precisam ser modificados pela IA. Separar em servidor distinto torna a intenção explícita e evita sobrescrita acidental. |
| 3 | Consultar histórico de commits para entender decisões anteriores de arquitetura | `git` | Repositório local (`.`) | Acesso somente-leitura ao histórico. O servidor não expõe operações de escrita (`commit`, `push`) por padrão. |
| 4 | Manter contexto entre tool calls na sessão (ex: IDs de chunks já consultados, estado de validação) | `memory` | In-memory, sem persistência em disco | Armazenamento efêmero de KV para a sessão atual. Sem acesso ao sistema de arquivos. |

---

## 2. Arquivo `.mcp/mcp.json` Configurado

```json
{
  "mcpServers": {
    "filesystem-rw": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "./specs/query-endpoint",
        "./src/functions/query",
        "./src/shared"
      ]
    },
    "filesystem-ro": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "./docs/novatech",
        "./data/retrieval-corpus"
      ]
    },
    "git": {
      "command": "uvx",
      "args": ["mcp-server-git", "--repository", "."]
    },
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"]
    }
  }
}
```

### Contraste com `mcp.example.json`

O exemplo de referência do starter repo configura o servidor `filesystem` com acesso a 5 diretórios raiz simultaneamente: `./src, ./specs, ./skills, ./docs, ./data`. Isso viola o princípio de menor privilégio de duas formas:

1. **Sem segmentação leitura/escrita:** o mesmo servidor que escreve código-fonte pode modificar os documentos de referência da NovaTech (`./docs/novatech`), que deveriam ser imutáveis durante o desenvolvimento.
2. **Escopo excessivo:** o desenvolvedor trabalhando em `query-endpoint` não precisa de acesso a `./src/functions/feedback/`, `./src/bot/` ou `.github/workflows/`. Conceder esse acesso amplia a superfície de mudanças acidentais.

A configuração adotada usa dois servidores filesystem com escopos separados e diretórios mínimos para a tarefa atual.

---

## 3. Evidência de Uso

Os três momentos abaixo documentam o uso dos MCP servers durante o desenvolvimento da `TASK-001`.

### 3.1 — Leitura de documento via `filesystem-ro`

Durante o entendimento do domínio, foi solicitado ao servidor `filesystem-ro` a leitura do documento de política de devolução para compreender os casos de uso do endpoint:

**Tool call:** `filesystem-ro` → `read_file("./docs/novatech/POL-001-politica-devolucao.md")`

**Resultado (trecho):**
```
# POL-001 — Política de Devolução NovaTech
Versão: 2.1 | Vigência: 01/01/2024

## §3.1 — Prazo
O prazo para solicitação de devolução é de 7 (sete) dias úteis a contar da data de entrega...

## §3.2 — Restrições
Não são aceitas devoluções de:
- Cargas classificadas como perigosas (IATA/IMDG)
- Produtos refrigerados após abertura do lacre...
```

**Uso:** informou a validação de domínio na camada de negócio do endpoint — especificamente, quais perguntas devem acionar o `source_document: "POL-001"` na resposta.

---

### 3.2 — Listagem de chunks via `filesystem-ro`

Para entender o corpus de retrieval disponível para o endpoint:

**Tool call:** `filesystem-ro` → `list_directory("./data/retrieval-corpus")`

**Resultado:**
```
POL-001-politica-devolucao/
  chunk_001.json  chunk_002.json  chunk_003.json
  chunk_004.json  chunk_005.json  chunk_006.json
PROC-042-frete-especial-v1/
  chunk_001.json ... chunk_006.json
PROC-042-v2-frete-especial-revisado/
  chunk_001.json ... chunk_007.json
SLA-2024-tabela-sla-clientes/
  chunk_001.json ... chunk_006.json
FAQ-atendimento/
  chunk_001.json ... chunk_010.json
```

**Uso:** confirmou que o endpoint deve trabalhar com 35 chunks distribuídos por 5 documentos fonte — base para definir o parâmetro `topK: 5` na integração do SearchService (TASK-003).

---

### 3.3 — Consulta ao histórico git via servidor `git`

Para entender decisões de arquitetura do starter repo:

**Tool call:** `git` → `git_log(max_count=5)`

**Resultado:**
```
bbdd03a  chore: starter repo (Anexo D) — estrutura + dados semeados dos Anexos A e B
```

**Uso:** confirmou que o repositório tem um único commit de bootstrap — não há decisões arquiteturais anteriores a considerar, portanto o handler pode ser implementado seguindo os padrões definidos no `AGENTS.md` sem conflito com escolhas existentes.

---

## 4. Análise de Riscos de Segurança

### Risco 1 — Over-permissioning do servidor filesystem

**Descrição:** O `mcp.example.json` concede acesso a `./src` inteiro. Isso expõe ao agente de IA os handlers de `feedback` e `health`, configurações de bot (`./src/bot/`) e componentes React (`./src/web/`) que não têm relação com a tarefa em desenvolvimento.

**Vetor de ataque:** um prompt de injeção embutido em um documento lido via `filesystem-ro` poderia instruir o agente a modificar arquivos fora do escopo da tarefa (`handler.ts` do feedback, `ci.yml`, `cd.yml`).

**Probabilidade:** Média. Requer que o atacante controle o conteúdo de um dos documentos lidos.

**Impacto:** Alto. Modificações em CI/CD pipeline podem introduzir backdoors ou exfiltrar segredos de ambiente.

**Mitigação adotada:** Restringir `filesystem-rw` a `./specs/query-endpoint`, `./src/functions/query` e `./src/shared`. Mudanças fora desse escopo requerem reconfigura manual do servidor.

---

### Risco 2 — Memory server sem TTL e sem namespace

**Descrição:** O `@modelcontextprotocol/server-memory` armazena pares chave-valor indefinidamente na memória do processo sem expiração automática nem separação por sessão ou usuário.

**Vetor de ataque:** um desenvolvedor que usa o agente para depurar um incidente de produção (copiando queries reais ou stack traces para o contexto) inadvertidamente persiste essas informações na memória do servidor. Em uma sessão posterior, outro desenvolvedor pode recuperar esses dados ao consultar a memória.

**Probabilidade:** Alta se o servidor memory ficar rodando entre sessões de desenvolvimento distintas.

**Impacto:** Médio. Risco de vazamento de dados sensíveis (queries de usuários reais, mensagens de erro com PII).

**Mitigação adotada:** Encerrar o processo do servidor memory ao fim de cada sessão de desenvolvimento. Para mitigação estrutural: implementar TTL de 8 h no servidor ou usar namespace por usuário (`dev:guilherme:*`).

---

## Artefato

Arquivo configurado disponível em: [`artefatos/mcp.json`](../artefatos/mcp.json)
