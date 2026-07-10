# Instrução de mapeamento — JB_Renegociacao (Marketplace) · evento **A CRIAR** (API, NÃO-FTP)

> Jornada **não-FTP** do Marketplace: a entrada é `AutomationAudience` alimentada por uma **query SQL a cada
> 15 minutos** sobre DEs **sincronizadas do Salesforce** (`Transacao__c` + `Opportunity`) — um "CDC de
> transações" caseiro, com high-watermark. Cada registro é **uma transação de boleto de renegociação de
> armários** (link + vencimento próprios), e o mesmo perfil entra várias vezes (MultipleEntries). Por isso a
> tradução fiel para o AJO é **evento unitário por transação** (trilha API/streaming, como VA 01/VA 03) —
> **não** Read Audience (payload transacional não cabe em atributo de perfil) e **não** mold FTP-CSV.
>
> ⚠️ **Não confundir com as irmãs de nome parecido**: `Wpp - Renegociação` / `Whats - Renegociação Fev` /
> `Jornada de E-mail - Comunicado Renegociação` (BU **Cobrança Portal** — o id `ddf82802…` "Renegociação"
> citado em levantamentos anteriores é da pasta `mrv-cobranca-portal`, NÃO é esta jornada) nem com a
> `Renegociação` da **Sensia** (`sensiaRenegociacao`, dormente desde 2022 — que inclusive tem uma automation
> **homônima** `AU_Renegociacao` na BU Sensia).

## Identificação
| | |
|---|---|
| Jornada (SFMC) | **JB_Renegociacao** |
| journeyId | `69ddad5b-b140-4a22-8d9d-6ec735fe3d62` (v2, Published; `definitionId 8fa3600a-7bfc-4a92-9cc4-c953c2b5f47e`), BU `mrv-marketplace` |
| Tipo de entrada | `AutomationAudience` (`DEAudience-626e5cc7-eda6-afa9-cf77-10fe529166eb`) · entryMode **MultipleEntries** · high-watermark |
| Automation | **`AU_Renegociacao`** (`5822d942-5ffa-4b52-84e3-5b12fc5a7a80`) — a cada **15 min**: QUERY RENEG → DE → journey entry |
| Data Extension | **`Jornada_Renegociacao`** (`92b127fe-ebc3-f011-a5ab-d4f5ef66f377`) — populada por SQL sobre `ent.Transacao__c_Salesforce_1` ⋈ `ent.Opportunity_Salesforce_1` |
| Canal / assets | **só e-mail (2)**: "Peça Renegociação" (emailId `76796`, assunto "Novo boleto de armários emitido!", preheader "MRV \| Conclua o pagamento.") e "NA - Peça Renegociação" (emailId `76800`, assunto "Aqui está seu boleto de armários.", preheader "Atente-se ao vencimento \| MRV") |
| Evento AJO alvo | **A CRIAR** — não consta no export dos 66; nome proposto: **`Renegociacao_Marketplace`** *(proposta a confirmar)* |
| Volume (30d, mai–jun/2026) | 1.095 entradas · 530 perfis distintos · média **36,5 entradas/dia** — dias com entradas ≫ perfis (ex.: 22×1) confirmam **várias transações por perfil** |

## Envelope do evento (proposta — evento ainda não existe)
Todos os 66 eventos AJO do export qualificam por **`eventType = dcsExternal`** (valor real do
`ajo_event_map.json`) + `_mrv.sourceContext.sourceEventType`. Recomendação: seguir o mesmo padrão.

| Campo | Valor proposto | Status |
|---|---|---|
| `eventType` | `dcsExternal` | proposta (padrão real dos 66 eventos) |
| `_mrv.sourceContext.sourceEventType` | `marketplaceJbRenegociacao` | ⚠️ proposta (convenção BU+jornada do registro) — fixar ao criar o evento e refletir aqui |
| `_mrv.sourceContext.sourceSystem` | `APIEvent` (ou nome do produtor real) | ⚠️ proposta — depende de quem vai emitir o evento (ver gaps) |
| Evento AJO | `Renegociacao_Marketplace` | ⚠️ nome proposto — se o nome final for outro, **atualizar todas as fórmulas `@event{}` desta spec** |

