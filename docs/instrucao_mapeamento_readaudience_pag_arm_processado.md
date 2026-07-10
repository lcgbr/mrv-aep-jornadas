# Instrução de mapeamento — Jrn pag arm - Pagamento processado · evento **A CRIAR — `MRV_CRM_Pag_Arm_Processado`** (Read Audience / batch diário)

> Jornada transacional de **móveis planejados (armários)** do Marketplace que confirma o **pagamento do
> cartão já processado** (trilha "feliz" da família "Jrn pag arm"). **Não é FTP nem API Event**: a entrada é
> `AutomationAudience` (DE Audience). A automation **`Jornada_pagamento_pag_processado`** (`a290bf8c`) roda
> SQL diário, grava a DE **`Jornada_Pagamento_pag_processado`** e injeta na jornada. No AJO o padrão
> equivalente é **Read Audience** (mesmo padrão das irmãs "Jrn pag arm" e das réguas transacionais de armários).
> **É a irmã simples da família:** faz só **1 e-mail + 1 SMS de confirmação** com fallback de "não abriu" —
> **sem** o re-teste de status (`StatusPagamento__c = PAID`) e **sem** a 2ª trilha que existem na
> "não processado".
> ⚠️ **Não confundir com as jornadas IRMÃS** da mesma família "pagamento armários":
> **"Jrn pag arm - Pagamento nao processado"** (`aed47930`, automation `d9125f9a`, DE
> `Jornada_Pagamento_pag_nao_processado`) e **"Jrn pag arm - Pre processamento cartao"** (`f345d47f`,
> automation `99569c91`, DE `Jornada_Pagamento_pre_processamento_cartao`). Há ainda as primas de boleto
> ("Boleto geral" `99d8e3e3`, "Boleto mensal" `df7ed4de`), fora deste escopo.

