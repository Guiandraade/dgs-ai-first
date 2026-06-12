# Exercício 2.3 — Skills: Estratégia e Criação de SKILL.md

**Autor:** Guilherme Nascimento
**Papel:** Desenvolvedor
**Cenário:** 2 — NovaTech Assistant (TypeScript)
**Data:** 12/06/2026

---

## Objetivo

Mapear a skill tree do projeto `novatech-assistant` em três níveis hierárquicos (Foundation → Domain → Artifact), justificar as dependências entre skills e criar o `SKILL.md` completo para a skill de `error-handling` no nível Foundation.

---

## 1. Skill Tree — 10 Skills, 3 Níveis

```
Foundation (pré-requisitos agnósticos de framework)
├── typescript-conventions
├── project-structure
└── error-handling                ← SKILL.md criado neste exercício

        ↓ depende de Foundation

Domain (padrões específicos do stack NovaTech)
├── azure-functions-endpoint      (depende de: typescript-conventions, error-handling)
├── azure-ai-search-integration   (depende de: typescript-conventions, project-structure)
├── testing-patterns              (depende de: typescript-conventions, error-handling)
└── react-components              (depende de: typescript-conventions, project-structure)

        ↓ depende de Domain

Artifact (receitas completas, composição de múltiplas skills)
├── create-rag-endpoint           (depende de: azure-functions-endpoint, azure-ai-search-integration, error-handling)
├── create-integration-test       (depende de: testing-patterns, azure-functions-endpoint)
└── create-react-card             (depende de: react-components, azure-ai-search-integration)
```

### Diagrama de dependências

| Skill | Nível | Depende de |
|---|---|---|
| `typescript-conventions` | Foundation | — |
| `project-structure` | Foundation | — |
| `error-handling` | Foundation | — |
| `azure-functions-endpoint` | Domain | `typescript-conventions`, `error-handling` |
| `azure-ai-search-integration` | Domain | `typescript-conventions`, `project-structure` |
| `testing-patterns` | Domain | `typescript-conventions`, `error-handling` |
| `react-components` | Domain | `typescript-conventions`, `project-structure` |
| `create-rag-endpoint` | Artifact | `azure-functions-endpoint`, `azure-ai-search-integration`, `error-handling` |
| `create-integration-test` | Artifact | `testing-patterns`, `azure-functions-endpoint` |
| `create-react-card` | Artifact | `react-components`, `azure-ai-search-integration` |

### Justificativa da hierarquia

**Foundation** agrupa conhecimento pré-requisito que qualquer colaborador precisa dominar antes de tocar código. São agnósticos de framework: `error-handling` se aplica a qualquer módulo TypeScript, não apenas Azure Functions.

**Domain** codifica padrões do stack escolhido para o projeto. `azure-functions-endpoint` só faz sentido após dominar `error-handling` (pois todo handler usa AppError) e `typescript-conventions` (pois o handler usa tipos estritos).

**Artifact** são receitas completas que um agente de IA pode seguir para gerar um entregável funcional do zero. `create-rag-endpoint` compõe `azure-functions-endpoint` + `azure-ai-search-integration` + `error-handling` — as três skills devem estar carregadas no contexto para o agente não omitir tratamento de erro ao conectar o search service.

---

## 2. SKILL.md — `error-handling` (Foundation)

O arquivo completo está em [`artefatos/skill-error-handling.md`](../artefatos/skill-error-handling.md).

### Por que `error-handling` é Foundation e não Domain?

`error-handling` é Foundation porque:
- Aplica-se a **qualquer módulo** TypeScript do projeto (handlers, services, pipeline, bot, web)
- Não depende do Azure Functions SDK — `AppError` e as regras de logging são válidas em workers, funções utilitárias e scripts
- Qualquer skill de Domain que envolva I/O externo (Azure Search, Cosmos DB, Teams) depende de saber como tratar erros desses serviços

Seria Domain se o padrão fosse específico de uma tecnologia (ex: "como fazer retry com `@azure/core-rest-pipeline`"). Como é agnóstico, é Foundation.

### Estrutura do SKILL.md criado

```
# SKILL: error-handling
Nível: Foundation | Versão: 1.0

## Contexto
  Quando usar AppError vs Error nativo
  Por que não console.log em Azure Functions

## Regras (5 regras prescritivas)
  1. Código em SCREAMING_SNAKE_CASE
  2. Nunca capturar erro só para relançar sem contexto
  3. Nunca usar console.log em handlers ou services
  4. Erros não tratados retornam 500, sem vazar detalhes
  5. Incluir requestId em todo log de operação de negócio

## DO / DON'T (3 pares com código TypeScript real)
  Par 1: Criando erros operacionais (AppError vs Error nativo)
  Par 2: Tratando erros em handlers (bifurcação correta)
  Par 3: Logging com contexto (structured vs console.log)

## Anti-patterns (2)
  1. Error swallowing silencioso (catch vazio)
  2. Códigos de erro sem contrato (strings livres vs SCREAMING_SNAKE_CASE)
```

### Trecho exemplar do SKILL.md

```typescript
// ✅ DO — bifurca AppError de erros inesperados, não vaza detalhes internos
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

---

## 3. Como o Agente de IA Usa as Skills

O SKILL.md de `error-handling` é carregado pelo agente via `filesystem-rw` antes de implementar qualquer handler ou service. A sequência típica de carregamento para implementar `create-rag-endpoint`:

```
1. Carregar Foundation:  typescript-conventions + error-handling
2. Carregar Domain:      azure-functions-endpoint + azure-ai-search-integration
3. Carregar Artifact:    create-rag-endpoint
```

Com `error-handling` carregado, o agente sabe:
- Criar `AppError('SEARCH_FAILED', ..., 502)` ao envolver o SearchService
- Não usar `console.log` em nenhuma linha gerada
- Incluir `requestId` em todos os logs
- Não vazar stack traces na resposta HTTP

Sem a skill carregada, o agente tende a gerar `console.log(error)` e retornar `error.message` diretamente ao cliente — padrão correto em Node.js genérico, mas inadequado para Azure Functions em produção.

---

## Artefatos

| Arquivo | Descrição |
|---|---|
| [`artefatos/skill-error-handling.md`](../artefatos/skill-error-handling.md) | SKILL.md completo para `error-handling` (Foundation) |
