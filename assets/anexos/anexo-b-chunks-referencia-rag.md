# Anexo B – Chunks de Referência e Gabarito de Retrieval

Este arquivo define os chunks esperados por pergunta do pipeline de RAG, servindo como gabarito para avaliar a qualidade do retrieval.

---

## Chunks por Documento

### POL-001 — Política de Devolução

**POL-001-A** (Prazo geral)
```
[Fonte: POL-001-politica-devolucao | Versão: 3.1 | Data: 15/01/2024 | Seção: 3.1 Prazo geral]

O prazo para solicitação de devolução é de 7 (sete) dias úteis contados a partir
da data de recebimento confirmada no sistema de tracking. A solicitação deve ser
registrada no Portal do Cliente com número do pedido e nota fiscal.
```

**POL-001-B** (Exceções — cargas perigosas)
```
[Fonte: POL-001-politica-devolucao | Versão: 3.1 | Data: 15/01/2024 | Seção: 3.2 Exceções ao prazo geral]

NÃO são elegíveis para devolução pelo processo padrão:
- Cargas perigosas (classes 1 a 6 da ANTT)
- Cargas refrigeradas com cadeia de frio rompida
- Cargas com lacre violado ou sinais de adulteração

Para essas situações, o atendente deve acionar a Gestão de Riscos (ramal 4500)
para análise e tratamento individualizado.
```

---

### PROC-042 v1 — Frete Especial (versão antiga, obsoleta)

**PROC-042-A** (Fórmula v1)
```
[Fonte: PROC-042-frete-especial-v1 | Versão: 1.0 | Data: 10/03/2023 | Seção: 2 Fórmula de cálculo]

Frete especial aplica-se a cargas acima de 500kg.
Fórmula: Valor base × Multiplicador regional × Fator de peso

Fatores de peso:
- 500kg a 1.000kg: 1.0
- 1.001kg a 3.000kg: 1.15
- Acima de 3.000kg: sob cotação
```

**PROC-042-B** (Multiplicadores regionais v1 — OBSOLETO)
```
[Fonte: PROC-042-frete-especial-v1 | Versão: 1.0 | Data: 10/03/2023 | Seção: 2.1 Multiplicadores regionais]

⚠️ ATENÇÃO: Esta é a versão 1.0, substituída pela v2 em novembro/2023.

Multiplicadores regionais (v1.0):
| Região        | Multiplicador |
|---------------|--------------|
| Sul           | 1.0          |
| Sudeste       | 1.0          |
| Centro-Oeste  | 1.2          |
| Nordeste      | 1.3          |
| Norte         | 1.6          |
```

---

### PROC-042 v2 — Frete Especial (versão atual, vigente)

**PROC-042v2-A** (Fórmula v2)
```
[Fonte: PROC-042-v2-frete-especial-revisado | Versão: 2.0 | Data: 10/11/2023 | Seção: 2 Fórmula de cálculo]

Frete especial aplica-se a cargas acima de 500kg.
Fórmula: Valor base × Multiplicador regional × Fator de peso

Fatores de peso:
- 500kg a 1.000kg: 1.0
- 1.001kg a 3.000kg: 1.15
- Acima de 3.000kg: sob cotação

Nota: Esta versão substitui o PROC-042 v1.0 de março/2023 integralmente.
```

**PROC-042v2-B** (Multiplicadores regionais v2 — VIGENTE)
```
[Fonte: PROC-042-v2-frete-especial-revisado | Versão: 2.0 | Data: 10/11/2023 | Seção: 2.1 Multiplicadores regionais]

Multiplicadores regionais (v2.0 — vigente desde dezembro/2023):
| Região        | Multiplicador |
|---------------|--------------|
| Sul           | 1.0          |
| Sudeste       | 1.0          |
| Centro-Oeste  | 1.2          |
| Nordeste      | 1.4          |
| Norte         | 1.8          |

Alterações em relação à v1: Norte (1.6 → 1.8), Nordeste (1.3 → 1.4).
```

---

### SLA-2024 — Tabela de SLA por Tier

**SLA-2024-A** (Classificação de clientes)
```
[Fonte: SLA-2024-tabela-sla-clientes | Versão: 2024.1 | Data: 02/01/2024 | Seção: 1 Classificação de clientes]

A NovaTech classifica seus clientes em exatamente 3 (três) tiers:
- Gold: contratos acima de R$ 500.000/ano
- Silver: contratos entre R$ 100.000 e R$ 500.000/ano
- Standard: contratos abaixo de R$ 100.000/ano

Não existem outros tiers (Platinum, Diamond, Premium, etc.).
```

