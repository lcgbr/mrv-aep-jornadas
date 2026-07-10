# Instrução de mapeamento — Boas vindas - Nova Jornada Sensia_FTP · evento **MRV_FTP_BV_Nov_Jor_Sensia** (FTP)

> A **régua de boas-vindas da Sensia** — a maior jornada da BU e a **única confirmadamente ATIVA em 2026**
> (última execução 26/05/2026). Régua de onboarding de ~D+67 com **22 envios de e-mail (13 assets distintos)
> + 1 WhatsApp** (`mia_sensia_prd`), **9 decision splits** e **28 waits**. O roteamento depende de 4 campos do
> registro (`Empreendimento`, `Tipo_Contrato`, `Personalização`, `Inicio Obra`) — **2 deles ainda SEM DESTINO
> no schema AEP** (⚠️ ver Gaps).

## Identificação
| | |
|---|---|
| Jornada (SFMC) | **Boas vindas - Nova Jornada Sensia_FTP** |
| journeyId | `6ac46582-2144-4cdf-a53b-82a077d773e9` (BU `sensia`) · Published · v39 · MultipleEntries |
| Tipo de entrada | `AutomationAudience` → automation **`AU_BoasVindasSensia`** (file drop `import\nova_boas_vindas_sensia\`, padrão `BoasVindasSensia`) → import **Overwrite** na DE → Journey Entry |
| Data Extension | `boas_vindas_FTP_Sensia` (13 colunas; `AutomationAud-5977ca1e-bcdd-ed81-ddb0-e02a9ef1527e`) — **grão de CONTRATO** (PK composta CPF + ID_Contrato_Sap + Empreendimento) |
| `sourceEventType` | `sensiaBoasVindasNovaSensiaFtp` |
| Evento AJO alvo | **`MRV_FTP_BV_Nov_Jor_Sensia`** (`eventType = dcsExternal` no AJO — ver Envelope) |
| Canal / assets | **22 e-mails (13 assets)** + **1 WhatsApp** template `mia_sensia_prd` (bot **MariaRosa**, corpo estático + botão URL) |
| Identidade | `CPF` → `cpfHash` (namespace `cpf_hash`; a Function gera o hash) · Subscriber Key SFMC = CPF |
| Mapper C# | `BoasVindasSensiaAepMapper.cs` (mold FTP 5-arquivos, já criado) |
| Jornada IRMÃ (não confundir) | `Boas vindas - Nova Jornada Sensia_FTP_QAS` (automation `AU_QAS_Boas_Vindas_SENSIA`, pasta `import\nova_boasvindas_sensia_qas\`) — ambiente QAS, **fora do escopo** desta spec |

## Envelope do evento
| Campo | Valor |
|---|---|
| Evento AJO (`ajo_event_map.json`) | `MRV_FTP_BV_Nov_Jor_Sensia` · **`eventType = dcsExternal`** (evento externo via streaming — atenção: **não** é o valor do campo XDM) |
| `eventType` (campo XDM do payload) | `sensia.ftpFileImport` (conforme mold C# e dumps `requests_jornadas`) |
| `_mrv.sourceContext.sourceEventType` | `sensiaBoasVindasNovaSensiaFtp` |
| `_mrv.sourceContext.sourceSystem` | `FTPFileImport` (fixo) |
| `_mrv.ftpFileImport.sourceFileName` | nome do arquivo recebido (ex.: `6-19-2026-boas_vindas_FTP_Sensia.csv`) |

## Fluxo AS-IS (SFMC) resumido
```
Entrada (batch da DE boas_vindas_FTP_Sensia)
└─ SPLIT V2-1 "Empreendimento contains 'Sensia'"          ← GATE de elegibilidade
   ├─ [Sensia]
   │   EMAIL 69477 "Bem-vindo(a) à Sensia Incorporadora." → wait 5min
   │   → REST-1 WhatsApp mia_sensia_prd (bot MariaRosa)   → wait 3d
   │   → EMAIL 66995 "Olá, eu sou a MIA!"                 → wait 3d
   │   → EMAIL 23698 "Seu Contrato Digital na Plataforma Sensia" → wait 5d
   │   → SPLIT V2-6 Tipo_Contrato ∈ {Flex, Flex Corrigido}?
   │       ├─ sim → EMAIL 63210 "Entenda os principais pontos" → wait 5d
   │       └─ else → wait 1d
   │   → SPLIT V2-4 Personalização?
   │       ├─ "Sim" → SPLIT V2-2 Tipo_Contrato contains "Associativo"?
   │       │            ├─ sim  → EMAIL 17013 (personalização Associativo) → wait 5d → EMAIL 66996 "O seu Sensia, do seu jeito."
   │       │            └─ else → EMAIL 19005 (personalização Flex)        → wait 5d → EMAIL 66996 "O seu Sensia, do seu jeito."
   │       ├─ "Não" → wait 1min
   │       └─ else  → wait 1d
   │   → wait 5d → EMAIL 69478 "Já acessou nossa Plataforma?"
   │   → SPLIT V2-3 Tipo_Contrato (5 vias):
   │       ├─ "Flex Corrigido"  → EMAIL 59224 (correção parcelas) → wait 5d  → EMAIL 61523 (antecipar)
   │       ├─ ~"Associativo"    → EMAIL 59224 (correção parcelas) → wait 5d  → EMAIL 61523 (antecipar)
   │       ├─ ~"Bancário"       → EMAIL 59224 (correção parcelas) → wait 10d → EMAIL 61523 (antecipar)
   │       ├─ "Flex"            → wait 1d → (vai direto ao check de obra V2-10)
   │       └─ else              → wait 3min
   │   → SPLITs V2-7/8/9/10 "Inicio Obra = 'Sim'?" (1 check por ramo de contrato)
   │       ├─ sim  → EMAIL 63695 "Seu Sensia - Obras iniciadas" → wait 1d → EMAIL 69480 "Jornada financeira"
   │       └─ else → wait 1d → EMAIL 69480 "Jornada financeira"
   │   (+ EMAIL 69481 "Juros de Obra" no ramo de contrato correspondente)
   └─ [Restante] → wait 3min → Fim (sem envio)
```
- 60 atividades no total: **22 EMAILV2 · 1 REST (WhatsApp) · 9 MULTICRITERIADECISION · 28 WAIT**.
- Waits em timezone `E. South America Standard Time`, de 1 min a 10 dias (régua total ≈ 67 dias).
- Re-entry: `MultipleEntries` — coerente com o grão de contrato da DE (1 CPF pode ter N contratos).

### Assets de e-mail (13 distintos, 22 envios)
| emailId | Asset | Assunto | Envios |
|---|---|---|---|
| 69477 | Email Sensia Boas Vindas - Nova Jornada - v4 | Bem-vindo(a) à Sensia Incorporadora. | 1 |
| 66995 | mia_whatsapp_sensia | Olá, eu sou a MIA! | 1 |
| 23698 | Contrato de Compra e Venda | Seu Contrato Digital na Plataforma Sensia | 1 |
| 63210 | peça_0_contrato_flex | Seu contrato Sensia - Entenda os principais pontos | 1 |
| 17013 | Email Sensia Personalizacao Associativo | Está chegando a hora de escolher todos os detalhes do seu Sensia. | 1 |
| 19005 | Email Sensia Personalizacao FB_Flex_v2 | Está chegando a hora de escolher todos os detalhes do seu Sensia. | 1 |
| 66996 | sensia_mdc1 | O seu Sensia, do seu jeito. | 2 |
| 69478 | Peça Reforço V2 | Já acessou nossa Plataforma? | 1 |
| 59224 | Correção de parcelas -v2 | Entenda melhor sobre as correções das suas parcelas | 3 |
| 61523 | mrv_antecipacao_v2 | Parcelas Sensia: veja como antecipar | 3 |
| 69481 | Peça Juros da Obra - v2 | Hoje nossa conversa é sobre Juros de Obra | 1 |
| 63695 | Experiencia do Cliente - Inicio Obras | Seu Sensia - Obras iniciadas | 4 |
| 69480 | Jornada financeira_V2 | Seu contrato Sensia - Jornada financeira | 2 |

### WhatsApp (REST-1)
Template **`mia_sensia_prd`** (Meta, APPROVED, pt_BR, MARKETING): header + corpo **estáticos** (apresentação
da MIA + link `cliente.meusensia.com.br`) e 1 botão URL fixo ("Assista ao vídeo" → `mrv.vc/boas_vindas_Sensia`).
`templateText/templateMedia/templateButton = []` — **a única variável do payload é o `userNumber`** (Celular).
No AJO vira **Custom Action** (Orquestrador) com o payload padrão de mensagem ativa.

## Mapeamento dos campos → XDM
Base: de-para `de_para_jornadas/sensiaBoasVindasNovaSensiaFtp.md` (schema FTP_File_Event v1.7), conferido
contra o mapper C# `BoasVindasSensiaAepMapper.cs` (envelope idêntico). Ordem = header do CSV (13 colunas, `;`).

| # | Campo CSV | Campo AEP (XDM) | FG | 🆕 | Uso no AJO / Obs |
|---|---|---|---|:--:|---|
| 0 | `nome_cliente` | **Profile** `person.name.firstName` / `person.name.fullName` (via cpfHash) — **não vai no evento** | Profile | | AMPscript `@nome_cliente`/`@nome` dos e-mails → personalização de **perfil** no AJO |
| 1 | `CPF` | `_mrv.identityEvents.cpfHash` | Identity | | Identidade primária (namespace `cpf_hash`); a Function gera o hash |
| 2 | `Email` | `_mrv.identityEvents.email` | Identity | | endereço do canal e-mail |
| 3 | `Celular` | `_mrv.identityEvents.phone` | Identity | | **`userNumber`** do WhatsApp (regra global: telefone → `phone`) |
| 4 | `Tipo` | `_mrv.ftpFileImport.recordType` | FG-I | | D9: opaca (ex.: "Ganha"/"Pré-Ganho") |
| 5 | `Ganho_Pre_Ganho` | ⚠️ **SEM DESTINO** (human-gated, não formalizado) | — | | não referenciado no canvas — provável resíduo (Q5 da ficha) |
| 6 | `Liberacao_SAP` | `_mrv.constructionStart.sapReleased` | FG-G | | ingerido, mas não usado no roteamento |
| 7 | `Locale` | `_mrv.ftpFileImport.locale` | FG-I | | pt-BR |
| 8 | `Tipo_Contrato` | ⚠️ **SEM DESTINO** — proposta: `_mrv.contractBillingEvent.contractType` | FG-A | 🆕 | **discriminador de 3 splits** (V2-2/-3/-6); valores: "Flex", "Flex Corrigido", ~"Associativo", ~"Bancário" — leaf novo a criar/confirmar |
| 9 | `ID_Contrato_Sap` | `_mrv.contractBillingEvent.contractId` | FG-A | | chave do contrato (grão da DE) |
| 10 | `Empreendimento` | ⚠️ **SEM DESTINO** — candidatos: `_mrv.serviceCase.nomeEmpreendimento` ou `_mrv.earlyInspectionDetails.property` | — | 🆕 | **gate de entrada** (`contains "Sensia"`) — definir destino e refletir no mapper C# |
| 11 | `Personalização` | `_mrv.constructionStart.customizationAvailable` | FG-G | | split V2-4 ("Sim"/"Não") |
| 12 | `Inicio Obra` | `_mrv.constructionStart.constructionStartDate` | FG-G | | splits V2-7/8/9/10 — ⚠️ o leaf tem nome de **data**, mas o valor real é **"Sim"/"Não"** (String) |

## Fórmulas prontas para o AJO
Sempre com o nome **completo** do evento — nunca abreviar:

| Uso | Fórmula |
|---|---|
| `userNumber` (WhatsApp Custom Action) | `@event{MRV_FTP_BV_Nov_Jor_Sensia._mrv.identityEvents.phone}` |
| E-mail do destinatário (se necessário no canal) | `@event{MRV_FTP_BV_Nov_Jor_Sensia._mrv.identityEvents.email}` |
| Condition "Personalização = Sim" (split V2-4) | `@event{MRV_FTP_BV_Nov_Jor_Sensia._mrv.constructionStart.customizationAvailable} = "Sim"` |
| Condition "Início Obra = Sim" (splits V2-7/8/9/10) | `@event{MRV_FTP_BV_Nov_Jor_Sensia._mrv.constructionStart.constructionStartDate} = "Sim"` |
| Condition Tipo de Contrato (splits V2-2/-3/-6) | `@event{MRV_FTP_BV_Nov_Jor_Sensia._mrv.contractBillingEvent.contractType}` 🆕 *(após criar o leaf)* |
| Gate "Empreendimento contém Sensia" (split V2-1) | `contains(@event{MRV_FTP_BV_Nov_Jor_Sensia._mrv.serviceCase.nomeEmpreendimento}, "Sensia")` 🆕 *(path a confirmar)* |
| Nome do cliente nos e-mails | `profile.person.name.firstName` — resolvido no **Profile** via cpfHash; **não** usar `@event{}` para nome |

- ⚠️ Lembrete de **concat**: sempre que um texto fixo for montado junto com variável (ex.: saudação de e-mail),
  use `concat("Olá, ", profile.person.name.firstName)` — e, para campos de evento,
  `concat("texto ", @event{MRV_FTP_BV_Nov_Jor_Sensia._mrv.contractBillingEvent.contractId})`. Nunca justapor
  texto + variável sem `concat(...)`.
- No SFMC os splits de `Tipo_Contrato` comparam com variações de caixa/espaço (`"Flex "`, "Bancário"/"Bancario") —
  no AJO normalizar (comparação case-insensitive/trim ou saneamento na ingestão).
- O corpo do WhatsApp é estático: além do `userNumber`, **nenhuma** variável de template.

## Gaps / pendências
- ⚠️ **`Tipo_Contrato` SEM DESTINO no schema** — é o discriminador de 3 splits; sem ele a árvore não roteia.
  Criar leaf 🆕 (proposta: `_mrv.contractBillingEvent.contractType`), atualizar schema + mapper C# + de-para.
- ⚠️ **`Empreendimento` SEM DESTINO no schema** — é o gate de elegibilidade (`contains "Sensia"`). Definir leaf
  (reusar `serviceCase.nomeEmpreendimento` ou `earlyInspectionDetails.property`) e refletir no mapper C#.
- ⚠️ **Grão de contrato** (PK CPF+ID_Contrato_Sap+Empreendimento): 1 CPF pode ter N linhas → N eventos. Configurar
  re-entrada da jornada AJO para permitir múltiplas entradas por perfil (1 régua por contrato), senão cliente com
  2 unidades recebe 1 só série.
- ⚠️ **`Inicio Obra`** carrega "Sim"/"Não" num leaf chamado `constructionStartDate` — funciona, mas documentar a
  semântica (não é data) ou renomear no futuro.
- ⚠️ Saúde operacional: **17% de erro** no automation SFMC (51 falhas / 247 execuções) — investigar causa antes do cutover.
- `Ganho_Pre_Ganho` e `Liberacao_SAP` não aparecem no canvas — confirmar com o dono (Q5 da ficha) se são resíduo.
- A ficha de assessment recomenda como desenho-alvo **eliminar o hop FTP** (Rota B/GCP, entrada Read Audience). Esta
  spec segue o mold FTP-evento vigente (`MRV_FTP_BV_Nov_Jor_Sensia`); a decisão de arquitetura fica registrada como alternativa.

### Checklist
- [ ] Criar leaf 🆕 para `Tipo_Contrato` (proposta `_mrv.contractBillingEvent.contractType`) e republicar schema.
- [ ] Definir destino de `Empreendimento` (🆕 ou reuso) e atualizar mapper C# `BoasVindasSensiaAepMapper.cs` + de-para.
- [ ] Confirmar valores reais de `Tipo_Contrato` no arquivo (Flex / Flex Corrigido / Associativo / Bancário) e normalização.
- [ ] Migrar os **13 assets de e-mail** (converter AMPscript `@nome_cliente`/`@nome`/`@viewport` → personalização de Profile).
- [ ] Recriar o WhatsApp `mia_sensia_prd` como **Custom Action** (bot MariaRosa; template aprovado no Meta).
- [ ] Reconstruir a árvore no AJO: gate + 8 splits internos + 28 waits (avaliar simplificar os 4 checks duplicados de Início Obra).
- [ ] Configurar política de re-entrada (múltiplas entradas por perfil — grão de contrato).
- [ ] Validar paridade (Wave 4.1.2): população da DE × eventos AEP + spot-check dos 4 campos de decisão.

## Complexidade
🔴 **Alta** — maior régua da BU Sensia (22 e-mails em 13 assets + WhatsApp, 9 splits, 28 waits, ~D+67) cujo
roteamento depende de 2 campos ainda **sem destino no schema** (`Tipo_Contrato` e `Empreendimento`), exigindo
leaves novos + mudança no mapper C# antes de a árvore ser publicável no AJO.
