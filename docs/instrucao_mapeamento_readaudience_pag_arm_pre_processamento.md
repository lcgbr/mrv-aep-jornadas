# Instrução de mapeamento — Jrn pag arm - Pre processamento cartao · evento **A CRIAR — `MRV_CRM_Pag_Arm_Pre_Processamento`** (Read Audience / batch diário)

> Jornada transacional de **móveis planejados (armários)** do Marketplace que envia o **lembrete de
> pré-processamento do cartão** (avisa que, em breve, uma **nova parcela** será cobrada na fatura — pedido
> para o cliente manter limite disponível). **Não é FTP nem API Event**: a entrada é `AutomationAudience`
> (DE Audience). A automation **`Jornada pagamento pre processamento`** (`99569c91`) roda SQL diário, grava a
> DE **`Jornada_Pagamento_pre_processamento_cartao`** e injeta na jornada. No AJO o padrão equivalente é
> **Read Audience** (mesmo padrão das irmãs da família "Jrn pag arm" e das réguas transacionais de armários).
> ⚠️ **Não confundir com as jornadas IRMÃS** da mesma família "pagamento armários":
> **"Jrn pag arm - Pagamento nao processado"** (`aed47930`, automation `d9125f9a`, DE
> `Jornada_Pagamento_pag_nao_processado`), **"Jrn pag arm - Pagamento processado"** (`64b2274e`, automation
> `a290bf8c`, DE `Jornada_Pagamento_pag_processado`) e as primas de boleto ("Boleto geral" `99d8e3e3`,
> "Boleto mensal" `df7ed4de`) — fora deste escopo. Esta é a **mais simples** da família: fluxo linear, sem
> re-teste de status de pagamento.

