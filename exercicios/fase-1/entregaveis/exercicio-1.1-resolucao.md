# Exercício 1.1 – Análise de Viabilidade Técnica

**Papel:** Desenvolvedor  
**Ferramenta:** Claude (chat)  
**Data:** 2026-06-05

---

## 1. Análise por Tipo de Fonte

### 1.1 PDFs com Tabelas Complexas (ex: tabelas de frete com 15+ colunas)

**Desafio:**
Bibliotecas padrão (PyPDF2, pdfminer) extraem texto linha a linha, sem preservar a relação entre cabeçalho de coluna e valor. Uma tabela de multiplicadores regionais pode virar `1.2 1.0 1.3 1.4 1.6` sem contexto de qual região corresponde a qual número.

**Impacto na qualidade:**
O chunk parece conter a informação correta, mas o LLM pode associar o multiplicador errado à região errada. O erro é silencioso — a resposta parece confiante e estruturada.

**Estratégia:**
- Usar `camelot-py` ou `unstructured` com modo `hi_res` para extração estruturada de tabelas.
- Converter tabelas para Markdown antes do chunking: `| Região | Multiplicador |` — preserva contexto semântico.
- Validar integridade: comparar número de linhas/colunas esperadas vs. extraídas.

---

### 1.2 PDFs Escaneados — percentual a confirmar no discovery

**Desafio:**
PDFs escaneados são imagens de texto. Sem OCR, o conteúdo é invisível. Com OCR de baixa qualidade, palavras são reconhecidas incorretamente, destruindo a capacidade de busca semântica.

**Impacto:**
Chunks de documentos com OCR ruim têm baixa similaridade com qualquer pergunta — o retriever não os encontra. O assistente responde "não encontrei" para perguntas cuja resposta existe no documento, mas é invisível ao pipeline.

**Estratégia:**
- Azure AI Document Intelligence com controle de qualidade por score de confiança por página.

> **Correção pós-revisão:** Azure AI Document Intelligence **não está incluído na licença M365 E3**. M365 E3 inclui Office, SharePoint, Teams e Azure AD — não serviços cognitivos do Azure. Document Intelligence é um serviço separado do portfólio Azure AI Services, com cobrança por página processada (~US$ 1,50/1.000 páginas no tier padrão). **Ação: incluir budget de OCR na proposta comercial e confirmar aprovação de Azure subscription antes de iniciar o sprint de ingestão.**

- Threshold de aceitação: pages com confiança abaixo de 80% são sinalizadas para revisão manual.

> **Observação sobre o threshold de 80%:** Esse valor é um ponto de partida razoável baseado em benchmarks publicados pelo próprio Azure AI Document Intelligence, onde confiança > 0.8 costuma corresponder a menos de 2% de caracteres incorretos por página. O valor real deve ser ajustado após testar com uma amostra de 20–30 documentos reais da NovaTech durante o discovery. Adicionalmente, precisamos definir: documentos com páginas mistas (algumas acima, algumas abaixo do threshold) são bloqueados inteiramente ou apenas as páginas problemáticas são sinalizadas?

> **Suposição a validar:** O percentual de PDFs escaneados é desconhecido. Se for baixo (< 10%), o custo de OCR é marginal; se for alto (> 30%), exige uma sprint dedicada. **Ação: levantar com a TI da NovaTech antes de fechar o cronograma.**

---

### 1.3 Wiki do Confluence com Links Internos e Macros Customizadas

**Desafio:**
Links internos (`[Ver PROC-042|link]`) viram referências quebradas no texto plano. Macros customizadas (`{status:colour=Green}`) geram texto literal sem sentido semântico.

**Impacto:**
Um chunk que deveria referenciar "ver procedimento completo em PROC-042" mostra apenas um link quebrado. O LLM responde baseado em informação incompleta sem saber que uma referência crítica foi perdida.

**Estratégia:**
- Exportar via API REST do Confluence com macros expandidas (`expand=body.storage`).
- Resolver links internos no pré-processamento: substituir referência por título da página destino.
- Remover macros de formatação que não adicionam informação semântica.

---

### 1.4 Planilhas com Fórmulas Interdependentes

**Desafio:**
Planilhas exportadas como texto mostram fórmulas (`=B3*C3*D3`), não valores calculados. O contexto de cada célula depende do cabeçalho da coluna, que pode estar em outra linha ou aba.

