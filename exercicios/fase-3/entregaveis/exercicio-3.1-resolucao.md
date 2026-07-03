# Exercicio 3.1 - Structured Output e Verificacoes Deterministicas

**Autor:** Guilherme Nascimento  
**Papel:** Desenvolvedor  
**Cenario:** 3 - Governanca e Validacao  
**Data:** 03/07/2026

---

## Objetivo

Implementar uma camada deterministica de validacao para respostas do modelo, separando:

- **Prompt (probabilistico):** tenta induzir comportamento correto.
- **Codigo (deterministico):** bloqueia respostas fora de contrato.

A implementacao cobre:

1. Structured output com Zod.
2. Guardrail de `source_document` obrigatorio.
3. Guardrail para bloquear respostas que permitam devolucao de carga perigosa.

---

## 1. Structured Output (Zod)

Schema implementado em [exercicios/fase-3/artefatos/response-validator.ts](../artefatos/response-validator.ts):

```typescript
export const StructuredAnswerSchema = z
  .object({
    answer: z.string().min(1),
    source_document: z.string().min(1),
    confidence_score: z.number().min(0).max(1),
  })
  .strict();
```

**Decisao tecnica:** uso de `.strict()` para rejeitar campos extras nao previstos no contrato.

---

## 2. Guardrails Deterministicos no response-validator

Arquivo completo: [exercicios/fase-3/artefatos/response-validator.ts](../artefatos/response-validator.ts)

### Guardrail 1 - source_document obrigatorio

- Se o parsing falhar, bloqueia (`SCHEMA_INVALID`) e retorna resposta segura.
- Se `source_document` vier vazio, bloqueia (`MISSING_SOURCE`) e retorna resposta segura.

### Guardrail 2 - carga perigosa + devolucao nao pode ser afirmativo

Regra implementada:

- Detecta mencao simultanea de `carga perigosa` e `devol...`.
- Se detectar linguagem permissiva (`pode`, `permitido`, `possivel`, `autorizado`) para devolucao nesse contexto, bloqueia (`DANGEROUS_RETURN_ALLOWED`).

### Tratamento de falha

Qualquer bloqueio:

- registra log estruturado com `requestId` e motivo;
- substitui a resposta por mensagem segura (`HITL_REQUIRED`), forçando revisao humana.

---

## 3. Code Review (Claude sobre codigo inicial do Copilot)

### Problema 1 - Schema permissivo sem strict

**Risco:** aceitar payload com campos inesperados mascarando defeitos de integracao.

**Correcao aplicada:** adicao de `.strict()` no schema.

### Problema 2 - Regex fraca para guardrail de carga perigosa

**Risco:** variacoes de texto passavam sem bloqueio (ex: "podem devolver" ou "autorizado devolver").

**Correcao aplicada:** conjunto de patterns permissivos cobrindo variacoes comuns.

### Problema 3 - Falha sem fallback padrao

**Risco:** guardrail apenas logava, mas resposta insegura seguia para o cliente.

**Correcao aplicada:** retorno deterministico de `SAFE_RESPONSE` em qualquer violacao.

---

## 4. Evidencia de requisitos de avaliacao

| Criterio | Evidencia |
|---|---|
| Schema valido em Zod | `StructuredAnswerSchema` com 3 campos obrigatorios e range de confianca |
| Guardrails bloqueiam de fato | retorno `ok: false` + `SAFE_RESPONSE` |
| Review com problemas reais | 3 problemas tecnicos concretos com correcoes |
| Prompt vs codigo | secao de objetivo e separacao explicita probabilistico x deterministico |

---

## 5. Observacao operacional

Para submissao formal da trilha, anexar evidencias de uso real das ferramentas (captura do chat/iteracoes com Copilot e Claude) junto deste documento.
