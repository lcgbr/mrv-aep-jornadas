# Instrução de mapeamento — "Jornada e-mail Agendamento VA" · AJO **evento FTP** (e-mail, router por status)

> Jornada FTP de **e-mail** com 1 decision split por `status_unidade` → 2 e-mails. Discriminador é campo
> do registro → no AJO, Condition sobre o **payload do evento**.

## Identificação
| | |
|---|---|
| Jornada SFMC | **Jornada e-mail Agendamento VA** (`4436abbc-d27d-4eeb-a5ae-ce74eb0816e7`, BU `mrv-assistencia-tecnica`) |
| Entrada | `AutomationAudience` → **FTP file import** |
| `sourceEventType` | `assistenciaTecnicaEMailAgendamentoVa` · `eventType = assistenciaTecnica.ftpFileImport` |
| Evento AJO | **`MRV_FTP_Email_Agend_VA`** |
| Canal | **só e-mail** |

## Fluxo — router por `status_unidade`
| Ramo | Critério | E-mail |
|---|---|---|
| liberada | `status_unidade = "liberada"` | "Jornada e-mail Agendamento VA_v2" (emailId 64840) |
| não liberada | `status_unidade = "nao_liberada"` | "Email_VA_NaoLiberada" (emailId 72894) |
| Remainder | (else) | Wait 1 dia → Fim |

## Fluxo AJO equivalente
```
Evento MRV_FTP_Email_Agend_VA
  └─ Condition sobre @event{MRV_FTP_Email_Agend_VA._mrv.earlyInspectionDetails.inspectionStatus}
       "liberada"     → Email "Agendamento VA_v2"
       "nao_liberada" → Email "VA NaoLiberada"
       else           → Fim
```
Publicável direto (condição sobre evento). Endereço do canal e-mail = `personalEmail.address` (ou
`@event{MRV_FTP_Email_Agend_VA._mrv.identityEvents.email}` se a régua respeitar o e-mail do arquivo).

## De-para (CSV → XDM)
| Coluna | XDM |
|---|---|
| `nome` | `person.name.fullName` |
| `cpf` | `_mrv.identityEvents.cpfHash` (PK) |
| `e-mail` | `_mrv.identityEvents.email` → canal e-mail |
| `tempo` | `_mrv.earlyInspectionDetails.elapsedTime` |
| `status_unidade` | `_mrv.earlyInspectionDetails.inspectionStatus` → **discriminador do router** |

## Pendências
- [ ] Confirmar valores fechados de `status_unidade` (`liberada`/`nao_liberada`) e o path XDM (`inspectionStatus`).
- [ ] Migrar os 2 assets de e-mail (64840, 72894).