**Impacto:**
Um chunk de planilha de fretes mostra `=PROCV(A2,'Base'!$A:$B,2,FALSE)` em vez de `R$ 450,00`. O LLM não consegue responder sobre valores de frete com fórmulas no contexto.

**Estratégia principal:**
- Exportar com `openpyxl` usando `data_only=True` — retorna valores calculados, não fórmulas.
- Preservar cabeçalhos de coluna e linha no chunk. Converter para Markdown tabular com contexto.

**Limitação crítica do `data_only=True`:**
`data_only=True` retorna `None` para células cujo valor depende de referências a planilhas externas (outros arquivos `.xlsx` não abertos simultaneamente). No contexto da NovaTech, onde as planilhas de fretes são atualizadas mensalmente e provavelmente referenciam bases externas (tabelas de CEP, fatores sazonais), isso significa que parte dos valores apareceria como `None` no chunk — exatamente os dados mais dinâmicos e críticos para as respostas.

**Solução para dependências externas:**
- **Opção 1 (preferida):** Exigir que a NovaTech forneça versões "congeladas" das planilhas — com todos os valores calculados e salvos como constantes, sem fórmulas externas (`Paste Special → Values Only`).

> **Risco operacional identificado na revisão:** A Opção 1 introduz um processo manual recorrente. Precisamos definir: quem executa, com que frequência, e o que acontece quando a planilha chegar com fórmulas externas por engano. O pipeline deve detectar campos `None` após a exportação e alertar — não ingerir silenciosamente. Um mecanismo de validação pós-extração é tão importante quanto a instrução ao time da NovaTech.

- **Opção 2 (automação):** Abrir as planilhas via automação COM (`win32com.client`) no Windows, forçar o recálculo completo e exportar os valores calculados. Mais frágil, depende do Excel instalado no servidor de ingestão.
- **Ação:** Mapear quais planilhas têm dependências externas durante o discovery e definir o processo com a área de Comercial.

---

## 2. Estimativa de Tamanho da Base em Tokens

> **Correção pós-revisão:** A estimativa original usava 1 token ≈ 0,75 palavras — razão calibrada para inglês. Em português, palavras são morfologicamente mais longas (mais prefixos, sufixos, acentuação), resultando em mais tokens por palavra. Para texto técnico corporativo em PT-BR, a razão real fica mais próxima de **1 token ≈ 0,60 palavras**. Os totais foram recalculados com esse valor.

### 2.1 Incerteza na densidade de palavras por página (PDFs)

| Tipo de página | Palavras estimadas |
|---------------|-------------------|
| Texto corrido (políticas, procedimentos narrativos) | 350–500 palavras |
| Misto (texto + tabelas + cabeçalhos) | 200–300 palavras |
| Tabelas densas com pouco texto | 80–150 palavras |

A base da NovaTech combina os três tipos. Usamos **200 palavras/página como cenário conservador** e **300 palavras/página como cenário otimista**.

### 2.2 Incerteza no tamanho das planilhas

Uma planilha de fretes com 15+ colunas e 200 linhas convertida para Markdown gera:
- 15 colunas × 200 linhas = 3.000 células × ~3–5 tokens/célula = **9.000–15.000 tokens por planilha**

Dois cenários:
- **Conservador:** planilhas simples, ~2.000 palavras equivalentes (~3.333 tokens a 0,60)
- **Pessimista:** planilhas densas, ~7.500 palavras equivalentes (~12.500 tokens a 0,60)

### 2.3 Incerteza no tamanho do Confluence

> **Correção pós-revisão:** A versão anterior usava 1.500 palavras/página em ambos os cenários — sem variância. Páginas wiki reais variam de stubs com 50 palavras a documentos de arquitetura com 8.000+ palavras. Adicionada faixa realista.

- **Otimista:** 800 palavras/página (média ponderada com muitos stubs e redirects)
- **Conservador:** 1.500 palavras/página (assume maioria de páginas com conteúdo denso)

### 2.4 Tabela de estimativas (recalculada com ratio PT-BR = 0,60)

