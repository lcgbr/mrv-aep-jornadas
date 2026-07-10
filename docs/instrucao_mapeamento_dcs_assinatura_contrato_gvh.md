# Instrução de mapeamento — Assinatura de Contrato (Gestão Vendas H) · evento **MRV_FTP_Assinatura_Contrato_GVH** (DCS / Salesforce Data event · e-mail)

> ⚠️ **Prefixo corrigido `ftp_wa_` → `dcs_`.** O candidato da âncora (`Aut_assinatura_contrato_wpp`
> `f6b3103b-36cb-4fc9-a006-ea9769fd87de`) é uma **automation de query** da BU **`mrv-gestao-vendas-p`** — jornada
> **IRMÃ**, não esta. A jornada oficial "Assinatura de Contrato (Gestão Vendas H)" é `374b442a-…` da BU
> `mrv-gestao-vendas-h`, e **NÃO é WhatsApp**: é uma jornada de **e-mail** (3 e-mails) disparada por
> **Salesforce Object Trigger** (Salesforce Data event sobre `Opportunity`), **não** por FTP. Também **não confundir**
> com `marketingCreditoWhatsContratoPendenteAssinatura` (evento `MRV_FTP_Contrato_Pend_Assin`, BU `mrv-marketing-credito`)
> nem com `sensiaPosAssinatura` (`MRV_FTP_Jor_Pos_Assin`, BU Sensia).

## Identificação
| | |
|---|---|
| Jornada (SFMC) | **Assinatura de Contrato** (Gestão Vendas H) |
| journeyId | `374b442a-4072-40ba-bfe7-b1c089bc19a5` · BU `mrv-gestao-vendas-h` |
| Tipo de entrada | **SalesforceObjectTriggerV2** (Salesforce Data event · objeto `Opportunity`, Created/Updated) — **NÃO é FTP nem WhatsApp** |
| eventDefinitionKey | `SalesforceObjc12339d35bbb603766194d66ce2810c6` |
| Data Extension (trigger) | `Assinatura de Contrato - 2022-07-04T084235575` (`c51a9d88-a7fb-ec11-ba38-48df37e63d27`) |
| Contact key | `Opportunity:Account:PersonContactId` (PersonAccount) |
| Canal | **só e-mail** (3× `EMAILV2`); endereço default = `Opportunity:Account:PersonEmail` |
| Assets de e-mail | `29932` "Proposta Aceita – SEM BOLETO" · `30136` "Vencimento Proposta – NOVA" · `30137` "Proposta Expirada – NOVA" |
| Evento AJO alvo | **`MRV_FTP_Assinatura_Contrato_GVH`** — **A CRIAR** (não consta no export dos 65 eventos) |
| Status SFMC | `Published` · `MultipleEntries` · Production |

## Envelope do evento (proposta — a confirmar na criação)
Este evento **ainda não existe** no `ajo_event_map.json`. As duas jornadas irmãs de "assinatura/contrato" já
existentes usam **`eventType = dcsExternal`** (streaming), então a proposta segue a mesma família:

| Campo do envelope | Valor proposto | Observação |
|---|---|---|
| `eventType` | **`dcsExternal`** | igual às irmãs `MRV_FTP_Contrato_Pend_Assin` e `MRV_FTP_Jor_Pos_Assin` (ambas `dcsExternal`) |
| `_mrv.sourceContext.sourceEventType` | `gestaoVendasHAssinaturaContrato` | camelCase da jornada (proposto) |
| `_mrv.sourceContext.sourceSystem` | `Salesforce` (Sales Cloud) | origem é Salesforce Object Trigger, **não** `FTPFileImport` |
| Evento AJO | `MRV_FTP_Assinatura_Contrato_GVH` | mantém o prefixo `MRV_FTP_` da família (mesmo sendo `dcsExternal`), sufixo `_GVH` p/ desambiguar do evento de marketing-credito |

