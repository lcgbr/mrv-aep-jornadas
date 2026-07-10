# Instrução de mapeamento — "Cobranca - Wedo - SMS" · AJO **evento DCS** (SMS, mensagem pronta)

> Irmã de canal SMS do `JB_Wedo_Email`. A mais simples de todas: **sem router, sem decision split** —
> a Wedo já entrega o **texto completo do SMS** num único campo (`Mensagem`), e a jornada só dispara 1 SMS.
> Atenção ao **eventType**: os eventos Wedo no AJO são **`dcsExternal`** (Data Collection Service /
> streaming), **não** `ftpFileImport` — a família Wedo NÃO usa o mold FTP de CSV das demais jornadas.

## Identificação
| | |
|---|---|
| Jornada SFMC | **Cobranca - Wedo - SMS** (`99cff43c-5dae-46cd-aef6-c7ddeaacfe38`, BU `mrv-cobranca-portal`) |
| Entrada SFMC | `AutomationAudience` → automation **`Cobranca - Wedo - SMS`** (triggered/file) → DE **`Wedo_SMS`** (`AutomationAud-caa34d55…`) |
| `sourceEventType` | `cobrancaCobrancaWedoSms` |
| Evento AJO | **`MRV_FTP_Cobranca_Wedo`** · **`eventType = dcsExternal`** (não ftpFileImport) |
| Canal | **só SMS** (`email: null`); número `Telefone`; short code de saída **`29520`**, `isOptIn=true` |
| Identidade | `CPF` → `cpfHash` (PK) |

## Fluxo SFMC (2 atividades)
```
Entrada (Wedo) → SMSSYNC-1 "Wedo-SMS" (texto = %%Mensagem%%) → WAIT 1min → Fim
```
- **SMS `SMSSYNC-1`** — messageId `MTYwOjYyNTow`, assetId `9970`, `isUsingDEAttributesForPersonalization=true`.
  O corpo do SMS é **inteiramente** o campo **`Mensagem`** da DE (renderizado via AMPscript `%%Mensagem%%`) —
  ou seja, a Wedo **pré-compõe a mensagem final**; a jornada não monta texto, só entrega.
- **Wait 1min** final: retenção antes do Fim — dispensável no AJO.

## Fluxo AJO equivalente
```
Evento MRV_FTP_Cobranca_Wedo (dcsExternal)
  └─ nó SMS  (short code 29520)
       to   = @event{MRV_FTP_Cobranca_Wedo._mrv.identityEvents.phone}   (ou profile.mobilePhone.number)
       texto = @event{MRV_FTP_Cobranca_Wedo._mrv.contractBillingEvent.messageBody}
     → Fim
```
Jornada 1-evento/1-mensagem — **sem splits, sem router, publicável direto** (a condição/pré-requisito de
perfil das jornadas "PF - *" não se aplica aqui). O texto vem pronto do payload do evento.

## Mapeamento de campos (CSV/DCS → XDM — já no de-para/C#)
| Coluna | XDM | Uso no AJO |
|---|---|---|
| `CPF` | `_mrv.identityEvents.cpfHash` | identidade (PK) |
| `Telefone` | `_mrv.identityEvents.phone` | número do canal SMS |
| `Mensagem` | **`_mrv.contractBillingEvent.messageBody`** | **corpo completo do SMS** (texto pronto) |
| `Locale` | `_mrv.ftpFileImport.locale` | metadado |
| `data_criacao` | `_mrv.ftpFileImport.recordCreatedDate` | metadado |

> Como a mensagem chega pronta em `messageBody`, o **nó SMS do AJO não precisa de template com variáveis**:
> basta referenciar `@event{MRV_FTP_Cobranca_Wedo._mrv.contractBillingEvent.messageBody}` como o texto. Confirmar se o SMS de saída da MRV aceita corpo
> livre por evento (é o mesmo modelo do WhatsApp de mensagem ativa, mas via canal SMS nativo).

## Pendências / atenção
- ⚠️ **eventType `dcsExternal`**: a ingestão da família Wedo (este SMS + `JB_Wedo_Email`) é via **DCS/streaming**, não pelo mold FTP-CSV. Confirmar o produtor/endpoint que envia o evento ao AEP (não é o `CsvBlobProcessor`). *(Corrige a nota de eventType da spec `instrucao_mapeamento_ftp_jb_wedo_email.md`, que citou `cobranca.ftpFileImport` — o correto é `dcsExternal`.)*
- [ ] Migrar o asset SMS (assetId 9970) — mas como o texto é 100% `%%Mensagem%%`, no AJO vira só `@event{MRV_FTP_Cobranca_Wedo._mrv.contractBillingEvent.messageBody}` (sem AMPscript).
- [ ] Confirmar o short code `29520` e opt-in no canal SMS do AJO.
- [ ] `data_criacao`/`Locale` são metadados — não afetam o envio.