| Fonte | Qtde | Cenário otimista (palavras) | Tokens (÷ 0,60) | Cenário conservador (palavras) | Tokens (÷ 0,60) |
|-------|------|----------------------------|-----------------|-------------------------------|-----------------|
| PDFs (SharePoint) | 800 docs × 10 pág | 300 palavras/pág → **2.400.000** | **4.000.000** | 200 palavras/pág → **1.600.000** | **2.667.000** |
| Wiki (Confluence) | 400 páginas | 800 palavras/pág → **320.000** | **533.000** | 1.500 palavras/pág → **600.000** | **1.000.000** |
| Planilhas | 50 arquivos | 2.000 palavras/arq → **100.000** | **167.000** | 7.500 palavras/arq → **375.000** | **625.000** |
| FAQ / documentos avulsos | estimado | incluído nos PDFs acima | — | incluído nos PDFs acima | — |
| **Total** | | | **~4.700.000** | | **~4.292.000** |

**Conclusão:** Entre 4,3 e 4,7 milhões de tokens — 33× a 37× o tamanho da janela de 128K. O recálculo com ratio PT-BR aumentou os totais em ~15–25% em relação à estimativa inicial. RAG é a única abordagem viável independentemente do cenário.

> A estimativa de planilhas continua sendo a mais incerta. Levantar 3 planilhas representativas para medir durante o discovery.

> **Overhead de breadcrumb não contabilizado:** Cada chunk tem um prefixo `[Fonte: ... | Versão: ... | Data: ... | Seção: ...]` de ~30–50 tokens. Com 10.000–20.000 chunks na base final: **300.000–1.000.000 tokens adicionais** no armazenamento. O impacto na janela de contexto por query é pequeno (3–5 chunks = 90–250 tokens de overhead), mas o custo de re-ingestão aumenta proporcionalmente.

> **Formato do FAQ não confirmado:** A tabela assume que FAQ está contido nos PDFs do SharePoint. FAQs corporativos frequentemente vivem em documentos Teams, páginas Confluence, planilhas de atualização manual ou wikis avulsos. **Ação: confirmar no discovery qual é o formato real e onde o FAQ da NovaTech está armazenado** — pode exigir uma estratégia de extração diferente das demais fontes.

---

## 3. Escolha do Modelo de Embedding

> **Seção adicionada pós-revisão:** A análise original não mencionava o modelo de embedding — omissão crítica, pois é o componente central do pipeline RAG. A escolha afeta qualidade de retrieval, custo de ingestão e latência.

**O problema com modelos populares para PT-BR:**
Modelos como `text-embedding-3-small` (OpenAI) e `all-MiniLM-L6-v2` (HuggingFace) são treinados majoritariamente em inglês. Para terminologia técnica corporativa em português (multiplicadores regionais, SLAs, nomenclaturas de frete), a representação vetorial pode ser inferior, impactando diretamente a qualidade do retrieval.

**Opções avaliadas:**

| Modelo | Idioma | Dimensão | `max_seq_length` | Custo | Tradeoff |
|--------|--------|----------|-----------------|-------|----------|
| `all-MiniLM-L6-v2` | EN (majoritário) | 384 | **256 tokens** | Gratuito / open-source | Rápido, leve, qualidade reduzida para PT-BR técnico |
| `paraphrase-multilingual-mpnet-base-v2` | 50+ idiomas | 768 | **128 tokens** | Gratuito / open-source | Melhor cobertura multilíngue, mas limite de entrada muito restritivo |
| `multilingual-e5-large` | 100+ idiomas | 1024 | **512 tokens** | Gratuito / open-source | Maior qualidade para PT-BR, compatível com chunks de 500 tokens |
| `text-embedding-3-small` (OpenAI) | EN + multilíngue | 1536 | **8.191 tokens** | ~US$ 0,02/1M tokens | Sem preocupação de truncação, mas custo recorrente em re-ingestões |

> **Correção pós-revisão — dimensão ≠ `max_seq_length`:** A versão anterior afirmava que "modelos com dimensão 384 têm janela semântica menor" — isso está errado. **Dimensão** é o tamanho do vetor de saída e não determina quantos tokens de entrada o modelo processa. **`max_seq_length`** é o limite real de tokens de entrada. O `sentence-transformers` trunca silenciosamente qualquer conteúdo além desse limite — não há erro, o conteúdo é simplesmente ignorado. Um chunk de 500 tokens com `paraphrase-multilingual-mpnet-base-v2` teria os tokens 129–500 completamente descartados no embedding. A tabela de multiplicadores regionais que começa na linha 5 do PROC-042 pode nunca ser embutida.

**Recomendação para o PoC:** `multilingual-e5-large` — suporta chunks de até 512 tokens sem truncação, tem boa qualidade para PT-BR técnico e custo zero. Compatível com a estratégia de chunks de ~500 tokens definida na Seção 5.

