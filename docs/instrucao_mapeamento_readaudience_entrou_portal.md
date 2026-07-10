# Instrução de mapeamento — "PF - Entrou no portal - EJ" · AJO **Read Audience** (batch, NÃO-FTP/NÃO-API)

> Terceiro padrão de entrada da migração. Não é FTP (CSV→evento) nem API Event (evento unitário):
> é **batch por leitura de audiência/segmento** (nó **Read audience**, `keyNamespace = cpf_hash`).
> Spec dedicada — não usa os molds das outras.

## Identificação
| | |
|---|---|
| Jornada SFMC | **PF - Entrou no portal - EJ** (`7f35d816-fa9b-41a6-b6da-8083434c62eb`, BU `mrv-cobranca-portal`) |
| Jornada AJO | `e8c65cb2-806e-48a7-bc5f-00e7d6b6f044` — **Draft, 12 erros bloqueando publicação** |
| Entrada SFMC | `EmailAudience` → **DEAudience** (`DEAudience-3a2e9480…`), DE **`Portal_SAP_Entrou_no_portal_PRD_EJ`** |
| DE de join (re-check) | **`Portal_SAP_Integracao_PRD`**, relacionada por **DocumentoCliente + ContratoSAP** (relationship `569de74a…`) |
| Identidade | **`cpf_hash`** (keyNamespace do Read audience) |
| Campos | `EmailCliente`, `CelularCliente`, `ContratoSAP`, `DocumentoCliente`, `Status`, `Semaforo` |
| Jornadas irmãs (idênticas em estrutura) | `46eb0e78` "PF - Visualizou propostas - EJ" (Status=`VISUALIZOU_PROPOSTAS`) + 1 outra — mesma spec, trocando o literal de Status/DE |

> ⚠️ O literal de Status desta jornada é **`EXIBIU_PROPOSTAS`** (não `VISUALIZOU_PROPOSTAS`, que é da irmã).

## Por que há 12 erros (a causa raiz, não só o sintoma)
Os 4 nós de decisão ("Optimize/Condition") estão **sem expressão** (`ERR_MODEL_GEN_5` + `ERR_MODEL_GEN_34`)
porque a lógica do SFMC depende de duas coisas que **não têm tradução direta** numa Condition do AJO:

1. **Join DE→DE** para `Portal_SAP_Integracao_PRD` (mesmo Documento+Contrato) com semântica **EXISTS** de registro relacionado. A Condition do AJO só referencia o **Profile union schema** (atributos de perfil, computed attributes, audience membership) + payload de evento — **não executa join arbitrário a uma DE/dataset em tempo de decisão**.
2. **Atributos efêmeros do evento** (`IsEphemeralAttribute=true`) no gate — snapshot do registro na entrada. Em jornada **batch** não há evento unitário; só há atributos de Profile.

**Conclusão:** preencher os splits exige, ANTES, materializar esses dados no perfil/segmento (pré-requisitos abaixo). Escrever uma expressão que "descreve o join" não publica — o erro permanece (ou vira erro de campo desconhecido).

## Pré-requisitos (habilitar antes de preencher os splits)
- [ ] **Materializar `Portal_SAP_Integracao_PRD` no AEP** como fonte consultável pela Condition — uma das opções:
  - dataset **Profile-enabled** com **relationship XDM** chaveado por `DocumentoCliente + ContratoSAP`; **ou**
  - **atributo enriquecido/computed** no perfil (ex.: `integracaoStatus` do contrato em escopo), atualizado pela pipeline de ingestão. *(Recomendado se não der para habilitar relationship a tempo.)*
- [ ] **Promover `Status` e `Semaforo`** (da DE de entrada `Portal_SAP_Entrou_no_portal_PRD_EJ`) a atributo de perfil/audiência — OU embuti-los na **definição do segmento** de entrada (ver abaixo).
- [ ] Confirmar o **escopo da jornada** (uma entrada por **contrato** vs por pessoa): o join usa `ContratoSAP`, e um perfil pode ter **vários contratos** → a condição precisa de **EXISTS/any sobre a coleção relacionada**, não igualdade escalar contra `profile.ContratoSAP`.
- [ ] Decidir o destino dos **e-mails "Semáforo"** (write-back de status; ver seção própria).

## Segmento de entrada (Read audience)
Equivalente ao DEAudience do SFMC. Definir um **Segment/audiência** no Unified Profile cuja regra reproduz o gate:
> registros equivalentes à DE `Portal_SAP_Entrou_no_portal_PRD_EJ` com **`Status = "EXIBIU_PROPOSTAS"` E `Semaforo = "NOVO"`**, resolvidos por **`cpf_hash`**.

Ler no nó **Read audience** com `keyNamespace = cpf_hash`. Como o segmento **já filtra Status+Semaforo=NOVO**,
o 2º split (gate) tende a ser **redundante** no AJO. **Diferença a confirmar:** o SFMC roda **recorrente (horário, high-watermark = só novos)**; o AJO desta jornada está como **batch ASAP não-recorrente** (`isRecurring=false, isAsap=true`) — alinhar a cadência.

## Os 4 decision splits (o que resolve os 12 erros)
Pareamento por ordem de fluxo (confirmar contra o export AJO):

