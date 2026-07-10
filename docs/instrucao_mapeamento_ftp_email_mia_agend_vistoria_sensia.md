# Instrução de mapeamento — Mia - Agendamento vistoria por e-mail · evento **MRV_FTP_MIA_Agend_Vist_Email** (FTP)

> Jornada FTP de **e-mail** da Sensia: 1 decision split por `status_unidade` → 2 e-mails (unidade liberada ×
> não liberada). Discriminador é campo do próprio registro → no AJO vira Condition sobre o **payload do
> evento** (`@event{}`), publicável direto. ⚠️ Jornada **DORMENTE**: 0 execuções em 2026, DE vazia —
> fortíssima candidata a descontinuação (decidir antes de migrar).

## Identificação
| | |
|---|---|
| Jornada (SFMC) | **Mia - Agendamento vistoria por e-mail** |
| journeyId | `a992c23e-d854-46c4-9024-f4a8dcf2490d` (BU `sensia`) — id do **automation** homônimo no export (`AwaitingTrigger`; External Key `62138947-de9f-4a40-2d7c-3c3edbed23f4`). ⚠️ O id da interaction (Journey Builder, Published v6) não veio no export — a ficha traz só a chave `DEAudience-bc26083d-ba3e-8fac-db91-b45673455f4d` (a confirmar) |
| Tipo de entrada | **File Drop** (pasta `import\mia_agendamento_vistoria\`, Queue Files On) → import **Overwrite** na DE → Journey Entry (batch da DE) |
| Data Extension | `mia_agendamento_vistoria` (5 colunas, delimitador `;`; External Key `5121890B-959B-4101-AAC8-3F8073AC0B74`) · PK = `Cpf` · ⚠️ Subscriber Key = `e-mail` (atípico na MRV) · **0 registros / Last Refreshed Never** |
| `sourceEventType` | `sensiaMiaAgendamentoVistoriaPorEMail` |
| Evento AJO alvo | **`MRV_FTP_MIA_Agend_Vist_Email`** (`eventType = dcsExternal` no AJO — ver Envelope) |
| Canal / assets | **só e-mail** — 2 assets: `Mia - Agendamento vistoria por e-mail` (emailId **69447**) e `Email_MIA_Vistoria_NaoLiberada` (emailId **72898**) |
| Identidade | `Cpf` → `cpfHash` (namespace `cpf_hash`; a Function gera o hash) · chave do evento AJO = `phoneEmail` (namespace `telefone_email`) |
| Mapper C# | `MiaAgendamentoVistoriaPorEMailAepMapper.cs` (mold FTP 5-arquivos, já criado) |
| Ficha de assessment | `AEP/fichas/Sensia/sensia_mia_agendamento_vistoria.md` |

> Nota de nomenclatura: exports antigos (`jornadas_eventos_ajo.md`, `instrucao_mapeamento_csharp.md`)
> referenciam este evento como `MRV_FTP_Sen_Mia_Agend_Vist` — foi **renomeado** para
> `MRV_FTP_MIA_Agend_Vist_Email` (leva de renomeações jul/2026). Usar sempre o nome novo.

## Envelope do evento
| Campo | Valor |
|---|---|
| Evento AJO (`ajo_event_map.json`) | `MRV_FTP_MIA_Agend_Vist_Email` · **`eventType = dcsExternal`** (evento externo via streaming — atenção: **não** é o valor do campo XDM) |
| `eventType` (campo XDM do payload) | `sensia.ftpFileImport` (conforme mapper C# e dumps `requests_jornadas`) |
| `_mrv.sourceContext.sourceEventType` | `sensiaMiaAgendamentoVistoriaPorEMail` |
| `_mrv.sourceContext.sourceSystem` | `FTPFileImport` (fixo) |
| `_mrv.ftpFileImport.sourceFileName` | nome do arquivo recebido (ex.: `6-19-2026-mia_agendamento_vistoria.csv`) |
| Chave do evento (event key) | `_mrv.identityEvents.phoneEmail` (namespace `telefone_email`) — como o CSV **não tem telefone**, a regra compõe `phoneEmail = e-mail` |

## Fluxo AS-IS (SFMC) resumido
Automation (file drop) importa o CSV na DE (**Overwrite**; Bad Data/Blank File = Fail Import) e dispara a
entrada batch na jornada — 6 atividades, canal só e-mail:

```
Entrada (batch da DE mia_agendamento_vistoria)
└─ Decision Split: status_unidade
   ├─ "liberada"     → EMAIL 69447 "Mia - Agendamento vistoria por e-mail" → wait 1 min → Fim
   ├─ "nao_liberada" → EMAIL 72898 "Email_MIA_Vistoria_NaoLiberada"        → wait 1 min → Fim
   └─ Restante       → wait 1 min → Fim (sem envio)
```
- **Nenhuma SQL Query** no automation (só Import + Journey Entry) — o `status_unidade` já vem pronto no arquivo.
- Personalização: AMPscript **`@Nome`** nos e-mails → no AJO vira atributo de **Profile** (via cpfHash).
- Saúde operacional: 16 execuções históricas (100% sucesso), **últimas em jun/2025 — nenhuma em 2026**.

## Fluxo AJO equivalente
```
Evento MRV_FTP_MIA_Agend_Vist_Email
  └─ Condition sobre @event{MRV_FTP_MIA_Agend_Vist_Email._mrv.earlyInspectionDetails.inspectionStatus}
       "liberada"     → Email "Mia - Agendamento vistoria por e-mail" (asset 69447)
       "nao_liberada" → Email "Email_MIA_Vistoria_NaoLiberada" (asset 72898)
       else           → Fim
```
Condição sobre o **evento** (o `status_unidade` chega no payload) → publicável direto, sem join/audiência.
Os waits de 1 min pré-Fim do SFMC são cosméticos — podem ser descartados no AJO.

## Mapeamento dos campos → XDM
Base: de-para `de_para_jornadas/sensiaMiaAgendamentoVistoriaPorEMail.md` (schema FTP_File_Event v1.7),
conferido contra o mapper C# `MiaAgendamentoVistoriaPorEMailAepMapper.cs` (envelope idêntico; `tempo` e
`Nome` **não** vão no evento). Ordem = header do CSV (5 colunas, `;`).

| # | Campo CSV | Campo AEP (XDM) | FG | 🆕 | Uso no AJO / Obs |
|---|---|---|---|:--:|---|
| 0 | `Nome` | **Profile** `person.name.firstName` / `person.name.fullName` (via cpfHash) — **não vai no evento** | Profile | | AMPscript `@Nome` dos e-mails → personalização de **perfil** no AJO |
| 1 | `e-mail` | `_mrv.identityEvents.email` | Identity | | endereço do canal e-mail; também compõe `phoneEmail` (chave do evento, namespace `telefone_email`) |
| 2 | `Cpf` | `_mrv.identityEvents.cpfHash` | Identity | | PK da DE; identidade primária MRV (namespace `cpf_hash`); a Function gera o hash |
| 3 | `tempo` | ⚠️ **SEM DESTINO** (sem campo de tempo decorrido) | — | | **não é usado no canvas** (nenhum split/personalização) — o mapper C# não o ingere; doc antigo propunha `elapsedTime`, não implementado |
| 4 | `status_unidade` | `_mrv.earlyInspectionDetails.inspectionStatus` | FG-B | | **discriminador do split** (valores: `liberada` / `nao_liberada`) |

Nenhum leaf novo (🆕) necessário.

## Fórmulas prontas para o AJO
Sempre com o nome **completo** do evento — nunca abreviar:

| Uso | Fórmula |
|---|---|
| Condition "unidade liberada" | `@event{MRV_FTP_MIA_Agend_Vist_Email._mrv.earlyInspectionDetails.inspectionStatus} = "liberada"` |
| Condition "não liberada" | `@event{MRV_FTP_MIA_Agend_Vist_Email._mrv.earlyInspectionDetails.inspectionStatus} = "nao_liberada"` |
| E-mail do destinatário (se a régua respeitar o e-mail do arquivo) | `@event{MRV_FTP_MIA_Agend_Vist_Email._mrv.identityEvents.email}` |
| Nome do cliente nos e-mails (`@Nome`) | `profile.person.name.firstName` — resolvido no **Profile** via cpfHash; **não** usar `@event{}` para nome |

- ⚠️ Lembrete de **concat**: sempre que um texto fixo for montado junto com variável (ex.: saudação
  "Olá, {nome}"), use `concat("Olá, ", profile.person.name.firstName)` — e, para campos de evento,
  `concat("texto ", @event{MRV_FTP_MIA_Agend_Vist_Email._mrv.earlyInspectionDetails.inspectionStatus})`.
  Nunca justapor texto + variável sem `concat(...)`.
- Confirmar os valores literais gravados no arquivo (`liberada` / `nao_liberada` — caixa/acentuação) e,
  se houver variação, comparar case-insensitive ou sanear na ingestão.

## Gaps / pendências
- ⚠️ **Jornada dormente** — 0 execuções em 2026 (últimas em jun/2025), DE com 0 registros e retenção off.
  A ficha classifica como fortíssima candidata a **descontinuação** (Q1). Confirmar com o dono **antes**
  de investir na migração.
- ⚠️ **`tempo` sem destino** — coluna existe no CSV mas não é usada no canvas nem ingerida pelo mapper C#.
  Confirmar com o produtor do arquivo se pode ser descartada (ou criar leaf, se houver uso analítico).
- ⚠️ **Subscriber Key = `e-mail`** (e não CPF, o padrão MRV) — anomalia de identidade no SFMC; no AEP a
  identidade é resolvida pelo grafo via `cpfHash` + `email`, sem impacto, mas registrar a origem (Q3 da ficha).
- ⚠️ **Produtor do arquivo desconhecido** (Q2 da ficha) — necessário para o re-apontamento do envio FTP.
- A ficha de assessment sugeria como desenho-alvo **Read Audience/Rota B (GCP)**; esta spec segue o mold
  FTP-evento vigente (evento `MRV_FTP_MIA_Agend_Vist_Email` já criado no AJO + mapper C# pronto). A
  alternativa fica registrada caso a jornada sobreviva à triagem.

### Checklist
- [ ] **Decidir migrar × descontinuar** (Q1 da ficha) — gate de tudo abaixo.
- [ ] Confirmar valores literais de `status_unidade` no arquivo real (`liberada`/`nao_liberada`).
- [ ] Confirmar descarte da coluna `tempo` com o produtor do arquivo.
- [ ] Migrar os **2 assets de e-mail** (69447 e 72898), convertendo AMPscript `@Nome` → `profile.person.name.firstName`.
- [ ] Reconstruir a árvore no AJO: 1 Condition (2 vias + else) — waits de 1 min podem ser descartados.
- [ ] Identificar o produtor do arquivo e re-apontar o envio para o novo destino (Q2).
- [ ] Validar paridade pós-cutover: linhas do CSV × eventos AEP × entradas na jornada AJO.

## Complexidade
🟢 **Baixa** — 1 decision split de 2 vias sobre campo do próprio evento (`inspectionStatus`) + 2 e-mails
estáticos, sem SQL e sem leaf novo (publicável direto); o único bloqueador é decisório, não técnico:
jornada dormente há +1 ano, candidata a descontinuação.