## Identificação
| | |
|---|---|
| Jornada SFMC | **Jrn pag arm - Pre processamento cartao** (`f345d47f-d36e-4901-ad91-04bbc1ff0f52`, BU `mrv-marketplace`) — `Published` v1, `entryMode = MultipleEntries` (permite reentrada) |
| Entrada SFMC | `AutomationAudience` / **DE Audience** (eventDefinition `bc75d17a-c21f-4c5c-8c29-4beeb0c3a3ae`, key `DEAudience-f32acc4a-4bff-da33-fb12-b534d64c148f`, `useHighWatermark = false`) |
| Automation alimentadora | **`Jornada pagamento pre processamento`** (`99569c91-f792-4882-bf9c-88e3f0d31155`) — diária **07:15 BRT** (`E. South America Standard Time`, `FREQ=DAILY`) |
| Passos da automation | 1) SQL **`Resgata contatos pre processamento`** (`686db140-…`, `objectTypeId 300`) → DE de entrada · 2) atividade de Jornada (`bc75d17a-…`, `objectTypeId 952`) que injeta a DE |
| DE de entrada | **`Jornada_Pagamento_pre_processamento_cartao`** (`71c21d35-485b-f111-ba81-48df37e63b1a`, key `05BC44C3-C08E-4E33-B7BB-B0E10AF89CAA`) |
| Canais | **2 e-mails** (ids 74074 `Pre_Processamento`, 74078 `NA_Pre_Processamento`) + **1 SMS** (asset 198416, short code `29520`) |
| Identidade AJO | `cpfHash` (namespace `cpf_hash` — a Function gera o hash) |
| Evento AJO | **A CRIAR** — não está no export dos 66 (nenhum evento `marketplace*` de pagamento no `ajo_event_map.json`) |
| Ficha / de-para | **Não existe** (jornada fora do site, sem `sourceEventType` registrado e sem mapper C#) |

## Envelope do evento
No padrão **Read Audience não há evento AJO**: a jornada lê uma audiência do Unified Profile — o fluxo é
**linear** e a única decisão (engagement split) é uma **Reação**, não um teste de atributo. **Não existe**
entrada desta jornada no `ajo_event_map.json` — os 7 eventos `marketplace*` existentes são de outras jornadas
(ex.: `marketplaceDisparoDivulgacaoArmariosWpp` → `MRV_FTP_Disparo_Divulg_Armario`, WhatsApp, distinta).

Se a implementação optar pela **rota por evento** (batch diário publica 1 evento por registro da DE), o
envelope precisa ser **criado** — proposta ⚠️ **a confirmar** (alinhada às irmãs "Jrn pag arm"):

| Campo | Valor proposto |
|---|---|
| Evento AJO | **`MRV_CRM_Pag_Arm_Pre_Processamento`** (**A CRIAR** — nome a validar no padrão do time) |
| `eventType` | `dcsExternal` (mesmo tipo dos demais eventos `marketplace*` no `ajo_event_map.json`) |
| `sourceEventType` | `marketplacePagamentoArmarioPreProcessamento` (**A CRIAR**) |
| `sourceSystem` | `Salesforce` (proposta — dados originados no CRM, não `FTPFileImport`) |

## Fluxo AS-IS (SFMC)
```
Entrada diária 07:15 BRT (DE Jornada_Pagamento_pre_processamento_cartao, entryMode MultipleEntries, sem high-watermark)
└─ STOWAIT-5 · Einstein STO 24h
   └─ EMAILV2-5 "Pre_Processamento" (id 74074)
        assunto "MRV | Lembrete de pagamento" / preheader "Móveis: seu cartão será processado."
      └─ WAITBYDURATION-6 · Wait 10min
         └─ SMSSYNC-3 "SMS_Pre_Processamento" (asset 198416, code 29520, texto estático):
              "MRV | Em breve, uma nova parcela de MOVEIS PLANEJADOS sera processada em seu CARTAO de
               credito. Atente-se ao limite disponivel."
            └─ WAITBYDURATION-7 · Wait 1d
               └─ ENGAGEMENTSPLITV2-3 "abriu EMAILV2-5 (Pre_Processamento)?"
                  ├─ Sim → Fim
                  └─ Não → STOWAIT-6 · STO 24h
                             └─ EMAILV2-6 "NA_Pre_Processamento" (id 74078)
                                  assunto "%%NomeCliente__c%%, nova parcela processada"
                                  preheader "MRV | Atente-se ao limite do cartão"
                                → Fim
```
- **Endereços de canal (defaults da jornada):** e-mail = campo **`Email`** da DE
  (`{{Event.DEAudience-f32acc4a-….\"Email\"}}`); celular = campo **`Celular`** da DE
  (`{{Event.DEAudience-f32acc4a-….\"Celular\"}}`).
- **Personalização:** o e-mail 1 (`Pre_Processamento`), seus assunto/preheader e o SMS são **estáticos**. O
  e-mail 2 (`NA_Pre_Processamento`) tem **assunto dinâmico** `%%NomeCliente__c%%, nova parcela processada`
  (nome do cliente + texto fixo). Confirmar no corpo HTML dos e-mails se há saudação por nome (`%%Name%%` /
  `%%NomeCliente__c%%`).
- **Lógica da jornada:** trilha única de lembrete (e-mail + SMS) e, no dia seguinte, um **fallback** por
  não-abertura (STO + e-mail 2 "NA_"). **Não há** re-teste de status de pagamento nem router — diferença-chave
  para as irmãs `Pagamento nao processado`/`Pagamento processado`.

## Fluxo AJO equivalente
```
Read Audience (recorrência diária ~07:15 BRT, keyNamespace = cpf_hash)
  audiência ≡ Jornada_Pagamento_pre_processamento_cartao (contatos com parcela a processar)
  └─ STO 24h → Email 1 "Pre_Processamento" → Wait 10min → SMS 1 → Wait 1d
       └─ Reaction "abriu Email 1?"
            Sim → Fim
            Não → STO 24h → Email 2 "NA_Pre_Processamento" (assunto com nome) → Fim
```
- **Engagement split** → condição de **Reação** (abertura do e-mail 1, janela de espera de 1 dia) — não é
  Optimize de atributo.
- **Einstein STO ×2** → Send-Time Optimization nativo do AJO (janela 24h) — comportamento a validar.
- **Sem router / sem MultiCriteria:** o fluxo é linear (a única bifurcação é a Reação). Nenhum campo
  discriminador entra na decisão — não há `StatusPagamento__c` neste fluxo (ao contrário das irmãs).
- **`MultipleEntries`** → **permitir reentrada** na configuração da jornada AJO (o cliente pode receber o
  lembrete a cada nova parcela); o dedupe operacional, se necessário, é feito upstream pela query diária.

## Mapeamento dos campos → XDM
Campos **confirmados no raw** da jornada: `Email` e `Celular` (defaults de canal) e `NomeCliente__c` (assunto
dinâmico do e-mail 2). Os demais (CPF, nome completo) **não aparecem** no raw e precisam ser confirmados na
definição da DE. Não há de-para nem mapper C# — o grupo `_mrv.paymentEvent` é **proposta nova** (🆕 todos os
leaves). Na rota Read Audience os mesmos dados precisam existir como **atributos de perfil** (coluna "Uso").

| Campo DE/SQL | XDM (evento proposto) | Uso no AJO |
|---|---|---|
| CPF (⚠️ **não confirmado no raw** — validar na DE) | `_mrv.identityEvents.cpfHash` 🆕 | **identidade PK** (namespace `cpf_hash`; a Function gera o hash) |
| `Email` | `_mrv.identityEvents.email` | endereço do canal e-mail (perfil: `personalEmail.address`) |
| `Celular` | `_mrv.identityEvents.phone` 🆕 | número do canal SMS (regra global **telefone/celular → `phone`**; perfil: `mobilePhone.number`) |
| `NomeCliente__c` | — (**não vai no evento**) | resolvido no **PROFILE** via `cpfHash` → `person.name.firstName` (assunto dinâmico do e-mail 2 `NA_Pre_Processamento`) |
| — (fixo) | `_mrv.sourceContext.sourceEventType` = `marketplacePagamentoArmarioPreProcessamento` 🆕 | roteamento de ingestão |
| — (fixo) | `_mrv.sourceContext.sourceSystem` = `Salesforce` 🆕 | origem |

