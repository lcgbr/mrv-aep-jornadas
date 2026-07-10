# Instrução de mapeamento — Jrn pag arm - Pagamento nao processado · evento **A CRIAR — `MRV_CRM_Pag_Arm_Nao_Processado`** (Read Audience / batch diário)

> Jornada transacional de **móveis planejados (armários)** do Marketplace que trata a **falha no
> processamento do cartão de crédito**. **Não é FTP nem API Event**: a entrada é `AutomationAudience`
> (DE Audience). A automation **`Jornada pagamento não processado`** (`d9125f9a`) roda SQL diário, grava a
> DE **`Jornada_Pagamento_pag_nao_processado`** e injeta na jornada. No AJO o padrão equivalente é
> **Read Audience** (mesmo padrão das irmãs da família "Jrn pag arm" e das réguas transacionais de armários).
> ⚠️ **Não confundir com as jornadas IRMÃS** da mesma família "pagamento armários":
> **"Jrn pag arm - Pagamento processado"** (`64b2274e`, automation `a290bf8c`, DE `Jornada_Pagamento_pag_processado`)
> e **"Jrn pag arm - Pre processamento cartao"** (`f345d47f`, automation `99569c91`, DE
> `Jornada_Pagamento_pre_processamento_cartao`). Há ainda as primas de boleto ("Boleto geral" `99d8e3e3`,
> "Boleto mensal" `df7ed4de`), fora deste escopo.

