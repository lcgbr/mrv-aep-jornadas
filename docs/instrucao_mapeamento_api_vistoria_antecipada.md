# Instrução de mapeamento — Jornada VA 03 (Revistoria) · evento **Vistoria_Antecipada** (API, NÃO-FTP)

> Spec **dedicada** a esta jornada porque ela **não é FTP**. As demais jornadas entram por importação de
> arquivo (CSV → AEP, `eventType = <bu>.ftpFileImport`, `sourceSystem = "FTPFileImport"`) e seguem a
> `instrucao_mapeamento_csharp.md`. Esta entra por **API Event** e precisa de um fluxo próprio — **não**
> use os molds/CSV das FTP nem o `CsvBlobProcessor`.

## Identificação
| | |
|---|---|
| Jornada (SFMC) | **Jornada VA 03 - Jornada de Revistoria** |
| journeyId | `a2fc65ea-0e17-4831-b8dc-f12f1a2d1485` (BU `mrv-assistencia-tecnica`) |
| Tipo de entrada | **APIEvent** (`eventDefinitionKey = APIEvent-e0f725e7-5a55-6de5-bfa7-16fe1cea3333`) |
| Data Extension | `Jornada_VA _Jornada_Revistoria` (`5c6f7bd0-2dbe-f011-a5ab-d4f5ef66f377`) |
| Template WhatsApp | `chaves_va_reprovada_prd` (corpo **estático**, 1 botão quick_reply "Renegociar/Agendar Vistoria") |
| Evento AJO alvo | **`Vistoria_Antecipada`** *(nome informado; não consta no export dos 66 — confirmar criação no AJO)* |
| Irmã (Sensia) | `JORNADA_03_JORNADA_DE_REVISTORIA_PRD` (`55a11e0a-…`, APIEvent `a47df5b1-…`) — mesma estrutura, evento próprio |

## FTP × API (o que muda)
| | Jornadas FTP (as outras) | **VA 03 Revistoria (esta)** |
|---|---|---|
| Gatilho | Arquivo CSV cai no Blob | Sistema produtor **chama uma API** (hoje: SFMC Journey API `/interaction/v1/events`) |
| Ingestão AEP | `CsvBlobProcessor` lê a linha e dispara o evento | Produtor **posta o evento direto no AEP** (streaming/HTTP), 1 evento por contato |
| `sourceSystem` | `"FTPFileImport"` | **`"APIEvent"`** (ou o nome do app produtor) — *a confirmar* |
| `eventType` | `<bu>.ftpFileImport` | **`assistenciaTecnica.apiEvent`** (proposto, paralelo ao FTP) — *a confirmar* |
| `sourceContext.sourceEventType` | camelCase da jornada | **`vistoriaAntecipada`** (proposto) — *a confirmar com a condição de qualificação do evento no AJO* |
| Evento AJO | `MRV_FTP_*` | **`Vistoria_Antecipada`** (sem prefixo FTP) |

> O envelope acima é **proposta** — o valor real de `eventType`/`sourceEventType` deve bater com a
> **condição de qualificação** do evento `Vistoria_Antecipada` no AJO (fieldRefs `json://eventType` e
> `json://_mrv/sourceContext/sourceEventType`). Como esse evento ainda não está no export, defina esses
> dois valores ao criá-lo e reflita aqui.

## Identidade
Os campos referenciados **não incluem CPF**. Portanto a identidade primária provável é o **telefone**:
- **Celular → `_mrv.identityEvents.phone`** (PK provável + `mobilePhone`/identityMap).
- **Email → `_mrv.identityEvents.email`**.
- ⚠️ Confirmar se a DE `Jornada_VA_Jornada_Revistoria` tem coluna **CPF**; se tiver, usar **`cpfHash`** como PK (padrão MRV), com telefone/email como identidades secundárias.

## Mapeamento dos campos do evento → XDM
Campos que a jornada lê do API Event (`APIEvent-e0f725e7…`):