## Identidade
A DE **não tem CPF** — a query só traz `Celular` (`MKT_CelularCliente__c`) e `Email` (`MKT_EmailCliente__c`):
- **Email → `_mrv.identityEvents.email`** — endereço dos 2 e-mails (é o canal da jornada).
- **Celular → `_mrv.identityEvents.phone`** — no SFMC só existe como default de `mobileNumber` (nenhum SMS/WhatsApp é enviado).
- ⚠️ **Pedir o CPF à origem**: a `Opportunity` do Salesforce tem o documento do cliente. Com CPF no payload,
  usar **`_mrv.identityEvents.cpfHash`** como PK (namespace `cpf_hash`; a Function gera o hash) — padrão MRV —
  com email/phone como identidades secundárias. Sem CPF, a PK cai para email/phone (fora do padrão).
- **`NomeCliente__c` NÃO vai no evento**: nome é resolvido no **PROFILE** (`person.name.firstName` /
  `person.name.fullName`) via cpfHash — mais um motivo para trazer o CPF.

## Fluxo AS-IS (SFMC)
A query de origem já pré-filtra: transações **modificadas em D-1** cujas oportunidades estão em
`StageName ∈ {Primeiro pagamento, Pagamento concluído}`. Dentro da jornada, **4 splits em cascata são só
elegibilidade** (um único caminho envia mensagem; todo o resto → Fim):

```
Entrada (DE Jornada_Renegociacao, a cada 15 min, high-watermark)
└─ Armarios?            [TipoRegistroNome__c = "Armario"]                     ≠ → Fim
   └─ Boletos e cartão? [FormaPagamento__c ∈ {"Boleto e Cartão","Boleto"}]    ≠ → Fim
      └─ Pago?          [StatusPagamento__c = "PAID"]                       PAID → Fim
         └─ Parcialmente Cancelado? [StatusPagamento__c ∈ {"PARTIAL_CANCELLED","FAILED"}] SIM → Fim
            └─ Renegociação?  [TipoParcela__c = "Renegociação"]               ≠ → Fim
               └─ EMAIL 1 "Peça Renegociação" (76796)
                  └─ Wait 12h
                     └─ Engagement split "Open Peça Renegociação" (abriu o EMAIL 1?)
                        ├─ Yes → Fim
                        └─ No  → Einstein STO (janela 24h) → EMAIL 2 "NA - Peça Renegociação" (76800) → Fim
```

Personalização dos 2 e-mails (mesmo conteúdo, assunto diferente): `%%NomeCliente__c%%`, `%%LinkBoleto__c%%`
(CTA do boleto) e `%%DataPrevista__c%%` formatada via AMPscript `FormatDate(@dataPrevista, "dd/MM/yyyy")`.
Os e-mails também têm um link **estático** de WhatsApp (api.whatsapp.com com mensagem pré-formatada) — é
link no HTML, não canal.

## Fluxo AJO equivalente
```
Evento Renegociacao_Marketplace (dcsExternal, 1 evento por transação)
  └─ [Condições de elegibilidade — ver nota] 
     └─ Email 1 "Peça Renegociação"
        └─ Wait 12h
           └─ Condition (Reaction: abriu Email 1?)
              ├─ Sim → Fim
              └─ Não → Wait (substituto do Einstein STO) → Email 2 "NA - Peça Renegociação" → Fim
```
**Nota — onde filtrar a elegibilidade**: recomenda-se que o **produtor já envie só transações elegíveis**
(a query AS-IS já filtra metade; os 4 splits são condições estáticas sobre o próprio registro). Se optar por
paridade 1:1, reproduzir os 4 splits como **Conditions sobre o payload do evento** (fórmulas abaixo) — todos
leem atributos do evento, **nenhum lookup externo**, portanto a jornada é publicável direto.

## Mapeamento dos campos → XDM
Base: colunas da DE `Jornada_Renegociacao` (17, vindas da QUERY RENEG). Não há de-para gerado para esta
jornada (não-FTP) — destinos abaixo seguem o modelo C# comum (`ContractBillingEvent`, `ProductOffer`);
leaves 🆕 precisam ser criados no field group / adicionados à extensão `_mrv` da BU Marketplace.

