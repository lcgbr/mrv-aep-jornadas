# Instrução de mapeamento — Regua Transacional Armarios OPPORTUNITY · evento **A CRIAR — sem evento (Read Audience)** (batch diário, NÃO-FTP/NÃO-API)

> Régua transacional de móveis planejados (armários) do Marketplace. **Não é FTP** (nenhum CSV entra por
> arquivo): a entrada é `AutomationAudience` — a automation **`AU_RegrasTransacional_ARMARIOS`** roda SQL
> diário sobre as DEs sincronizadas do **Salesforce** (`Opportunity_Salesforce_1` ⋈ `Account_Salesforce_1`),
> grava a DE **`Regua_Transacional_OPPORTUNITY`** e injeta na jornada. No AJO o padrão equivalente é
> **Read Audience** (mesmo padrão das jornadas "PF - * - EJ" de Cobrança Portal), com router por `StageName`.
> ⚠️ Não confundir com as jornadas **irmãs**: "Regua Transacional Armarios **LEAD**" (`0e951b76`, mesma
> automation, DE `Regua_Transacional_LEAD`) e "Regua Transacional **KIT** OPPORTUNITY" (automation
> `AU_RegrasTransacional_KIT`, `580f257a`).

## Identificação
| | |
|---|---|
| Jornada SFMC | **Regua Transacional Armarios OPPORTUNITY** (`079c809a-930f-43e9-8690-a7f0465e6aea`, BU `mrv-marketplace`) — Published v9, `SingleEntryAcrossAllVersions` |
| Entrada SFMC | `AutomationAudience` (eventDefinition `64e7d99c-40d0-4c48-bc38-1c60cced5ef9`, key `AutomationAud-c490db3c-a073-055f-88f8-82b15a5db693`) |
| Automation alimentadora | **`AU_RegrasTransacional_ARMARIOS`** (`d14b0418-e4d3-44e7-a3d0-3125c084b09d`) — diária **03:13 BRT**, high-watermark (só registros novos entram) |
| DE de entrada | **`Regua_Transacional_OPPORTUNITY`** (preenchida pelas queries `Regra_PedidoGerado_OPPORTUNITY`, `Regra_PrimeiroPagamento_OPPORTUNITY`, `Regra_PagamentoConcluido_OPPORTUNITY`) |
| Fonte de dados | Salesforce CRM: `ent.Opportunity_Salesforce_1` ⋈ `ent.Account_Salesforce_1` por CPF (`K12_CPFCliente__c = CPF__pc`), filtro `TipoRegistroNome__c = 'Armario'` |
| Canais | 4 e-mails (ids 81451, 81452, 81683, 81684) + 2 SMS (assets 184773 e 185049, short code `29520`) |
| Identidade AJO | `cpfHash` (namespace `cpf_hash`) — ⚠️ o CPF **não** é selecionado na DE hoje (só usado no JOIN) |
| Evento AJO | **— (Read Audience: sem evento).** Rota alternativa por evento = **A CRIAR** (proposta abaixo) |
| Ficha / de-para | Não existe (jornada fora do site e sem `sourceEventType` registrado) |

## Envelope do evento
No padrão **Read Audience não há evento AJO**: a jornada lê uma audiência do Unified Profile e as decisões
usam **atributos de perfil/audiência**, não `@event{}`. Não existe entrada desta jornada no
`ajo_event_map.json` (os 7 eventos `marketplace*` existentes são de outras jornadas — ex.:
`marketplaceDisparoDivulgacaoArmariosWpp` → `MRV_FTP_Disparo_Divulg_Armario`, jornada distinta).

Se a implementação optar pela **rota por evento** (batch diário publica 1 evento por registro da DE, como
na família Wedo), o envelope precisa ser **criado** — proposta ⚠️ **a confirmar**:

| Campo | Valor proposto |
|---|---|
| Evento AJO | **`MRV_CRM_Regua_Armarios_Opp`** (**A CRIAR** — nome a validar no padrão do time) |
| `eventType` | `dcsExternal` (mesmo tipo dos demais eventos `marketplace*` no `ajo_event_map.json`) |
| `sourceEventType` | `marketplaceReguaTransacionalArmariosOpportunity` (**A CRIAR**) |
| `sourceSystem` | `Salesforce` (proposta — origem é CRM, não `FTPFileImport`) |

## Fluxo AS-IS (SFMC)
```
Entrada diária 03:13 BRT (DE Regua_Transacional_OPPORTUNITY, high-watermark)
└─ MULTICRITERIADECISIONV2-1 — router 3-vias por StageName (atributo efêmero do evento)
   ├─ A · StageName = "Pedido gerado"
   │    STO Einstein 24h → EMAILV2-3 "Arm_transacional_pedidogerado_2026"
   │      (assunto "MRV | Pedido gerado ✅" / preheader "Assine seu contrato de móveis.")
   │    → Wait 10min → SMSSYNC-3 (asset 184773, texto estático: pedido gerado + link Meu MRV)
   │    → Wait 3d → ENGAGEMENTSPLITV2-3 "abriu EMAILV2-3?"
   │         Sim → Wait 1d → Fim
   │         Não → STO 24h → EMAILV2-8 "NA_Arm_transacional_pedidogerado_2026"
   │                 ("MRV | Assine seu contrato hoje") → Wait 1d → Fim
   ├─ B · StageName = "Primeiro pagamento" OU "Pagamento concluído"
   │    STO Einstein 24h → EMAILV2-4 "Arm_transacional_primeiropagamento_1_2026"
   │      ("MRV | Móveis planejados ✅" / "Parabéns pela compra!")
   │    → Wait 10min → SMSSYNC-4 (asset 185049, texto estático: parabéns + aviso de pesquisa)
   │    → Wait 3d → ENGAGEMENTSPLITV2-4 "abriu EMAILV2-4?"
   │         Sim → Wait 1d → Fim
   │         Não → STO 24h → EMAILV2-9 "Arm_transacional_primeiropagamento_NA_2026"
   │                 ("MRV | Compra efetuada ✅") → Wait 1d → Fim
   └─ C · Remainder → Wait 3d → Fim (sem envio)
```
- Endereços de canal (defaults do SFMC): e-mail = `MKT_EmailCliente__c`, celular = `PersonMobilePhone`.
- Personalização atual mínima: `%%Name%%` na saudação dos e-mails; SMS 100% estáticos.
- As 3 queries upstream janelam por **D-1**: `DataPedidoGerado__c` (regra Pedido gerado),
  `DataPrimeiroPagamento__c` (Primeiro pagamento) e `LastModifiedDate` (Pagamento concluído).

## Fluxo AJO equivalente
```
Read Audience (recorrência diária ~03:13 BRT, keyNamespace = cpf_hash)
  audiência ≡ Regua_Transacional_OPPORTUNITY (Opportunity Armário com transição de fase em D-1)
  └─ Condition · atributo stageName
       = "Pedido gerado"                                  → ramo A (Email 1 + SMS + Reaction + Email NA)
       ∈ {"Primeiro pagamento","Pagamento concluído"}     → ramo B (idem, assets do ramo B)
       else                                                → Fim
```
- **Router**: testa campo do **próprio registro de entrada** (sem join DE→DE / EXISTS) — no Read Audience
  vira condição sobre **atributo de perfil/audiência**; é o caso simples, sem o bloqueador das jornadas
  "PF - *". Alternativamente, embutir o critério na **definição de 3 audiências** (1 por regra SQL).
- **Engagement splits** → condição de **Reação** (abriu o e-mail 1 do ramo) + janela de espera de 3 dias
  — **não** é Optimize de atributo.
- **Einstein STO ×4** → Send-Time Optimization nativo do AJO (janela 24h) — comportamento a validar.
- **`SingleEntryAcrossAllVersions`** → bloquear reentrada do perfil na configuração da jornada AJO.

