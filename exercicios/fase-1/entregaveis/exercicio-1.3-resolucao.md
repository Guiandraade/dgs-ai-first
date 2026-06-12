# Exercício 1.3 – Pipeline de RAG: Análise e Resultados

**Papel:** Desenvolvedor  
**Código:** `rag/` na raiz do repositório  
**Ferramentas:** Claude (chat) + GitHub Copilot  
**Data:** 2026-06-05

---

## Ferramentas Utilizadas no Desenvolvimento

### GitHub Copilot

O GitHub Copilot foi utilizado como assistente de código durante o desenvolvimento do pipeline. O fluxo típico: escrever um comentário descrevendo a intenção → Copilot sugere a implementação → revisar e ajustar conforme necessário.

**Exemplo documentado — sugestão de função de verificação de re-ingestão:**

A partir do comentário:
```python
# função para verificar se um documento já foi ingerido antes de re-processar
```

O Copilot sugeriu automaticamente a assinatura:
```python
def is_already_ingested(source: str, client: chromadb.PersistentClient) -> bool
```

![Copilot sugerindo função is_already_ingested em ingest.py](../../assets/copilot-sugestao-ingest.png)

A sugestão foi avaliada e descartada para o PoC (a coleção é recriada a cada ingestão, tornando a verificação desnecessária nesta etapa). O Copilot foi mais útil nas partes de boilerplate — como a estrutura do loop de ingestão, o `col.add()` com todos os campos necessários, e o parsing dos metadados do breadcrumb.

### Claude (chat)

Utilizado para duas finalidades neste exercício:
1. **Apoio ao desenvolvimento** — discussão de estratégias de chunking e trade-offs entre abordagens.
2. **Avaliação das respostas** — os 6 prompts gerados pelo pipeline foram colados no Claude chat e as respostas avaliadas quanto à corretude, citação de fonte e respeito aos guardrails.

---

## Estratégia de Chunking Adotada

O chunking é feito **por tipo de documento**, não por número fixo de tokens.

**Por que não chunking fixo de N tokens?**
Chunking fixo corta seções semânticas ao meio. A tabela de multiplicadores regionais do PROC-042 tem ~150 tokens — se o limite for 512 tokens, ela vai ser agrupada com outros blocos não relacionados. A query "multiplicador para o Norte" vai recuperar um chunk que mistura fórmula + tabela + condições especiais, e a similaridade é diluída.

| Documento | Estratégia | Por quê |
|-----------|-----------|---------|
| POL-001 | Por subseção `###` | Cada subseção é uma regra independente — 3.1 (prazo geral) e 3.2 (exceções) são conceitos opostos que não devem estar no mesmo chunk |
| PROC-042 v1/v2 | Por bloco lógico `##`/`###` | A tabela de multiplicadores deve ser recuperada inteira — separar linha por linha destrói o contexto |
| SLA-2024 | Por bloco lógico | Tabela cortada no meio perde o SLA de resolução de um tier |
| FAQ | Por item `## Item N` | Cada Q&A é semânticamente independente — agrupar itens mistura tópicos díspares |

**Breadcrumb de contexto:** Cada chunk começa com `[Fonte: NOME | Versão: X | Data: DD/MM/AAAA | Seção: ...]`. Isso garante:
- Rastreabilidade mesmo quando o chunk é lido isoladamente pelo LLM.
- Que o LLM identifique qual versão originou a informação (crítico para resolver conflito PROC-042 v1 vs v2).
- Que o system prompt consiga aplicar a regra "use o mais recente".

**Resultado da ingestão (execução real — `python ingest.py`):**
```
FAQ-atendimento.md: 10 chunks
POL-001-politica-devolucao.md: 6 chunks
PROC-042-frete-especial-v1.md: 6 chunks
PROC-042-v2-frete-especial-revisado.md: 7 chunks
SLA-2024-tabela-sla-clientes.md: 6 chunks
Total: 35 chunks
```

---

## Resultados dos Testes (6 Perguntas do Gabarito)

