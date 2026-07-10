# Instrução de mapeamento — Disparo relancamento - wpp · evento **MRV_FTP_Disp_Relancamento** (FTP WhatsApp)

> Jornada FTP → **1 disparo de WhatsApp** (template `mdc_armarios_relancamento_prd`, bot **MariaRosa**),
> sem splits, waits ou routers. Entrada por importação de arquivo (CSV `Disparo_Relancamento`) que vira
> evento de streaming. A migração é praticamente 1:1, com **um gap material**: a variável `{{1}}` do template
> (nome do Empreendimento) **não tem destino no evento** hoje — ver Gaps.

## Identificação
| | |
|---|---|
| Jornada SFMC | **Disparo relancamento - wpp** (`d961442f-dd3f-4ae4-a21a-40d3b19f86c1`, BU `mrv-marketplace`) |
| Entrada | `AutomationAudience` → **FTP file import** (arquivo `6-19-2026-Disparo_Relancamento.csv`, 6 colunas) |
| DE de origem | `DEAudience-66972621-6020-4a4e-e021-4dc8c76718b0` |
| `sourceEventType` | `marketplaceDisparoRelancamentoWpp` |
| Evento AJO | **`MRV_FTP_Disp_Relancamento`** |
| Canal / Template | WhatsApp · `mdc_armarios_relancamento_prd` (pt_BR, MARKETING, APPROVED) · bot **MariaRosa** |
| Identidade | `_mrv.identityEvents.cpfHash` (namespace `cpf_hash`) |

## Envelope do evento
| Campo | Valor |
|---|---|
| `eventType` (XDM, no payload) | `marketplace.ftpFileImport` |
| `eventType` (definição AJO, `ajo_event_map.json`) | `dcsExternal` |
| `_mrv.sourceContext.sourceEventType` | `marketplaceDisparoRelancamentoWpp` |
| `_mrv.sourceContext.sourceSystem` | `FTPFileImport` (fixo) |
| `_mrv.ftpFileImport.sourceFileName` | nome do arquivo recebido |

> Confirmado contra o mapper C# `DisparoRelancamentoWppAepMapper.cs`
> (`EventType = "marketplace.ftpFileImport"`, `SourceSystem = "FTPFileImport"`,
> `SourceEventType = "marketplaceDisparoRelancamentoWpp"`).

## Fluxo AS-IS (SFMC)
```
Entrada: FTP file import (DEAudience-6697…718b0)
  └─ WhatsApp REST-1  (bot MariaRosa · namespaceId 1161020f_8cf8_31c7_fe76_eecfde18f26f)
       template  = mdc_armarios_relancamento_prd
       userNumber= Celular
       body vars = [ Empreendimento, data_evento, horario_evento, endereco_evento ]
       button    = quick_reply "Armários Planejados" (estático)
  └─ Fim
```
- **Sem** decision split, wait ou router — jornada linear de 1 mensagem.
- Corpo do template (Meta):
  - `{{1}}` = nome do empreendimento
  - `{{2}}` = data do evento · `{{3}}` = horário · `{{4}}` = local
  - Botão `quick_reply` "Armários Planejados" → texto fixo, não precisa de variável.

## Fluxo AJO equivalente
```
Evento MRV_FTP_Disp_Relancamento
  └─ Custom Action WhatsApp (mdc_armarios_relancamento_prd, bot MariaRosa)
       userNumber ← @event{MRV_FTP_Disp_Relancamento._mrv.identityEvents.phone}
       {{1}} ← ⚠️ SEM ORIGEM no evento (ver Gaps)
       {{2}} ← @event{MRV_FTP_Disp_Relancamento._mrv.physicalEvent.eventDate}
       {{3}} ← @event{MRV_FTP_Disp_Relancamento._mrv.physicalEvent.eventTime}
       {{4}} ← @event{MRV_FTP_Disp_Relancamento._mrv.physicalEvent.eventAddress}
  └─ Fim
```