| Campo DE (origem SFMC) | XDM path | Grupo | 🆕? | Uso / observação |
|---|---|---|:--:|---|
| *(CPF — não existe na DE)* | `_mrv.identityEvents.cpfHash` | Identity | | ⚠️ pedir à origem; PK padrão MRV (namespace `cpf_hash`; a Function gera o hash) |
| `Email` (`MKT_EmailCliente__c`) | `_mrv.identityEvents.email` | Identity | | endereço dos 2 e-mails |
| `Celular` (`MKT_CelularCliente__c`) | `_mrv.identityEvents.phone` | Identity | | só default de canal no SFMC; nenhum envio SMS/WPP |
| `NomeCliente__c` | **Profile (via identidade) — não vai no evento** (`person.name.fullName` / `firstName`) | Profile | | personalização do corpo dos e-mails |
| `LinkBoleto__c` | `_mrv.contractBillingEvent.invoiceUrl` | contractBillingEvent | 🆕 | **CTA dos 2 e-mails** (link do boleto); criar leaf (naming alinhado a `invoiceStatus`) |
| `DataPrevista__c` | `_mrv.contractBillingEvent.dueDate` | contractBillingEvent | | vencimento do boleto; leaf já existe (Wedo/Cobrança); formatar dd/MM/yyyy no template |
| `StatusPagamento__c` | `_mrv.contractBillingEvent.invoiceStatus` | contractBillingEvent | | discriminador dos splits "Pago?" e "Parcialmente Cancelado?" (`PAID` / `PARTIAL_CANCELLED` / `FAILED` / …) |
| `TipoParcela__c` | `_mrv.contractBillingEvent.installmentType` | contractBillingEvent | 🆕 | discriminador do split "Renegociação?" (valor `"Renegociação"`) |
| `FormaPagamento__c` | `_mrv.contractBillingEvent.paymentMethod` | contractBillingEvent | 🆕 | discriminador do split "Boletos e cartão?" (`"Boleto"` / `"Boleto e Cartão"` / …) |
| `TipoRegistroNome__c` | `_mrv.contractBillingEvent.recordTypeName` | contractBillingEvent | 🆕 | discriminador do split "Armarios?" (valor `"Armario"`); vem da Opportunity |
| `Id` (transação) | `_mrv.contractBillingEvent.installmentId` | contractBillingEvent | | id único da transação/boleto (reuso do leaf de identificador de parcela) |
| `Name` (transação) | `_mrv.contractBillingEvent.installmentName` | contractBillingEvent | | não usado na jornada — opcional |
| `Oportunidade__c` | `_mrv.contractBillingEvent.contractId` | contractBillingEvent | | id da oportunidade (chave do join na origem) — opcional |
| `QuantidadeParcelas__c` | `_mrv.productOffer.installmentsQuantity` | productOffer | | não usado na jornada — opcional (leaf já existe na extensão Marketplace) |
| `StageName` | *(omitir — filtro aplicado na origem)* | — | | a query só deixa passar `Primeiro pagamento` / `Pagamento concluído` |
| `StatusTransacao__c` | *(omitir — não referenciado)* | — | | nem splits nem e-mails usam |
| `RecordTypeId` / `LastModifiedDate` | *(omitir — metadados da origem)* | — | | `LastModifiedDate` é só o gatilho do CDC |

- A extensão `_mrv` da BU Marketplace hoje só tem `physicalEvent`, `productOffer` e `ftpFileImport` —
  **adicionar o grupo comum `contractBillingEvent`** (já existe em Cobrança) ao schema/extensão Marketplace.
- Leaves 🆕 a criar em `contractBillingEvent`: `invoiceUrl`, `installmentType`, `paymentMethod`, `recordTypeName`.

## Fórmulas prontas para o AJO
Nome do evento **proposto** (`Renegociacao_Marketplace`) — se o nome criado for outro, trocar em TODAS as fórmulas.