> ⚠️ Os valores de `eventType` + `sourceEventType` acima têm de **bater com a condição de qualificação** do
> evento no AJO (fieldRefs `json://eventType` e `json://_mrv/sourceContext/sourceEventType`). Fixe-os na criação
> e reflita aqui. **Ingestão NÃO é o mold FTP/CSV** (`CsvBlobProcessor`): é um produtor Salesforce/streaming —
> confirmar o mecanismo (Salesforce Source Connector → streaming, ou webhook que posta o evento no AEP).

## Fluxo AS-IS (SFMC)
Entrada (Salesforce Object Trigger, `Opportunity`) com filtro de qualificação:
`StageName = "Assinatura do Contrato"` **E** `UltimoBoletoEnviadoAlterado__c = False` **E** `UltimoBoleto__c IS NULL`
**E** `DataLimiteContrato__c` preenchida **E** (`Marca__c = 1` **OU** `Marca__c IS NULL`) **E** `AccountId` preenchido.

```
Entrada (Opportunity em "Assinatura do Contrato", sem último boleto)
  └─ E-mail 29932  "Jornada Contrato Proposta Aceita - SEM BOLETO"   (imediato)
       └─ WAIT até 2 dias ANTES de Opportunity:DataLimiteContrato__c
            └─ DECISÃO "Assinou contrato?"  (re-consulta Salesforce: Opportunity.Id = evento E UltimoBoleto__c IS NULL)
                 ├─ ainda NÃO assinou (default) → E-mail 30136 "Vencimento Proposta - NOVA"
                 │     └─ WAIT até 3 dias DEPOIS de Opportunity:DataLimiteContrato__c
                 │          └─ DECISÃO "Assinou contrato?" (mesma re-consulta)
                 │               ├─ ainda NÃO (default) → E-mail 30137 "Proposta Expirada - NOVA" → Wait 1min → Fim
                 │               └─ já assinou (remainder) → Fim
                 └─ já assinou (remainder) → Fim
```

- **3 e-mails**, **2 decision splits** ("Assinou contrato?"), **2 waits por atributo** (relativos a
  `DataLimiteContrato__c`) e waits-filler de 1 min (descartáveis no AJO).
- ⚠️ **As duas decisões re-consultam o Salesforce AO VIVO** (objeto relacionado `Opportunity_Salesforce_2`,
  `Id = @event Opportunity:Id` **E** `UltimoBoleto__c IS NULL`) — ou seja, testam se o cliente **ainda não
  gerou o boleto/assinou** *no momento da decisão*. Esse dado **não está no payload de entrada** → é o
  principal ponto de complexidade da migração (ver Complexidade).

## Mapeamento dos campos → XDM
Identidade segue as regras globais MRV (telefone→`phone`, CPF→`cpfHash`, nome→**Profile** via `cpfHash`).
Campos de negócio reusam `_mrv.contractBillingEvent` onde há leaf equivalente; leaves novos marcados 🆕.

