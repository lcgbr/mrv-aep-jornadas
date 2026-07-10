# Instrução de mapeamento — Jornada Convocação Eleição PA · evento **MRV_FTP_Jor_Convoc_Eleicao_PA** (FTP)

> Jornada Sensia **sazonal** (período de eleição da comissão de PA): FTP file drop → import na DE →
> **1 e-mail** de convocação + wait de 1 dia. **Sem SQL, sem splits, sem router** — a menor orquestração
> possível. A única atenção é de **nomenclatura**: existem 3 trilhas de nome quase idêntico (ver alerta).

## Identificação
| | |
|---|---|
| Jornada SFMC | **Jornada Convocação Eleição PA** (`148f3f8a-0890-4959-b250-eb8cabf6e600`, BU `sensia`) |
| Entrada | `AutomationAudience` → automation **`AU Eleição da Comissão de PA`** (raw `36046ef6-51a2-4e2c-812d-c2a3d4d9564a`) — **FTP file drop** em `import\convocação eleição pa\` (`%%BASEFILENAME_FROM_TRIGGER%%.csv`, delimitador `;`) |
| DE de entrada | `Eleicao_Comissão_de_PA` (219 registros · Overwrite · PK composta CPF+Email · Subscriber Key = **Email**) |
| `sourceEventType` | `sensiaConvocacaoEleicaoPa` · payload `eventType = sensia.ftpFileImport` |
| Evento AJO | **`MRV_FTP_Jor_Convoc_Eleicao_PA`** (definição do evento no AJO: `eventType = dcsExternal`) |
| Canal / assets | **só e-mail** — 1 envio: "PEÇA - Convocação Eleição PA" (asset **70259**) |
| Mapper C# | `ConvocacaoEleicaoPaAepMapper.cs` (`AEPIngestion.Core/Models/AEP/Sensia/`) — pronto |
| Status operacional | ⚠️ **sem execução desde 12/09/2025** — provável sazonal (roda só em período eleitoral) |

### ⚠️ Não confundir — 3 trilhas de nome parecido
| Trilha | BU | Evento AJO | Observação |
|---|---|---|---|
| **Jornada Convocação Eleição PA** (esta) | `sensia` | `MRV_FTP_Jor_Convoc_Eleicao_PA` | automation `AU Eleição da Comissão de PA` → DE `Eleicao_Comissão_de_PA` |
| JB_Convocacao_Eleição_PA | `mrv-relacionamento` | `MRV_FTP_Convoc_Elei_PA` | `relacionamentoJbConvocacaoEleicaoPa`; automation **`AU_Convocacao_Eleição_PA`** (raw `edafe876-de0b-…`) → DE `Convocacao_Eleicao_PA` (1076 reg.) — **jornada irmã, spec própria** |
| Eleicao_Comissão_de_PA (trilha de dados) | `sensia` | **SEM evento** no export | `sensiaEleicaoComissaoDePa` — de-para irmão de layout idêntico; **não usar** para esta jornada |

O raw `edafe876` ("AU_Convocacao_Eleição_PA"), citado na triagem como candidato, pertence à **irmã de
Relacionamento** — o raw correto desta jornada é o `36046ef6` da pasta `sensia`. Repare a inversão de
nomes: a automation da jornada *Convocação* (Sensia) chama-se "AU **Eleição da Comissão** de PA", e a DE
também — cuidado redobrado ao localizar assets no SFMC.

## Envelope do evento
| Campo | Valor |
|---|---|
| Evento AJO | `MRV_FTP_Jor_Convoc_Eleicao_PA` (`eventType = dcsExternal` no ajo_event_map) |
| `eventType` (payload XDM) | `sensia.ftpFileImport` |
| `_mrv.sourceContext.sourceEventType` | `sensiaConvocacaoEleicaoPa` |
| `_mrv.sourceContext.sourceSystem` | `FTPFileImport` (fixo) |
| `_mrv.ftpFileImport.sourceFileName` | nome do arquivo recebido (ex.: `6-19-2026-Convocacao_Eleicao_PA.csv`) |

## Fluxo AS-IS (SFMC)
```
File drop  import\convocação eleição pa\  (Queue Files: Off)
  └─ Import → DE Eleicao_Comissão_de_PA  (Overwrite · Skip rows with bad data · Fail on blank)
     └─ Journey Entry "Jornada Convocação Eleição PA"  (batch · Evaluates all records · sem filtro)
        └─ Email "PEÇA - Convocação Eleição PA"  (asset 70259 · AMPscript @NOME, @Dia, @Parceiro)
           └─ Wait 1 dia → Fim
```
- **Nenhuma Query Activity** — o workflow é só import + journey entry.
- Date Format do import = **English (US)** — relevante para o campo `Dia` (difere das demais jornadas Sensia).

## Fluxo AJO equivalente
```
Evento MRV_FTP_Jor_Convoc_Eleicao_PA
  └─ Email "Convocação Eleição PA"  → Fim
