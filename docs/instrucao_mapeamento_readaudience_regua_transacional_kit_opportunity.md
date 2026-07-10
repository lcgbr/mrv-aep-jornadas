# Instrução de mapeamento — Regua_Transacional_KIT_OPPORTUNITY · evento **A CRIAR — sem evento (Read Audience)** (batch diário, NÃO-FTP/NÃO-API)

> Régua transacional do **KIT de acabamentos** do Marketplace. **Não é FTP** (nenhum CSV entra por arquivo):
> a entrada é `AutomationAudience` — a automation **`AU_RegrasTransacional_KIT`** roda SQL diário sobre as
> DEs sincronizadas do **Salesforce** (`Opportunity_Salesforce_1` ⋈ `Account_Salesforce_1`), grava a DE
> **`Regua_KIT_Transacional_OPPORTUNITY`** e injeta na jornada. No AJO o padrão equivalente é **Read
> Audience**, com router por `StageName` — **irmã estrutural** de "Regua Transacional Armarios OPPORTUNITY"
> (`079c809a`, spec própria); o que muda entre elas está resumido na seção "Diferenças vs Armários".
> ⚠️ Não confundir com: **`JB_Regua_Transacional_KIT_LEAD`** (`57b4b7c6`, mesma automation, DE de LEAD),
> "jornada kit v2" (`97f9767a`), "Disparo Divulgação Kit" (`2f2ff423`) e "AU_jornada_kit_novos_leads_com"
> (`ffa1c696`) — são workflows KIT **distintos**, fora do escopo desta spec.

## Identificação
| | |
|---|---|
| Jornada SFMC | **Regua_Transacional_KIT_OPPORTUNITY** (`2be420b5-b3b8-4ea8-b662-edfdcb2cf856`, BU `mrv-marketplace`) — Published v4, entryMode `MultipleEntries` |
| Entrada SFMC | `AutomationAudience` (eventDefinition `8730b4a8-d4fe-4391-9693-f0c14f72271e`, key `DEAudience-74ff26d3-bf98-c03d-7b4f-69d845404af3`), high-watermark (só registros novos entram) |
| Automation alimentadora | **`AU_RegrasTransacional_KIT`** (`580f257a-c2ce-4b12-b99c-18db7b999dc7`) — diária **03:15 BRT**; também injeta a irmã `JB_Regua_Transacional_KIT_LEAD` |
| DE de entrada | **`Regua_KIT_Transacional_OPPORTUNITY`** (preenchida pelas queries `Regra_KIT_PedidoGerado_OPPORTUNITY` e `Regra_PreGanho_Ganho_OPPORTUNITY`) |
| Fonte de dados | Salesforce CRM: `ent.Opportunity_Salesforce_1` ⋈ `ent.Account_Salesforce_1` por CPF (`K12_CPFCliente__c = CPF__pc`), filtro `TipoRegistroNome__c = 'KitAcabamentoMRV'` |
| Canais | 6 e-mails (ids legados 75213, 75215, 75217, 75218, 75219, 75220 / assets 201785, 201787, 201790, 201791, 201795, 201796) + 2 SMS (assets 201788 e 201792, short code `29520`) |
| Identidade AJO | `cpfHash` (namespace `cpf_hash`) — ⚠️ o CPF **não** é selecionado na DE hoje (só usado no JOIN) |
| Evento AJO | **— (Read Audience: sem evento).** Rota alternativa por evento = **A CRIAR** (proposta abaixo) |
| Ficha / de-para | Assessment em `docs/mrv-marketplace/2be420b5-….md`; **sem de-para nem `sourceEventType`** registrados (fora dos 66 eventos exportados) |

## Envelope do evento
No padrão **Read Audience não há evento AJO**: a jornada lê uma audiência do Unified Profile e as decisões
usam **atributos de perfil/audiência**, não `@event{}`. Não existe entrada desta jornada no
`ajo_event_map.json` — os 7 eventos `marketplace*` existentes pertencem a outras jornadas (ex.:
`marketplaceDisparoDivulgacaoArmariosWpp` → `MRV_FTP_Disparo_Divulg_Armario`, jornada distinta).