## Identificação
| | |
|---|---|
| Jornada SFMC | **Jrn pag arm - Pagamento processado** (`64b2274e-732a-4d70-be29-07e240d20b24`, BU `mrv-marketplace`) — `Published` v1, `entryMode = MultipleEntries` (permite reentrada) |
| Entrada SFMC | `AutomationAudience` / **DE Audience** (eventDefinition `790d7391-f176-4d55-8fc6-d8164a6c8e52`, key `DEAudience-b860f7aa-4a16-0e24-950a-a8502ffecb18`) |
| Automation alimentadora | **`Jornada_pagamento_pag_processado`** (`a290bf8c-c640-4da8-9425-ffe968394095`) — diária **07:15 BRT** (`E. South America Standard Time`, `FREQ=DAILY`, `useHighWatermark = false`) |
| Passos da automation | 1) SQL `Resgata contatos pagamento processado` → DE de entrada · 2) SQL `Historico jornada pagamento processado` → DE **`Historico_pag_processado`** (`cc0106b6-525b-f111-ba81-48df37e63b1a`, key `7A7B405E-B9AF-4272-A52C-95545A6F40D2`, 37 linhas — dedupe/histórico) · 3) atividade de Jornada (`objectTypeId 952`) que injeta a DE |
| DE de entrada | **`Jornada_Pagamento_pag_processado`** (`f2ea42ba-475b-f111-ba81-48df37e63b1a`, key `CCEADEDE-91EA-4C51-96A9-943E48B2A190`) |
| Canais | **2 e-mails** (ids 74056 `Pag_Processado`, 74057 `NA_Pag_Processado`) + **1 SMS** (asset 198290 `SMS_Pag_Processado`, short code `29520`) |
| Identidade AJO | `cpfHash` (namespace `cpf_hash` — a Function gera o hash) |
| Evento AJO | **A CRIAR** — não está no export dos 66 (nenhum evento `marketplace*` de pagamento no `ajo_event_map.json`; os 7 `marketplace*` existentes são de outras jornadas) |
| Ficha / de-para | **Não existe** (jornada fora do site, sem `sourceEventType` registrado e sem mapper C#) |

## Envelope do evento
No padrão **Read Audience não há evento AJO**: a jornada lê uma audiência do Unified Profile e a
personalização usa **atributos de perfil/audiência**, não `@event{}`. **Não existe** entrada desta jornada
no `ajo_event_map.json` — os 7 eventos `marketplace*` existentes são de outras jornadas (ex.:
`marketplaceDisparoDivulgacaoArmariosWpp` → `MRV_FTP_Disparo_Divulg_Armario`, WhatsApp, distinta).

Se a implementação optar pela **rota por evento** (batch diário publica 1 evento por registro da DE), o
envelope precisa ser **criado** — proposta ⚠️ **a confirmar** (par com a irmã "não processado"):

| Campo | Valor proposto |
|---|---|
| Evento AJO | **`MRV_CRM_Pag_Arm_Processado`** (**A CRIAR** — nome a validar no padrão do time) |
| `eventType` | `dcsExternal` (mesmo tipo dos demais eventos `marketplace*` no `ajo_event_map.json`) |
| `sourceEventType` | `marketplacePagamentoArmarioProcessado` (**A CRIAR**) |
| `sourceSystem` | `Salesforce` (proposta — o status de pagamento do cartão é campo do CRM, não `FTPFileImport`) |

## Fluxo AS-IS (SFMC)
```
Entrada diária 07:15 BRT (DE Jornada_Pagamento_pag_processado, entryMode MultipleEntries)
└─ STOWAIT-1 · Einstein STO 24h
   └─ EMAILV2-1 "Pag_Processado" (id 74056)
        assunto "MRV | Pagamento processado" / preheader "Compra de móveis aprovada."
      └─ WAITBYDURATION-1 · Wait 10min
         └─ SMSSYNC-1 "SMS_Pag_Processado" (asset 198290, code 29520, texto estático):
              "MRV | Compra de moveis planejados aprovada.
               Seu CARTAO de credito foi PROCESSADO e as parcelas serao cobradas
               mensalmente na fatura."
            └─ ENGAGEMENTSPLITV2-1 "Open Pag_Processado" · abriu EMAILV2-1?
               ├─ Sim → Fim
               └─ Não → STOWAIT-2 · Einstein STO 24h
                        └─ EMAILV2-2 "NA_Pag_Processado" (id 74057)
                             assunto "MRV | Compra aprovada ✅" / preheader "Cartão processado corretamente."
                           → Fim
```
- **Endereços de canal (defaults da jornada):** e-mail = campo **`Email`** da DE
  (`{{Event.DEAudience-….\"Email\"}}`); celular = campo **`Celular`** da DE
  (`{{Event.DEAudience-….\"Celular\"}}`).
- **Personalização:** assuntos, preheaders e o SMS são **estáticos** (nenhum `%%campo%%` no raw). Confirmar
  no corpo HTML dos e-mails se há saudação por nome (padrão da família usa `%%Name%%`).
- **Lógica da jornada:** trilha única de **confirmação** (e-mail + SMS de "pagamento processado") com um
  **fallback "não abriu"** que reenvia um 2º e-mail de reforço. **Não há** decisão de status nem 2ª trilha —
  esta é a jornada que já assume o pagamento **aprovado**.
- ⚠️ **Sem espera antes do engagement split:** diferente da "não processado" (que tem `WAITBYDURATION-2` de
  1 dia antes de avaliar a abertura), aqui o `ENGAGEMENTSPLITV2-1` avalia a abertura do e-mail
  **imediatamente após o SMS** (só os 10 min do `WAITBYDURATION-1`). Validar se é intencional ou se falta a
  janela de leitura — na modelagem AJO isso vira a **janela de espera da Reaction**.

### Diferenças vs. a irmã "Jrn pag arm - Pagamento nao processado" (`aed47930`)
| Aspecto | **Processado** (esta) | **Não processado** (`aed47930`) |
|---|---|---|
| E-mails | **2** (74056, 74057) | 4 (74058, 74059, 74061, 74062) |
| SMS | **1** (198290) | 2 (198293, 198300) |
| Einstein STO | **2** | 4 |
| Engagement splits | **1** | 2 |
| Re-teste `StatusPagamento__c = PAID` | **não tem** | tem (`MULTICRITERIADECISIONV2-1`) → 2ª trilha |
| Wait antes do split | **não tem** (só 10min) | tem (`Wait 1d`) |
| Automation / DE de entrada | `a290bf8c` / `Jornada_Pagamento_pag_processado` | `d9125f9a` / `Jornada_Pagamento_pag_nao_processado` |
| Igual nas duas | entrada Read Audience / DE Audience · `MultipleEntries` · defaults de canal (`Email`/`Celular`) · short code `29520` | idem |

## Fluxo AJO equivalente
```
Read Audience (recorrência diária ~07:15 BRT, keyNamespace = cpf_hash)
  audiência ≡ Jornada_Pagamento_pag_processado (pagamentos de cartão aprovados do dia; dedupe via Historico_*)
  └─ STO 24h → Email 1 (Pag_Processado) → Wait 10min → SMS 1 → Reaction "abriu Email 1?"
       Sim → Fim
       Não → STO 24h → Email 2 (NA_Pag_Processado) → Fim
```
- **Engagement split** → condição de **Reação** (abertura do `Email 1`). ⚠️ Definir a **janela de espera** da
  Reaction — no SFMC não há wait dedicado antes do split (ver nota AS-IS); alinhar com o time se mantém
  ~imediato ou se aplica uma janela (ex.: 1 dia, como na irmã).
- **Einstein STO ×2** → Send-Time Optimization nativo do AJO (janela 24h) — comportamento a validar.
- **`MultipleEntries`** → **permitir reentrada** na configuração da jornada AJO (diferente das réguas
  `SingleEntryAcrossAllVersions`); o dedupe operacional é feito upstream pela DE `Historico_pag_processado`.
- **Sem decisão de status:** nada a mapear como Condition sobre atributo/`@event{}` — a trilha é linear.

## Mapeamento dos campos → XDM
Campos **confirmados no raw** da DE `Jornada_Pagamento_pag_processado`: apenas `Email` e `Celular` (defaults
de canal da jornada). Diferente da "não processado", esta jornada **não usa** `StatusPagamento__c` (não há
`MULTICRITERIADECISIONV2`), então **nenhum campo de status precisa ir ao evento**. CPF e nome **não aparecem**
no raw e precisam ser confirmados na definição da DE. Não há de-para nem mapper C# — o grupo
`_mrv.paymentEvent` seria **proposta nova** (🆕), mas nesta jornada nem é necessário (só identidade + canais).
Na rota Read Audience os mesmos dados precisam existir como **atributos de perfil** (coluna "Uso").

| Campo DE/SQL | XDM (evento proposto) | Uso no AJO |
|---|---|---|
| CPF (⚠️ **não confirmado na DE** — validar) | `_mrv.identityEvents.cpfHash` 🆕 | **identidade PK** (namespace `cpf_hash`; a Function gera o hash) |
| `Email` | `_mrv.identityEvents.email` | endereço do canal e-mail (perfil: `personalEmail.address`) |
| `Celular` | `_mrv.identityEvents.phone` 🆕 | número do canal SMS (regra global **telefone/celular → `phone`**; perfil: `mobilePhone.number`) |
| Nome / primeiro nome (se existir na DE) | — (não vai no evento) | resolvido no **PROFILE** via `cpfHash` → `person.name.firstName` / `person.name.fullName` (eventual saudação `%%Name%%`) |
| — (fixo) | `_mrv.sourceContext.sourceEventType` = `marketplacePagamentoArmarioProcessado` 🆕 | roteamento de ingestão |
| — (fixo) | `_mrv.sourceContext.sourceSystem` = `Salesforce` 🆕 | origem |

> Nota: como a jornada é uma **confirmação linear** (sem router por status), o evento só precisa carregar
> **identidade + endereços de canal**. Se o time quiser padronizar com a irmã "não processado", pode incluir
> `_mrv.paymentEvent.status` 🆕 (valor `"PAID"`) como metadado — mas **não é consumido** por nenhuma decisão
> desta jornada.

## Fórmulas prontas para o AJO
> ⚠️ Evento **A CRIAR**: as fórmulas abaixo assumem o nome proposto **`MRV_CRM_Pag_Arm_Processado`**.
> Ajuste o nome **por completo** quando o evento for criado — **nunca** abrevie o evento nem o path.

**Rota Read Audience (recomendada):** não há `@event{}` — a personalização lê o perfil/audiência:
- Saudação (se houver): `person.name.firstName` do **profile** (via `cpfHash`).
- Endereços de canal: atributos de perfil (`personalEmail.address` / `mobilePhone.number`).

**Rota por evento (se adotada — evento `MRV_CRM_Pag_Arm_Processado`, A CRIAR):**
- Endereço do e-mail:
  `@event{MRV_CRM_Pag_Arm_Processado._mrv.identityEvents.email}`
- Número do SMS (userNumber):
  `@event{MRV_CRM_Pag_Arm_Processado._mrv.identityEvents.phone}`

> **Lembrete `concat`:** sempre que texto fixo for combinado com uma variável numa mesma expressão, use
> `concat("texto ", @event{MRV_CRM_Pag_Arm_Processado._mrv.identityEvents.phone})` — nunca justaposição.
> No estado atual **nenhum concat é necessário**: o SMS é 100% estático e os assuntos/preheaders dos 2
> e-mails não usam variáveis. Ex. (só se algum texto passar a exibir o nome):
> `concat("Olá ", @event{MRV_CRM_Pag_Arm_Processado._mrv.identityEvents.email})` *(preferir resolver nome via profile)*.

## Gaps / pendências
- [ ] ⚠️ **Decidir o padrão de implementação**: Read Audience (recomendado — paridade com as irmãs "Jrn pag
  arm" e as réguas de armários) **ou** evento `dcsExternal` batch (**A CRIAR**: evento +
  `sourceEventType` + produtor). A spec cobre os dois.
- [ ] ⚠️ **Confirmar o schema completo da DE `Jornada_Pagamento_pag_processado`** — o raw só expõe `Email` e
  `Celular`. Verificar se há **CPF** (pré-requisito do `cpfHash` e da resolução de nome no profile) e campo
  de nome.
- [ ] ⚠️ **Janela da Reaction**: no SFMC o engagement split avalia a abertura **sem wait dedicado** (só os
  10 min do SMS). Confirmar com o time se mantém ~imediato ou aplica janela (ex.: 1 dia, como na irmã) antes
  de fixar a Reaction no AJO.
- [ ] Reproduzir a query **`Resgata contatos pagamento processado`** (aprovações do dia) e o **dedupe** feito
  por `Historico_pag_processado` na definição da audiência (recorrência diária 07:15 BRT).
- [ ] Modelar o **engagement split** como **Reaction** (abertura do `Email 1` `Pag_Processado`).
- [ ] Configurar **STO nativo** (janela 24h) nos 2 pontos e validar vs Einstein STO.
- [ ] Reproduzir **`MultipleEntries`** (permitir reentrada) — atenção: **não** bloquear reentrada como nas réguas.
- [ ] Migrar assets: 2 e-mails (74056 `Pag_Processado`, 74057 `NA_Pag_Processado`) e 1 SMS estático (198290
  `SMS_Pag_Processado`), short code `29520`.
- [ ] Confirmar no corpo HTML dos e-mails se há saudação por nome (`%%Name%%`) — se sim, resolver via profile.
- [ ] Tratar as **irmãs** em specs próprias: "Jrn pag arm - Pagamento nao processado" (`aed47930`, já
  especificada) e "Jrn pag arm - Pre processamento cartao" (`f345d47f`) — estrutura análoga (DE Audience),
  DEs/queries distintas.

## Complexidade
🟢 **Baixa** — é a irmã mais simples da família: trilha **linear** de 1 e-mail + 1 SMS de confirmação com um
único fallback "não abriu" (2º e-mail), **sem** decisão de status, sem router e sem 2ª trilha. O que exige
atenção é operacional/de dados (materializar a audiência de aprovados do dia + dedupe via
`Historico_pag_processado`, incluir o CPF na DE para o `cpfHash`, e definir a janela da Reaction), não a
lógica da jornada.