## Mapeamento dos campos → XDM
| # | Campo CSV | Path XDM | Uso na mensagem | Obs |
|---|---|---|---|---|
| 0 | `CPF` | `_mrv.identityEvents.cpfHash` (ns `cpf_hash`) | — (identidade) | Identidade primária; a Function gera o hash. Não vai no corpo. |
| 1 | `Empreendimento` | ⚠️ **SEM DESTINO** 🆕 | `{{1}}` (body) | De-para marca "sem Lookup; offerName roteia" e o mapper C# **não** mapeia. Mas o template **usa** no corpo → precisa leaf novo. |
| 2 | `data_evento` | `_mrv.physicalEvent.eventDate` | `{{2}}` | String livre (ex.: "21 a 23/03"). |
| 3 | `horario_evento` | `_mrv.physicalEvent.eventTime` | `{{3}}` | String. |
| 4 | `endereco_evento` | `_mrv.physicalEvent.eventAddress` | `{{4}}` | String. |
| 5 | `Celular` | `_mrv.identityEvents.phone` | `userNumber` | Regra global: telefone/celular → `_mrv.identityEvents.phone`. |

## Fórmulas prontas para o AJO
Use SEMPRE o nome COMPLETO do evento + path completo:

- **userNumber (destinatário):**
  `@event{MRV_FTP_Disp_Relancamento._mrv.identityEvents.phone}`
- **`{{2}}` data do evento:**
  `@event{MRV_FTP_Disp_Relancamento._mrv.physicalEvent.eventDate}`
- **`{{3}}` horário do evento:**
  `@event{MRV_FTP_Disp_Relancamento._mrv.physicalEvent.eventTime}`
- **`{{4}}` local do evento:**
  `@event{MRV_FTP_Disp_Relancamento._mrv.physicalEvent.eventAddress}`
- **`{{1}}` empreendimento:** ⚠️ pendente de origem (ver Gaps). Uma vez criado o leaf, ficaria
  `@event{MRV_FTP_Disp_Relancamento._mrv.physicalEvent.eventName}` (nome do leaf a confirmar).

> **Lembrete `concat` (regra global):** neste template cada slot `{{n}}` é uma **variável pura** (o texto fixo
> "Data:", "Horário:", "Local:" já está embutido no corpo aprovado no Meta), então **não é preciso `concat`**.
> Só use `concat("texto ", @event{EVENTO._mrv.path})` se algum campo combinar texto fixo + variável no
> **mesmo** valor — não é o caso aqui.

## Gaps / pendências ⚠️
- ⚠️ **`{{1}}` Empreendimento sem origem no evento.** O template exige o nome do empreendimento no corpo,
  mas nem o de-para nem o mapper C# (`DisparoRelancamentoWppAepMapper.cs`) carregam esse campo — a coluna
  `Empreendimento` está marcada "SEM DESTINO (sem Lookup; offerName roteia)". Sem resolver isto, `{{1}}`
  renderiza vazio. Opções:
  - (a) **Criar leaf novo** 🆕 no evento (ex.: `_mrv.physicalEvent.eventName`) e mapear `Empreendimento`
    no mapper C#; ou
  - (b) resolver o nome via **offer decisioning / profile** (se "offerName roteia" implica que o empreendimento
    vira uma oferta). **A CONFIRMAR** qual caminho.
- ⚠️ Confirmar que o template `mdc_armarios_relancamento_prd` (categoria **MARKETING**) não esbarra no cap
  de marketing do WhatsApp (erro 131049) para o volume da campanha.
- ⚠️ Confirmar o **evento AJO `MRV_FTP_Disp_Relancamento`** publicado e ligado ao dataset de streaming
  (não copiar endpoint/dataflow aqui — ver de-para interno).

## Checklist
- [ ] Definir origem de `Empreendimento` para `{{1}}` (leaf novo no evento **ou** decisioning) e ajustar o mapper C#.
- [ ] Criar/validar a Custom Action WhatsApp no AJO (template `mdc_armarios_relancamento_prd`, bot **MariaRosa**,
      `namespaceId 1161020f_8cf8_31c7_fe76_eecfde18f26f`).
- [ ] `userNumber` ligado a `@event{MRV_FTP_Disp_Relancamento._mrv.identityEvents.phone}`.
- [ ] `{{2}}/{{3}}/{{4}}` ligados aos paths `_mrv.physicalEvent.eventDate/eventTime/eventAddress`.
- [ ] Botão `quick_reply` "Armários Planejados" mantido estático (sem variável).
- [ ] Validar o evento AJO `MRV_FTP_Disp_Relancamento` no export dos 66.

## Complexidade
🟡 **Média** — o fluxo é linear (1 disparo de WhatsApp, sem splits/waits/routers), mas a variável `{{1}}`
(Empreendimento) do template **não tem destino no evento/mapper hoje**, exigindo criar um leaf novo (ou
decisioning) antes de a mensagem renderizar corretamente.