> Scores reais obtidos rodando `python run_tests.py` com ChromaDB populado.
> Métrica: distância cosseno — **menor valor = mais similar**. Próximo de 0 = alta relevância.
> Os top 3 chunks de cada query são os enviados ao Claude via `prompt_builder.build()`.

---

### P1 — "Qual o prazo de devolução de mercadorias?"

**Top 5 chunks recuperados (scores reais):**

| Rank | Score | Fonte | Seção |
|------|-------|-------|-------|
| 1 | 0.7228 | POL-001-politica-devolucao | ### 3.3. Procedimento de devolução |
| 2 | 0.8414 | FAQ-atendimento | ## Item 3 – carga perigosa |
| 3 | 0.8699 | POL-001-politica-devolucao | ### 3.5. Custos de devolução |
| 4 | 0.8930 | POL-001-politica-devolucao | ### 3.1. Prazo geral |
| 5 | 0.9457 | FAQ-atendimento | ## Item 22 – seguro de carga |

**Resultado run_tests:** ✅ Fonte esperada recuperada (POL-001 presente)

**Top 3 enviados ao Claude:** seção 3.3 (procedimento), FAQ Item 3 (carga perigosa), seção 3.5 (custos)

**Observação:** A seção 3.1 — que contém o prazo de 7 dias úteis, a resposta direta à pergunta — ficou em 4º lugar e não foi incluída no prompt. A seção 3.2 (exceções para cargas perigosas) não apareceu entre os 5. O modelo priorizou "procedimento de devolução" sobre "prazo geral" para a query "prazo de devolução".

**Resposta do Claude (real — colado de `p1_prompt.txt`):**

> O prazo para solicitação de devolução é de **7 dias úteis** a partir do recebimento da mercadoria.
>
> **Detalhes relevantes**
> Solicitações realizadas após esse prazo são consideradas não elegíveis para o processo de devolução padrão. Nesses casos, o atendente deve encaminhar ao setor Comercial para negociação individual.
> Dentro do prazo, o fluxo segue as seguintes etapas após abertura do chamado:
> - Triagem pelo time de atendimento: até 4 horas úteis
> - Agendamento da coleta reversa (se aprovado): até 2 dias úteis
> - Processamento do reembolso ou crédito: até 5 dias úteis após recebimento da mercadoria no CD
>
> **Fonte**
> Conforme POL-001-politica-devolucao | Versão 3.1 | Data: 15/01/2024 | Seção 3.5 (prazo de elegibilidade) e Seção 3.3 (procedimento e prazos internos).
>
> **Ação recomendada**
> Ao atender o cliente, verifique a data de recebimento da mercadoria antes de iniciar qualquer procedimento. Se o prazo de 7 dias úteis já tiver sido ultrapassado, não abra chamado de devolução padrão — transfira diretamente ao Comercial informando a situação.

**Avaliação da resposta:** Resposta correta. O Claude citou a fonte com versão, data e seções específicas (3.5 + 3.3). Respeitou o guardrail de "não inventar dados". Notavelmente, a seção 3.1 (prazo geral) não estava no top 3 enviado, mas o Claude conseguiu extrair o prazo de 7 dias da seção 3.3 (procedimento), que mencionava o prazo como pré-condição do fluxo. O chunk de seção 3.5 (custos, em 3º lugar) foi ignorado corretamente — o Claude focou no conteúdo mais relevante para a pergunta.

---

### P2 — "Posso devolver carga perigosa? Qual o procedimento?"

**Top 5 chunks recuperados (scores reais):**

| Rank | Score | Fonte | Seção |
|------|-------|-------|-------|
| 1 | 0.6303 | FAQ-atendimento | ## Item 3 – devolução de carga perigosa |
| 2 | 0.6889 | FAQ-atendimento | ## Item 22 – seguro de carga |
| 3 | 0.7584 | FAQ-atendimento | ## Item 38 – política para carga especial |
| 4 | 0.8270 | PROC-042-frete-especial-v1 | ## 4. Condições especiais |
| 5 | 0.8694 | POL-001-politica-devolucao | ### 3.5. Custos de devolução |

