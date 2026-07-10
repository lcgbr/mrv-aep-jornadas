# Instrução de mapeamento — Jornada VA 01 - Liberação do Bloco + Agendamento · evento **A CRIAR** (API, NÃO-FTP)

> Spec **dedicada** porque esta jornada **não é FTP**: a entrada é **APIEvent** (mesmo padrão da
> **VA 03 Revistoria** — ver `instrucao_mapeamento_api_vistoria_antecipada.md`). Um sistema produtor
> chama a API quando o **bloco/unidade é liberado para vistoria antecipada**; a jornada então roda
> **3 ondas de contato** (e-mail + WhatsApp), reconsultando entre as ondas a DE externa
> `Controle_Status_VA` para saber se o cliente já agendou/cancelou. **Não** usar molds/CSV das FTP.

## Identificação
| | |
|---|---|
| Jornada (SFMC) | **Jornada VA 01 - Liberação do Bloco + Agendamento** |
| journeyId | `f2cc7891-3b62-48c2-afdc-f2ab789474cc` (BU `mrv-assistencia-tecnica`) |
| Tipo de entrada | **APIEvent** (`eventDefinitionKey = APIEvent-2af7876f-3bc6-2f02-6692-c47fd7275ca1`) · entryMode `MultipleEntries` |
| Data Extension de entrada | `Jornada_VA_Liberacao_do_Bloco_Agendamento` (`170b1a6e-2dbe-f011-a5ab-d4f5ef66f377`) |
| DE de estado (lookups) | `Controle_Status_VA` — join por `IdVistoria` (relationship `cdb1e42d-43b0-f011-a5ab-d4f5ef66f377`) |
| Template WhatsApp | `mia_agendarvistoria_prd` (bot **MariaRosa**; corpo **100% estático** + 1 botão quick_reply "Agendar Vistoria") — enviado **3×** |
| E-mails | `C02_Agendamento vistoria` (1×) e `C03_Lembrete_Unidade_liberada` (2×) — assunto "É hora da vistoria!", preheader "Escolha o dia para conferir os detalhes do seu MRV" |
| Evento AJO alvo | **A CRIAR** — não consta no export dos 66; nome proposto: **`Liberacao_Bloco_Agendamento`** *(proposta a confirmar)* |
| Irmã (Sensia) | `JORNADA_01_LIBERAÇÃO_BLOCO_AGENDAMENTO_PRD` (`e619eb3d-7fa5-4753-b175-bc9ddbeb6a68`, APIEvent `2d37bc5c-4f8b-c112-21c7-27725c63d84d`) — **mesma estrutura**, evento próprio |
| Status no SFMC | ⚠️ dump em **Draft** (versão 5, `lastPublishedDate` vazio; o APIEvent registra 1 interação publicada) — confirmar qual versão está ativa em produção |

## Envelope do evento (proposta — evento ainda não existe)
Todos os 66 eventos AJO do export qualificam por **`eventType = dcsExternal`** (valor real do
`ajo_event_map.json`) + `_mrv.sourceContext.sourceEventType`. Recomendação: **seguir o mesmo padrão**
ao criar o evento desta jornada.

| Campo | Valor proposto | Status |
|---|---|---|
| `eventType` | `dcsExternal` | proposta (padrão real dos 66 eventos) |
| `_mrv.sourceContext.sourceEventType` | `assistenciaTecnicaVa01LiberacaoBlocoAgendamento` | ⚠️ proposta — fixar ao criar o evento e refletir aqui |
| `_mrv.sourceContext.sourceSystem` | `APIEvent` (ou nome do app produtor) | ⚠️ proposta — mesma pendência da VA 03 |
| Evento AJO | `Liberacao_Bloco_Agendamento` | ⚠️ nome proposto — se o nome final for outro, **atualizar todas as fórmulas `@event{}` desta spec** |

> ⚠️ A spec da VA 03 propôs `eventType = assistenciaTecnica.apiEvent`; como o valor real dos eventos
> existentes é `dcsExternal`, **alinhar as duas specs** (VA 01, VA 03 e as irmãs Sensia) na criação.

## Identidade
A jornada referencia **Celular** e **Email** — não há CPF entre os campos usados:
- **Celular → `_mrv.identityEvents.phone`** (PK provável; vira `userNumber` do WhatsApp e `mobileNumber` default).
- **Email → `_mrv.identityEvents.email`** (endereço dos e-mails C02/C03).
- ⚠️ Confirmar se a DE `Jornada_VA_Liberacao_do_Bloco_Agendamento` tem coluna **CPF**; se tiver, usar
  **`_mrv.identityEvents.cpfHash`** como PK (namespace `cpf_hash`; a Function gera o hash), com
  telefone/e-mail como identidades secundárias. Nome/primeiro nome (se o e-mail personalizar) é
  resolvido no **PROFILE** via cpfHash (`person.name.firstName` / `person.name.fullName`) — **não** vai no evento.

## Fluxo AS-IS (SFMC)
Entrada por API → router por **Marca** → até **3 ondas** e-mail + WhatsApp, com checagens de estado
na DE `Controle_Status_VA` (por `IdVistoria`) entre as ondas:

