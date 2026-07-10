# Instrução de mapeamento — Disparo Divulgacao Armários - WPP · evento **MRV_FTP_Disparo_Divulg_Armario** (FTP WhatsApp)

> Jornada FTP WhatsApp de **disparo único** (blast): um arquivo CSV é importado por automation e cada
> registro dispara **1 template de WhatsApp** (`mdc_armarios_divulgacao_prd`, bot MariaRosa) divulgando
> móveis planejados (armários). **Sem waits, sem splits, sem router** — o único fator de atenção é o
> campo `empreendimento` ({{2}} do template), hoje **sem destino XDM** no mapper (ver Gaps).

## Identificação
| | |
|---|---|
| Jornada SFMC | **Disparo Divulgacao Armários - WPP** (`bfeac362-29ee-44ec-9720-6b2cb9bf8915`, BU `mrv-marketplace`) — Draft v4, `MultipleEntries` |
| Entrada SFMC | `AutomationAudience` (eventDefinition `185a67e2-c8ae-4d65-a7dd-b3bf5d8e56fc`, key `DEAudience-0c391374-3e1e-e692-a354-e5d7f0360685`) → **FTP file import** |
| Automation alimentadora | **"Disparo Divulgação armarios"** (`edc13a64-3b49-4c7a-b0da-4bdb9405a1a3`) — file-triggered na pasta `import\disparo_divulgacao_armarios\` |
| DE de entrada | **`Disparo_divulgacao_Armarios`** (`98fe3130-fe33-f111-ba7c-48df37e63d29`) — ~2380 linhas na última execução |
| Arquivo de origem | `6-19-2026-Disparo_divulgacao_Armarios.csv` — header **`CPF,Primeiro_nome,empreendimento,Celular`** (4 colunas) |
| `sourceEventType` | `marketplaceDisparoDivulgacaoArmariosWpp` |
| Canal / template | 1 WhatsApp ativo · template **`mdc_armarios_divulgacao_prd`** (APPROVED, MARKETING, pt_BR) · bot **MariaRosa** · namespace `1161020f_8cf8_31c7_fe76_eecfde18f26f` |
| Identidade AJO | `_mrv.identityEvents.cpfHash` (namespace `cpf_hash`; a Function gera o hash) — `phone` também serve de identidade (namespace `telefone_email`) |
| Evento AJO | **`MRV_FTP_Disparo_Divulg_Armario`** |
| De-para / mapper | `de_para_jornadas/marketplaceDisparoDivulgacaoArmariosWpp.md` · `DisparoDivulgacaoArmariosWppAepMapper.cs` |

## Envelope do evento
| Campo | Valor |
|---|---|
| Evento AJO | **`MRV_FTP_Disparo_Divulg_Armario`** |
| `eventType` (tipo do evento AJO — `ajo_event_map.json`) | `dcsExternal` |
| `eventType` (leaf XDM gravado no payload) | `marketplace.ftpFileImport` |
| `_mrv.sourceContext.sourceEventType` | `marketplaceDisparoDivulgacaoArmariosWpp` |
| `_mrv.sourceContext.sourceSystem` | `FTPFileImport` (fixo) |
| `_mrv.ftpFileImport.sourceFileName` | nome do arquivo recebido |

## Fluxo AS-IS (SFMC)
```
Arquivo CSV em import\disparo_divulgacao_armarios\ (ex.: 6-19-2026-Disparo_divulgacao_Armarios.csv)
└─ Automation "Disparo Divulgação armarios" (file-triggered, queueFiles)
   ├─ Step 1 · "Import armarios" → DE Disparo_divulgacao_Armarios (~2380 linhas)
   └─ Step 2 · AutomationAudience → Jornada "Disparo Divulgacao Armários - WPP"
        └─ REST-2 (WhatsApp custom activity, executeUrl fncustomactivitywhatsappprd…/api/execute)
             → template mdc_armarios_divulgacao_prd (bot MariaRosa)
             (sem waits, sem splits, sem goals/exits — 1 disparo por registro)
```
- **Corpo do template** (`{{1}}` = nome, `{{2}}` = empreendimento):
  `*Próximo passo rumo ao apê completo!* … Escolha móveis planejados, {{1}} ✨ … *Preços de fábrica e parcelamento flexível para o {{2}}*`
- **Botão**: quick_reply único **"Armários Planejados"** (payload estático `"Armários Planejados"`).
- No SFMC os slots vinham da DE: `templateText[0] = Primeiro_nome`, `templateText[1] = Empreendimento`,
  `userNumber = Celular`.

## Fluxo AJO equivalente
```
Evento MRV_FTP_Disparo_Divulg_Armario (dcsExternal · 1 evento por linha do CSV)
  └─ Ação WhatsApp (Custom Action) → template mdc_armarios_divulgacao_prd (bot MariaRosa)
       userNumber = @event{MRV_FTP_Disparo_Divulg_Armario._mrv.identityEvents.phone}
       {{1}} nome         = profile → person.name.firstName (via cpfHash — NÃO vai no evento)
       {{2}} empreendimento = @event{MRV_FTP_Disparo_Divulg_Armario._mrv.productOffer.developmentName} 🆕
       botão quick_reply "Armários Planejados" (payload estático)
  (sem waits / sem splits)
