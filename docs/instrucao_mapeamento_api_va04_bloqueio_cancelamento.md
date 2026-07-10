# Instrução de mapeamento — Jornada VA 04 - Bloqueio ou Cancelamento de VA · evento **A CRIAR** (API, NÃO-FTP)

> Spec **dedicada** porque esta jornada **não é FTP**: a entrada é **APIEvent** (mesmo padrão das
> **VA 01** e **VA 03** — ver `instrucao_mapeamento_api_va01_liberacao_bloco.md` e
> `instrucao_mapeamento_api_vistoria_antecipada.md`). Um sistema produtor chama a API quando uma
> **unidade é bloqueada** ou uma **VA é cancelada**; a jornada roteia por motivo e dispara **apenas
> e-mails** (sem WhatsApp, sem waits). **Não** usar molds/CSV das FTP nem o `CsvBlobProcessor`.

## Identificação
| | |
|---|---|
| Jornada (SFMC) | **Jornada VA 04 - Bloqueio ou Cancelamento de VA** |
| journeyId | `f9c887b5-d143-4dbb-97ef-d37aaf90dced` (BU `mrv-assistencia-tecnica`) · `key = 03881453-0ef5-53bb-7988-343f69c6d9ff` |
| Tipo de entrada | **APIEvent** (`eventDefinitionKey = APIEvent-227668cd-53a5-ef29-adad-bacb0e23e270`) · entryMode `MultipleEntries` |
| Data Extension de entrada | `Jornada_VA_Bloqueio_ou_Cancelamento_VA` (`56f4be1c-2ebe-f011-a5ab-d4f5ef66f377`) |
| Canais | **Somente e-mail** (10 activities EMAILV2, sem WhatsApp/SMS); **sem waits**; roteamento por motivo |
| E-mails (4 criativos) | `C01_1_Unidade Bloqueada para VA` (assunto "Aguarde um pouco mais para a vistoria", emailId 74310) · `C01_1_..._motivo_bloqueio` (assunto "Importante: Vistoria Indisponível", emailId 78267) · `C06_Aviso de cancelamento da vistoria` (assunto "Sua vistoria foi cancelada", emailId 74286) · `C06_..._distratado` (emailId 78266) |
| Evento AJO alvo | **A CRIAR** — não consta no export dos 66; nome proposto: **`Bloqueio_Cancelamento_VA`** *(proposta a confirmar)* |
| Irmã (Sensia) | ⚠️ **A CONFIRMAR** — o 1º split ("SENSIA?") desvia Marca=Sensia / Empreendimento="Reserva Vila do Sol" para caminho **sem próxima atividade** (dead-end), sugerindo jornada Sensia gêmea (como VA 01/03). Localizar `JORNADA_04_*` na BU `sensia` e replicar com evento próprio |
| Status no SFMC | `Published` (versão 3, `lastPublishedDate = 2026-03-12`) |

## Envelope do evento (proposta — evento ainda não existe)
Todos os 66 eventos AJO do export qualificam por **`eventType = dcsExternal`** (valor real do
`ajo_event_map.json`) + `_mrv.sourceContext.sourceEventType`. Recomendação: **seguir o mesmo padrão**
ao criar o evento desta jornada, alinhando com VA 01 / VA 03.

| Campo | Valor proposto | Status |
|---|---|---|
| `eventType` | `dcsExternal` | proposta (padrão real dos 66 eventos) |
| `_mrv.sourceContext.sourceEventType` | `assistenciaTecnicaVa04BloqueioCancelamentoVa` | ⚠️ proposta — fixar ao criar o evento e refletir aqui |
| `_mrv.sourceContext.sourceSystem` | `APIEvent` (ou nome do app produtor) | ⚠️ proposta — mesma pendência da VA 01/03 |
| Evento AJO | `Bloqueio_Cancelamento_VA` | ⚠️ nome proposto — se o nome final for outro, **atualizar todas as fórmulas `@event{}` desta spec** |