| Campo (DE / Salesforce) | XDM path | Grupo | 🆕? | Uso / observação |
|---|---|:--:|:--:|---|
| `Opportunity:Account:PersonMobilePhone` | `_mrv.identityEvents.phone` | Identity | | telefone (regra global; unificar as 3 variantes de celular) |
| `Opportunity:Account:Celular__c` | `_mrv.identityEvents.phone` | Identity | | mesma leaf (unificado) |
| `Opportunity:Account:CelularSemFormatacao__c` | `_mrv.identityEvents.phone` | Identity | | mesma leaf (sem formatação) |
| `Opportunity:Account:CPF__pc` | `_mrv.identityEvents.cpfHash` | Identity | | **PK** (namespace `cpf_hash`; a Function gera o hash) |
| `Opportunity:Account:PersonEmail` | `_mrv.identityEvents.email` | Identity | | **endereço do canal e-mail** |
| `Opportunity:Account:AtualizaEmail__c` | `_mrv.identityEvents.email` (fallback) | Identity | | e-mail alternativo — confirmar precedência |
| `Opportunity:Account:PersonContactId` | *(identity Salesforce / contactKey)* | Identity | 🆕 | chave de contato SFMC; confirmar namespace |
| `Opportunity:Account:Id` | *(identity crmId Salesforce)* | Identity | 🆕 | Account Id Salesforce |
| `Opportunity:Account:FirstName` | `person.name.firstName` **(Profile, via cpfHash)** | Profile | | **NÃO vai no evento** (regra global) |
| `Opportunity:Account:PrimeiroNome__c` | `person.name.firstName` **(Profile, via cpfHash)** | Profile | | idem — resolvido no perfil |
| `Opportunity:Id` | `_mrv.contractBillingEvent.opportunityId` | contractBillingEvent | 🆕 | **id da Opportunity — chave da re-consulta "Assinou?"** |
| `Opportunity:StageName` | `_mrv.contractBillingEvent.opportunityStage` | contractBillingEvent | 🆕 | qualificador de entrada (= "Assinatura do Contrato") |
| `Opportunity:DataLimiteContrato__c` | `_mrv.contractBillingEvent.contractDeadlineDate` | contractBillingEvent | 🆕 | **base dos 2 waits** (2 dias antes / 3 dias depois) |
| `Opportunity:UltimoBoleto__c` | `_mrv.contractBillingEvent.installmentId` | contractBillingEvent | | **discriminador da decisão** (IS NULL = ainda não gerou boleto) |
| `Opportunity:UltimoBoletoEnviadoAlterado__c` | `_mrv.contractBillingEvent.lastInvoiceChangedFlag` | contractBillingEvent | 🆕 | flag booleana de qualificação de entrada |
| `Opportunity:UltimoBoletoDataVencimento__c` | `_mrv.contractBillingEvent.dueDate` | contractBillingEvent | | vencimento do boleto |
| `Opportunity:DiaPagamentoBoleto__c` | `_mrv.contractBillingEvent.paymentDay` | contractBillingEvent | 🆕 | dia de pagamento |
| `Opportunity:ValorParcelaBoleto__c` | `_mrv.contractBillingEvent.installmentAmount` | contractBillingEvent | | valor da parcela |
| `Opportunity:PropostaViagenteDataValidade__c` | `_mrv.contractBillingEvent.proposalValidityDate` | contractBillingEvent | 🆕 | validade da proposta |
| `Opportunity:UrlJornada__c` | `_mrv.contractBillingEvent.portalUrl` | contractBillingEvent | | link usado nos e-mails |
| `Opportunity:Unidade__r:NomeReduzidoEmpreendimento__c` | `_mrv.condominiumEvent.buildingName` | condominiumEvent | 🆕 | nome do empreendimento (criar leaf) |
| `Opportunity:Unidade__r:BlocoNome__c` | `_mrv.condominiumEvent.blockName` | condominiumEvent | 🆕 | bloco |
| `Opportunity:Unidade__r:Numero__c` | `_mrv.condominiumEvent.unitNumber` | condominiumEvent | 🆕 | número da unidade |
| `Opportunity:Unidade__r:Id` | `_mrv.condominiumEvent.unitId` | condominiumEvent | 🆕 | id da unidade |

> Leaves já existentes no C# (`ContractBillingEvent`): `installmentId`, `installmentAmount`, `dueDate`,
> `portalUrl`. Os demais em `contractBillingEvent`/`condominiumEvent` marcados 🆕 precisam ser criados nos
> field groups do schema AEP.

## Fórmulas AJO (`@event{}` — nome COMPLETO do evento + path COMPLETO)
Evento proposto `MRV_FTP_Assinatura_Contrato_GVH` (A CRIAR — trocar pelo nome fixado na criação):

- Endereço do canal e-mail:
  `@event{MRV_FTP_Assinatura_Contrato_GVH._mrv.identityEvents.email}`
- Data-base dos waits (2 dias antes / 3 dias depois):
  `@event{MRV_FTP_Assinatura_Contrato_GVH._mrv.contractBillingEvent.contractDeadlineDate}`
- Chave da decisão "Assinou contrato?" (id da Opportunity):
  `@event{MRV_FTP_Assinatura_Contrato_GVH._mrv.contractBillingEvent.opportunityId}`
