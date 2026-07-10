# Instrução de mapeamento — "Jornada Whats - Auto-agendamento EC" · AJO **evento FTP** (router por Momento + e-mails)

> Jornada FTP **multicanal**: 1 decision split por `Momento` → **6 templates WhatsApp** (um por momento
> da régua de entrega de chaves) + **3 e-mails** de comunicação. É um **router** (como `JB_Wedo_Email`),
> mas o discriminador é o `Momento` do registro — no AJO, Condition sobre o **payload do evento**.

## Identificação
| | |
|---|---|
| Jornada SFMC | **Jornada Whats - Auto-agendamento EC** (`cf60b9a6-2356-4725-8f6f-e1d31cc5cdc5`, BU `mrv-assistencia-tecnica`) |
| Entrada | `AutomationAudience` → **FTP file import** |
| `sourceEventType` | `assistenciaTecnicaWhatsAutoAgendamentoEc` · `eventType = assistenciaTecnica.ftpFileImport` |
| Evento AJO | **`MRV_FTP_Auto_Agend`** |
| Canais | WhatsApp (6 templates) + e-mail (3) |

## Fluxo — router por `Momento` (EC = Entrega de Chaves)
| Momento (valor) | Template WhatsApp |
|---|---|
| `entregasonhos` | `chaves_momento_prd` |
| `entregaremanescente` | `chaves_datas_prd` |
| `lembreteentrega` | `chaves_agendeagora_prd` |
| `lembretenaoagendou` | `chaves_naoagendou_prd` |
| `entreganaocompareceu` | `chaves_imprevistos_prd` |
| `pendenciatermochaves` | `chaves_termo_prd` |
| (else) | Wait 1 dia → Fim |

E-mails de comunicação EC (paralelos/complementares — conferir posição no canvas): **Comunicação EC #08**
(emailId 76586), **#09** (76587), **#11.2** (76588).

## Fluxo AJO equivalente
```
Evento MRV_FTP_Auto_Agend
  └─ Condition sobre @event{MRV_FTP_Auto_Agend._mrv.ftpFileImport.sendMoment}   (campo Momento)
       "entregasonhos"        → WhatsApp chaves_momento_prd
       "entregaremanescente"  → WhatsApp chaves_datas_prd
       "lembreteentrega"      → WhatsApp chaves_agendeagora_prd
       "lembretenaoagendou"   → WhatsApp chaves_naoagendou_prd
       "entreganaocompareceu" → WhatsApp chaves_imprevistos_prd
       "pendenciatermochaves" → WhatsApp chaves_termo_prd
       else                   → Fim
  (+ e-mails EC #08/#09/#11.2 conforme o ramo/posição)
```
- 1 Condition multi-branch sobre o evento (`Momento`) — publicável direto, sem join.
- Corpo dos templates estático; **userNumber** = `@event{MRV_FTP_Auto_Agend._mrv.identityEvents.phone}`.

## De-para (CSV → XDM)
| Coluna | XDM |
|---|---|
| `Nome` | `person.name.fullName` |
| `CPF` | `_mrv.identityEvents.cpfHash` (PK) |
| `Telefone` | `_mrv.identityEvents.phone` → userNumber (WhatsApp) |
| `Email` | `_mrv.identityEvents.email` → canal e-mail |
| `Momento` | `_mrv.ftpFileImport.sendMoment` → **discriminador do router** |

## Pendências
- [ ] Confirmar o **path XDM exato** do `Momento` (de-para: `sendMoment`) e a lista fechada de valores.
- [ ] Mapear a posição dos **3 e-mails** no canvas (ramo/sequência) — o dump lista os templates mas o wiring e-mail×WhatsApp precisa do canvas.
- [ ] Migrar os 6 templates WhatsApp + 3 assets de e-mail; confirmar aprovação no Meta.
- ⚠️ Maior complexidade WhatsApp da leva (6 templates + multicanal).