## Identidade
A jornada referencia **Celular** e **Email** (`defaults.mobileNumber` = `Celular`, `defaults.email`
= `Email`) — não há CPF entre os campos usados:
- **Celular → `_mrv.identityEvents.phone`** (regra global de telefone/celular).
- **Email → `_mrv.identityEvents.email`** — endereço de todos os e-mails (`{{InteractionDefaults.Email}}`).
- ⚠️ Confirmar se a DE `Jornada_VA_Bloqueio_ou_Cancelamento_VA` tem coluna **CPF**; se tiver, usar
  **`_mrv.identityEvents.cpfHash`** como PK (namespace `cpf_hash`; a Function gera o hash), com
  telefone/e-mail como identidades secundárias. Nome/primeiro nome (se o e-mail personalizar saudação)
  é resolvido no **PROFILE** via cpfHash (`person.name.firstName` / `person.name.fullName`) — **não** vai no evento.

## Fluxo AS-IS (SFMC)
Entrada por API → 1º split separa Sensia → depois bifurca em **Bloqueio** (por motivo) ou
**Cancelamento** (por motivo), cada folha com um e-mail. **Sem waits.**

```
APIEvent (produtor chama a API no bloqueio/cancelamento da VA)
└─ SENSIA? [Empreendimento contém "Reserva Vila do Sol" OU Marca contém "Sensia"]
   ├─ Sensia/Reserva → (sem próxima atividade) → fim  ⚠️ provável jornada Sensia gêmea
   └─ Remainder → Unidade bloqueada? [UnidadeBloqueada = "Sim"]
      ├─ SIM → Motivo Bloqueio [MotivoBloqueio]
      │   ├─ BloqueioJuridico              → e-mail C01_1 (EMAILV2-1)
      │   ├─ ClienteFalecido               → e-mail C01_1 (EMAILV2-2)
      │   ├─ CessaoDeDireitos              → e-mail C01_1 (EMAILV2-3)
      │   ├─ DeterminacaoInternaDaEmpresa  → e-mail C01_1 (EMAILV2-4)
      │   ├─ ImprevistoOperacionalNaObra   → e-mail C01_1 (EMAILV2-5)
      │   ├─ (MotivoBloqueio IS NULL)      → e-mail C01_1_..._motivo_bloqueio (EMAILV2-6)
      │   └─ Remainder                     → fim
      └─ DEMAIS STATUS → Vistoria Cancelada? [StatusVA = "Cancelada"]
          ├─ CANCELADA → Motivo Cancelamento [MotivoCancelamento]
          │   ├─ LiberacaoIndevida                       → e-mail C06 (EMAILV2-7)
          │   ├─ ErrodeCadastroUnidadeClienteIncorreto   → e-mail C06 (EMAILV2-8)
          │   ├─ Distratado (Rescisão Contratual)        → e-mail C06_..._distratado (EMAILV2-9)
          │   ├─ CessaoDeDireitos                        → e-mail C06 (EMAILV2-10)
          │   └─ Remainder                               → fim
          └─ DEMAIS STATUS → fim
```

- **5 splits** (todos `MULTICRITERIADECISION`, todos lendo **o próprio evento de entrada** — não há
  lookup em DE externa, diferente da VA 01): SENSIA?, Unidade bloqueada?, Vistoria Cancelada?,
  Motivo Bloqueio (6 vias) e Motivo Cancelamento (4 vias).
- Todos os e-mails usam `emailAddress = {{InteractionDefaults.Email}}` e assunto **estático**; os 10
  nós EMAILV2 reduzem-se a **4 criativos** distintos (2 de bloqueio, 2 de cancelamento).
- Valores observados: `UnidadeBloqueada` = `Sim`; `StatusVA` = `Cancelada`;
  `MotivoBloqueio` ∈ {BloqueioJuridico, ClienteFalecido, CessaoDeDireitos, DeterminacaoInternaDaEmpresa, ImprevistoOperacionalNaObra, (null)};
  `MotivoCancelamento` ∈ {LiberacaoIndevida, ErrodeCadastroUnidadeClienteIncorreto, Distratado, CessaoDeDireitos}.