Se a implementação optar pela **rota por evento** (batch diário publica 1 evento por registro da DE), o
envelope precisa ser **criado** — proposta ⚠️ **a confirmar**, espelhando a proposta da irmã Armários
(`MRV_CRM_Regua_Armarios_Opp`):

| Campo | Valor proposto |
|---|---|
| Evento AJO | **`MRV_CRM_Regua_KIT_Opp`** (**A CRIAR** — nome a validar no padrão do time) |
| `eventType` | `dcsExternal` (mesmo tipo dos demais eventos `marketplace*` no `ajo_event_map.json`) |
| `sourceEventType` | `marketplaceReguaTransacionalKitOpportunity` (**A CRIAR**) |
| `sourceSystem` | `Salesforce` (proposta — origem é CRM, não `FTPFileImport`) |

## Fluxo AS-IS (SFMC)
```
Entrada diária 03:15 BRT (DE Regua_KIT_Transacional_OPPORTUNITY, high-watermark)
└─ MULTICRITERIADECISIONV2-1 "KIT??" — TipoRegistroNome__c = "KitAcabamentoMRV"?
   ├─ Não é KIT → Fim (sem envio)
   └─ É KIT → MULTICRITERIADECISIONV2-2 — router por StageName
      ├─ A · StageName = "Pedido gerado"
      │    STO Einstein 24h → EMAILV2-1 "KIT - 03 Oportunidade - pedido gerado"
      │      ("MRV | Pedido gerado ✅" / "Assine seu contrato de acabamentos.")
      │    → Wait 10min → SMSSYNC-1 (asset 201788, estático: pedido gerado + link kitacabamentos.mrv.com.br)
      │    → Wait 1d → ENGAGEMENTSPLITV2-1 "abriu EMAILV2-1?"
      │         Sim → Fim
      │         Não → STO 24h → EMAILV2-3 "KIT - NA 03" ("MRV | Assine seu contrato hoje.") → Fim
      ├─ B · StageName = "Pré-Ganho/Ganho"
      │    STO Einstein 24h → EMAILV2-2 "KIT - 04 pré-ganho_ganho"
      │      ("MRV | Acabamentos garantidos ✅" / "Parabéns por sua compra!")
      │    → Wait 10min → SMSSYNC-2 (asset 201792, estático: parabéns + aviso de pesquisa)
      │    → Wait 1d → ENGAGEMENTSPLITV2-2 "abriu EMAILV2-2?"
      │         Sim → (segue direto p/ cross-sell ↓)
      │         Não → STO 24h → EMAILV2-4 "KIT - NA 04" ("MRV | Compra efetuada ✅") → (cross-sell ↓)
      │    CROSS-SELL (as 2 pernas convergem):
      │    WAITBYATTRIBUTE-1 · até CreatedDate + 5 dias
      │    → EMAILV2-5 "KIT 05 - Soluções em armários" ("Já está pensando na decoração?")
      │    → Wait 1d → ENGAGEMENTSPLITV2-3 "abriu EMAILV2-5?"
      │         Sim → Fim
      │         Não → EMAILV2-6 "KIT NA 05" ("MRV | Confira a próxima etapa.") → Fim
      └─ C · Remainder → Fim (sem envio)
```
- Endereços de canal (defaults da jornada): e-mail = `PersonEmail`, celular = `PersonMobilePhone` (da DE).
- Personalização atual mínima: `%%Name%%` na saudação dos 6 e-mails; os 2 SMS são 100% estáticos.
- As 2 queries upstream janelam por **D-1**: `DataPedidoGerado__c` (regra "Pedido gerado") e `CreatedDate`
  (regra "Pré-Ganho/Ganho"); ambas com `GROUP BY AccountId` (1 linha por conta).
- O e-mail "KIT 05" é **cross-sell de armários** dentro da régua KIT (só ramo B) — o `WAITBYATTRIBUTE`
  espera até **`CreatedDate` + 5 dias** (data absoluta da DE, não duração relativa ao passo anterior).