| # / nó AJO | SFMC | Lógica pretendida (Path1) | Restante | Como expressar no AJO |
|---|---|---|---|---|
| **1 · `77b9e1fa`** | `V2-5` | **EXISTE** registro em `Portal_SAP_Integracao` do mesmo Documento+Contrato com **`Status = EXIBIU_PROPOSTAS`** (ainda no portal) | não existe / status ≠ → **Wait 1d → Fim** | Condition sobre o atributo/relacionamento materializado (pré-req). EXISTS, não igualdade escalar. |
| **2 · `3803d94e`** | `V2-1` | **`Status = EXIBIU_PROPOSTAS` AND `Semaforo = NOVO`** (entrou como registro novo) → **Email 1** | ≠ → **Wait 1min → Fim** | Atributo de perfil/audiência de entrada. **Redundante** com o segmento — manter por paridade 1:1 ou remover. **Nunca** modelar como condição de evento (não há evento no batch). |
| **3 · `449ce626`** | `V2-2` | **EXISTE** registro (mesmo Doc+Contrato) com **`Status ≠ EXIBIU_PROPOSTAS`** (converteu) → **sai** (e-mail semáforo → Fim) | ainda `EXIBIU_PROPOSTAS` **ou sem registro** → **Email 2** | EXISTS + `≠`. ⚠️ **fixar o caso "sem registro" no Restante** (senão inverte o SFMC). |
| **4 · `699d7226`** | `V2-4` | Igual ao #3 (converteu após Email 2) → **sai** | ainda `EXIBIU_PROPOSTAS`/sem registro → **split de engajamento** (abaixo) | idem #3 |

**Edge-case crítico (#3 e #4):** no SFMC o Path1 exige o **match do join** (Documento+Contrato) **E** `Status ≠ EXIBIU_PROPOSTAS`. Se **não há registro**, o AND falha e cai no Restante (→ Email 2). Uma expressão AJO ingênua `Status <> "EXIBIU_PROPOSTAS"` avaliada sobre lookup nulo pode mandar o perfil **sem registro** para o Path1 (SAI) — **inversão** vs SFMC. Codifique a **existência** explicitamente: `Path1 = (existe registro do contrato) AND Status ≠ "EXIBIU_PROPOSTAS"`.

## 5º nó — split de engajamento (NÃO é Optimize de atributo)
Após o #4 (Restante), o SFMC tem um **ENGAGEMENTDECISION**: "abriu o **Email 1**?".
- **Abriu** → suprime SMS → (e-mail semáforo) → Wait 5d → Fim.
- **Não abriu** → **SMS 1** → Wait 1d → Fim.

No AJO isso é uma **condição de Reação** ancorada no **nó de mensagem do Email 1 dentro da própria jornada** + janela de espera (experience event de abertura) — **não** um Optimize de atributo. Se o gerador emitiu esse nó como condição de atributo vazia, o erro dele **só some** modelando-o como Reaction.

## Personalização e canais
| Campo SFMC | Destino AJO |
|---|---|
| `EmailCliente` | endereço do canal **Email** → `personalEmail.address` |
| `CelularCliente` | número do canal **SMS** → `mobilePhone.number` (short code de saída `29520`) |
| `DocumentoCliente` + `ContratoSAP` | **chaves de negócio** do join (precisam existir como atributo de perfil p/ os re-checks) |
| `Status` / `Semaforo` | atributos de controle avaliados nos splits (não são identidade) |

Conteúdo: **Email 1**, **Email 2** (mesmo assunto "Já escolheu a melhor condição para você?") e **SMS 1**. O texto do SMS vive no MobileConnect (não versionado no JSON). Identidade primária = `cpf_hash`; e-mail/celular = endereços de canal.

## E-mails "Semáforo" (decisão pendente)
Os `EMAILV2` de nome "Semáforo para saída…"/"para suprimir SMS" **não são conteúdo ao cliente** — no SFMC são triggered sends que fazem **write-back de status/semáforo** (controle de saída). Decida:
- se o **write-back é necessário** → reproduzir via **Update Profile / Data action** (não apenas "encerrar");
- se **não** é necessário no AJO → documentar o descarte. **Não** omitir silenciosamente (muda o comportamento do ramo).

## Riscos / perguntas abertas
- **Bloqueador:** sem materializar `Portal_SAP_Integracao` como fonte de perfil (relationship/computed), os splits #1/#3/#4 **não são sequer autoráveis** no editor de condição → os erros permanecem.
- **Cardinalidade:** perfil com múltiplos contratos → usar EXISTS/any por contrato-em-escopo, não igualdade escalar.
- **Semântica de snapshot (#2):** SFMC usa atributo efêmero do evento; AJO lê perfil ao vivo (pode ter mudado entre ingestão e execução). Confirmar origem de `Status/Semaforo`.
- **Cadência:** SFMC recorrente horário (high-watermark) × AJO batch ASAP não-recorrente — alinhar.
- **Reação (5º nó):** exige wiring de reação sobre o Email 1 + janela; não é atributo.
- **Validar em rascunho/simulação** que as expressões limpam `ERR_MODEL_GEN_5/34` sem gerar erro de campo, antes de declarar publicável.

## Nota de método
Extração e verificação feitas com leitura direta do export SFMC (`7f35d816…json`) + verificação adversarial em 3 perspectivas. O leitor automático chegou a detalhar a **jornada irmã** (`46eb0e78` "Visualizou propostas"); os critérios acima foram **re-ancorados no `7f35d816`** (literal `EXIBIU_PROPOSTAS`, DE `Portal_SAP_Entrou_no_portal_PRD_EJ`).