**Resultado run_tests:** ✅ Fonte esperada recuperada (POL-001 presente na posição 5)

**Top 3 enviados ao Claude:** FAQ Item 3, FAQ Item 22 (seguro — irrelevante), FAQ Item 38

**Problema crítico identificado:** A seção 3.2 do POL-001 — que contém a proibição explícita para cargas das classes 1-6 da ANTT — **não apareceu nos top 5**. Os 3 chunks enviados ao Claude são todos do FAQ (fonte informal). Se o FAQ Item 3 tivesse uma orientação incorreta, Claude responderia com base apenas em fonte não-validada. O FAQ Item 22 (sobre seguro de carga) é completamente irrelevante para a query.

**Resposta do Claude (real — colado de `p2_prompt.txt`):**

> A devolução de carga perigosa não é permitida pelo processo padrão, mas pode ser viabilizada mediante tratamento especial pela equipe de Gestão de Riscos.
>
> **Detalhes relevantes**
> O procedimento indicado é orientar o cliente a entrar em contato diretamente pelo ramal 4500 (Gestão de Riscos). Não afirme ao cliente que a devolução é impossível — informe que o caso requer análise especializada e pode ser autorizado como exceção. Atenção: não há documento formal de política que regulamente esse fluxo nos registros recuperados. A orientação acima é de origem informal.
>
> **Fonte**
> Segundo o FAQ interno (não validado formalmente) | Versão: Não controlada | Seção: Item 3 — devolução de carga perigosa.
>
> **Ação recomendada**
> Transfira o cliente para o ramal 4500 (Gestão de Riscos) e registre o contato no sistema. Recomenda-se também consultar o setor Comercial ou a área jurídica caso haja dúvida sobre responsabilidades, uma vez que não existe política formal documentada para esse cenário na base de conhecimento disponível.

**Avaliação da resposta:** Este é o caso de falha crítica de retrieval confirmada em produção. O Claude sinaliza corretamente que está baseando a resposta em FAQ informal — mas o guardrail não impediu que a resposta sugerisse que a devolução "pode ser viabilizada como exceção". A POL-001 seção 3.2 proíbe explicitamente a devolução de cargas perigosas via processo NovaTech, sem exceção de "análise especializada". Essa resposta enganosa é consequência direta do Problema 2 identificado (FAQ domina o retrieval para queries sobre políticas formais) — a seção 3.2 do POL-001 não apareceu nos top 5.

---

### P3 — "Qual o SLA do cliente Gold para resolução de chamados?"

**Top 5 chunks recuperados (scores reais):**

| Rank | Score | Fonte | Seção |
|------|-------|-------|-------|
| 1 | 0.5285 | SLA-2024-tabela-sla-clientes | ## 5. Medição e reportes |
| 2 | 0.5996 | FAQ-atendimento | ## Item 41 – diferença SLA resposta vs. resolução |
| 3 | 0.7748 | FAQ-atendimento | ## Item 27 – tracking "em trânsito" há 5 dias |
| 4 | 0.8297 | SLA-2024-tabela-sla-clientes | ## 4. Penalidades por descumprimento |
| 5 | 0.8343 | FAQ-atendimento | ## Item 15 – tier Platinum não existe |

**Resultado run_tests:** ✅ Fonte esperada recuperada (SLA-2024 presente nas posições 1 e 4)

**Top 3 enviados ao Claude:** SLA seção 5 (medição), FAQ Item 41 (conceito de SLA), FAQ Item 27 (tracking — irrelevante)

**Problema crítico identificado:** A seção 2 do SLA-2024 — que contém a tabela com os valores reais (Gold: 2h resposta / 24h resolução) — **não apareceu nos top 5**. Claude vai receber a seção de medição e relatórios (seção 5), sem os valores concretos por tier. FAQ Item 27 sobre tracking é completamente fora de escopo.

**Resposta do Claude (real — colado de `p3_prompt.txt`):**