## Diferenças vs "Regua Transacional Armarios OPPORTUNITY" (irmã estrutural)
Mesmo esqueleto (AutomationAudience diário + router por `StageName` + e-mail→SMS→engagement split→NA + STO),
mas **não** são idênticas — o que muda na KIT:
1. **DE/queries**: `Regua_KIT_Transacional_OPPORTUNITY` com **2 regras** ("Pedido gerado" e "Pré-Ganho/Ganho")
   — não existem as regras "Primeiro pagamento"/"Pagamento concluído" da Armários.
2. **Router extra**: 1º router "KIT??" revalida `TipoRegistroNome__c = "KitAcabamentoMRV"` (na Armários o
   filtro fica só no SQL); o router de fase é **2-vias** + remainder (Armários: 3-vias).
3. **Perna de cross-sell**: ramo B ganha `WAITBYATTRIBUTE` (CreatedDate + 5d) → e-mail "KIT 05 Soluções em
   armários" + NA → **6 e-mails** vs 4 na Armários; a Armários não tem wait por atributo de data.
4. **Coluna de e-mail**: `PersonEmail` (Armários usa `MKT_EmailCliente__c`).
5. **Reentrada**: `MultipleEntries` (Armários: `SingleEntryAcrossAllVersions`).
6. **Waits pós-SMS**: 1 dia antes do engagement split (Armários: 3 dias) e horário da automation 03:15
   (Armários: 03:13).

## Fluxo AJO equivalente
```
Read Audience (recorrência diária ~03:15 BRT, keyNamespace = cpf_hash)
  audiência ≡ Regua_KIT_Transacional_OPPORTUNITY (Opportunity KIT com transição de fase em D-1)
  └─ Condition · recordTypeName = "KitAcabamentoMRV"  (ou embutir na definição da audiência)
       └─ Condition · atributo stageName
            = "Pedido gerado"    → ramo A (Email 03 + SMS + Reaction + Email NA 03)
            = "Pré-Ganho/Ganho"  → ramo B (Email 04 + SMS + Reaction + Email NA 04
                                            → Wait até createdDate+5d → Email 05 + Reaction + Email NA 05)
            else                 → Fim
```
- **Routers**: testam campos do **próprio registro de entrada** (sem join DE→DE / EXISTS) — no Read Audience
  viram condições sobre **atributos de perfil/audiência**; caso simples. O 1º router pode ser absorvido pela
  definição da audiência (o SQL upstream já filtra `KitAcabamentoMRV`).
- **Engagement splits ×3** → condição de **Reação** (abriu o e-mail anterior do ramo) + janela de 1 dia —
  **não** é Optimize de atributo.
- **`WAITBYATTRIBUTE`** → Wait do AJO com **data calculada a partir de atributo** (`createdDate` + 5 dias,
  timezone America/Sao_Paulo) — validar suporte na modalidade escolhida (custom timer / atributo de data).
- **Einstein STO ×4** → Send-Time Optimization nativo do AJO (janela 24h) — comportamento a validar.
- **`MultipleEntries`** → permitir reentrada do perfil na configuração da jornada AJO (o high-watermark da
  DE limita a 1 entrada por registro novo/dia).

## Mapeamento dos campos → XDM
Campos da DE `Regua_KIT_Transacional_OPPORTUNITY` (13 colunas das 2 queries). Não há de-para nem mapper C#
para esta jornada — o grupo `_mrv.opportunityEvent` é a **mesma proposta nova** 🆕 feita na spec da irmã
Armários (reutilizar o mesmo grupo para as duas réguas). Paths de evento valem para a rota-evento; na rota
Read Audience os mesmos dados precisam existir como **atributos de perfil** (coluna "Uso").