```
APIEvent (produtor chama a API na liberação do bloco)
└─ Split MARCA (3 vias)
   ├─ MRV  (Marca ≠ "Sensia")
   │   └─ Wait 30 min
   │      └─ Unidade Bloqueada? [lookup Controle_Status_VA: UnidadeBloqueada="Não" E Email confere]
   │         ├─ SIM (bloqueada) → fim
   │         └─ NÃO → VA Cancelada? [lookup: StatusVA="Cancelada"] ─ SIM → fim
   │             └─ NÃO → VA aguardando agendamento? [EVENTO: StatusVA="AguardandoAgendamento"]
   │                 ├─ demais status → fim
   │                 └─ SIM → ONDA 1: e-mail C02 → Wait 10 min → WPP mia_agendarvistoria_prd
   │                     └─ Wait 2 dias → VA Agendada? [lookup: StatusVA ≠ "AguardandoAgendamento"] ─ agendada → fim
   │                         └─ não → Unidade bloqueada? [lookup] ─ SIM → fim
   │                             └─ NÃO → VA Cancelada? [lookup] ─ SIM → fim
   │                                 └─ NÃO → ONDA 2: e-mail C03 → WPP (2º)
   │                                     └─ Wait 2 dias → VA Agendada? [lookup: StatusVA="AguardandoVistoria"] ─ SIM → fim
   │                                         └─ NÃO → Unidade bloqueada? [lookup] ─ SIM → Wait 1 min → fim
   │                                             └─ NÃO → VA Cancelada? [lookup] ─ SIM → fim
   │                                                 └─ NÃO → ONDA 3: e-mail C03 (2ª vez) → WPP (3º) → Wait 1 min → fim
   ├─ Sensia/ (Marca contém "Sensia" OU Empreendimento contém "Reserva Vila do Sol") → fim (coberta pela irmã Sensia)
   └─ Restante → fim
```

- **10 splits** no total: 1 router `MARCA` (3 vias) + 9 decisões de status — **8 delas são lookups
  na DE `Controle_Status_VA`** (estado vivo, atualizado fora da jornada) e apenas 1 lê o próprio evento.
- Valores de `StatusVA` observados: `AguardandoAgendamento`, `AguardandoVistoria`, `Cancelada`; `UnidadeBloqueada`: `Não`/`Sim`.
- Os 3 envios WhatsApp usam o **mesmo payload** (template estático; única variável = `userNumber`).

## Mapeamento dos campos → XDM
Campos do APIEvent efetivamente referenciados pela jornada (a DE pode ter mais colunas — ⚠️ conferir):

| Campo (DE / RawVar) | XDM path | Grupo | 🆕? | Observação |
|---|---|---|:--:|---|
| `Celular` | `_mrv.identityEvents.phone` | Identity | | `userNumber` dos 3 envios WhatsApp |
| `Email` | `_mrv.identityEvents.email` | Identity | | endereço dos e-mails; também conferido no lookup da onda 1 |
| `Marca` | `_mrv.earlyInspectionDetails.brand` | earlyInspectionDetails | | discriminador do router MARCA (mesmo leaf das demais VA) |
| `Empreendimento` | `_mrv.condominiumEvent.buildingName` | condominiumEvent | | usado no router (contém "Reserva Vila do Sol" ⇒ trata como Sensia) |
| `IdVistoria` | `_mrv.earlyInspectionDetails.inspectionId` | earlyInspectionDetails | | leaf **já existe** no modelo C# (`Common/EarlyInspectionDetails`) |
| `StatusVA` | `_mrv.earlyInspectionDetails.inspectionStatus` | earlyInspectionDetails | | leaf **já existe** (`inspectionStatus`) |

- Nenhum leaf novo para o **evento de entrada**: `inspectionId`, `inspectionStatus`, `isUnitBlocked`,
  `brand` etc. já existem em `EarlyInspectionDetails` no modelo comum C#.
- ⚠️ A spec da **VA 03** propôs `_mrv.earlyInspectionDetails.status` (🆕) para `StatusVA` — como o leaf
  real chama `inspectionStatus`, **alinhar a VA 03 a este nome** (e o `IdVIstoria` com typo de lá é o
  mesmo campo `IdVistoria` daqui → `inspectionId`).
- Estado de **bloqueio/desbloqueio** (usado só nos lookups): se for modelado como evento de atualização,
  usar `_mrv.earlyInspectionDetails.isUnitBlocked` (leaf já existe).

## Payload do evento AEP (exemplo — XDM)
O produtor dispara **1 evento por contato**:
```json
{
  "eventType": "dcsExternal",
  "_mrv": {
    "sourceContext": {
      "sourceEventType": "assistenciaTecnicaVa01LiberacaoBlocoAgendamento",
      "sourceSystem": "APIEvent"
    },
    "identityEvents": { "phone": "5531999998888", "email": "cliente@exemplo.com" },
    "condominiumEvent": { "buildingName": "Empreendimento X" },
    "earlyInspectionDetails": {
      "brand": "MRV",
      "inspectionId": "VA-123456",
      "inspectionStatus": "AguardandoAgendamento"
    }
  }
}
```
(+ `identityMap`/PK conforme a regra de identidade acima.) Campos vazios/nulos = **omitir** a propriedade.