> O SLA de resolução para clientes Gold é de **24 horas**, com SLA de resposta de **2 horas**.
>
> **Detalhes relevantes**
> Um ponto crítico: para incidentes críticos de clientes Gold, o relógio de SLA não pausa fora do horário comercial — ou seja, corre de forma contínua, inclusive fora do período das 08h–18h em dias úteis. Para os demais tipos de chamado, o relógio pausa fora do horário comercial. O FAQ também menciona que para incidentes críticos os prazos são menores do que os padrões citados, com referência à tabela SLA-2024 — porém os valores específicos para esse cenário não constam nos trechos recuperados.
>
> **Fontes**
> Segundo o FAQ interno (não validado formalmente) | Versão: Não controlada | Seção: Item 41 — diferença entre SLA de resposta e resolução.
> Conforme SLA-2024-tabela-sla-clientes | Versão: 2024.1 | Seção 5 — medição e comportamento do relógio de SLA para clientes Gold.
>
> **Ação recomendada**
> Confirme os valores na tabela completa SLA-2024-tabela-sla-clientes antes de comunicar prazos ao cliente, especialmente em casos de incidente crítico, pois os valores informados pelo FAQ são de fonte não controlada e podem estar desatualizados.

**Avaliação da resposta:** Os valores (2h resposta / 24h resolução) estão corretos, mas o Claude chegou neles pelo FAQ Item 41, não pela tabela SLA (seção 2) — que nunca foi recuperada. O modelo produziu a resposta certa pela razão errada: um FAQ informal com dados coincidentemente corretos. O Claude reconheceu a limitação ao recomendar "confirme na tabela completa antes de comunicar" — demonstrando que o guardrail de fonte informal funcionou. Porém em produção com dados divergentes, o resultado seria alucinação confiante.

---

### P4 — "Qual o SLA do cliente Platinum?" (teste de alucinação)

**Top 5 chunks recuperados (scores reais):**

| Rank | Score | Fonte | Seção |
|------|-------|-------|-------|
| 1 | 0.7492 | FAQ-atendimento | ## Item 15 – "Cliente diz que é Platinum. Existe esse tier?" |
| 2 | 0.8166 | SLA-2024-tabela-sla-clientes | ## 5. Medição e reportes |
| 3 | 0.8252 | SLA-2024-tabela-sla-clientes | bloco-0 (cabeçalho do documento) |
| 4 | 0.8569 | SLA-2024-tabela-sla-clientes | ## 1. Classificação de clientes |
| 5 | 0.9344 | SLA-2024-tabela-sla-clientes | ## 3. Definição de incidente crítico |

**Resultado run_tests:** ✅ Fonte esperada recuperada

**Top 3 enviados ao Claude:** FAQ Item 15 (Platinum não existe), SLA seção 5, SLA cabeçalho

**Avaliação:** Melhor resultado entre todas as queries. O FAQ Item 15 trata exatamente de "cliente diz que é Platinum" e ficou em 1º lugar. Esse chunk é suficiente para bloquear a alucinação — contém explicitamente a resposta de que o tier não existe. A seção 1 (classificação com os 3 tiers) ficou em 4º, fora do top 3, mas o FAQ Item 15 supre essa ausência.

**Resposta do Claude (real — colado de `p4_prompt.txt`):**

> Não existe o tier Platinum na NovaTech. Portanto, não há SLA definido para essa categoria.
>
> **Detalhes relevantes**
> Os tiers ativos na NovaTech são exclusivamente Gold, Silver e Standard. Caso o cliente afirme ser Platinum, as causas mais prováveis são: confusão com outra transportadora; referência ao programa de fidelidade antigo, descontinuado em 2022. O documento formal SLA-2024 não registra qualquer menção ao tier Platinum, confirmando que ele não integra a estrutura contratual vigente.
>
> **Fontes**
> Segundo o FAQ interno (não validado formalmente) | Versão: Não controlada | Seção: Item 15 — tier Platinum inexistente.
> Conforme SLA-2024-tabela-sla-clientes | Versão: 2024.1 | Data: 02/01/2024 — documento contratual que lista os tiers formais sem qualquer menção a Platinum.
>
> **Ação recomendada**
> Solicite ao cliente o número do contrato e consulte o cadastro para identificar o tier correto. Se houver divergência entre o que o cliente alega e o que consta no sistema, escale para o setor Comercial para verificação e alinhamento com o cliente.