| Campo DE/SQL | XDM (evento proposto) | Uso no AJO |
|---|---|---|
| CPF — `o.K12_CPFCliente__c` (⚠️ só no JOIN; **não é coluna da DE hoje**) | `_mrv.identityEvents.cpfHash` 🆕 | **identidade PK** (namespace `cpf_hash`; a Function gera o hash) |
| `PersonEmail` | `_mrv.identityEvents.email` | endereço do canal e-mail (perfil: `personalEmail.address`) — ⚠️ Armários usa `MKT_EmailCliente__c`; aqui é `PersonEmail` |
| `PersonMobilePhone` | `_mrv.identityEvents.phone` | número do canal SMS (regra global telefone→phone; perfil: `mobilePhone.number`) |
| `FirstName` | — (não vai no evento) | resolvido no **PROFILE** via `cpfHash` → `person.name.firstName` |
| `Name` | — (não vai no evento) | `person.name.fullName` no profile (saudação `%%Name%%` dos 6 e-mails) |
| `StageName` | `_mrv.opportunityEvent.stageName` 🆕 | **discriminador do router 2-vias** |
| `TipoRegistroNome__c` | `_mrv.opportunityEvent.recordTypeName` 🆕 | fixo `"KitAcabamentoMRV"` (router "KIT??"; distingue da régua Armários) |
| `AccountId` | `_mrv.opportunityEvent.accountId` 🆕 | chave Salesforce (GROUP BY upstream; dedupe/troubleshooting) |
| `CreatedDate` | `_mrv.opportunityEvent.createdDate` 🆕 | **âncora do WAITBYATTRIBUTE** (cross-sell em `createdDate` + 5d) e janela D-1 da regra "Pré-Ganho/Ganho" |
| `DataMudancaFase__c` | `_mrv.opportunityEvent.stageChangeDate` 🆕 | metadado (data da mudança de fase) |
| `DataPedidoGerado__c` | `_mrv.opportunityEvent.orderGeneratedDate` 🆕 | janela D-1 da regra "Pedido gerado" |
| `DataPrimeiroPagamento__c` | `_mrv.opportunityEvent.firstPaymentDate` 🆕 | não usado nesta jornada (avaliar descarte) |
| `LastModifiedDate` | `_mrv.opportunityEvent.lastModifiedDate` 🆕 | metadado (não roteia aqui, ao contrário da Armários) |
| `LastActivityDate` | `_mrv.opportunityEvent.lastActivityDate` 🆕 | não usado na jornada (avaliar descarte) |
| — (fixo) | `_mrv.sourceContext.sourceEventType` = `marketplaceReguaTransacionalKitOpportunity` 🆕 | roteamento de ingestão |
| — (fixo) | `_mrv.sourceContext.sourceSystem` = `Salesforce` 🆕 | origem |

## Fórmulas prontas para o AJO
**Rota Read Audience (recomendada):** não há `@event{}` — as condições e a personalização leem o perfil:
- Router "KIT??": `profile._mrv.opportunityEvent.recordTypeName = "KitAcabamentoMRV"` *(path do atributo de
  perfil a confirmar quando o schema de profile for definido; alternativa: embutir na audiência)*.
- Router A: `stageName = "Pedido gerado"`.
- Router B: `stageName = "Pré-Ganho/Ganho"` (⚠️ literal **com acento e barra** — garantir encoding correto
  na ingestão/comparação; o raw SFMC exibe mojibake).
- Wait do cross-sell: data-alvo = atributo `createdDate` + 5 dias.
- Saudação dos e-mails (substitui `%%Name%%`): `person.name.fullName` (ou `firstName`) do **profile** via `cpfHash`.

**Rota por evento (se adotada — evento `MRV_CRM_Regua_KIT_Opp`, A CRIAR):**
- Router "KIT??":
  `@event{MRV_CRM_Regua_KIT_Opp._mrv.opportunityEvent.recordTypeName} = "KitAcabamentoMRV"`
- Router A:
  `@event{MRV_CRM_Regua_KIT_Opp._mrv.opportunityEvent.stageName} = "Pedido gerado"`
- Router B:
  `@event{MRV_CRM_Regua_KIT_Opp._mrv.opportunityEvent.stageName} = "Pré-Ganho/Ganho"`
- Endereço e-mail: `@event{MRV_CRM_Regua_KIT_Opp._mrv.identityEvents.email}`
- Número do SMS (userNumber): `@event{MRV_CRM_Regua_KIT_Opp._mrv.identityEvents.phone}`
- Data-âncora do wait de cross-sell: `@event{MRV_CRM_Regua_KIT_Opp._mrv.opportunityEvent.createdDate}` + 5 dias

