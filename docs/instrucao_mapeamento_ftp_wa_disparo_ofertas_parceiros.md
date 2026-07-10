# Instrução de mapeamento — Disparo Ofertas em parceiros - WPP · evento **MRV_FTP_Disp_Oferta_Parc** (FTP WhatsApp)

> Jornada FTP WhatsApp **1-evento / 1-mensagem**: sem router, sem decision split, sem wait.
> O arquivo cai por FTP, é importado numa DE e dispara **um único WhatsApp** (template
> `mdc_ofertas_especificas_prd`, bot MariaRosa) com a oferta do parceiro. A mais simples do padrão:
> publicável direto no AJO. Atenção só ao **Primeiro_nome**, que **não vem no evento** — resolve
> no PROFILE via `cpfHash` (`person.name.firstName`).

## Identificação
| | |
|---|---|
| Jornada SFMC | **Disparo Ofertas em parceiros - WPP** (`0da3ebe8-c62d-43bd-ad18-3e35fcde1899`, BU `mrv-marketplace`) |
| Entrada SFMC | Automation **"Disparo Ofertas em Parceiros"** — file trigger na pasta `import\disparo_ofertas_em_parceiros\` → Import File → Start Journey |
| DE / arquivo | `6-19-2026-Disparo_ofertas_parceiros.csv` (6 colunas) · `AutomationAud-9cea84c3-be73-8603-5d1e-727a2029610b` |
| `sourceEventType` | `marketplaceDisparoOfertasEmParceirosWpp` |
| Evento AJO | **`MRV_FTP_Disp_Oferta_Parc`** |
| Canal / template | **só WhatsApp** — `mdc_ofertas_especificas_prd` (bot **MariaRosa**, namespace `1161020f_8cf8_31c7_fe76_eecfde18f26f`) |
| Identidade | `CPF` → `_mrv.identityEvents.cpfHash` (namespace `cpf_hash`; a Function gera o hash) |

## Envelope do evento
| Campo | Valor |
|---|---|
| Evento AJO | `MRV_FTP_Disp_Oferta_Parc` |
| `eventType` (AJO / `ajo_event_map.json`) | **`dcsExternal`** (evento externo via Data Collection Service) |
| `eventType` (atributo XDM do payload) | `marketplace.ftpFileImport` |
| `_mrv.sourceContext.sourceEventType` | `marketplaceDisparoOfertasEmParceirosWpp` |
| `_mrv.sourceContext.sourceSystem` | `FTPFileImport` (fixo) |
| `_mrv.ftpFileImport.sourceFileName` | nome do arquivo recebido |

> O envelope acima está confirmado no mapper C# `DisparoOfertasEmParceirosWppAepMapper.cs`
> (`EventType = "marketplace.ftpFileImport"`, `SourceSystem = "FTPFileImport"`). No AJO o evento é do
> tipo **`dcsExternal`** (todos os eventos externos MRV entram por DCS/streaming).

## Fluxo AS-IS (SFMC)
```
Automation "Disparo Ofertas em Parceiros"  (file trigger: import\disparo_ofertas_em_parceiros\)
  ├─ Step 1  Import File  "Import ofertas em parceiros"   (CSV → DE)
  └─ Step 2  Start Journey  →  Journey "Disparo Ofertas em parceiros - WPP" (0da3ebe8)
                                 └─ REST-2  WhatsApp  template mdc_ofertas_especificas_prd  → Fim
```
- **Sem router, sem decision split, sem wait.** A jornada tem **1 única atividade** (WhatsApp custom
  activity `REST-2`, bot MariaRosa).
- **userNumber** (SFMC) = `{{Event…Celular}}`; **templateText** (SFMC, nesta ordem) =
  `[Primeiro_nome, Parceiro, Desconto, Link]` — casa com `{{1}}{{2}}{{3}}{{4}}` do template.

## Template WhatsApp (`mdc_ofertas_especificas_prd`)
Meta: `pt_BR` · categoria **MARKETING** · status **APPROVED**. Corpo:
```
Ei, {{1}}! Temos uma *oferta imperdível na {{2}}*, especialmente para você!

Vários produtos com *até {{3}} OFF* e condições exclusivas para clientes MRV.