## Identificação
| | |
|---|---|
| Jornada SFMC | **Jrn pag arm - Pagamento nao processado** (`aed47930-545f-467b-a96c-594e99992250`, BU `mrv-marketplace`) — `Published` v1, `entryMode = MultipleEntries` (permite reentrada) |
| Entrada SFMC | `AutomationAudience` / **DE Audience** (eventDefinition `ea5027fb-1093-44e8-b196-bfb0ff834c8a`, key `DEAudience-a2758edf-5b5e-5088-a5c7-d975f2d5c713`) |
| Automation alimentadora | **`Jornada pagamento não processado`** (`d9125f9a-bc6a-481f-89f0-f71933ff1546`) — diária **07:15 BRT** (`E. South America Standard Time`, `FREQ=DAILY`) |
| Passos da automation | 1) SQL `Resgata contatos pagamento não processado` → DE de entrada · 2) SQL `Resgata contatos que passaram pela jornada` → DE **`Historico_pag_nao_processado`** (dedupe/histórico, 108 linhas) · 3) atividade de Jornada (`objectTypeId 952`) que injeta a DE |
| DE de entrada | **`Jornada_Pagamento_pag_nao_processado`** (`48244d1f-485b-f111-ba81-48df37e63b1a`, key `7FEBB2F0-0A49-492E-A86C-8E1B643D510C`) |
| Canais | **4 e-mails** (ids 74058, 74059, 74061, 74062) + **2 SMS** (assets 198293 e 198300, short code `29520`) |
| Identidade AJO | `cpfHash` (namespace `cpf_hash` — a Function gera o hash) |
| Evento AJO | **A CRIAR** — não está no export dos 66 (nenhum evento `marketplace*` de pagamento no `ajo_event_map.json`) |
| Ficha / de-para | **Não existe** (jornada fora do site, sem `sourceEventType` registrado e sem mapper C#) |

## Envelope do evento
No padrão **Read Audience não há evento AJO**: a jornada lê uma audiência do Unified Profile e a decisão
(`StatusPagamento__c = PAID`) usa **atributo de perfil/audiência**, não `@event{}`. **Não existe** entrada
desta jornada no `ajo_event_map.json` — os 7 eventos `marketplace*` existentes são de outras jornadas
(ex.: `marketplaceDisparoDivulgacaoArmariosWpp` → `MRV_FTP_Disparo_Divulg_Armario`, WhatsApp, distinta).

Se a implementação optar pela **rota por evento** (batch diário publica 1 evento por registro da DE), o
envelope precisa ser **criado** — proposta ⚠️ **a confirmar**:

| Campo | Valor proposto |
|---|---|
| Evento AJO | **`MRV_CRM_Pag_Arm_Nao_Processado`** (**A CRIAR** — nome a validar no padrão do time) |
| `eventType` | `dcsExternal` (mesmo tipo dos demais eventos `marketplace*` no `ajo_event_map.json`) |
| `sourceEventType` | `marketplacePagamentoArmarioNaoProcessado` (**A CRIAR**) |
| `sourceSystem` | `Salesforce` (proposta — `StatusPagamento__c` é campo custom `__c` do CRM, não `FTPFileImport`) |

## Fluxo AS-IS (SFMC)
```
Entrada diária 07:15 BRT (DE Jornada_Pagamento_pag_nao_processado, entryMode MultipleEntries)
└─ STOWAIT-1 · Einstein STO 24h
   └─ EMAILV2-1 "Pag_NAO_Processado" (id 74058)
        assunto "Erro no processamento do cartão." / preheader "MRV | Móveis planejados."
      └─ Wait 10min (WAITBYDURATION-1)
         └─ SMSSYNC-1 "SMS_Pag_NAO_Processado" (asset 198293, code 29520, texto estático):
              "MRV | FALHA no processamento do seu CARTAO de credito.
               Verifique os dados informados e tente realizar a compra novamente."
            └─ Wait 1d (WAITBYDURATION-2)
               └─ ENGAGEMENTSPLITV2-1 "abriu EMAILV2-1?"
                  ├─ Sim → Wait 1d (WAITBYDURATION-3) → MULTICRITERIADECISIONV2-1
                  └─ Não → STO 24h (STOWAIT-2) → EMAILV2-2 "NA_Pag_NAO_Processado" (id 74059)
                             assunto "Falha ao processar compra 😢" / preheader "MRV | Verifique dados do cartão."
                           → Wait 1d (WAITBYDURATION-3) → MULTICRITERIADECISIONV2-1
                  └─ MULTICRITERIADECISIONV2-1 · StatusPagamento__c = "PAID"?
                     ├─ "Pago" → STO 24h (STOWAIT-3)
                     │    └─ EMAILV2-3 "Pag_Process_Imediato" (id 74061)
                     │         assunto "MRV | Pagamento processado" / preheader "Agora sim!"
                     │       └─ Wait 10min (WAITBYDURATION-4)
                     │          └─ SMSSYNC-2 "SMS_Pag_Process_Imediato" (asset 198300, texto estático):
                     │               "MRV | Compra de moveis planejados aprovada.
                     │                Seu CARTAO de credito foi PROCESSADO e as parcelas serao
                     │                cobradas mensalmente na fatura."
                     │             └─ Wait 1d (WAITBYDURATION-5)
                     │                └─ ENGAGEMENTSPLITV2-2 "abriu EMAILV2-3?"
                     │                   ├─ Sim → Fim
                     │                   └─ Não → STO 24h (STOWAIT-4)
                     │                            → EMAILV2-4 "NA_Pag_Process_Imediato" (id 74062)
                     │                               assunto "MRV | Compra aprovada ✅" / preheader "Cartão de crédito processado."
                     │                            → Fim
                     └─ "Remainder" (não pago) → Fim (sem envio)
```
- **Endereços de canal (defaults da jornada):** e-mail = campo **`Email`** da DE
  (`{{Event.DEAudience-….\"Email\"}}`); celular = campo **`Celular`** da DE
  (`{{Event.DEAudience-….\"Celular\"}}`).
- **Personalização:** assuntos, preheaders e os 2 SMS são **estáticos** (nenhum `%%campo%%` no raw). Confirmar
  no corpo HTML dos e-mails se há saudação por nome (padrão da família usa `%%Name%%`).
- **Lógica da jornada:** braço de "falha" (e-mail+SMS de erro, com fallback "não abriu") e, no dia seguinte,
  um **re-teste do status**: se o cliente **regularizou** (`StatusPagamento__c = PAID`), recebe a trilha de
  "pagamento processado" (e-mail+SMS de aprovação + fallback "não abriu"); senão sai da jornada.

## Fluxo AJO equivalente
```
Read Audience (recorrência diária ~07:15 BRT, keyNamespace = cpf_hash)
  audiência ≡ Jornada_Pagamento_pag_nao_processado (falha de cartão do dia; dedupe via Historico_*)
  └─ STO 24h → Email 1 (falha) → Wait 10min → SMS 1 → Wait 1d → Reaction "abriu Email 1?"
       Não → STO 24h → Email 2 (falha NA) → (junta) Wait 1d
     └─ Condition · atributo paymentStatus
          = "PAID"  → STO 24h → Email 3 (aprovado) → Wait 10min → SMS 2 → Wait 1d
                       → Reaction "abriu Email 3?" · Não → STO 24h → Email 4 (aprovado NA) → Fim
          else       → Fim
```
- **Engagement splits** → condição de **Reação** (abertura do e-mail referenciado, janela de espera de 1 dia)
  — não é Optimize de atributo.
- **Einstein STO ×4** → Send-Time Optimization nativo do AJO (janela 24h) — comportamento a validar.
- **MultiCriteria (`StatusPagamento__c = PAID`)** → condição sobre **atributo de perfil/audiência**
  (rota Read Audience) ou sobre `@event{MRV_CRM_Pag_Arm_Nao_Processado._mrv.paymentEvent.status}` (rota por
  evento). O valor comparado é o literal **`PAID`**.
- **`MultipleEntries`** → **permitir reentrada** na configuração da jornada AJO (diferente das réguas
  `SingleEntryAcrossAllVersions`); o dedupe operacional é feito upstream pela DE `Historico_pag_nao_processado`.

## Mapeamento dos campos → XDM
Campos **confirmados no raw** da DE `Jornada_Pagamento_pag_nao_processado`: `Email`, `Celular` e
`StatusPagamento__c` (usado na `MULTICRITERIADECISIONV2-1`). Os demais (CPF, nome) **não aparecem** no raw da
jornada e precisam ser confirmados na definição da DE. Não há de-para nem mapper C# — o grupo
`_mrv.paymentEvent` é **proposta nova** (🆕 todos os leaves). Na rota Read Audience os mesmos dados precisam
existir como **atributos de perfil** (coluna "Uso").

| Campo DE/SQL | XDM (evento proposto) | Uso no AJO |
|---|---|---|
| CPF (⚠️ **não confirmado na DE** — validar) | `_mrv.identityEvents.cpfHash` 🆕 | **identidade PK** (namespace `cpf_hash`; a Function gera o hash) |
| `Email` | `_mrv.identityEvents.email` | endereço do canal e-mail (perfil: `personalEmail.address`) |
| `Celular` | `_mrv.identityEvents.phone` 🆕 | número do canal SMS (regra global **telefone/celular → `phone`**; perfil: `mobilePhone.number`) |
| `StatusPagamento__c` | `_mrv.paymentEvent.status` 🆕 | **discriminador da MultiCriteria** (compara com `"PAID"`) |
| Nome / primeiro nome (se existir na DE) | — (não vai no evento) | resolvido no **PROFILE** via `cpfHash` → `person.name.firstName` / `person.name.fullName` (eventual saudação `%%Name%%`) |
| — (fixo) | `_mrv.sourceContext.sourceEventType` = `marketplacePagamentoArmarioNaoProcessado` 🆕 | roteamento de ingestão |
| — (fixo) | `_mrv.sourceContext.sourceSystem` = `Salesforce` 🆕 | origem |

> Nota: já existe no schema o grupo `_mrv.contractBillingEvent` (billing de Cobrança, com `invoiceStatus`,
> `paymentDate` etc.). Ele é de **outro contexto** (boleto/contrato). Para o status de cartão do Marketplace
> recomenda-se o grupo **`_mrv.paymentEvent`** (🆕); reusar `contractBillingEvent` é opção a validar com o time.

## Fórmulas prontas para o AJO
> ⚠️ Evento **A CRIAR**: as fórmulas abaixo assumem o nome proposto **`MRV_CRM_Pag_Arm_Nao_Processado`**.
> Ajuste o nome **por completo** quando o evento for criado — **nunca** abrevie o evento nem o path.

**Rota Read Audience (recomendada):** não há `@event{}` — a condição e a personalização leem o perfil/audiência:
- Condition "Pago": `profile._mrv.paymentEvent.status = "PAID"` *(path do atributo de perfil a confirmar
  quando o schema de profile for definido)*.
- Saudação (se houver): `person.name.firstName` do **profile** (via `cpfHash`).

**Rota por evento (se adotada — evento `MRV_CRM_Pag_Arm_Nao_Processado`, A CRIAR):**
- Condition "Pago" (MultiCriteria):
  `@event{MRV_CRM_Pag_Arm_Nao_Processado._mrv.paymentEvent.status} = "PAID"`
- Endereço do e-mail:
  `@event{MRV_CRM_Pag_Arm_Nao_Processado._mrv.identityEvents.email}`
- Número do SMS (userNumber):
  `@event{MRV_CRM_Pag_Arm_Nao_Processado._mrv.identityEvents.phone}`

> **Lembrete `concat`:** sempre que texto fixo for combinado com uma variável numa mesma expressão, use
> `concat("texto ", @event{MRV_CRM_Pag_Arm_Nao_Processado._mrv.paymentEvent.status})` — nunca justaposição.
> No estado atual **nenhum concat é necessário**: os 2 SMS são 100% estáticos e os assuntos/preheaders dos 4
> e-mails não usam variáveis. Ex. (só se algum texto passar a exibir o status):
> `concat("Status do pagamento: ", @event{MRV_CRM_Pag_Arm_Nao_Processado._mrv.paymentEvent.status})`.

## Gaps / pendências
- [ ] ⚠️ **Decidir o padrão de implementação**: Read Audience (recomendado — paridade com as irmãs "Jrn pag
  arm" e as réguas de armários) **ou** evento `dcsExternal` batch (**A CRIAR**: evento +
  `sourceEventType` + produtor). A spec cobre os dois.
- [ ] ⚠️ **Confirmar o schema completo da DE `Jornada_Pagamento_pag_nao_processado`** — o raw só expõe
  `Email`, `Celular` e `StatusPagamento__c`. Verificar se há **CPF** (pré-requisito do `cpfHash` e da
  resolução de nome no profile) e campo de nome.
- [ ] ⚠️ **Valores possíveis de `StatusPagamento__c`** — a MultiCriteria só testa `= "PAID"`; confirmar os
  demais estados (ex.: `PENDING`, `FAILED`) e o encoding exato do literal antes de fixar a condição.
- [ ] Reproduzir a query **`Resgata contatos pagamento não processado`** (falha de cartão do dia) e o
  **dedupe** feito por `Historico_pag_nao_processado` na definição da audiência (recorrência diária 07:15 BRT).
- [ ] Modelar os **2 engagement splits** como **Reaction** (abertura do e-mail 1 e do e-mail 3, janela 1d).
- [ ] Configurar **STO nativo** (janela 24h) nos 4 pontos e validar vs Einstein STO.
- [ ] Reproduzir **`MultipleEntries`** (permitir reentrada) — atenção: **não** bloquear reentrada como nas réguas.
- [ ] Migrar assets: 4 e-mails (74058 "Pag_NAO_Processado", 74059 "NA_Pag_NAO_Processado", 74061
  "Pag_Process_Imediato", 74062 "NA_Pag_Process_Imediato") e 2 SMS estáticos (198293 falha; 198300 aprovado),
  short code `29520`.
- [ ] Confirmar no corpo HTML dos e-mails se há saudação por nome (`%%Name%%`) — se sim, resolver via profile.
- [ ] Tratar as **irmãs** em specs próprias: "Jrn pag arm - Pagamento processado" (`64b2274e`) e "Jrn pag arm -
  Pre processamento cartao" (`f345d47f`) — estrutura análoga (DE Audience), DEs/queries distintas.

## Complexidade
🔴 **Alta** — apesar da entrada simples (Read Audience / DE Audience), o fluxo é **denso e ramificado**: 4
e-mails + 2 SMS, 4 Einstein STO, 2 Reactions e um **re-teste de status** (`StatusPagamento__c = PAID`) que
bifurca em uma segunda trilha completa; soma-se a isso a ausência de de-para/mapper/evento (tudo **A CRIAR**)
e a dependência de materializar o status de pagamento do cartão (origem Salesforce) no AEP.