> Se for usar `paraphrase-multilingual-mpnet-base-v2`, os chunks precisam ter no máximo ~100 tokens — o que exigiria revisão completa da estratégia de chunking da Seção 5.

---

## 4. Análise do Orçamento de Contexto por Query

**Janela disponível:** 128.000 tokens

| Componente | Tipo | Tokens |
|-----------|------|--------|
| System prompt + guardrails | Estático | ~1.000 |
| Metadados do cliente (tier, contexto) | Dinâmico | ~200 |
| Pergunta do atendente | Dinâmico | ~50 |
| Histórico de conversa no Teams | Dinâmico, crescente | 0–5.000 |
| **Chunks recuperados** | **Dinâmico** | **~121.750 disponíveis** |

**Quantos chunks de 500 tokens cabem matematicamente?**  
`121.750 ÷ 500 ≈ 243 chunks`

**Quantos devemos usar na prática?**  
O efeito *lost in the middle* (Liu et al., 2023 — *"Lost in the Middle: How Language Models Use Long Contexts"*, Nelson F. Liu et al., Stanford/Google) mostra que LLMs perdem capacidade de usar informação posicionada no centro de contextos longos. **Recomendação: 3 a 5 chunks por query**, com os mais relevantes posicionados no início e no final do bloco de documentos — não no meio.

> Modelos mais recentes (Claude 3+, GPT-4o) têm atenção melhorada em contextos longos. A recomendação de 3–5 chunks deve ser validada empiricamente: testar com 10 chunks e comparar a qualidade das respostas antes de fixar o parâmetro.

---

## 5. Estratégia de Chunking Recomendada

**Chunking por seção semântica com breadcrumb de contexto**

**Por tipo de documento:**

| Documento | Estratégia | Por quê |
|-----------|-----------|---------|
| POL-001 | Por subseção `###` | Cada subseção é uma regra independente — misturar 3.1 com 3.2 confunde prazo geral com exceção |
| PROC-042 v1/v2 | Por bloco lógico | Tabela de multiplicadores deve ser recuperada como unidade atômica |
| SLA-2024 | Por bloco de tabela | Tabela cortada no meio perde o SLA de resolução de um tier |
| FAQ | Por item individual | Cada Q&A é uma unidade semântica — agrupar itens mistura tópicos díspares |

**Breadcrumb:** Cada chunk começa com `[Fonte: NOME | Versão: X | Data: DD/MM/AAAA | Seção: ...]`.

**Mitigação do *lost in the middle*:** Posicionar chunks com maior score de similaridade nas posições 1 e N (início e fim), não no meio.

**Re-ranking pós-retrieval (alternativa avaliada):**
Após o retrieval vetorial, um *cross-encoder* (ex: `cross-encoder/mmarco-mMiniLMv2-L12-H384-v1` — multilíngue, open-source) reordena os N chunks candidatos comparando diretamente a pergunta com cada chunk — sem vetores, com atenção full entre os dois textos. Mais preciso que o bi-encoder, mas ~50–100× mais lento. No cenário da NovaTech (3–5 chunks), a latência adicional seria de ~200–400ms por query — aceitável para um assistente de atendimento. **Recomendado como melhoria pós-PoC**, após validar que a qualidade do retrieval base é insuficiente para casos como P2 (carga perigosa) e P5 (multiplicadores regionais).

**Limitação: queries que cruzam seções adjacentes**

Queries como "quais são o procedimento e os custos de devolução?" exigem seções 3.3 e 3.5 do POL-001 — dois chunks separados. Estratégias:

- **Overlap entre chunks adjacentes:** incluir as últimas 2–3 frases do chunk anterior no início do próximo. Custo: ~10–15% de aumento no total de tokens armazenados.
- **Recuperação de vizinhos:** ao identificar o chunk mais relevante, incluir os chunks imediatamente anterior e posterior.
- **Recuperação de N+1 com filtro de score:** recuperar 6–8 chunks e descartar os com score acima do threshold antes de montar o prompt.

> **Risco no vizinho:** O chunk adjacente pode ser de tópico completamente diferente (ex: seção de multiplicadores seguida de seção de reclamações). O vizinho deve passar por um filtro mínimo de score antes de ser incluído — não recuperação cega.

---

## 6. Revisão Crítica com Claude — Iteração

**Prompt enviado ao Claude:**
> "Revise esta análise técnica. Identifique pontos fracos, estimativas otimistas ou riscos que não considerei."