```
- Jornada 1-evento/1-mensagem, **sem condition, publicável direto**. O Wait de 1 dia final é só retenção
  antes do Fim — dispensável no AJO.
- Endereço do canal e-mail: `personalEmail.address` do perfil (ou
  `@event{MRV_FTP_Jor_Convoc_Eleicao_PA._mrv.identityEvents.email}` se a régua tiver que respeitar
  exatamente o e-mail do arquivo — no SFMC a Subscriber Key era o Email do arquivo).

## Mapeamento dos campos → XDM
Base: de-para `sensiaConvocacaoEleicaoPa.md` · conferido contra `ConvocacaoEleicaoPaAepMapper.cs` (batem 1:1; nenhum leaf 🆕).

| # | Campo CSV | Campo AEP (XDM) | FG | Tipo | Uso / Obs |
|---|---|---|---|---|---|
| 0 | `Nome` | *(Profile via identidade — não vai no evento)* → `person.name.firstName` / `person.name.fullName` | Profile | — | Resolvido no Profile via `cpfHash` |
| 1 | `CPF` | `_mrv.identityEvents.cpfHash` | Identity | String | Identidade primária (namespace `cpf_hash`); a Function gera o hash |
| 2 | `Email` | `_mrv.identityEvents.email` | Identity | String | Endereço do canal e-mail |
| 3 | `Parceiro` | `_mrv.condominiumEvent.partnerName` | FG-F | String | Personalização do corpo |
| 4 | `Dia` | `_mrv.condominiumEvent.electionDate` | FG-F | String | ⚠️ chega como **string** em formato US — ver pendências |

## Fórmulas prontas (personalização no AJO)
| AMPscript (SFMC) | Fórmula AJO |
|---|---|
| `@NOME` | `{{profile.person.name.firstName}}` — **do Profile**, resolvido via cpfHash (o nome NÃO vai no evento) |
| `@Dia` | `@event{MRV_FTP_Jor_Convoc_Eleicao_PA._mrv.condominiumEvent.electionDate}` |
| `@Parceiro` | `@event{MRV_FTP_Jor_Convoc_Eleicao_PA._mrv.condominiumEvent.partnerName}` |
| e-mail (canal) | `@event{MRV_FTP_Jor_Convoc_Eleicao_PA._mrv.identityEvents.email}` |

> **Lembrete concat:** sempre que a variável for usada junto com texto fixo no template, é obrigatório
> `concat`, ex.: `concat("A eleição acontecerá no dia ", @event{MRV_FTP_Jor_Convoc_Eleicao_PA._mrv.condominiumEvent.electionDate})`
> ou `concat("Administradora: ", @event{MRV_FTP_Jor_Convoc_Eleicao_PA._mrv.condominiumEvent.partnerName})` —
> nunca justapor texto + `@event{}` sem concat.

## Gaps / pendências
- [ ] ⚠️ **Nome do arquivo × trilha de dados irmã**: o de-para desta jornada cita `…Convocacao_Eleicao_PA.csv`, mas a DE do SFMC chama `Eleicao_Comissão_de_PA` e existe a trilha irmã `sensiaEleicaoComissaoDePa` (layout idêntico, SEM evento). Confirmar com o produtor **qual nome físico de arquivo** será enviado, para não cruzar as trilhas na ingestão.
- [ ] ⚠️ **Identidade**: o mapping JSON declara primária `telefone_email` (`phoneEmail` montado só do Email — o CSV não tem telefone), mas o mapper C# atual só carrega `cpfHash` + `email`. Confirmar se a Function preenche `phoneEmail` ou se `cpf_hash` fica como primária.
- [ ] ⚠️ **Subscriber Key = Email** no SFMC (≠ CPF das outras jornadas Sensia) — garantir que a resolução de identidade no AEP (cpfHash + email) reconstrói o mesmo perfil, senão a personalização de `@NOME` via Profile falha.
- [ ] ⚠️ **Campo `Dia` em Date Format English (US)**: `electionDate` é string — se o e-mail precisar exibir a data em pt-BR, tratar a formatação no template (ou padronizar no arquivo de origem).
- [ ] ⚠️ **Sazonalidade (Q1 da ficha)**: sem execução desde 12/09/2025 e pasta FTP vazia. A ficha sugeria Read Audience/campanha pontual, mas a trilha FTP-evento (mapper + evento AJO) já está pronta — confirmar com o dono (Leandro Pimentel) se migra como jornada event-driven ou vira campanha pontual.
- [ ] Migrar o asset de e-mail **70259** ("PEÇA - Convocação Eleição PA") convertendo o AMPscript `@NOME`/`@Dia`/`@Parceiro` para as fórmulas acima.
- [ ] Confirmar regra de re-entry (a DE é Overwrite; no SFMC a jornada avaliava todos os registros a cada carga).

## Complexidade
🟢 **Baixa** — 1 e-mail + 1 wait, sem splits nem SQL; o único trabalho real é converter o AMPscript para `@event{}`/Profile e decidir a pendência sazonal (jornada event-driven × campanha pontual).