> Nota: já existe no schema o grupo `_mrv.contractBillingEvent` (billing de Cobrança) e há a proposta
> `_mrv.paymentEvent` (🆕) usada na irmã `Pagamento nao processado`. Como **esta** jornada **não usa nenhum
> campo de status/billing na lógica** (só endereços + nome via profile), no estado atual **nenhum leaf de
> `paymentEvent` é necessário** — só `identityEvents` + `sourceContext`. Reavaliar se a query trouxer campos
> adicionais a personalizar.

## Fórmulas prontas para o AJO
> ⚠️ Evento **A CRIAR**: as fórmulas abaixo assumem o nome proposto **`MRV_CRM_Pag_Arm_Pre_Processamento`**.
> Ajuste o nome **por completo** quando o evento for criado — **nunca** abrevie o evento nem o path.

**Rota Read Audience (recomendada):** não há `@event{}` — endereços e personalização leem o perfil/audiência:
- Endereço/assunto/saudação por nome resolvidos no **profile** via `cpfHash` (`person.name.firstName`).

**Rota por evento (se adotada — evento `MRV_CRM_Pag_Arm_Pre_Processamento`, A CRIAR):**
- Endereço do e-mail:
  `@event{MRV_CRM_Pag_Arm_Pre_Processamento._mrv.identityEvents.email}`
- Número do SMS (userNumber):
  `@event{MRV_CRM_Pag_Arm_Pre_Processamento._mrv.identityEvents.phone}`

> **Lembrete `concat` (APLICÁVEL AQUI):** o assunto do e-mail 2 `NA_Pre_Processamento` combina **nome +
> texto fixo** (`%%NomeCliente__c%%, nova parcela processada`). Isso **exige `concat`** — nunca justaposição.
> Como o nome vem do **profile** (não do evento, regra global), o assunto no AJO fica:
> `concat(person.name.firstName, ", nova parcela processada")`.
> Nos demais pontos **nenhum concat é necessário**: assunto/preheader do e-mail 1 e o SMS são 100% estáticos.

## Gaps / pendências
- [ ] ⚠️ **Decidir o padrão de implementação**: Read Audience (recomendado — paridade com as irmãs "Jrn pag
  arm" e as réguas de armários) **ou** evento `dcsExternal` batch (**A CRIAR**: evento + `sourceEventType` +
  produtor). A spec cobre os dois.
- [ ] ⚠️ **Confirmar o schema completo da DE `Jornada_Pagamento_pre_processamento_cartao`** — o raw só expõe
  `Email`, `Celular` e `NomeCliente__c`. Verificar se há **CPF** (pré-requisito do `cpfHash` e da resolução
  de nome no profile) e se `NomeCliente__c` é primeiro nome ou nome completo.
- [ ] Reproduzir a query **`Resgata contatos pre processamento`** (contatos com nova parcela a processar) na
  definição da audiência (recorrência diária 07:15 BRT).
- [ ] Modelar o **engagement split** como **Reaction** (abertura do e-mail 1 `Pre_Processamento`, janela 1d).
- [ ] Configurar **STO nativo** (janela 24h) nos 2 pontos e validar vs Einstein STO.
- [ ] Reproduzir **`MultipleEntries`** (permitir reentrada) — atenção: **não** bloquear reentrada como nas
  réguas `SingleEntryAcrossAllVersions`.
- [ ] Implementar o assunto dinâmico do e-mail 2 via **`concat(person.name.firstName, ", nova parcela
  processada")`** (nome do profile).
- [ ] Migrar assets: 2 e-mails (74074 `Pre_Processamento`, 74078 `NA_Pre_Processamento`) e 1 SMS estático
  (asset 198416, short code `29520`).
- [ ] Confirmar no corpo HTML dos e-mails se há saudação por nome adicional (`%%Name%%`) — se sim, resolver
  via profile.
- [ ] Tratar as **irmãs** em specs próprias: `Pagamento nao processado` (`aed47930`) e `Pagamento processado`
  (`64b2274e`) — estrutura análoga (DE Audience), fluxos mais densos (com re-teste de status).

## Complexidade
🟡 **Média** — o fluxo é **linear e simples** (2 STO + 2 e-mails + 1 SMS + 1 Reação, **sem router e sem
re-teste de status**), mas a entrada Read Audience exige materializar a DE do Salesforce no AEP, o evento/
`sourceEventType`/de-para são **A CRIAR**, o `cpfHash` depende de confirmar o CPF na DE e o assunto do e-mail
2 precisa de `concat` com o nome resolvido via profile.
