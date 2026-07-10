# Instrução de mapeamento — Jornada Implantação Condominio · evento **MRV_FTP_Implant_Cond** (FTP)

> Régua **multicanal (e-mail + SMS)** da implantação de condomínio da **Assistência Técnica (MRV)**:
> 7 envios (6 e-mails distintos + 1 SMS; o e-mail "Peça 4" é reenviado) orquestrados **sem nenhum
> decision split** — a cadência inteira sai de **4 Wait By Attribute** sobre datas que chegam prontas no
> arquivo (`inicioimplanta`, `Data3`, `Datainiciovotacao`, `Data5`) + **4 waits por duração** (2d, 2d, 1d, 1d).
> ⚠️ **NÃO confundir** com a jornada IRMÃ da **Sensia** (`sensiaImplantacaoCondCopy` → evento
> `MRV_FTP_Implant_Cond_Jor`, spec `instrucao_mapeamento_ftp_implantacao_cond_sensia.md`): são jornadas
> distintas, com CSVs de headers diferentes (`Email`/`prazo_candidatura` aqui — sublinhado × `e-mail`/`prazo
> candidatura` com espaço lá) e a Sensia é **só e-mail**. Os eventos AJO foram **renomeados em jul/2026**
> justamente para separá-las.

## Identificação
| | |
|---|---|
| Jornada (SFMC) | **Jornada Implantação Condominio** |
| journeyId | `c242c03b-c5d4-4159-9a64-3d4e4fcf7a1d` (BU `mrv-assistencia-tecnica`) · Published · MultipleEntries · sem filtro de entrada |
| Tipo de entrada | `AutomationAudience` → **FTP file import**: automation **`Imp_Condo`** (`0c286883-b185-4a48-ad53-50dd15ebe2c7`, key `951ee02c-…`, file drop `import\imp_condo\`, Queue Files = true, `triggerActive`) → import Activity `Imp_Condominio` (Overwrite assumido) → Journey Entry |
| Data Extension | `Imp_Condo` (key `5979B8B7-B54D-4ADB-9904-57EF0B7D254A`, id `a6cb555b-622d-ee11-ba53-48df37e63d26`) · 18 colunas (`Imp_Condo_fields.json`) · ~226–251 registros/execução |
| Canal / assets | **e-mail + SMS** — 6 e-mails (IDs 52171 · 51624 · 51625 · 51626 · 51627 · 51628; o 51627 dispara 2×) + 1 SMS (assetId 127381, short code **29520**) |
| `sourceEventType` | `assistenciaTecnicaImplantacaoCondominio` |
| Evento AJO alvo | **`MRV_FTP_Implant_Cond`** (`eventType = dcsExternal` no AJO — ver Envelope) |
| Identidade | primária **`phoneEmail`** (namespace `telefone_email`, composto `+telefone`+`Email`) + secundária **`cpfHash`** (namespace `cpf_hash`; a Function gera o hash a partir de `cpf`) |
| Mapper C# | `AtImplantacaoCondominioAepMapper.cs` (AT) — **alinhado ao de-para** (cobre as 18 colunas / `condominiumEvent.*`) |
| Dono MRV | Leandro Pimentel · Complexidade (Excel) = Média · run ativo (última execução 2026-06-26) |
| Jornada IRMÃ (não confundir) | **Implantação cond. Jornada (Copy)** — `sensiaImplantacaoCondCopy` → evento `MRV_FTP_Implant_Cond_Jor` (BU `sensia`) — **fora do escopo** desta spec |

## Envelope do evento
| Campo | Valor |
|---|---|
| Evento AJO (`ajo_event_map.json`) | `MRV_FTP_Implant_Cond` · **`eventType = dcsExternal`** (evento externo via streaming — **não** é o valor do campo XDM) |
| `eventType` (campo XDM do payload) | `assistenciaTecnica.ftpFileImport` (mapper C# + dump `requests_jornadas/assistenciaTecnicaImplantacaoCondominio_1.json`) |
| `_mrv.sourceContext.sourceEventType` | `assistenciaTecnicaImplantacaoCondominio` |
| `_mrv.sourceContext.sourceSystem` | `FTPFileImport` (fixo) |
| `_mrv.ftpFileImport.sourceFileName` | nome do arquivo recebido (ex.: `Imp_Condo_fields.json`) |

## Fluxo AS-IS (SFMC) resumido
```
Arquivo cai em import\imp_condo\  →  automation "Imp_Condo" (import → DE Imp_Condo → Journey Entry)
└─ EMAIL 52171  "Implantação Condominio0"  (assunto: Um momento transformador está próximo!)
   → WAIT by attribute: inicioimplanta
   → EMAIL 51624  "Implantação Condominio1"  (assunto: Um momento transformador está próximo!)
   → WAIT by attribute: Data3  (às 11:00)
   → EMAIL 51625  "Implantação Condominio2"  (assunto: A inscrição finalizou, prepare-se…)
   → WAIT by attribute: Datainiciovotacao  (às 11:00)
   → EMAIL 51626  "Implantação Condominio3"  (assunto: Hora de escolher seus representantes!)
   → WAIT 2 dias  (às 00:00)
   → EMAIL 51627  "Implantação Condominio4"  (assunto: Já escolheu seus representantes?)
   → WAIT 2 dias  (às 00:00)
   → SMS  assetId 127381  (short code 29520 — lembrete de votação)
   → WAIT 1 dia
   → EMAIL 51627  "Implantação Condominio4"  (REENVIO — mesmo asset)
   → WAIT by attribute: Data5  (às 11:00)
   → EMAIL 51628  "Implantação Condominio5"  (assunto: A votação foi um sucesso! Conheça seu Síndico!)
   → WAIT 1 dia → Fim
```
- 16 atividades: **7 envios** (6 EMAILV2 + 1 SMS; o e-mail 51627 aparece 2×) · **8 WAIT** (4 por atributo de
  data + 4 por duração) — **nenhum decision split** (`filterDefinitionId` zerado; todo o batch entra).
- Waits por atributo em timezone `E. South America Standard Time`, lendo a data **do próprio evento de
  entrada** — as datas chegam prontas no arquivo, sem SQL.
- Re-entry: `MultipleEntries` (cada novo arquivo pode reinserir o mesmo CPF).

### Personalização (AMPscript no SFMC)
| Asset | Campos usados |
|---|---|
| 52171 Peça 0 (intro) | — (estático; sem variáveis identificadas) |
| 51624 Peça 1 | `%%Nome%%` · `%%prazo_candidatura%%` · `Format(Data1/3/5,"dd/MM")` · `%%Data2%%` · `%%Data4%%` |
| 51625 Peça 2 | `%%video_candidato%%` · `%%=RedirectTo(@video)=%%` · `Format(Data1-5,"dd/MM")` · `%%Data2%%` · `%%Data4%%` |
| 51626 Peça 3 | `%%Nome%%` · `%%disponibilizacao_conteudo%%` · `%%inicio_votacao%%` · `%%fim_votacao%%` · `Format(Data1-5,"dd/MM")` |
| 51627 Peça 4 (2×) | `Format(Data1-5,"dd/MM")` · `%%Data2%%` · `%%Data4%%` |
| 51628 Peça 5 (final) | `Format(Data1-5,"dd/MM")` · `%%Data2%%` |
| SMS 127381 | `%%fim_votacao%%` |

## Fluxo AJO equivalente
```
Evento MRV_FTP_Implant_Cond (dcsExternal — 1 evento por linha do CSV)
  └─ Email "Peça 0" (intro)
     → Wait até @event{MRV_FTP_Implant_Cond._mrv.condominiumEvent.implementationStartDate}
     → Email "Peça 1"
     → Wait até @event{MRV_FTP_Implant_Cond._mrv.condominiumEvent.date3}          (11:00)
     → Email "Peça 2"
     → Wait até @event{MRV_FTP_Implant_Cond._mrv.condominiumEvent.votingStartTimestamp} (11:00)
     → Email "Peça 3"
     → Wait 2 dias (duração fixa)
     → Email "Peça 4"
     → Wait 2 dias (duração fixa)
     → SMS  (short code 29520)
     → Wait 1 dia (duração fixa)
     → Email "Peça 4" (REENVIO — replicar o nó com o mesmo conteúdo)
     → Wait até @event{MRV_FTP_Implant_Cond._mrv.condominiumEvent.date5}           (11:00)
     → Email "Peça 5"
     → Fim
```
- Os 4 **Wait By Attribute** viram **Wait com data customizada** no AJO, lendo a data do **payload do
  evento** (não do Profile) — a régua pode durar semanas entre a entrada e a Peça 5; validar TTL/duração
  máxima da jornada no AJO.
- Sem splits → sem Conditions sobre `@event{}`; publicável direto após migrar os 7 assets.
- Endereço do canal e-mail = `profile.personalEmail.address` (ou
  `@event{MRV_FTP_Implant_Cond._mrv.identityEvents.email}` se a régua respeitar o e-mail do arquivo);
  número do SMS = `@event{MRV_FTP_Implant_Cond._mrv.identityEvents.phone}`.

## Mapeamento dos campos → XDM
Base: de-para `de_para_jornadas/assistenciaTecnicaImplantacaoCondominio.md` (schema FTP_File_Event v1.7) +
mapping `AEP/scripts/mapping/assistenciaTecnicaImplantacaoCondominio.json`, conferido contra o mapper C#
`AtImplantacaoCondominioAepMapper.cs`. Ordem = header do CSV (`Imp_Condo_fields.json`, 18 colunas).

| # | Campo CSV | Campo AEP (XDM) | FG | 🆕 | Uso no AJO / Obs |
|---|---|---|---|:--:|---|
| 0 | `nome` | **Profile** `person.name.firstName` / `person.name.fullName` (via cpfHash) — **não vai no evento** | Profile | | `%%Nome%%` das Peças 1 e 3 |
| 1 | `cpf` | `_mrv.identityEvents.cpfHash` | Identity | | identidade secundária (namespace `cpf_hash`); a Function gera o hash; Subscriber Key no SFMC |
| 2 | `Email` | `_mrv.identityEvents.email` | Identity | | endereço do canal e-mail · compõe `phoneEmail` (PK `telefone_email`) |
| 3 | `link` | `_mrv.condominiumEvent.actionLink` | FG-F | | ⚠️ não aparece explicitamente nos assets extraídos — confirmar uso/semântica |
| 4 | `prazo_candidatura` | `_mrv.condominiumEvent.candidacyDeadline` | FG-F | | `%%prazo_candidatura%%` da Peça 1 (texto) |
| 5 | `video_candidato` | `_mrv.condominiumEvent.candidateVideoLink` | FG-F | | `%%video_candidato%%` / `RedirectTo(@video)` da Peça 2 — ⚠️ na amostra irmã carrega valor tipo data, não URL |
| 6 | `inicio_votacao` | `_mrv.condominiumEvent.votingStartDate` | FG-F | | `%%inicio_votacao%%` da Peça 3 — String (texto, apesar do nome) |
| 7 | `fim_votacao` | `_mrv.condominiumEvent.votingEndDate` | FG-F | | `%%fim_votacao%%` da Peça 3 **e do SMS** — String (texto) |
| 8 | `disponibilizacao_conteudo` | `_mrv.condominiumEvent.contentAvailabilityDate` | FG-F | | `%%disponibilizacao_conteudo%%` da Peça 3 (texto) |
| 9 | `Data1` | `_mrv.condominiumEvent.date1` | FG-F | | D6 opaca — `Format(Data1,"dd/MM")` nas Peças 1–5 |
| 10 | `Data3` | `_mrv.condominiumEvent.date3` | FG-F | | **dirige o WAIT 2** (11:00) + personalização formatada |
| 11 | `Data5` | `_mrv.condominiumEvent.date5` | FG-F | | **dirige o WAIT 4** (11:00) + personalização formatada |
| 12 | `Datainiciovotacao` | `_mrv.condominiumEvent.votingStartTimestamp` | FG-F | | **dirige o WAIT 3** (11:00) |
| 13 | `inicioimplanta` | `_mrv.condominiumEvent.implementationStartDate` | FG-F | | **dirige o WAIT 1** |
| 14 | `telefone` | `_mrv.identityEvents.phone` | Identity | | número do canal **SMS** (short code 29520) · compõe `phoneEmail` |
| 15 | `locale` | `_mrv.ftpFileImport.locale` | FG-I | | pt-BR (metadado) |
| 16 | `Data2` | `_mrv.condominiumEvent.date2` | FG-F | | D6 opaca — `%%Data2%%` como **texto** (período) nas Peças 1/2/4/5 |
| 17 | `Data4` | `_mrv.condominiumEvent.date4` | FG-F | | D6 opaca — `%%Data4%%` como **texto** (período) nas Peças 1/2/4 |

## Fórmulas prontas para o AJO
Sempre com o nome **completo** do evento — nunca abreviar:

| Uso | Fórmula |
|---|---|
| E-mail do destinatário (se necessário no canal) | `@event{MRV_FTP_Implant_Cond._mrv.identityEvents.email}` |
| Número do SMS | `@event{MRV_FTP_Implant_Cond._mrv.identityEvents.phone}` |
| Wait 1 — início da implantação | `@event{MRV_FTP_Implant_Cond._mrv.condominiumEvent.implementationStartDate}` |
| Wait 2 — Data3 (11:00) | `@event{MRV_FTP_Implant_Cond._mrv.condominiumEvent.date3}` |
| Wait 3 — início da votação (11:00) | `@event{MRV_FTP_Implant_Cond._mrv.condominiumEvent.votingStartTimestamp}` |
| Wait 4 — Data5 (11:00) | `@event{MRV_FTP_Implant_Cond._mrv.condominiumEvent.date5}` |
| `%%prazo_candidatura%%` (Peça 1) | `@event{MRV_FTP_Implant_Cond._mrv.condominiumEvent.candidacyDeadline}` |
| `%%video_candidato%%` (Peça 2) | `@event{MRV_FTP_Implant_Cond._mrv.condominiumEvent.candidateVideoLink}` |
| `%%disponibilizacao_conteudo%%` (Peça 3) | `@event{MRV_FTP_Implant_Cond._mrv.condominiumEvent.contentAvailabilityDate}` |
| `%%inicio_votacao%%` (Peça 3) | `@event{MRV_FTP_Implant_Cond._mrv.condominiumEvent.votingStartDate}` |
| `%%fim_votacao%%` (Peça 3 + SMS) | `@event{MRV_FTP_Implant_Cond._mrv.condominiumEvent.votingEndDate}` |
| `%%link%%` (se usado) | `@event{MRV_FTP_Implant_Cond._mrv.condominiumEvent.actionLink}` |
| `%%Data2%%` / `%%Data4%%` (texto de período) | `@event{MRV_FTP_Implant_Cond._mrv.condominiumEvent.date2}` · `@event{MRV_FTP_Implant_Cond._mrv.condominiumEvent.date4}` |
| `Format(Data1,"dd/MM")` | `formatDate(toDateTime(@event{MRV_FTP_Implant_Cond._mrv.condominiumEvent.date1}), "dd/MM")` — idem `date3`/`date5` |
| Nome do cliente nos e-mails | `profile.person.name.firstName` — resolvido no **Profile** via cpfHash; **não** usar `@event{}` para nome |

- ⚠️ Lembrete de **concat**: sempre que texto fixo for montado junto com variável, use
  `concat("texto ", variável)` — ex.:
  `concat("As candidaturas vão até ", @event{MRV_FTP_Implant_Cond._mrv.condominiumEvent.candidacyDeadline})`,
  `concat("A votação encerra em ", @event{MRV_FTP_Implant_Cond._mrv.condominiumEvent.votingEndDate})` (SMS),
  ou `concat("Olá, ", profile.person.name.firstName)`. Nunca justapor texto + variável sem `concat(...)`.
- ⚠️ Os campos `date1/3/5`, `votingStartTimestamp` e `implementationStartDate` chegam como **String** no
  formato opaco (`M/d/yyyy h:mm:ss AM`) — converter com `toDateTime(...)` antes de usar em Wait/`formatDate`.
  Já `prazo_candidatura`, `inicio_votacao`, `fim_votacao`, `Data2`, `Data4` chegam como **texto puro** e são
  usados direto (sem conversão).

## Gaps / pendências
- ⚠️ **Divergência ficha × workflow**: a ficha de assessment marca "Com splits" na seção F, mas o **workflow
  detalhado** (doc gerado + `_workflow.json`) afirma **"Não há splits de decisão"** — a jornada é **linear**.
  Prevalece o workflow detalhado; nenhuma Condition sobre `@event{}` é necessária. Confirmar na tela se
  restou algum split residual.
- ⚠️ **E-mail 51627 reenviado (2×)** — disparado nos passos 9 e 13 do SFMC; replicar **dois nós** de e-mail
  com o mesmo asset no AJO (não é um único envio).
- ⚠️ **Canal SMS** — asset 127381, short code **29520**, corpo com `%%fim_votacao%%`. Diferente da Wedo, o
  SMS **não** vem pré-composto: montar o texto no nó SMS do AJO usando `concat(...)` +
  `@event{MRV_FTP_Implant_Cond._mrv.condominiumEvent.votingEndDate}`. Confirmar short code e opt-in no canal SMS do AJO.
- ⚠️ **`video_candidato` / RedirectTo(@video)** — na amostra da irmã o campo carrega valor tipo data, não URL;
  confirmar a semântica antes de reproduzir o link de vídeo da Peça 2.
- ⚠️ **`link` (actionLink)** — não aparece explicitamente nos assets extraídos; confirmar se é usado em alguma peça.
- ⚠️ **Waits por atributo** — 4 datas do payload (`inicioimplanta`, `date3`, `votingStartTimestamp`, `date5`)
  segurando o perfil por semanas; validar duração máxima da jornada e o comportamento se a data do arquivo já
  passou (envio imediato × skip). Timezone alvo: America/Sao_Paulo.
- `Data1`, `Data2`, `Data4` são datas opacas usadas só em personalização (não em waits) — sem ação além de ingerir.

### Checklist
- [ ] Confirmar na tela que a jornada é **linear** (sem splits residuais) — resolve a divergência ficha × workflow.
- [ ] Migrar os **6 assets de e-mail** (52171, 51624, 51625, 51626, 51627, 51628) + **1 SMS** (127381),
  convertendo AMPscript `Format()` → `formatDate(toDateTime(...))` e `%%campo%%` → fórmulas `@event{}` com os
  paths completos da tabela acima (ex.: `@event{MRV_FTP_Implant_Cond._mrv.condominiumEvent.candidacyDeadline}`).
- [ ] Replicar o **reenvio** do e-mail 51627 (dois nós no AJO).
- [ ] Modelar os **4 waits por atributo** (data do payload, timezone America/Sao_Paulo, horário 11:00 nos
  3 últimos) + os **4 waits por duração** (2d, 2d, 1d, 1d) e validar a duração máxima da jornada.
- [ ] Confirmar short code **29520** e opt-in no canal SMS do AJO.
- [ ] Confirmar semântica de `video_candidato` (link × data) e uso do `link` (actionLink).
- [ ] Validar paridade: linhas do CSV × eventos AEP + spot-check das 4 datas de wait.

## Complexidade
🟡 **Média** — régua **linear (sem splits)**, porém **multicanal** (6 e-mails + 1 SMS, com o e-mail "Peça 4"
reenviado) orquestrada por **4 Wait By Attribute** sobre datas do payload + **4 waits por duração**; o esforço
está na recriação dos 7 assets (AMPscript `Format` → `formatDate`, `%%campo%%` → `@event{}`) e na modelagem
dos waits dinâmicos, não em lógica de decisão — o mapper C# já cobre as 18 colunas.