> Lembrete **concat**: sempre que texto fixo for combinado com variável numa mesma expressão, use
> `concat("texto ", @event{MRV_CRM_Regua_KIT_Opp._mrv.opportunityEvent.stageName})` — nunca justaposição.
> Ex.: se algum e-mail/SMS for enriquecido com a fase:
> `concat("Sua compra está na etapa: ", @event{MRV_CRM_Regua_KIT_Opp._mrv.opportunityEvent.stageName})`.
> Hoje os 2 SMS são 100% estáticos e os e-mails só usam a saudação (perfil) — nenhum concat necessário
> no estado atual.

## Gaps / pendências
- [ ] ⚠️ **Decidir o padrão de implementação**: Read Audience (recomendado — paridade com a irmã Armários) ou
  evento `dcsExternal` batch (**A CRIAR**: evento + sourceEventType + produtor). A spec cobre os dois.
  Decidir **em conjunto com a régua Armários** — mesmo grupo XDM e mesmo produtor atendem as duas.
- [ ] ⚠️ **CPF fora da DE**: incluir `K12_CPFCliente__c` na extração (hoje só entra no JOIN) — sem ele não
  há `cpfHash` e a resolução de identidade/nome no profile não funciona.
- [ ] ⚠️ **Disponibilizar a Opportunity Salesforce no AEP** (source connector CRM ou pipeline batch) com
  `stageName`, `recordTypeName`, `createdDate` e `orderGeneratedDate` — pré-requisito da audiência e dos routers.
- [ ] Reproduzir as **2 regras SQL** (janela D-1 por `DataPedidoGerado__c` na regra "Pedido gerado" e por
  `CreatedDate` na regra "Pré-Ganho/Ganho", filtro `TipoRegistroNome__c='KitAcabamentoMRV'`, dedupe por
  `AccountId`) na definição da(s) audiência(s) e alinhar a recorrência diária ~03:15 BRT com high-watermark.
- [ ] Modelar os 3 engagement splits como **Reaction** (abertura do e-mail anterior, janela 1d) — atenção ao
  ramo B: as pernas Sim/Não **convergem** para o mesmo cross-sell (no AJO, duplicar a perna ou usar condição).
- [ ] ⚠️ Implementar o **wait por atributo de data** (`createdDate` + 5 dias, TZ America/Sao_Paulo) — validar
  o suporte do AJO a data-alvo calculada de atributo; se a entrada ocorre em D+1 da criação, o efeito prático
  é ~4 dias após a entrada.
- [ ] Configurar **STO nativo** (janela 24h) nos 4 pontos e validar comportamento vs Einstein STO.
- [ ] Reproduzir **`MultipleEntries`** (reentrada permitida) na configuração da jornada AJO.
- [ ] Migrar assets: 6 e-mails (assets 201785, 201787, 201790, 201791, 201795, 201796 — HTML com imagens em
  `cdn.mrv.com.br`, saudação `%%Name%%`) e 2 SMS estáticos (201788 "Pedido gerado + link
  kitacabamentos.mrv.com.br"; 201792 "Parabéns + aviso de pesquisa"), short code `29520`.
- [ ] ⚠️ Encoding do literal **"Pré-Ganho/Ganho"** (acento + `/`) — o raw SFMC exibe mojibake; validar o valor
  exato no Salesforce antes de fixar a condição do router B.
- [ ] Tratar a **irmã** `JB_Regua_Transacional_KIT_LEAD` (`57b4b7c6`, mesma automation, DE de LEAD com regras
  próprias — Pendente Atendimento / Não Localizado / Agendado / Não Compareceu) em spec própria.

## Complexidade
🟡 **Média** — o fluxo é o mesmo esqueleto simples da irmã Armários (routers sobre campos do próprio registro
+ Reactions + STO, sem joins EXISTS), mas a entrada Read Audience exige materializar a Opportunity do
Salesforce no AEP (2 regras SQL D-1) e incluir o CPF que hoje não vem na DE, além do wait por atributo de
data (`createdDate` + 5d) na perna de cross-sell de armários.