**Avaliação da resposta:** Melhor resultado entre todos os testes. O Claude bloqueou corretamente a alucinação, não inventou SLA para Platinum, e forneceu contexto adicional útil (tiers existentes, causa provável da confusão). O FAQ Item 15 — que ficou em 1º no retrieval — foi suficiente para isso. A menção ao "programa descontinuado em 2022" vem provavelmente do treinamento do modelo (não está nos documentos), mas não prejudica a resposta neste caso.

---

### P5 — "Quanto custa o frete especial para 600kg para Manaus?" (conflito v1 vs v2)

**Top 5 chunks recuperados (scores reais):**

| Rank | Score | Fonte | Seção |
|------|-------|-------|-------|
| 1 | 0.8204 | PROC-042-frete-especial-v1 | ## 1. Objetivo |
| 2 | 0.8526 | PROC-042-v2-frete-especial-revisado | ## 1. Objetivo |
| 3 | 0.8532 | PROC-042-frete-especial-v1 | ## 4. Condições especiais |
| 4 | 0.8726 | PROC-042-frete-especial-v1 | ## 3. Prazo de entrega para frete especial |
| 5 | 0.8976 | FAQ-atendimento | ## Item 38 – política para carga especial |

**Resultado run_tests:** ✅ Fonte esperada recuperada (PROC-042-v2 presente na posição 2)

**Top 3 enviados ao Claude:** PROC-042-v1/objetivo, PROC-042-v2/objetivo, PROC-042-v1/condições especiais

**Problema duplo identificado:** A seção com a tabela de multiplicadores regionais (onde está Norte = 1.8) **não apareceu nos top 5**. As seções de "Objetivo" de ambas as versões foram mais próximas semanticamente da query do que a tabela de valores. Claude vai receber dois chunks dizendo "este procedimento define o frete especial acima de 500kg" — sem nenhum multiplicador concreto para calcular. A query sobre custo não retornou os valores necessários para responder a query.

**Resposta do Claude (real — colado de `p5_prompt.txt`):**

> Não é possível calcular o valor do frete especial para 600 kg com destino a Manaus, pois a fórmula e os multiplicadores regionais vigentes não constam nos trechos recuperados.
>
> **Detalhes relevantes**
> Há contradição por sobreposição de versões na base documental:
>
> | Documento | Versão | Data |
> |-----------|--------|------|
> | PROC-042-frete-especial-v1 | 1.0 | 03/03/2023 |
> | PROC-042-v2-frete-especial-revisado | 2.0 | 10/11/2023 |
>
> Conforme a regra de documentos contraditórios, o documento vigente é o PROC-042 v2.0 (novembro/2023), que explicita que os multiplicadores foram revisados por região. Os parâmetros da versão 1.0 estão desatualizados e não devem ser utilizados. Também é necessário verificar previamente se a carga é perigosa: se for, o cálculo segue o PROC-043 (Frete de Cargas Perigosas), não o PROC-042.
>
> **Fontes**
> Conforme PROC-042-v2-frete-especial-revisado | Versão 2.0 | Seção 1 — documento vigente com multiplicadores atualizados.
> Conforme PROC-042-frete-especial-v1 | Versão 1.0 | Seção 4 — referência ao PROC-043 para cargas perigosas.
>
> **Ação recomendada**
> Acesse o documento completo PROC-042 v2.0 para obter a fórmula e os multiplicadores regionais atualizados. Caso não tenha acesso, encaminhe ao setor de Operações ou Comercial com as informações: peso (600 kg), destino (Manaus/AM) e natureza da carga.

**Avaliação da resposta:** O Claude aplicou corretamente o guardrail de "nunca invente valores" — reconheceu que os multiplicadores não estavam nos chunks e recusou inventar. Também aplicou corretamente a regra de contradição entre versões, priorizando a v2 pela data mais recente. A resposta é honesta e segura, mas **não responde a pergunta do atendente** — a tabela de multiplicadores regionais (Norte = 1.8 na v2) ficou fora dos top 5 no retrieval (Problema 3). O sistema produziu uma recusa razoável em vez de uma alucinação, o que é melhor — mas o objetivo era fornecer o cálculo.

