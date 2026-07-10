# Instrução de mapeamento — "PF - Visualizou propostas - EJ" · AJO **Read Audience** (batch, NÃO-FTP/NÃO-API)

> Jornada **irmã estrutural** de "PF - Entrou no portal - EJ" e "PF - Proposta sem confirmacao - EJ"
> (21 atividades: 4 decision splits + 6 e-mails + 1 SMS + 1 split de engajamento). A análise de causa
> raiz e os pré-requisitos da spec `instrucao_mapeamento_readaudience_entrou_portal.md` **valem
> integralmente** — aqui ficam os dados específicos desta jornada.

## Identificação
| | |
|---|---|
| Jornada SFMC | **PF - Visualizou propostas - EJ** (`46eb0e78-d17d-40af-b8e0-5f81c9be2a5a`, BU `mrv-cobranca-portal`) |
| Entrada SFMC | `EmailAudience` → DEAudience `0cd54165-959b-9c2f-4eaf-e5eaeec15c8c` |
| DE de entrada | **`Portal_SAP_Visualizou_propostas_PRD_EJ`** (id `b84a0e6b-d6dc-ea11-a2f0-48df370ed97d`) |
| Recorrência SFMC | **Hourly, interval 1**, high-watermark (só novos), TZ E. South America (agendada 2022→2072) |
| DE de join (re-check) | `Portal_SAP_Integracao_PRD` por **DocumentoCliente + ContratoSAP** (relationship `569de74a…`) |
| Literal de Status | **`VISUALIZOU_PROPOSTAS`** *(cliente viu as propostas mas não escolheu)* |
| Identidade AJO | `cpf_hash` (Read audience) |
| Campos | `EmailCliente`, `CelularCliente`, `ContratoSAP`, `DocumentoCliente`, `Status`, `Semaforo` |

## Segmento de entrada (Read audience)
> `Status = "VISUALIZOU_PROPOSTAS"` **E** `Semaforo = "NOVO"`, resolvido por `cpf_hash`.

Cadência: reproduzir a recorrência **horária com high-watermark** do SFMC (não batch único ASAP).

## Os 4 decision splits (ordem de fluxo, chaves SFMC exatas)
| # | Chave SFMC | Path1 (critério decodificado do raw) | Path1 → | Restante → |
|---|---|---|---|---|
| 1 | `MULTICRITERIADECISIONV2-6` | **EXISTE** registro em `Portal_SAP_Integracao_PRD` (mesmo Doc+Contrato) com `Status = "VISUALIZOU_PROPOSTAS"` | split #2 | Wait 1d → Fim |
| 2 | `MULTICRITERIADECISIONV2-1` | `Event.Status = "VISUALIZOU_PROPOSTAS"` AND `Event.Semaforo = "NOVO"` (atributos efêmeros) | **Email 1** (`EMAILV2-1`) | Wait 1min → Fim |
| 3 | `MULTICRITERIADECISIONV2-4` | **EXISTE** registro (mesmo Doc+Contrato) com `Status ≠ "VISUALIZOU_PROPOSTAS"` (converteu após Email 1) | Semáforo saída (`EMAILV2-13`) → Fim | **Email 2** (`EMAILV2-3`) |
| 4 | `MULTICRITERIADECISIONV2-7` | idem #3 (converteu após Email 2) | Semáforo saída (`EMAILV2-14`) → Fim | **Split de engajamento** |

Regras de tradução (detalhadas na spec da irmã):
- #1/#3/#4 = **join DE→DE, semântica EXISTS** → exigem materializar `Portal_SAP_Integracao_PRD` no perfil (relationship XDM ou computed attribute). AND plano escalar **não** reproduz o EXISTS (múltiplos contratos por perfil).
- #3/#4 (`NotEqual`): caso **"sem registro" → Restante** (Email 2), nunca Path1 — senão inverte o SFMC.
- #2: atributo efêmero → atributo de perfil/audiência; **redundante** com o segmento de entrada.

## 5º nó — engajamento (Reaction, não Optimize)
`ENGAGEMENTSPLITV2-1` = "**Open Visualizou propostas - Email 1 - EJ**" (`statsTypeId=2` Open, ref `EMAILV2-1`,
triggeredSendId `dd6364e7-8c9e-ed11…`):
- **Abriu Email 1** → `EMAILV2-5` (semáforo que **suprime o SMS**) → Wait 5d → `EMAILV2-7` (semáforo saída) → Wait 1d → Fim.
- **Não abriu** → **SMS 1** (`SMSSYNC-2`, short code `29520`) → Wait 1d → Fim.

No AJO: **condição de Reação** sobre a abertura do Email 1 desta jornada + janela de espera.

## Mensagens
| Chave | Nome | Papel | emailId | Assunto |
|---|---|---|---|---|
| `EMAILV2-1` | Visualizou propostas - Email 1 - EJ | **Conteúdo** | 5787 | "Já escolheu a melhor condição para você?" |
| `EMAILV2-3` | Visualizou propostas - Email 2 - EJ | **Conteúdo** | 5786 | "Já escolheu a melhor condição para você?" |
| `SMSSYNC-2` | Visualizou propostas - SMS 1 - EJ | **Conteúdo** (só p/ quem não abriu Email 1) | — | texto no MobileConnect (assetId 20201, short code 29520) |
| `EMAILV2-13` / `EMAILV2-14` / `EMAILV2-7` | Semáforo saída | **Controle** (write-back) | 5794 | "Saida da jornada" |
| `EMAILV2-5` | Semáforo suprime SMS | **Controle** (write-back) | 5793 | "Saida da jornada" |

Personalização: e-mail → `personalEmail.address` (`EmailCliente`); SMS → `mobilePhone.number` (`CelularCliente`).

## Pendências (mesmas da irmã)
- [ ] Materializar `Portal_SAP_Integracao_PRD` no AEP (relationship/computed) — **bloqueador** dos splits #1/#3/#4.
- [ ] Promover `Status`/`Semaforo` da DE de entrada (ou embutir no segmento).
- [ ] Modelar o 5º nó como Reaction (abertura Email 1).
- [ ] Decidir write-back dos e-mails "Semáforo" (Update Profile/Data action vs descartar documentado).
- [ ] Confirmar escopo por contrato (EXISTS por contrato-em-escopo).
- [ ] Validar em rascunho que as expressões limpam `ERR_MODEL_GEN_5/34` (se a versão AJO desta jornada tiver os mesmos 12 erros da "Entrou no portal").