| Uso | Fórmula |
|---|---|
| Endereço dos e-mails | `@event{Renegociacao_Marketplace._mrv.identityEvents.email}` |
| CTA "acessar boleto" (2 e-mails) | `@event{Renegociacao_Marketplace._mrv.contractBillingEvent.invoiceUrl}` |
| Vencimento no corpo | `@event{Renegociacao_Marketplace._mrv.contractBillingEvent.dueDate}` (aplicar formatação dd/MM/yyyy no template — equivalente do AMPscript `FormatDate`) |
| Split "Armarios?" | `@event{Renegociacao_Marketplace._mrv.contractBillingEvent.recordTypeName} = "Armario"` |
| Split "Boletos e cartão?" | `@event{Renegociacao_Marketplace._mrv.contractBillingEvent.paymentMethod} in ("Boleto", "Boleto e Cartão")` |
| Split "Pago?" (sai) | `@event{Renegociacao_Marketplace._mrv.contractBillingEvent.invoiceStatus} = "PAID"` |
| Split "Parcialmente Cancelado?" (sai) | `@event{Renegociacao_Marketplace._mrv.contractBillingEvent.invoiceStatus} in ("PARTIAL_CANCELLED", "FAILED")` |
| Split "Renegociação?" | `@event{Renegociacao_Marketplace._mrv.contractBillingEvent.installmentType} = "Renegociação"` |
| Nome do cliente (corpo) | `profile.person.name.firstName` / `profile.person.name.fullName` — resolvido no PROFILE via cpfHash; **não** usar `@event` para nome |

- **Lembrete concat (obrigatório)**: sempre que uma variável entrar junto de texto fixo no template, usar
  `concat(...)` — nunca justapor. Ex.:
  `concat("Seu boleto vence em ", @event{Renegociacao_Marketplace._mrv.contractBillingEvent.dueDate})` ·
  `concat("Olá, ", profile.person.name.firstName)`.
- O split de abertura ("Open Peça Renegociação") **não é fórmula de atributo**: no AJO é **Condition de
  Reação** ancorada no nó do Email 1 (evento de abertura) após o Wait de 12h.

## Gaps / pendências (⚠️) e checklist
- [ ] ⚠️ **Definir o produtor do evento**: hoje a "origem" é a QUERY RENEG dentro do SFMC (Salesforce Sync).
      No TO-BE, alguém precisa emitir 1 evento por transação elegível (integração Salesforce → AEP via
      streaming, ou serviço MRV que replique a regra da query). Sem isso não há entrada.
- [ ] Criar o evento AJO (nome proposto **`Renegociacao_Marketplace`**) e **fixar** `eventType`
      (`dcsExternal`) + `sourceEventType` (`marketplaceJbRenegociacao`) + `sourceSystem`; refletir aqui e nas fórmulas.
- [ ] ⚠️ **CPF não vem na query AS-IS** — incluir o documento do cliente no payload para manter a PK
      `cpfHash` (padrão MRV); sem ele, decidir PK alternativa (email/phone) e documentar a exceção.
- [ ] Adicionar o grupo **`contractBillingEvent`** à extensão `_mrv` do Marketplace e criar os 4 leaves 🆕
      (`invoiceUrl`, `installmentType`, `paymentMethod`, `recordTypeName`).
- [ ] Decidir **onde fica a elegibilidade** (produtor filtra × Conditions 1:1 no AJO) — recomendação: produtor
      filtra `StageName`/janela CDC (como a query) e o AJO mantém os 4 splits por paridade auditável.
- [ ] ⚠️ **Einstein STO (janela 24h)** antes do Email 2 não tem equivalente nativo 1:1 no AJO — substituir por
      Wait fixo (ex.: 24h) ou avaliar o Send-Time Optimization do AJO, se disponível na licença.
- [ ] Migrar os 2 assets de e-mail (`76796` "Peça Renegociação", `76800` "NA - Peça Renegociação"; triggeredSendKeys
      `234367`/`234368`): converter AMPscript (`FormatDate` dd/MM/yyyy, `%%NomeCliente__c%%`, `%%LinkBoleto__c%%`)
      para personalização AJO com as fórmulas acima (com `concat` onde houver texto+variável), preservando o
      link estático de WhatsApp e o tracking dos CTAs.
- [ ] Validar a cadência: SFMC entra a cada 15 min (high-watermark); com evento unitário streaming a latência
      fica igual ou melhor — confirmar SLA do produtor.
- [ ] ⚠️ Conferir se a DE tem colunas além das 17 da query (a query faz UPDATE na DE; não há sinal de outras
      colunas, mas confirmar no Contact Builder antes de congelar o payload).

## Complexidade
**🟡 Média** — o fluxo de mensagens é simples (2 e-mails + reação de abertura, sem lookups externos), mas a
entrada não tem padrão pronto: é um CDC de transações do Salesforce via query a cada 15 min, exigindo definir
o **produtor do evento unitário (A CRIAR)**, trazer CPF ao payload e substituir o Einstein STO.
