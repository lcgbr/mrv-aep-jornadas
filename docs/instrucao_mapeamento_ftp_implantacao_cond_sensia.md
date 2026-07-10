# Instrução de mapeamento — Implantação cond. Jornada (Copy) · evento **MRV_FTP_Implant_Cond_Jor** (FTP)

> Régua de **e-mail** da implantação de condomínio da **Sensia**: 6 e-mails sequenciais (introdução →
> eleição concluída) **sem nenhum split** — a orquestração inteira é feita por **4 Wait By Attribute**
> sobre datas que chegam prontas no arquivo (`inicioimplanta`, `Data3`, `Datainiciovotacao`, `Data5`).
> ⚠️ **NÃO confundir** com a jornada de **Assistência Técnica** (`assistenciaTecnicaImplantacaoCondominio`
> → evento `MRV_FTP_Implant_Cond`): são jornadas distintas, com CSVs de headers diferentes
> (`e-mail`/`prazo candidatura` aqui × `Email`/`prazo_candidatura` lá) — os eventos AJO foram
> **renomeados em jul/2026** exatamente para separá-las.

## Identificação
| | |
|---|---|
| Jornada (SFMC) | **Implantação cond. Jornada (Copy)** |
| journeyId | `36a9b17a-eac1-461c-b7b0-c5f217c819b1` (BU `sensia`) · Published · v2 · MultipleEntries |
| Tipo de entrada | `AutomationAudience` → automation **`imp`** (`da0d9792-91ca-47a5-ae3e-f2982e2f3311`, file drop `import\impcondominio\`, qualquer nome de arquivo, Queue Files off) → import **Overwrite** → Journey Entry |
| Event Definition | `DEAudience-a6cc50a8-6bc1-ecc5-165e-6bad7727cb3b` (id `74ec9134-0c90-4dfa-aadf-64449c9e84f8`) |
| Data Extension | `imp_condo` (18 colunas, delimitador `;`; id `97353a03-4bfb-ee11-ba60-48df37e63c5d`, external key `221C0BE2-9018-4C7E-9ACF-567936CDC6EE`) · Subscriber Key = `cpf` |
| Canal / assets | **só e-mail** — 6 envios / 6 assets (emailIds 59904–59909, pasta Content Builder "Implantação de condomínio") |
| `sourceEventType` | `sensiaImplantacaoCondCopy` |
| Evento AJO alvo | **`MRV_FTP_Implant_Cond_Jor`** (`eventType = dcsExternal` no AJO — ver Envelope) |
| Identidade | `cpf` → `cpfHash` (namespace `cpf_hash`; a Function gera o hash) + `phoneEmail` (namespace `telefone_email`, composto de `telefone`+`e-mail`) |
| Mapper C# | `ImplantacaoCondominioAepMapper.cs` (Sensia) — ⚠️ **divergente do de-para**, ver Gaps |
| Jornada IRMÃ (não confundir) | **Jornada Implantação Condominio (AssistenciaTecnica)** — `assistenciaTecnicaImplantacaoCondominio` → evento `MRV_FTP_Implant_Cond`, mapper `AtImplantacaoCondominioAepMapper.cs` — **fora do escopo** desta spec |

## Envelope do evento
| Campo | Valor |
|---|---|
| Evento AJO (`ajo_event_map.json`) | `MRV_FTP_Implant_Cond_Jor` · **`eventType = dcsExternal`** (evento externo via streaming — atenção: **não** é o valor do campo XDM) |
| `eventType` (campo XDM do payload) | `sensia.ftpFileImport` (conforme de-para e dumps `requests_jornadas/sensiaImplantacaoCondCopy_*.json`) |
| `_mrv.sourceContext.sourceEventType` | `sensiaImplantacaoCondCopy` |
| `_mrv.sourceContext.sourceSystem` | `FTPFileImport` (fixo) |
| `_mrv.ftpFileImport.sourceFileName` | nome do arquivo recebido (ex.: `6-19-2026-imp_condo (1).csv`) |

## Fluxo AS-IS (SFMC) resumido
```
Arquivo cai em import\impcondominio\  →  automation "imp" (import Overwrite → Journey Entry)
└─ EMAIL 59904 "Introdução"                       (assunto: Implantação de Condomínio à vista)
   → WAIT by attribute: inicioimplanta
   → EMAIL 59905 "Implantação cond. - Peça 1"     (assunto: Implantação de Condomínio do seu Sensia)
   → WAIT by attribute: Data3
   → EMAIL 59906 "Implantação cond. - Peça 2"     (assunto: Inscrições encerradas, saiba mais)
   → WAIT by attribute: Datainiciovotacao
   → EMAIL 59907 "Implantação cond. - Peça 3"     (assunto: Hora de escolher os seus representantes)
   → WAIT 2 minutos
   → EMAIL 59908 "Implantação cond. - Peça 4"     (assunto: Já escolheu seus representantes?)
   → WAIT by attribute: Data5
   → EMAIL 59909 "Implantação cond. - Peça 5"     (assunto: Seu Sensia agora tem representante!)
   → WAIT 1 minuto → Fim
```
- 12 atividades: **6 EMAILV2 · 6 WAIT** (4 por atributo de data + 2 por duração) — **nenhum decision split**.
- Waits por atributo em timezone `E. South America Standard Time`, lendo o valor **do próprio evento de
  entrada** (`{{Event.DEAudience-a6cc50a8….\"<campo>\"}}`) — as datas chegam prontas no arquivo, sem SQL.
- Re-entry: `MultipleEntries` (cada novo arquivo pode reinserir o mesmo CPF).
- Sem filtro de elegibilidade na entrada (`filterDefinitionId` zerado) — todo o batch entra.

### Personalização dos e-mails (AMPscript no SFMC)
| E-mail | Campos usados |
|---|---|
| 59904 Introdução | — (estático) |
| 59905 Peça 1 | `%%prazo candidatura%%` · `Format(Data1, "dd/MM/yyyy")` · `%%Data2%%` · `Format(Data3, "dd/MM/yyyy")` · `%%Data4%%` · `Format(Data5, "dd/MM/yyyy")` |
| 59906 Peça 2 | `%%fim_votacao%%` · `Format(Data1/3/5, "dd/MM/yyyy")` · `%%Data2%%` · `%%Data4%%` · `%%link%%` |
| 59907 Peça 3 | `%%fim_votacao%%` · `%%inicio_votacao%%` · `Format(Data1/3/5, "dd/MM/yyyy")` · `%%Data2%%` · `%%Data4%%` |
| 59908 Peça 4 | ⚠️ a confirmar (asset não extraído no dump) |
| 59909 Peça 5 | ⚠️ a confirmar (asset não extraído no dump) |

## Fluxo AJO equivalente
```
Evento MRV_FTP_Implant_Cond_Jor (1 evento por linha do CSV)
  └─ Email "Introdução"
     → Wait até @event{MRV_FTP_Implant_Cond_Jor._mrv.condominiumEvent.implementationStartDate}
     → Email "Peça 1"
     → Wait até @event{MRV_FTP_Implant_Cond_Jor._mrv.condominiumEvent.date3}
     → Email "Peça 2"
     → Wait até @event{MRV_FTP_Implant_Cond_Jor._mrv.condominiumEvent.votingStartTimestamp}
     → Email "Peça 3"
     → (wait 2min do SFMC: dispensável — manter só se quiser espaçar os envios)
     → Email "Peça 4"
     → Wait até @event{MRV_FTP_Implant_Cond_Jor._mrv.condominiumEvent.date5}
     → Email "Peça 5"
     → Fim
```
- Os 4 **Wait By Attribute** viram **Wait com data customizada** no AJO, lendo a data do **payload do
  evento** (não do Profile) — a régua toda pode durar semanas entre a entrada e a Peça 5; validar o
  TTL/duração máxima da jornada no AJO.
- Sem splits → sem Conditions sobre `@event{}`; publicável direto após migrar os 6 assets.
- Endereço do canal e-mail = `personalEmail.address` do perfil (ou
  `@event{MRV_FTP_Implant_Cond_Jor._mrv.identityEvents.email}` se a régua respeitar o e-mail do arquivo).

## Mapeamento dos campos → XDM
Base: de-para `de_para_jornadas/sensiaImplantacaoCondCopy.md` (schema FTP_File_Event v1.7) + mapping
`AEP/scripts/mapping/sensiaImplantacaoCondCopy.json`. Ordem = header do CSV
(`6-19-2026-imp_condo (1).csv`, 18 colunas). ⚠️ O mapper C# atual **não** cobre estes campos — ver Gaps.

| # | Campo CSV | Campo AEP (XDM) | FG | 🆕 | Uso no AJO / Obs |
|---|---|---|---|:--:|---|
| 0 | `nome` | **Profile** `person.name.firstName` / `person.name.fullName` (via cpfHash) — **não vai no evento** | Profile | | personalização de saudação nos e-mails |
| 1 | `cpf` | `_mrv.identityEvents.cpfHash` | Identity | | identidade (namespace `cpf_hash`); a Function gera o hash; Subscriber Key no SFMC |
| 2 | `e-mail` | `_mrv.identityEvents.email` | Identity | | endereço do canal e-mail · compõe `phoneEmail` (PK `telefone_email`) |
| 3 | `link` | `_mrv.condominiumEvent.actionLink` | FG-F | | `%%link%%` na Peça 2 — ⚠️ na amostra carrega **nome do empreendimento** ("Sensia Ponta Negra"), não URL |
| 4 | `prazo candidatura` | `_mrv.condominiumEvent.candidacyDeadline` | FG-F | | ⚠️ header grafado **com espaço** — personalização da Peça 1 |
| 5 | `video_candidato` | `_mrv.condominiumEvent.candidateVideoLink` | FG-F | | valor tipo data (`25/06/2026`) na amostra, apesar do nome |
| 6 | `inicio_votacao` | `_mrv.condominiumEvent.votingStartDate` | FG-F | | String (apesar do nome) — personalização da Peça 3 |
| 7 | `fim_votacao` | `_mrv.condominiumEvent.votingEndDate` | FG-F | | String — personalização das Peças 2 e 3 |
| 8 | `disponibilizacao_conteudo` | `_mrv.condominiumEvent.contentAvailabilityDate` | FG-F | | String |
| 9 | `Data1` | `_mrv.condominiumEvent.date1` | FG-F | | D6 opaca (timestamp `M/d/yyyy h:mm:ss AM`) — personalização formatada `dd/MM/yyyy` |
| 10 | `Data3` | `_mrv.condominiumEvent.date3` | FG-F | | **dirige o WAIT 2** + personalização formatada |
| 11 | `Data5` | `_mrv.condominiumEvent.date5` | FG-F | | **dirige o WAIT 4** + personalização formatada |
| 12 | `Datainiciovotacao` | `_mrv.condominiumEvent.votingStartTimestamp` | FG-F | | **dirige o WAIT 3** |
| 13 | `telefone` | `_mrv.identityEvents.phone` | Identity | | regra global (telefone → `phone`) · compõe `phoneEmail`; nenhum canal SMS/WA nesta jornada |
| 14 | `locale` | `_mrv.ftpFileImport.locale` | FG-I | | pt-BR (metadado) |
| 15 | `inicioimplanta` | `_mrv.condominiumEvent.implementationStartDate` | FG-F | | **dirige o WAIT 1** |
| 16 | `Data4` | `_mrv.condominiumEvent.date4` | FG-F | | D6 opaca — na amostra é **período** ("02/07 a 09/07"), usar como texto |
| 17 | `Data2` | `_mrv.condominiumEvent.date2` | FG-F | | D6 opaca — período ("15/06 a 22/06"), usar como texto |

## Fórmulas prontas para o AJO
Sempre com o nome **completo** do evento — nunca abreviar:

| Uso | Fórmula |
|---|---|
| E-mail do destinatário (se necessário no canal) | `@event{MRV_FTP_Implant_Cond_Jor._mrv.identityEvents.email}` |
| Wait 1 — início da implantação | `@event{MRV_FTP_Implant_Cond_Jor._mrv.condominiumEvent.implementationStartDate}` |
| Wait 2 — Data3 | `@event{MRV_FTP_Implant_Cond_Jor._mrv.condominiumEvent.date3}` |
| Wait 3 — início da votação | `@event{MRV_FTP_Implant_Cond_Jor._mrv.condominiumEvent.votingStartTimestamp}` |
| Wait 4 — Data5 | `@event{MRV_FTP_Implant_Cond_Jor._mrv.condominiumEvent.date5}` |
| `%%prazo candidatura%%` (Peça 1) | `@event{MRV_FTP_Implant_Cond_Jor._mrv.condominiumEvent.candidacyDeadline}` |
| `%%inicio_votacao%%` (Peça 3) | `@event{MRV_FTP_Implant_Cond_Jor._mrv.condominiumEvent.votingStartDate}` |
| `%%fim_votacao%%` (Peças 2/3) | `@event{MRV_FTP_Implant_Cond_Jor._mrv.condominiumEvent.votingEndDate}` |
| `%%link%%` (Peça 2) | `@event{MRV_FTP_Implant_Cond_Jor._mrv.condominiumEvent.actionLink}` |
| `%%Data2%%` / `%%Data4%%` (texto de período) | `@event{MRV_FTP_Implant_Cond_Jor._mrv.condominiumEvent.date2}` · `@event{MRV_FTP_Implant_Cond_Jor._mrv.condominiumEvent.date4}` |
| `Format(Data1, "dd/MM/yyyy")` | `formatDate(toDateTime(@event{MRV_FTP_Implant_Cond_Jor._mrv.condominiumEvent.date1}), "dd/MM/yyyy")` — idem `date3`/`date5` |
| Nome do cliente nos e-mails | `profile.person.name.firstName` — resolvido no **Profile** via cpfHash; **não** usar `@event{}` para nome |

- ⚠️ Lembrete de **concat**: sempre que texto fixo for montado junto com variável, use
  `concat("texto ", variável)` — ex.:
  `concat("As candidaturas vão até ", @event{MRV_FTP_Implant_Cond_Jor._mrv.condominiumEvent.candidacyDeadline})`
  ou `concat("Olá, ", profile.person.name.firstName)`. Nunca justapor texto + variável sem `concat(...)`.
- ⚠️ Os campos `date1/3/5` e `votingStartTimestamp`/`implementationStartDate` chegam como **String** no
  formato `M/d/yyyy h:mm:ss AM` — converter (`toDateTime`) antes de usar em Wait/format; já
  `prazo candidatura`, `inicio_votacao`, `fim_votacao` chegam `dd/MM/yyyy` e são usados como **texto puro**.

## Gaps / pendências
- ⚠️ **Mapper C# divergente do de-para** — `ImplantacaoCondominioAepMapper.cs` (Sensia) foi escrito para um
  payload de **4 colunas** (`nome,cpf,e-mail,momento_envio` → `ftpFileImport.sendMoment`) e **não mapeia**
  `condominiumEvent.*`, `phone` nem `locale`. O CSV real desta jornada tem **18 colunas** (conforme de-para
  e amostra). Reconciliar o mapper com o de-para — o irmão de AT (`AtImplantacaoCondominioAepMapper.cs`) já
  mapeia as 18 colunas e serve de referência, **mas os headers diferem** (`e-mail`/`prazo candidatura` na
  Sensia × `Email`/`prazo_candidatura` na AT).
- ⚠️ **Status de uso (Q1 da ficha)** — jornada "(Copy)", run log vazio fev–jun/2026 nos screenshots; porém o
  dump de jun/2026 da automation `imp` registra `lastRunTime = 2026-06-12`. Confirmar com o dono
  (Leandro Pimentel) se é viva/sazonal ou duplicata antes de investir na migração.
- ⚠️ **Header com espaço** — `prazo candidatura` (com espaço) precisa de tratamento explícito no parser CSV.
- ⚠️ **`link` ≠ URL** — na amostra o campo carrega o **nome do empreendimento**; confirmar a semântica antes
  de reproduzir o `%%link%%` da Peça 2.
- ⚠️ **Personalização das Peças 4 e 5** — assets 59908/59909 não extraídos no dump; confirmar quais campos usam.
- ⚠️ **Duração da jornada no AJO** — waits por data podem segurar o perfil por semanas; validar a duração
  máxima configurada da jornada (e o comportamento se a data do arquivo já passou: envio imediato × skip).
- `Data1`, `Data2`, `Data4` são required na DE mas só aparecem em personalização (não em waits) — uso
  confirmado nos assets 59905–59907; sem ação além de ingerir.
- Saúde operacional histórica ruim: **41% de erro** (13 falhas / 31 execuções) na automation — investigar
  causa (provável arquivo fora do layout) antes do cutover.

### Checklist
- [ ] Reconciliar o mapper C# `ImplantacaoCondominioAepMapper.cs` com o de-para (18 colunas, headers exatos da Sensia).
- [ ] Confirmar com o dono se a jornada é viva (Q1) — decide se entra na wave de migração.
- [ ] Confirmar personalização das Peças 4 e 5 (assets 59908/59909).
- [ ] Confirmar semântica do campo `link` (URL × nome do empreendimento).
- [ ] Migrar os **6 assets de e-mail** (59904–59909), convertendo AMPscript `Format()` → `formatDate` e `%%campo%%` → fórmulas `@event{}` com os paths completos da tabela acima (ex.: `@event{MRV_FTP_Implant_Cond_Jor._mrv.condominiumEvent.candidacyDeadline}`).
- [ ] Modelar os 4 waits por data no AJO (data do payload do evento, timezone America/Sao_Paulo) e validar duração máxima.
- [ ] Configurar re-entrada (`MultipleEntries` no SFMC) — permitir nova entrada a cada arquivo.
- [ ] Validar paridade: linhas do CSV × eventos AEP + spot-check das 4 datas de wait.

## Complexidade
🟡 **Média** — fluxo linear de 6 e-mails **sem splits**, mas orquestrado por **4 Wait By Attribute** sobre
datas do payload (a redesenhar como waits dinâmicos no AJO) e com o **mapper C# ainda divergente do
de-para** (4 × 18 colunas), exigindo reconciliação da ingestão antes do go-live.