- Valor da parcela / vencimento / link (personalização dos e-mails):
  `@event{MRV_FTP_Assinatura_Contrato_GVH._mrv.contractBillingEvent.installmentAmount}`
  `@event{MRV_FTP_Assinatura_Contrato_GVH._mrv.contractBillingEvent.dueDate}`
  `@event{MRV_FTP_Assinatura_Contrato_GVH._mrv.contractBillingEvent.portalUrl}`
- Empreendimento/unidade (se usados no corpo):
  `@event{MRV_FTP_Assinatura_Contrato_GVH._mrv.condominiumEvent.buildingName}`

**Lembrete de `concat` (texto fixo + variável):** sempre que a variável for concatenada a texto no e-mail,
usar `concat`, ex.:
- `concat("Parcela de R$ ", @event{MRV_FTP_Assinatura_Contrato_GVH._mrv.contractBillingEvent.installmentAmount})`
- `concat("A reserva da unidade ", @event{MRV_FTP_Assinatura_Contrato_GVH._mrv.condominiumEvent.buildingName}, " irá expirar.")`
- Saudação com **primeiro nome**: NÃO usar `@event` — o nome vem do **Profile** (`person.name.firstName`,
  resolvido via `cpfHash`). Ex.: `concat("Olá ", <profile person.name.firstName>, "!")`.

## Gaps / pendências (⚠️) e checklist
- [ ] ⚠️ **Criar o evento `MRV_FTP_Assinatura_Contrato_GVH`** no AJO e fixar `eventType` (proposto `dcsExternal`) + `sourceEventType` (`gestaoVendasHAssinaturaContrato`).
- [ ] ⚠️ **Decisão "Assinou contrato?" = re-consulta ao Salesforce ao vivo** (`UltimoBoleto__c IS NULL` na Opportunity atual). Isso **não** está no payload de entrada. Definir a estratégia no AJO: (a) atributo de Profile "contrato assinado / último boleto" alimentado por um feed contínuo do Salesforce e testado na Condition, ou (b) reentrada/atualização do evento quando o boleto é gerado. Sem isso, os 2 splits não são reproduzíveis.
- [ ] ⚠️ **Ingestão NÃO-FTP**: confirmar produtor/mecanismo (Salesforce Source Connector → streaming, ou endpoint que posta o evento). Não usar o mold CSV/`CsvBlobProcessor`.
- [ ] Confirmar identidade primária: **CPF (`cpfHash`)** como PK (padrão MRV) e o papel de `PersonContactId`/`Account:Id` como identidades secundárias (namespaces a definir).
- [ ] Migrar os **3 assets de e-mail** (29932, 30136, 30137) e mapear cada variável AMPscript (`%%Opportunity:…%%`) do corpo para o `@event{}`/Profile correspondente.
- [ ] Criar os leaves 🆕 (`opportunityId`, `opportunityStage`, `contractDeadlineDate`, `paymentDay`, `proposalValidityDate`, `lastInvoiceChangedFlag` em `contractBillingEvent`; `buildingName`, `blockName`, `unitNumber`, `unitId` em `condominiumEvent`) e confirmar tipos (datas/decimais/boolean).
- [ ] Reproduzir os **waits por atributo** (2 dias antes / 3 dias depois de `contractDeadlineDate`) como wait-until-date sobre o campo do evento.
- [ ] Confirmar o filtro de entrada (`StageName`, `UltimoBoletoEnviadoAlterado__c=False`, `UltimoBoleto__c IS NULL`, `Marca__c IN {1, null}`) → condição de qualificação do evento/entry no AJO.

## Complexidade
🔴 **Alta** — evento **A CRIAR** (entrada Salesforce Data event, não-FTP) somado a **2 decision splits que
re-consultam o Salesforce ao vivo** ("ainda não gerou boleto?") — dado ausente do payload, exigindo atributo
de Profile alimentado por feed contínuo ou lógica de reentrada; além de 2 waits por atributo de data e 3 assets
de e-mail a migrar.
