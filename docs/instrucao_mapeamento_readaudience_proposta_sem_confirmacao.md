# Instrução de mapeamento — "PF - Proposta sem confirmacao - EJ" · AJO **Read Audience** (batch, NÃO-FTP/NÃO-API)

> Jornada **irmã estrutural** de "PF - Entrou no portal - EJ" (mesmas 21 atividades: 4 decision splits +
> 6 e-mails + 1 SMS + 1 split de engajamento). Toda a análise de causa raiz e os pré-requisitos da spec
> `instrucao_mapeamento_readaudience_entrou_portal.md` **valem integralmente aqui** — esta spec registra
> os dados específicos desta jornada (DE, literal de Status, chaves e ordem dos splits).

## Identificação
| | |
|---|---|
| Jornada SFMC | **PF - Proposta sem confirmacao - EJ** (`80c1b12d-79b9-45f0-a969-f1b5ad82ee40`, BU `mrv-cobranca-portal`) |
| Entrada SFMC | `EmailAudience` → DEAudience `13b30ec7-9946-d06a-b5f5-4f080c83d3e3` |
| DE de entrada | **`Portal_SAP_Proposta_sem_confirmacao_PRD_EJ`** |
| Recorrência SFMC | **Hourly, interval 1** (high-watermark: só registros novos), TZ E. South America |
| DE de join (re-check) | `Portal_SAP_Integracao_PRD` por **DocumentoCliente + ContratoSAP** |
| Literal de Status | **`ESCOLHEU_PROPOSTA`** *(cliente escolheu a proposta mas não confirmou)* |
| Identidade AJO | `cpf_hash` (Read audience) |
| Campos | `EmailCliente`, `CelularCliente`, `ContratoSAP`, `DocumentoCliente`, `Status`, `Semaforo` |

## Segmento de entrada (Read audience)
Audiência no Unified Profile equivalente à DE de entrada:
> `Status = "ESCOLHEU_PROPOSTA"` **E** `Semaforo = "NOVO"`, resolvido por `cpf_hash`.

Alinhar cadência: SFMC roda **recorrente horário** com high-watermark; configurar o Read audience/segmento
com recorrência equivalente (não batch único ASAP).

## Os 4 decision splits (ordem de fluxo, com as chaves SFMC exatas)
| # | Chave SFMC | Path1 (critério decodificado do raw) | Path1 → | Restante → |
|---|---|---|---|---|
| 1 | `MULTICRITERIADECISIONV2-2` | **EXISTE** registro em `Portal_SAP_Integracao_PRD` (mesmo Doc+Contrato) com `Status = "ESCOLHEU_PROPOSTA"` | split #2 | Wait 1d → Fim |
| 2 | `MULTICRITERIADECISIONV2-1` | `Event.Status = "ESCOLHEU_PROPOSTA"` AND `Event.Semaforo = "NOVO"` (atributos efêmeros do evento) | **Email 1** | Wait 1min → Fim |
| 3 | `MULTICRITERIADECISIONV2-7` | **EXISTE** registro (mesmo Doc+Contrato) com `Status ≠ "ESCOLHEU_PROPOSTA"` (converteu após Email 1) | Semáforo saída (`EMAILV2-9`) → Fim | **Email 2** (`EMAILV2-5`) |
| 4 | `MULTICRITERIADECISIONV2-3` | idem #3 (converteu após Email 2) | Semáforo saída (`EMAILV2-3`) → Fim | **Split de engajamento** |

Regras de tradução (idênticas à spec da irmã — ver detalhes lá):
- #1/#3/#4 são **join DE→DE com semântica EXISTS** → só expressáveis após materializar `Portal_SAP_Integracao_PRD` no perfil (relationship XDM ou computed attribute). **AND plano de igualdades escalares não reproduz o EXISTS** (perfil pode ter vários contratos).
- #3/#4 (`NotEqual`): **"sem registro" tem que cair no Restante** (→ Email 2), nunca no Path1 — senão inverte o SFMC.
- #2 usa atributos **efêmeros** (snapshot da entrada); em batch AJO vira atributo de perfil/audiência — e é **redundante** com o filtro do segmento (manter por paridade ou remover, documentando).

## 5º nó — engajamento (Reaction, não Optimize)
`ENGAGEMENTSPLITV2-3` = "**Open Proposta sem confirmação - Email 1 - EJ**" (`statsTypeId=2` Open,
ref `EMAILV2-1`, triggeredSendId `f13cdc3f-8d9e-ed11…`):
- **Abriu Email 1** → `EMAILV2-11` (semáforo que **suprime o SMS**) → Wait 5d → semáforo saída → Fim.
- **Não abriu** → **SMS 1** (`SMSSYNC-3`) → Wait 1d → Fim.

No AJO: **condição de Reação** sobre a abertura do nó de mensagem do Email 1 desta jornada + janela de espera.

## Mensagens
| Chave | Nome | Papel | emailId | Assunto |
|---|---|---|---|---|
| `EMAILV2-1` | Proposta sem confirmação - Email 1 - EJ | **Conteúdo** | 5782 | "Uma ótima proposta te espera!" |
| `EMAILV2-5` | Proposta sem confirmação - Email 2 - EJ | **Conteúdo** | 5785 | "Uma ótima proposta te espera!" |
| `SMSSYNC-3` | Proposta sem confirmação - SMS 1 - EJ | **Conteúdo** (só p/ quem não abriu Email 1) | — | texto no MobileConnect |
| `EMAILV2-3` / `EMAILV2-9` / `EMAILV2-10` | Semáforo saída | **Controle** (write-back) | 5790 | "Saida da jornada" |
| `EMAILV2-11` | Semáforo suprime SMS | **Controle** (write-back) | 5795 | "Saida da jornada" |

Personalização: e-mail → `personalEmail.address` (`EmailCliente`); SMS → `mobilePhone.number` (`CelularCliente`).

## Pendências (mesmas da irmã)
- [ ] Materializar `Portal_SAP_Integracao_PRD` no AEP (relationship/computed) — **bloqueador** dos splits #1/#3/#4.
- [ ] Promover `Status`/`Semaforo` da DE de entrada (ou embutir no segmento).
- [ ] Modelar o 5º nó como Reaction (abertura Email 1).
- [ ] Decidir write-back dos e-mails "Semáforo" (Update Profile/Data action vs descartar documentado).
- [ ] Confirmar escopo por contrato (EXISTS por contrato-em-escopo).
- [ ] Validar em rascunho que as expressões limpam `ERR_MODEL_GEN_5/34`.
