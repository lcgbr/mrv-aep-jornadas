# Instrução de mapeamento — AT - Reagendamento pelo cliente ou backoffice · evento **A CRIAR** (API, NÃO-FTP)

> Spec **dedicada** porque esta jornada **não é FTP**: a entrada é **APIEvent** (mesma trilha da
> VA 03 Revistoria / VA 01 Liberação do Bloco — ver `instrucao_mapeamento_api_vistoria_antecipada.md` e
> `instrucao_mapeamento_api_va01_liberacao_bloco.md`). O produtor (**OracleOIC**) dispara o evento a cada
> reagendamento de visita/atendimento feito pelo cliente ou pelo backoffice; a jornada envia **confirmação
> por e-mail** e, 1 dia antes da data agendada, **lembrete e-mail + SMS**. **Não** usar molds/CSV das FTP.

> ⚠️ **NÃO confundir com a jornada irmã** `Jornada WhatsApp VA Reagendamento`
> (`01745956-f5fb-406f-91c2-a886227d2f73`, automation `add10a20-459f-4fa5-ac5d-fa172926fb05`): aquela é
> **FTP + WhatsApp** (template `chaves_va_reagendamento_prd`, bot MariaRosa), tem de-para e mapper C#
> próprios (`sourceEventType = assistenciaTecnicaWhatsappVaReagendamento`,
> `AtWhatsappVaReagendamentoAepMapper`) e segue a trilha FTP. A âncora inicial do escopo apontava para ela,
> mas o nome oficial da planilha ("AT - Reagendamento pelo cliente ou backoffice") corresponde **a esta**
> jornada API (`aa22fb2e`) — confirmado no dump SFMC, nos docs e no pipeline C# dedicado.

## Identificação
| | |
|---|---|
| Jornada (SFMC) | **AT - Reagendamento pelo cliente ou backoffice** |
| journeyId | `aa22fb2e-f949-40d9-95cb-8d7ea3d7f9ee` (BU `mrv-assistencia-tecnica`) |
| Tipo de entrada | **APIEvent** (`eventDefinitionKey = APIEvent-5c002914-4408-35de-78db-7c42cdbc589c` · eventDefinitionId `7c921a8a-68c1-4858-ac5a-4f1e1071defc`) · entryMode `MultipleEntries`, sem filtro de entrada |
| DE de entrada | `AT - Reagendamento pelo cliente` (`07448f7b-d149-ea11-a2e6-48df370ed97d`) |
| DE auxiliar (lookups) | `AT - Lembrete agendamento com sucesso` — usada nas comparações de data dos splits |
| Canais / assets | 3 e-mails — `Reagendamento Confirmado` (emailId 9508, asset 32092), `Reagendamento Confirmado - Multidias` (emailId 13080, asset 42143, AMPscript com loops/lookups), `mrv_lembrete__visita_v3` (emailId 61590, asset 156366) — + 1 SMS `Lembrete Agendamento - 24h antes_v2` (código curto 29520) |
| Ingestão AEP (já existe) | Pipeline C# dedicado no `com_aep_message_processor`: fila Service Bus `aep-portal-cliente-reagendamento` → `PortalClienteReagendamentoAepMapper` (produtor: **OracleOIC**) |
| Evento AJO alvo | **A CRIAR** — não consta no export dos 66; nome proposto: **`Portal_Cliente_Reagendamento`** *(proposta a confirmar)* |
| Status no SFMC | ⚠️ dump em **Draft** (versão 15, `lastPublishedDate` vazio); cópia de teste `AT - Reagendamento pelo cliente ou backoffice QAS 2` recebe ~0,3 entradas/dia em QAS — confirmar a versão ativa em produção |

## Envelope do evento
O envelope **não é proposta**: já está implementado no mapper C# (`PortalClienteReagendamentoAepMapper.cs`)
e validado na collection Postman (`[MRV][DEV][AT] Reagendamento pelo cliente ou backoffice`).