## Mapeamento dos campos → XDM
Campos do APIEvent efetivamente referenciados pela jornada (a DE pode ter mais colunas — ⚠️ conferir).
Todos os leaves já existem no modelo C# comum `EarlyInspectionDetails` — **nenhum leaf novo**:

| Campo (DE / RawVar) | XDM path | Grupo | 🆕? | Observação |
|---|---|---|:--:|---|
| `Celular` | `_mrv.identityEvents.phone` | Identity | | `defaults.mobileNumber`; regra global de telefone |
| `Email` | `_mrv.identityEvents.email` | Identity | | endereço de todos os e-mails (`InteractionDefaults.Email`) |
| `Empreendimento` | `_mrv.condominiumEvent.buildingName` | condominiumEvent | | split SENSIA? (contém "Reserva Vila do Sol") |
| `Marca` | `_mrv.earlyInspectionDetails.brand` | earlyInspectionDetails | | split SENSIA? (contém "Sensia") |
| `StatusVA` | `_mrv.earlyInspectionDetails.inspectionStatus` | earlyInspectionDetails | | leaf já existe; split "Vistoria Cancelada?" (= "Cancelada") |
| `UnidadeBloqueada` | `_mrv.earlyInspectionDetails.isUnitBlocked` | earlyInspectionDetails | | leaf já existe; split "Unidade bloqueada?" (= "Sim") |
| `MotivoBloqueio` | `_mrv.earlyInspectionDetails.blockReason` | earlyInspectionDetails | | leaf já existe; router "Motivo Bloqueio" (6 vias) |
| `MotivoCancelamento` | `_mrv.earlyInspectionDetails.cancellationReason` | earlyInspectionDetails | | leaf já existe; router "Motivo Cancelamento" (4 vias) |

- Leaves de descrição já existentes e úteis se o corpo do e-mail exibir o motivo por extenso:
  `blockReasonDescription` e `cancellationReasonDescription` (⚠️ confirmar se a DE traz esses textos e se os HTML os usam).

## Payload do evento AEP (exemplo — XDM)
O produtor dispara **1 evento por contato** (exemplos de bloqueio e de cancelamento):
```json
{
  "eventType": "dcsExternal",
  "_mrv": {
    "sourceContext": {
      "sourceEventType": "assistenciaTecnicaVa04BloqueioCancelamentoVa",
      "sourceSystem": "APIEvent"
    },
    "identityEvents": { "phone": "5531999998888", "email": "cliente@exemplo.com" },
    "condominiumEvent": { "buildingName": "Empreendimento X" },
    "earlyInspectionDetails": {
      "brand": "MRV",
      "isUnitBlocked": "Sim",
      "blockReason": "BloqueioJuridico"
    }
  }
}
```
Cancelamento: `isUnitBlocked` ausente/"Não", `inspectionStatus": "Cancelada"` e
`cancellationReason": "Distratado"`. Campos vazios/nulos = **omitir** a propriedade.

## Fórmulas prontas para o AJO
Nome do evento **proposto** (`Bloqueio_Cancelamento_VA`) — se o nome criado for outro, trocar em TODAS
as fórmulas. **Nunca abrevie**: use sempre `@event{NOME_COMPLETO._mrv.path.completo}`.

