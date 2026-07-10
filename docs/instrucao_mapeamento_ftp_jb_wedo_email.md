# Instrução de mapeamento — "JB_Wedo_Email" · AJO **evento FTP** (router de 12 templates)

> Jornada FTP **complexa** (37 atividades), mas de padrão único: um **ROUTER**. A Wedo pré-calcula qual
> mensagem cada contato recebe (`ID_Mensagem_Email`) e a jornada é um switch/case de 12 saídas → 12
> variantes de template de e-mail. **Boa notícia:** ao contrário das jornadas "PF - *" (Read Audience),
> aqui os splits testam **campos do próprio registro de entrada** — no AJO viram condições diretas sobre
> o **payload do evento** (`@event{}`), sem join/EXISTS e sem pré-requisito de perfil.

## Identificação
| | |
|---|---|
| Jornada SFMC | **JB_Wedo_Email** (`f1e95a84-c1a3-494d-8f04-e87fa717fafd`, BU `mrv-cobranca-portal`) |
| Entrada SFMC | `AutomationAudience` → automation **`Cobranca - E-mail -Wedoo`** (file-triggered) → DE **`E-mail_Wedo`** (`AutomationAud-38466b80…`) |
| `sourceEventType` | `cobrancaJbWedoEmail` · `eventType = cobranca.ftpFileImport` |
| Evento AJO | **`MRV_FTP_JB_Wedo_Email`** (existe — renomeado de `MRV_FTP_Cob_Wedo_Email` no mapa, jul/2026) |
| Blob prefix (ingestão C#) | `cobranca/jb_ftp_wpp_cobranca`? → **não**: e-mail Wedo = ver bloco JbWedoEmail no processor (pendência conhecida) |
| Identidade | `CPF_CNPJ` → `cpfHash` (PK) |
| Canal | **só e-mail** (`mobileNumber: null` nos defaults) — endereço `Email_Cliente` |
| Jornada irmã | `Cobranca - Wedo - SMS` (`99cff43c`, 1 SMS + 1 wait — router análogo do canal SMS, spec à parte se entrar no escopo) |

## Fluxo SFMC = cadeia de 12 decision splits (switch por `ID_Mensagem_Email`)
Cada split: `CPF_CNPJ`/`Contrato`/`ID_Mensagem_Email` iguais ao registro de entrada (self-join, sempre
verdadeiro) **E** `ID_Mensagem_Email IN {conjunto}` → envia o template e finaliza (Wait 1min/1d → Fim);
senão cai no próximo split da cadeia. Quem não casa nenhum ID sai sem envio (Wait final).

### Tabela do router (ordem exata da cadeia, extraída do raw)
| # | Split SFMC | IDs (`ID_Mensagem_Email`) | Template (EMAILV2) | emailId |
|---|---|---|---|---|
| 1 | `V2-1` | **39–45** | MRV - Com Logo - Com chaves | 5188 |
| 2 | `V2-2` | **46–50** | MRV - Sem Logo - Sem chaves | 5200 |
| 3 | `V2-3` | **51, 52** | MRV - Sem Logo - Sem chaves - Sem assinatura | 5205 |
| 4 | `V2-4` | **53** | MRV - Notificação - Sem chaves - sem assinatura | 5208 |
| 5 | `V2-5` | **15, 54** | MRV - Com Logo - Preventivo | 5212 |
| 6 | `V2-6` | **26, 27** | Urba - com Logo - v2 | 46151 |
| 7 | `V2-7` | **28, 29** | Urba - com Logo - Extra jud. | 5210 |
| 8 | `V2-9` | **64, 65** | mrv_contratos | 62201 |
| 9 | `V2-8` | **63** | mrv_63_contraros | 62396 |
| 10 | `V2-10` | **66** | mrv_66_comm chaves | 67579 |
| 11 | `V2-11` | **67** | mrv_67_com chaves | 67581 |
| 12 | `V2-12` | **68** | mrv_68_com chaves | 67583 |

Todos os 12 e-mails têm **assunto dinâmico** `%%=v(@Assunto)=%%` (variável AMPscript definida dentro do
asset — a coluna `Assunto` **não** existe na DE; o assunto é derivado do `ID_Mensagem_Email` dentro do
HTML/AMPscript. ⚠️ conferir os assets ao migrar o conteúdo).

## Fluxo AJO equivalente
```
Evento MRV_FTP_JB_Wedo_Email
  └─ Condition ÚNICA multi-branch (12 ramos + else) sobre
     @event{MRV_FTP_JB_Wedo_Email._mrv.contractBillingEvent.emailMessageId}
       ramo 1: emailMessageId IN [39..45]  → Email "Com Logo - Com chaves"
       ramo 2: IN [46..50]                → Email "Sem Logo - Sem chaves"
       … (tabela acima) …
       else                               → Fim (sem envio)
```
- No AJO **não precisa** de 12 nós encadeados: uma Condition suporta múltiplos ramos — reduz a cadeia a 1 nó.
- A condição é sobre o **evento** (o campo chega no payload) → **publicável direto**, sem materializar nada no perfil. `defaultValue` não é necessário em condição, mas trate `emailMessageId` ausente caindo no else.
- Waits de 1min/1d pós-e-mail eram só de retenção antes do Fim — dispensáveis no AJO (ou manter por paridade).

## Mapeamento de campos (CSV → XDM — 39 campos, já no de-para/C#)
Campos-chave do router e identidade:
| Coluna CSV | XDM | Uso |
|---|---|---|
| `CPF_CNPJ` | `_mrv.identityEvents.cpfHash` | identidade (PK) |
| `Email_Cliente` | `_mrv.identityEvents.email` | endereço do canal Email |
| `ID_Mensagem_Email` | `_mrv.contractBillingEvent.emailMessageId` | **discriminador do router** |
| `Contrato` | `_mrv.contractBillingEvent.contractId` | referência de contrato |
| `Nome_Completo` | `person.name.fullName` | personalização |

Conteúdo do e-mail (blocos concatenados — pendência conhecida do processor C#, "bloco JbWedoEmail"):
- `Nome_Parcela / Identificador_Parcela / Vencimento_Parcela / Original|Reajuste|Reajustada|Mora|Multa|Valor_Total|Desconto|Divida_Parcela` → **`_mrv.contractBillingEvent.installmentDetailsBlock`** (bloco de detalhes da parcela).
- `Original|Reajuste|Valor_Reajustado|Mora|Multa|Multa_Mora|Desconto|Divida_Atualizada_Contrato` → **`_mrv.contractBillingEvent.contractDebtBlock`** (bloco de dívida do contrato).
- `Endereco|Bairro|Cidade|Estado|CEP_Cliente` → `_mrv.customerAddress.*` (🆕 grupo novo).
- `Residencial` → `_mrv.condominiumEvent.buildingName` · `Descricao_Residencial` → `_mrv.propertyContext.residentialDescription` (🆕) · `Origem/Sistema` → `_mrv.sourceContext.sourceJobName`.

> Os templates AJO devem referenciar os **blocos prontos** (`installmentDetailsBlock` / `contractDebtBlock`)
> via `@event{}` — a concatenação/formatação acontece na ingestão C#, não no template.

## Pendências
- [ ] **Ingestão C#**: implementar a montagem dos blocos `installmentDetailsBlock`/`contractDebtBlock` (pendência já registrada — "bloco JbWedoEmail").
- [ ] Migrar o conteúdo dos **12 assets** de e-mail e extrair a lógica AMPscript do `@Assunto` (assunto por ID) — no AJO, assunto por ramo (12 mensagens) ou campo calculado na ingestão.
- [ ] Confirmar se a lista de IDs é estável (contrato com a Wedo) — IDs novos = ramo novo.
- [ ] Definir comportamento do **else** (ID fora da tabela): hoje sai sem envio — manter e monitorar volume.
- [ ] Avaliar migrar junto a irmã `Cobranca - Wedo - SMS` (`99cff43c`, evento `MRV_FTP_Cobranca_Wedo`) — mesmo padrão, canal SMS.
