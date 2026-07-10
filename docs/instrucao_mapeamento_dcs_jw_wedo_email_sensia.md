# Instrução de mapeamento — JB_Wedo_Email (Sensia) · evento **MRV_FTP_JW_Wedo_Email_Sensia** (DCS)

> **Irmã Sensia** da `JB_Wedo_Email` de Cobrança (spec `instrucao_mapeamento_ftp_jb_wedo_email.md`).
> Mesmo padrão: a Wedo pré-calcula qual mensagem cada contato recebe (`ID_Mensagem_Email`) e a jornada é
> um **switch/case → e-mail**. A variante Sensia é **menor e mais simples**: **7 saídas (IDs 56–62, 1 ID por
> split)** contra 12 saídas com conjuntos de IDs na irmã, e **assunto fixo por template** (sem o AMPscript
> `@Assunto` dinâmico da Cobrança). Família **Wedo = evento `dcsExternal`** no AJO (não é o mold FTP-CSV).
> ⚠️ Atenção: a jornada está **DORMENTE** — sem execução em 2026 (última run da automation: 18/12/2023).

## Identificação
| | |
|---|---|
| Jornada (SFMC) | **JB_Wedo_Email** (Sensia) |
| journeyId | `f677e904-637a-4eeb-b6c5-e66a0eac98c1` (BU `sensia`) · Published · v3 · MultipleEntries |
| Tipo de entrada | `AutomationAudience` → automation **`Wedo`** (`544da735-f2fd-4025-899f-ade8a592b1b6`, file drop `import\wedo\`, queue on) → import **`Imp_Wedo`** (Overwrite) → DE → Journey Entry |
| Data Extension | `Email_Wedo` (`88933164-b208-ee11-ba55-48df37e63c5c` · `AutomationAud-413db89a-be25-86cf-84f6-0981c8ead70b`) — 39 colunas, delimitador `;`, Subscriber Key = `CPF_CNPJ` |
| `sourceEventType` | `sensiaJbWedoEmail` |
| Evento AJO alvo | **`MRV_FTP_JW_Wedo_Email_Sensia`** (existe no mapa; `eventType = dcsExternal` no AJO — ver Envelope) |
| Canal / assets | **só e-mail** (endereço `Email_Cliente`; sem SMS/WhatsApp) — **7 templates** Sensia (emailIds 15816–15823, pasta Content Builder `Renegociação`) |
| Identidade | `CPF_CNPJ` → `cpfHash` (namespace `cpf_hash`; a Function gera o hash) — atenção: o campo aceita CPF **e** CNPJ |
| Mapper C# | `WedoEmailSensiaAepMapper.cs` (**já implementado**, espelha a jornada Cobrança WedoEmail; blocos `installmentDetailsBlock`/`contractDebtBlock` serializados em JSON) |
| Jornada IRMÃ (não confundir) | `JB_Wedo_Email` da **Cobrança** (`f1e95a84-c1a3-494d-8f04-e87fa717fafd`, BU `mrv-cobranca-portal`, evento `MRV_FTP_JB_Wedo_Email`, router de **12** e-mails) — mesmo nome, BU e evento **diferentes** |
| Status operacional | ⚠️ **DORMENTE**: 0 execuções em 2026, DE com 3 registros, retenção off — decidir migrar × descontinuar antes de investir |

## Envelope do evento
| Campo | Valor |
|---|---|
| Evento AJO (`ajo_event_map.json`) | `MRV_FTP_JW_Wedo_Email_Sensia` · **`eventType = dcsExternal`** (evento externo via streaming — atenção: **não** é o valor do campo XDM) |
| `eventType` (campo XDM do payload) | `sensia.ftpFileImport` (conforme mapper C# e dumps `requests_jornadas/sensiaJbWedoEmail_*.json`) |
| `_mrv.sourceContext.sourceEventType` | `sensiaJbWedoEmail` |
| `_mrv.sourceContext.sourceSystem` | `FTPFileImport` (fixo) |
| `_mrv.ftpFileImport.sourceFileName` | nome do arquivo recebido (ex.: `6-19-2026-Email_Wedo.csv`) |

## Fluxo AS-IS (SFMC) resumido
Cadeia de **7 decision splits** (MULTICRITERIADECISIONV2-8…14), cada um testando `ID_Mensagem_Email`
contra **um único valor** (na irmã de Cobrança cada split testa um *conjunto* de IDs):

```
Arquivo cai em import\wedo\ → automation Wedo (Imp_Wedo Overwrite → DE Email_Wedo) → Journey Entry
└─ SPLIT ID_Mensagem_Email (cadeia de 7):
   ├─ 56 → EMAIL "Preventivo"   (15823, "Não desista da sua conquista")                      → wait 1min → Fim
   ├─ 57 → EMAIL "5 a 30"       (15818, "A Sensia quer você cada vez mais próximo…")         → wait 1min → Fim
   ├─ 58 → EMAIL "31 a 60"      (15819, "Siga em frente na conquista do seu lugar no mundo") → wait 1min → Fim
   ├─ 59 → EMAIL "60 a 90"      (15820, "Não deixe nada afastar você da sua conquista")      → wait 1min → Fim
   ├─ 60 → EMAIL "91 a 120"     (15821, "Limpe seu nome regularizando o seu contrato!")      → wait 1min → Fim
   ├─ 61 → EMAIL "121 a 150"    (15822, "Regularize seu contrato o quanto antes")            → wait 1min → Fim
   ├─ 62 → EMAIL "271 a 360"    (15816, "Notificação Extrajudicial")                         → wait 1min → Fim
   └─ Remainder → wait 1min → Fim (sem envio)
```
- 22 atividades: **7 EMAILV2 · 7 MULTICRITERIADECISION · 8 WAIT (1 min)** — waits só de retenção, dispensáveis no AJO.
- **Assunto fixo** em cada template (diferente da irmã, que deriva o assunto via AMPscript `@Assunto`).
- Personalização AMPscript nos assets: `%%Nome_Cliente%%` (todos), `%%Identificador_Parcela%%` +
  `%%=Format([Vencimento_Parcela],"dd/MM/yyyy")=%%` (Preventivo), `%%Residencial%%` (5 a 30, 91 a 120, 121 a 150).
- Sem filtro de entrada, sem SQL — `ID_Mensagem_Email` **vem pronto** da Wedo.

## Fluxo AJO equivalente
```
Evento MRV_FTP_JW_Wedo_Email_Sensia (dcsExternal)
  └─ Condition ÚNICA multi-branch (7 ramos + else) sobre
     @event{MRV_FTP_JW_Wedo_Email_Sensia._mrv.contractBillingEvent.emailMessageId}
       ramo 1: emailMessageId = "56" → Email "Preventivo"
       ramo 2: emailMessageId = "57" → Email "5 a 30"
       … (tabela acima) …
       else                          → Fim (sem envio)
```
- Igual à irmã: a condição testa **campo do próprio payload do evento** → **publicável direto**, sem
  join/EXISTS e sem pré-requisito de perfil. Uma Condition multi-ramo substitui a cadeia de 7 nós.
- Tratar `emailMessageId` ausente/fora da tabela caindo no **else** (hoje sai sem envio).

## O que é IGUAL e o que MUDA vs. a irmã (`instrucao_mapeamento_ftp_jb_wedo_email.md`)
| Aspecto | Cobrança (`MRV_FTP_JB_Wedo_Email`) | **Sensia (esta spec)** |
|---|---|---|
| Padrão | router por `ID_Mensagem_Email` → `emailMessageId` | **igual** |
| Layout do arquivo | 39 colunas `Email_Wedo` | **igual** (mesmo header, mesmos paths XDM) |
| Identidade | `CPF_CNPJ` → `cpfHash` | **igual** |
| Envelope AJO | `dcsExternal` (família Wedo) | **igual** |
| Splits / IDs | **12 splits**, conjuntos de IDs (39–45, 46–50, 51–52, 53, 15+54, 26–27, 28–29, 63…68) | **7 splits**, **1 ID por split (56, 57, 58, 59, 60, 61, 62)** |
| Assunto | dinâmico via AMPscript `@Assunto` (dentro do asset) | **fixo por template** (migração de conteúdo mais simples) |
| Assets | 12 templates MRV/Urba | **7 templates Sensia** (15816–15823, pasta `Renegociação`, marca Sensia) |
| Mapper C# | pendência "bloco JbWedoEmail" | **já implementado** (`WedoEmailSensiaAepMapper.cs`) |
| Status | ativa | ⚠️ **dormente desde dez/2023** |

## Mapeamento dos campos → XDM
Base: de-para `de_para_jornadas/sensiaJbWedoEmail.md` (schema FTP_File_Event v1.7), conferido contra o
mapper C# `WedoEmailSensiaAepMapper.cs` (envelope idêntico). Ordem = header do CSV (39 colunas, `;`).

| # | Campo CSV | Campo AEP (XDM) | FG | 🆕 | Uso no AJO / Obs |
|---|---|---|---|:--:|---|
| 0 | `Origem` | `_mrv.sourceContext.sourceJobName` | FG-I | | mapper C# concatena `Origem\|Sistema` |
| 1 | `Sistema` | `_mrv.sourceContext.sourceJobName` | FG-I | | idem (mesmo leaf) |
| 2 | `Descricao_Residencial` | ⚠️ **SEM DESTINO** (sem campo no schema) | — | | não usado nos assets Sensia |
| 3 | `Codigo_Cliente` | `_mrv.contractBillingEvent.sapClientId` | FG-A | | |
| 4 | `Nome_Completo` | **Profile** `person.name.fullName` (via cpfHash) — **não vai no evento** | Profile | | |
| 5 | `Endereco_Cliente` | ⚠️ **SEM DESTINO** (sem homeAddress no schema) | — | | não usado nos assets Sensia |
| 6 | `Bairro_Cliente` | ⚠️ **SEM DESTINO** | — | | idem |
| 7 | `Cidade_Cliente` | ⚠️ **SEM DESTINO** | — | | idem |
| 8 | `Estado_Cliente` | ⚠️ **SEM DESTINO** | — | | idem |
| 9 | `CEP_Cliente` | ⚠️ **SEM DESTINO** | — | | idem |
| 10 | `Email_Cliente` | `_mrv.identityEvents.email` | Identity | | endereço do canal e-mail |
| 11 | `Nome_Parcela` | `_mrv.contractBillingEvent.installmentName` | FG-A | | |
| 12 | `Identificador_Parcela` | `_mrv.contractBillingEvent.installmentId` | FG-A | | personalização (asset Preventivo) |
| 13 | `Vencimento_Parcela` | `_mrv.contractBillingEvent.dueDate` | FG-A | | String no schema; asset formata `dd/MM/yyyy` |
| 14 | `Original_Parcela` | `_mrv.contractBillingEvent.installmentDetailsBlock` | FG-A | | concatenado no bloco (JSON no mapper C#) |
| 15 | `Reajuste_Parcela` | `_mrv.contractBillingEvent.installmentDetailsBlock` | FG-A | | idem |
| 16 | `Parcela_Reajustada` | `_mrv.contractBillingEvent.installmentDetailsBlock` | FG-A | | idem |
| 17 | `CPF_CNPJ` | `_mrv.identityEvents.cpfHash` | Identity | | identidade primária (namespace `cpf_hash`); a Function gera o hash |
| 18 | `Residencial` | ⚠️ **SEM DESTINO** — proposta 🆕: `_mrv.condominiumEvent.buildingName` (paridade com a irmã Cobrança) | — | 🆕 | **usado na personalização** de 3 e-mails (5 a 30, 91 a 120, 121 a 150) — precisa de destino |
| 19 | `Mora_Parcela` | `_mrv.contractBillingEvent.installmentDetailsBlock` | FG-A | | concatenado no bloco |
| 20 | `Multa_Parcela` | `_mrv.contractBillingEvent.installmentDetailsBlock` | FG-A | | idem |
| 21 | `Valor_Total` | `_mrv.contractBillingEvent.installmentDetailsBlock` | FG-A | | idem |
| 22 | `Desconto_Parcela` | `_mrv.contractBillingEvent.installmentDetailsBlock` | FG-A | | idem |
| 23 | `Divida_Parcela` | `_mrv.contractBillingEvent.installmentDetailsBlock` | FG-A | | idem |
| 24 | `Original_Contrato` | `_mrv.contractBillingEvent.contractDebtBlock` | FG-A | | concatenado no bloco |
| 25 | `Reajuste_Contrato` | `_mrv.contractBillingEvent.contractDebtBlock` | FG-A | | idem |
| 26 | `Valor_Reajustado_Contrato` | `_mrv.contractBillingEvent.contractDebtBlock` | FG-A | | idem |
| 27 | `Mora_Contrato` | `_mrv.contractBillingEvent.contractDebtBlock` | FG-A | | idem |
| 28 | `Multa_Contrato` | `_mrv.contractBillingEvent.contractDebtBlock` | FG-A | | idem |
| 29 | `Multa_Mora_Contrato` | `_mrv.contractBillingEvent.contractDebtBlock` | FG-A | | idem |
| 30 | `Desconto_Contrato` | `_mrv.contractBillingEvent.contractDebtBlock` | FG-A | | idem |
| 31 | `Divida_Atualizada_Contrato` | `_mrv.contractBillingEvent.contractDebtBlock` | FG-A | | idem |
| 32 | `VI_Atualizado` | `_mrv.contractBillingEvent.openAmountWithAdjustment` | FG-A | | provável typo Vl→Vi no header |
| 33 | `ID_Mensagem_Email` | `_mrv.contractBillingEvent.emailMessageId` | FG-A | | **discriminador do router** (56–62) |
| 34 | `Prev_Assinat_Banco` | ⚠️ **SEM DESTINO** (Fase 2 não construída) | — | | |
| 35 | `Previsao_Chaves` | ⚠️ **SEM DESTINO** (Fase 2 não construída) | — | | |
| 36 | `Nome_Cliente` | **Profile** `person.name.firstName` / `person.name.fullName` (via cpfHash) — **não vai no evento** | Profile | | AMPscript `%%Nome_Cliente%%` de todos os assets → personalização de **perfil** no AJO |
| 37 | `Contrato` | `_mrv.contractBillingEvent.contractId` | FG-A | | referência de contrato |
| 38 | `Safra_Parcela` | `_mrv.contractBillingEvent.vintage` | FG-A | | |

> A DE não tem coluna de telefone — o mapper C# popula apenas `cpfHash` + `email` em `identityEvents`
> (a identidade composta `phoneEmail` degrada para só e-mail, conforme regra do mapping JSON).

## Fórmulas prontas para o AJO
Sempre com o nome **completo** do evento — nunca abreviar:

| Uso | Fórmula |
|---|---|
| Condition do router (ramo ID 56; repetir p/ 57–62) | `@event{MRV_FTP_JW_Wedo_Email_Sensia._mrv.contractBillingEvent.emailMessageId} = "56"` |
| E-mail do destinatário (canal e-mail) | `@event{MRV_FTP_JW_Wedo_Email_Sensia._mrv.identityEvents.email}` |
| Identificador da parcela (asset Preventivo) | `@event{MRV_FTP_JW_Wedo_Email_Sensia._mrv.contractBillingEvent.installmentId}` |
| Vencimento da parcela (asset Preventivo) | `@event{MRV_FTP_JW_Wedo_Email_Sensia._mrv.contractBillingEvent.dueDate}` — no SFMC era `Format(…,"dd/MM/yyyy")`; formatar no template AJO ou já entregar formatado na ingestão |
| Bloco de detalhes da parcela (se o conteúdo migrado usar) | `@event{MRV_FTP_JW_Wedo_Email_Sensia._mrv.contractBillingEvent.installmentDetailsBlock}` |
| Bloco de dívida do contrato (se o conteúdo migrado usar) | `@event{MRV_FTP_JW_Wedo_Email_Sensia._mrv.contractBillingEvent.contractDebtBlock}` |
| Residencial (3 assets) | `@event{MRV_FTP_JW_Wedo_Email_Sensia._mrv.condominiumEvent.buildingName}` 🆕 *(após criar/confirmar o leaf — hoje SEM DESTINO)* |
| Nome do cliente nos e-mails | `profile.person.name.firstName` — resolvido no **Profile** via cpfHash; **não** usar `@event{}` para nome |

- ⚠️ Lembrete de **concat**: sempre que texto fixo for montado junto com variável, use `concat(...)` —
  ex.: `concat("Olá, ", profile.person.name.firstName)` ou, para campos de evento,
  `concat("Parcela ", @event{MRV_FTP_JW_Wedo_Email_Sensia._mrv.contractBillingEvent.installmentId})`.
  Nunca justapor texto + variável sem `concat(...)`.
- `emailMessageId` chega como **String** no XDM (o CSV traz inteiro) — comparar como string (`"56"`) ou
  normalizar na ingestão; manter consistência nos 7 ramos.

## Gaps / pendências
- ⚠️ **Decisão migrar × descontinuar (Q1 da ficha)**: 0 execuções em 2026, última run 18/12/2023, DE com
  3 registros e retenção off — confirmar com o dono (Leandro Pimentel) **antes** de investir na migração.
  Se abandono confirmado, candidata a descontinuação (Wave 0.2.4).
- ⚠️ **`Residencial` SEM DESTINO no schema** — é variável de personalização de 3 dos 7 e-mails. Criar leaf 🆕
  (proposta: `_mrv.condominiumEvent.buildingName`, paridade com a irmã) e refletir no mapper C#
  `WedoEmailSensiaAepMapper.cs` (hoje não mapeia o campo) + de-para.
- ⚠️ **Produtor/ingestão da família Wedo**: eventos Wedo no AJO são `dcsExternal` (streaming) — confirmar o
  fluxo produtor→AEP no cutover (mesma pendência registrada na spec da irmã SMS `dcs_cobranca_wedo_sms`).
- Os blocos `installmentDetailsBlock`/`contractDebtBlock` são montados pelo mapper C# como **JSON serializado**
  — os assets Sensia AS-IS **não** usam esses campos (só Nome_Cliente/Identificador/Vencimento/Residencial);
  se o conteúdo migrado precisar dos valores da parcela/contrato, definir formato de apresentação (JSON cru
  não é exibível em e-mail).
- Contrato com a Wedo: confirmar que a Sensia usa **somente** os IDs 56–62 (IDs novos = ramo novo no router).
- A ficha registra como desenho-alvo alternativo **Rota B (GCP) / entrada Read Audience**; esta spec segue o
  mold evento-Wedo vigente (`MRV_FTP_JW_Wedo_Email_Sensia`).

### Checklist
- [ ] Confirmar status de uso da jornada (migrar × descontinuar) — bloqueia todo o resto.
- [ ] Criar leaf 🆕 para `Residencial` (proposta `_mrv.condominiumEvent.buildingName`), atualizar schema + mapper C# + de-para.
- [ ] Migrar os **7 assets** de e-mail (15816–15823) — assuntos fixos; converter AMPscript
      (`%%Nome_Cliente%%` → perfil; `%%Identificador_Parcela%%`/`%%Vencimento_Parcela%%`/`%%Residencial%%` → `@event{}`).
- [ ] Montar a Condition multi-ramo (7 ramos + else) sobre `emailMessageId` e validar comparação String.
- [ ] Confirmar o evento `MRV_FTP_JW_Wedo_Email_Sensia` publicado no AJO com a condição de qualificação
      (`sourceEventType = sensiaJbWedoEmail`).
- [ ] Validar paridade pós-cutover: registros do arquivo × eventos AEP + spot-check do ID→template.

## Complexidade
🟡 **Média** — router 7-vias por `emailMessageId` que no AJO colapsa numa única Condition multi-ramo direto
no payload do evento (sem SQL, sem perfil), mas exige migrar 7 assets e criar destino para `Residencial`;
o maior risco não é técnico: a jornada está **dormente desde dez/2023** e pode nem entrar no escopo.
