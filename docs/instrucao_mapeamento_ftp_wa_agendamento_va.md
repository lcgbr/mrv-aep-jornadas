# Instrução de mapeamento — "Jornada WhatsApp Agendamento VA" · AJO **evento FTP** (WhatsApp, router por marca)

> Jornada FTP WhatsApp com **1 decision split por `Marca`**: MRV × Sensia → 2 templates diferentes.
> Como o critério testa um **campo do próprio registro** (Marca), no AJO vira uma Condition sobre o
> **payload do evento** (`@event{}`) — publicável direto, sem join/EXISTS.

## Identificação
| | |
|---|---|
| Jornada SFMC | **Jornada WhatsApp Agendamento VA** (`03fb6b61-83e1-452d-aba4-3b654df81ba8`, BU `mrv-assistencia-tecnica`) |
| Entrada | `AutomationAudience` → **FTP file import** |
| `sourceEventType` | `assistenciaTecnicaWhatsappAgendamentoVa` · `eventType = assistenciaTecnica.ftpFileImport` |
| Evento AJO | **`MRV_FTP_Agendamento_VA`** |
| Templates | `mia_agendarvistoria_prd` (MRV) · `vistoria_sensia_prd` (Sensia) |

## Fluxo — router por `Marca`
| Ramo | Critério (`Marca`) | Template WhatsApp |
|---|---|---|
| MRV | `Marca IN ("mrv","MRV")` | `mia_agendarvistoria_prd` |
| Sensia | `Marca IN ("Sensia","sensia","SENSIA")` | `vistoria_sensia_prd` |
| Remainder | (else) | Fim (sem envio) |

## Fluxo AJO equivalente
```
Evento MRV_FTP_Agendamento_VA
  └─ Condition sobre @event{MRV_FTP_Agendamento_VA._mrv.earlyInspectionDetails.brand}
       brand ~ "mrv"     → WhatsApp mia_agendarvistoria_prd
       brand ~ "sensia"  → WhatsApp vistoria_sensia_prd
       else              → Fim
```
- Condição sobre o **evento** (a `Marca` chega no payload) → publicável direto. Normalizar caixa (o SFMC
  testava minúsculo/maiúsculo) — comparar case-insensitive ou normalizar na ingestão.
- Corpo dos templates estático; **userNumber** = `@event{MRV_FTP_Agendamento_VA._mrv.identityEvents.phone}`.

## De-para (CSV → XDM)
| Coluna | XDM |
|---|---|
| `Nome` | `person.name.fullName` |
| `CPF` | `_mrv.identityEvents.cpfHash` (PK) |
| `Telefone` | `_mrv.identityEvents.phone` → userNumber |
| `Marca` | `_mrv.earlyInspectionDetails.brand` → **discriminador do router** |

## Pendências
- [ ] Confirmar valores exatos de `Marca` (normalização de caixa) e que ambos os templates estão aprovados no Meta.
- [ ] Ingestão C#: `Marca` já mapeada (`brand`) — nenhum campo novo.