---

### P6 — "Qual o valor do frete para 300kg para Salvador?" (sem cobertura documental)

**Top 5 chunks recuperados (scores reais):**

| Rank | Score | Fonte | Seção |
|------|-------|-------|-------|
| 1 | 0.9425 | FAQ-atendimento | ## Item 27 – tracking "em trânsito" |
| 2 | 0.9437 | FAQ-atendimento | ## Item 38 – política para carga especial |
| 3 | 0.9502 | PROC-042-frete-especial-v1 | ## 1. Objetivo |
| 4 | 0.9527 | SLA-2024-tabela-sla-clientes | ## 1. Classificação de clientes |
| 5 | 0.9795 | PROC-042-frete-especial-v1 | ## 4. Condições especiais |

**Resultado run_tests:** ✅ OK — min_score = 0.9425 > threshold 0.5 → sem cobertura real detectada

**Avaliação:** Funcionou corretamente. Todos os scores acima de 0.94 confirmam que nenhum chunk tem proximidade semântica real com "frete padrão para 300kg". A lógica de threshold em `run_tests.py` detectou corretamente a ausência de cobertura.

**Resposta do Claude (real — colado de `p6_prompt.txt`):**

> Não encontrei essa informação na documentação disponível. O cálculo de frete para 300 kg com destino a Salvador não está coberto pelos documentos recuperados nesta consulta.
>
> **Detalhes relevantes**
> O único documento sobre cálculo de frete recuperado — PROC-042-frete-especial-v1 — aplica-se exclusivamente a cargas com peso acima de 500 kg. Uma carga de 300 kg está fora do escopo desse procedimento e, portanto, segue tabela de frete padrão, cujos parâmetros não constam nos registros disponíveis no momento.
>
> **Fonte**
> Conforme PROC-042-frete-especial-v1 | Versão 1.0 | Seção 1 — escopo restrito a cargas acima de 500 kg.
>
> **Ação recomendada**
> Consulte a tabela de frete padrão com o setor Comercial ou Operações, informando: peso (300 kg) e destino (Salvador/BA). Caso exista um sistema interno de cotação, utilize-o diretamente para obter o valor atualizado.

**Avaliação da resposta:** Funcionamento correto do threshold. Todos os scores foram > 0.94 (baixa similaridade), sinalizando ausência de cobertura. O Claude respondeu "não encontrei" sem inventar valores, e ainda explicou o motivo (300kg está fora do escopo do frete especial). A ação recomendada é útil e prática. Este é o melhor resultado possível para uma query sem cobertura documental.

---

## Resumo da Execução

```
Retrieval correto (nível de fonte): 6/6
  ✅ P1  ✅ P2  ✅ P3  ✅ P4  ✅ P5  ✅ P6
```

**Ressalva importante:** o teste verifica se o documento-fonte correto apareceu nos top 5 — não se a seção específica com a resposta foi incluída no prompt enviado ao Claude. A análise de qualidade real está nas seções de problemas abaixo.

---

## Problemas Identificados e Propostas de Correção

### Problema 1 — Seções erradas recuperadas nos top 3 (P1, P2, P3, P5)

**Observação real da execução:** O modelo `all-MiniLM-L6-v2` não diferencia bem seções do mesmo documento quando as queries são sobre um conceito amplo. Para P2, os 3 chunks enviados ao Claude são todos FAQ — a seção 3.2 do POL-001 (proibição explícita de cargas perigosas) não foi recuperada. Para P3, a tabela de SLAs (seção 2) não apareceu; a seção de medição (seção 5) foi mais próxima semanticamente. Para P5, a tabela de multiplicadores regionais não apareceu em nenhum dos 5 resultados.