## Mapeamento dos campos → XDM
Campos da DE `Regua_Transacional_OPPORTUNITY` (13 colunas das queries). Não há de-para nem mapper C#
para esta jornada — o grupo `_mrv.opportunityEvent` é **proposta nova** (🆕 todos os leaves; hoje o schema
tem `identityEvents`, `sourceContext`, `ftpFileImport`, `contractBillingEvent`, `productOffer` etc., nenhum
cobre estágio de oportunidade). Paths de evento valem para a rota-evento; na rota Read Audience os mesmos
dados precisam existir como **atributos de perfil** (coluna "Uso").

| Campo DE/SQL | XDM (evento proposto) | Uso no AJO |
|---|---|---|
| CPF — `o.K12_CPFCliente__c` (⚠️ só no JOIN; **não é coluna da DE hoje**) | `_mrv.identityEvents.cpfHash` 🆕 | **identidade PK** (namespace `cpf_hash`; a Function gera o hash) |
| `MKT_EmailCliente__c` | `_mrv.identityEvents.email` | endereço do canal e-mail (perfil: `personalEmail.address`) |
| `PersonMobilePhone` | `_mrv.identityEvents.phone` | número do canal SMS (regra global telefone→phone; perfil: `mobilePhone.number`) |
| `FirstName` | — (não vai no evento) | resolvido no **PROFILE** via `cpfHash` → `person.name.firstName` (saudação, substitui `%%Name%%`) |
| `Name` | — (não vai no evento) | `person.name.fullName` no profile |
| `StageName` | `_mrv.opportunityEvent.stageName` 🆕 | **discriminador do router 3-vias** |
| `TipoRegistroNome__c` | `_mrv.opportunityEvent.recordTypeName` 🆕 | fixo `"Armario"` (filtro upstream; distingue da régua KIT) |
| `AccountId` | `_mrv.opportunityEvent.accountId` 🆕 | chave Salesforce (dedupe/troubleshooting) |
| `CreatedDate` | `_mrv.opportunityEvent.createdDate` 🆕 | metadado |
| `DataMudancaFase__c` | `_mrv.opportunityEvent.stageChangeDate` 🆕 | metadado (data da mudança de fase) |
| `DataPedidoGerado__c` | `_mrv.opportunityEvent.orderGeneratedDate` 🆕 | janela D-1 da regra "Pedido gerado" |
| `DataPrimeiroPagamento__c` | `_mrv.opportunityEvent.firstPaymentDate` 🆕 | janela D-1 da regra "Primeiro pagamento" |
| `LastModifiedDate` | `_mrv.opportunityEvent.lastModifiedDate` 🆕 | janela D-1 da regra "Pagamento concluído" |
| `LastActivityDate` | `_mrv.opportunityEvent.lastActivityDate` 🆕 | não usado na jornada (avaliar descarte) |
| — (fixo) | `_mrv.sourceContext.sourceEventType` = `marketplaceReguaTransacionalArmariosOpportunity` 🆕 | roteamento de ingestão |
| — (fixo) | `_mrv.sourceContext.sourceSystem` = `Salesforce` 🆕 | origem |

## Fórmulas prontas para o AJO
**Rota Read Audience (recomendada):** não há `@event{}` — as condições e a personalização leem o perfil:
- Router A: `profile._mrv.opportunityEvent.stageName = "Pedido gerado"` *(path do atributo de perfil a
  confirmar quando o schema de profile for definido)*.
- Router B: `stageName` ∈ `{"Primeiro pagamento", "Pagamento concluído"}` (⚠️ literal **com acento** —
  garantir encoding correto na ingestão/comparação).
- Saudação dos e-mails (substitui `%%Name%%`): `person.name.firstName` do **profile** (via `cpfHash`).