**SLA-2024-B** (Tabela de SLAs)
```
[Fonte: SLA-2024-tabela-sla-clientes | Versão: 2024.1 | Data: 02/01/2024 | Seção: 2 Tabela de SLAs por tier]

| Tier     | 1ª Resposta | Resolução (geral) | Resolução (crítico) |
|----------|------------|------------------|---------------------|
| Gold     | 2h úteis   | 24h úteis        | 4h corridas         |
| Silver   | 4h úteis   | 48h úteis        | 8h corridas         |
| Standard | 8h úteis   | 72h úteis        | 24h corridas        |

"Crítico" = incidente que impacta toda a operação do cliente.
```

---

### FAQ-atendimento — Perguntas Frequentes (fonte informal, não validada)

**FAQ-01** (Prazo de devolução — informal)
```
[Fonte: FAQ-atendimento | Versão: sem versão | Data: sem data | Seção: Item 1]

P: Qual o prazo para pedir devolução?
R: São 7 dias úteis após a entrega. Se o sistema de tracking não confirmou a entrega,
   conta a partir da data da nota fiscal.
```

**FAQ-03** (Carga perigosa — informal)
```
[Fonte: FAQ-atendimento | Versão: sem versão | Data: sem data | Seção: Item 3]

P: E se o cliente quiser devolver carga perigosa?
R: Carga perigosa não entra no processo padrão de devolução. Aciona o ramal 4500
   (Gestão de Riscos). Em casos excepcionais eles podem autorizar, mas não é garantido.
```

**FAQ-15** (Tier Platinum — informal)
```
[Fonte: FAQ-atendimento | Versão: sem versão | Data: sem data | Seção: Item 15]

P: O cliente perguntou sobre SLA Platinum, o que respondo?
R: Não existe Platinum aqui. Temos Gold, Silver e Standard. Provavelmente o cliente
   está confundindo com outro fornecedor ou com uma conversa de negociação que não
   virou contrato.
```

**FAQ-41** (SLA — diferença de conceitos)
```
[Fonte: FAQ-atendimento | Versão: sem versão | Data: sem data | Seção: Item 41]

P: Qual a diferença entre SLA de resposta e SLA de resolução?
R: Resposta = tempo até o primeiro contato de um atendente. Resolução = tempo até o
   problema estar resolvido de fato. Chamado crítico tem SLA próprio, menor que o geral.
```

---

## Gabarito de Retrieval — 6 Perguntas de Teste

| ID | Pergunta | Chunks esperados | Armadilha |
|----|---------|-----------------|-----------|
| P1 | Qual o prazo de devolução de mercadorias? | POL-001-A, POL-001-B | Não deve dizer que carga perigosa tem 7 dias |
| P2 | Posso devolver carga perigosa? Qual o procedimento? | POL-001-B, FAQ-03 | Inversão: dizer que pode devolver é erro crítico |
| P3 | Qual o SLA do cliente Gold para resolução de chamados? | SLA-2024-B | Não deve inventar SLA de tier inexistente |
| P4 | Qual o SLA do cliente Platinum? | SLA-2024-A | Inventar SLA para Platinum = alucinação pura |
| P5 | Quanto custa o frete especial para 600kg com destino a Manaus? | PROC-042v2-A, PROC-042v2-B | Usar multiplicador da v1 (1.6) sem declarar contradição |
| P6 | Qual o valor do frete para 300kg com destino a Salvador? | (nenhum) | Inventar valor de frete padrão inexistente nos documentos |

### Observações críticas

**P4 — Tier Platinum:** O chunk SLA-2024-A afirma explicitamente que NÃO existem outros tiers além de Gold/Silver/Standard. O pipeline deve recuperar esse chunk e o LLM deve responder com a negação, não com valores inventados.

**P5 — Conflito v1 vs v2:** É esperado que ambas as versões do PROC-042 sejam recuperadas (scores próximos). O system prompt v2 (REGRA 3) instrui o LLM a declarar a contradição e usar a versão mais recente. A resposta correta inclui o aviso de contradição.

**P6 — Frete padrão < 500kg:** Não existe documentação formal para esse caso. O pipeline recuperará chunks do PROC-042 por proximidade semântica, mas com scores altos (baixa similaridade). O LLM deve aplicar a REGRA 4 (ausência de resposta) e não inventar valores.