**Proposta de correção:**
- Implementar **hybrid retrieval**: combinar busca vetorial (semântica) com BM25 (palavra-chave exata). Bibliotecas como `rank_bm25` permitem isso sem infraestrutura adicional. BM25 garantiria que "Manaus" e "Norte" no PROC-042 fossem recuperados, mesmo sem proximidade semântica.
- Aumentar `n` no retrieval de 5 para 10, aplicar threshold de score (ex: descartar scores > 0.90), e selecionar os top 3 do resultado filtrado.

### Problema 2 — FAQ domina o retrieval para queries sobre políticas formais (P2)

**Observação real da execução:** Para P2, os 3 primeiros resultados foram FAQ Items (scores 0.63, 0.69, 0.76). A seção formal do POL-001 ficou em 5º lugar. O FAQ Item 22 (sobre seguro de carga) é irrelevante para a query e consumiu uma das 3 vagas do prompt.

**Proposta de correção:**
- Adicionar campo `confiabilidade` nos metadados do chunk: `"formal"` (POL, PROC, SLA) vs. `"informal"` (FAQ).
- Aplicar **re-ranking pós-retrieval**: chunks formais com score ≤ 0.85 sobem na fila em relação a chunks informais com score semelhante. Garante que documentos normativos tenham preferência quando ambos são semanticamente próximos.
- Em `prompt_builder.py`, marcar visualmente chunks informais com aviso `[FONTE INFORMAL]`, reforçando a REGRA 5 do system prompt.

### Problema 3 — Tabela de multiplicadores não recuperada para query de frete (P5)

**Observação real da execução:** Para P5 ("Quanto custa o frete para 600kg para Manaus?"), a tabela de multiplicadores regionais não apareceu nos top 5. As seções de "Objetivo" dos dois PROCs foram mais próximas semanticamente. Claude receberia apenas a introdução do procedimento, sem os valores concretos para calcular o frete.

**Proposta de correção:**
- Adicionar **sumário semântico** a cada chunk no momento da ingestão: uma frase gerada por LLM descrevendo o conteúdo específico do chunk (ex: "Esta seção contém os multiplicadores regionais de frete: Sul 1.0, Sudeste 1.0, Norte 1.8, Nordeste 1.4, Centro-Oeste 1.2"). Embedar o sumário em vez do texto bruto melhora a recuperação por queries de intenção.
- Alternativa mais simples: duplicar as linhas da tabela de multiplicadores como metadados de texto nos chunks adjacentes, aumentando a densidade de termos relevantes.

### Problema 4 — Chunks de segurança crítica ficando fora do top 5 (P2)

**Observação real da execução:** Para P2 (carga perigosa), a seção 3.2 da POL-001 — que contém a negativa explícita "cargas das classes 1 a 6 da ANTT **não são elegíveis** para devolução pelo processo padrão" — não apareceu nos 5 primeiros resultados. Os chunks do FAQ informal dominaram com scores melhores (0.63, 0.69, 0.76) do que a seção formal (que ficou em 5º com 0.87). O FAQ Item 3 diz "pode ser viabilizado como exceção" — orientação que conflita diretamente com a proibição formal.

**Impacto em produção:** Um atendente receberia orientação baseada apenas no FAQ ("análise especializada, pode ser autorizado como exceção") sem a negativa formal da POL-001. Em termos regulatórios, isso é o pior cenário — o sistema não apenas falha em recuperar a regra, mas recupera uma fonte que contradiz a regra e tem score mais alto.

**Proposta de correção:**
- Para queries que contêm termos de segurança regulatória ("perigosa", "ANTT", "classe 1", "classe 2", "inflamável"), implementar **retrieval determinístico**: forçar inclusão do chunk POL-001 seção 3.2 independente do score vetorial. Essa abordagem é justificada pela criticidade — um erro aqui tem consequência regulatória, não apenas de experiência do usuário.
- Manter o campo `critico` nos metadados de chunks: chunks marcados como críticos entram automaticamente no prompt quando a query contém termos da lista de segurança.
- Exemplo de implementação em `search.py`: antes de retornar os top-N, checar se a query contém termos da lista de segurança e, se sim, injetar o chunk crítico na posição 1, deslocando os demais.