**Rota por evento (se adotada — evento `MRV_CRM_Regua_Armarios_Opp`, A CRIAR):**
- Router A:
  `@event{MRV_CRM_Regua_Armarios_Opp._mrv.opportunityEvent.stageName} = "Pedido gerado"`
- Router B:
  `@event{MRV_CRM_Regua_Armarios_Opp._mrv.opportunityEvent.stageName} in ("Primeiro pagamento", "Pagamento concluído")`
- Endereço e-mail: `@event{MRV_CRM_Regua_Armarios_Opp._mrv.identityEvents.email}`
- Número do SMS (userNumber): `@event{MRV_CRM_Regua_Armarios_Opp._mrv.identityEvents.phone}`

> Lembrete **concat**: sempre que texto fixo for combinado com variável numa mesma expressão, use
> `concat("texto ", @event{MRV_CRM_Regua_Armarios_Opp._mrv.opportunityEvent.stageName})` — nunca
> justaposição. Ex.: se algum e-mail/SMS for enriquecido com a fase:
> `concat("Sua compra está na etapa: ", @event{MRV_CRM_Regua_Armarios_Opp._mrv.opportunityEvent.stageName})`.
> Hoje os 2 SMS são 100% estáticos e os e-mails só usam a saudação (perfil) — nenhum concat necessário
> no estado atual.

## Gaps / pendências
- [ ] ⚠️ **Decidir o padrão de implementação**: Read Audience (recomendado — paridade com o padrão EJ) ou
  evento `dcsExternal` batch (**A CRIAR**: evento + sourceEventType + produtor). A spec cobre os dois.
- [ ] ⚠️ **CPF fora da DE**: incluir `K12_CPFCliente__c` na extração (hoje só entra no JOIN) — sem ele não
  há `cpfHash` e a resolução de identidade/nome no profile não funciona.
- [ ] ⚠️ **Disponibilizar a Opportunity Salesforce no AEP** (source connector CRM ou pipeline batch) com
  `stageName`, `recordTypeName` e as 3 datas — pré-requisito tanto da audiência quanto do router.
- [ ] Reproduzir as **3 regras SQL** (janelas D-1 por `DataPedidoGerado__c` / `DataPrimeiroPagamento__c` /
  `LastModifiedDate`, filtro `TipoRegistroNome__c='Armario'`) na definição da(s) audiência(s) e alinhar a
  recorrência diária ~03:13 BRT com high-watermark (só perfis novos na audiência entram).
- [ ] Modelar os 2 engagement splits como **Reaction** (abertura do e-mail 1 de cada ramo, janela 3d).
- [ ] Configurar **STO nativo** (janela 24h) nos 4 pontos e validar comportamento vs Einstein STO.
- [ ] Reproduzir **`SingleEntryAcrossAllVersions`** (sem reentrada) na configuração da jornada.
- [ ] Migrar assets: 4 e-mails (81451, 81452, 81683, 81684 — HTML com imagens em `cdn.mrv.com.br`) e 2 SMS
  estáticos (184773 "Pedido gerado + link Meu MRV"; 185049 "Parabéns + aviso de pesquisa"), short code `29520`.
- [ ] ⚠️ Encoding do literal **"Pagamento concluído"** (acento) — o raw SFMC exibe mojibake; validar o valor
  exato no Salesforce antes de fixar a condição.
- [ ] Tratar as **irmãs** em specs próprias: "Regua Transacional Armarios LEAD" (`0e951b76`) e a régua KIT
  (`AU_RegrasTransacional_KIT` → "Regua Transacional KIT OPPORTUNITY") — estruturas análogas, DEs/regras distintas.

## Complexidade
🟡 **Média** — o fluxo em si é simples (router 3-vias sobre campo do próprio registro + 2 Reactions + STO,
sem joins EXISTS), mas a entrada Read Audience exige materializar a Opportunity do Salesforce no AEP
(3 regras SQL com janelas D-1) e incluir o CPF que hoje não vem na DE para viabilizar o `cpfHash`.