## Fórmulas prontas para o AJO
Nome do evento **proposto** (`Liberacao_Bloco_Agendamento`) — se o nome criado for outro, trocar em TODAS as fórmulas.

| Uso | Fórmula |
|---|---|
| `userNumber` (3 envios WhatsApp) | `@event{Liberacao_Bloco_Agendamento._mrv.identityEvents.phone}` |
| Router MARCA — via MRV | `@event{Liberacao_Bloco_Agendamento._mrv.earlyInspectionDetails.brand}` **não contém** `"Sensia"` **E** `@event{Liberacao_Bloco_Agendamento._mrv.condominiumEvent.buildingName}` **não contém** `"Reserva Vila do Sol"` |
| Split "VA aguardando agendamento?" | `@event{Liberacao_Bloco_Agendamento._mrv.earlyInspectionDetails.inspectionStatus} = "AguardandoAgendamento"` |
| Id da vistoria (chave dos lookups) | `@event{Liberacao_Bloco_Agendamento._mrv.earlyInspectionDetails.inspectionId}` |
| E-mail do destinatário | `@event{Liberacao_Bloco_Agendamento._mrv.identityEvents.email}` |

- O template `mia_agendarvistoria_prd` é **100% estático** (corpo sem variáveis; botão quick_reply
  "Agendar Vistoria") — na mensagem só entra o `phone`.
- **Lembrete concat**: se em qualquer asset migrado (ex.: HTML dos e-mails C02/C03) uma variável for
  usada junto com texto fixo, é obrigatório usar
  `concat("texto ", @event{Liberacao_Bloco_Agendamento._mrv.condominiumEvent.buildingName})` —
  nunca justapor texto e `@event{}` sem `concat`.

## ⚠️ O maior gap: decisões por estado externo (`Controle_Status_VA`)
8 dos 10 splits **não leem o evento de entrada** — leem a DE `Controle_Status_VA` (por `IdVistoria`),
que é atualizada por fora conforme o cliente agenda/cancela ou a unidade é bloqueada. O AJO **não faz
lookup vivo em tabela externa** no meio da jornada. Alternativas a decidir no desenho:
1. **Eventos de atualização de status**: o produtor posta um evento a cada mudança
   (`inspectionStatus`/`isUnitBlocked`) e a jornada usa *wait until event* / reaction em vez de wait+lookup;
2. **Atributo de perfil**: ingestão contínua do status no profile (ex.: `earlyInspectionDetails` no
   profile) e conditions de perfil após cada wait — exige dataset habilitado para profile e latência aceitável;
3. **Custom Action de consulta**: action HTTP que consulta o status na origem e devolve para decisão.

Sem resolver este ponto a jornada **não é migrável 1:1** — é o driver da complexidade.

## Gaps / pendências (⚠️) e checklist
- [ ] Criar o evento AJO (nome proposto **`Liberacao_Bloco_Agendamento`**) e **fixar** `eventType`
      (`dcsExternal`) + `sourceEventType` + `sourceSystem`; refletir os valores finais nesta spec e nas fórmulas.
- [ ] Definir o mecanismo de ingestão API→AEP (streaming/HTTP) e **quem é o sistema produtor** que hoje chama o SFMC.
- [ ] ⚠️ Decidir a estratégia para os **lookups em `Controle_Status_VA`** (eventos de atualização × atributo de perfil × custom action).
- [ ] ⚠️ Confirmar colunas completas da DE `Jornada_VA_Liberacao_do_Bloco_Agendamento` (existe CPF? → cpfHash como PK).
- [ ] ⚠️ HTML dos e-mails `C02_Agendamento vistoria` e `C03_Lembrete_Unidade_liberada` não está no dump —
      migrar os assets para o AJO e confirmar se há personalização no corpo (se houver, aplicar a regra do `concat`).
- [ ] ⚠️ Jornada em **Draft** no dump — confirmar a versão ativa em produção antes de congelar o AS-IS.
- [ ] Alinhar a spec da **VA 03** (`status` → `inspectionStatus`; envelope `dcsExternal`).
- [ ] Replicar esta spec na irmã Sensia **`JORNADA_01_LIBERAÇÃO_BLOCO_AGENDAMENTO_PRD`**
      (`e619eb3d-7fa5-4753-b175-bc9ddbeb6a68`, APIEvent `2d37bc5c-4f8b-c112-21c7-27725c63d84d`) — mesma estrutura, evento próprio.
- [ ] Atualizar `mapeamento_variaveis_naoftp.csv` (linha já existe) com o evento criado e os destinos XDM desta tabela.

## Complexidade
**🔴 Alta** — 3 ondas de e-mail+WhatsApp cujas decisões dependem de **lookup em DE externa
(`Controle_Status_VA`) por `IdVistoria`** — estado vivo sem equivalente direto no AJO, além de entrada
API com evento ainda a criar.