```
- Disparo único e estático → **publicável direto**, exceto pela pendência do leaf de `empreendimento` (🆕, abaixo).
- `MultipleEntries` no SFMC → permitir reentrada do perfil na config da jornada AJO (blast pode reenviar).

## Mapeamento dos campos → XDM
Base: de-para `marketplaceDisparoDivulgacaoArmariosWpp.md` + mapper `DisparoDivulgacaoArmariosWppAepMapper.cs`
(payload `DisparoDivulgacaoArmariosWppPayload.cs`, header `CPF,Primeiro_nome,empreendimento,Celular`).

| # | Campo CSV | XDM (evento) | FG | Uso no AJO |
|---|---|---|---|---|
| 0 | `CPF` | `_mrv.identityEvents.cpfHash` | Identity | **Identidade PK** (namespace `cpf_hash`; a Function gera o hash) |
| 1 | `Primeiro_nome` | — (não vai no evento) | Profile | Resolvido no **PROFILE** via `cpfHash` → `person.name.firstName` → `{{1}}` do template |
| 2 | `empreendimento` | `_mrv.productOffer.developmentName` 🆕 **(A CRIAR)** | — | `{{2}}` do template. **Hoje SEM DESTINO** no mapper (de-para: "SEM DESTINO; offerName roteia"). Ver Gaps |
| 3 | `Celular` | `_mrv.identityEvents.phone` | Identity | **userNumber** do WhatsApp (regra global telefone→`phone`; também `mobilePhone.number`; identidade secundária namespace `telefone_email`) |

> `_mrv.sourceContext.sourceEventType` = `marketplaceDisparoDivulgacaoArmariosWpp` e
> `_mrv.sourceContext.sourceSystem` = `FTPFileImport` são fixos do envelope (não vêm do CSV).

## Fórmulas prontas para o AJO
Parâmetros da Custom Action de WhatsApp (`inputPayload`):
- **templateName** (fixo): `mdc_armarios_divulgacao_prd`
- **namespaceId** (fixo): `1161020f_8cf8_31c7_fe76_eecfde18f26f`
- **botName** (fixo): `MariaRosa`
- **userNumber**: `@event{MRV_FTP_Disparo_Divulg_Armario._mrv.identityEvents.phone}`
- **templateText[0]** (`{{1}}` — nome): **do PROFILE**, `person.name.firstName` (resolvido via `cpfHash`) — **NÃO** é `@event{}`
  (regra global: nome/primeiro nome resolvido no profile, não trafega no evento).
- **templateText[1]** (`{{2}}` — empreendimento): `@event{MRV_FTP_Disparo_Divulg_Armario._mrv.productOffer.developmentName}` 🆕
  *(path proposto — só funciona após criar o leaf e mapear `empreendimento` no C#; ver Gaps)*
- **templateButton[0]**: quick_reply, texto/payload estático `"Armários Planejados"` (sem variável).

> **Lembrete `concat`**: sempre que **texto fixo + variável** forem combinados **numa mesma expressão**, use
> `concat("texto ", @event{MRV_FTP_Disparo_Divulg_Armario._mrv.productOffer.developmentName})` — nunca
> justaposição. **Neste template não é necessário**: o corpo já tem o texto fixo e recebe `{{1}}`/`{{2}}` como
> **argumentos posicionais** (cada um em seu elemento de `templateText`), sem concatenação. O `concat` só
> entraria se você montasse manualmente uma string combinada (ex.: fallback de saudação
> `concat("Olá ", @event{MRV_FTP_Disparo_Divulg_Armario._mrv.identityEvents.phone})` — exemplo ilustrativo).

## Gaps / pendências
- [ ] ⚠️ **`empreendimento` sem destino XDM** — o template usa `{{2}}` = empreendimento, mas o mapper
  `DisparoDivulgacaoArmariosWppAepMapper.cs` **não mapeia** `payload.Empreendimento` (a extensão só tem
  `ftpFileImport` + `sourceContext` + `identityEvents`) e o de-para marca "SEM DESTINO". **Sem correção o
  `{{2}}` sai vazio.** Ação: criar o leaf **`_mrv.productOffer.developmentName`** 🆕 (nome do grupo/leaf a
  validar com o time) no schema/extensão e mapear `empreendimento → developmentName` no C#.
- [ ] ⚠️ **`{{1}}` depende do PROFILE**: garantir que `person.name.firstName` está populado via `cpfHash`
  (no SFMC vinha da DE `Primeiro_nome`); se o profile não tiver o nome, a saudação sai vazia — avaliar
  fallback ou, alternativamente, decidir por trafegar o nome no evento (contra a regra global — só se necessário).
- [ ] Confirmar bot **MariaRosa** / `namespaceId` `1161020f_8cf8_31c7_fe76_eecfde18f26f` no ambiente AJO (prod).
- [ ] Template `mdc_armarios_divulgacao_prd` já **APPROVED** no Meta (MARKETING, pt_BR) — confirmar categoria
  MARKETING vs. cap de envio (jornada é divulgação/blast).
- [ ] `MultipleEntries` (blast) → definir política de reentrada/deduplicação na jornada AJO.
- [ ] Botão quick_reply "Armários Planejados": confirmar tratamento da resposta (entry source / próxima jornada)
  se houver — no SFMC `templateButtonAsEntrySourceData=false`.

## Complexidade
🟢 **Baixa** — disparo único de WhatsApp, estático, sem waits/splits/router (publicável quase direto); o único
driver é criar o leaf XDM `_mrv.productOffer.developmentName` 🆕 e mapear `empreendimento` no C#, pois `{{2}}`
do template não tem origem hoje.