Aproveite: {{4}}
```
| Placeholder | Origem | Fonte no AJO |
|---|---|---|
| `{{1}}` — primeiro nome | `Primeiro_nome` (CSV) | **PROFILE** via `cpfHash` → `person.name.firstName` (⚠️ **não vem no evento**) |
| `{{2}}` — parceiro | `parceiro` (CSV) | `@event{MRV_FTP_Disp_Oferta_Parc._mrv.productOffer.partnerName}` |
| `{{3}}` — desconto | `Desconto` (CSV, ex.: `13%`) | `@event{MRV_FTP_Disp_Oferta_Parc._mrv.productOffer.discountAmount}` |
| `{{4}}` — link | `Link` (CSV) | `@event{MRV_FTP_Disp_Oferta_Parc._mrv.productOffer.offerLink}` |

## Mapeamento dos campos → XDM
| # | Campo CSV/DE | Path XDM completo | Uso no AJO |
|---|---|---|---|
| 0 | `CPF` | `_mrv.identityEvents.cpfHash` (namespace `cpf_hash`) | identidade primária (PK); a Function gera o hash |
| 1 | `Celular` | `_mrv.identityEvents.phone` (tb. `mobilePhone.number`) | **userNumber** do WhatsApp |
| 2 | `Primeiro_nome` | **PROFILE via identidade → `person.name.firstName`** | `{{1}}` — **não carregado no evento** |
| 3 | `parceiro` | `_mrv.productOffer.partnerName` | `{{2}}` |
| 4 | `Link` | `_mrv.productOffer.offerLink` | `{{4}}` |
| 5 | `Desconto` | `_mrv.productOffer.discountAmount` | `{{3}}` (String, ex.: `60%`) |

> Todas as leaves já existem no schema e no mapper C# — **nenhum leaf novo** (🆕) a criar.
> Telefone → `_mrv.identityEvents.phone` (regra global). CPF → `_mrv.identityEvents.cpfHash`.
> Nome resolvido no PROFILE via `cpfHash` — **não** vai no evento.

## Fórmulas prontas para o AJO
Configurar no nó de **mensagem ativa WhatsApp** (custom action), template `mdc_ofertas_especificas_prd`:

- **userNumber (destinatário):**
  ```
  @event{MRV_FTP_Disp_Oferta_Parc._mrv.identityEvents.phone}
  ```
- **`{{1}}` primeiro nome** — vem do **PROFILE** (não do evento), atributo:
  ```
  person.name.firstName
  ```
- **`{{2}}` parceiro:**
  ```
  @event{MRV_FTP_Disp_Oferta_Parc._mrv.productOffer.partnerName}
  ```
- **`{{3}}` desconto:**
  ```
  @event{MRV_FTP_Disp_Oferta_Parc._mrv.productOffer.discountAmount}
  ```
- **`{{4}}` link:**
  ```
  @event{MRV_FTP_Disp_Oferta_Parc._mrv.productOffer.offerLink}
  ```

> **Lembrete `concat`:** todos os 4 placeholders são **variáveis puras** (o texto fixo "Ei, ", "oferta
> imperdível na ", "até ", " OFF", "Aproveite: " está **dentro do template aprovado na Meta**), então
> **não é preciso concatenar** aqui. Se em algum ajuste um componente passar a misturar texto fixo +
> variável no MESMO campo, usar `concat("texto ", @event{MRV_FTP_Disp_Oferta_Parc._mrv.path})`.

## Gaps / pendências (⚠️) e checklist
- ⚠️ **`Primeiro_nome` fora do evento:** o de-para/mapper C# **não carregam** `Primeiro_nome` no payload
  (fica só no Profile). No AJO, `{{1}}` tem de sair de `person.name.firstName` resolvido via `cpfHash`.
  Confirmar que o Profile tem o firstName populado para o público desta jornada; senão, avaliar carregar
  `Primeiro_nome` no evento (novo leaf) ou definir fallback (ex.: "cliente MRV").
- ⚠️ **Categoria MARKETING:** template `mdc_ofertas_especificas_prd` é **MARKETING** — sujeito a cap de
  frequência / opt-out de marketing na Meta. Confirmar janela/opt-in antes de publicar.
- [ ] Confirmar bot **MariaRosa** e namespace `1161020f_8cf8_31c7_fe76_eecfde18f26f` no ambiente AJO.
- [ ] Ingestão C#: 5 colunas mapeadas (`cpfHash`, `phone`, `partnerName`, `offerLink`, `discountAmount`) —
  **nenhum campo novo** a criar no schema.
- [ ] Sem wait/split/router: publicar como jornada 1-evento / 1-mensagem.

## Complexidade
🟢 **Baixa** — evento único, 1 WhatsApp, sem router/split/wait e todas as leaves já mapeadas; o único
ponto de atenção é o `Primeiro_nome`, que resolve no PROFILE (`person.name.firstName`) por não vir no evento.