**Problemas identificados pelo Claude e incorporados:**

| # | Problema apontado | Seção corrigida |
|---|------------------|----------------|
| 1 | Azure AI Document Intelligence não incluso no M365 E3 | Seção 1.2 |
| 2 | Modelo de embedding para PT-BR completamente ausente | Seção 3 (nova) |
| 3 | Token ratio 0,75 calibrado para inglês; PT-BR é ~0,60 | Seção 2 (recalculada) |
| 4 | Confluence sem faixa de variância nos dois cenários | Seção 2.3 |
| 5 | FAQ ausente da tabela de estimativa de tokens | Seção 2.4 (nota adicionada) |
| 6 | Threshold de 80% OCR sem justificativa ou critério de derivação | Seção 1.2 |
| 7 | Estratégia de planilhas congeladas sem mecanismo de detecção de falha | Seção 1.4 |
| 8 | Controle de acesso a documentos (ACLs do SharePoint) não endereçado | Seção 7 (pergunta 5 adicionada) |
| 9 | Recuperação de vizinhos sem filtro de score — risco de ruído | Seção 5 |

---

## 7. Riscos Consolidados

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| Extração ruim de tabelas PDF → valores incorretos | Alta | Alto | camelot/unstructured + validação de integridade |
| OCR necessário, percentual desconhecido → custo/prazo subestimados | Alta | Alto | Levantar percentual no discovery; Azure AI Document Intelligence (budget separado do M365) |
| Planilhas com referências externas → `data_only=True` retorna None silenciosamente | Alta | Alto | Planilhas congeladas + validação no pipeline que detecta e alerta campos None |
| Modelo de embedding com baixa qualidade para PT-BR técnico | Alta | Alto | Avaliar multilingual-e5-large ou paraphrase-multilingual-mpnet-base-v2; validar com testes de retrieval |
| PROC-042 v1 e v2 recuperados juntos → respostas mescladas | Alta | Alto | Metadados de vigência + ranking que penaliza versões antigas |
| Base desatualizada quando documentos são revisados sem re-ingestão | Alta | Alto | Webhook ou job agendado que detecta mudanças no SharePoint/Confluence e dispara re-ingestão seletiva |
| Documentos com ACL restritas ingeridos indiscriminadamente | **Desconhecida — verificar no discovery** | Alto | Mapear permissões antes da ingestão; avaliar RAG com controle de acesso por usuário |
| Lost in the middle em sessões longas | Média | Médio | Compressão de histórico após 5 turnos; validar empiricamente com 10+ chunks |
| FAQ informal como fonte única para dados críticos | Alta | Alto | Classificar FAQ como fonte secundária; system prompt diferencia |

---

## 8. Perguntas para o Tech Lead (antes de confirmar o cronograma de 3 meses)

1. **Qual o percentual real de PDFs escaneados e qual a distribuição de tipos de página?** Define custo de OCR e estratégia de extração — sem esse número, o prazo do sprint de ingestão é especulação.

2. **As planilhas de fretes referenciam arquivos externos?** Se sim, `data_only=True` retornará `None`. Precisamos definir o processo de entrega antes de começar o pipeline.

3. **Existe campo de "data de vigência" ou "status" nos metadados do SharePoint?** Se não, precisamos de uma sprint de curadoria antes de qualquer ingestão.

4. **Quem marca um documento como obsoleto quando uma nova versão é publicada — e existe processo automatizado?** Se não houver, o pipeline vai continuar ingerindo PROC-042 v1 e v2 simultaneamente. Um webhook de mudanças no SharePoint precisa estar no escopo do projeto.

5. **Os documentos no SharePoint têm ACLs diferenciadas por área?** Se sim, o assistente pode recuperar e expor conteúdo que o atendente não deveria acessar. Precisamos definir se o sistema respeita permissões por usuário ou se a base será curada para conter apenas documentos de acesso irrestrito.

6. **Qual é o SLA de latência esperado para o assistente?** Se a exigência for resposta em menos de 2 segundos, modelos grandes via API e re-ranking com cross-encoder precisam de avaliação cuidadosa — cada component adiciona latência (embedding: ~50–100ms; retrieval: ~20–50ms; cross-encoder 3–5 chunks: ~200–400ms; geração LLM: ~800ms–3s). Se a exigência for apenas "resposta em tempo hábil para não travar o atendimento" (< 15s), o design é mais liberal.