| Campo | Valor | Status |
|---|---|---|
| `eventType` (payload XDM) | `mrv.at.portalClienteReagendamento` | **real** (C# + Postman) |
| `_mrv.sourceContext.sourceEventType` | `portalClienteReagendamento` | **real** (C# + Postman) |
| `_mrv.sourceContext.sourceSystem` | `OracleOIC` | **real** (C# + Postman) |
| Evento AJO | `Portal_Cliente_Reagendamento` | ⚠️ nome proposto — se o nome criado for outro, **atualizar todas as fórmulas `@event{}` desta spec** |

> No `ajo_event_map.json`, os 66 eventos existentes qualificam com `eventType = dcsExternal` (valor do
> event definition no AJO) + condição sobre `_mrv.sourceContext.sourceEventType`. Ao criar o evento desta
> jornada, seguir o mesmo padrão: qualificar por
> `_mrv.sourceContext.sourceEventType = "portalClienteReagendamento"`.

## Identidade
- **CPF → `_mrv.identityEvents.cpfHash`** (PK, namespace `cpf_hash`; a Function gera o hash).
- **Telefone → `_mrv.identityEvents.phone`** (normalizado pelo `AtPhoneNormalizer`; endereço do SMS).
- **email → `_mrv.identityEvents.email`** (endereço dos 3 e-mails).
- Nome/primeiro nome: regra global = resolver no **PROFILE** via cpfHash (`person.name.firstName` /
  `person.name.fullName`). Neste pipeline o mapper C# **também grava** `person.name` no próprio evento
  (`AtPersonNameMapper` a partir de `PrimeiroNome`) — ver nota na tabela de campos.

## Fluxo AS-IS (SFMC)
Entrada em tempo real a cada reagendamento; **7 decision splits** encadeados, 3 e-mails e 1 SMS:

```
APIEvent (OracleOIC posta o reagendamento — cliente ou backoffice)
└─ Cancelada? [statusOrdem = "Cancelada"/"Concluida" OU StatusChamado = "Cancelado"/"Finalizado"]
   ├─ cancelada → Wait 1 min → fim
   └─ restante → Wait 20 min
      └─ Divisão de Reagendamento (5 vias — compara CPF/DataAgendamento/Id_ordem/Entry_Date do EVENTO
         com os registros das DEs "AT - Reagendamento pelo cliente" e "AT - Lembrete agendamento com sucesso")
         ├─ Data reagendada depois → Agendado por?
         │   ├─ Cli_BO  [AgendadoPor = "CLIENTE"/"BACKOFFICE"] → Ultima Ordem?
         │   │   ├─ TRUE → Multidias?
         │   │   │   ├─ TRUE     → EMAIL "Reagendamento Confirmado - Multidias" (AMPscript multi-datas)
         │   │   │   └─ restante → EMAIL "Reagendamento Confirmado"
         │   │   │        └─ (ambos) Wait by Attribute: 1 dia ANTES de DataAgendamento
         │   │   │            └─ Cancelada? (re-checagem via DE)
         │   │   │                ├─ cancelada → Wait 1 min → fim
         │   │   │                └─ restante → Divisão de Reagendamento 2 → Remainder:
         │   │   │                    EMAIL "mrv_lembrete__visita_v3" → SMS "Lembrete Agendamento - 24h antes_v2" → fim
         │   │   └─ restante → Wait 3 min → fim
         │   ├─ Despachante [AgendadoPor = "Despachante"] → Multidias? (mesmo fluxo acima)
         │   └─ restante → Wait 3 min → fim
         ├─ Data reagendada depois v2 → Wait 1 dia → fim
         ├─ Data reagendada antes v2  → Wait 1 dia → fim
         ├─ Data reagendada antes     → Wait 1 dia → fim
         └─ Remainder → Wait 1 min → Agendado por? (mesmo fluxo)
```

- Os waits curtos (1/3/20 min) + splits de comparação entre DEs implementam uma lógica de **supersede**:
  se chega um reagendamento mais novo (outra data para o mesmo CPF/ordem), o fluxo antigo cai num ramo
  morto e só a entrada mais recente segue até os envios.
- Timezone dos waits: E. South America Standard Time.

## Mapeamento dos campos → XDM
Base: contrato do payload C# (`AtPayloadBase` + `AtPortalClienteReagendamentoPayload`) conferido contra o
mapper real (`PortalClienteReagendamentoAepMapper`). **Nenhum leaf novo** — todos já existem em
`_mrv.technicalAssistanceEvents` no schema/modelo C#.

| Campo (API / DE) | XDM path | Grupo | 🆕? | Observação |
|---|---|---|:--:|---|
| `CPF` | `_mrv.identityEvents.cpfHash` | Identity | | PK (namespace `cpf_hash`); a Function gera o hash |
| `Telefone` | `_mrv.identityEvents.phone` | Identity | | normalizado (`AtPhoneNormalizer`); endereço do SMS |
| `email` | `_mrv.identityEvents.email` | Identity | | endereço dos 3 e-mails |
| `PrimeiroNome` | `person.name.firstName` / `person.name.fullName` | person | | o mapper grava no **evento** (`AtPersonNameMapper`); para personalização, padrão MRV = resolver no **Profile** via cpfHash |
| `Acao` | `_mrv.technicalAssistanceEvents.action` | technicalAssistanceEvents | | ex.: "Medição" |
| `Protocolo` | `_mrv.technicalAssistanceEvents.protocol` | technicalAssistanceEvents | | usado no e-mail e no SMS |
| `IdChamado` | `_mrv.technicalAssistanceEvents.ticketId` | technicalAssistanceEvents | | int no payload → string no XDM |
| `StatusChamado` | `_mrv.technicalAssistanceEvents.ticketStatus` | technicalAssistanceEvents | | split "Cancelada?" ("Cancelado"/"Finalizado") |
| `Imovel` | `_mrv.technicalAssistanceEvents.property` | technicalAssistanceEvents | | personalização do lembrete |
| `Pedido` | `_mrv.technicalAssistanceEvents.required` | technicalAssistanceEvents | | personalização dos e-mails de confirmação |
| `AgendadoPor` | `_mrv.technicalAssistanceEvents.scheduledBy` | technicalAssistanceEvents | | split "Agendado por?" — ⚠️ caixa dos valores (ver pendências) |
| `DataAgendamento` | `_mrv.technicalAssistanceEvents.schedulingDate` | technicalAssistanceEvents | | `DateOnly`; âncora do wait-by-attribute (−1 dia) |
| `Periodo` | `_mrv.technicalAssistanceEvents.timePeriod` | technicalAssistanceEvents | | ex.: "15:00-16:00" |
| `id_ordem` | `_mrv.technicalAssistanceEvents.ticketOrderId` | technicalAssistanceEvents | | chave das comparações de reagendamento |
| `statusOrdem` | `_mrv.technicalAssistanceEvents.ticketOrderStatus` | technicalAssistanceEvents | | split "Cancelada?" ("Cancelada"/"Concluida"); ex.: "Improdutiva" |
| `ordemMultiDias` | `_mrv.technicalAssistanceEvents.multiDayOrder` | technicalAssistanceEvents | | bool — "S"/"true"/"1" → `true` (ParseBool do mapper) |
| `ultimaOrdem` | `_mrv.technicalAssistanceEvents.lastTicketOrder` | technicalAssistanceEvents | | bool — mesma regra de parse |
| `Entry_Date` (DE) | — sem destino no evento | | | só existia na DE p/ comparações entre entradas; o `timestamp` do XDM cumpre esse papel — ⚠️ confirmar |

## Fórmulas prontas para o AJO
Nome do evento **proposto** (`Portal_Cliente_Reagendamento`) — se o nome criado for outro, trocar em TODAS as fórmulas.

| Uso | Fórmula |
|---|---|
| Split "Cancelada?" | `@event{Portal_Cliente_Reagendamento._mrv.technicalAssistanceEvents.ticketOrderStatus}` in `("Cancelada", "Concluida")` **OU** `@event{Portal_Cliente_Reagendamento._mrv.technicalAssistanceEvents.ticketStatus}` in `("Cancelado", "Finalizado")` |
| Split "Agendado por?" — Cli_BO | `@event{Portal_Cliente_Reagendamento._mrv.technicalAssistanceEvents.scheduledBy}` in `("Cliente", "Backoffice")` |
| Split "Agendado por?" — Despachante | `@event{Portal_Cliente_Reagendamento._mrv.technicalAssistanceEvents.scheduledBy} = "Despachante"` |
| Split "Ultima Ordem" | `@event{Portal_Cliente_Reagendamento._mrv.technicalAssistanceEvents.lastTicketOrder} = true` |
| Split "Multidias" | `@event{Portal_Cliente_Reagendamento._mrv.technicalAssistanceEvents.multiDayOrder} = true` |
| Wait até 1 dia antes da visita | data-âncora = `@event{Portal_Cliente_Reagendamento._mrv.technicalAssistanceEvents.schedulingDate}` (offset −1 dia) |
| Chave das comparações de ordem | `@event{Portal_Cliente_Reagendamento._mrv.technicalAssistanceEvents.ticketOrderId}` |
| E-mail — Pedido | `@event{Portal_Cliente_Reagendamento._mrv.technicalAssistanceEvents.required}` |
| E-mail — Período | `@event{Portal_Cliente_Reagendamento._mrv.technicalAssistanceEvents.timePeriod}` |
| E-mail/SMS — Protocolo | `@event{Portal_Cliente_Reagendamento._mrv.technicalAssistanceEvents.protocol}` |
| E-mail — Imóvel (lembrete) | `@event{Portal_Cliente_Reagendamento._mrv.technicalAssistanceEvents.property}` |
| Primeiro nome | preferir Profile via cpfHash: `person.name.firstName`; o evento também traz `@event{Portal_Cliente_Reagendamento.person.name.firstName}` (gravado pelo mapper) |
| Endereço e-mail | `@event{Portal_Cliente_Reagendamento._mrv.identityEvents.email}` |
| Endereço SMS | `@event{Portal_Cliente_Reagendamento._mrv.identityEvents.phone}` |

- **Lembrete concat (obrigatório)**: sempre que a variável aparecer junto de texto fixo — como nos
  e-mails ("Protocolo: %%Protocolo%%", data + período) e no SMS de lembrete — usar
  `concat("Protocolo: ", @event{Portal_Cliente_Reagendamento._mrv.technicalAssistanceEvents.protocol})`.
  **Nunca** justapor texto e `@event{}` sem `concat`.
- Data formatada: o SFMC usa `Format(DataAgendamento,"dd/MM/yyyy")` — no AJO, combinar `formatDate` com
  `concat`, ex.: `concat("sua visita está confirmada para ", formatDate(@event{Portal_Cliente_Reagendamento._mrv.technicalAssistanceEvents.schedulingDate}, "dd/MM/yyyy"))`.

## ⚠️ O maior gap: comparações entre DEs (lógica de supersede)
Os splits "Divisão de Reagendamento" 1/2 e as re-checagens "Cancelada?" **não leem só o evento de
entrada** — comparam o evento com o registro **atual** das DEs `AT - Reagendamento pelo cliente` e
`AT - Lembrete agendamento com sucesso` (por CPF + `Id_ordem` + `DataAgendamento`/`Entry_Date`), para
descartar entradas obsoletas quando chega um reagendamento mais novo ou um cancelamento. O AJO **não faz
lookup vivo em tabela externa** no meio da jornada. Alternativas a decidir no desenho:
1. **Exit criteria / re-entrada**: com `MultipleEntries`, usar critério de saída que tira o perfil da
   jornada quando chega novo evento `Portal_Cliente_Reagendamento` (ou de cancelamento) para o mesmo
   `ticketOrderId` — o supersede vira comportamento nativo;
2. **Atributo de perfil**: ingerir o status/última data agendada no profile e usar conditions de perfil
   após os waits (exige dataset habilitado para profile e latência aceitável);
3. **Custom Action de consulta**: action HTTP que consulta o status da ordem na origem (OracleOIC) na hora
   da decisão.

Sem resolver este ponto a jornada **não é migrável 1:1** — é o driver da complexidade.

## Gaps / pendências (⚠️) e checklist
- [ ] Criar o evento AJO (nome proposto **`Portal_Cliente_Reagendamento`**) qualificando por
      `_mrv.sourceContext.sourceEventType = "portalClienteReagendamento"`; refletir o nome final nas fórmulas.
- [ ] ⚠️ Decidir a estratégia para o **supersede/comparações entre DEs** (exit criteria × atributo de perfil × custom action).
- [ ] ⚠️ **Caixa dos valores de `AgendadoPor`**: filtros SFMC usam `"CLIENTE"/"BACKOFFICE"`; o exemplo
      Postman envia `"Cliente"/"Backoffice"/"Despachante"` — fixar o contrato com o produtor OracleOIC e
      usar comparação case-insensitive (ou normalizar) nas conditions.
- [ ] ⚠️ Confirmar se `Entry_Date` precisa de leaf próprio ou se o `timestamp` do evento cobre as comparações.
- [ ] ⚠️ E-mail **Multidias** usa AMPscript com loops/lookups para listar várias datas do mesmo `IdChamado`
      — sem equivalente direto; redesenhar (ex.: produtor envia a lista de datas no evento, ou fragmento
      dinâmico) antes de migrar o asset 42143.
- [ ] Migrar os 3 assets de e-mail (32092, 42143, 156366) e o SMS; confirmar código curto **29520** (ou
      equivalente) no canal SMS do AJO.
- [ ] ⚠️ Jornada em **Draft** (v15) no dump e testes rodando na cópia `QAS 2` — confirmar a versão ativa
      em produção antes de congelar o AS-IS.
- [ ] Adicionar a linha desta jornada no `mapeamento_variaveis_naoftp.csv` (hoje ela não está lá).
- [ ] A jornada irmã **`Jornada WhatsApp VA Reagendamento`** (FTP + WhatsApp, `01745956-…`) **não** é
      coberta por esta spec — se estiver no escopo, gerar spec própria na trilha FTP (de-para e mapper C#
      já existem).

## Complexidade
**🔴 Alta** — 7 decision splits encadeados cuja lógica de supersede compara o evento com estado vivo em
duas DEs externas (lookup sem equivalente direto no AJO), wait-by-attribute ancorado em `DataAgendamento`
e e-mail multidias com AMPscript de loops/lookups, além de evento AJO ainda a criar.