| Campo (DE / RawVar) | XDM path | Grupo | 🆕? | Observação |
|---|---|---|:--:|---|
| `Celular` | `_mrv.identityEvents.phone` | Identity | | vira `userNumber` da mensagem (`@event{Vistoria_Antecipada._mrv.identityEvents.phone}`) |
| `Email` | `_mrv.identityEvents.email` | Identity | | |
| `Empreendimento` | `_mrv.condominiumEvent.buildingName` | condominiumEvent | | reusa mapeamento das demais |
| `Marca` | `_mrv.earlyInspectionDetails.brand` | earlyInspectionDetails | | reusa mapeamento (ex.: Jornada CRI v2) |
| `DataAgendamento` | `_mrv.earlyInspectionDetails.scheduledTime` | earlyInspectionDetails | | leaf já existe |
| `IdVIstoria` | `_mrv.earlyInspectionDetails.inspectionId` | earlyInspectionDetails | 🆕 | criar leaf (id da vistoria) |
| `StatusVA` | `_mrv.earlyInspectionDetails.status` | earlyInspectionDetails | 🆕 | criar leaf (status da VA: aprovada/reprovada/…) |
| `Procurador` | `_mrv.earlyInspectionDetails.proxy` | earlyInspectionDetails | 🆕 | criar leaf; confirmar tipo (nome? indicador booleano?) |

Leaves já existentes no grupo hoje: `brand`, `elapsedTime`, `scheduledTime`. Os 3 🆕 (`inspectionId`,
`status`, `proxy`) precisam ser adicionados ao field group `earlyInspectionDetails` no schema AEP.

## Payload do evento AEP (exemplo — XDM)
O produtor dispara **1 evento por contato**, algo como:
```json
{
  "eventType": "assistenciaTecnica.apiEvent",
  "_mrv": {
    "sourceContext": { "sourceEventType": "vistoriaAntecipada", "sourceSystem": "APIEvent" },
    "identityEvents": { "phone": "5531999998888", "email": "cliente@exemplo.com" },
    "condominiumEvent": { "buildingName": "Empreendimento X" },
    "earlyInspectionDetails": {
      "brand": "MRV",
      "scheduledTime": "2026-07-20T14:00:00-03:00",
      "inspectionId": "VA-123456",
      "status": "REPROVADA",
      "proxy": "Fulano de Tal"
    }
  }
}
```
(+ o `identityMap`/PK conforme a regra de identidade acima.) Campos vazios/nulos = **omitir** a propriedade.

## Mensagem WhatsApp (Orquestrador)
O template `chaves_va_reprovada_prd` tem **corpo estático** e **1 botão quick_reply** — a **única** variável
usada na mensagem é o telefone. O payload do Orquestrador é o que o site `mrv-aep-jornadas` já gera (evento
ligado via `WPP_EVENT_OVERRIDE` → `@event{Vistoria_Antecipada._mrv.identityEvents.phone}` + botão "Agendar
Vistoria"). Portanto, do ponto de vista da **mensagem**, basta o `phone`; os demais campos servem à
**qualificação/decisões** da jornada no AJO (o SFMC usa `StatusVA` num split MULTICRITERIADECISION).

## Checklist do que confirmar / criar
- [ ] Criar (ou confirmar) o evento **`Vistoria_Antecipada`** no AJO e fixar `eventType` + `sourceEventType`.
- [ ] Definir o mecanismo real de ingestão no AEP (streaming ingestion vs endpoint HTTP dedicado) e quem é o produtor.
- [ ] Confirmar se a DE tem **CPF** (→ cpfHash como PK) ou se a identidade é telefone/email.
- [ ] Criar os 3 leaves 🆕 em `earlyInspectionDetails` (`inspectionId`, `status`, `proxy`) e confirmar tipos.
- [ ] Aplicar a **mesma spec** à irmã Sensia `JORNADA_03_JORNADA_DE_REVISTORIA_PRD` (evento próprio).
- [ ] Preencher `mapeamento_variaveis_naoftp.csv` (coluna `DestinoXDM_A_PREENCHER`) com os destinos desta tabela.