| Uso | Fórmula |
|---|---|
| E-mail do destinatário | `@event{Bloqueio_Cancelamento_VA._mrv.identityEvents.email}` |
| Telefone (se algum asset usar) | `@event{Bloqueio_Cancelamento_VA._mrv.identityEvents.phone}` |
| Split SENSIA? — via Sensia | `@event{Bloqueio_Cancelamento_VA._mrv.condominiumEvent.buildingName}` **contém** `"Reserva Vila do Sol"` **OU** `@event{Bloqueio_Cancelamento_VA._mrv.earlyInspectionDetails.brand}` **contém** `"Sensia"` |
| Split "Unidade bloqueada?" | `@event{Bloqueio_Cancelamento_VA._mrv.earlyInspectionDetails.isUnitBlocked} = "Sim"` |
| Split "Vistoria Cancelada?" | `@event{Bloqueio_Cancelamento_VA._mrv.earlyInspectionDetails.inspectionStatus} = "Cancelada"` |
| Router "Motivo Bloqueio" | `@event{Bloqueio_Cancelamento_VA._mrv.earlyInspectionDetails.blockReason}` = `BloqueioJuridico` / `ClienteFalecido` / `CessaoDeDireitos` / `DeterminacaoInternaDaEmpresa` / `ImprevistoOperacionalNaObra` / **is null** |
| Router "Motivo Cancelamento" | `@event{Bloqueio_Cancelamento_VA._mrv.earlyInspectionDetails.cancellationReason}` = `LiberacaoIndevida` / `ErrodeCadastroUnidadeClienteIncorreto` / `Distratado` / `CessaoDeDireitos` |
| Motivo por extenso (se o HTML usar) | `@event{Bloqueio_Cancelamento_VA._mrv.earlyInspectionDetails.blockReasonDescription}` / `@event{Bloqueio_Cancelamento_VA._mrv.earlyInspectionDetails.cancellationReasonDescription}` |

- **Lembrete `concat`**: se em qualquer asset migrado (HTML dos e-mails C01_1 / C06) uma variável for
  usada junto com texto fixo, é **obrigatório** `concat`, ex.:
  `concat("Motivo: ", @event{Bloqueio_Cancelamento_VA._mrv.earlyInspectionDetails.blockReasonDescription})`
  ou `concat("Olá ", @event{Bloqueio_Cancelamento_VA._mrv.condominiumEvent.buildingName})` —
  nunca justapor texto e `@event{}` sem `concat`.

## Gaps / pendências (⚠️) e checklist
- [ ] Criar o evento AJO (nome proposto **`Bloqueio_Cancelamento_VA`**) e **fixar** `eventType`
      (`dcsExternal`) + `sourceEventType` + `sourceSystem`; refletir os valores finais nesta spec e nas fórmulas.
- [ ] Definir o mecanismo de ingestão API→AEP (streaming/HTTP) e **quem é o sistema produtor** que hoje chama o SFMC.
- [ ] ⚠️ Confirmar colunas completas da DE `Jornada_VA_Bloqueio_ou_Cancelamento_VA` (existe CPF? → cpfHash como PK; existem `*Description` dos motivos?).
- [ ] ⚠️ HTML dos 4 criativos (`C01_1_Unidade Bloqueada para VA`, `C01_1_..._motivo_bloqueio`,
      `C06_Aviso de cancelamento da vistoria`, `C06_..._distratado`) não está no dump — migrar os assets
      para o AJO e confirmar se há personalização no corpo (se houver, aplicar a regra do `concat`).
- [ ] ⚠️ Confirmar/localizar a **jornada Sensia gêmea** (o split SENSIA? tem folha sem próxima atividade,
      igual às VA 01/03) na BU `sensia` e replicar esta spec com evento próprio.
- [ ] Confirmar semântica das folhas **Remainder** e "DEMAIS STATUS" (encerram sem mensagem) ao desenhar no AJO.
- [ ] Adicionar a **linha desta jornada** ao `mapeamento_variaveis_naoftp.csv` (hoje só constam VA 01 e VA 03)
      com o evento criado e os destinos XDM desta tabela.

## Complexidade
**🟡 Média** — entrada por **APIEvent com evento ainda a criar** (envelope a fixar) e roteamento largo
por motivo (2 routers, 6+4 vias), porém **todas as decisões leem o próprio evento** (sem lookup em DE
externa) e o fluxo é **só e-mail, sem waits** — migração 1:1 direta assim que o evento e os assets forem criados.
